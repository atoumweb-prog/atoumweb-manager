import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import type { SqlValue } from '../database/DatabaseAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { ContractTermsService } from './ContractTermsService';
import { ContractEditorialDraftService, type ContractEditorialProposalDocument } from './ContractEditorialDraftService';

const proposals: ContractEditorialProposalDocument = JSON.parse(
  readFileSync('docs/ux-v2/bibliotheque-humaine-118-20261025/PROPOSITIONS.json', 'utf8'),
);
const published = JSON.parse(readFileSync('data/handoff/2026-10-27/contrats-publies.json', 'utf8')).tables as {
  contract_clause_templates: Array<Record<string, unknown>>;
  contract_clause_versions: Array<Record<string, unknown>>;
};
const sourceReference = 'PR #159 @ c7f73f2c — PROPOSITIONS.json';

let db: NodeSqliteAdapter;
let service: ContractEditorialDraftService;

function seedPublishedOrigins(): void {
  const versions = new Map(published.contract_clause_versions.map((version) => [version.id, version]));
  for (const template of published.contract_clause_templates) {
    const version = versions.get(template.current_version_id)!;
    db.run(
      `INSERT INTO contract_clause_templates
       (id,code,title,scope,status,sort_order,current_version_id,created_at,updated_at,archived_at,audience)
       VALUES (?,?,?,?,?,?,NULL,?,?,?,?)`,
      [template.id, template.code, template.title, template.scope, template.status, template.sort_order,
        template.created_at, template.updated_at, template.archived_at, template.audience] as SqlValue[],
    );
    db.run(
      `INSERT INTO contract_clause_versions
       (id,clause_id,version_number,title,body,status,published_at,created_at,review_metadata_json)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [version.id, version.clause_id, version.version_number, template.title, version.body, version.status,
        version.published_at, version.created_at, JSON.stringify(version.review_metadata)] as SqlValue[],
    );
    db.run('UPDATE contract_clause_templates SET current_version_id=? WHERE id=?', [version.id, template.id] as SqlValue[]);
  }
}

beforeEach(() => {
  db = new NodeSqliteAdapter(':memory:');
  db.exec('PRAGMA foreign_keys=ON;');
  applyPendingMigrations(db);
  seedPublishedOrigins();
  service = new ContractEditorialDraftService(db);
});
afterEach(() => {
  vi.restoreAllMocks();
  db.close();
});

describe('préparation des 118 propositions éditoriales', () => {
  it('simule sans écriture et vérifie chaque origine publiée', () => {
    const before = db.all('SELECT * FROM contract_clause_versions ORDER BY id');
    const plan = service.simulate(proposals, sourceReference);

    expect(plan.anomalies).toEqual([]);
    expect(plan.counts).toEqual({ draftsToCreate: 118, draftsKept: 0, conflicts: 0 });
    expect(db.all('SELECT * FROM contract_clause_versions ORDER BY id')).toEqual(before);
  });

  it('crée 118 nouvelles versions brouillon, conserve les publiées et versionne les deux titres révisés', () => {
    const publish = vi.spyOn(ContractTermsService.prototype, 'publishVersion');
    const plan = service.simulate(proposals, sourceReference);
    service.apply(proposals, sourceReference, plan.planSha256);

    expect(publish).not.toHaveBeenCalled();
    expect(db.get("SELECT COUNT(*) n FROM contract_clause_versions WHERE status='published'")).toEqual({ n: 118 });
    expect(db.get("SELECT COUNT(*) n FROM contract_clause_versions WHERE status='draft'")).toEqual({ n: 118 });
    expect(db.get('SELECT COUNT(*) n FROM contract_editorial_import_entries')).toEqual({ n: 118 });
    expect(db.all("SELECT * FROM activity_log WHERE action='contract_clause_version_published'")).toEqual([]);

    const terms = new ContractTermsService(db);
    expect(terms.getTemplate(proposals.clauses.find((clause) => clause.code === 'APP-GARANTIE')!.origin.templateId).versions[0].title)
      .toBe('Garantie corrective de l’application');
    expect(terms.getTemplate(proposals.clauses.find((clause) => clause.code === 'WEB-AR')!.origin.templateId).versions[0].title)
      .toBe('Étapes de relecture et de correction');
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
    expect(db.get('PRAGMA integrity_check')).toEqual({ integrity_check: 'ok' });
  });

  it('est idempotent et refuse toute dérive de la version source', () => {
    const first = service.simulate(proposals, sourceReference);
    service.apply(proposals, sourceReference, first.planSha256);
    const replay = service.simulate(proposals, sourceReference);
    expect(replay.counts).toEqual({ draftsToCreate: 0, draftsKept: 118, conflicts: 0 });
    service.apply(proposals, sourceReference, replay.planSha256);
    expect(db.get('SELECT COUNT(*) n FROM contract_editorial_import_runs')).toEqual({ n: 1 });

    const changed = structuredClone(proposals);
    changed.clauses[0].origin.body += ' dérive';
    const conflict = service.simulate(changed, sourceReference);
    expect(conflict.anomalies.some((message) => message.includes('corps source'))).toBe(true);
    expect(() => service.apply(changed, sourceReference, conflict.planSha256)).toThrow(/refusée/);
    expect(db.get('SELECT COUNT(*) n FROM contract_clause_versions')).toEqual({ n: 236 });
  });
});
