import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths, type WorkspacePaths } from '../workspace';
import { AtoumWebPackageService } from './AtoumWebPackageService';
import { AtoumWebTechnicalAssetService } from './AtoumWebTechnicalAssetService';
import { AtoumWebTechnicalLibraryService } from './AtoumWebTechnicalLibraryService';
import { readZipArchive, writeZipArchive } from './ZipArchive';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let workspace: WorkspacePaths;
let library: AtoumWebTechnicalLibraryService;
let assets: AtoumWebTechnicalAssetService;
let packages: AtoumWebPackageService;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-package-'));
  workspace = createWorkspacePaths(workspaceRoot);
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  library = new AtoumWebTechnicalLibraryService(database);
  assets = new AtoumWebTechnicalAssetService(database, workspace);
  packages = new AtoumWebPackageService(database, workspace, library, assets);
});

afterEach(() => {
  vi.restoreAllMocks();
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('AtoumWebPackageService', () => {
  it('exporte un ZIP portable avec manifest, contenu technique et assets puis le relit', () => {
    const item = library.create(
      {
        category: 'gallery',
        name: 'Galerie dynamique ACF',
        description: 'Galerie générique WordPress',
        tags: ['acf', 'wordpress'],
        reuseStatus: 'ready',
      },
      {
        contentType: 'code',
        language: 'php',
        contentText: '<?php $gallery = get_field($fieldName); ?>',
        notes: 'Version générique',
      },
    );
    const stable = library.markStable(item.currentVersion!.id);

    const capturePath = join(workspaceRoot, 'capture.png');
    const sourcePath = join(workspaceRoot, 'galerie.json');
    writeFileSync(capturePath, 'fake-png', 'utf8');
    writeFileSync(sourcePath, '{"module":"gallery"}', 'utf8');
    assets.importFilePaths(stable.currentVersion!.id, [capturePath], 'screenshot');
    assets.importFilePaths(stable.currentVersion!.id, [sourcePath], 'source');

    const exported = packages.exportItem(stable.id, stable.currentVersion!.id);

    expect(existsSync(exported.path)).toBe(true);
    expect(exported.fileName.endsWith('.zip')).toBe(true);
    expect(exported.assetCount).toBe(2);

    const entries = readZipArchive(exported.path);
    expect(entries.some((entry) => entry.name === 'manifest.json')).toBe(true);
    expect(entries.some((entry) => entry.name.startsWith('technical/source'))).toBe(true);
    expect(entries.filter((entry) => entry.name.startsWith('assets/'))).toHaveLength(2);

    const inspection = packages.inspectPackage(exported.path);
    expect(inspection.item.name).toBe('Galerie dynamique ACF');
    expect(inspection.version.contentText).toContain('get_field');
    expect(inspection.assetCount).toBe(2);
    expect(inspection.missingAssetCount).toBe(0);
    expect(inspection.probableDuplicates.some((candidate) => candidate.itemId === stable.id)).toBe(true);
  });

  it('enrichit une version réutilisable avec un package Bridge Workbench sans casser le paquet Manager', () => {
    const reusablePayload = {
      schemaVersion: 2,
      kind: 'atoumweb-library-reusable-component',
      origin: {
        site: 'atoumweb.fr',
        page: 'Accueil',
        pageUrl: 'https://www.atoumweb.fr/',
        snapshotId: 'awb-snap:test',
        snapshotDate: '2026-09-24T12:00:00Z',
        builderGeneration: '5',
        occurrenceId: 'module-1',
      },
      reusable: {
        html: '<section class="atoum-hero"><h1 data-aw-field-text="text-1">Votre titre personnalisable</h1></section>',
        css: '.atoum-hero{padding:2rem}',
        javascript: '',
        rootClasses: ['atoum-hero'],
        method: 'divi-code',
        instructions: ['Ajouter le composant dans un Workbench.'],
        generalized: true,
        fields: [{ id: 'text-1', label: 'Titre principal', type: 'text', selector: '[data-aw-field-text="text-1"]', originalValue: 'Titre source', defaultValue: 'Votre titre personnalisable' }],
      },
      identity: {
        componentFamilyId: 'awcf:test-feature-bubbles',
        componentKey: 'aw-feature-bubbles',
        libraryVariantId: 'awv:test-florist',
        variantKey: 'florist',
        variantOf: 'aw-feature-bubbles',
        variantMode: 'inherit',
        reusabilityScope: 'vertical',
      },
      dependencies: [{ dependencyId: 'dep-1', type: 'plugin', slug: 'forminator', name: 'Forminator', version: '1.0.0', active: true }],
      assets: [{ assetId: 'asset-1', type: 'image', url: 'https://www.atoumweb.fr/media.jpg', localPath: null, mimeType: 'image/jpeg', hash: 'abc', archiveMode: 'reference_only' }],
      checks: { remoteAssetUrls: [] },
      notes: [],
    };
    const item = library.create(
      { category: 'hero', name: 'Hero réutilisable', reuseStatus: 'ready', vertical: 'Fleuriste', tags: ['bridge', 'bridge-stage-reusable'] },
      { contentType: 'json', language: 'json', contentText: JSON.stringify(reusablePayload), notes: 'Réutilisable' },
    );
    const stable = library.markStable(item.currentVersion!.id);

    const exported = packages.exportItem(stable.id, stable.currentVersion!.id);
    const entries = readZipArchive(exported.path);
    const names = new Set(entries.map((entry) => entry.name));

    expect(names.has('manifest.json')).toBe(true);
    expect(names.has('component/component.html')).toBe(true);
    expect(names.has('component/component.css')).toBe(true);
    expect(names.has('component/fields.json')).toBe(true);
    expect(names.has('component/identity.json')).toBe(true);
    expect(names.has('component/dependencies.json')).toBe(true);
    expect(names.has('component/source-assets.json')).toBe(true);
    expect(names.has('component/provenance.json')).toBe(true);
    expect(names.has('component/component.js')).toBe(false);

    const manifest = JSON.parse(entries.find((entry) => entry.name === 'manifest.json')!.data.toString('utf8'));
    expect(manifest.bridgeWorkbench.contract).toBe('atoumweb_bridge_component_package');
    expect(manifest.bridgeWorkbench.componentPackageContractVersion).toBe(1);
    expect(manifest.bridgeWorkbench.fieldsContractVersion).toBe(1);
    expect(manifest.bridgeWorkbench.identityContractVersion).toBe(1);
    expect(manifest.bridgeWorkbench.flow).toBe('workbench_first');
    expect(manifest.bridgeWorkbench.directProductionInjection).toBe(false);
    expect(manifest.bridgeWorkbench.component.rootClasses).toEqual(['atoum-hero']);

    const fields = JSON.parse(entries.find((entry) => entry.name === 'component/fields.json')!.data.toString('utf8'));
    expect(fields.contract).toBe('atoumweb_component_fields');
    expect(fields.schemaVersion).toBe(1);
    expect(fields.fields).toHaveLength(1);
    expect(fields.fields[0]).toMatchObject({
      id: 'text-1',
      type: 'text',
      label: 'Titre principal',
      default: 'Votre titre personnalisable',
      required: false,
      binding: { type: 'html_text', selector: '[data-aw-field-text="text-1"]' },
      source: { mode: 'auto_detected', confidence: 'high', ambiguous: false },
    });

    const identity = JSON.parse(entries.find((entry) => entry.name === 'component/identity.json')!.data.toString('utf8'));
    expect(identity).toMatchObject({
      contract: 'atoumweb_component_identity',
      schemaVersion: 1,
      classificationStatus: 'classified',
      libraryDisplayName: 'Hero réutilisable',
      componentFamilyId: 'awcf:test-feature-bubbles',
      componentKey: 'aw-feature-bubbles',
      libraryVariantId: 'awv:test-florist',
      variantKey: 'florist',
      variantOf: 'aw-feature-bubbles',
      variantMode: 'inherit',
      vertical: 'fleuriste',
      reusabilityScope: 'vertical',
    });
    expect(manifest.bridgeWorkbench.component.identity).toEqual(identity);

    const dependencies = JSON.parse(entries.find((entry) => entry.name === 'component/dependencies.json')!.data.toString('utf8'));
    expect(dependencies[0].name).toBe('Forminator');

    const inspection = packages.inspectPackage(exported.path);
    expect(inspection.item.name).toBe('Hero réutilisable');
    expect(inspection.item.vertical).toBe('fleuriste');
    expect(inspection.version.contentText).toContain('atoumweb-library-reusable-component');
  });

  it('exporte l’identité famille / variante gérée par le Manager en priorité', () => {
    const reusablePayload = {
      schemaVersion: 2,
      generatorRevision: 2,
      kind: 'atoumweb-library-reusable-component',
      origin: {
        site: 'atoumweb.fr',
        page: 'Accueil',
        pageUrl: 'https://www.atoumweb.fr/',
        snapshotId: 'snapshot:family-test',
        snapshotDate: '2026-09-26T05:00:00Z',
        builderGeneration: '5',
        occurrenceId: 'module-family-test',
      },
      identity: {
        componentFamilyId: 'legacy-family',
        componentKey: 'aw-legacy-family',
        libraryVariantId: 'legacy-variant',
        variantKey: 'legacy',
        variantMode: 'inherit',
        reusabilityScope: 'generic',
      },
      reusable: {
        html: '<section class="family-test"><h2>Variante</h2></section>',
        css: '.family-test{color:#111111}',
        javascript: '',
        rootClasses: ['family-test'],
        method: 'divi-code',
        instructions: [],
        generalized: true,
        fields: [],
      },
      dependencies: [],
      assets: [],
      checks: { remoteAssetUrls: [] },
      notes: [],
    };
    const item = library.create(
      { category: 'section', name: 'Section famille', reuseStatus: 'ready', vertical: 'mariage', tags: ['bridge', 'bridge-human-validated'] },
      { contentType: 'json', language: 'json', contentText: JSON.stringify(reusablePayload), notes: 'Famille gérée' },
    );
    const stable = library.markStable(item.currentVersion!.id);
    const now = '2026-09-26T05:10:00.000Z';
    database.run(
      `INSERT INTO atoumweb_component_families
       (id,component_key,display_name,category,vertical,reusability_scope,base_item_id,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      ['awfam:test', 'aw-section-famille', 'Section famille', 'section', 'mariage', 'vertical', stable.id, now, now],
    );
    database.run(
      `INSERT INTO atoumweb_component_variants
       (id,family_id,technical_item_id,variant_key,display_name,variant_mode,variant_of_id,source_occurrence_return_id,created_at,updated_at)
       VALUES (?,?,?,?,?,'base',NULL,NULL,?,?)`,
      ['awvar:test-base', 'awfam:test', stable.id, 'base', 'Base', now, now],
    );

    const exported = packages.exportItem(stable.id, stable.currentVersion!.id);
    const entries = readZipArchive(exported.path);
    const identity = JSON.parse(entries.find((entry) => entry.name === 'component/identity.json')!.data.toString('utf8'));

    expect(identity).toMatchObject({
      classificationStatus: 'classified',
      componentFamilyId: 'awfam:test',
      componentKey: 'aw-section-famille',
      libraryVariantId: 'awvar:test-base',
      variantKey: 'base',
      variantMode: 'base',
      vertical: 'mariage',
      reusabilityScope: 'vertical',
    });
    expect(identity.componentFamilyId).not.toBe('legacy-family');
  });

  it('importe un paquet comme nouvel item sans exécuter ni modifier le composant source', () => {
    const source = library.create(
      { category: 'header', name: 'Header source', reuseStatus: 'reference' },
      { contentType: 'code', language: 'html', contentText: '<header>source</header>' },
    );
    const exported = packages.exportItem(source.id);

    const imported = packages.importPackage({
      packagePath: exported.path,
      mode: 'new_item',
      itemOverrides: {
        name: 'Header importé',
        reuseStatus: 'adapt',
      },
      markStable: true,
    });

    expect(imported.importedAs).toBe('new_item');
    expect(imported.item.id).not.toBe(source.id);
    expect(imported.item.name).toBe('Header importé');
    expect(imported.item.reuseStatus).toBe('adapt');
    expect(imported.item.currentVersion?.contentText).toBe('<header>source</header>');
    expect(imported.item.stableVersion?.id).toBe(imported.item.currentVersion?.id);
    expect(library.get(source.id).currentVersion?.contentText).toBe('<header>source</header>');
  });

  it('peut importer un paquet comme nouvelle version d’un composant existant', () => {
    const exportedSource = library.create(
      { category: 'css', name: 'Bouton externe', reuseStatus: 'ready' },
      { contentType: 'code', language: 'css', contentText: '.button { padding: 12px; }' },
    );
    const exported = packages.exportItem(exportedSource.id);

    const target = library.create(
      { category: 'css', name: 'Bouton AtoumWeb', reuseStatus: 'ready' },
      { contentType: 'code', language: 'css', contentText: '.button { padding: 8px; }' },
    );

    const imported = packages.importPackage({
      packagePath: exported.path,
      mode: 'new_version',
      targetItemId: target.id,
    });

    expect(imported.importedAs).toBe('new_version');
    expect(imported.item.id).toBe(target.id);
    expect(imported.item.versionCount).toBe(2);
    expect(imported.item.currentVersion?.contentText).toContain('12px');
  });

  it('refuse les chemins ZIP dangereux lors de la création', () => {
    const destination = join(workspaceRoot, 'danger.zip');
    expect(() => writeZipArchive(destination, [
      { name: '../escape.txt', data: Buffer.from('danger', 'utf8') },
    ])).toThrow(/Chemin ZIP dangereux/i);
  });

  it('refuse une archive dont le CRC a été altéré', () => {
    const destination = join(workspaceRoot, 'crc.zip');
    writeZipArchive(destination, [{ name: 'test.txt', data: Buffer.from('contenu', 'utf8') }]);
    const bytes = readFileSync(destination);
    const marker = Buffer.from('contenu', 'utf8');
    const offset = bytes.indexOf(marker);
    expect(offset).toBeGreaterThanOrEqual(0);
    bytes[offset] ^= 0xff;
    writeFileSync(destination, bytes);

    expect(() => readZipArchive(destination)).toThrow(/CRC invalide/i);
  });
});

describe('Contrats V1 du package : validation et cohérence', () => {
  // Real export, then a semantically altered archive with valid hashes/CRC.
  function fixture() {
    const item = library.create(
      { category: 'hero', name: 'Test V1', reuseStatus: 'adapt' },
      { contentType: 'json', language: 'json', contentText: JSON.stringify({
        kind: 'atoumweb-library-reusable-component', schemaVersion: 2,
        origin: { page: 'Accueil', occurrenceId: 'node-1' },
        reusable: { html: '<img data-aw-field-image="image-1">', css: '', javascript: '',
          rootClasses: [], generalized: true, fields: [] },
      }) },
    );
    const exported = packages.exportItem(item.id);
    const entries = readZipArchive(exported.path);
    const manifest = JSON.parse(entries.find(entry => entry.name === 'manifest.json')!.data.toString('utf8'));
    function json(path: string, value: unknown) {
      const entry = entries.find(entry => entry.name === path)!;
      entry.data = Buffer.from(JSON.stringify(value));
      return createHash('sha256').update(entry.data).digest('hex');
    }
    return { manifest, entries, json, save() {
      json('manifest.json', manifest);
      const path = join(workspaceRoot, 'modified.zip');
      writeZipArchive(path, entries);
      return path;
    } };
  }

  it('accepte des identités équivalentes dont les propriétés sont réordonnées', () => {
    const f = fixture();
    const reordered = Object.fromEntries(Object.entries(f.manifest.bridgeWorkbench.component.identity).reverse());
    f.manifest.bridgeWorkbench.files.identity.sha256 = f.json('component/identity.json', reordered);
    expect(() => packages.inspectPackage(f.save())).not.toThrow();
  });
  it('refuse des identités valides mais différentes', () => {
    const f = fixture();
    const identity = { ...f.manifest.bridgeWorkbench.component.identity, libraryItemId: 'other-item' };
    f.manifest.bridgeWorkbench.files.identity.sha256 = f.json('component/identity.json', identity);
    expect(() => packages.inspectPackage(f.save())).toThrow(/identité déclarée/);
  });
  it.each([null, '', 'incorrect'])('refuse classified avec componentKey=%s', (componentKey) => {
    const f = fixture();
    const identity = { ...f.manifest.bridgeWorkbench.component.identity, classificationStatus: 'classified',
      reusabilityScope: 'generic', componentKey };
    f.manifest.bridgeWorkbench.component.identity = identity;
    f.manifest.bridgeWorkbench.files.identity.sha256 = f.json('component/identity.json', identity);
    expect(() => packages.inspectPackage(f.save())).toThrow(/identity.json invalide/);
  });
  it.each([
    { type: 'html_text' }, { type: 'html_html', selector: '' },
    { type: 'html_attribute', selector: 'img' }, { type: 'css_variable', name: 'color' },
    { type: 'css_url' }, { type: 'unresolved' },
  ])('refuse un binding incomplet ou invalide : %j', (binding) => {
    const f = fixture();
    f.manifest.bridgeWorkbench.files.fields.sha256 = f.json('component/fields.json', {
      contract: 'atoumweb_component_fields', schemaVersion: 1,
      fields: [{ id: 'image-1', type: 'image', label: 'Image', default: null, required: false,
        binding, source: { mode: 'declared' } }],
    });
    expect(() => packages.inspectPackage(f.save())).toThrow(/fields.json invalide/);
  });
  it.each(['component', 'provenance', 'provenance-file', 'version'])('refuse une divergence dans %s', (section) => {
    const f = fixture();
    const bridge = f.manifest.bridgeWorkbench;
    if (section === 'component') bridge.component.libraryVersionId = 'other-version';
    if (section === 'provenance') bridge.provenance.libraryItemId = 'other-item';
    if (section === 'provenance-file') {
      bridge.files.provenance.sha256 = f.json('component/provenance.json', { ...bridge.provenance, libraryVersionNumber: 99 });
    }
    if (section === 'version') f.manifest.version.exportedVersionNumber = 99;
    expect(() => packages.inspectPackage(f.save())).toThrow(/[Ii]dentifiant incohérent|version incohérent/);
  });
  it('refuse un fichier HTML obligatoire non déclaré', () => {
    const f = fixture();
    delete f.manifest.bridgeWorkbench.files.html;
    expect(() => packages.inspectPackage(f.save())).toThrow(/obligatoire/);
  });
});

describe('Lot 2 — transport des assets et imports annulables', () => {
  const bytes = Buffer.from('image-lot-2');
  const hash = createHash('sha256').update(bytes).digest('hex');
  function createSource(references: unknown[] = [], snapshotId: string | null = null) {
    return library.create({ category: 'hero', name: 'Transport assets', reuseStatus: 'adapt' }, {
      contentType: 'json', language: 'json', contentText: JSON.stringify({
        schemaVersion: 2, kind: 'atoumweb-library-reusable-component',
        origin: { page: 'Accueil', occurrenceId: 'node-1', snapshotId },
        reusable: { html: '<img src="https://example.test/image.png">', css: '', javascript: '',
          rootClasses: [], generalized: true, fields: [] }, assets: references,
      }),
    });
  }
  function attach(item: ReturnType<typeof createSource>, name: string, content: Buffer) {
    const path = join(workspaceRoot, name);
    writeFileSync(path, content);
    return assets.importFilePaths(item.currentVersion!.id, [path], 'source');
  }
  function seedVault() {
    database.run("INSERT INTO bridge_sites (id,name,source_instance_id,source_site_key,created_at,updated_at) VALUES ('site','Site','instance','key','now','now')");
    database.run(
      "INSERT INTO bridge_snapshots (id,site_id,external_snapshot_id,package_fingerprint,generated_at,imported_at,snapshot_type,scan_status,bridge_version,schema_version,fingerprint_profile,issues_json,coverage_json,scanner_capabilities_json,observed_content_json,security_json,environment_json) VALUES ('snapshot','site','external-snapshot','fingerprint','now','now','full','complete','0.6','1','sha256','[]','{}','{}','{}','{}','{}')",
    );
    database.run("INSERT INTO bridge_assets (snapshot_id,asset_id,type,url,archive_mode,object_ref,raw_json) VALUES ('snapshot','image-1','image','https://example.test/image.png','embedded',?,'{}')", ['sha256:' + hash]);
    database.run("INSERT INTO bridge_objects (object_ref,relative_path,byte_length,first_seen_at) VALUES (?,?,?,'now')",
      ['sha256:' + hash, 'unused-untrusted-path', bytes.length]);
    const directory = join(workspace.bridgeDirectory, 'objects', 'sha256', hash.slice(0, 2));
    mkdirSync(directory, { recursive: true });
    const path = join(directory, hash);
    writeFileSync(path, bytes);
    return path;
  }
  function state() {
    return Object.fromEntries(['technical_items', 'technical_item_versions', 'atoumweb_technical_assets', 'search_documents', 'activity_log']
      .map(table => [table, database.all('SELECT * FROM ' + table + ' ORDER BY rowid')]));
  }

  it('relie deux références à un seul fichier attaché, avec son empreinte vérifiée', () => {
    const references = ['image-1', 'image-2'].map(assetId => ({ assetId, hash: 'sha256:' + hash, url: 'https://example.test/image.png' }));
    const item = createSource(references);
    attach(item, 'image.png', bytes);
    const exported = packages.exportItem(item.id);
    const inspected = packages.inspectPackage(exported.path);
    expect(inspected.assetTransport.complete).toBe(true);
    expect(inspected.assetTransport.references).toHaveLength(2);
    expect(new Set(inspected.assetTransport.references.map(ref => ref.archivePath)).size).toBe(1);
    const files = readZipArchive(exported.path).filter(entry => entry.name.startsWith('assets/'));
    expect(files).toHaveLength(1);
    expect(createHash('sha256').update(files[0].data).digest('hex')).toBe(hash);
    expect(inspected.assetTransport.references[0]).toMatchObject({ assetId: 'image-1', checksumSha256: hash, archivePath: files[0].name, status: 'embedded' });
    const imported = packages.importPackage({ packagePath: exported.path, mode: 'new_item' });
    expect(imported.importedAssetCount).toBe(1);
    expect(assets.list(imported.item.currentVersion!.id)).toHaveLength(1);
  });

  it('exporte depuis le coffre sans recopier la source et conserve le lien après import', () => {
    const vaultPath = seedVault();
    const item = createSource([{ assetId: 'image-1', hash: null, url: 'https://example.test/image.png', archiveMode: 'embedded' }], 'external-snapshot');
    const original = item.currentVersion!.contentText;
    const exported = packages.exportItem(item.id);
    expect(exported.assetTransport.complete).toBe(true);
    expect(assets.list(item.currentVersion!.id)).toEqual([]);
    expect(library.get(item.id).currentVersion!.contentText).toBe(original);
    expect(readFileSync(vaultPath)).toEqual(bytes);
    const entries = readZipArchive(exported.path);
    const source = JSON.parse(entries.find(entry => entry.name === 'technical/source.json')!.data.toString('utf8'));
    expect(source.assets[0].hash).toBe('sha256:' + hash);
    const imported = packages.importPackage({ packagePath: exported.path, mode: 'new_item' });
    database.run('DELETE FROM bridge_objects'); // Simulate a receiving Manager without the source vault registry.
    const reexported = packages.exportItem(imported.item.id);
    expect(reexported.assetTransport.complete).toBe(true);
    expect(reexported.assetTransport.references[0].checksumSha256).toBe(hash);
  });

  it('signale une copie référencée absente et refuse son import avant écriture', () => {
    const item = createSource([{ assetId: 'missing', hash, localPath: '/uploads/absent.png', archiveMode: 'embedded' }]);
    const exported = packages.exportItem(item.id);
    expect(exported.assetTransport.complete).toBe(false);
    expect(packages.inspectPackage(exported.path).assetTransport.references[0].status).toBe('missing');
    const before = state();
    expect(() => packages.importPackage({ packagePath: exported.path, mode: 'new_item' })).toThrow(/Import incomplet refusé/);
    expect(state()).toEqual(before);
  });

  it('conserve une référence externe non transportée au lieu de la masquer', () => {
    const ref = { assetId: 'remote', url: 'https://example.test/remote.png', hash: null, archiveMode: 'reference_only' };
    const item = createSource([ref]);
    const exported = packages.exportItem(item.id);
    expect(exported.assetTransport.references[0]).toMatchObject({ assetId: 'remote', url: ref.url, status: 'external', archivePath: null });
    const source = JSON.parse(readZipArchive(exported.path).find(entry => entry.name === 'component/source-assets.json')!.data.toString('utf8'));
    expect(source).toEqual([ref]);
    expect(() => packages.importPackage({ packagePath: exported.path, mode: 'new_item', markStable: true })).toThrow(/non transportée/);
  });

  it('ne lit jamais un localPath arbitraire fourni dans la référence', () => {
    const path = join(workspaceRoot, 'unrelated.txt');
    writeFileSync(path, 'do-not-export');
    const item = createSource([{ assetId: 'unsafe-local-path', localPath: path, hash: null }]);
    const exported = packages.exportItem(item.id);
    expect(exported.assetTransport.complete).toBe(false);
    expect(readZipArchive(exported.path).filter(entry => entry.name.startsWith('assets/'))).toHaveLength(0);
  });

  it('conserve missing dans le manifest pour un fichier attaché disparu', () => {
    const item = createSource();
    const [file] = attach(item, 'removed.png', bytes);
    rmSync(assets.absolutePath(file));
    const exported = packages.exportItem(item.id);
    const inspected = packages.inspectPackage(exported.path);
    expect(inspected.missingAssetCount).toBe(1);
    expect(inspected.assetTransport.complete).toBe(false);
    expect(() => packages.importPackage({ packagePath: exported.path, mode: 'new_item' })).toThrow(/manquant/);
  });

  it('refuse des octets du coffre qui ne correspondent plus à leur empreinte', () => {
    const path = seedVault();
    const item = createSource([{ assetId: 'image-1', hash: null }], 'external-snapshot');
    writeFileSync(path, 'corrupt');
    expect(() => packages.exportItem(item.id)).toThrow(/coffre altéré/);
  });

  it.each(['new_item', 'new_version'] as const)('annule %s après copie et permet une nouvelle tentative déterministe', mode => {
    const source = createSource();
    attach(source, 'first.png', bytes);
    attach(source, 'second.png', Buffer.from('second-image'));
    const target = createSource();
    library.markStable(target.currentVersion!.id);
    const exported = packages.exportItem(source.id);
    const input = { packagePath: exported.path, mode, targetItemId: target.id, markStable: true };
    const before = state();
    const original = assets.importFilePaths.bind(assets);
    const copied: string[] = [];
    let calls = 0;
    const spy = vi.spyOn(assets, 'importFilePaths').mockImplementation((versionId, paths, role, createdFiles) => {
      const result = original(versionId, paths, role, createdFiles);
      copied.push(...(createdFiles ?? []));
      if (++calls === 2) throw new Error('simulated copy failure');
      return result;
    });
    expect(() => packages.importPackage(input)).toThrow(/simulated copy failure/);
    expect(state()).toEqual(before);
    expect(copied.length).toBeGreaterThan(0);
    expect(copied.every(path => !existsSync(path))).toBe(true);
    spy.mockRestore();
    const retried = packages.importPackage(input);
    expect(retried.importedAssetCount).toBe(2);
    expect(retried.item.currentVersion!.versionNumber).toBe(mode === 'new_item' ? 1 : 2);
    expect(retried.item.versionCount).toBe(mode === 'new_item' ? 1 : 2);
    expect(retried.item.stableVersion!.id).toBe(retried.item.currentVersion!.id);
    expect(assets.list(retried.item.currentVersion!.id).every(file => !file.missing)).toBe(true);
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('annule aussi si un import de fichier retourne sans avoir créé le fichier attendu', () => {
    const source = createSource();
    attach(source, 'image.png', bytes);
    const exported = packages.exportItem(source.id);
    const before = state();
    const spy = vi.spyOn(assets, 'importFilePaths').mockReturnValue([]);
    expect(() => packages.importPackage({ packagePath: exported.path, mode: 'new_item' })).toThrow(/non confirmé/);
    spy.mockRestore();
    expect(state()).toEqual(before);
  });
});
