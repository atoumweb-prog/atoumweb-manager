import {randomUUID} from 'node:crypto';
import type {DatabaseAdapter,SqlValue} from '../database/DatabaseAdapter';

/** Explicit approved standalone revisions; never changes their source or parent item. */
export class OperationalCommercialPreparationService {
  constructor(private readonly db:DatabaseAdapter){}

  prepareStandalone(code:'AW-WEB-VITRINE'|'AW-LP-BASE',sourceVersionId:string):string {
    this.db.exec('SAVEPOINT operational_standalone_version');
    try {
      const source=this.db.get<Record<string,SqlValue>>(`SELECT v.* FROM catalog_versions v
        JOIN catalog_items i ON i.id=v.item_id WHERE v.id=? AND i.canonical_code=? AND i.item_type='offer'`,[sourceVersionId,code]);
      if(!source||source.version_number!==2||source.status!=='draft')throw Error('Source commerciale V2 exacte requise.');
      const old=this.db.get<Record<string,SqlValue>>(`SELECT * FROM catalog_versions WHERE item_id=?
        AND json_extract(provenance_json,'$.operationalPreparation.sourceVersionId')=?`,[source.item_id,sourceVersionId]);
      if(old) {
        if(old.status!=='draft'||this.db.get('SELECT id FROM offer_components WHERE offer_version_id=?',[old.id]))throw Error('Version autonome déjà modifiée : aucune correction implicite.');
        this.db.exec('RELEASE operational_standalone_version');return String(old.id);
      }
      const latest=this.db.get('SELECT id FROM catalog_versions WHERE item_id=? ORDER BY version_number DESC LIMIT 1',[source.item_id]);
      if(latest?.id!==sourceVersionId)throw Error('Source commerciale remplacée : décision explicite requise.');
      const components=this.db.all<Record<string,SqlValue>>('SELECT * FROM offer_components WHERE offer_version_id=?',[sourceVersionId]);
      if(components.length!==1||components[0].service_version_id!=='atoumweb-web-v1')throw Error('Composition source différente du constat validé.');
      const copiedLinks=this.db.all<Record<string,SqlValue>>('SELECT * FROM catalog_project_blueprints WHERE catalog_version_id=?',[sourceVersionId]);
      const id=randomUUID(),now=new Date().toISOString();
      const row={...source,id,version_number:3,status:'draft',published_at:null,created_at:now,
        provenance_json:JSON.stringify({...JSON.parse(String(source.provenance_json??'{}')),operationalPreparation:{
          code,sourceVersionId,decision:'AtoumWeb : V3 seule propriétaire du modèle opérationnel',
          removedComponents:components,removedBlueprintLinks:copiedLinks,createdAt:now}})};
      this.db.run('INSERT INTO catalog_versions('+Object.keys(row).join(',')+') VALUES('+Object.keys(row).map(()=>'?').join(',')+')',Object.values(row));
      // Deliberately exercise inheritance removal on the new draft only.
      for(const r of components) this.db.run(`INSERT INTO offer_components(id,offer_version_id,service_version_id,is_optional,quantity_milli,sort_order,created_at)
        VALUES(?,?,?,?,?,?,?)`,[randomUUID(),id,r.service_version_id,r.is_optional,r.quantity_milli,r.sort_order,now]);
      for(const r of copiedLinks)this.db.run(`INSERT INTO catalog_project_blueprints(id,catalog_version_id,template_version_id,role,sort_order,created_at,quantity_mode,site_mode)
        VALUES(?,?,?,?,?,?,?,?)`,[randomUUID(),id,r.template_version_id,r.role,r.sort_order,now,r.quantity_mode,r.site_mode]);
      this.db.run('DELETE FROM offer_components WHERE offer_version_id=?',[id]);
      this.db.run('DELETE FROM catalog_project_blueprints WHERE catalog_version_id=?',[id]);
      this.db.exec('RELEASE operational_standalone_version');return id;
    }catch(e){this.db.exec('ROLLBACK TO operational_standalone_version; RELEASE operational_standalone_version');throw e;}
  }
}
