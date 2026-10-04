import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import { quoteOptionsFixture } from './quoteOptionsFixture';
import { finalizeForTest, acceptForTest } from './quotePreparationFixture';
import { ProjectService } from '../projects/ProjectService';
import { ProjectSiteService } from '../projects/ProjectSiteService';
import { ProjectBlueprintCompositionService } from '../projects/ProjectBlueprintCompositionService';
import type { WorkspacePaths } from '../workspace';

export function projectCompositionFixture(db: DatabaseAdapter, workspace: WorkspacePaths) {
  const f = quoteOptionsFixture(db), sites = new ProjectSiteService(db), projects = new ProjectService(db,workspace,sites);
  const engine = new ProjectBlueprintCompositionService(db,sites);
  f.quotes.setProjectLifecycle(projects.commercial);
  const draft = projects.createTemplate({name:'Fixture Lot 7 — Vitrine 5 pages',projectType:'website'}).versions[0];
  const root = projects.addTemplateNode(draft.id,{type:'lot',name:'Pages',semanticKey:'pages'}).nodes[0];
  for (let i = 0; i < 5; i++) projects.addTemplateNode(draft.id,{parentId:root.id,type:'module',displaySubtype:'page',name:i?'Page '+i:'Accueil',semanticKey:'pages.'+i,sortOrder:i*10});
  const baseNodes = projects.getTemplate(draft.templateId).versions.find(v=>v.id===draft.id)!.nodes.filter(n=>n.displaySubtype==='page');
  projects.configureTemplateSites(draft.id,[{key:'main',name:'Site principal',pages:baseNodes.map((n,i)=>({key:'page'+i,templateNodeId:n.id,role:i?'standard':'home',desiredPath:i?null:'/',sortOrder:i*10}))}]);
  const base = projects.publishTemplateVersion(draft.id);
  const addon = (name:string, semantic:string, page:boolean) => {
    const v = projects.createTemplate({name:'Fixture Lot 7 — '+name,projectType:'website'}).versions[0];
    const anchor = projects.addTemplateNode(v.id,{type:'lot',name:'Pages',semanticKey:'pages'}).nodes[0];
    const node = projects.addTemplateNode(v.id,{parentId:anchor.id,type:page?'module':'task',displaySubtype:page?'page':null,name,semanticKey:semantic}).nodes.find(n=>n.semanticKey===semantic)!;
    projects.addTemplateNode(v.id,{parentId:node.id,type:'task',name:'Vérifier '+name,semanticKey:semantic+'.check'});
    if(page) projects.configureTemplateSites(v.id,[{key:'main',name:'Site principal',pages:[{key:semantic,templateNodeId:node.id,role:semantic==='pages.blog'?'blog':'standard'}]}]);
    return projects.publishTemplateVersion(v.id);
  };
  const page = addon('Page supplémentaire','pages.extra',true);
  const blog = addon('Blog','pages.blog',true);
  const seo = addon('SEO local','seo.local',false);
  const blogItem = f.catalog.create({type:'service',name:'Fixture Lot 7 Blog',canonicalCode:'AW-TEST-L7-BLOG',identityProvenance:{reference:'Test uniquement'}},
    {priceMode:'fixed',priceCents:4500,prerequisites:['Contenus éditoriaux Blog']});
  f.catalog.publishVersion(blogItem.versions[0].id);
  const link = (id:string,version:string,template:string,role:'base'|'addon',mode='once',site='create') =>
    db.run('INSERT INTO catalog_project_blueprints(id,catalog_version_id,template_version_id,role,quantity_mode,site_mode,created_at) VALUES(?,?,?,?,?,?,?)',
      [id,version,template,role,mode,site,'2026-10-03T00:00:00Z']);
  link('fixture-l7-base',f.offer.currentVersion!.id,base.id,'base');
  // The same base supplied by an included service is a second provenance, not a concurrent independent sale.
  link('fixture-l7-base-included',f.services[0].currentVersion!.id,base.id,'base');
  link('fixture-l7-page',f.services[1].currentVersion!.id,page.id,'addon','per_unit','extend_base');
  link('fixture-l7-blog',blogItem.versions[0].id,blog.id,'addon','once','extend_base');
  link('fixture-l7-seo',f.services[2].currentVersion!.id,seo.id,'addon','once','extend_base');
  const accept = (id:string) => {finalizeForTest(db,f.quotes,id);f.quotes.markSent(id);return acceptForTest(db,f.quotes,id);};
  const convert = (id:string) => {accept(id);return projects.transformQuote({quoteId:id});};
  return {...f,sites,projects,engine,base,page,blog,seo,blogItem,convert,accept,link};
}
