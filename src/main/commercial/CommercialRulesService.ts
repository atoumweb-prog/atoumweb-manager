import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import { validateCommercialRules, type CommercialVersionRules, type QuoteLineParameters } from '../../shared/commercialRules';
import type { QuoteDetail } from '../../shared/commercial';

export class CommercialRulesService {
  constructor(private readonly database: DatabaseAdapter) {}

  configure(versionId: string, rules: CommercialVersionRules, provenance: Record<string, unknown>): void {
    validateCommercialRules(rules);
    if (this.database.get<{status:string}>('SELECT status FROM catalog_versions WHERE id=?', [versionId])?.status !== 'draft') throw Error('Les règles ne peuvent être configurées que sur une version brouillon.');
    this.database.run(`INSERT INTO catalog_commercial_rules VALUES (?,?,?,?)
      ON CONFLICT(catalog_version_id) DO UPDATE SET rules_json=excluded.rules_json,provenance_json=excluded.provenance_json,updated_at=excluded.updated_at`,
      [versionId, JSON.stringify(rules), JSON.stringify(provenance), new Date().toISOString()]);
  }

  rules(versionId: string): CommercialVersionRules | null {
    if(!this.database.get("SELECT name FROM sqlite_master WHERE type='table' AND name='catalog_commercial_rules'"))return null;
    const row = this.database.get<{rules_json:string}>('SELECT rules_json FROM catalog_commercial_rules WHERE catalog_version_id=?', [versionId]);
    return row ? JSON.parse(row.rules_json) as CommercialVersionRules : null;
  }

  parameters(lineId: string): QuoteLineParameters | null {
    if(!this.database.get("SELECT name FROM sqlite_master WHERE type='table' AND name='quote_line_parameters'"))return null;
    const row = this.database.get<{parent_line_id:string|null;parameters_json:string}>('SELECT parent_line_id,parameters_json FROM quote_line_parameters WHERE line_id=?', [lineId]);
    return row ? {...JSON.parse(row.parameters_json) as QuoteLineParameters, parentLineId:row.parent_line_id} : null;
  }

