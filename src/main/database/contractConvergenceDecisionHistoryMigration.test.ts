import { describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from './NodeSqliteAdapter';
import { CONTRACT_CONVERGENCE_APPROVAL_MIGRATION } from './contractConvergenceApprovalMigration';
import { CONTRACT_CONVERGENCE_DECISION_HISTORY_MIGRATION } from './contractConvergenceDecisionHistoryMigration';

describe('historique append-only des décisions de convergence', () => {
  it('conserve les décisions de la migration 77 et refuse les notes vides dans la migration 78', () => {
    const db = new NodeSqliteAdapter(':memory:');
    try {
      db.exec('PRAGMA foreign_keys=ON;');
      db.exec("CREATE TABLE contract_clause_templates (id TEXT PRIMARY KEY) STRICT; CREATE TABLE contract_clause_versions (id TEXT PRIMARY KEY) STRICT;");
      db.exec(CONTRACT_CONVERGENCE_APPROVAL_MIGRATION.sql);
      db.run("INSERT INTO contract_clause_templates(id) VALUES (?)", ['clause-1']);
      db.run("INSERT INTO contract_clause_versions(id) VALUES (?)", ['draft-1']);
      db.run(
        'INSERT INTO contract_convergence_decisions (id,clause_code,clause_id,draft_version_id,proposal_sha256,decision,reviewer,note,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
        ['legacy-decision','APP-CADRAGE','clause-1','draft-1','a'.repeat(64),'approved_for_publication','Ancien relecteur',null,'2026-10-31T08:00:00Z'],
      );

      db.exec(CONTRACT_CONVERGENCE_DECISION_HISTORY_MIGRATION.sql);
      expect(db.all('SELECT id,decision,reviewer,note FROM contract_convergence_decision_events')).toEqual([{
        id:'legacy-decision',decision:'approved_for_publication',reviewer:'Ancien relecteur',
        note:'[Note absente dans la décision antérieure à la migration 78]',
      }]);

      const base=['event-2','APP-CADRAGE','clause-1','draft-1','a'.repeat(64),'needs_revision','Relecteur'];
      expect(() => db.run(
        'INSERT INTO contract_convergence_decision_events (id,clause_code,clause_id,draft_version_id,proposal_sha256,decision,reviewer,note,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
        [...base,'   ','2026-10-31T09:00:00Z'],
      )).toThrow();

      db.run(
        'INSERT INTO contract_convergence_decision_events (id,clause_code,clause_id,draft_version_id,proposal_sha256,decision,reviewer,note,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
        [...base,'Révision demandée avec justification','2026-10-31T09:00:00Z'],
      );
      expect(db.get<{n:number}>('SELECT count(*) AS n FROM contract_convergence_decision_events')).toEqual({n:2});
      expect(db.get<{n:number}>('SELECT count(*) AS n FROM contract_convergence_decisions')).toEqual({n:1});
      expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
    } finally {
      db.close();
    }
  });
});
