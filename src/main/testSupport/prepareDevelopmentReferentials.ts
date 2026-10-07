/** Opt-in development preparation. Uses public lifecycle services, never bypasses draft guards. */
import { createHash } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import { CatalogService } from '../commercial/CatalogService';
import { CommercialRulesService } from '../commercial/CommercialRulesService';
import { ContractTermsService } from '../commercial/ContractTermsService';
import { OperationalReferenceService, operationalHash } from '../projects/OperationalReferenceService';
import type { OperationalModel, OperationalReference } from '../../shared/operational';
import type { CommercialVersionRules, OperationalSalePolicy } from '../../shared/commercialRules';
import commercial from '../../../data/catalogue/atoumweb-commercial-complements-v1.json';
import operations from '../../../data/operations/atoumweb-operational-sales-v1.json';
import canonicalLibrary from '../../../data/contracts/atoumweb-contract-library-v1.json';

type Row=Record<string,unknown>;
export function prepareDevelopmentReferentials(db:DatabaseAdapter,developmentConfirmed:boolean) {
  if(!developmentConfirmed)throw Error('Préparation réservée à une base de développement explicitement confirmée.');
  const catalog=new CatalogService(db),terms=new ContractTermsService(db),refs=new OperationalReferenceService(db),rules=new CommercialRulesService(db);
  const before=db.all<Row>(`SELECT i.canonical_code,v.* FROM catalog_items i JOIN catalog_versions v ON v.item_id=i.id
    WHERE i.canonical_code IS NOT NULL AND v.version_number=(SELECT MAX(version_number) FROM catalog_versions WHERE item_id=i.id) ORDER BY i.canonical_code`);
  if(before.length!==112)throw Error('Le référentiel de développement doit contenir exactement les 112 codes canoniques attendus.');
  const versionByCode=new Map(before.map(v=>[String(v.canonical_code),v]));
  const changes:string[]=[];
  for(const [code,configuration] of Object.entries(commercial.rules)) {
    let version=versionByCode.get(code);if(!version)throw Error('Code absent : '+code);
    const expected=configuration as CommercialVersionRules;
    if(operationalHash(rules.rules(String(version.id)))===operationalHash(expected))continue;
    if(version.status!=='draft') {
      const item=catalog.getItem(String(version.item_id)),current=item.versions.find(v=>v.id===version!.id)!;
      const revised=catalog.createVersion(item.id,current);
      const previousLink=db.get<Row>('SELECT * FROM catalog_operational_links WHERE catalog_version_id=? ORDER BY revision DESC LIMIT 1',[String(version.id)]);
      if(previousLink)refs.link(revised.id,String(previousLink.model_version_id),previousLink.blueprint_version_id as string|null,JSON.parse(String(previousLink.provenance_json)));
      version={...version,id:revised.id,status:'draft',version_number:revised.versionNumber};
      versionByCode.set(code,version);const index=before.findIndex(v=>v.canonical_code===code);before[index]=version;
      changes.push('Nouvelle version commerciale sans changement de prix '+code);
    }
    rules.configure(String(version.id),expected,{reference:'Décisions AtoumWeb 2026-10-06',developmentOnly:true});changes.push(`Règles ${code}`);
  }

  const checklistAdditions:Record<string,string>={
    'AW-PHOTO-DETOUR':'Contrôler le détourage, les contours et le fond ; exporter aux formats prévus ; livrer et vérifier les fichiers. La quantité reste le nombre réel d’images.',
    'AW-PHOTO-RET-ESS':'Contrôler le résultat ; exporter aux formats prévus ; livrer les fichiers ; réaliser l’ajustement inclus dans le périmètre convenu.',
    'AW-PHOTO-RET-ADV':'Vérifier la faisabilité sur le fichier source ; signaler une complexité hors forfait avant accord complémentaire ; contrôler le résultat ; exporter ; livrer ; réaliser la correction prévue.',
    'AW-PHOTO-SUP':'Contrôler la photo finalisée ; exporter au format convenu ; livrer ; réaliser l’ajustement prévu.',
    'AW-BRAND-DOC-PAGE':'Document principal explicitement rattaché à la ligne. Cette action couvre la mise en page supplémentaire ; le contrôle global, l’export final et la livraison restent portés par le document principal.'
  };
  const models:OperationalModel[]=[];
  for(const [code,text] of Object.entries(checklistAdditions)) {
    const row=db.get<Row>('SELECT model_json FROM operational_model_versions WHERE canonical_code=? ORDER BY version_number DESC LIMIT 1',[code]);
    if(!row)throw Error('Modèle absent : '+code);
    const model=JSON.parse(String(row.model_json)) as OperationalModel;
    for(const action of model.actions)if(!action.checklist.includes(text))action.checklist+='\n'+text;
    models.push(model);
  }
  const source:OperationalReference={schemaVersion:1,source:{file:'Compléments de checklist validés AtoumWeb 2026-10-06 (XLSX intact)',sha256:createHash('sha256').update(JSON.stringify(checklistAdditions)).digest('hex')},models,
    decisions:Object.entries(checklistAdditions).map(([code,text])=>({key:code,source:'Instruction AtoumWeb 2026-10-06',actionKey:code+'-A01',originalChecklist:'Conservée dans la version précédente',checklist:text}))};
  const importPlan=refs.simulate(source);refs.importDraft(source,importPlan.planHash);

  // Stage changed models and all 8B configurations before explicit activation.
  const links:Row[]=[];
  for(const version of before){
    const code=String(version.canonical_code),model=db.get<Row>('SELECT * FROM operational_model_versions WHERE canonical_code=? ORDER BY version_number DESC LIMIT 1',[code]);
    if(!model)throw Error('Modèle absent : '+code);
    const previous=db.get<Row>('SELECT * FROM catalog_operational_links WHERE catalog_version_id=? ORDER BY revision DESC LIMIT 1',[String(version.id)]);
    const provenance=previous?JSON.parse(String(previous.provenance_json)):{};
    if(code in operations.policies)provenance.operations=(operations.policies as Record<string,OperationalSalePolicy>)[code];
    if(!previous || previous.model_version_id!==model.id || operationalHash(provenance)!==operationalHash(JSON.parse(String(previous.provenance_json))))refs.link(String(version.id),String(model.id),previous?.blueprint_version_id as string|null??null,provenance);
    const link=db.get<Row>('SELECT * FROM catalog_operational_links WHERE catalog_version_id=? ORDER BY revision DESC LIMIT 1',[String(version.id)])!;
    if(!link)throw Error('Association absente : '+code);
    links.push(link);
    if(model.status==='draft'){refs.markReady(String(model.id));changes.push(`Modèle ${code} ready`);}
  }
  for(const profile of db.all<Row>('SELECT * FROM blueprint_operational_profiles WHERE operational_ready=0')){refs.useStructure(String(profile.template_version_id));changes.push('Profil structurel mis en usage '+profile.template_version_id);}
  // Bases first so capability dependencies can be validated by the existing runtime.
  links.sort((a,b)=>(JSON.parse(String(b.provenance_json)).configuration?.structuralRole==='base'?1:0)-(JSON.parse(String(a.provenance_json)).configuration?.structuralRole==='base'?1:0));
  for(const link of links)if(link.status!=='ready'){refs.activateLink(String(link.id));changes.push('Association ready '+link.id);}

  // Published services are necessary before configuring optional offer components.
  for(const version of before.filter(v=>v.commercial_kind!=='offer'))if(version.status==='draft'){catalog.publishVersion(String(version.id));changes.push('Catalogue publié pour développement '+version.canonical_code);}
  for(const [code,optionCodes] of Object.entries(commercial.offerOptions)){
    let version=versionByCode.get(code)!;
    const components=catalog.listOfferComponents(String(version.id));
    const wanted=optionCodes.map(code=>String(versionByCode.get(code)!.id));
    if(wanted.every(id=>components.some(c=>c.isOptional&&c.serviceVersionId===id)))continue;
    if(version.status!=='draft') {
      const current=catalog.getItem(String(version.item_id)).versions.find(v=>v.id===version.id)!;
      const revised=catalog.createVersion(String(version.item_id),current);
      const oldLink=db.get<Row>('SELECT * FROM catalog_operational_links WHERE catalog_version_id=? ORDER BY revision DESC LIMIT 1',[String(version.id)]);
      if(oldLink){const id=refs.link(revised.id,String(oldLink.model_version_id),oldLink.blueprint_version_id as string|null,JSON.parse(String(oldLink.provenance_json)));refs.activateLink(id);}
      version={...version,id:revised.id,status:'draft',version_number:revised.versionNumber};versionByCode.set(code,version);before[before.findIndex(v=>v.canonical_code===code)]=version;
      changes.push('Nouvelle composition versionnée '+code);
    }
    const configuredItems=new Set(optionCodes.map(code=>String(versionByCode.get(code)!.item_id)));
    catalog.setOfferComponents(String(version.id),[...components.filter(c=>!c.isOptional||!configuredItems.has(c.serviceItemId)).map(c=>({serviceVersionId:c.serviceVersionId,isOptional:c.isOptional,quantityMilli:c.quantityMilli,sortOrder:c.sortOrder})),...wanted.map((id,index)=>({serviceVersionId:id,isOptional:true,quantityMilli:1000,sortOrder:100+index}))]);
    changes.push('Options explicites '+code);
  }
  for(const version of before.filter(v=>v.commercial_kind==='offer'))if(version.status==='draft'){catalog.publishVersion(String(version.id));changes.push('Offre publiée pour développement '+version.canonical_code);}
  const canonicalClauseCodes=new Set(canonicalLibrary.records.map(record=>record.code));
  for(const clause of terms.listTemplates().filter(clause=>canonicalClauseCodes.has(clause.code))){
    const version=clause.versions[0];if(version?.status==='draft'){terms.publishVersion(version.id);changes.push('Clause publiée pour recette TEST '+clause.code);}
  }
  const integrity=db.get('PRAGMA integrity_check'),foreignKeys=db.all('PRAGMA foreign_key_check');
  if(integrity?.integrity_check!=='ok'||foreignKeys.length)throw Error('Intégrité de la préparation invalide.');
  return {developmentOnly:true,changes,importPlan,integrity,foreignKeys,latestModels:db.all(`SELECT canonical_code,version_number,status FROM operational_model_versions m
    WHERE version_number=(SELECT MAX(version_number) FROM operational_model_versions WHERE catalog_item_id=m.catalog_item_id) ORDER BY canonical_code`),latestAssociations:links.map(l=>db.get('SELECT * FROM catalog_operational_links WHERE id=?',[String(l.id)]))};
}
