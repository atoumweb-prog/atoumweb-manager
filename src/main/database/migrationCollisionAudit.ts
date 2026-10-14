/** Read-only evaluation of the migration collision found between UX 04 and UX 05.
 * Never mutates schema_migrations or assumes local databases are disposable.
 */
export type MigrationLedgerRow={id:number;name:string;applied_at:string};
export type ContractMigrationDecision=
  | 'not_applied_safe_to_renumber_after_coordination'
  | 'old_67_applied_preserve_and_migrate_with_approved_procedure'
  | 'collision_67_other_name'
  | 'already_69_applied'
  | 'conflicting_69'
  | 'ambiguous_manual_inspection';
export function assessContractMigrationLedger(rows:readonly MigrationLedgerRow[]):ContractMigrationDecision{
 const old=rows.filter(row=>row.id===67);
 const target=rows.filter(row=>row.id===69);
 if(old.length>1||target.length>1)return 'ambiguous_manual_inspection';
 if(target.length&&target[0].name!=='contract_clause_section_review_v1')return 'conflicting_69';
 if(old.length&&old[0].name==='contract_clause_section_review_v1'){
   return target.length?'ambiguous_manual_inspection':'old_67_applied_preserve_and_migrate_with_approved_procedure';
 }
 if(old.length&&target.length)return 'ambiguous_manual_inspection';
 if(target.length)return 'already_69_applied';
 if(old.length)return 'collision_67_other_name';
 return 'not_applied_safe_to_renumber_after_coordination';
}
