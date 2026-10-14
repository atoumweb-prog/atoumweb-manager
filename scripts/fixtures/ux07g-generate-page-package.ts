/** R07G-23/24 — deterministic WordPress DEMO fixture, never touches a client site. */
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { NodeSqliteAdapter } from '../../src/main/database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../../src/main/database/migrations';
import { createWorkspacePaths } from '../../src/main/workspace';
import { ProjectService } from '../../src/main/projects/ProjectService';
import { ProjectSiteService } from '../../src/main/projects/ProjectSiteService';
import { AtoumWebCompositionPackageService } from '../../src/main/referentials/AtoumWebCompositionPackageService';
import { AtoumWebCompositionService } from '../../src/main/referentials/AtoumWebCompositionService';
import { AtoumWebPackageService } from '../../src/main/referentials/AtoumWebPackageService';
import { AtoumWebTechnicalAssetService } from '../../src/main/referentials/AtoumWebTechnicalAssetService';
import { AtoumWebTechnicalLibraryService } from '../../src/main/referentials/AtoumWebTechnicalLibraryService';
import { readZipArchive, writeZipArchive } from '../../src/main/referentials/ZipArchive';

const output = resolve(process.argv[2] || '');
if (!process.argv[2] || !output) throw new Error('Absolute demo fixture destination required');
mkdirSync(output, { recursive: true });
const workspace = createWorkspacePaths(join(output, 'manager-workspace'));
const database = new NodeSqliteAdapter(':memory:');
database.exec('PRAGMA foreign_keys=ON;');
try {
  applyPendingMigrations(database);
  const sites = new ProjectSiteService(database);
  const projects = new ProjectService(database, workspace, sites);
  const library = new AtoumWebTechnicalLibraryService(database);
  const assets = new AtoumWebTechnicalAssetService(database, workspace);
  const packages = new AtoumWebPackageService(database, workspace, library, assets);
  const compositions = new AtoumWebCompositionService(database, library);
  const exporter = new AtoumWebCompositionPackageService(database, workspace, compositions, packages, library);
  const project = projects.createInternal({ name: 'R07G démonstration WordPress isolée' });
  const updated = projects.addProjectNode(project.id, {
    type: 'module', displaySubtype: 'page', name: 'Accueil R07G', semanticKey: 'r07g.wordpress.demo',
  });
  const page = updated.nodes.find(node => node.semanticKey === 'r07g.wordpress.demo');
  if (!page) throw new Error('Synthetic Page could not be created');
  const site = sites.create(project.id, { name: 'Site de démonstration local' });
  sites.linkPage(site.id, page.id, { role: 'home' });
  let composition = compositions.ensureForProjectPage(page.id);
  for (const [i, label] of ['En-tête R07G','Contenu R07G','Pied de page R07G'].entries()) {
    const source = library.create(
      { category: 'section', name: label, reuseStatus: 'ready', tags: ['manager-direct'] },
      { contentType: 'code', language: 'html', contentText: `<section class="r07g-${i}"><h2>${label}</h2></section>` },
    );
    library.markStable(source.currentVersion!.id);
    composition = compositions.addItem(composition.id, { libraryItemId: source.id });
  }
  const result = exporter.exportPagePackage(page.id);
  if (result.componentCount !== 3 || !result.exportId?.startsWith('awexp:')) {
    throw new Error('Expected three source components and awexp identity');
  }
  const destination = join(output, 'ux07g-page.zip');
  copyFileSync(result.path, destination);
  const entries = readZipArchive(destination);
  const entry = entries.find(value => value.name === 'manifest.json');
  if (!entry) throw new Error('Missing manifest');
  const manifest = JSON.parse(entry.data.toString('utf8'));
  if (manifest.exportId !== result.exportId) throw new Error('Export identity mismatch');
  // Same exportId, different package hash: WordPress must reject this collision.
  manifest.composition.name = 'COLLISION — DO NOT IMPORT';
  entry.data = Buffer.from(JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  writeZipArchive(join(output, 'ux07g-collision.zip'), entries);
  writeFileSync(join(output, 'ux07g-meta.json'),
    JSON.stringify({exportId:result.exportId,projectId:project.id,siteId:site.id,pageId:page.id,componentCount:result.componentCount},null,2));
  if (database.all('PRAGMA foreign_key_check').length) throw new Error('Invalid SQLite foreign keys');
  console.log('R07G_DEMO_PACKAGE', JSON.stringify({destination,exportId:result.exportId,components:result.componentCount}));
} finally {
  database.close();
}
