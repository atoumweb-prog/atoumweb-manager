import {
  evaluateContractApplicability,
  evaluateContractConflicts,
  orderReviewedClauses,
  type ContractApplicabilityContext,
  type ContractApplicabilityRule,
  type ContractClauseConflict,
  type SectionedClause,
} from './contractSectionPolicy';

/** Preview for NEW draft contracts only. No database writes or historical snapshot mutations.
 * A classification proposal is not an approval; missing inputs remain unresolved.
 */
export interface DraftContractCandidate extends SectionedClause {
  versionId: string;
  applicability?: ContractApplicabilityRule;
}
export interface DraftContractAssemblyPlan<T extends DraftContractCandidate> {
  included: T[];
  excluded: T[];
  unresolved: T[];
  unreviewed: T[];
  warnings: ContractClauseConflict[];
  blocking: ContractClauseConflict[];
  ready: boolean;
}
export function planDraftContractAssembly<T extends DraftContractCandidate>(
  clauses: readonly T[],
  context: ContractApplicabilityContext,
  conflicts: readonly ContractClauseConflict[],
): DraftContractAssemblyPlan<T> {
  const excluded:T[] = [];
  const unresolved:T[] = [];
  const eligible:T[] = [];
  for (const clause of clauses) {
    const result = evaluateContractApplicability(clause.applicability ?? {}, context);
    if (result === 'ineligible') excluded.push(clause);
    else if (result === 'unresolved') unresolved.push(clause);
    else eligible.push(clause);
  }
  const { ordered: included, unreviewed } = orderReviewedClauses(eligible);
  const evaluated = evaluateContractConflicts(conflicts, included.map(c=>c.versionId));
  return {
    included, excluded, unresolved, unreviewed,
    ...evaluated,
    ready: unresolved.length===0 && unreviewed.length===0 && evaluated.blocking.length===0,
  };
}
