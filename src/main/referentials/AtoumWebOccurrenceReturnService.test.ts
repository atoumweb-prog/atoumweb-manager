import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AtoumWebOccurrenceReturnManifestV1, AtoumWebSiteOccurrenceV1 } from '../../shared/siteOccurrence';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { createWorkspacePaths, type WorkspacePaths } from '../workspace';
import { AtoumWebTechnicalLibraryService } from './AtoumWebTechnicalLibraryService';
import { AtoumWebOccurrenceReturnService } from './AtoumWebOccurrenceReturnService';
import { writeZipArchive } from './ZipArchive';

let database: NodeSqliteAdapter;
let workspaceRoot: string;
let workspace: WorkspacePaths;
let library: AtoumWebTechnicalLibraryService;
let service: AtoumWebOccurrenceReturnService;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'atoumweb-occ-return-'));
  workspace = createWorkspacePaths(workspaceRoot);
  database = new NodeSqliteAdapter(':memory:');
  database.exec('PRAGMA foreign_keys = ON;');
  applyPendingMigrations(database);
  library = new AtoumWebTechnicalLibraryService(database);
  service = new AtoumWebOccurrenceReturnService(database, workspace);
});

afterEach(() => {
  database.close();
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('AtoumWebOccurrenceReturnService', () => {
  it('inspecte, importe et déduplique un Occurrence Return V1 vérifié', () => {
    const source = createSource();
    const packagePath = createReturnPackage(source.id, source.currentVersion!.id, source.currentVersion!.versionNumber);

    const inspection = service.inspectPackage(packagePath);
    expect(inspection).toMatchObject({
      siteOccurrenceId: 'awocc:test-01',
      libraryItemId: source.id,
      libraryVersionId: source.currentVersion!.id,
      libraryVersionNumber: 1,
      libraryItemName: 'Hero retour',
      occurrenceState: 'ready_for_review',
      alreadyImported: false,
    });
    expect(inspection.changes.changedFieldIds).toEqual(['title']);

    const imported = service.importReturn(packagePath);
    expect(imported.siteOccurrenceId).toBe('awocc:test-01');
    expect(imported.html).toContain('Titre client');
    expect(imported.decision).toBeNull();
    expect(service.list()).toHaveLength(1);

    const second = service.importReturn(packagePath);
    expect(second.id).toBe(imported.id);
    expect(service.list()).toHaveLength(1);
  });

  it('refuse un fichier déclaré dont le SHA-256 ne correspond pas', () => {
    const source = createSource();
    const packagePath = createReturnPackage(source.id, source.currentVersion!.id, 1, { invalidHtmlChecksum: true });
    expect(() => service.inspectPackage(packagePath)).toThrow(/Checksum SHA-256 invalide/);
    expect(service.list()).toHaveLength(0);
  });

  it('refuse un retour rattaché à une version Bibliothèque inconnue', () => {
    const source = createSource();
    const packagePath = createReturnPackage(source.id, 'missing-version', 1);
    expect(() => service.inspectPackage(packagePath)).toThrow(/version Bibliothèque source/);
  });

  it('enregistre explicitement la décision de conserver seulement l’occurrence', () => {
    const source = createSource();
    const imported = service.importReturn(createReturnPackage(source.id, source.currentVersion!.id, 1));
    const decided = service.keepOccurrence(imported.id);
    expect(decided.decision).toBe('keep_occurrence');
    expect(decided.decidedAt).toBeTruthy();
  });
});

function createSource() {
  const payload = {
    schemaVersion: 2,
    generatorRevision: 2,
    kind: 'atoumweb-library-reusable-component',
    origin: {
      site: 'https://source.test',
      page: 'Accueil',
      pageUrl: 'https://source.test/',
      snapshotId: 'snapshot:test',
      snapshotDate: '2026-09-25T09:00:00.000Z',
      builderGeneration: 'divi-4',
      occurrenceId: 'source:hero-retour',
    },
    identity: null,
    reusable: {
      html: '<section class="hero-return"><h1 data-aw-field-text="title">Titre source</h1></section>',
      css: '.hero-return{color:#111111;}',
      javascript: '',
      rootClasses: ['hero-return'],
      method: 'divi-code',
      instructions: ['Personnaliser le titre.'],
      generalized: true,
      fields: [{
        id: 'title',
        label: 'Titre principal',
        type: 'text',
        selector: '[data-aw-field-text="title"]',
        originalValue: 'Titre source',
        defaultValue: 'Votre titre',
        group: 'Contenu',
        required: false,
        binding: { type: 'html_text', selector: '[data-aw-field-text="title"]' },
        sourceMode: 'auto_detected',
      }],
    },
    dependencies: [],
    assets: [],
    checks: { remoteAssetUrls: [] },
    notes: [],
  };
  const created = library.create(
    { category: 'hero', name: 'Hero retour', reuseStatus: 'ready', tags: ['bridge', 'bridge-human-validated'] },
    { contentType: 'json', language: 'json', contentText: JSON.stringify(payload), notes: 'Source Bridge' },
  );
  return library.markStable(created.currentVersion!.id);
}

function createReturnPackage(
  libraryItemId: string,
  libraryVersionId: string,
  libraryVersionNumber: number,
  options: {
    invalidHtmlChecksum?: boolean;
    siteOccurrenceId?: string;
    title?: string;
    fileName?: string;
  } = {},
): string {
  const siteOccurrenceId = options.siteOccurrenceId ?? 'awocc:test-01';
  const title = options.title ?? 'Titre client';
  const occurrence: AtoumWebSiteOccurrenceV1 = {
    contract: 'atoumweb_site_occurrence',
    schemaVersion: 1,
    siteOccurrenceId,
    createdBy: 'bridge',
    source: {
      componentPackageContractVersion: 1,
      fieldsContractVersion: 1,
      identityContractVersion: 1,
      libraryItemId,
      libraryVersionId,
      libraryVersionNumber,
      componentFamilyId: null,
      componentKey: null,
      libraryVariantId: null,
      variantKey: null,
      sourcePackageFingerprint: 'a'.repeat(64),
      sourceHtmlSha256: 'b'.repeat(64),
      sourceCssSha256: null,
      sourceJavascriptSha256: null,
    },
    target: {
      siteUrl: 'https://example.test',
      siteKey: 'wp:https://example.test/:blog:1',
      workbenchId: 'awb-workbench:test',
      workbenchPostId: '42',
      bridgeVersion: '0.7.2',
    },
    state: 'ready_for_review',
    configuration: {
      fieldValues: { title },
      cssVariables: {},
      assetSelections: {},
    },
    changes: {
      changedFieldIds: ['title'],
      changedCssVariables: [],
      changedAssetIds: [],
      htmlChanged: true,
      cssChanged: false,
      javascriptChanged: false,
      structuralChange: false,
    },
    createdAt: '2026-09-25T10:00:00.000Z',
    updatedAt: '2026-09-25T10:15:00.000Z',
  };

  const payloads = {
    'occurrence/occurrence.json': Buffer.from(JSON.stringify(occurrence), 'utf8'),
    'occurrence/component.html': Buffer.from(`<section class="hero-return"><h1 data-aw-field-text="title">${title}</h1></section>`, 'utf8'),
    'occurrence/assets.json': Buffer.from(JSON.stringify({ contract: 'atoumweb_occurrence_assets', schemaVersion: 1 }), 'utf8'),
    'occurrence/provenance.json': Buffer.from(JSON.stringify({ contract: 'atoumweb_occurrence_provenance', schemaVersion: 1, actionPolicy: 'manager_decides' }), 'utf8'),
  };
  const file = (path: keyof typeof payloads) => ({
    path,
    sha256: createHash('sha256').update(payloads[path]).digest('hex'),
  });
  const htmlFile = file('occurrence/component.html');

  const manifest: AtoumWebOccurrenceReturnManifestV1 = {
    contract: 'atoumweb_bridge_occurrence_return',
    schemaVersion: 1,
    occurrenceContractVersion: 1,
    sourceComponentPackageContractVersion: 1,
    returnedAt: '2026-09-25T10:16:00.000Z',
    actionPolicy: 'manager_decides',
    siteOccurrenceId: occurrence.siteOccurrenceId,
    files: {
      occurrence: file('occurrence/occurrence.json'),
      html: {
        ...htmlFile,
        sha256: options.invalidHtmlChecksum ? '0'.repeat(64) : htmlFile.sha256,
      },
      css: null,
      javascript: null,
      assets: file('occurrence/assets.json'),
      provenance: file('occurrence/provenance.json'),
    },
    changes: occurrence.changes,
  };

  const packagePath = join(workspaceRoot, options.fileName ?? `occurrence-return-${siteOccurrenceId.replace(/[^a-z0-9]+/gi, '-')}.zip`);
  writeZipArchive(packagePath, [
    { name: 'manifest.json', data: Buffer.from(JSON.stringify(manifest), 'utf8') },
    ...Object.entries(payloads).map(([name, data]) => ({ name, data })),
  ]);
  return packagePath;
}
