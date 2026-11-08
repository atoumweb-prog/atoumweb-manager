import {createHash} from 'node:crypto';
import type {DatabaseAdapter} from '../database/DatabaseAdapter';
import legacy from '../../../data/catalogue/atoumweb-reprise-v1.json';
import historicalClauses from '../../../data/contracts/atoumweb-contract-library-v38-review.json';
import {CatalogImportService,catalogImportHash,type CatalogImportManifest} from './CatalogImportService';
import {ContractEditorialDraftService,type ContractEditorialProposalDocument,type ContractEditorialProposal} from './ContractEditorialDraftService';
import {ContractTermsService} from './ContractTermsService';
import {CommercialRulesService} from './CommercialRulesService';
import {APPROVED_PACK,approvedCatalogSource,approvedVersionRules} from './ApprovedPackSource';
import type {ContractClauseReviewMetadata} from '../../shared/contractTerms';

const textHash=(s:string)=>createHash('sha256').update(s).digest('hex');
const normalized=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

/** Versioned source-pack adapter over the existing Catalogue/editorial services. No startup hook. */
export class ApprovedPackService {
 constructor(private readonly db:DatabaseAdapter){}

 simulate(){
  const source=approvedCatalogSource(),blockers:string[]=[];
  const manifest:CatalogImportManifest={schemaVersion:1,reference:APPROVED_PACK.reference,entries:[]};
  const items=this.db.all<{id:string;name:string;canonical_code:string|null;status:string}>('SELECT id,name,canonical_code,status FROM catalog_items');
  const provenanceOwners=new Map<string,Set<string>>();
  for(const row of this.db.all<{item_id:string;provenance_json:string}>('SELECT item_id,provenance_json FROM catalog_versions WHERE provenance_json IS NOT NULL')){
   const key=JSON.parse(row.provenance_json).recordKey;
   if(typeof key==='string'){const owners=provenanceOwners.get(key)??new Set<string>();owners.add(row.item_id);provenanceOwners.set(key,owners);}
  }
  for(const row of this.db.all<{item_id:string;entry_key:string}>('SELECT item_id,entry_key FROM catalog_import_entries WHERE to_version_id IS NOT NULL')){
   const owners=provenanceOwners.get(row.entry_key)??new Set<string>();owners.add(row.item_id);provenanceOwners.set(row.entry_key,owners);
  }
  const mappings=source.records.map(record=>{
   const code=record.canonicalCode;
   const candidates=items.filter(i=>i.canonical_code===code||provenanceOwners.get(code)?.has(i.id));
   const historical=legacy.entries.find(e=>e.action==='update'&&e.canonicalCode===code);
   if(!candidates.length&&historical){const item=items.find(i=>i.id===historical.itemId);if(item)candidates.push(item);}
   if(candidates.length>1)blockers.push(code+' : plusieurs IDs candidats, aucune fusion automatique');
   const item=candidates.length===1?candidates[0]:undefined;
   if(!item&&items.some(i=>normalized(i.name)===normalized(record.name)))blockers.push(code+' : même nom sans preuve d’équivalence ; mapping explicite requis');
   const latest=item?this.db.get<{id:string}>('SELECT id FROM catalog_versions WHERE item_id=? ORDER BY version_number DESC LIMIT 1',[item.id]):undefined;
   if(item&&latest){
    if(item.status!=='active')blockers.push(code+' : article inactif/archivé, aucune réactivation automatique');
    manifest.entries.push({itemId:item.id,canonicalCode:code,action:'update',expectedVersionId:latest.id});
   }
   return {sourceCode:code,provisional:source.provisionalCodes!.includes(code),itemId:item?.id??null,
    evidence:item?.canonical_code===code?'code canonique exact':item&&historical?.itemId===item.id?'manifeste historique explicite, ID conservé':item?'provenance source versionnée':'aucun équivalent identifié dans cette base ; nouvelle référence non publiée',
    canonicalCode:item?.canonical_code??null};
  });
  const catalogue=new CatalogImportService(this.db).simulate(source,manifest);
  blockers.push(...catalogue.anomalies);
  if(this.db.get("SELECT name FROM pragma_table_info('catalog_versions') WHERE name='abandoned_at'")){
   for(const row of catalogue.rows.filter(r=>r.action==='update'))if(this.db.get("SELECT id FROM catalog_versions WHERE item_id=? AND status='draft' AND abandoned_at IS NULL",[row.itemId]))blockers.push(row.key+' : brouillon opérationnel déjà présent ; conservation sans abandon automatique, décision ciblée requise');
  }
  const document=this.contractDocument();
  const contracts=new ContractEditorialDraftService(this.db).simulate(document,APPROVED_PACK.reference);
  blockers.push(...contracts.anomalies);
  const plan={source,manifest,catalogue,document,contracts,mappings,blockers};
  return {...plan,planSha256:catalogImportHash(plan)};
 }

