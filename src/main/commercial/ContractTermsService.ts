import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter, SqlValue } from '../database/DatabaseAdapter';
import {
  CONTRACT_CLAUSE_AUDIENCES,
  CONTRACT_CLAUSE_SCOPES,
  CONTRACT_CLAUSE_STATUSES,
  type ContractClauseAudience,
  type ContractClauseScope,
  type ContractClauseStatus,
  type ContractClauseTemplate,
  type ContractClauseTemplateInput,
  type ContractClauseVersion,
  type ContractClauseVersionInput,
  type ContractClauseVersionStatus,
  type QuoteContractAudience,
  type QuoteContractBuild,
  type QuoteContractClause,
  type QuoteContractClauseInput,
  type QuoteContractClauseSource,
  type QuoteContractClauseUpdate,
} from '../../shared/contractTerms';

const nowIso = (): string => new Date().toISOString();
const clean = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

interface TemplateRow extends Record<string, unknown> {
  id: string;
  code: string;
  title: string;
  scope: ContractClauseScope;
  audience: ContractClauseAudience;
  status: ContractClauseStatus;
  sort_order: number;
  current_version_id: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

interface VersionRow extends Record<string, unknown> {
  id: string;
  clause_id: string;
  version_number: number;
  body: string;
  status: ContractClauseVersionStatus;
  published_at: string | null;
  created_at: string;
}

interface QuoteClauseRow extends Record<string, unknown> {
  id: string;
  quote_id: string;
  source_key: string;
  source_kind: QuoteContractClauseSource;
  source_clause_id: string | null;
  source_clause_version_id: string | null;
  source_catalog_item_ids_json: string;
  title: string;
  body: string;
  sort_order: number;
  enabled: number;
  is_customized: number;
  is_orphaned: number;
  created_at: string;
  updated_at: string;
}

interface QuoteStateRow extends Record<string, unknown> {
  id: string;
  quote_number: string;
  status: string;
  finalized_at: string | null;
  special_terms: string | null;
  contract_text_snapshot: string | null;
  contract_snapshot_json: string | null;
  contract_compiled_at: string | null;
  contract_audience: QuoteContractAudience | null;
}

interface QuoteLineSourceRow extends Record<string, unknown> {
  id: string;
  catalog_item_id: string | null;
  catalog_version_id: string | null;
  label: string;
  snapshot_json: string | null;
}

interface PublishedTemplateRow extends Record<string, unknown> {
  id: string;
  title: string;
  scope: ContractClauseScope;
  sort_order: number;
  version_id: string;
  body: string;
}

interface LinkedTemplateRow extends PublishedTemplateRow {
  catalog_item_id: string;
  link_sort_order: number;
}

interface DesiredClause {
  sourceKey: string;
  sourceKind: QuoteContractClauseSource;
  sourceClauseId: string | null;
  sourceClauseVersionId: string | null;
  sourceCatalogItemIds: string[];
  title: string;
  body: string;
  sortOrder: number;
}

export class ContractTermsService {
  constructor(private readonly database: DatabaseAdapter) {}

  listTemplates(includeArchived = false): ContractClauseTemplate[] {
    const rows = this.database.all<TemplateRow>(
      `SELECT * FROM contract_clause_templates
       ${includeArchived ? '' : "WHERE status <> 'archived'"}
       ORDER BY CASE scope WHEN 'base' THEN 0 ELSE 1 END, sort_order, title COLLATE NOCASE`,
    );
    return rows.map((row) => this.getTemplate(row.id));
  }

  getTemplate(id: string): ContractClauseTemplate {
    const row = this.database.get<TemplateRow>('SELECT * FROM contract_clause_templates WHERE id=?', [id]);
    if (!row) throw new Error('Clause contractuelle introuvable.');
    const versions = this.database
      .all<VersionRow>('SELECT * FROM contract_clause_versions WHERE clause_id=? ORDER BY version_number DESC', [id])
      .map((version) => this.mapVersion(version));
    const catalogItemIds = this.database
      .all<{ catalog_item_id: string }>('SELECT catalog_item_id FROM catalog_contract_clause_links WHERE clause_id=? ORDER BY sort_order, catalog_item_id', [id])
      .map((link) => link.catalog_item_id);
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      scope: row.scope,
      audience: row.audience,
      status: row.status,
      sortOrder: Number(row.sort_order),
      currentVersionId: row.current_version_id,
      currentVersion: row.current_version_id ? versions.find((version) => version.id === row.current_version_id) ?? null : null,
      versions,
      catalogItemIds,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at,
    };
  }

