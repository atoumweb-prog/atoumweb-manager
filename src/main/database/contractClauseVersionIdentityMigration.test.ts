import { beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from './NodeSqliteAdapter';
import { applyPendingMigrations } from './migrations';
import { ContractTermsService } from '../commercial/ContractTermsService';

describe('migration 79 — identité versionnée des clauses', () => {
  let db: NodeSqliteAdapter;
  beforeEach(() => {
    db = new NodeSqliteAdapter(':memory:');
    db.exec('PRAGMA foreign_keys=ON');
    applyPendingMigrations(db);
  });

  it('conserve le code et le public historiques puis adopte ceux du brouillon seulement à sa publication', () => {
    const terms = new ContractTermsService(db);
    const template = terms.createTemplate(
      { code: 'BLOG-DONNEES', title: 'Ancien titre', scope: 'catalog', audience: 'all' },
      { body: 'Texte historique' },
    );
    const published = terms.publishVersion(template.versions[0].id);
    const draft = terms.createVersion(published.id, {
      code: 'BLOG-ROLES-CONTENUS',
      audience: 'consumer',
      title: 'Nouveau titre',
      body: 'Texte V3.7',
    });

    expect(terms.getTemplate(template.id)).toMatchObject({ code: 'BLOG-DONNEES', audience: 'all', currentVersionId: published.currentVersionId });
    expect(draft).toMatchObject({ code: 'BLOG-ROLES-CONTENUS', audience: 'consumer', status: 'draft' });

    const adopted = terms.publishVersion(draft.id);
    expect(adopted).toMatchObject({ code: 'BLOG-ROLES-CONTENUS', audience: 'consumer', title: 'Nouveau titre', currentVersionId: draft.id });
    expect(adopted.versions.find((version) => version.id === published.currentVersionId)).toMatchObject({
      code: 'BLOG-DONNEES', audience: 'all', status: 'retired', body: 'Texte historique',
    });
    expect(db.get('SELECT alias_code,clause_id FROM contract_clause_code_aliases')).toEqual({
      alias_code: 'BLOG-DONNEES', clause_id: template.id,
    });
  });

  it('refuse qu’une autre clause réutilise un code historique', () => {
    const terms = new ContractTermsService(db);
    const first = terms.createTemplate({ code: 'OLD-CODE', title: 'Première', scope: 'base' }, { body: 'V1' });
    terms.publishVersion(first.versions[0].id);
    const renamed = terms.createVersion(first.id, { code: 'NEW-CODE', body: 'V2' });
    terms.publishVersion(renamed.id);
    const second = terms.createTemplate({ code: 'OTHER-CODE', title: 'Seconde', scope: 'base' }, { body: 'V1' });
    expect(() => terms.createVersion(second.id, { code: 'OLD-CODE', body: 'Collision' })).toThrow(/déjà utilisé/);
  });
});