 apply(expectedPlanSha256:string){
  this.db.exec('BEGIN IMMEDIATE;');
  try{
   const plan=this.simulate();
   if(plan.planSha256!==expectedPlanSha256)throw Error('Plan V3.9.4 périmé : relancer la simulation.');
   if(plan.blockers.length)throw Error('Intégration bloquée : '+plan.blockers.join('; '));
   new CatalogImportService(this.db).apply(plan.source,plan.manifest,{expectedPlanSha256:plan.catalogue.planSha256,withinTransaction:true});
   new ContractEditorialDraftService(this.db).apply(plan.document,APPROVED_PACK.reference,plan.contracts.planSha256,true);
   for(const record of plan.source.records){
    const entry=this.db.get<{to_version_id:string}>('SELECT to_version_id FROM catalog_import_entries WHERE entry_key=? AND source_record_sha256=? ORDER BY rowid DESC LIMIT 1',[record.canonicalCode,catalogImportHash(record)]);
    if(!entry)throw Error('Reçu Catalogue absent : '+record.canonicalCode);
    const rules=new CommercialRulesService(this.db),expected=approvedVersionRules(record.canonicalCode,record.version.commercialParameters!.sourceStatus!);
    const actual=rules.rules(entry.to_version_id);
    if(plan.catalogue.rows.find(r=>r.key===record.canonicalCode)?.action==='keep'){
     if(catalogImportHash(actual)!==catalogImportHash(expected))throw Error('Règles importées modifiées : aucune réécriture automatique.');
    }else rules.configure(entry.to_version_id,expected,{reference:APPROVED_PACK.reference,sha256:APPROVED_PACK.business.sha256_word,recordKey:record.canonicalCode});
   }
   const replay=this.simulate();
   if(replay.blockers.length||replay.catalogue.counts.keep!==130||replay.contracts.counts.draftsKept!==119)throw Error('Contrôle post-import non conforme.');
   this.db.exec('COMMIT;');return replay;
  }catch(error){this.db.exec('ROLLBACK;');throw error;}
 }

