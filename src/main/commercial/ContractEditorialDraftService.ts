import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import { ContractTermsService } from './ContractTermsService';
import type { ContractClauseAudience, ContractClauseReviewMetadata } from '../../shared/contractTerms';

export interface ContractEditorialProposal {
  /** Explicit versioned source pack, including a historical unpublished source. */
  allowUnpublishedSource?: boolean;
  review?: ContractClauseReviewMetadata;
  code: string;
  sourceAudience?: ContractClauseAudience;
  proposal: string;
  proposedTitle?: string | null;
  proposedCode?: string | null;
  proposedAudience?: ContractClauseAudience | null;
  sourceBodySHA256?: string | null;
  approval: unknown;
  publication: boolean;
  adoption: boolean;
  origin: {
    templateId: string;
    currentVersionId: string | null;
    versionId: string;
    version: number;
    versionStatus: string;
    body: string;
    title: string;
    code?: string;
    audience?: ContractClauseAudience;
  };
  newClause?: { scope: 'base' | 'catalog'; audience?: ContractClauseAudience; sortOrder?: number };
}

export interface ContractEditorialProposalDocument {
  schemaVersion?: number;
  reference?: string;
  source?: { filename: string; sha256: string };
  expectedClauseCount?: number;
  clauses: ContractEditorialProposal[];
}

export interface ContractEditorialDraftPlan {
  payloadSha256: string;
  planSha256: string;
  rows: Array<{ code: string; action: 'create' | 'keep' | 'conflict'; sourceVersionId: string; title: string;
    proposedCode: string; proposedAudience: ContractClauseAudience; anomaly: string | null }>;
  counts: { draftsToCreate: number; draftsKept: number; conflicts: number };
  anomalies: string[];
}

const stableHash = (value: unknown): string => createHash('sha256').update(JSON.stringify(value, null, 2) + '\n').digest('hex');
const textHash = (value: string): string => createHash('sha256').update(value).digest('hex');
const duplicateValues = (values: string[]): string[] => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];

/**
 * Imports approved-for-preparation editorial text as new drafts only.
 * It never updates a template, a published version, a quote or a snapshot.
 */
export class ContractEditorialDraftService {
  constructor(private readonly database: DatabaseAdapter) {}