  createTemplate(input: ContractClauseTemplateInput, firstVersion: ContractClauseVersionInput): ContractClauseTemplate {
    const code = clean(input.code)?.toUpperCase();
    const title = clean(input.title);
    if (!code) throw new Error('Le code de la clause est requis.');
    if (!/^[A-Z0-9][A-Z0-9._-]*$/.test(code)) throw new Error('Le code de la clause ne peut contenir que lettres, chiffres, points, tirets et underscores.');
    if (!title) throw new Error('Le titre de la clause est requis.');
    if (!CONTRACT_CLAUSE_SCOPES.includes(input.scope)) throw new Error('Type de clause invalide.');
    const audience = input.audience ?? 'all';
    if (!CONTRACT_CLAUSE_AUDIENCES.includes(audience)) throw new Error('Public contractuel invalide.');
    if (this.database.get<{ id: string }>('SELECT id FROM contract_clause_templates WHERE code=? COLLATE NOCASE', [code])) {
      throw new Error('Ce code de clause existe déjà.');
    }

    const id = randomUUID();
    const versionId = randomUUID();
    const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run(
        `INSERT INTO contract_clause_templates
         (id,code,title,scope,audience,status,sort_order,current_version_id,created_at,updated_at,archived_at)
         VALUES (?,?,?,?,?,'active',?,NULL,?,?,NULL)`,
        [id, code, title, input.scope, audience, Math.trunc(input.sortOrder ?? 0), now, now],
      );
      this.database.run(
        `INSERT INTO contract_clause_versions
         (id,clause_id,version_number,body,status,published_at,created_at)
         VALUES (?,?,1,?,'draft',NULL,?)`,
        [versionId, id, firstVersion.body ?? '', now],
      );
      this.writeActivity('contract_clause', id, 'contract_clause_created', `Clause ${code} créée`);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    return this.getTemplate(id);
  }

  createVersion(clauseId: string, input: ContractClauseVersionInput): ContractClauseVersion {
    const template = this.getTemplate(clauseId);
    if (template.status === 'archived') throw new Error('Réactive la clause avant de créer une nouvelle version.');
    const next = this.database.get<{ next_version: number }>(
      'SELECT COALESCE(MAX(version_number),0)+1 AS next_version FROM contract_clause_versions WHERE clause_id=?',
      [clauseId],
    );
    const id = randomUUID();
    const now = nowIso();
    this.database.run(
      `INSERT INTO contract_clause_versions
       (id,clause_id,version_number,body,status,published_at,created_at)
       VALUES (?,?,?,?, 'draft', NULL, ?)`,
      [id, clauseId, Number(next?.next_version ?? 1), input.body ?? '', now],
    );
    this.database.run('UPDATE contract_clause_templates SET updated_at=? WHERE id=?', [now, clauseId]);
    this.writeActivity('contract_clause', clauseId, 'contract_clause_version_created', `Nouvelle version de ${template.code}`);
    const row = this.database.get<VersionRow>('SELECT * FROM contract_clause_versions WHERE id=?', [id]);
    if (!row) throw new Error('Version contractuelle introuvable après création.');
    return this.mapVersion(row);
  }

