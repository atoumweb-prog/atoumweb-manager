import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
