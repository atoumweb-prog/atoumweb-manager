import {createHash,randomUUID} from 'node:crypto';
import {copyFileSync,existsSync,mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {NodeSqliteAdapter} from '../database/NodeSqliteAdapter';
import type {DatabaseAdapter,SqlValue} from '../database/DatabaseAdapter';
import type {OperationalModel} from '../../shared/operational';
import type {RecipeRequest,RecipePreview,RecipeReference,RecipeState,RecipeClose} from '../../shared/operationalRecipe';
import {recipeScenarios} from './operationalRecipeScenarios';
import {OperationalStagingService} from './OperationalStagingService';
import {ProjectOperationalService} from './ProjectOperationalService';
import {readPolicy} from './ContributionPolicy';
import {createOperationalRecipeFixture,recipeFixtureLabel,recipeFixtureFingerprint} from '../testSupport/operationalRecipeFixture';
type Row=Record<string,unknown>;
export const fileSHA=(p:string):string=>createHash('sha256').update(readFileSync(p)).digest('hex');
const check=(ok:unknown,message:string):void=>{if(!ok)throw Error(message);};
export function exactKeys(v:unknown,keys:string[]):asserts v is Row {
  check(v!==null&&typeof v==='object'&&!Array.isArray(v),'Objet de recette requis.');
  check(Object.keys(v as Row).every(k=>keys.includes(k)),'Champ non autorisé dans la recette.');
}
/** Engines cannot acquire the sandbox writer, migration, backup or close capabilities. */
export function recipeReader(db:DatabaseAdapter):DatabaseAdapter {
  const denied=():never=>{throw Error('Mutation interdite dans le moteur de recette.');};
  return Object.freeze({get:db.get.bind(db),all:db.all.bind(db),run:denied,exec:denied,backupTo:denied,close:denied});
}
export function validateRecipeRequest(input:RecipeRequest,sessionId:string){
    exactKeys(input,['sessionId','scenarioId','requestId','quantities','optionSelected','choices']);
    check(input.sessionId===sessionId,'Session de recette incorrecte.');
    check(Number.isSafeInteger(input.requestId)&&input.requestId>=0,'Identité de requête incorrecte.');
    const scenario=recipeScenarios.find(s=>s.id===input.scenarioId);check(scenario,'Scénario non autorisé.');
    const quantities=input.quantities??{};
    exactKeys(quantities,[...scenario!.lines.map(l=>l.key),...(scenario!.option?[scenario!.option.lineKey]:[])]);
    check(Object.values(quantities).every(q=>typeof q==='number'&&Number.isInteger(q)&&q>=1&&q<=500),'Quantité entière de recette requise.');
    check(input.optionSelected===undefined||(!!scenario!.option&&typeof input.optionSelected==='boolean'),'Option de recette indisponible.');
    check(input.choices===undefined||(Array.isArray(input.choices)&&input.choices.length<=100),'Choix de recette incorrects.');
    for(const c of input.choices??[]){
      exactKeys(c,['lineOrigin','slot','unitIndex','siteOwnerOrigin','siteOwnerSlot','parentPage']);
      check(['lineOrigin','slot','siteOwnerOrigin','siteOwnerSlot'].every(k=>typeof (c as unknown as Row)[k]==='string'&&String((c as unknown as Row)[k]).length<200)&&Number.isSafeInteger(c.unitIndex)&&c.unitIndex>=1,'Choix logique incorrect.');
      if(c.parentPage){exactKeys(c.parentPage,['lineOrigin','templateNodeId']);check(typeof c.parentPage.lineOrigin==='string'&&typeof c.parentPage.templateNodeId==='string','Page logique incorrecte.');}
    }
    return {scenario:scenario!,quantities};
}
export class OperationalRecipeService {
  readonly sessionId=randomUUID();readonly tempDirectory:string;readonly copyPath:string;
  private db:NodeSqliteAdapter|null=null;private readonly sourceSHA:string;private baseline='';private refs:RecipeReference[]=[];
  constructor(private readonly source?:string,expectedFixtureSHA?:string,tempParent=tmpdir()){
    this.sourceSHA=source?fileSHA(source):recipeFixtureFingerprint;
    check(expectedFixtureSHA===undefined||this.sourceSHA===expectedFixtureSHA,'Empreinte de fixture inattendue : recette refusée.');
    this.assertSource();
    this.tempDirectory=mkdtempSync(join(tempParent,'atoumweb-operational-recipe-'));
    this.copyPath=join(this.tempDirectory,'recipe.sqlite');
    try {
      if(source){copyFileSync(source,this.copyPath);this.assertSource();check(fileSHA(this.copyPath)===this.sourceSHA,'Copie instable.');}
      else createOperationalRecipeFixture(this.copyPath);
      this.db=new NodeSqliteAdapter(this.copyPath);
      this.db.exec('PRAGMA foreign_keys=ON; PRAGMA locking_mode=EXCLUSIVE');
      check(this.db.get('PRAGMA integrity_check')?.integrity_check==='ok','Copie SQLite incohérente.');
      check(this.db.all('PRAGMA foreign_key_check').length===0,'Relations SQLite incohérentes.');
      for(const table of ['operational_model_versions','catalog_operational_links','blueprint_operational_profiles','project_action_instances','project_contribution_targets'])check(this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?",[table]),'Schéma de diagnostic incomplet : '+table);
      this.refs=this.loadReferences();this.baseline=this.snapshot();
    }catch(error){this.destroy();throw error;}
  }
  private assertSource():void {
    if(!this.source)return; // Own deterministic fixture, no development-database oracle.
    check(['-wal','-shm','-journal'].every(s=>!existsSync(this.source+s)),'Source active (WAL/SHM/journal) : fermer Manager.');
    check(fileSHA(this.source)===this.sourceSHA,'Source modifiée pendant la recette.');
  }
  private requireDb():NodeSqliteAdapter {check(this.db,'Session de recette fermée.');this.assertSource();return this.db!;}
  private snapshot():string {
    const db=this.db!;
    return JSON.stringify(db.all<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map(t=>[t.name,db.all(`SELECT * FROM "${t.name}"`).map(r=>JSON.stringify(r)).sort()]));
  }
  private loadReferences():RecipeReference[]{
    return this.db!.all<Row>(`SELECT m.*,a.id link_id,a.catalog_version_id,a.blueprint_version_id,a.status link_status,a.provenance_json,
      c.version_number catalog_version FROM operational_model_versions m LEFT JOIN catalog_operational_links a ON a.model_version_id=m.id
      LEFT JOIN catalog_versions c ON c.id=a.catalog_version_id ORDER BY m.canonical_code`).map(r=>{
      const m=JSON.parse(String(r.model_json)) as OperationalModel;
      return {code:m.code,name:m.name,lot:m.lot,modelVersionId:String(r.id),modelVersion:Number(r.version_number),status:'draft',
        catalogVersionId:r.catalog_version_id as string|null,catalogVersion:r.catalog_version===null?null:Number(r.catalog_version),linkId:r.link_id as string|null,
        linkStatus:r.link_status as 'draft'|null,blueprintVersionId:r.blueprint_version_id as string|null,policy:r.provenance_json?readPolicy(String(r.provenance_json))??null:null,estimateRequired:m.estimateRequired,sourceRow:m.sourceRow};
    });
  }
  state():RecipeState{const db=this.requireDb();const count=(table:string)=>Number(db.get('SELECT count(*) n FROM '+table)!.n);return {sessionId:this.sessionId,sourceSHA256:this.sourceSHA,sourceLabel:this.source?'Source technique fournie':recipeFixtureLabel,migrations:Number(db.get('SELECT max(id) n FROM schema_migrations')!.n),models:count('operational_model_versions'),links:count('catalog_operational_links'),profiles:count('blueprint_operational_profiles'),mode:'staging',readOnly:true,canMaterialize:false};}
  references():RecipeReference[]{this.requireDb();return structuredClone(this.refs);}
  scenarios(){this.requireDb();return structuredClone(recipeScenarios);}
  preview(input:RecipeRequest):RecipePreview {
    const db=this.requireDb();
    const {scenario,quantities}=validateRecipeRequest(input,this.sessionId);
    // The private fixture writer exists only inside this rollback boundary.
    db.exec('SAVEPOINT recipe_fixture');
    try {
      const insert=(table:string,row:Row)=>db.run(`INSERT INTO ${table}(${Object.keys(row).join(',')}) VALUES(${Object.keys(row).map(()=>'?').join(',')})`,Object.values(row) as SqlValue[]);
      const id='recipe-'+scenario!.id,now='2026-10-05T00:00:00.000Z';
      const q={...db.get<Row>('SELECT * FROM quotes ORDER BY quote_number LIMIT 1')!,id,quote_number:'SIM-'+scenario!.id,project_id:null,status:'draft',subject:scenario!.name,created_at:now,updated_at:now} as Row;
      for(const k of ['finalized_at','snapshot_locked_at','contract_compiled_at','contract_snapshot_json','contract_text_snapshot','contract_document_id','contract_document_attached_at','accepted_at','accepted_client_account_id','sent_at','viewed_at','refused_at','expired_at','project_ready_at','abby_reference'])q[k]=null;
      insert('quotes',q);
      const option=scenario!.option,selected=input.optionSelected??option?.selected??false;
      const lines=scenario!.lines.filter(l=>!option||l.key!==option.lineKey);
      if(option&&selected)lines.push({key:option.lineKey,code:option.code,quantity:option.quantity});
      const sold:RecipePreview['lines']=[];
      for(const [index,l] of lines.entries()){
        const ref=this.refs.find(r=>r.code===l.code&&r.lot==='8A');check(ref?.catalogVersionId&&ref.linkId,'Référence de staging absente.');
        const cv=db.get<Row>('SELECT * FROM catalog_versions WHERE id=?',[ref!.catalogVersionId!])!;
        const qty=quantities[l.key]??l.quantity,origin=id+'-'+l.key;
        const components=db.all<Row>('SELECT * FROM offer_components WHERE offer_version_id=?',[String(cv.id)]).map(c=>({componentId:c.id,serviceVersionId:c.service_version_id,isOptional:!!c.is_optional,quantityMilli:c.quantity_milli}));
        const line={...db.get<Row>('SELECT * FROM quote_lines LIMIT 1')!,id:origin,quote_id:id,source:'catalog',catalog_item_id:cv.item_id,catalog_version_id:cv.id,label:l.code,description:'Scénario synthétique de recette uniquement',quantity_milli:qty*1000,sort_order:index*10,created_at:now,updated_at:now,
          catalog_unit_price_cents:cv.price_cents??0,proposed_unit_price_cents:cv.price_cents??0,catalog_line_value_cents:Number(cv.price_cents??0)*qty,contract_line_value_cents:Number(cv.price_cents??0)*qty,
          snapshot_json:JSON.stringify({recipeFixture:true,priceUndefined:cv.price_cents===null,prerequisites:JSON.parse(String(cv.prerequisites_json)),offerComponents:components})};
        insert('quote_lines',line);sold.push({key:l.key,origin,code:l.code,quantity:qty,catalogVersionId:String(cv.id),modelVersionId:ref!.modelVersionId,purchasedOption:!!option&&l.key===option.lineKey,priceCents:cv.price_cents as number|null});
      }
      if(option){
        const offer=sold.find(l=>l.key===option.sourceLineKey)!,ref=this.refs.find(r=>r.code===option.code)!;
        const component=id+'-optional-component';
        insert('offer_components',{id:component,offer_version_id:offer.catalogVersionId,service_version_id:ref.catalogVersionId,is_optional:1,quantity_milli:1000,sort_order:10,created_at:now});
        const old=db.get<Row>('SELECT snapshot_json FROM quote_lines WHERE id=?',[offer.origin])!,snapshot=JSON.parse(String(old.snapshot_json));
        snapshot.offerComponents.push({componentId:component,serviceVersionId:ref.catalogVersionId,isOptional:true,quantityMilli:1000});
        db.run('UPDATE quote_lines SET snapshot_json=? WHERE id=?',[JSON.stringify(snapshot),offer.origin]);
        if(selected)insert('quote_option_purchases',{line_id:sold.find(l=>l.key===option.lineKey)!.origin,source_offer_line_id:offer.origin,source_offer_item_id:db.get<Row>('SELECT item_id FROM catalog_versions WHERE id=?',[offer.catalogVersionId])!.item_id,source_offer_version_id:offer.catalogVersionId,source_component_id:component,state:'purchased',purchased_at:now});
      }
      const reader=recipeReader(db),preview=new OperationalStagingService(reader).previewQuote(id,input.choices??[]);
      const actions=preview.operations.actions.filter(a=>a.action),referenceMinutes=actions.reduce((n,a)=>n+(a.referenceMinutes??0),0);
      let runtimeRefused=false;try{new ProjectOperationalService(reader).resolve(id,new Map());}catch(error){runtimeRefused=error instanceof Error&&/compatibilité non configurée|non mis en usage/.test(error.message);}
      return {mode:'staging',readOnly:true,canMaterialize:false,requestId:input.requestId,scenarioId:scenario!.id,sourceSHA256:this.sourceSHA,lines:sold,
        metrics:{actions:actions.length,referenceMinutes,finalEstimate:actions.some(a=>a.estimateRequired)?null:referenceMinutes,sites:preview.blueprint.bases?.length??0,
          pages:preview.blueprint.contributions.reduce((n,c)=>n+(c.structureContract?.pages.length??0)*c.unitCount,0),modules:preview.blueprint.contributions.reduce((n,c)=>n+(c.structureContract?.modules.length??0)*c.unitCount,0)},
        actions,structures:preview.blueprint.contributions.map(c=>({origin:c.lineOrigin!,code:sold.find(l=>l.origin===c.lineOrigin)?.code??'',versionId:c.templateVersionId,role:c.role,units:c.unitCount,contract:c.structureContract!,nodes:c.nodes.map(n=>({id:n.id,name:n.name,...(c.pages.find(p=>p.template_node_id===n.id)?.desired_path?{desiredPath:c.pages.find(p=>p.template_node_id===n.id)!.desired_path}:{}),...(n.description?{description:n.description}:{})}))})),
        targets:preview.targets,logicalChoices:preview.logicalChoices,policies:preview.operations.links.filter(l=>l.configuration).map(l=>({origin:l.lineOrigin!,policy:l.configuration!})),prerequisites:preview.blueprint.prerequisites.map(p=>({label:p.label})),runtimeRefused};
    }finally{
      try{db.exec('ROLLBACK TO recipe_fixture; RELEASE recipe_fixture');check(this.snapshot()===this.baseline,'Résidu de scénario détecté.');this.assertSource();}
      catch(error){this.destroy();throw error;}
    }
  }
  /** Clean first, even when the external source changed during the session. */
  close():RecipeClose {
    this.destroy();const after=this.source?fileSHA(this.source):recipeFixtureFingerprint;
    return {sourceSHA256Before:this.sourceSHA,sourceSHA256After:after,sourceUnchanged:after===this.sourceSHA,copyDeleted:!existsSync(this.tempDirectory)};
  }
  private destroy():void {
    try{this.db?.close();}finally{
      this.db=null;
      const p=resolve(this.tempDirectory);
      check(p.startsWith(resolve(tmpdir())+sep)&&basename(p).startsWith('atoumweb-operational-recipe-'),'Nettoyage hors sandbox refusé.');
      rmSync(p,{recursive:true,force:true,maxRetries:3,retryDelay:100});
    }
  }
}

