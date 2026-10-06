import histoire from '../projects/recipe/mariageHistoireStructure.json';
import type {DatabaseAdapter} from '../database/DatabaseAdapter';
import type {WorkspacePaths} from '../workspace';
import type {ContributionPolicy,StructureContract} from '../../shared/contributionTargets';
import {quoteOptionsFixture} from './quoteOptionsFixture';
import {contributionExamples} from './contributionReferenceFixture';
import {OperationalReferenceService} from '../projects/OperationalReferenceService';
import {ProjectService} from '../projects/ProjectService';
import {ProjectSiteService} from '../projects/ProjectSiteService';
import {TimeService} from '../time/TimeService';

export function contributionFixture(db:DatabaseAdapter,workspace:WorkspacePaths) {
  const f=quoteOptionsFixture(db),sites=new ProjectSiteService(db),projects=new ProjectService(db,workspace,sites),references=new OperationalReferenceService(db);
  f.quotes.setProjectLifecycle(projects.commercial);
  const reference=structuredClone(contributionExamples),items=new Map<string,ReturnType<typeof f.catalog.create>>(),versions=new Map<string,string>(),models=new Map<string,string>(),policies=new Map<string,ContributionPolicy>();
  const sharedStructures=new Map<string,string>();
  const aCodes=['AW-WEB-VITRINE','AW-LP-BASE','AW-ECOM-BASE','AW-MARIAGE-ESS','AW-MARIAGE-GRAND','AW-MARIAGE-HISTOIRE'];
  const bCodes=['AW-WEB-PAGE-SUP','AW-WEB-BLOG','AW-LP-SECTION','AW-LP-MERCI','AW-ECOM-PROD-SIMPLE','AW-ECOM-PROD-VAR'];
  const dCodes=['AW-DEVWP-FONCTION','AW-CONT-INTEG-WP'];
  for(const m of reference.models) {
    const original=m.code;m.code=original.replace('AW-','AW-TEST8A1-');for(const a of m.actions)a.key=a.key.replace(original,m.code);
    items.set(original,f.catalog.create({type:aCodes.includes(original)?'offer':'service',name:'Fixture 8A.1 '+original,canonicalCode:m.code,identityProvenance:{reference:'Fixture uniquement'}},{priceMode:'fixed',priceCents:10000}));
  }
  const offer=items.get('AW-WEB-VITRINE')!;
  for(const i of items.values())if(i.id!==offer.id)f.catalog.publishVersion(i.versions[0].id);
  f.catalog.setOfferComponents(offer.versions[0].id,[{serviceVersionId:items.get('AW-WEB-PAGE-SUP')!.versions[0].id,isOptional:true,quantityMilli:1000}]);
  f.catalog.publishVersion(offer.versions[0].id);
  references.importDraft(reference,references.simulate(reference).planHash);
  for(const [original,i] of items) {
    const model=reference.models.find(m=>m.code===i.canonicalCode)!;
    const modelId=String(db.get('SELECT id FROM operational_model_versions WHERE canonical_code=?',[model.code])!.id);models.set(original,modelId);references.markReady(modelId);
    const isA=aCodes.includes(original),isB=bCodes.includes(original),isD=dCodes.includes(original);
    let bp:string|null=null;
    const module=['AW-LP-SECTION','AW-ECOM-PROD-SIMPLE','AW-ECOM-PROD-VAR'].includes(original);
    const structureKey=['AW-MARIAGE-ESS','AW-MARIAGE-GRAND','AW-LP-BASE'].includes(original)?'one-page-base':module?'parent-page-module':original;
    if(isA||isB) {
      if(sharedStructures.has(structureKey)) {bp=sharedStructures.get(structureKey)!;versions.set(original,bp);}
      else {
      if(original==='AW-WEB-VITRINE') {
        // Clone the approved real blueprint on the isolated test database only.
        const v=projects.createTemplateVersion('atoumweb-project-template-vitrine','Fixture structure contract 8A.1');bp=v.id;
        for(const task of v.nodes.filter(n=>n.type==='task'))projects.removeTemplateNode(task.id);
        db.run('UPDATE project_template_nodes SET estimated_minutes=NULL WHERE template_version_id=?',[bp]);
      }else {
        bp=projects.createTemplate({name:'Fixture structure '+original,projectType:'website'}).versions[0].id;
        const names=isA?(original==='AW-MARIAGE-HISTOIRE'?histoire.pages.map(p=>p.name):original==='AW-ECOM-BASE'?['Boutique','Panier','Commande','Mon compte']:['Page principale']):module?[]:[original];
        const pageIds=names.map((name,index)=>projects.addTemplateNode(bp!,{type:'module',displaySubtype:'page',name,semanticKey:'page.'+index}).nodes.find(n=>n.name===name)!.id);
        if(module)projects.addTemplateNode(bp,{type:'module',name:'Module fixture',semanticKey:'module.fixture'});
        if(original==='AW-ECOM-BASE')for(let n=1;n<=10;n++)projects.addTemplateNode(bp,{type:'module',name:'Produit initial '+n,semanticKey:'woo.initial-product.'+n,parentId:pageIds[0]});
        projects.configureTemplateSites(bp,[{key:'main',name:'Site principal',pages:pageIds.map((id,index)=>({key:'page-'+index,templateNodeId:id,role:original==='AW-MARIAGE-HISTOIRE'?(histoire.pages[index].role as 'home'|'standard'):original==='AW-WEB-BLOG'?'blog':'standard',...(original==='AW-MARIAGE-HISTOIRE'?{desiredPath:histoire.pages[index].path}:{})}))}]);
      }
      const siteRows=db.all<{id:string;blueprint_key:string}>('SELECT id,blueprint_key FROM project_template_sites WHERE template_version_id=?',[bp]);
      const contract:StructureContract={schemaVersion:1,sites:siteRows.map(s=>({slotKey:s.blueprint_key,provides:isA?['wordpress',...(original==='AW-ECOM-BASE'?['woocommerce']:[])]:[],modes:structureKey==='one-page-base'?['create','existing']:['create']})),pages:db.all<{template_node_id:string;blueprint_key:string}>(`SELECT p.template_node_id,s.blueprint_key FROM project_template_site_pages p JOIN project_template_sites s ON s.id=p.template_site_id WHERE s.template_version_id=?`,[bp]).map((p,index)=>({slotKey:'page-'+index,templateNodeId:p.template_node_id,siteSlotKey:p.blueprint_key,quota:'content'})),modules:module?db.all<{id:string}>('SELECT id FROM project_template_nodes WHERE template_version_id=?',[bp]).map(n=>({templateNodeId:n.id,parentTargetSlot:'destination'})):[]};
      db.run("INSERT INTO blueprint_operational_profiles(template_version_id,mode,requires_operational,provenance_json) VALUES(?,'structural',1,?)",[bp,JSON.stringify({fixture:true,structureContract:contract})]);
      references.useStructure(bp);versions.set(original,bp);sharedStructures.set(structureKey,bp);
      }
      db.run('INSERT INTO catalog_project_blueprints(id,catalog_version_id,template_version_id,role,quantity_mode,site_mode,created_at) VALUES(?,?,?,?,?,?,?)',['fixture-8a1-'+original,i.versions[0].id,bp,isA?'base':'addon',['AW-WEB-PAGE-SUP','AW-LP-SECTION','AW-ECOM-PROD-SIMPLE','AW-ECOM-PROD-VAR'].includes(original)?'per_unit':'once',isA?'create':'extend_base','2026-10-04']);
    }
    const siteSlot=bp?String(db.get('SELECT blueprint_key FROM project_template_sites WHERE template_version_id=?',[bp])!.blueprint_key):null;
    const kind=module?'page':'site';
    const policy:ContributionPolicy={schemaVersion:1,structureClass:isA?'A':isB?'B':isD?'D':'C',structuralRole:isA?'base':isB?'addon':'none',blueprintRequired:isA||isB,allowedBaseSiteModes:original==='AW-LP-BASE'?['create','existing']:['create'],
      quantity:{minUnits:1,maxUnits:isA||original==='AW-WEB-BLOG'?1:null,integerOnly:true,actionMode:'per_sold_unit',structureMode:bp?(['AW-WEB-PAGE-SUP','AW-LP-SECTION','AW-ECOM-PROD-SIMPLE','AW-ECOM-PROD-VAR'].includes(original)?'per_unit':'once'):'none'},
      destinationSlots:isA?[{key:siteSlot!,kind:'site',requiredAt:'preparation',autoSite:'unique_compatible',parentPageChoice:'none'}]:isB||isD?[{key:'destination',kind,requiredAt:isD?'integration':'preparation',autoSite:module||isD?'never':'unique_compatible',parentPageChoice:module?'explicit':'none'}]:[],
      requires:isA?[]:isB?original.startsWith('AW-ECOM')?['woocommerce']:['wordpress']:[],
      actionRequirements:Object.fromEntries(model.actions.map((a,index)=>[a.key,{target:isA?'site':isB?kind:isD&&index>0?'site':'none',...(isA?{slot:siteSlot!}:isB||isD&&index>0?{slot:'destination'}:{}),requiredAt:isA||isB?'preparation':'integration',justification:'Fixture explicite par actionKey, sans inférence runtime'}])),
      actionRequirementsReview:{status:'fixture',reference:'Synthetic test mapping only'},originPolicy:'direct_sold_line',policySource:'Fixture 8A.1 — aucune configuration réelle'};
    if(original==='AW-WEB-BLOG')policy.targetLimit={maxPerSite:1,key:'blog'};
    policies.set(original,policy);references.activateLink(references.link(i.versions[0].id,modelId,bp,{fixture:true,configuration:policy}));
  }
  const createQuote=(code='AW-WEB-VITRINE')=>{
    const prospect=f.crm.createProspect({organizationId:f.crm.createOrganization({name:'Fixture 8A.1'}).id,primaryNeed:'Test isolé'});
    const q=f.quotes.create({prospectId:prospect.id,subject:'Simulation '+code});f.quotes.addCatalogLine(q.id,items.get(code)!.versions[0].id);return f.quotes.get(q.id);
  };
  const add=(q:string,code:string,quantity=1000)=>{const l=f.quotes.addCatalogLine(q,items.get(code)!.versions[0].id).lines.at(-1)!;if(quantity!==1000)f.quotes.updateLine(l.id,{label:l.label,quantityMilli:quantity});return f.quotes.get(q);};
  return {...f,projects,sites,references,items,models,versions,policies,reference,createQuote,add,prepare:(quoteId:string)=>projects.commercial.prepare({quoteId}),time:new TimeService(db)};
}
