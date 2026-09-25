import { describe, expect, it } from 'vitest';
import {
  validateOccurrenceReturnManifestV1,
  validateSiteOccurrenceV1,
} from './siteOccurrence';

const validOccurrence = {
  contract: 'atoumweb_site_occurrence',
  schemaVersion: 1,
  siteOccurrenceId: 'awocc:test-123',
  createdBy: 'bridge',
  source: {
    componentPackageContractVersion: 1,
    fieldsContractVersion: 1,
    identityContractVersion: 1,
    libraryItemId: 'item-1',
    libraryVersionId: 'version-3',
    libraryVersionNumber: 3,
    componentFamilyId: 'awcf:feature-bubbles',
    componentKey: 'aw-feature-bubbles',
    libraryVariantId: 'awv:florist',
    variantKey: 'florist',
    sourcePackageFingerprint: null,
    sourceHtmlSha256: null,
    sourceCssSha256: null,
    sourceJavascriptSha256: null,
  },
  target: {
    siteUrl: 'https://fleuriste.example.test/',
    siteKey: 'fleuriste-dupont',
    workbenchId: 'awb-workbench:123',
    workbenchPostId: '456',
    bridgeVersion: '0.6.x',
  },
  state: 'modified',
  configuration: {
    fieldValues: {
      title: 'Nos créations florales',
      enabled: true,
      count: 3,
      optional: null,
    },
    cssVariables: {
      '--aw-primary': '#315a45',
      '--aw-gap': 24,
    },
    assetSelections: {
      'hero-image': 'asset:bouquet-1',
    },
  },
  changes: {
    changedFieldIds: ['title'],
    changedCssVariables: ['--aw-primary'],
    changedAssetIds: ['hero-image'],
    htmlChanged: true,
    cssChanged: true,
    javascriptChanged: false,
    structuralChange: false,
  },
  createdAt: '2026-09-25T09:00:00.000Z',
  updatedAt: '2026-09-25T10:00:00.000Z',
};

describe('Site Occurrence Contract V1', () => {
  it('valide une occurrence Bridge complète', () => {
    expect(validateSiteOccurrenceV1(validOccurrence)).toEqual([]);
  });

  it('refuse une occurrence sans provenance Manager ou Workbench', () => {
    const invalid = {
      ...validOccurrence,
      source: { ...validOccurrence.source, libraryVersionId: '' },
      target: { ...validOccurrence.target, workbenchId: '' },
    };
    expect(validateSiteOccurrenceV1(invalid)).toEqual(expect.arrayContaining([
      'source.libraryVersionId manquant.',
      'target.workbenchId manquant.',
    ]));
  });

  it('valide un manifest de retour qui laisse la décision au Manager', () => {
    const sha = 'a'.repeat(64);
    const manifest = {
      contract: 'atoumweb_bridge_occurrence_return',
      schemaVersion: 1,
      occurrenceContractVersion: 1,
      sourceComponentPackageContractVersion: 1,
      returnedAt: '2026-09-25T10:15:00.000Z',
      actionPolicy: 'manager_decides',
      siteOccurrenceId: 'awocc:test-123',
      files: {
        occurrence: { path: 'occurrence/occurrence.json', sha256: sha },
        html: { path: 'occurrence/component.html', sha256: sha },
        css: { path: 'occurrence/component.css', sha256: sha },
        javascript: null,
        assets: { path: 'occurrence/assets.json', sha256: sha },
        provenance: { path: 'occurrence/provenance.json', sha256: sha },
      },
      changes: validOccurrence.changes,
    };

    expect(validateOccurrenceReturnManifestV1(manifest)).toEqual([]);
  });

  it('interdit à Bridge de choisir une action de Bibliothèque dans le contrat de retour', () => {
    const sha = 'b'.repeat(64);
    const manifest = {
      contract: 'atoumweb_bridge_occurrence_return',
      schemaVersion: 1,
      occurrenceContractVersion: 1,
      sourceComponentPackageContractVersion: 1,
      returnedAt: '2026-09-25T10:15:00.000Z',
      actionPolicy: 'create_variant',
      siteOccurrenceId: 'awocc:test-123',
      files: {
        occurrence: { path: 'occurrence/occurrence.json', sha256: sha },
        html: { path: 'occurrence/component.html', sha256: sha },
        css: null,
        javascript: null,
        assets: { path: 'occurrence/assets.json', sha256: sha },
        provenance: { path: 'occurrence/provenance.json', sha256: sha },
      },
      changes: validOccurrence.changes,
    };

    expect(validateOccurrenceReturnManifestV1(manifest)).toContain('actionPolicy doit valoir manager_decides.');
  });
});
