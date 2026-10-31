import proposalsJson from '../../../docs/ux-v2/bibliotheque-humaine-118-20261025/PROPOSITIONS.json';
import catalogJson from '../../../data/catalogue/atoumweb-commercial-convergence-20261031.json';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { ConvergenceDifference, ConvergenceReview } from '../../shared/convergenceReview';
import { CatalogService } from './CatalogService';
import { ContractTermsService } from './ContractTermsService';
import { ContractEditorialDraftService, type ContractEditorialProposalDocument } from './ContractEditorialDraftService';
import { CatalogCommercialConvergenceService, type CatalogCommercialConvergenceSource } from './CatalogCommercialConvergenceService';
import { createHash, randomUUID } from 'node:crypto';

const proposals = proposalsJson as ContractEditorialProposalDocument;
const catalogSource = catalogJson as CatalogCommercialConvergenceSource;
const editorialReference = 'Bibliothèque humaine 118 — propositions du 25 octobre 2026';

export class ConvergenceReviewService {
  private readonly editorial: ContractEditorialDraftService;
  private readonly commercial: CatalogCommercialConvergenceService;
  private readonly terms: ContractTermsService;
  private readonly catalog: CatalogService;
  constructor(private readonly database: DatabaseAdapter) {
    this.editorial = new ContractEditorialDraftService(database);
    this.commercial = new CatalogCommercialConvergenceService(database);
    this.terms = new ContractTermsService(database);
    this.catalog = new CatalogService(database);
  }

  simulate(): ConvergenceReview {
    const contractPlan = this.editorial.simulate(proposals, editorialReference);
    let catalogPlan: ReturnType<CatalogCommercialConvergenceService['simulate']> = [];
    const catalogAnomalies: string[] = [];
    try { catalogPlan = this.commercial.simulate(catalogSource); }
    catch (error) { catalogAnomalies.push(error instanceof Error ? error.message : String(error)); }
    const contractRows = contractPlan.rows.map((row) => {
      const proposal = proposals.clauses.find((entry) => entry.code === row.code)!;
      const template = this.terms.getTemplate(proposal.origin.templateId);
      const imported=this.database.get<{draft_version_id:string}>('SELECT draft_version_id FROM contract_editorial_import_entries WHERE clause_id=? ORDER BY rowid DESC LIMIT 1',[template.id]);
      const draft = imported ? template.versions.find((version) => version.id === imported.draft_version_id && version.status === 'draft') ?? null : null;
      const decision = draft ? this.database.get<{decision:'approved_for_publication'|'needs_revision';reviewer:string;note:string|null;created_at:string}>(
        'SELECT decision,reviewer,note,created_at FROM contract_convergence_decisions WHERE draft_version_id=?', [draft.id]) : undefined;
      return {
        code: row.code, title: proposal.origin.title, publishedVersion: proposal.origin.version,
        publishedBody: proposal.origin.body, proposedTitle: row.title, proposedBody: proposal.proposal,
        action: row.action, anomaly: row.anomaly,
        dependencies: template.catalogItemIds.map((id) => this.database.get<{ canonical_code: string | null }>('SELECT canonical_code FROM catalog_items WHERE id=?', [id])?.canonical_code ?? id),
        family: String((proposal as ContractEditorialProposalDocument['clauses'][number] & { family?: string }).family ?? 'Non classée'),
        risk: String((proposal as ContractEditorialProposalDocument['clauses'][number] & { risk?: string }).risk ?? 'Non évalué'),
        defect: String((proposal as ContractEditorialProposalDocument['clauses'][number] & { defect?: string }).defect ?? ''),
        legalAssessment: String((proposal as ContractEditorialProposalDocument['clauses'][number] & { legalAssessment?: string }).legalAssessment ?? ''),
        externalReview: String((proposal as ContractEditorialProposalDocument['clauses'][number] & { externalReview?: string }).externalReview ?? ''),
        draftVersionId: draft?.id ?? null, decision: decision?.decision ?? null, decidedBy: decision?.reviewer ?? null,
        decidedAt: decision?.created_at ?? null, decisionNote: decision?.note ?? null,
      };
    });
    const catalogRows = catalogPlan.map((row) => {
      const item = this.catalog.getItem(row.itemId);
      const published = item.versions.find((version) => version.id === row.publishedVersionId)!;
      const record = catalogSource.records.find((entry) => entry.canonicalCode === row.canonicalCode)!;
      const differences: ConvergenceDifference[] = Object.entries(record.overrides)
        .filter(([field, proposed]) => JSON.stringify(published[field as keyof typeof published]) !== JSON.stringify(proposed))
        .map(([field, proposed]) => ({ field, published: published[field as keyof typeof published], proposed }));
      return { canonicalCode: row.canonicalCode, name: item.name, publishedVersion: published.versionNumber,
        draftPrepared: item.versions.some((version) => version.id === row.requestId && version.status === 'draft'), requestId: row.requestId, differences };
    });
    const trace = this.database.all<{ action: string; summary: string; created_at: string }>(
      `SELECT action,summary,created_at FROM activity_log
       WHERE action IN ('contract_editorial_drafts_prepared','catalog_commercial_drafts_prepared')
       ORDER BY created_at DESC LIMIT 20`,
    ).map((entry) => ({ action: entry.action, summary: entry.summary, createdAt: entry.created_at }));
    return { simulatedAt: new Date().toISOString(), contract: { planSha256: contractPlan.planSha256,
      counts: contractPlan.counts, anomalies: contractPlan.anomalies, rows: contractRows },
      catalog: { reference: catalogSource.reference, rows: catalogRows, anomalies: catalogAnomalies }, trace };
  }

