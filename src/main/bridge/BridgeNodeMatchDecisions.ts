import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { BridgeNodeMatchDecision, BridgeNodeMatchDecisionInput, BridgeNodeMatchCandidate } from '../../shared/bridgeSnapshots';

type NodeRow = { id: string; snapshot_id: string; site_id: string; source_page_key: string; generated_at: string };

/** Annotations Manager uniquement : ne réécrit jamais bridge_nodes ni les objets Snapshot. */
export class BridgeNodeMatchDecisions {
  constructor(private readonly database: DatabaseAdapter) {}

  history(beforePageId: string, afterPageId: string): Array<BridgeNodeMatchDecision & { reopenedAt: string }> {
    return this.database.all<{ decision_json: string; reopened_at: string }>(
      'SELECT decision_json,reopened_at FROM bridge_node_match_history WHERE before_page_snapshot_id=? AND after_page_snapshot_id=? ORDER BY reopened_at,id',
      [beforePageId, afterPageId],
    ).map((row) => ({ ...JSON.parse(row.decision_json) as BridgeNodeMatchDecision, reopenedAt: row.reopened_at }));
  }

  reopen(input: BridgeNodeMatchDecisionInput): void {
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      const existing = this.list(input.beforePageSnapshotId, input.afterPageSnapshotId)
        .find((item) => item.beforeOccurrenceId === input.beforeOccurrenceId && item.afterOccurrenceId === input.afterOccurrenceId);
      if (existing) {
        // Ne pas retirer une attribution dont une autre validation dépend encore.
        const dependent = this.database.get<{ id: string }>(`SELECT id FROM bridge_node_match_decisions
          WHERE decision='accepted' AND id<>? AND (
            before_node_id IN (SELECT node_id FROM bridge_node_logical_assignments WHERE decision_id=?) OR
            after_node_id IN (SELECT node_id FROM bridge_node_logical_assignments WHERE decision_id=?)) LIMIT 1`,
        [existing.id, existing.id, existing.id]);
        if (dependent) throw new Error('Une autre correspondance validée dépend de cette décision. Remettez d’abord en attente les validations suivantes dans l’historique des snapshots.');
        const now = new Date().toISOString();
        this.database.run('INSERT INTO bridge_node_match_history(id,before_page_snapshot_id,after_page_snapshot_id,decision_json,reopened_at) VALUES (?,?,?,?,?)',
          [randomUUID(), input.beforePageSnapshotId, input.afterPageSnapshotId, JSON.stringify(existing), now]);
        this.database.run('DELETE FROM bridge_node_logical_assignments WHERE decision_id=?', [existing.id]);
        this.database.run('DELETE FROM bridge_node_match_decisions WHERE id=?', [existing.id]);
        this.database.run('INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
          ['bridge_node_match', existing.id, 'reopened', 'Correspondance remise en attente pour réexamen', JSON.stringify(existing), now]);
      }
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
  }

  list(beforePageId: string, afterPageId: string): BridgeNodeMatchDecision[] {
    return this.database.all<Record<string, unknown>>(`
      SELECT d.*, b.occurrence_id before_occurrence, a.occurrence_id after_occurrence
      FROM bridge_node_match_decisions d
      JOIN bridge_nodes b ON b.id=d.before_node_id JOIN bridge_nodes a ON a.id=d.after_node_id
      WHERE b.page_snapshot_id=? AND a.page_snapshot_id=? ORDER BY d.decided_at,d.id
    `, [beforePageId, afterPageId]).map((row) => ({
      id: String(row.id), beforeOccurrenceId: String(row.before_occurrence), afterOccurrenceId: String(row.after_occurrence),
      decision: row.decision as BridgeNodeMatchDecision['decision'],
      logicalNodeId: row.logical_node_id == null ? null : String(row.logical_node_id),
      decidedAt: String(row.decided_at), source: 'manager_human',
      proposal: JSON.parse(String(row.proposal_json)) as BridgeNodeMatchCandidate,
    }));
  }

