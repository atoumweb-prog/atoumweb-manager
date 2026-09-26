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

  it('peut promouvoir une occurrence déjà conservée en nouvelle variante réutilisable', () => {
    const source = createSource();
    const imported = service.importReturn(createReturnPackage(source.id, source.currentVersion!.id, 1));
    const kept = service.keepOccurrence(imported.id);

    const promoted = service.createVariant(kept.id, { name: 'Menthe & ivoire' });
    expect(promoted.decision).toBe('create_variant');
    expect(promoted.resultTechnicalItemId).toBeTruthy();
    expect(promoted.resultVariantId).toBeTruthy();

    const variant = library.get(promoted.resultTechnicalItemId!);
    const sourceAfter = library.get(source.id);
    expect(variant.componentFamilyId).toBeTruthy();
    expect(variant.componentFamilyId).toBe(sourceAfter.componentFamilyId);
    expect(sourceAfter.variantMode).toBe('base');
    expect(variant.variantMode).toBe('inherit');
    expect(variant.variantKey).toBe('menthe-ivoire');
    expect(variant.reuseStatus).toBe('ready');
    expect(variant.currentVersion?.stable).toBe(true);
    expect(variant.tags).toContain('bridge-human-validated');

    const payload = JSON.parse(variant.currentVersion!.contentText!) as {
      reusable: { fields: Array<{ id: string; defaultValue: string; originalValue: string }> };
    };
    expect(payload.reusable.fields.find((field) => field.id === 'title')).toMatchObject({
      defaultValue: 'Titre client',
      originalValue: 'Titre client',
    });

    expect(service.listVariantTargets(promoted.id)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        technicalItemId: variant.id,
        variantKey: 'menthe-ivoire',
      }),
    ]));
  });

  it('peut détacher une occurrence dans une nouvelle famille sans la valider automatiquement', () => {
    const source = createSource();
    const imported = service.importReturn(createReturnPackage(source.id, source.currentVersion!.id, 1));

    const decided = service.createFamily(imported.id, { name: 'Hero éditorial détaché' });
    expect(decided.decision).toBe('new_family');
    expect(decided.resultTechnicalItemId).toBeTruthy();
    expect(decided.resultVariantId).toBeTruthy();

    const detached = library.get(decided.resultTechnicalItemId!);
    expect(detached.name).toBe('Hero éditorial détaché');
    expect(detached.componentFamilyId).toBeTruthy();
    expect(detached.variantMode).toBe('base');
    expect(detached.componentKey).toMatch(/^aw-hero-/);
    expect(detached.reuseStatus).toBe('adapt');
    expect(detached.currentVersion?.stable).toBe(false);
    expect(detached.tags).not.toContain('bridge-human-validated');
  });

  it('peut créer une nouvelle version d’une variante existante à partir de son retour Bridge', () => {
    const source = createSource();
    const firstReturn = service.importReturn(createReturnPackage(source.id, source.currentVersion!.id, 1));
    const firstDecision = service.createVariant(firstReturn.id, { name: 'Menthe' });
    const variantBefore = library.get(firstDecision.resultTechnicalItemId!);

    const secondPackage = createReturnPackage(
      variantBefore.id,
      variantBefore.currentVersion!.id,
      variantBefore.currentVersion!.versionNumber,
      {
        siteOccurrenceId: 'awocc:test-02',
        title: 'Titre client version 2',
        fileName: 'occurrence-return-variant-v2.zip',
      },
    );
    const secondReturn = service.importReturn(secondPackage);
    const targets = service.listVariantTargets(secondReturn.id);
    const target = targets.find((candidate) => candidate.technicalItemId === variantBefore.id);
    expect(target).toBeTruthy();

    const decided = service.updateVariant(secondReturn.id, { targetVariantId: target!.variantId });
    expect(decided.decision).toBe('update_variant');
    expect(decided.resultTechnicalItemId).toBe(variantBefore.id);

    const variantAfter = library.get(variantBefore.id);
    expect(variantAfter.currentVersion?.versionNumber).toBe(2);
    expect(variantAfter.currentVersion?.stable).toBe(true);
    expect(variantAfter.reuseStatus).toBe('ready');
    const payload = JSON.parse(variantAfter.currentVersion!.contentText!) as {
      reusable: { fields: Array<{ id: string; defaultValue: string }> };
    };
    expect(payload.reusable.fields.find((field) => field.id === 'title')?.defaultValue).toBe('Titre client version 2');
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
