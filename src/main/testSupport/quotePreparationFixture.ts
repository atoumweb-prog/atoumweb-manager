import { CommercialRulesService } from '../commercial/CommercialRulesService';
// Explicit fixtures for pre-existing lifecycle tests. Never used by production code.
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { QuoteService } from '../commercial/QuoteService';
import { QuoteContractPreparationService } from '../commercial/QuoteContractPreparationService';
import { ContractTermsService } from '../commercial/ContractTermsService';
import { emptyContractParameters, emptyAdministration } from '../../shared/quoteContractPreparation';
export function prepareQuoteForTest(db:DatabaseAdapter,id:string):void {
  const row=db.get<Record<string,unknown>>('SELECT * FROM quotes WHERE id=?',[id])!;
  if(row.contract_parameters_json==null||row.finalized_at)return;
  // An explicit dossier estimate belongs to the fixture, never an automatic production fallback.
  for(const line of db.all<{id:string;model_json:string}>(`SELECT l.id,m.model_json FROM quote_lines l
    JOIN catalog_operational_links a ON a.catalog_version_id=l.catalog_version_id
    JOIN operational_model_versions m ON m.id=a.model_version_id WHERE l.quote_id=?`,[id])) {
    if(JSON.parse(line.model_json).estimateRequired) {
      const rules=new CommercialRulesService(db);
      if(!rules.parameters(line.id))rules.setParameters(line.id,{scope:'Périmètre spécifique de la fixture',currentEstimateMinutes:240,productionPlan:'Production et contrôle définis pour la fixture'});
    }
  }
  const preparation=new QuoteContractPreparationService(db),admin=emptyAdministration();
  for(const key of ['identity','administrative','vat','complaints'] as const)admin[key]={state:'filled',value:`Fixture isolée ${key}`,reason:''};
  preparation.saveAdministration(admin);
  const p=emptyContractParameters(row.contract_audience as 'professional'|'consumer',Number(row.deposit_percent));
  p.conclusion={...p.conclusion,channel:'on_premises',context:'Fixture en établissement',purchasePurpose:'Test unitaire'};
  p.digital={...p.digital,kinds:['classical_service'],supply:'one_off',delivery:'Remise explicite',qualificationReason:'Fixture de service classique'};
  p.rights.reviewed=true;p.renewal.reviewed=true;
  p.milestones=[{label:'Livraison',date:'2027-01-01'}];
  p.payment.milestones=p.payment.milestones.map((m,i)=>({...m,event:i===0?'Commande convenue':'Livraison convenue'}));
  p.warranties=db.all<{id:string}>('SELECT id FROM quote_lines WHERE quote_id=?',[id]).map(l=>({lineId:l.id,kind:'not_applicable',days:null,startEvent:'',statutoryRightsUnaffected:true}));
  if(p.audience==='consumer'){admin.mediator={state:'filled',value:'Fixture médiateur — aucun usage réel',reason:''};preparation.saveAdministration(admin);p.consumer.informationDelivered=true;}
  preparation.save(id,p);
  if(!db.get("SELECT t.id FROM contract_clause_templates t JOIN contract_clause_versions v ON v.id=t.current_version_id WHERE t.scope='base' AND t.status='active' AND v.status='published'")){
    const terms=new ContractTermsService(db),clause=terms.createTemplate({code:'TEST-LOT5-SOCLE',title:'Socle fixture',scope:'base',audience:'all'},{body:'Texte exclusivement destiné au test du cycle de devis.'});terms.publishVersion(clause.versions[0].id);
  }
}
export function finalizeForTest(db:DatabaseAdapter,quotes:QuoteService,id:string){prepareQuoteForTest(db,id);return quotes.finalize(id);}
export function acceptForTest(db:DatabaseAdapter,quotes:QuoteService,id:string){
  const row=db.get<Record<string,unknown>>('SELECT * FROM quotes WHERE id=?',[id])!;
  if(row.status!=='accepted'&&row.contract_snapshot_json&&JSON.parse(String(row.contract_snapshot_json)).parameters)new QuoteContractPreparationService(db).recordAcceptance(id,'Acceptation explicite fixture','2026-09-01T00:00:00Z','Test automatisé isolé');
  return quotes.accept(id);
}
