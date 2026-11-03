import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import type { SqlValue } from '../database/DatabaseAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { ContractTermsService } from './ContractTermsService';
import { ContractEditorialDraftService, type ContractEditorialProposalDocument } from './ContractEditorialDraftService';

const proposals: ContractEditorialProposalDocument = JSON.parse(
  readFileSync('data/contracts/atoumweb-contract-library-v37.json', 'utf8'),
);
const proposalsV38: ContractEditorialProposalDocument = JSON.parse(
  readFileSync('data/contracts/atoumweb-contract-library-v38-review.json', 'utf8'),
);
const published = JSON.parse(readFileSync('data/handoff/2026-10-27/contrats-publies.json', 'utf8')).tables as {
  contract_clause_templates: Array<Record<string, unknown>>;
  contract_clause_versions: Array<Record<string, unknown>>;
};
const sourceReference = 'Bibliothèque contractuelle AtoumWeb — version retenue V3.7 — 1er novembre 2026';

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

describe('préparation des 118 clauses V3.7 retenues', () => {
  it('simule sans écriture et vérifie chaque origine publiée', () => {
    const before = db.all('SELECT * FROM contract_clause_versions ORDER BY id');
    const plan = service.simulate(proposals, sourceReference);

    expect(plan.anomalies).toEqual([]);
    expect(plan.counts).toEqual({ draftsToCreate: 118, draftsKept: 0, conflicts: 0 });
    expect(db.all('SELECT * FROM contract_clause_versions ORDER BY id')).toEqual(before);
  });

  it('crée 118 nouvelles versions brouillon et conserve les identités publiées jusqu’à publication', () => {
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
    const blog = terms.getTemplate(proposals.clauses.find((clause) => clause.code === 'BLOG-ROLES-CONTENUS')!.origin.templateId);
    expect(blog).toMatchObject({ code: 'BLOG-DONNEES', audience: 'all' });
    expect(blog.versions[0]).toMatchObject({ code: 'BLOG-ROLES-CONTENUS', audience: 'all', status: 'draft' });
    const privateWedding = terms.getTemplate(proposals.clauses.find((clause) => clause.code === 'MARIAGE-PRIVE')!.origin.templateId);
    expect(privateWedding).toMatchObject({ audience: 'all' });
    expect(privateWedding.versions[0]).toMatchObject({ audience: 'consumer', status: 'draft' });
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

describe('préparation distincte du projet V3.8', () => {
  it('simule 119 clauses sans écriture, dont la nouvelle clause 119', () => {
    const before = db.all('SELECT * FROM contract_clause_templates ORDER BY id');
    const plan = service.simulate(proposalsV38, proposalsV38.reference!);
    expect(plan.anomalies).toEqual([]);
    expect(plan.counts).toEqual({ draftsToCreate: 119, draftsKept: 0, conflicts: 0 });
    expect(plan.rows.find((row) => row.code === 'BASE-REFERENCES-AGENCE')).toMatchObject({ action: 'create' });
    expect(db.all('SELECT * FROM contract_clause_templates ORDER BY id')).toEqual(before);
  });

  it('prépare 119 brouillons sans publier et rejoue de façon idempotente', () => {
    const publishedBefore = db.all('SELECT id,clause_id,body,status FROM contract_clause_versions WHERE status=\'published\' ORDER BY id');
    const plan = service.simulate(proposalsV38, proposalsV38.reference!);
    service.apply(proposalsV38, proposalsV38.reference!, plan.planSha256);
    expect(db.all('SELECT id,clause_id,body,status FROM contract_clause_versions WHERE status=\'published\' ORDER BY id')).toEqual(publishedBefore);
    expect(db.get("SELECT COUNT(*) n FROM contract_clause_versions WHERE status='draft'")).toEqual({ n: 119 });
    expect(db.get("SELECT COUNT(*) n FROM contract_clause_templates WHERE code='BASE-REFERENCES-AGENCE'")).toEqual({ n: 1 });
    expect(db.get("SELECT COUNT(*) n FROM activity_log WHERE action='contract_clause_version_published'")).toEqual({ n: 0 });
    expect(service.simulate(proposalsV38, proposalsV38.reference!).counts).toEqual({ draftsToCreate: 0, draftsKept: 119, conflicts: 0 });
    expect(db.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  it('refuse atomiquement une nouvelle clause invalide', () => {
    const invalid = structuredClone(proposalsV38);
    invalid.clauses[118].proposal = '';
    const plan = service.simulate(invalid, invalid.reference!);
    expect(plan.anomalies).toContain('BASE-REFERENCES-AGENCE : proposition vide.');
    expect(() => service.apply(invalid, invalid.reference!, plan.planSha256)).toThrow(/refusée/);
    expect(db.get('SELECT COUNT(*) n FROM contract_editorial_import_runs')).toEqual({ n: 0 });
    expect(db.get("SELECT COUNT(*) n FROM contract_clause_templates WHERE code='BASE-REFERENCES-AGENCE'")).toEqual({ n: 0 });
  });
});