  setParameters(lineId: string, parameters: QuoteLineParameters): void {
    const allowed=new Set(['contractNature','contractEvent','serviceDuration','renewalTerms','scopeExclusions','productCount','scopeReference','parentLineId','parentInterventionId','requestedDeadline','availabilityConfirmed','acceptedDeadline','scope','currentEstimateMinutes','productionPlan','serviceStartDate','serviceEndDate','siteId','contextNodeId','setupEstimateMinutes','operationalProjectId','parentOperationalSaleId','periodAlignment']);
    if(!parameters||Object.keys(parameters).some(key=>!allowed.has(key)))throw Error('Paramètre de dossier inconnu.');
    if(parameters.contractNature&&!['one_off','continuous'].includes(parameters.contractNature))throw Error('Nature de prestation invalide.');
    for(const key of ['contractEvent','serviceDuration','renewalTerms','scopeExclusions'] as const)if(parameters[key]!=null&&typeof parameters[key]!=='string')throw Error('Engagement de prestation invalide.');
    if(parameters.productCount&&(!['included','additional'].includes(parameters.productCount.kind)||!Number.isSafeInteger(parameters.productCount.count)||parameters.productCount.count<0))throw Error('Nombre de produits invalide.');
    if(parameters.scopeReference){const r=parameters.scopeReference;const version=this.database.get<{version_number:number;name:string}>(`SELECT v.version_number,i.name FROM catalog_versions v JOIN catalog_items i ON i.id=v.item_id WHERE v.id=? AND v.status IN ('published','retired')`,[r.versionId]);if(!version||r.label!==version.name||r.versionNumber!==version.version_number)throw Error('Version de référence publiée introuvable.');}
    if(parameters.periodAlignment&&!['calendar','anniversary'].includes(parameters.periodAlignment))throw Error('Alignement des périodes invalide.');
    const line = this.database.get<{quote_id:string;snapshot_json:string|null}>('SELECT quote_id,snapshot_json FROM quote_lines WHERE id=?', [lineId]);
    if (!line) throw Error('Ligne introuvable.');
    const quote = this.database.get<{status:string;finalized_at:string|null}>('SELECT status,finalized_at FROM quotes WHERE id=?', [line.quote_id]);
    if (quote?.status !== 'draft' || quote.finalized_at) throw Error('Les paramètres du devis sont figés.');
    if(parameters.parentOperationalSaleId){
      const q=this.database.get<{client_account_id:string|null}>('SELECT client_account_id FROM quotes WHERE id=?',[line.quote_id]);
      if(!q?.client_account_id || !this.database.get('SELECT id FROM operational_sales WHERE id=? AND client_account_id=?',[parameters.parentOperationalSaleId,q.client_account_id]))throw Error('Abonnement principal du même Client requis.');
    }
    if(parameters.operationalProjectId) {
      const q=this.database.get<{client_account_id:string|null}>('SELECT client_account_id FROM quotes WHERE id=?',[line.quote_id]);
      if(!q?.client_account_id || !this.database.get('SELECT id FROM projects WHERE id=? AND client_account_id=?',[parameters.operationalProjectId,q.client_account_id]))throw Error('Projet opérationnel du même Client requis.');
    }
    const parentId = parameters.parentLineId?.trim() || null;
    if(parentId&&parameters.parentInterventionId)throw Error('Choisis une seule origine du travail urgent.');
    if(parameters.parentInterventionId) {
      const snapshot=JSON.parse(line.snapshot_json||'{}') as {commercialRules?:CommercialVersionRules};
      const context=this.database.get<{client_account_id:string|null}>('SELECT client_account_id FROM quotes WHERE id=?',[line.quote_id]);
      if(!snapshot.commercialRules?.attachment?.allowIntervention || !this.database.get(`SELECT id FROM interventions WHERE id=? AND client_account_id=? AND status NOT IN ('archived','cancelled','completed')`,[parameters.parentInterventionId,context?.client_account_id??null]))throw Error('Intervention compatible et ouverte du même Client requise.');
    }
    if (parentId) {
      const parent = this.database.get<{quote_id:string;snapshot_json:string|null}>('SELECT quote_id,snapshot_json FROM quote_lines WHERE id=?', [parentId]);
      if (!parent || parent.quote_id !== line.quote_id || parentId === lineId) throw Error('Choisis une prestation distincte dans ce devis.');
      const snapshot = JSON.parse(line.snapshot_json || '{}') as {commercialRules?:CommercialVersionRules};
      const parentSnapshot = JSON.parse(parent.snapshot_json || '{}') as {canonicalCode?:string;commercialRules?:CommercialVersionRules};
      if (parentSnapshot.commercialRules?.attachment) throw Error('Un supplément ne peut pas être rattaché à un autre supplément.');
      if (snapshot.commercialRules?.attachment && !snapshot.commercialRules.attachment.compatibleCodes.includes(parentSnapshot.canonicalCode || '')) throw Error('Cette prestation principale n’est pas compatible avec le supplément.');
    }
    if (parameters.currentEstimateMinutes != null && (!Number.isSafeInteger(parameters.currentEstimateMinutes) || parameters.currentEstimateMinutes < 0)) throw Error('Estimation invalide.');
    for (const deadline of [parameters.requestedDeadline, parameters.acceptedDeadline, parameters.serviceStartDate, parameters.serviceEndDate]) if (deadline && Number.isNaN(Date.parse(deadline))) throw Error('Date de dossier invalide.');
    if(parameters.serviceStartDate && parameters.serviceEndDate && parameters.serviceEndDate<parameters.serviceStartDate)throw Error('La fin du service doit suivre son début.');
    if(parameters.setupEstimateMinutes!=null && (!Number.isSafeInteger(parameters.setupEstimateMinutes)||parameters.setupEstimateMinutes<0))throw Error('Estimation de mise en service invalide.');
    this.database.run(`INSERT INTO quote_line_parameters VALUES (?,?,?,?) ON CONFLICT(line_id)
      DO UPDATE SET parent_line_id=excluded.parent_line_id,parameters_json=excluded.parameters_json,updated_at=excluded.updated_at`,
      [lineId,parentId,JSON.stringify({...parameters,parentLineId:undefined}),new Date().toISOString()]);
  }

