import {basename,dirname,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';
import type {DatabaseAdapter,SqlValue} from '../../database/DatabaseAdapter';
import type {StructureContract} from '../../../shared/contributionTargets';
import configuration from './mariageHistoireStructure.json';
export {configuration as mariageHistoireStructure};
type Row=Record<string,unknown>;
const check=(condition:unknown,message:string)=>{if(!condition)throw Error(message);};
/** Preparation on an isolated recipe copy, inside its rollback boundary. Never a runtime writer/API. */
export function prepareHistoireRecipeStructure(db:DatabaseAdapter,copyPath:string) {
  const file=resolve(copyPath),directory=dirname(file);
  check(basename(file)==='recipe.sqlite'&&directory.startsWith(resolve(tmpdir())+sep)&&basename(directory).startsWith('atoumweb-operational-recipe-'), 'Histoire : copie de recette isolée requise.');
  check(db.all<Row>('PRAGMA database_list').find(r=>r.name==='main')?.file===file,'Histoire : adaptateur hors copie refusé.');
  const id='recipe-'+configuration.key,versionId=id+'-version-1',now='2026-10-06T00:00:00.000Z';
  if(db.get('SELECT id FROM project_template_versions WHERE id=?',[versionId]))return versionId;
  const link=db.get<Row>(`SELECT a.* FROM catalog_operational_links a JOIN operational_model_versions m ON m.id=a.model_version_id
    WHERE m.canonical_code=? ORDER BY a.revision DESC LIMIT 1`,[configuration.code]);
  check(link?.status==='draft','Histoire : association brouillon requise.');
  const source=String(link!.blueprint_version_id),profile=db.get<Row>('SELECT * FROM blueprint_operational_profiles WHERE template_version_id=?',[source]);
  check(profile?.mode==='structural'&&profile.operational_ready===0,'Histoire : profil source inactif requis.');
  const model=db.get<Row>('SELECT * FROM operational_model_versions WHERE id=?',[String(link!.model_version_id)]);
  check(model?.status==='draft','Histoire : modèle brouillon requis.');
  const payload=JSON.parse(String(model!.model_json));
  check(payload.actions.length===configuration.actionsUnchanged&&payload.actions.reduce((sum:number,a:{minutes:number})=>sum+a.minutes,0)===configuration.referenceMinutesUnchanged,'Histoire : référence actions/temps différente.');
  const version=db.get<Row>('SELECT * FROM project_template_versions WHERE id=?',[source])!;
  const template=db.get<Row>('SELECT * FROM project_templates WHERE id=?',[String(version.template_id)])!;
  const nodes=db.all<Row>('SELECT * FROM project_template_nodes WHERE template_version_id=? ORDER BY sort_order',[source]);
  const container=nodes.find(n=>n.parent_id===null),page=nodes.find(n=>n.display_subtype==='page');
  const sites=db.all<Row>('SELECT * FROM project_template_sites WHERE template_version_id=?',[source]);
  const pages=db.all<Row>('SELECT * FROM project_template_site_pages WHERE template_site_id=?',[String(sites[0]?.id)]);
  check(nodes.length===2&&container?.node_type==='lot'&&page?.node_type==='module'&&sites.length===1&&pages.length===1,'Histoire : structure source différente, aucune adaptation implicite.');
  const mappings=db.all<Row>('SELECT * FROM catalog_project_blueprints WHERE catalog_version_id=?',[String(link!.catalog_version_id)]);
  check(mappings.length===1&&mappings[0].template_version_id===source&&mappings[0].role==='base','Histoire : raccord source ambigu.');
  const insert=(table:string,row:Row)=>db.run(`INSERT INTO ${table}(${Object.keys(row).join(',')}) VALUES(${Object.keys(row).map(()=>'?').join(',')})`,Object.values(row) as SqlValue[]);
  db.exec('SAVEPOINT histoire_structure');
  try {
    insert('project_templates',{...template,id,name:'Mariage Histoire — structure multipage',created_at:now,updated_at:now});
    insert('project_template_versions',{...version,id:versionId,template_id:id,version_number:1,status:'draft',published_at:null,description:configuration.decision,created_at:now});
    const parent=id+'-structure',siteId=id+'-site';
    insert('project_template_nodes',{...container,id:parent,template_version_id:versionId,created_at:now});
    insert('project_template_sites',{...sites[0],id:siteId,template_version_id:versionId,created_at:now});
    const contract:StructureContract={schemaVersion:1,sites:[{slotKey:String(sites[0].blueprint_key),provides:configuration.provides,modes:['create']}],pages:[],modules:[]};
    configuration.pages.forEach((definition,index)=>{
      const pageId=id+'-'+definition.key;
      insert('project_template_nodes',{...page,id:pageId,template_version_id:versionId,parent_id:parent,name:definition.name,description:definition.description,semantic_key:'structure.'+definition.key,sort_order:(index+1)*10,created_at:now});
      insert('project_template_site_pages',{...pages[0],id:pageId+'-binding',template_site_id:siteId,template_node_id:pageId,blueprint_key:definition.key,role:definition.role,desired_path:definition.path,sort_order:index*10,created_at:now});
      contract.pages.push({slotKey:definition.key,templateNodeId:pageId,siteSlotKey:String(sites[0].blueprint_key),quota:'content'});
    });
    insert('blueprint_operational_profiles',{...profile,template_version_id:versionId,operational_ready:0,provenance_json:JSON.stringify({decision:configuration.decision,configurationKey:configuration.key,configurationVersion:configuration.version,recipeOnly:true,sourceVersion:source,structureContract:contract})});
    insert('catalog_operational_links',{...link,id:id+'-association',blueprint_version_id:versionId,revision:Number(link!.revision)+1,status:'draft',created_at:now,provenance_json:JSON.stringify({...JSON.parse(String(link!.provenance_json)),decisionReference:configuration.decision,recipeOnly:true,previousLinkId:link!.id})});
    // Temporary current staging destination only; frozen plans and the shared blueprint are untouched.
    db.run('UPDATE catalog_project_blueprints SET template_version_id=? WHERE id=?',[versionId,String(mappings[0].id)]);
    db.exec('RELEASE histoire_structure');return versionId;
  }catch(error){db.exec('ROLLBACK TO histoire_structure; RELEASE histoire_structure');throw error;}
}
