import type {DatabaseAdapter} from '../database/DatabaseAdapter';
import type {ContributionPolicy} from '../../shared/contributionTargets';
import {OperationalReferenceService,operationalHash} from './OperationalReferenceService';
import {validatePolicy} from './ContributionPolicy';

export interface OperationalConfigurationManifest {
  schemaVersion:1; sourceSHA256:string; decisionReference:string;
  entries:{code:string;catalogVersionId:string;modelVersionId:string;blueprintVersionId:string|null;configuration:ContributionPolicy}[];
}
/** Explicit association revisions only. Does not import models, publish or mark them ready. */
export class OperationalConfigurationService {
  constructor(private readonly db:DatabaseAdapter){}
  simulate(manifest:OperationalConfigurationManifest) {
    if(manifest.schemaVersion!==1||!/^[a-f0-9]{64}$/.test(manifest.sourceSHA256)||!manifest.decisionReference.trim()||!manifest.entries.length)throw Error('Manifeste de configuration invalide.');
    const seen=new Set<string>();
    const rows=manifest.entries.map(e=>{
      if(seen.has(e.catalogVersionId))throw Error('Version catalogue dupliquée.');seen.add(e.catalogVersionId);
      const model=this.db.get<Record<string,unknown>>('SELECT * FROM operational_model_versions WHERE id=?',[e.modelVersionId]);
      const catalogue=this.db.get<Record<string,unknown>>('SELECT v.item_id,i.canonical_code FROM catalog_versions v JOIN catalog_items i ON i.id=v.item_id WHERE v.id=?',[e.catalogVersionId]);
      if(!model||model.status!=='ready'||!catalogue||catalogue.item_id!==model.catalog_item_id||catalogue.canonical_code!==e.code||model.canonical_code!==e.code)throw Error('Association exacte catalogue/modèle non disponible : '+e.code);
      validatePolicy(e.configuration,JSON.parse(String(model.model_json)),e.blueprintVersionId,this.db);
      const provenance={governance:'lot8a1',configuration:e.configuration,sourceSHA256:manifest.sourceSHA256,manifestSHA256:operationalHash(manifest),decisionReference:manifest.decisionReference};
      const old=this.db.get<Record<string,unknown>>('SELECT * FROM catalog_operational_links WHERE catalog_version_id=? ORDER BY revision DESC LIMIT 1',[e.catalogVersionId]);
      return {...e,provenance,action:old?.model_version_id===e.modelVersionId&&old.blueprint_version_id===e.blueprintVersionId&&operationalHash(JSON.parse(String(old.provenance_json)))===operationalHash(provenance)?'unchanged':'revision'};
    });
    return {manifestSHA256:operationalHash(manifest),rows,planSHA256:operationalHash({manifest,rows,state:this.db.all('SELECT * FROM catalog_operational_links ORDER BY id')})};
  }
  apply(manifest:OperationalConfigurationManifest,expectedPlanSHA256:string) {
    this.db.exec('SAVEPOINT operational_configuration');
    try{
      const plan=this.simulate(manifest);if(plan.planSHA256!==expectedPlanSHA256)throw Error('Plan de configuration modifié : application refusée.');
      const service=new OperationalReferenceService(this.db);
      for(const e of plan.rows)if(e.action==='revision')service.link(e.catalogVersionId,e.modelVersionId,e.blueprintVersionId,e.provenance);
      this.db.exec('RELEASE operational_configuration');return plan;
    }catch(e){this.db.exec('ROLLBACK TO operational_configuration; RELEASE operational_configuration');throw e;}
  }
}