  record(input: BridgeNodeMatchDecisionInput, proposal: BridgeNodeMatchCandidate): void {
    if (!['accepted', 'rejected'].includes(input.decision)) throw new Error('Décision de correspondance invalide.');
    const node = (pageId: string, occurrenceId: string) => this.database.get<NodeRow>(`
      SELECT n.id,p.snapshot_id,p.source_page_key,s.site_id,s.generated_at
      FROM bridge_nodes n JOIN bridge_page_snapshots p ON p.id=n.page_snapshot_id
      JOIN bridge_snapshots s ON s.id=p.snapshot_id WHERE n.page_snapshot_id=? AND n.occurrence_id=?
    `, [pageId, occurrenceId]);
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      const before = node(input.beforePageSnapshotId, input.beforeOccurrenceId);
      const after = node(input.afterPageSnapshotId, input.afterOccurrenceId);
      if (!before || !after || before.site_id !== after.site_id || before.source_page_key !== after.source_page_key) {
        throw new Error('Les nœuds doivent appartenir à la même page du même site.');
      }
      if (!(Date.parse(before.generated_at) < Date.parse(after.generated_at))) {
        throw new Error('La validation exige deux snapshots dans un ordre chronologique strict.');
      }
      const existing = this.list(input.beforePageSnapshotId, input.afterPageSnapshotId)
        .find((item) => item.beforeOccurrenceId === input.beforeOccurrenceId && item.afterOccurrenceId === input.afterOccurrenceId);
      if (existing) {
        if (existing.decision !== input.decision) throw new Error('Cette correspondance possède déjà une décision définitive.');
        this.database.exec('COMMIT;');
        return;
      }
      const assignment = (id: string) => this.database.get<{ logical_node_id: string }>(
        'SELECT logical_node_id FROM bridge_node_logical_assignments WHERE node_id=?', [id],
      )?.logical_node_id;
      const id = randomUUID();
      const now = new Date().toISOString();
      let logicalId: string | null = null;
      if (input.decision === 'rejected' && assignment(before.id) && assignment(before.id) === assignment(after.id)) {
        throw new Error('Ces nœuds sont déjà liés par des validations humaines antérieures.');
      }
      if (input.decision === 'accepted') {
        const leftId = assignment(before.id);
        const rightId = assignment(after.id);
        if (leftId && rightId && leftId !== rightId) throw new Error('Collision : ces nœuds ont déjà des identités logiques différentes.');
        logicalId = leftId ?? rightId ?? `awnode:${randomUUID()}`;
        const rejected = this.database.get<{ id: string }>(`SELECT id FROM bridge_node_match_decisions
          WHERE decision='rejected'
          AND (before_node_id IN (?,?) OR before_node_id IN (SELECT node_id FROM bridge_node_logical_assignments WHERE logical_node_id=?))
          AND (after_node_id IN (?,?) OR after_node_id IN (SELECT node_id FROM bridge_node_logical_assignments WHERE logical_node_id=?)) LIMIT 1`,
        [before.id, after.id, logicalId, before.id, after.id, logicalId]);
        if (rejected) throw new Error('Cette liaison contredirait un refus humain antérieur.');
        for (const item of [before, after]) {
          const collision = this.database.get<{ node_id: string }>(
            'SELECT node_id FROM bridge_node_logical_assignments WHERE logical_node_id=? AND snapshot_id=?', [logicalId, item.snapshot_id],
          );
          if (collision && collision.node_id !== item.id) throw new Error('Collision : un autre nœud de ce snapshot porte déjà cette identité logique.');
        }
        if (!leftId && !rightId) this.database.run(
          'INSERT INTO bridge_logical_nodes(id,site_id,source_page_key,created_at) VALUES (?,?,?,?)',
          [logicalId, before.site_id, before.source_page_key, now],
        );
      }
      this.database.run(`INSERT INTO bridge_node_match_decisions
        (id,before_node_id,after_node_id,decision,logical_node_id,proposal_json,decided_at,decision_source)
        VALUES (?,?,?,?,?,?,?,'manager_human')`,
      [id, before.id, after.id, input.decision, logicalId, JSON.stringify(proposal), now]);
      if (logicalId) for (const item of [before, after]) {
        if (!assignment(item.id)) this.database.run(`INSERT INTO bridge_node_logical_assignments
          (node_id,logical_node_id,snapshot_id,decision_id) VALUES (?,?,?,?)`, [item.id, logicalId, item.snapshot_id, id]);
      }
      this.database.run('INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
        ['bridge_node_match', id, input.decision, input.decision === 'accepted' ? 'Correspondance validée humainement' : 'Correspondance refusée',
          JSON.stringify({ ...input, logicalNodeId: logicalId }), now]);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
  }
}
