import {createHash,randomUUID} from 'node:crypto';
import {copyFileSync,readFileSync,existsSync,mkdirSync,statSync,unlinkSync} from 'node:fs';
import {basename,extname,join,relative,resolve,sep} from 'node:path';
import type {DatabaseAdapter} from '../database/DatabaseAdapter';
import type {WorkspacePaths} from '../workspace';
import {CLIENT_DOCUMENT_CATEGORIES,type ClientDocument,type ClientDocumentCategory,type ClientDocumentInput} from '../../shared/clientDocuments';

const folders:Record<ClientDocumentCategory,string>={contract:'01 Contrats',quote:'02 Devis',invoice:'03 Factures',brief:'04 Briefs',content:'05 Contenus',technical:'06 Technique',legal:'07 Juridique',other:'08 Autres'};
const clean=(value?:string|null)=>value?.trim()||null;
export class ClientDocumentService {
  constructor(private db:DatabaseAdapter,private workspace:WorkspacePaths){}
  isDevelopmentWorkspace():boolean{return /(?:^|[\\/])Validation-MSI$/i.test(this.workspace.root);}
  list(clientId:string,includeArchived=false):ClientDocument[]{this.requireClient(clientId);return this.db.all<Record<string,unknown>>(`SELECT * FROM client_documents WHERE client_account_id=? ${includeArchived?'':'AND archived_at IS NULL'} ORDER BY updated_at DESC`,[clientId]).map(row=>this.map(row));}
  get(id:string):ClientDocument{const row=this.db.get<Record<string,unknown>>('SELECT * FROM client_documents WHERE id=?',[id]);if(!row)throw Error('Document introuvable.');return this.map(row);}
  importPaths(clientId:string,paths:string[],input:ClientDocumentInput):ClientDocument[]{this.requireClient(clientId);this.validate(input);const dir=join(this.clientRoot(clientId),folders[input.category]);mkdirSync(dir,{recursive:true});for(const path of paths){const source=resolve(path);if(!existsSync(source)||!statSync(source).isFile())continue;const destination=this.unique(dir,basename(source));if(source!==resolve(destination))copyFileSync(source,destination);const now=new Date().toISOString(),stats=statSync(destination);this.db.run(`INSERT INTO client_documents (id,client_account_id,category,title,original_name,relative_path,mime_type,size_bytes,retention_code,retention_reason,retention_until,notes,created_at,updated_at,sha256,imported_from) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[randomUUID(),clientId,input.category,clean(input.title)||basename(source),basename(source),relative(this.workspace.root,destination),this.mime(destination),Number(stats.size),clean(input.retentionCode),clean(input.retentionReason),clean(input.retentionUntil),clean(input.notes),now,now,createHash('sha256').update(readFileSync(destination)).digest('hex'),source]);this.log(clientId,'document_imported',`Document importé : ${basename(source)}`);}return this.list(clientId);}
  update(id:string,input:ClientDocumentInput):ClientDocument{
    const current=this.get(id);
    this.validate(input);
    if(input.category!=='invoice'){
      const activeInvoice=this.db.get<{id:string}>('SELECT id FROM billing_items WHERE invoice_document_id=? LIMIT 1',[id]);
      const historicalInvoice=this.db.get<{id:number}>(
        "SELECT id FROM activity_log WHERE entity_type='billing_item' AND action IN ('billing_invoice_attached','billing_invoice_replaced') AND json_valid(metadata_json) AND (json_extract(metadata_json,'$.previousDocumentId')=? OR json_extract(metadata_json,'$.currentDocumentId')=?) LIMIT 1",
        [id,id],
      );
      if(activeInvoice||historicalInvoice)throw Error('Une facture Abby rattachée ou historique doit rester classée dans Factures.');
    }
    this.db.run('UPDATE client_documents SET category=?,title=?,retention_code=?,retention_reason=?,retention_until=?,notes=?,updated_at=? WHERE id=?',[input.category,clean(input.title),clean(input.retentionCode),clean(input.retentionReason),clean(input.retentionUntil),clean(input.notes),new Date().toISOString(),id]);this.log(current.clientAccountId,'document_updated',`Document mis à jour : ${input.title}`);return this.get(id);}
  archive(id:string,archived=true):ClientDocument{const current=this.get(id),now=new Date().toISOString();this.db.run('UPDATE client_documents SET archived_at=?,updated_at=? WHERE id=?',[archived?now:null,now,id]);this.log(current.clientAccountId,archived?'document_archived':'document_restored',`${archived?'Document archivé':'Document restauré'} : ${current.title}`);return this.get(id);}
  deletePermanently(id:string):void{
    const current=this.get(id);
    const quote=this.db.get<{quote_number:string}>('SELECT quote_number FROM quotes WHERE contract_document_id=? LIMIT 1',[id]);
    const linked=this.db.get('SELECT id FROM quote_document_links WHERE document_id=? LIMIT 1',[id]);
    if(quote||linked)throw Error(`Ce document constitue une preuve contractuelle rattachée au devis ${quote?.quote_number ?? 'référencé dans son historique'}. Sa suppression définitive est interdite ; l’archivage conserve le fichier et son rattachement.`);
    const invoiceLink=this.db.get<{id:string}>('SELECT id FROM billing_items WHERE invoice_document_id=? LIMIT 1',[id]);
    if(invoiceLink)throw Error('Cette facture PDF est rattachée à un élément de facturation. Sa suppression définitive est interdite ; utilise l’archivage.');
    const invoiceHistory=this.db.get<{id:number}>(
      "SELECT id FROM activity_log WHERE entity_type='billing_item' AND action IN ('billing_invoice_attached','billing_invoice_replaced') AND json_valid(metadata_json) AND (json_extract(metadata_json,'$.previousDocumentId')=? OR json_extract(metadata_json,'$.currentDocumentId')=?) LIMIT 1",
      [id,id],
    );
    if(invoiceHistory)throw Error('Cette facture PDF figure dans l’historique de facturation Abby. Sa suppression définitive est interdite ; utilise l’archivage.');
    const path=this.absolutePath(current);
    if(existsSync(path))unlinkSync(path);
    this.db.run('DELETE FROM client_documents WHERE id=?',[id]);
    this.log(current.clientAccountId,'document_deleted',`Document supprimé définitivement : ${current.title}`);
  }
  importQuoteEvidence(quoteId:string,sourcePath:string):{relativePath:string;fileName:string;sha256:string} {
    if(!this.db.get('SELECT id FROM quotes WHERE id=?',[quoteId]))throw Error('Devis introuvable.');
    if(!/^[a-zA-Z0-9-]+$/.test(quoteId))throw Error('Identifiant de devis invalide.');
    const source=resolve(sourcePath);
    if(!existsSync(source)||!statSync(source).isFile())throw Error('Fichier de preuve absent.');
    const dir=join(this.workspace.internalDirectory,'preuves-devis',quoteId);mkdirSync(dir,{recursive:true});
    const target=this.unique(dir,basename(source));copyFileSync(source,target);
    return{relativePath:relative(this.workspace.root,target),fileName:basename(source),sha256:createHash('sha256').update(readFileSync(target)).digest('hex')};
  }
  quoteEvidencePath(relativePath:string,sha256:string):string {
    const target=resolve(this.workspace.root,relativePath),prefix=resolve(this.workspace.internalDirectory,'preuves-devis')+sep;
    if(!target.startsWith(prefix))throw Error('Chemin de preuve invalide.');
    if(!existsSync(target)||!statSync(target).isFile())throw Error('Preuve manquante.');
    if(createHash('sha256').update(readFileSync(target)).digest('hex')!==sha256)throw Error('Preuve modifiée : intégrité rompue.');
    return target;
  }
  fingerprint(id:string):string {
    const doc=this.get(id),path=this.absolutePath(doc);
    if(!existsSync(path)||!statSync(path).isFile())throw Error('Document manquant : ouverture/rattachement refusé.');
    const bytes=readFileSync(path);
    if(doc.category==='invoice'&&!/%PDF-\d\.\d/.test(bytes.subarray(0,1024).toString('latin1')))throw Error('Facture Abby invalide : signature PDF absente.');
    const hash=createHash('sha256').update(bytes).digest('hex');
    if(doc.sha256&&doc.sha256!==hash)throw Error('Document modifié : empreinte SHA-256 différente, ouverture/rattachement refusé.');
    // Explicit legacy attachment only: no migration or read-time backfill.
    if(!doc.sha256)this.db.run('UPDATE client_documents SET sha256=? WHERE id=?',[hash,id]);
    return hash;
  }
  verifiedPath(id:string):string {
    const doc=this.get(id),path=this.absolutePath(doc);
    if(!existsSync(path))throw Error('Document manquant : ouverture refusée.');
    const bytes=readFileSync(path);
    if(doc.category==='invoice'&&!/%PDF-\d\.\d/.test(bytes.subarray(0,1024).toString('latin1')))throw Error('Facture Abby invalide : signature PDF absente.');
    const hash=createHash('sha256').update(bytes).digest('hex');
    if(doc.sha256&&doc.sha256!==hash)throw Error('Document modifié : empreinte SHA-256 différente, ouverture refusée.');
    // Historical un-hashed files stay un-hashed; never certify their past integrity.
    return path;
  }
  absolutePath(item:ClientDocument|string):string{const doc=typeof item==='string'?this.get(item):item;const path=resolve(this.workspace.root,doc.relativePath);if(!path.startsWith(resolve(this.workspace.clientsDirectory)+sep))throw Error('Chemin de document invalide.');return path;}
  clientRoot(clientId:string):string{this.requireClient(clientId);const path=join(this.workspace.clientsDirectory,clientId,'Documents');mkdirSync(path,{recursive:true});return path;}
  search(query:string){const like=`%${query.trim()}%`;return this.db.all<Record<string,unknown>>(`SELECT d.id,d.client_account_id,d.title,d.original_name,d.category,COALESCE(o.name,trim(c.first_name||' '||c.last_name),'Client') client_name FROM client_documents d JOIN client_accounts ca ON ca.id=d.client_account_id LEFT JOIN organizations o ON o.id=ca.organization_id LEFT JOIN contacts c ON c.id=ca.primary_contact_id WHERE d.archived_at IS NULL AND (d.title LIKE ? COLLATE NOCASE OR d.original_name LIKE ? COLLATE NOCASE OR d.notes LIKE ? COLLATE NOCASE) LIMIT 8`,[like,like,like]);}
  private requireClient(id:string){if(!this.db.get('SELECT id FROM client_accounts WHERE id=?',[id]))throw Error('Client introuvable.');}
  private validate(input:ClientDocumentInput){if(!CLIENT_DOCUMENT_CATEGORIES.includes(input.category))throw Error('Catégorie documentaire invalide.');if(!clean(input.title))throw Error('Le titre du document est requis.');}
  private map(row:Record<string,unknown>):ClientDocument{const relativePath=String(row.relative_path);return{id:String(row.id),clientAccountId:String(row.client_account_id),category:row.category as ClientDocumentCategory,title:String(row.title),fileName:String(row.original_name),relativePath,mimeType:row.mime_type as string|null,sizeBytes:Number(row.size_bytes),retentionCode:row.retention_code as string|null,retentionReason:row.retention_reason as string|null,retentionUntil:row.retention_until as string|null,notes:row.notes as string|null,archivedAt:row.archived_at as string|null,createdAt:String(row.created_at),updatedAt:String(row.updated_at),sha256:row.sha256 as string|null,importedFrom:row.imported_from as string|null,missing:!existsSync(resolve(this.workspace.root,relativePath))};}
  private unique(dir:string,name:string){const ext=extname(name),stem=ext?name.slice(0,-ext.length):name;let path=join(dir,name),i=2;while(existsSync(path))path=join(dir,`${stem} (${i++})${ext}`);return path;}
  private mime(path:string){const types:Record<string,string>={'.pdf':'application/pdf','.doc':'application/msword','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','.txt':'text/plain','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'};return types[extname(path).toLowerCase()]??null;}
  private log(clientId:string,action:string,summary:string){this.db.run('INSERT INTO activity_events (id,entity_type,entity_id,action,summary,client_account_id,created_at) VALUES (?,?,?,?,?,?,?)',[randomUUID(),'client',clientId,action,summary,clientId,new Date().toISOString()]);}
}
