import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, relative } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations, MIGRATIONS } from '../database/migrations';
import { ProjectResourceService } from '../projects/ProjectResourceService';
import { ProjectService } from '../projects/ProjectService';
import { ProjectTechnicalLibraryService } from '../projects/ProjectTechnicalLibraryService';
import { createWorkspacePaths, type WorkspacePaths } from '../workspace';
import { AtoumWebTechnicalAssetService } from './AtoumWebTechnicalAssetService';
import { AtoumWebTechnicalLibraryService } from './AtoumWebTechnicalLibraryService';
import { ReusePreparationService } from './ReusePreparationService';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let workspace: WorkspacePaths;
let projects: ProjectService;
let resources: ProjectResourceService;
let projectLibrary: ProjectTechnicalLibraryService;
let globalLibrary: AtoumWebTechnicalLibraryService;
let globalAssets: AtoumWebTechnicalAssetService;
let reuse: ReusePreparationService;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-assisted-reuse-'));
  workspace = createWorkspacePaths(workspaceRoot);
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  projects = new ProjectService(database, workspace);
  resources = new ProjectResourceService(database, workspace);
  projectLibrary = new ProjectTechnicalLibraryService(database);
  globalLibrary = new AtoumWebTechnicalLibraryService(database);
  globalAssets = new AtoumWebTechnicalAssetService(database, workspace);
  reuse = new ReusePreparationService(database, workspace, globalLibrary, globalAssets);
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('ReusePreparationService', () => {
  it('préserve la version Projet sélectionnée et sa source lors de la création humaine d’un code_snippet adapté', () => {
    const project=projects.createInternal({name:'TEST réemploi sélectif'});
    const original=projectLibrary.create(project.id,{name:'Snippet client',category:'php'},
      {contentType:'code',language:'php',contentText:'<?php echo "CLIENT";'});
    const versionId=original.currentVersion!.id;
    projectLibrary.markStable(versionId);
    projectLibrary.createVersion(original.id,{contentType:'code',language:'php',contentText:'<?php echo "CLIENT V2";'});
    const before=projectLibrary.get(original.id);
    const preparation=reuse.prepareProjectItem({itemId:original.id,versionId,adaptationNotes:'Adapter le texte client.'});
    expect(preparation.versionNumber).toBe(1);
    expect(globalLibrary.list()).toHaveLength(0);
    expect(readFileSync(preparation.contentPath!,'utf8')).toContain('CLIENT');
    writeFileSync(preparation.contentPath!,'<?php echo $label;', 'utf8');
    expect(projectLibrary.get(original.id)).toEqual(before);
    const created=reuse.createGlobal({preparation,item:{name:'Snippet configurable',category:'code_snippet',reuseStatus:'adapt'},
      version:{contentType:'code',language:'php',contentText:'<?php echo $label;',notes:'Adaptation humaine'} });
    expect(created).toMatchObject({category:'code_snippet',reuseStatus:'adapt',originTechnicalItemId:original.id});
    expect(created.currentVersion!.contentText).toBe('<?php echo $label;');
    expect(projectLibrary.get(original.id)).toEqual(before);
    expect(database.all('SELECT id FROM schema_migrations ORDER BY id').map(r=>r.id)).toEqual(MIGRATIONS.map(m=>m.id));
    expect(database.all('PRAGMA foreign_key_check')).toEqual([]);
    expect(database.get('PRAGMA integrity_check')?.integrity_check).toBe('ok');
  });

  it('prépare le cas Cazor en paquet indépendant puis crée volontairement une Galerie dynamique ACF', () => {
    const project = projects.createInternal({ name: 'Cazor Auto Passion', projectType: 'site-vitrine' });
    const sourceItem = projectLibrary.create(
      project.id,
      {
        category: 'php',
        name: 'Galerie véhicules Cazor',
        description: 'Galerie spécifique aux véhicules Cazor',
        tags: ['cazor', 'acf', 'galerie'],
      },
      {
        contentType: 'code',
        language: 'php',
        contentText: '<?php $gallery = get_field("galerie_cazor"); echo "#d4af37";',
        notes: 'Version client avec champ et couleur Cazor',
      },
    );
    projectLibrary.markStable(sourceItem.currentVersion!.id);

    const sourceFile = join(workspaceRoot, 'export-divi-cazor.json');
    writeFileSync(sourceFile, '{"module":"gallery","client":"cazor"}', 'utf8');
    const resource = resources.importFilePaths(project.id, [sourceFile], 'technical')[0];
    projectLibrary.linkResource(sourceItem.currentVersion!.id, resource.id);

    const preparation = reuse.prepareProjectItem({
      itemId: sourceItem.id,
      versionId: sourceItem.currentVersion!.id,
      adaptationNotes: 'Remplacer galerie_cazor par un champ configurable et retirer la couleur Cazor.',
    });

    expect(preparation.packageDirectory).toContain(join('exports', 'reutilisation'));
    expect(preparation.packageDirectory).not.toContain('projets-internes');
    expect(existsSync(preparation.manifestPath)).toBe(true);
    expect(existsSync(preparation.adaptationNotesPath)).toBe(true);
    expect(preparation.contentPath && existsSync(preparation.contentPath)).toBe(true);
    expect(preparation.copiedFiles).toHaveLength(1);
    expect(preparation.copiedFiles[0].copied).toBe(true);
    expect(preparation.copiedFiles[0].packageRelativePath).toContain('sources');

    const manifest = JSON.parse(readFileSync(preparation.manifestPath, 'utf8')) as {
      safety: {
        automaticGeneralization: boolean;
        automaticGlobalLibraryCreation: boolean;
        automaticCodeExecution: boolean;
        sourceProjectModified: boolean;
      };
      technicalItem: { name: string };
      adaptation: { initialNotes: string | null };
    };
    expect(manifest.technicalItem.name).toBe('Galerie véhicules Cazor');
    expect(manifest.safety.automaticGeneralization).toBe(false);
    expect(manifest.safety.automaticGlobalLibraryCreation).toBe(false);
    expect(manifest.safety.automaticCodeExecution).toBe(false);
    expect(manifest.safety.sourceProjectModified).toBe(false);
    expect(manifest.adaptation.initialNotes).toContain('champ configurable');

    const globalCountBefore = database.get<{ total: number }>(
      "SELECT COUNT(*) AS total FROM technical_items WHERE scope='atoumweb'",
    );
    expect(Number(globalCountBefore?.total ?? 0)).toBe(0);

    const created = reuse.createGlobal({
      preparation,
      item: {
        category: 'gallery',
        name: 'Galerie dynamique ACF',
        description: 'Galerie générique configurable par champ ACF',
        tags: ['acf', 'galerie', 'wordpress'],
        reuseStatus: 'ready',
      },
      version: {
        contentType: 'code',
        language: 'php',
        contentText: '<?php $gallery = get_field($field_name); ?>',
        notes: 'Version généralisée après adaptation manuelle du cas Cazor',
      },
    });

    expect(created.originTechnicalItemId).toBe(sourceItem.id);
    expect(created.name).toBe('Galerie dynamique ACF');
    expect(created.currentVersion?.contentText).toContain('$field_name');
    expect(globalAssets.list(created.currentVersion!.id).length).toBeGreaterThanOrEqual(3);

    const sourceAfter = projectLibrary.get(sourceItem.id);
    expect(sourceAfter.currentVersion?.contentText).toContain('galerie_cazor');
    expect(sourceAfter.versions).toHaveLength(1);
  });

  it('utilise la version stable par défaut et signale une ressource projet manquante sans bloquer le paquet', () => {
    const project = projects.createInternal({ name: 'Projet test réutilisation' });
    const item = projectLibrary.create(
      project.id,
      { category: 'css', name: 'Hero client' },
      { contentType: 'code', language: 'css', contentText: '.hero { color: gold; }' },
    );
    const stabilized = projectLibrary.markStable(item.currentVersion!.id);
    const stableVersion = stabilized.stableVersion!;
    const changed = projectLibrary.createVersion(item.id, {
      contentType: 'code',
      language: 'css',
      contentText: '.hero { color: navy; }',
    });

    const sourceFile = join(workspaceRoot, 'capture-hero.png');
    writeFileSync(sourceFile, 'fake-image', 'utf8');
    const resource = resources.importFilePaths(project.id, [sourceFile], 'media')[0];
    projectLibrary.linkResource(stableVersion.id, resource.id);
    rmSync(resources.absolutePath(resource), { force: true });

    const preparation = reuse.prepareProjectItem({ itemId: item.id });

    expect(preparation.versionNumber).toBe(1);
    expect(preparation.versionId).toBe(stableVersion.id);
    expect(preparation.versionId).not.toBe(changed.currentVersion!.id);
    expect(preparation.copiedFiles[0].missing).toBe(true);
    expect(preparation.copiedFiles[0].copied).toBe(false);
    expect(existsSync(preparation.manifestPath)).toBe(true);
  });

  it('R07G-20 : refuse une ressource client falsifiée vers un fichier extérieur sans la copier', () => {
    const project = projects.createInternal({ name: 'Projet client sécurisé' });
    const item = projectLibrary.create(project.id,
      { category: 'php', name: 'Source client' },
      { contentType: 'code', language: 'php', contentText: '<?php echo "stable";' });
    const initialFile = join(workspaceRoot, 'source-legitime.txt');
    writeFileSync(initialFile, 'Fichier interne', 'utf8');
    const asset = resources.importFilePaths(project.id, [initialFile], 'technical')[0];
    projectLibrary.linkResource(item.currentVersion!.id, asset.id);
    const sourceBefore = projectLibrary.get(item.id);
    const outside = mkdtempSync(join(tmpdir(), 'atoumweb-reuse-outside-'));
    try {
      const external = join(outside, 'privé-client.txt');
      writeFileSync(external, 'NE JAMAIS EXPORTER', 'utf8');
      database.run('UPDATE file_assets SET relative_path=? WHERE id=?', [
        relative(workspaceRoot, external), asset.id,
      ]);
      const packagesDirectory = join(workspace.exportsDirectory, 'reutilisation');
      expect(() => reuse.prepareProjectItem({ itemId: item.id })).toThrow(/hors de l’espace de travail/);
      expect(existsSync(packagesDirectory) ? readdirSync(packagesDirectory) : []).toHaveLength(0);
      expect(projectLibrary.get(item.id)).toEqual(sourceBefore);
      expect(readFileSync(external, 'utf8')).toBe('NE JAMAIS EXPORTER');
      expect(globalLibrary.list()).toHaveLength(0);
      expect(database.all('PRAGMA foreign_key_check')).toHaveLength(0);
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it('retire un paquet incomplet si le journal de préparation échoue', () => {
    const project = projects.createInternal({ name: 'Projet test' });
    const item = projectLibrary.create(project.id, { category: 'note', name: 'Source' },
      { contentType: 'text', contentText: 'Source préservée' });
    const before = projectLibrary.get(item.id);
    const originalRun = database.run.bind(database);
    database.run = ((sql: string, params: Parameters<typeof database.run>[1] = []) => {
      if (sql.includes('INSERT INTO activity_log') && params?.[1] === 'technical_reuse_package_prepared') {
        throw new Error('PREPARATION_LOG_FAILURE');
      }
      return originalRun(sql, params);
    }) as typeof database.run;
    const directory = join(workspace.exportsDirectory, 'reutilisation');
    expect(() => reuse.prepareProjectItem({ itemId: item.id })).toThrow('PREPARATION_LOG_FAILURE');
    expect(existsSync(directory) ? readdirSync(directory) : []).toHaveLength(0);
    expect(projectLibrary.get(item.id)).toEqual(before);
    expect(globalLibrary.list()).toHaveLength(0);
  });

  it('R07G-20 : une panne du journal annule la promotion et les fichiers sans altérer le Projet source', () => {
    const project = projects.createInternal({ name: 'Projet origine humaine' });
    const source = projectLibrary.create(
      project.id,
      { category: 'php', name: 'Snippet Client', tags: ['source-client'] },
      { contentType: 'code', language: 'php', contentText: '<?php echo "CLIENT";' },
    );
    const sourceFile = join(workspaceRoot, 'client-source.json');
    writeFileSync(sourceFile, '{"clientOnly":true}', 'utf8');
    const asset = resources.importFilePaths(project.id, [sourceFile], 'technical')[0];
    projectLibrary.linkResource(source.currentVersion!.id, asset.id);
    const before = projectLibrary.get(source.id);
    const preparation = reuse.prepareProjectItem({ itemId: source.id, adaptationNotes: 'Retirer les informations client' });
    const globalRoot = workspace.atoumWebLibraryDirectory;
    const actualFiles = () => existsSync(globalRoot)
      ? readdirSync(globalRoot, { recursive: true }).filter((entry) =>
          statSync(join(globalRoot, String(entry))).isFile())
      : [];
    const beforeFiles = actualFiles();

    database.exec(
      "CREATE TRIGGER ux07g_abort_global_promotion BEFORE INSERT ON activity_log " +
      "WHEN NEW.action='technical_reuse_promoted_to_global' " +
      "BEGIN SELECT RAISE(ABORT, 'UX07G_PROMOTION_REJECTED'); END;",
    );
    expect(() => reuse.createGlobal({
      preparation,
      item: { category: 'code_snippet', name: 'Snippet configurable', reuseStatus: 'adapt' },
      version: { contentType: 'code', language: 'php', contentText: '<?php echo $label;' },
    })).toThrow('UX07G_PROMOTION_REJECTED');

    expect(globalLibrary.list()).toHaveLength(0);
    expect(database.all('SELECT id FROM atoumweb_technical_assets')).toHaveLength(0);
    expect(actualFiles()).toEqual(beforeFiles);
    expect(projectLibrary.get(source.id)).toEqual(before);
    expect(existsSync(preparation.manifestPath)).toBe(true);
    expect(existsSync(preparation.copiedFiles[0].packageRelativePath
      ? join(preparation.packageDirectory, preparation.copiedFiles[0].packageRelativePath!)
      : '')).toBe(true);
    expect(database.all('PRAGMA foreign_key_check')).toHaveLength(0);
    expect(database.get<{ integrity_check: string }>('PRAGMA integrity_check')?.integrity_check).toBe('ok');
  });

  it('R07E-15 / R07G-20 : refuse un dossier sources substitué par un lien vers des fichiers privés', () => {
    const project = projects.createInternal({ name: 'Projet réutilisation isolée' });
    const item = projectLibrary.create(
      project.id,
      { category: 'note', name: 'Source avec pièce jointe' },
      { contentType: 'text', contentText: 'Source légitime' },
    );
    const sourceFile = join(workspaceRoot, 'piece-publiable.txt');
    writeFileSync(sourceFile, 'PIECE LEGITIME', 'utf8');
    const asset = resources.importFilePaths(project.id, [sourceFile], 'technical')[0];
    projectLibrary.linkResource(item.currentVersion!.id, asset.id);
    const before = projectLibrary.get(item.id);
    const preparation = reuse.prepareProjectItem({ itemId: item.id });
    expect(preparation.copiedFiles).toHaveLength(1);
    expect(preparation.copiedFiles[0].copied).toBe(true);

    const sourcesDirectory = join(preparation.packageDirectory, 'sources');
    const outside = mkdtempSync(join(tmpdir(), 'atoumweb-private-reuse-'));
    try {
      // Junctions work on Windows runners without requesting symlink privileges.
      // The declared copiedFiles path remains unchanged and lexically valid.
      writeFileSync(join(outside, basename(preparation.copiedFiles[0].packageRelativePath!)),
        'SECRET CLIENT A NE PAS COPIER', 'utf8');
      rmSync(sourcesDirectory, { recursive: true, force: true });
      symlinkSync(outside, sourcesDirectory, 'junction');

      expect(() => reuse.createGlobal({
        preparation,
        item: { category: 'note', name: 'Note généralisée', reuseStatus: 'adapt' },
        version: { contentType: 'text', contentText: 'Texte adapté sans client' },
      })).toThrow(/en dehors du dossier de réutilisation autorisé/);
      expect(globalLibrary.list()).toHaveLength(0);
      expect(database.all('SELECT id FROM atoumweb_technical_assets')).toHaveLength(0);
      expect(projectLibrary.get(item.id)).toEqual(before);
      expect(database.get('PRAGMA integrity_check')?.integrity_check).toBe('ok');
      expect(database.all('PRAGMA foreign_key_check')).toHaveLength(0);
    } finally {
      rmSync(sourcesDirectory, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it('refuse les chemins de paquet ou fichiers préparés hors exports/reutilisation', () => {
    expect(() => reuse.assertPackagePath(workspace.clientsDirectory)).toThrow(/paquet de réutilisation/i);

    const project = projects.createInternal({ name: 'Projet sécurité paquet' });
    const item = projectLibrary.create(
      project.id,
      { category: 'note', name: 'Note source' },
      { contentType: 'text', contentText: 'Contenu client' },
    );
    const preparation = reuse.prepareProjectItem({ itemId: item.id });
    const outsidePath = join(workspace.root, 'faux-manifest.json');
    writeFileSync(outsidePath, '{}', 'utf8');

    expect(() => reuse.createGlobal({
      preparation: { ...preparation, manifestPath: outsidePath },
      item: { category: 'note', name: 'Note globale', reuseStatus: 'reference' },
      version: { contentType: 'text', contentText: 'Note globale' },
    })).toThrow(/en dehors du dossier/i);
  });
});