 private contractDocument():ContractEditorialProposalDocument {
  const terms=new ContractTermsService(this.db);
  const receipt=this.db.get<{summary_json:string}>('SELECT summary_json FROM contract_editorial_import_runs WHERE source_reference=? ORDER BY created_at DESC LIMIT 1',[APPROVED_PACK.reference]);
  type Origin={code:string;templateId:string;currentVersionId:string|null;versionId:string;newClause?:ContractEditorialProposal['newClause']};
  const origins:Origin[]=receipt?JSON.parse(receipt.summary_json).origins??[]:[];
  return {schemaVersion:1,reference:APPROVED_PACK.reference,source:{filename:APPROVED_PACK.library.source_word,sha256:APPROVED_PACK.library.sha256_word},expectedClauseCount:119,
   clauses:APPROVED_PACK.library.clauses.map(c=>{
    const audience=c.public==='Consommateurs'?'consumer':c.public==='Professionnels'?'professional':'all';
    const prior=origins.find(o=>o.code===c.code_contractuel);
    const historical=historicalClauses.clauses.find(h=>h.code===c.code_contractuel);
    const candidates=[this.db.get<{id:string}>('SELECT id FROM contract_clause_templates WHERE code=? COLLATE NOCASE',[c.code_contractuel]),this.db.get<{id:string}>('SELECT clause_id AS id FROM contract_clause_code_aliases WHERE alias_code=? COLLATE NOCASE',[c.code_contractuel]),historical?.origin.code?this.db.get<{id:string}>('SELECT id FROM contract_clause_templates WHERE code=? COLLATE NOCASE',[historical.origin.code]):undefined].filter((r):r is {id:string}=>!!r);
    if(new Set(candidates.map(r=>r.id)).size>1)throw Error('Collision identité/alias historique de clause : '+c.code_contractuel);
    const row=candidates[0];
    const template=row?terms.getTemplate(row.id):null;
    const isNew=prior?!!prior.newClause:!template;
    const version=template?(prior?template.versions.find(v=>v.id===prior.versionId):template.currentVersion??template.versions[0]):null;
    if(template&&!version&&!isNew)throw Error('Version source de clause absente : '+c.code_contractuel);
    if(prior&&!isNew&&version){const saved=this.db.get<{source_body_sha256:string}>(`SELECT e.source_body_sha256 FROM contract_editorial_import_entries e JOIN contract_editorial_import_runs r ON r.id=e.run_id WHERE r.source_reference=? AND e.clause_code=? ORDER BY r.created_at DESC LIMIT 1`,[APPROVED_PACK.reference,c.code_contractuel]);if(saved&&saved.source_body_sha256!==textHash(version.body))throw Error('Source historique de clause modifiée depuis préparation : '+c.code_contractuel);}
    const review:ContractClauseReviewMetadata={level:'Validation externe recommandée mais non prévue',sources:APPROVED_PACK.library.source_word,verifiedAt:null,reserve:'Approbation métier interne ; aucune certification de conformité légale.',risk:'Contrôles de conformité et justificatifs restant à satisfaire.',prudence:null,externalSupport:null,finalReview:null,businessDecisions:'Pack métier approuvé par le dirigeant le 08/11/2026',editorialDecision:'nouvelle version non publiée',decisionReason:'Intégration V3.9.4 rectificatif 019',outsideActions:null,editorialStatus:'brouillon',origin:APPROVED_PACK.reference,parameters:null,dependencies:null,textSource:APPROVED_PACK.library.source_word,provenance:{reference:APPROVED_PACK.library.source_word,sha256:APPROVED_PACK.library.sha256_word,referenceCell:c.numero_affiche,bodyCell:c.numero_affiche,reviewCell:'décision métier',decisionCell:'08/11/2026'}};
    return {code:c.code_contractuel,proposedCode:c.code_contractuel,proposedTitle:c.titre,proposedAudience:audience,proposal:c.paragraphes_contractuels.join('\n\n'),approval:null,publication:false,adoption:false,allowUnpublishedSource:true,review,
     sourceBodySHA256:isNew?null:textHash(version!.body),
     origin:isNew?{templateId:'',currentVersionId:'',versionId:'',version:0,versionStatus:'new',body:'',title:c.titre,code:c.code_contractuel,audience}:{templateId:template!.id,currentVersionId:prior?prior.currentVersionId:template!.currentVersionId??null,versionId:version!.id,version:version!.versionNumber,versionStatus:version!.status,body:version!.body,title:version!.title??template!.title,code:template!.code,audience:version!.audience??template!.audience},
     ...(isNew?{newClause:{scope:/^(BASE|PRO|CONS)-/.test(c.code_contractuel)?'base' as const:'catalog' as const,audience,sortOrder:c.numero*10}}:{})};
   })};
 }
}