  publishVersion(versionId: string): ContractClauseTemplate {
    const version = this.database.get<VersionRow>('SELECT * FROM contract_clause_versions WHERE id=?', [versionId]);
    if (!version) throw new Error('Version de clause introuvable.');
    const body = clean(version.body);
    if (!body) throw new Error('Le texte de la clause doit être renseigné avant publication.');
    if (/\[À RENSEIGNER/i.test(body)) throw new Error('Cette clause contient encore un placeholder « À RENSEIGNER » et ne peut pas être publiée.');
    const template = this.getTemplate(version.clause_id);
    if (template.status === 'archived') throw new Error('Réactive la clause avant publication.');

    const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run(
        "UPDATE contract_clause_versions SET status='retired' WHERE clause_id=? AND status='published' AND id<>?",
        [version.clause_id, versionId],
      );
      this.database.run(
        "UPDATE contract_clause_versions SET status='published',published_at=? WHERE id=?",
        [now, versionId],
      );
      this.database.run(
        'UPDATE contract_clause_templates SET current_version_id=?,updated_at=? WHERE id=?',
        [versionId, now, version.clause_id],
      );
      this.writeActivity('contract_clause', version.clause_id, 'contract_clause_version_published', `Version ${version.version_number} de ${template.code} publiée`);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    return this.getTemplate(version.clause_id);
  }

  setTemplateStatus(id: string, status: ContractClauseStatus): ContractClauseTemplate {
    if (!CONTRACT_CLAUSE_STATUSES.includes(status)) throw new Error('Statut de clause invalide.');
    const template = this.getTemplate(id);
    const now = nowIso();
    this.database.run(
      'UPDATE contract_clause_templates SET status=?,archived_at=?,updated_at=? WHERE id=?',
      [status, status === 'archived' ? now : null, now, id],
    );
    this.writeActivity('contract_clause', id, 'contract_clause_status_changed', `${template.code} · ${status}`);
    return this.getTemplate(id);
  }

  setTemplateAudience(id: string, audience: ContractClauseAudience): ContractClauseTemplate {
    if (!CONTRACT_CLAUSE_AUDIENCES.includes(audience)) throw new Error('Public contractuel invalide.');
    const template = this.getTemplate(id);
    if (template.status === 'archived') throw new Error('Réactive la clause avant de modifier son public.');
    const now = nowIso();
    this.database.run('UPDATE contract_clause_templates SET audience=?,updated_at=? WHERE id=?', [audience, now, id]);
    this.writeActivity('contract_clause', id, 'contract_clause_audience_changed', `${template.code} · public ${audience}`);
    return this.getTemplate(id);
  }

  setCatalogLinks(id: string, catalogItemIds: string[]): ContractClauseTemplate {
    const template = this.getTemplate(id);
    if (template.scope !== 'catalog') throw new Error('Seules les clauses de prestation peuvent être liées au catalogue.');
    const unique = [...new Set(catalogItemIds.map((item) => item.trim()).filter(Boolean))];
    for (const itemId of unique) {
      if (!this.database.get<{ id: string }>('SELECT id FROM catalog_items WHERE id=?', [itemId])) {
        throw new Error('Une prestation liée au contrat est introuvable dans le catalogue.');
      }
    }

    const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      this.database.run('DELETE FROM catalog_contract_clause_links WHERE clause_id=?', [id]);
      unique.forEach((itemId, index) => this.database.run(
        'INSERT INTO catalog_contract_clause_links (catalog_item_id,clause_id,sort_order,created_at) VALUES (?,?,?,?)',
        [itemId, id, index, now],
      ));
      this.database.run('UPDATE contract_clause_templates SET updated_at=? WHERE id=?', [now, id]);
      this.writeActivity('contract_clause', id, 'contract_clause_catalog_links_changed', `${template.code} · ${unique.length} prestation(s)`);
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    return this.getTemplate(id);
  }

  getQuoteBuild(quoteId: string): QuoteContractBuild {
    const state = this.quoteState(quoteId);
    const frozen = this.hasSnapshot(state);
    const locked = frozen || state.status !== 'draft' || Boolean(state.finalized_at);
    const snapshotState = frozen ? 'frozen' : locked ? 'historical_missing' : 'draft';
    const clauses = this.quoteClauses(quoteId);
    const audience = this.resolveQuoteAudience(state);
    const compiledText = this.compile(clauses);
    const warnings: string[] = [];
    if (snapshotState === 'historical_missing') {
      warnings.push('Devis historique sans snapshot contractuel : cette absence est conservée. Aucune reconstruction depuis la bibliothèque actuelle.');
    } else if (frozen && (state.contract_text_snapshot === null || state.contract_snapshot_json === null)) {
      warnings.push('Snapshot historique incomplet : les données conservées ne sont pas recalculées.');
    }
    if (!clauses.some((clause) => clause.sourceKind === 'base' && clause.enabled && !clause.isOrphaned)) {
      warnings.push('Aucune clause publiée du socle CGV n’est incluse.');
    }
    if (clauses.some((clause) => clause.enabled && !clean(clause.body))) {
      warnings.push('Au moins une clause incluse ne contient aucun texte.');
    }
    if (clauses.some((clause) => clause.isOrphaned && clause.enabled)) {
      warnings.push('Une clause liée à une prestation retirée est encore incluse.');
    }
    if (clauses.some((clause) => clause.enabled && /\[À RENSEIGNER/i.test(clause.body))) {
      warnings.push('Au moins une clause contient encore un placeholder « À RENSEIGNER ».');
    }
    const dedicatedAudienceClause = this.database.get<{ id: string }>(
      `SELECT qc.id
       FROM quote_contract_clauses qc
       JOIN contract_clause_templates t ON t.id=qc.source_clause_id
       WHERE qc.quote_id=? AND qc.enabled=1 AND qc.is_orphaned=0 AND t.audience=?
       LIMIT 1`,
      [quoteId, audience],
    );
    if (!dedicatedAudienceClause) {
      warnings.push(audience === 'consumer'
        ? 'Aucune clause dédiée aux particuliers / consommateurs n’est incluse.'
        : 'Aucune clause dédiée aux clients professionnels n’est incluse.');
    }
    return {
      quoteId,
      audience,
      locked,
      snapshotState,
      clauses,
      compiledText,
      snapshotText: state.contract_text_snapshot,
      compiledAt: state.contract_compiled_at,
      warnings,
    };
  }

  syncQuote(quoteId: string): QuoteContractBuild {
    this.assertQuoteEditable(quoteId);
    this.syncQuoteInternal(quoteId);
    this.writeActivity('quote', quoteId, 'quote_contract_synced', 'CGV synchronisées avec les prestations du devis');
    return this.getQuoteBuild(quoteId);
  }

  addCustomQuoteClause(quoteId: string, input: QuoteContractClauseInput): QuoteContractBuild {
    this.assertQuoteEditable(quoteId);
    const title = clean(input.title);
    if (!title) throw new Error('Le titre de la clause particulière est requis.');
    const next = this.database.get<{ next_order: number }>(
      'SELECT COALESCE(MAX(sort_order),1990)+10 AS next_order FROM quote_contract_clauses WHERE quote_id=?',
      [quoteId],
    );
    const now = nowIso();
    this.database.run(
      `INSERT INTO quote_contract_clauses
       (id,quote_id,source_key,source_kind,source_clause_id,source_clause_version_id,source_catalog_item_ids_json,
        title,body,sort_order,enabled,is_customized,is_orphaned,created_at,updated_at)
       VALUES (?,?,?,'custom',NULL,NULL,'[]',?,?,?,?,1,0,?,?)`,
      [
        randomUUID(), quoteId, `custom:${randomUUID()}`, title, input.body ?? '',
        Number(next?.next_order ?? 2000), input.enabled === false ? 0 : 1, now, now,
      ],
    );
    this.writeActivity('quote', quoteId, 'quote_contract_custom_clause_added', `Clause particulière ajoutée : ${title}`);
    return this.getQuoteBuild(quoteId);
  }

  updateQuoteClause(id: string, input: QuoteContractClauseUpdate): QuoteContractBuild {
    const row = this.database.get<QuoteClauseRow>('SELECT * FROM quote_contract_clauses WHERE id=?', [id]);
    if (!row) throw new Error('Clause du devis introuvable.');
    this.assertQuoteEditable(row.quote_id);
    if (row.source_kind === 'base') {
      if (input.enabled === false) throw new Error('Le socle CGV AtoumWeb est fixe et ne peut pas être exclu d’un devis.');
      if (input.title !== undefined || input.body !== undefined) {
        throw new Error('Une clause du socle fixe se modifie dans la Bibliothèque CGV, par nouvelle version.');
      }
    }
    const nextTitle = input.title === undefined ? row.title : clean(input.title);
    if (!nextTitle) throw new Error('Le titre de la clause est requis.');
    const nextBody = input.body === undefined ? row.body : input.body;
    const nextEnabled = input.enabled === undefined ? Boolean(row.enabled) : input.enabled;
    const textCustomized = input.title !== undefined || input.body !== undefined;
    this.database.run(
      `UPDATE quote_contract_clauses
       SET title=?,body=?,enabled=?,is_customized=?,updated_at=? WHERE id=?`,
      [nextTitle, nextBody, nextEnabled ? 1 : 0, textCustomized ? 1 : row.is_customized, nowIso(), id],
    );
    this.writeActivity('quote', row.quote_id, 'quote_contract_clause_updated', `Clause du devis mise à jour : ${nextTitle}`);
    return this.getQuoteBuild(row.quote_id);
  }

  resetQuoteClause(id: string): QuoteContractBuild {
    const row = this.database.get<QuoteClauseRow>('SELECT * FROM quote_contract_clauses WHERE id=?', [id]);
    if (!row) throw new Error('Clause du devis introuvable.');
    this.assertQuoteEditable(row.quote_id);
    if (row.source_kind === 'base') throw new Error('Le socle fixe reprend toujours la version publiée de la Bibliothèque CGV.');
    if (!row.source_clause_id) throw new Error('Cette clause particulière ne dépend pas d’un modèle réinitialisable.');
    const template = this.getTemplate(row.source_clause_id);
    if (!template.currentVersion) throw new Error('Aucune version publiée n’est disponible pour cette clause.');
    this.database.run(
      `UPDATE quote_contract_clauses
       SET title=?,body=?,source_clause_version_id=?,enabled=1,is_customized=0,updated_at=? WHERE id=?`,
      [template.title, template.currentVersion.body, template.currentVersion.id, nowIso(), id],
    );
    this.writeActivity('quote', row.quote_id, 'quote_contract_clause_reset', `Clause réinitialisée : ${template.title}`);
    return this.getQuoteBuild(row.quote_id);
  }

  removeCustomQuoteClause(id: string): QuoteContractBuild {
    const row = this.database.get<QuoteClauseRow>('SELECT * FROM quote_contract_clauses WHERE id=?', [id]);
    if (!row) throw new Error('Clause du devis introuvable.');
    this.assertQuoteEditable(row.quote_id);
    if (!row.source_key.startsWith('custom:')) throw new Error('Une clause automatique doit être désactivée, pas supprimée.');
    this.database.run('DELETE FROM quote_contract_clauses WHERE id=?', [id]);
    this.writeActivity('quote', row.quote_id, 'quote_contract_custom_clause_removed', `Clause particulière supprimée : ${row.title}`);
    return this.getQuoteBuild(row.quote_id);
  }

  reorderQuoteClauses(quoteId: string, clauseIds: string[]): QuoteContractBuild {
    this.assertQuoteEditable(quoteId);
    const existing = this.database.all<{ id: string }>(
      'SELECT id FROM quote_contract_clauses WHERE quote_id=? ORDER BY sort_order,created_at',
      [quoteId],
    ).map((row) => row.id);
    if (existing.length !== clauseIds.length || new Set(clauseIds).size !== clauseIds.length || existing.some((id) => !clauseIds.includes(id))) {
      throw new Error('La liste de réordonnancement des clauses est incomplète.');
    }
    const now = nowIso();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      clauseIds.forEach((id, index) => this.database.run(
        'UPDATE quote_contract_clauses SET sort_order=?,updated_at=? WHERE id=? AND quote_id=?',
        [index * 10, now, id, quoteId],
      ));
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
    this.writeActivity('quote', quoteId, 'quote_contract_reordered', 'Ordre des clauses du devis modifié');
    return this.getQuoteBuild(quoteId);
  }

  freezeQuote(quoteId: string): QuoteContractBuild {
    const state = this.quoteState(quoteId);
    // A timestamp/JSON (including an empty clause list) is evidence of freezing.
    // Locked legacy quotes must retain their historical absence, even with instances.
    if (this.hasSnapshot(state) || state.status !== 'draft' || state.finalized_at) return this.getQuoteBuild(quoteId);
    this.syncQuoteInternal(quoteId);
    const clauses = this.quoteClauses(quoteId);
    const audience = this.resolveQuoteAudience(state);
    const compiledText = this.compile(clauses);
    const included = clauses.filter((clause) => clause.enabled);
    const now = nowIso();
    this.database.run(
      `UPDATE quotes
       SET contract_text_snapshot=?,contract_snapshot_json=?,contract_compiled_at=?,contract_audience=?,updated_at=?
       WHERE id=?`,
      [compiledText, JSON.stringify({ audience, clauses: included }), now, audience, now, quoteId],
    );
    this.writeActivity('quote', quoteId, 'quote_contract_frozen', 'Version contractuelle des CGV figée');
    return this.getQuoteBuild(quoteId);
  }

  copyQuoteCustomizations(sourceQuoteId: string, targetQuoteId: string): QuoteContractBuild {
    this.assertQuoteEditable(targetQuoteId);
    this.syncQuoteInternal(targetQuoteId);
    const source = this.quoteClauses(sourceQuoteId);
    const target = this.quoteClauses(targetQuoteId);
    const targetByKey = new Map(target.map((clause) => [clause.sourceKey, clause]));

    for (const clause of source) {
      if (clause.sourceKey.startsWith('custom:')) {
        this.addCustomQuoteClause(targetQuoteId, { title: clause.title, body: clause.body, enabled: clause.enabled });
        continue;
      }
      const match = targetByKey.get(clause.sourceKey);
      if (!match) continue;
      this.database.run(
        `UPDATE quote_contract_clauses
         SET enabled=?,title=?,body=?,is_customized=?,updated_at=? WHERE id=?`,
        [
          clause.enabled ? 1 : 0,
          clause.isCustomized ? clause.title : match.title,
          clause.isCustomized ? clause.body : match.body,
          clause.isCustomized ? 1 : match.isCustomized ? 1 : 0,
          nowIso(),
          match.id,
        ],
      );
    }
    return this.getQuoteBuild(targetQuoteId);
  }

  private syncQuoteInternal(quoteId: string): void {
    const state = this.quoteState(quoteId);
    if (this.hasSnapshot(state) || state.status !== 'draft' || state.finalized_at) {
      throw new Error('Les CGV de ce devis sont figées. Duplique le devis pour les modifier.');
    }

    const desired = this.desiredClauses(quoteId, state);
    const existing = this.database.all<QuoteClauseRow>(
      'SELECT * FROM quote_contract_clauses WHERE quote_id=? ORDER BY sort_order,created_at',
      [quoteId],
    );
    const existingByKey = new Map(existing.map((row) => [row.source_key, row]));
    const now = nowIso();

    this.database.exec('BEGIN IMMEDIATE;');
    try {
      for (const clause of desired.values()) {
        const row = existingByKey.get(clause.sourceKey);
        if (row) {
          const reenable = Boolean(row.is_orphaned) && !Boolean(row.is_customized);
          this.database.run(
            `UPDATE quote_contract_clauses SET
             source_kind=?,source_clause_id=?,source_clause_version_id=?,source_catalog_item_ids_json=?,
             title=?,body=?,enabled=?,is_orphaned=0,updated_at=? WHERE id=?`,
            [
              clause.sourceKind,
              clause.sourceClauseId,
              row.is_customized ? row.source_clause_version_id : clause.sourceClauseVersionId,
              JSON.stringify(clause.sourceCatalogItemIds),
              row.is_customized ? row.title : clause.title,
              row.is_customized ? row.body : clause.body,
              reenable ? 1 : row.enabled,
              now,
              row.id,
            ],
          );
        } else {
          this.database.run(
            `INSERT INTO quote_contract_clauses
             (id,quote_id,source_key,source_kind,source_clause_id,source_clause_version_id,source_catalog_item_ids_json,
              title,body,sort_order,enabled,is_customized,is_orphaned,created_at,updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,1,0,0,?,?)`,
            [
              randomUUID(), quoteId, clause.sourceKey, clause.sourceKind, clause.sourceClauseId, clause.sourceClauseVersionId,
              JSON.stringify(clause.sourceCatalogItemIds), clause.title, clause.body, clause.sortOrder, now, now,
            ],
          );
        }
      }

      for (const row of existing) {
        if (desired.has(row.source_key) || row.source_key.startsWith('custom:')) continue;
        const autoDisable = !Boolean(row.is_customized);
        this.database.run(
          'UPDATE quote_contract_clauses SET is_orphaned=1,enabled=?,updated_at=? WHERE id=?',
          [autoDisable ? 0 : row.enabled, now, row.id],
        );
      }
      this.database.exec('COMMIT;');
    } catch (error) {
      this.database.exec('ROLLBACK;');
      throw error;
    }
  }

  private desiredClauses(quoteId: string, state: QuoteStateRow): Map<string, DesiredClause> {
    const desired = new Map<string, DesiredClause>();
    const audience = this.resolveQuoteAudience(state);
    const baseRows = this.database.all<PublishedTemplateRow>(
      `SELECT t.id,t.title,t.scope,t.sort_order,v.id AS version_id,v.body
       FROM contract_clause_templates t
       JOIN contract_clause_versions v ON v.id=t.current_version_id
       WHERE t.scope='base' AND t.status='active' AND v.status='published'
         AND t.audience IN ('all', ?)
       ORDER BY t.sort_order,t.title COLLATE NOCASE`,
      [audience],
    );
    baseRows.forEach((row, index) => desired.set(`template:${row.id}`, {
      sourceKey: `template:${row.id}`,
      sourceKind: 'base',
      sourceClauseId: row.id,
      sourceClauseVersionId: row.version_id,
      sourceCatalogItemIds: [],
      title: row.title,
      body: row.body,
      sortOrder: index * 10,
    }));

    const lines = this.database.all<QuoteLineSourceRow>(
      'SELECT id,catalog_item_id,catalog_version_id,label,snapshot_json FROM quote_lines WHERE quote_id=? ORDER BY sort_order,created_at',
      [quoteId],
    );
    const catalogItemIds = new Set<string>();
    const componentLegacyTerms: Array<{ itemId: string; versionId: string | null; name: string; body: string }> = [];
    const lineSnapshots: Array<{ row: QuoteLineSourceRow; snapshot: Record<string, unknown> | null }> = [];
    for (const row of lines) {
      if (row.catalog_item_id) catalogItemIds.add(row.catalog_item_id);
      let snapshot: Record<string, unknown> | null = null;
      if (row.snapshot_json) {
        try {
          const parsed = JSON.parse(row.snapshot_json) as unknown;
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) snapshot = parsed as Record<string, unknown>;
        } catch {
          snapshot = null;
        }
      }
      const components = Array.isArray(snapshot?.offerComponents) ? snapshot.offerComponents : [];
      for (const raw of components) {
        if (!raw || typeof raw !== 'object') continue;
        const component = raw as Record<string, unknown>;
        if (component.isOptional) continue;
        if (typeof component.serviceItemId === 'string' && component.serviceItemId) {
          catalogItemIds.add(component.serviceItemId);
          const componentTerms = typeof component.specialTerms === 'string' ? clean(component.specialTerms) : null;
          if (componentTerms) {
            componentLegacyTerms.push({
              itemId: component.serviceItemId,
              versionId: typeof component.serviceVersionId === 'string' ? component.serviceVersionId : null,
              name: typeof component.serviceName === 'string' ? component.serviceName : 'Prestation',
              body: componentTerms,
            });
          }
        }
      }
      lineSnapshots.push({ row, snapshot });
    }

    const linkedItemIds = new Set<string>();
    if (catalogItemIds.size > 0) {
      const ids = [...catalogItemIds];
      const placeholders = ids.map(() => '?').join(',');
      const linked = this.database.all<LinkedTemplateRow>(
        `SELECT l.catalog_item_id,l.sort_order AS link_sort_order,
                t.id,t.title,t.scope,t.sort_order,v.id AS version_id,v.body
         FROM catalog_contract_clause_links l
         JOIN contract_clause_templates t ON t.id=l.clause_id
         JOIN contract_clause_versions v ON v.id=t.current_version_id
         WHERE l.catalog_item_id IN (${placeholders})
           AND t.scope='catalog' AND t.status='active' AND v.status='published'
           AND t.audience IN ('all', ?)
         ORDER BY l.sort_order,t.sort_order,t.title COLLATE NOCASE`,
        [...ids, audience] as SqlValue[],
      );

      const grouped = new Map<string, { row: LinkedTemplateRow; itemIds: Set<string> }>();
      for (const row of linked) {
        linkedItemIds.add(row.catalog_item_id);
        const current = grouped.get(row.id);
        if (current) current.itemIds.add(row.catalog_item_id);
        else grouped.set(row.id, { row, itemIds: new Set([row.catalog_item_id]) });
      }
      let index = 0;
      for (const { row, itemIds } of grouped.values()) {
        desired.set(`template:${row.id}`, {
          sourceKey: `template:${row.id}`,
          sourceKind: 'catalog',
          sourceClauseId: row.id,
          sourceClauseVersionId: row.version_id,
          sourceCatalogItemIds: [...itemIds],
          title: row.title,
          body: row.body,
          sortOrder: 1000 + index * 10,
        });
        index += 1;
      }
    }

    let legacyIndex = 0;
    for (const { row, snapshot } of lineSnapshots) {
      if (!row.catalog_item_id || linkedItemIds.has(row.catalog_item_id)) continue;
      const specialTerms = typeof snapshot?.specialTerms === 'string' ? clean(snapshot.specialTerms) : null;
      if (!specialTerms) continue;
      const sourceId = row.catalog_version_id ?? row.catalog_item_id;
      const sourceKey = `legacy-catalog:${sourceId}`;
      if (desired.has(sourceKey)) continue;
      desired.set(sourceKey, {
        sourceKey,
        sourceKind: 'catalog',
        sourceClauseId: null,
        sourceClauseVersionId: null,
        sourceCatalogItemIds: [row.catalog_item_id],
        title: `Conditions spécifiques — ${row.label}`,
        body: specialTerms,
        sortOrder: 1500 + legacyIndex * 10,
      });
      legacyIndex += 1;
    }

    for (const component of componentLegacyTerms) {
      if (linkedItemIds.has(component.itemId)) continue;
      const sourceKey = `legacy-catalog:${component.versionId ?? component.itemId}`;
      if (desired.has(sourceKey)) continue;
      desired.set(sourceKey, {
        sourceKey,
        sourceKind: 'catalog',
        sourceClauseId: null,
        sourceClauseVersionId: null,
        sourceCatalogItemIds: [component.itemId],
        title: `Conditions spécifiques — ${component.name}`,
        body: component.body,
        sortOrder: 1500 + legacyIndex * 10,
      });
      legacyIndex += 1;
    }

    const legacySpecialTerms = clean(state.special_terms);
    const duplicatesExistingTerm = legacySpecialTerms
      ? [...desired.values()].some((clause) => clause.body.trim() === legacySpecialTerms)
      : false;
    if (legacySpecialTerms && !duplicatesExistingTerm) {
      desired.set('legacy:quote-special', {
        sourceKey: 'legacy:quote-special',
        sourceKind: 'custom',
        sourceClauseId: null,
        sourceClauseVersionId: null,
        sourceCatalogItemIds: [],
        title: 'Conditions particulières',
        body: legacySpecialTerms,
        sortOrder: 2000,
      });
    }
    return desired;
  }

  private quoteState(quoteId: string): QuoteStateRow {
    const row = this.database.get<QuoteStateRow>(
      `SELECT id,quote_number,status,finalized_at,special_terms,
              contract_text_snapshot,contract_snapshot_json,contract_compiled_at,contract_audience
       FROM quotes WHERE id=?`,
      [quoteId],
    );
    if (!row) throw new Error('Devis introuvable.');
    return row;
  }

  private resolveQuoteAudience(state: QuoteStateRow): QuoteContractAudience {
    if (state.contract_audience) return state.contract_audience;
    const owner = this.database.get<{ client_organization_id: string | null; prospect_organization_id: string | null }>(
      `SELECT ca.organization_id AS client_organization_id, p.organization_id AS prospect_organization_id
       FROM quotes q
       LEFT JOIN client_accounts ca ON ca.id=COALESCE(q.client_account_id,q.accepted_client_account_id)
       LEFT JOIN prospects p ON p.id=q.prospect_id
       WHERE q.id=?`,
      [state.id],
    );
    return owner?.client_organization_id || owner?.prospect_organization_id ? 'professional' : 'consumer';
  }

  private assertQuoteEditable(quoteId: string): void {
    const state = this.quoteState(quoteId);
    if (this.hasSnapshot(state) || state.status !== 'draft' || state.finalized_at) {
      throw new Error('Les CGV de ce devis sont figées. Duplique le devis pour les modifier.');
    }
  }

  private hasSnapshot(state: QuoteStateRow): boolean {
    return state.contract_compiled_at !== null || state.contract_text_snapshot !== null || state.contract_snapshot_json !== null;
  }

  private quoteClauses(quoteId: string): QuoteContractClause[] {
    return this.database
      .all<QuoteClauseRow>('SELECT * FROM quote_contract_clauses WHERE quote_id=? ORDER BY sort_order,created_at', [quoteId])
      .map((row) => this.mapQuoteClause(row));
  }

  private compile(clauses: QuoteContractClause[]): string {
    const included = clauses.filter((clause) => clause.enabled);
    if (included.length === 0) return '';
    const body = included.map((clause, index) => {
      const text = clause.body.trim();
      return `${index + 1}. ${clause.title.trim()}\n${text}`.trimEnd();
    }).join('\n\n');
    return `CONDITIONS GÉNÉRALES DE VENTE – ATOUMWEB\n\n${body}`;
  }

  private mapVersion(row: VersionRow): ContractClauseVersion {
    return {
      id: row.id,
      clauseId: row.clause_id,
      versionNumber: Number(row.version_number),
      body: row.body,
      status: row.status,
      publishedAt: row.published_at,
      createdAt: row.created_at,
    };
  }

  private mapQuoteClause(row: QuoteClauseRow): QuoteContractClause {
    let sourceCatalogItemIds: string[] = [];
    try {
      const parsed = JSON.parse(row.source_catalog_item_ids_json) as unknown;
      if (Array.isArray(parsed)) sourceCatalogItemIds = parsed.filter((value): value is string => typeof value === 'string');
    } catch {
      sourceCatalogItemIds = [];
    }
    return {
      id: row.id,
      quoteId: row.quote_id,
      sourceKey: row.source_key,
      sourceKind: row.source_kind,
      sourceClauseId: row.source_clause_id,
      sourceClauseVersionId: row.source_clause_version_id,
      sourceCatalogItemIds,
      title: row.title,
      body: row.body,
      sortOrder: Number(row.sort_order),
      enabled: Boolean(row.enabled),
      isCustomized: Boolean(row.is_customized),
      isOrphaned: Boolean(row.is_orphaned),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private writeActivity(entityType: string, entityId: string, action: string, summary: string): void {
    this.database.run(
      'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,NULL,?)',
      [entityType, entityId, action, summary, nowIso()],
    );
  }
}
