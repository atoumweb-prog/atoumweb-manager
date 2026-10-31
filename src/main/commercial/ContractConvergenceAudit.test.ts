import { describe, expect, it } from 'vitest';

// The audit deliberately reads the versioned handoff exports instead of a
// personal SQLite database. This keeps the convergence check reproducible.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { auditContractConvergence } = require('../../../scripts/audit-contract-convergence.cjs') as {
  auditContractConvergence: () => {
    structural: {
      proposals: number;
      uniqueProposalCodes: number;
      publishedTemplates: number;
      uniquePublishedCodes: number;
      originMismatches: unknown[];
      missingDependencies: unknown[];
      publicationFlags: { approved: number; published: number; adopted: number };
      titleChanges: Array<{ code: string }>;
    };
    structuralErrors: string[];
    commercialConflicts: Array<{ code: string }>;
    safeToPrepareAllDrafts: boolean;
  };
};

describe('contract proposal convergence audit', () => {
  it('keeps the 118 documentary proposals tied to their exact published origins', () => {
    const result = auditContractConvergence();

    expect(result.structural).toMatchObject({
      proposals: 118,
      uniqueProposalCodes: 118,
      publishedTemplates: 118,
      uniquePublishedCodes: 118,
      originMismatches: [],
      missingDependencies: [],
      publicationFlags: { approved: 0, published: 0, adopted: 0 },
    });
    expect(result.structuralErrors).toEqual([]);
  });

  it('keeps unresolved commercial decisions visible instead of preparing unsafe drafts', () => {
    const result = auditContractConvergence();

    expect(result.commercialConflicts.map((conflict) => conflict.code)).toEqual([
      'HOSTING-LUNE-PRICE',
      'MIGRATION-INTERNAL-EXTERNAL',
    ]);
    expect(result.structural.titleChanges.map((change) => change.code)).toEqual(['APP-GARANTIE', 'WEB-AR']);
    expect(result.safeToPrepareAllDrafts).toBe(false);
  });
});
