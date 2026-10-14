<?php
/** R07G-23/24 — run with WP-CLI only against disposable wp-env WordPress. */
if ( ! defined( 'ABSPATH' ) || ! class_exists( 'AWB_Library_Importer' ) ) {
    throw new RuntimeException( 'Bridge plugin and WordPress must be loaded.' );
}
$scanner = new AWB_Scanner();
$organizer = new AWB_Page_Code_Organizer( $scanner );
$workbench = new AWB_Workbench( $organizer );
$occurrences = new AWB_Site_Occurrence( $organizer, $scanner, $workbench );
$importer = new AWB_Library_Importer( $workbench, $occurrences );
$folder = __DIR__;
$package = $folder . '/ux07g-page.zip';
$collision = $folder . '/ux07g-collision.zip';
foreach ( array( $package, $collision ) as $file ) {
    if ( ! is_file( $file ) ) throw new RuntimeException( 'Missing demo fixture: ' . $file );
}
$expect = static function ( bool $valid, string $description ): void {
    if ( ! $valid ) throw new RuntimeException( 'R07G WordPress demo failed: ' . $description );
};
$first = $importer->import_zip( $package, 'ux07g-page.zip' );
$expect( ! empty( $first['ok'] ), 'initial import: ' . (string) ( $first['error'] ?? '' ) );
$expect( empty( $first['existing'] ), 'first import was already registered' );
$post_id = (int) ( $first['post_id'] ?? 0 );
$post = get_post( $post_id );
$expect( $post instanceof WP_Post && 'draft' === $post->post_status, 'Workbench must remain draft' );
$expect( count( $first['occurrences'] ?? array() ) === 3, 'three ordered Site Occurrences required' );
$export_id = (string) ( $first['export_id'] ?? '' );
$expect( str_starts_with( $export_id, 'awexp:' ), 'exportId not propagated' );
$expect( get_post_meta( $post_id, AWB_Workbench::META_PROJECT_EXPORT_ID, true ) === $export_id, 'exportId not persisted' );
$occurrence_ids = array_map(
    static fn( $item ) => (string) ( $item['siteOccurrenceId'] ?? '' ),
    $first['occurrences']
);
$expect( count( array_unique( $occurrence_ids ) ) === 3, 'Site Occurrences must be unique' );
$second = $importer->import_zip( $package, 'ux07g-page.zip' );
$expect( ! empty( $second['ok'] ) && ! empty( $second['existing'] ), 'repeat import not idempotent' );
$expect( (int) ( $second['post_id'] ?? 0 ) === $post_id, 'repeat created another Workbench post' );
$repeat_ids = array_map(
    static fn( $item ) => (string) ( $item['siteOccurrenceId'] ?? '' ),
    $second['occurrences'] ?? array()
);
$expect( $repeat_ids === $occurrence_ids, 're-import changed Site Occurrence identities' );
$conflict = $importer->import_zip( $collision, 'ux07g-collision.zip' );
$expect( empty( $conflict['ok'] ) && str_contains( (string) ( $conflict['error'] ?? '' ), 'contenu différent' ),
    'same exportId with different package bytes must be refused' );
$expect( get_post( $post_id )->post_status === 'draft', 'collision mutated the Workbench status' );
$expect( get_post_meta( $post_id, AWB_Workbench::META_PROJECT_EXPORT_ID, true ) === $export_id,
    'collision mutated exportId provenance' );
echo 'R07G_WORDPRESS_WORKBENCH_SUCCESS ' . wp_json_encode( array(
    'postId' => $post_id,
    'exportId' => $export_id,
    'occurrences' => count( $occurrence_ids ),
    'replayIdempotent' => true,
    'collisionRejected' => true,
    'status' => 'draft',
) ) . PHP_EOL;