  issues(quote: QuoteDetail): string[] {
    const issues: string[] = [];
    for (const line of quote.lines) {
      const rules = line.snapshot?.commercialRules as CommercialVersionRules | undefined;
      const params = this.parameters(line.id);
      const snapshot=line.snapshot??{};
      const unresolvedReference=(v:unknown):boolean=>Array.isArray(v)?v.some(unresolvedReference):typeof v==='string'&&/mêmes? (périmètre|exclusions|prérequis)|mêmes? .*mensuel/i.test(v);
      if(unresolvedReference(params?.scope)||unresolvedReference(snapshot.inclusions)&&!params?.scope?.trim())issues.push(`${line.label} : détailler le périmètre de référence avant finalisation.`);
      if(unresolvedReference(params?.scopeExclusions)||unresolvedReference(snapshot.exclusions)&&!params?.scopeExclusions?.trim())issues.push(`${line.label} : détailler les exclusions de référence avant finalisation.`);
      if(params?.contractNature==='one_off'&&!params.acceptedDeadline&&!params.contractEvent?.trim())issues.push(`${line.label} : date ou événement de livraison à préciser.`);
      if(params?.contractNature==='continuous'){
        if(!params.serviceStartDate&&!params.contractEvent?.trim())issues.push(`${line.label} : début du service ou événement de départ à préciser.`);
        if(!params.serviceEndDate&&!params.serviceDuration?.trim())issues.push(`${line.label} : durée ou fin du service à préciser.`);
        if(!params.renewalTerms?.trim())issues.push(`${line.label} : conditions de renouvellement ou fin sans renouvellement à préciser.`);
      }
      if (rules?.attachment) {
        const parent = quote.lines.find(candidate => candidate.id === params?.parentLineId);
        const intervention = rules.attachment.allowIntervention && params?.parentInterventionId ? this.database.get(`SELECT id FROM interventions WHERE id=? AND client_account_id=? AND status NOT IN ('archived','cancelled','completed')`,[params.parentInterventionId,quote.clientAccountId??null]) : null;
        if (!intervention && (!parent || !rules.attachment.compatibleCodes.includes(String(parent.snapshot?.canonicalCode || '')) || parent.snapshot?.commercialRules && (parent.snapshot.commercialRules as CommercialVersionRules).attachment)) issues.push(`${line.label} : prestation principale compatible à choisir.`);
        if (rules.attachment.kind === 'priority' && (!params?.requestedDeadline || !params.availabilityConfirmed || !params.acceptedDeadline)) issues.push(`${line.label} : disponibilité et délai accepté à confirmer.`);
      }
      const model = line.catalogItemId ? this.database.get<{model_json:string}>(`SELECT m.model_json FROM catalog_operational_links l JOIN operational_model_versions m ON m.id=l.model_version_id WHERE l.catalog_version_id=? AND (l.id=? OR ? IS NULL) ORDER BY l.revision DESC LIMIT 1`, [line.catalogVersionId || null,(line.snapshot?.operational as {linkId?:string}|undefined)?.linkId??null,(line.snapshot?.operational as {linkId?:string}|undefined)?.linkId??null]) : undefined;
      if (model && (JSON.parse(model.model_json) as {estimateRequired?:boolean}).estimateRequired && (!params?.scope?.trim() || params.currentEstimateMinutes == null || !params.productionPlan?.trim())) issues.push(`${line.label} : périmètre, estimation courante et plan de production à préciser.`);
    }
    return issues;
  }

  copyParameters(lineIds: Map<string,string>): void {
    for (const [oldId,newId] of lineIds) {
      const params = this.parameters(oldId);
      if (params) this.setParameters(newId, {...params,parentLineId: params.parentLineId ? lineIds.get(params.parentLineId) ?? null : null});
    }
  }
}

export { commercialAbbyBlock } from '../../shared/commercialAbby';
