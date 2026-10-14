import {describe,it,expect} from 'vitest';
import {assessContractMigrationLedger} from './migrationCollisionAudit';
const row=(id:number,name:string)=>({id,name,applied_at:'2026-10-14T19:00:00Z'});
describe('05C — preserve persistent migration ledgers',()=>{
 it('identifies the renumber-only case',()=>expect(assessContractMigrationLedger([row(66,'contract_types_v1')])).toBe('not_applied_safe_to_renumber_after_coordination'));
 it('flags an existing old 67 that must never be renumbered blindly',()=>expect(assessContractMigrationLedger([row(67,'contract_clause_section_review_v1')])).toBe('old_67_applied_preserve_and_migrate_with_approved_procedure'));
 it('detects other lot 67 and conflicting target 69',()=>{
   expect(assessContractMigrationLedger([row(67,'catalog_category_registry_v1')])).toBe('collision_67_other_name');
   expect(assessContractMigrationLedger([row(69,'foreign')])).toBe('conflicting_69');
 });
 it('rejects impossible mixed states until manual inspection',()=>{
   expect(assessContractMigrationLedger([row(67,'contract_clause_section_review_v1'),row(69,'contract_clause_section_review_v1')])).toBe('ambiguous_manual_inspection');
   expect(assessContractMigrationLedger([row(67,'catalog_category_registry_v1'),row(69,'contract_clause_section_review_v1')])).toBe('ambiguous_manual_inspection');
 });
 it('recognizes an already-applied 69 by exact name',()=>expect(assessContractMigrationLedger([row(69,'contract_clause_section_review_v1')])).toBe('already_69_applied'));
});