  simulate(document: ContractEditorialProposalDocument, sourceReference: string): ContractEditorialDraftPlan {
    const payloadSha256 = stableHash({ sourceReference, document });
    const structural: string[] = [];
    if (!sourceReference.trim()) structural.push('Référence de la proposition absente.');
    const expectedClauseCount = document.expectedClauseCount ?? (document.reference?.includes('V3.8') ? 119 : 118);
    if (!Array.isArray(document.clauses) || document.clauses.length !== expectedClauseCount) structural.push(`Le registre éditorial doit contenir exactement ${expectedClauseCount} clauses.`);
    for (const code of duplicateValues(document.clauses.map((clause) => clause.code))) structural.push(`${code} : code éditorial dupliqué.`);

    const terms = new ContractTermsService(this.database);
    const rows = document.clauses.map((proposal) => {
      const isNew = Boolean(proposal.newClause);
      let sourceVersionId = isNew ? '' : proposal.origin.versionId;
      let title = proposal.proposedTitle?.trim() || proposal.origin.title;
      const proposedCode = (proposal.proposedCode?.trim() || proposal.code).toUpperCase();
      const proposedAudience = proposal.proposedAudience ?? proposal.newClause?.audience ?? proposal.origin.audience ?? 'all';
      let anomaly: string | null = null;
      let action: 'create' | 'keep' | 'conflict' = 'conflict';
      const templateRow = isNew
        ? this.database.get<{ id: string; code: string }>('SELECT id,code FROM contract_clause_templates WHERE code=? COLLATE NOCASE', [proposedCode])
        : this.database.get<{ id: string; code: string }>('SELECT id,code FROM contract_clause_templates WHERE id=?', [proposal.origin.templateId]);
      if (isNew && !title) anomaly = `${proposal.code} : titre de la nouvelle clause absent.`;
      else if (isNew && !proposal.proposal?.trim()) anomaly = `${proposal.code} : proposition vide.`;
      else if (isNew && (proposal.approval || proposal.publication || proposal.adoption)) anomaly = `${proposal.code} : indicateurs documentaires incohérents avant préparation.`;
      else if (isNew && !templateRow) action = 'create';
      else if (!templateRow) anomaly = `${proposal.code} : clause publiée introuvable.`;
      else {
        const template = terms.getTemplate(templateRow.id);
        const source = isNew ? template.versions[0] : template.versions.find((version) => version.id === proposal.origin.versionId);
        sourceVersionId = source?.id ?? (isNew ? '' : proposal.origin.versionId);
        if (isNew) {
          const entry = this.database.get<{ draft_version_id: string; proposal_sha256: string }>(
            `SELECT e.draft_version_id,e.proposal_sha256 FROM contract_editorial_import_entries e
             JOIN contract_editorial_import_runs r ON r.id=e.run_id WHERE e.clause_id=? AND r.payload_sha256=? ORDER BY r.created_at DESC LIMIT 1`,
            [template.id, payloadSha256],
          );
          const proposalSha256 = stableHash({ code: proposedCode, audience: proposedAudience, title, body: proposal.proposal, sourceVersionId });
          const draft = entry ? template.versions.find((version) => version.id === entry.draft_version_id) : null;
          if (entry && entry.proposal_sha256 === proposalSha256 && draft?.status === 'draft' && draft.body === proposal.proposal
            && (draft.title??template.title)===title && (draft.code??template.code)===proposedCode && (draft.audience??template.audience)===proposedAudience
            && (!proposal.review||stableHash(draft.review)===stableHash(proposal.review))) action = 'keep';
          else anomaly = `${proposal.code} : la nouvelle clause existe déjà sans provenance identique.`;
        }
        else if (template.code.toUpperCase() !== (proposal.origin.code ?? proposal.code).toUpperCase()) anomaly = `${proposal.code} : code du modèle source différent.`;
        else if (!source || (source.status !== 'published' && !(proposal.allowUnpublishedSource&&source.status==='draft'&&proposal.origin.versionStatus==='draft')) || source.versionNumber !== proposal.origin.version) anomaly = `${proposal.code} : version source autorisée introuvable.`;
        else if (template.currentVersionId !== proposal.origin.currentVersionId) anomaly = `${proposal.code} : la version courante a changé depuis la proposition.`;
        else if (source.body !== proposal.origin.body || textHash(source.body) !== proposal.sourceBodySHA256) anomaly = `${proposal.code} : le corps source ou son empreinte a changé.`;
        else if (!proposal.proposal?.trim()) anomaly = `${proposal.code} : proposition vide.`;
        else if (proposal.approval || proposal.publication || proposal.adoption) anomaly = `${proposal.code} : indicateurs documentaires incohérents avant préparation.`;
        else {
          const entry = this.database.get<{ draft_version_id: string; source_version_id: string; proposal_sha256: string; payload_sha256: string }>(
            `SELECT e.draft_version_id,e.source_version_id,e.proposal_sha256,r.payload_sha256
               FROM contract_editorial_import_entries e
               JOIN contract_editorial_import_runs r ON r.id=e.run_id
              WHERE e.clause_id=? AND r.payload_sha256=? ORDER BY r.created_at DESC LIMIT 1`,
            [template.id, payloadSha256],
          );
          const proposalSha256 = stableHash({ code: proposedCode, audience: proposedAudience, title, body: proposal.proposal, sourceVersionId: source.id });
          const draft = entry ? template.versions.find((version) => version.id === entry.draft_version_id) : null;
          if (entry && entry.payload_sha256 === payloadSha256 && entry.source_version_id === source.id && entry.proposal_sha256 === proposalSha256
            && draft?.status === 'draft' && draft.body === proposal.proposal && (draft.title ?? template.title) === title
            && (draft.code ?? template.code) === proposedCode && (draft.audience ?? template.audience) === proposedAudience
            && (!proposal.review||stableHash(draft.review)===stableHash(proposal.review))) action = 'keep';
          else if (entry) anomaly = `${proposal.code} : un import éditorial antérieur existe mais son brouillon ou sa provenance diffère.`;
          else action = 'create';
        }
      }
      return { code: proposal.code, action, sourceVersionId, title, proposedCode, proposedAudience, anomaly };
    });
    const anomalies = [...structural, ...rows.flatMap((row) => row.anomaly ? [row.anomaly] : [])];
    const counts = {
      draftsToCreate: rows.filter((row) => row.action === 'create').length,
      draftsKept: rows.filter((row) => row.action === 'keep').length,
      conflicts: rows.filter((row) => row.action === 'conflict').length,
    };
    return { payloadSha256, planSha256: stableHash({ payloadSha256, rows, counts, anomalies }), rows, counts, anomalies };
  }