  prepareContractDrafts(expectedPlanSha256: string): ConvergenceReview {
    this.editorial.apply(proposals, editorialReference, expectedPlanSha256);
    return this.simulate();
  }

  prepareCatalogDrafts(expectedRequestIds: string[]): ConvergenceReview {
    const plan = this.commercial.simulate(catalogSource);
    if (JSON.stringify(plan.map((row) => row.requestId)) !== JSON.stringify(expectedRequestIds)) throw new Error('Le plan Catalogue a changé : relancer la simulation.');
    this.commercial.apply(catalogSource, plan);
    return this.simulate();
  }

  decideContractDrafts(input: {codes:string[];decision:'approved_for_publication'|'needs_revision';reviewer:string;note?:string;expectedPlanSha256:string}): ConvergenceReview {
    const plan=this.editorial.simulate(proposals,editorialReference);
    if(plan.planSha256!==input.expectedPlanSha256) throw new Error('Le plan contractuel a changé : relancer la simulation.');
    const reviewer=input.reviewer.trim(),codes=[...new Set(input.codes.map(code=>code.trim()).filter(Boolean))];
    if(!reviewer) throw new Error('Le nom du relecteur est requis.');
    if(!codes.length) throw new Error('Sélectionne au moins une clause.');
    if(!['approved_for_publication','needs_revision'].includes(input.decision)) throw new Error('Décision éditoriale invalide.');
    const now=new Date().toISOString();
    this.database.exec('BEGIN IMMEDIATE;');
    try {
      for(const code of codes){
        const proposal=proposals.clauses.find(entry=>entry.code===code);if(!proposal)throw new Error(`Clause inconnue : ${code}.`);
        const row=plan.rows.find(entry=>entry.code===code);if(!row||row.action!=='keep')throw new Error(`${code} ne possède pas de brouillon préparé stable.`);
        const draft=this.database.get<{id:string;status:string}>(`SELECT v.id,v.status FROM contract_editorial_import_entries e JOIN contract_clause_versions v ON v.id=e.draft_version_id WHERE e.clause_id=? ORDER BY e.rowid DESC LIMIT 1`,[proposal.origin.templateId]);
        if(!draft||draft.status!=='draft')throw new Error(`Le brouillon de ${code} n'est plus disponible.`);
        const hash=createHash('sha256').update(proposal.proposal).digest('hex');
        this.database.run(`INSERT INTO contract_convergence_decisions
          (id,clause_code,clause_id,draft_version_id,proposal_sha256,decision,reviewer,note,created_at)
          VALUES (?,?,?,?,?,?,?,?,?)
          ON CONFLICT(draft_version_id) DO UPDATE SET decision=excluded.decision,reviewer=excluded.reviewer,note=excluded.note,created_at=excluded.created_at,proposal_sha256=excluded.proposal_sha256`,
          [randomUUID(),code,proposal.origin.templateId,draft.id,hash,input.decision,reviewer,input.note?.trim()||null,now]);
      }
      this.database.run('INSERT INTO activity_log (entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
        ['contract_convergence',null,'contract_convergence_human_decision',`${codes.length} clause(s) : ${input.decision==='approved_for_publication'?'prêtes à soumettre':'à réviser'}`,JSON.stringify({codes,decision:input.decision,reviewer,note:input.note?.trim()||null}),now]);
      this.database.exec('COMMIT;');
    } catch(error){this.database.exec('ROLLBACK;');throw error;}
    return this.simulate();
  }
}
