import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { WorkspacePaths } from '../workspace';
import { quoteOptionsFixture } from './quoteOptionsFixture';
import { operationalExamples } from './operationalReferenceFixture';
import { OperationalReferenceService } from '../projects/OperationalReferenceService';
import { ProjectOperationalService } from '../projects/ProjectOperationalService';
import { ProjectService } from '../projects/ProjectService';
import { ProjectSiteService } from '../projects/ProjectSiteService';
import { TimeService } from '../time/TimeService';

/** Synthetic commercial records only; original operational values are preserved. */
export function projectOperationalFixture(db: DatabaseAdapter, workspace: WorkspacePaths) {
  const f=quoteOptionsFixture(db),sites=new ProjectSiteService(db),projects=new ProjectService(db,workspace,sites);
  f.quotes.setProjectLifecycle(projects.commercial);
  const reference=structuredClone(operationalExamples);
  const sourceCodes=new Map<string,string>();
  const items=new Map<string,ReturnType<typeof f.catalog.create>>();
  for(const m of reference.models) {
    const original=m.code;m.code=original.replace('AW-','AW-TEST8A-');sourceCodes.set(original,m.code);
    for(const a of m.actions) a.key=a.key.replace(original,m.code);
    const i=f.catalog.create({type:original==='AW-WEB-VITRINE'?'offer':'service',name:'Simulation '+m.name,canonicalCode:m.code,
      identityProvenance:{reference:'Fixture Lot 8A uniquement'}},{priceMode:'fixed',priceCents:10000,prerequisites:['Prérequis '+original]});
    items.set(original,i);
  }
  const offer=items.get('AW-WEB-VITRINE')!;
  for(const [code,i] of items) if(code!=='AW-WEB-VITRINE') f.catalog.publishVersion(i.versions[0].id);
  f.catalog.setOfferComponents(offer.versions[0].id,[{serviceVersionId:items.get('AW-WEB-PAGE-SUP')!.versions[0].id,isOptional:true,quantityMilli:1000}]);
  f.catalog.publishVersion(offer.versions[0].id);
  const references=new OperationalReferenceService(db),operations=new ProjectOperationalService(db);
  references.importDraft(reference,references.simulate(reference).planHash);
  const structure=references.prepareVitrineStructure(projects);references.useStructure(structure);
  const mainKey=String(db.get('SELECT blueprint_key FROM project_template_sites WHERE template_version_id=?',[structure])!.blueprint_key);
  const addons=new Map<string,string>();
  for(const code of ['AW-WEB-PAGE-SUP','AW-WEB-BLOG']) {
    const v=projects.createTemplate({name:'Structure synthétique '+code,projectType:'website'}).versions[0];
    const node=projects.addTemplateNode(v.id,{type:'module',displaySubtype:'page',name:code,semanticKey:'fixture.'+code}).nodes[0];
    projects.configureTemplateSites(v.id,[{key:mainKey,name:'Destination explicite fixture',pages:[{key:code.toLowerCase(),templateNodeId:node.id,role:code.endsWith('BLOG')?'blog':'standard'}]}]);
    db.run('INSERT INTO blueprint_operational_profiles(template_version_id,mode,requires_operational,provenance_json) VALUES(?,\'structural\',1,?)',[v.id,JSON.stringify({fixture:true})]);
    references.useStructure(v.id);addons.set(code,v.id);
    db.run('INSERT INTO catalog_project_blueprints(id,catalog_version_id,template_version_id,role,quantity_mode,site_mode,created_at) VALUES(?,?,?,\'addon\',?,\'extend_base\',?)',
      ['fixture-8a-'+code,items.get(code)!.versions[0].id,v.id,code.endsWith('PAGE-SUP')?'per_unit':'once','2026-10-04T00:00:00Z']);
  }
  const models=new Map<string,string>();
  for(const [original,code] of sourceCodes) {
    const id=String(db.get('SELECT id FROM operational_model_versions WHERE canonical_code=? ORDER BY version_number DESC LIMIT 1',[code])!.id);
    models.set(original,id);references.markReady(id);
    references.activateLink(references.link(items.get(original)!.versions[0].id,id,original==='AW-WEB-VITRINE'?structure:addons.get(original)??null,{fixture:true,sourceCode:original}));
  }
  db.run('INSERT INTO catalog_project_blueprints(id,catalog_version_id,template_version_id,role,quantity_mode,site_mode,created_at) VALUES(?,?,?,\'base\',\'once\',\'create\',?)',
    ['fixture-8a-base',offer.versions[0].id,structure,'2026-10-04T00:00:00Z']);
  const createQuote=(source='AW-WEB-VITRINE')=>{
    const q=f.quotes.create({prospectId:f.crm.createProspect({organizationId:f.crm.createOrganization({name:'Recette opérationnelle synthétique'}).id,primaryNeed:'Test isolé'}).id,subject:'Simulation 8A '+source});
    f.quotes.addCatalogLine(q.id,items.get(source)!.versions[0].id);return f.quotes.get(q.id);
  };
  const prepare=(quoteId:string)=>projects.commercial.prepare({quoteId});
  const buyPages=(quoteId:string,quantity=2000)=>{
    const q=f.quotes.get(quoteId),components=f.catalog.listOfferComponents(offer.versions[0].id);
    f.quotes.selectOfferOption(q.lines[0].id,components[0].id,{quantityMilli:quantity});return f.quotes.get(quoteId);
  };
  return {...f,sites,projects,references,operations,reference,items,models,structure,createQuote,prepare,buyPages,time:new TimeService(db)};
}
