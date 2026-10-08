import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { ContractClauseStatus } from '../../shared/contractTerms';
import type { ContractType, ContractTypeReference, ContractTypeVersion, ContractTypeVersionInput } from '../../shared/contractTypes';

type Row = Record<string, unknown>;
const now = () => new Date().toISOString();

/** Composition and classification only: the existing catalogue-to-clause resolver decides applicability. */
export class ContractTypeService {
  constructor(private readonly db: DatabaseAdapter) {}
  available(): boolean { return !!this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='contract_types'"); }
  list(includeArchived = false): ContractType[] {
    if (!this.available()) return [];
    return this.db.all<Row>(`SELECT id FROM contract_types ${includeArchived ? '' : "WHERE status<>'archived'"}`)
      .map(r => this.get(String(r.id))).sort((a,b) => this.label(a).localeCompare(this.label(b),'fr'));
  }
  private label(t: ContractType) { return (t.currentVersion ?? t.versions[0])?.name ?? t.code; }
  get(id: string): ContractType {
    const row = this.db.get<Row>('SELECT * FROM contract_types WHERE id=?',[id]);
    if (!row) throw Error('Type de contrat introuvable.');
    const versions = this.db.all<Row>('SELECT * FROM contract_type_versions WHERE contract_type_id=? ORDER BY version_number DESC',[id]).map(r => this.version(r));
    const catalogLinks = this.db.all<Row>(`SELECT v.id,v.version_number,v.status,i.id AS item_id,i.name,i.canonical_code
      FROM catalog_contract_type_links l JOIN catalog_versions v ON v.id=l.catalog_version_id JOIN catalog_items i ON i.id=v.item_id
      WHERE l.contract_type_id=?`,[id]).map(r => ({catalogVersionId:String(r.id),itemId:String(r.item_id),name:String(r.name),canonicalCode:r.canonical_code as string|null,versionNumber:Number(r.version_number),status:String(r.status)}))
      .sort((a,b) => a.name.localeCompare(b.name,'fr') || b.versionNumber-a.versionNumber);
    return { id,code:String(row.code),status:row.status as ContractClauseStatus,currentVersionId:row.current_version_id as string|null,
      currentVersion:versions.find(v=>v.id===row.current_version_id)??null,versions,catalogLinks };
  }
  private version(r: Row): ContractTypeVersion {
    return {id:String(r.id),typeId:String(r.contract_type_id),versionNumber:Number(r.version_number),name:String(r.name),description:String(r.description),
      status:r.status as ContractTypeVersion['status'],createdAt:String(r.created_at),publishedAt:r.published_at as string|null,
      moduleIds:this.db.all<Row>('SELECT clause_id FROM contract_type_version_modules WHERE contract_type_version_id=? ORDER BY sort_order,clause_id',[String(r.id)]).map(m=>String(m.clause_id))};
  }
  private validate(input: ContractTypeVersionInput): void {
    if (!input.name.trim()) throw Error('Le nom du type est requis.');
    if (new Set(input.moduleIds).size!==input.moduleIds.length) throw Error('Un module ne peut apparaître deux fois.');
    for (const id of input.moduleIds) if (!this.db.get("SELECT id FROM contract_clause_templates WHERE id=? AND scope='catalog'",[id]))
      throw Error('Module introuvable ou socle BASE : le socle reste automatique.');
  }
  private transaction<T>(fn:()=>T):T {
    this.db.exec('SAVEPOINT contract_type_operation;');
    try { const result=fn();this.db.exec('RELEASE contract_type_operation;');return result; }
    catch(e){this.db.exec('ROLLBACK TO contract_type_operation; RELEASE contract_type_operation;');throw e;}
  }
  private log(id:string,action:string,summary:string) {
    this.db.run('INSERT INTO activity_log(entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
      ['contract_type',id,action,summary,'{}',now()]);
  }
  create(code: string,input: ContractTypeVersionInput): ContractType {
    code=code.trim().toUpperCase();if(!/^[A-Z0-9][A-Z0-9._-]*$/.test(code))throw Error('Code de type invalide.');this.validate(input);
    return this.transaction(()=>{
      const id=randomUUID(),date=now();this.db.run('INSERT INTO contract_types(id,code,created_at,updated_at) VALUES (?,?,?,?)',[id,code,date,date]);
      this.createVersion(id,input);this.log(id,'contract_type_created',`Type ${code} créé en brouillon`);return this.get(id);
    });
  }
  createVersion(id:string,input:ContractTypeVersionInput):ContractType {
    const type=this.get(id);if(type.status==='archived')throw Error('Réactive le type avant de le modifier.');this.validate(input);
    return this.transaction(()=>{
      const versionId=randomUUID(),date=now();
      this.db.run('INSERT INTO contract_type_versions(id,contract_type_id,version_number,name,description,created_at) VALUES (?,?,?,?,?,?)',
        [versionId,id,(type.versions[0]?.versionNumber??0)+1,input.name.trim(),input.description.trim(),date]);
      this.modules(versionId,input.moduleIds);this.log(id,'contract_type_version_created','Nouvelle composition en brouillon');return this.get(id);
    });
  }
  private modules(versionId:string,ids:string[]) {
    this.db.run('DELETE FROM contract_type_version_modules WHERE contract_type_version_id=?',[versionId]);
    ids.forEach((id,i)=>this.db.run('INSERT INTO contract_type_version_modules VALUES (?,?,?)',[versionId,id,i*10]));
  }
  updateDraft(versionId:string,input:ContractTypeVersionInput):ContractType {
    const version=this.db.get<Row>('SELECT * FROM contract_type_versions WHERE id=?',[versionId]);
    if(!version||version.status!=='draft')throw Error('Crée une nouvelle version pour modifier une composition publiée.');this.validate(input);
    if(this.get(String(version.contract_type_id)).status==='archived')throw Error('Réactive le type avant de le modifier.');
    return this.transaction(()=>{
      this.db.run('UPDATE contract_type_versions SET name=?,description=? WHERE id=?',[input.name.trim(),input.description.trim(),versionId]);
      this.modules(versionId,input.moduleIds);this.log(String(version.contract_type_id),'contract_type_draft_saved','Composition et ordre enregistrés en brouillon');return this.get(String(version.contract_type_id));
    });
  }
  publish(versionId:string):ContractType {
    const r=this.db.get<Row>('SELECT * FROM contract_type_versions WHERE id=?',[versionId]);if(!r||r.status!=='draft')throw Error('Version brouillon requise.');
    const type=this.get(String(r.contract_type_id));if(type.status!=='active')throw Error('Le type doit être actif.');
    for(const id of this.version(r).moduleIds)if(!this.db.get("SELECT t.id FROM contract_clause_templates t JOIN contract_clause_versions v ON v.id=t.current_version_id WHERE t.id=? AND t.status='active' AND v.status='published'",[id]))throw Error('Chaque module doit avoir une version publiée active avant publication du type.');
    return this.transaction(()=>{
      this.db.run("UPDATE contract_type_versions SET status='retired' WHERE contract_type_id=? AND status='published'",[type.id]);
      this.db.run("UPDATE contract_type_versions SET status='published',published_at=? WHERE id=?",[now(),versionId]);
      this.db.run('UPDATE contract_types SET current_version_id=?,updated_at=? WHERE id=?',[versionId,now(),type.id]);
      this.log(type.id,'contract_type_published','Publication volontaire de la composition');return this.get(type.id);
    });
  }
  setStatus(id:string,status:ContractClauseStatus):ContractType {
    this.get(id);if(!['active','inactive','archived'].includes(status))throw Error('Statut invalide.');
    this.db.run('UPDATE contract_types SET status=?,archived_at=?,updated_at=? WHERE id=?',[status,status==='archived'?now():null,now(),id]);
    this.log(id,'contract_type_status',status);return this.get(id);
  }
  catalog(versionId:string):ContractType[] {
    if(!this.available())return [];
    return this.db.all<Row>('SELECT contract_type_id FROM catalog_contract_type_links WHERE catalog_version_id=?',[versionId])
      .map(r=>this.get(String(r.contract_type_id))).sort((a,b)=>this.label(a).localeCompare(this.label(b),'fr'));
  }
  setCatalog(versionId:string,typeIds:string[]):ContractType[] {
    const version=this.db.get<Row>('SELECT status FROM catalog_versions WHERE id=?',[versionId]);
    if(!version||version.status!=='draft')throw Error('Crée une version Catalogue brouillon pour changer ses types de contrat.');
    if(new Set(typeIds).size!==typeIds.length)throw Error('Type dupliqué.');typeIds.forEach(id=>{if(this.get(id).status==='archived')throw Error('Type archivé.');});
    if(this.catalog(versionId).map(t=>t.id).sort().join('|')===[...typeIds].sort().join('|'))return this.catalog(versionId);
    return this.transaction(()=>{
      this.db.run('DELETE FROM catalog_contract_type_links WHERE catalog_version_id=?',[versionId]);
      typeIds.forEach(id=>this.db.run('INSERT INTO catalog_contract_type_links VALUES (?,?,?)',[versionId,id,now()]));
      this.db.run('INSERT INTO activity_log(entity_type,entity_id,action,summary,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
        ['catalog_version',versionId,'catalog_contract_types_changed','Références contractuelles modifiées explicitement sur une version brouillon',JSON.stringify({typeIds}),now()]);return this.catalog(versionId);
    });
  }
  /** Explicit family configuration for initial reference setup, never inferred from legacy labels or name prefixes. */
  initialize():{created:number;linked:number;unchanged:number} {
    const definitions:[string,string,string][]=[['APP','APPLICATION','Applications métier'],['IDENTITE','IDENTITE','Identité visuelle'],['CONTENU','CONTENU','Création de contenu'],['DATA','ANALYTICS','Analytics et mesure d’audience'],['DEVWP','WORDPRESS','Développement WordPress'],['ECOM','ECOMMERCE','E-commerce'],['LANDING','LANDING','Landing page'],['MAINT','MAINTENANCE','Maintenance WordPress & WooCommerce'],['MARIAGE','MARIAGE','Site mariage'],['PHOTO','PHOTO','Photographie et retouche'],['SEO','SEO','SEO et visibilité'],['TECH','TECHNIQUE','Prestations techniques'],['WEB','VITRINE','Site vitrine']];
    return this.transaction(()=>{
      let created=0,linked=0,unchanged=0;
      for(const [family,code,name] of definitions){
        const versions=this.db.all<Row>(`SELECT v.id,i.id AS item_id FROM catalog_versions v JOIN catalog_items i ON i.id=v.item_id
          WHERE i.canonical_code IS NOT NULL AND v.family_code=? AND v.version_number=(SELECT MAX(x.version_number) FROM catalog_versions x WHERE x.item_id=i.id)`,[family]);
        if(!versions.length)continue;
        let row=this.db.get<Row>('SELECT id FROM contract_types WHERE code=?',[code]);
        if(!row){
          const moduleIds=this.db.all<Row>(`SELECT DISTINCT t.id,t.sort_order,t.title FROM catalog_contract_clause_links l JOIN contract_clause_templates t ON t.id=l.clause_id
            WHERE t.scope='catalog' AND l.catalog_item_id IN (${versions.map(()=>'?').join(',')}) ORDER BY t.sort_order,t.title COLLATE NOCASE`,versions.map(v=>String(v.item_id))).map(r=>String(r.id));
          row={id:this.create(code,{name,description:`Référentiel issu de la famille Catalogue ${family}. Modules applicables uniquement selon les prestations vendues.`,moduleIds}).id};created++;
        }
        for(const v of versions){
          if(this.db.get('SELECT 1 FROM catalog_contract_type_links WHERE catalog_version_id=? AND contract_type_id=?',[String(v.id),String(row.id)])){unchanged++;continue;}
          // Initial binding of unused references only; never backfill a sold version.
          if(this.db.get('SELECT 1 FROM quote_lines WHERE catalog_version_id=?',[String(v.id)]))throw Error('Initialisation refusée : version Catalogue déjà vendue.');
          this.db.run('INSERT INTO catalog_contract_type_links VALUES (?,?,?)',[String(v.id),String(row.id),now()]);linked++;
        }
      }
      return {created,linked,unchanged};
    });
  }
  orderWarnings(refs:ContractTypeReference[],applicableIds:Set<string>):string[] {
    const warnings:string[]=[];
    for(let i=0;i<refs.length;i++)for(let j=i+1;j<refs.length;j++){
      const a=refs[i].moduleIds.filter(id=>applicableIds.has(id)&&refs[j].moduleIds.includes(id));
      const b=refs[j].moduleIds.filter(id=>a.includes(id));
      if(a.length>1&&a.join('|')!==b.join('|'))warnings.push(`Ordres contractuels incompatibles : ${refs[i].name} / ${refs[j].name}. Réordonner explicitement les clauses de ce devis avant finalisation.`);
    }
    return warnings;
  }
  quoteReferences(quoteId:string):ContractTypeReference[] {
    if(!this.available())return [];
    const result=new Map<string,ContractTypeReference>();
    const versionIds=new Set<string>();
    for(const line of this.db.all<Row>('SELECT catalog_version_id,snapshot_json FROM quote_lines WHERE quote_id=? ORDER BY sort_order,created_at',[quoteId])){
      if(line.catalog_version_id)versionIds.add(String(line.catalog_version_id));
      const snapshot=line.snapshot_json?JSON.parse(String(line.snapshot_json)):null;
      for(const component of snapshot?.offerComponents??[])if(!component.isOptional&&component.serviceVersionId)versionIds.add(component.serviceVersionId);
    }
    for(const versionId of versionIds)for(const type of this.catalog(versionId)){
      const v=type.currentVersion;if(type.status!=='active'||!v)continue;
      const existing=result.get(type.id);if(existing)existing.catalogVersionIds.push(versionId);
      else result.set(type.id,{id:type.id,code:type.code,name:v.name,versionId:v.id,versionNumber:v.versionNumber,moduleIds:v.moduleIds,catalogVersionIds:[versionId]});
    }
    return [...result.values()];
  }
}