  apply(document: ContractEditorialProposalDocument, sourceReference: string, expectedPlanSha256: string, withinTransaction=false): ContractEditorialDraftPlan {
    const finish=()=>this.database.exec(withinTransaction?'RELEASE SAVEPOINT contract_pack_import;':'COMMIT;');
    this.database.exec(withinTransaction?'SAVEPOINT contract_pack_import;':'BEGIN IMMEDIATE;');
    try {
      const plan = this.simulate(document, sourceReference);
      if (plan.planSha256 !== expectedPlanSha256) throw new Error('Plan éditorial périmé : relancer la simulation.');
      if (plan.anomalies.length) throw new Error(`Préparation éditoriale refusée : ${plan.anomalies.join(' ; ')}`);
      if (!plan.counts.draftsToCreate) {
        finish();
        return plan;
      }
      const now = new Date().toISOString();
      const runId = randomUUID();
      this.database.run(
        'INSERT INTO contract_editorial_import_runs (id,payload_sha256,source_reference,summary_json,created_at) VALUES (?,?,?,?,?)',
        [runId, plan.payloadSha256, sourceReference, JSON.stringify({...plan.counts,origins:document.clauses.map(p=>({code:p.code,templateId:p.origin.templateId,currentVersionId:p.origin.currentVersionId,versionId:p.origin.versionId,newClause:p.newClause}))}), now],
      );
      const terms = new ContractTermsService(this.database);
      for (const row of plan.rows.filter((candidate) => candidate.action === 'create')) {
        const proposal = document.clauses.find((candidate) => candidate.code === row.code)!;
        const template = proposal.newClause
          ? terms.createTemplate({ code: row.proposedCode, title: row.title, scope: proposal.newClause.scope,
              audience: row.proposedAudience, sortOrder: proposal.newClause.sortOrder }, { title: row.title, body: proposal.proposal, review:proposal.review })
          : terms.getTemplate(proposal.origin.templateId);
        const source = proposal.newClause ? template.versions[0] : template.versions.find((version) => version.id === row.sourceVersionId)!;
        const draft = proposal.newClause ? source : terms.createVersion(template.id, { title: row.title, code: row.proposedCode,
          audience: row.proposedAudience, body: proposal.proposal, review: proposal.review??source.review });
        const proposalSha256 = stableHash({ code: row.proposedCode, audience: row.proposedAudience,
          title: row.title, body: proposal.proposal, sourceVersionId: source.id });
        this.database.run(
          `INSERT INTO contract_editorial_import_entries
           (run_id,clause_code,clause_id,source_version_id,draft_version_id,source_body_sha256,proposal_sha256)
           VALUES (?,?,?,?,?,?,?)`,
          [runId, proposal.code, template.id, source.id, draft.id, proposal.sourceBodySHA256 ?? textHash(source.body), proposalSha256],
        );
      }
      this.database.run(
        'INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
        ['contract_library', runId, 'contract_editorial_drafts_prepared', `${document.clauses.length} clauses préparées en nouvelles versions brouillon.`, JSON.stringify({ sourceReference, counts: plan.counts }), now],
      );
      const replay = this.simulate(document, sourceReference);
      if (replay.anomalies.length || replay.counts.draftsToCreate || replay.counts.conflicts || replay.counts.draftsKept !== document.clauses.length) {
        throw new Error('Contrôle post-import éditorial non conforme ; rollback complet.');
      }
      finish();
      return replay;
    } catch (error) {
      this.database.exec(withinTransaction?'ROLLBACK TO SAVEPOINT contract_pack_import; RELEASE SAVEPOINT contract_pack_import;':'ROLLBACK;');
      throw error;
    }
  }
}
