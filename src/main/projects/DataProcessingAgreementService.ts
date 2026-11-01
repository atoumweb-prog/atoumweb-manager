import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { DataProcessingAgreement, DataProcessingAgreementGate, DataProcessingAgreementPayload, DataProcessingAgreementStatus } from '../../shared/dataProcessingAgreements';

const SOURCE_REFERENCE = 'AtoumWeb_Accord_RGPD_V3.docx';
const SOURCE_SHA256 = '7C646476C7F35E73D1681F2DAD602994873C018048A98ECCE086CDDD7B07B51F';

type Row = {
  id:string; project_site_id:string; client_account_id:string; version_number:number;
  previous_version_id:string|null; status:DataProcessingAgreementStatus; source_reference:string;
  source_sha256:string; payload_json:string; sent_at:string|null; signed_at:string|null;
  signed_document_id:string|null; created_at:string; updated_at:string;
};

export class DataProcessingAgreementService {
  constructor(private readonly db: DatabaseAdapter) {}

  listForSite(siteId:string):DataProcessingAgreement[] {
    this.requireSite(siteId);
    return this.db.all<Row>('SELECT * FROM data_processing_agreements WHERE project_site_id=? ORDER BY version_number DESC',[siteId]).map(row=>this.map(row));
  }

  createDraft(siteId:string):DataProcessingAgreement {
    const site=this.requireSite(siteId);
    const existing=this.db.get<{id:string}>('SELECT id FROM data_processing_agreements WHERE project_site_id=? AND status IN (\'preparation\',\'revision\')',[siteId]);
    if(existing) throw Error('Un accord RGPD modifiable existe déjà pour ce Site.');
    const version=(this.db.get<{value:number}>('SELECT COALESCE(MAX(version_number),0)+1 value FROM data_processing_agreements WHERE project_site_id=?',[siteId])?.value??1);
    const id=randomUUID(),now=new Date().toISOString();
    const payload=this.defaults(site.name,site.desired_domain);
    this.db.run(`INSERT INTO data_processing_agreements(id,project_site_id,client_account_id,version_number,status,source_reference,source_sha256,payload_json,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?)`,[id,siteId,site.client_account_id,version,'preparation',SOURCE_REFERENCE,SOURCE_SHA256,JSON.stringify(payload),now,now]);
    this.log(id,'rgpd_agreement_created',`Accord RGPD V${version} préparé volontairement pour ${site.name}.`);
    return this.get(id);
  }

  updateDraft(id:string,payload:DataProcessingAgreementPayload):DataProcessingAgreement {
    const current=this.get(id);
    if(current.status!=='preparation'&&current.status!=='revision') throw Error('Une version envoyée ou signée est immuable. Crée une révision.');
    this.validatePayloadShape(payload);
    const now=new Date().toISOString();
    this.db.run('UPDATE data_processing_agreements SET payload_json=?,updated_at=? WHERE id=?',[JSON.stringify(payload),now,id]);
    this.log(id,'rgpd_agreement_updated',`Accord RGPD V${current.versionNumber} enregistré.`);
    return this.get(id);
  }

  createRevision(id:string):DataProcessingAgreement {
    const current=this.get(id);
    if(current.status==='preparation'||current.status==='revision') throw Error('La version courante est déjà modifiable.');
    const open=this.db.get<{id:string}>('SELECT id FROM data_processing_agreements WHERE project_site_id=? AND status IN (\'preparation\',\'revision\')',[current.projectSiteId]);
    if(open) throw Error('Une révision modifiable existe déjà pour ce Site.');
    const version=(this.db.get<{value:number}>('SELECT MAX(version_number)+1 value FROM data_processing_agreements WHERE project_site_id=?',[current.projectSiteId])?.value??current.versionNumber+1);
    const next=randomUUID(),now=new Date().toISOString();
    this.db.run(`INSERT INTO data_processing_agreements(id,project_site_id,client_account_id,version_number,previous_version_id,status,source_reference,source_sha256,payload_json,created_at,updated_at)
      VALUES(?,?,?,?,?,'revision',?,?,?,?,?)`,[next,current.projectSiteId,current.clientAccountId,version,current.id,SOURCE_REFERENCE,SOURCE_SHA256,JSON.stringify(current.payload),now,now]);
    this.log(next,'rgpd_agreement_revision_created',`Révision RGPD V${version} créée depuis V${current.versionNumber}.`);
    return this.get(next);
  }

  markSent(id:string):DataProcessingAgreement {
    const current=this.get(id);
    if(current.status!=='preparation'&&current.status!=='revision') throw Error('Seul un accord en préparation peut être marqué envoyé.');
    const issues=this.completenessIssues(current.payload);
    if(issues.length) throw Error(`Accord RGPD incomplet : ${issues.join(' ; ')}`);
    const now=new Date().toISOString();
    this.db.run("UPDATE data_processing_agreements SET status='sent',sent_at=?,updated_at=? WHERE id=?",[now,now,id]);
    this.log(id,'rgpd_agreement_sent',`Accord RGPD V${current.versionNumber} marqué envoyé.`);
    return this.get(id);
  }

  markSigned(id:string,documentId:string):DataProcessingAgreement {
    const current=this.get(id);
    if(current.status!=='sent') throw Error('Seul un accord envoyé peut être marqué signé.');
    const document=this.db.get<{id:string;client_account_id:string;archived_at:string|null}>('SELECT id,client_account_id,archived_at FROM client_documents WHERE id=?',[documentId]);
    if(!document||document.archived_at||document.client_account_id!==current.clientAccountId) throw Error('La preuve signée doit être un document actif du même client.');
    const now=new Date().toISOString();
    this.db.run("UPDATE data_processing_agreements SET status='signed',signed_at=?,signed_document_id=?,updated_at=? WHERE id=?",[now,documentId,now,id]);
    this.log(id,'rgpd_agreement_signed',`Accord RGPD V${current.versionNumber} signé avec preuve ${documentId}.`);
    return this.get(id);
  }

  gate(siteId:string):DataProcessingAgreementGate {
    this.requireSite(siteId);
    const latest=this.db.get<Row>('SELECT * FROM data_processing_agreements WHERE project_site_id=? ORDER BY version_number DESC LIMIT 1',[siteId]);
    if(!latest) return {required:false,allowed:true,reason:'Aucun traitement de données n’est déclaré pour ce Site.',agreementId:null};
    const agreement=this.map(latest),required=agreement.payload.operations.length>0;
    if(!required) return {required:false,allowed:true,reason:'Aucun traitement nécessitant un accord signé n’est sélectionné.',agreementId:agreement.id};
    return agreement.status==='signed'
      ? {required:true,allowed:true,reason:'La dernière version de l’accord RGPD est signée et couvre les traitements déclarés.',agreementId:agreement.id}
      : {required:true,allowed:false,reason:'L’accord RGPD doit être signé avant d’exécuter les traitements déclarés.',agreementId:agreement.id};
  }

  completenessIssues(payload:DataProcessingAgreementPayload):string[] {
    const issues:string[]=[];
    if(!payload.siteReference.trim())issues.push('site');
    if(!payload.contractReference.trim())issues.push('référence contractuelle');
    if(!payload.operations.length)issues.push('opérations');
    if(!payload.purpose.trim())issues.push('finalité');
    if(!payload.dataSubjects.length)issues.push('personnes concernées');
    if(!payload.dataCategories.length)issues.push('données traitées');
    if(payload.exitInstruction==='to-confirm')issues.push('sort des données');
    if(!payload.incidentContactEmail.trim())issues.push('contact incident');
    if(payload.transfers==='to-confirm')issues.push('transferts hors UE');
    if(payload.providers.some(provider=>!provider.authorized||provider.rgpdRole==='to-confirm'))issues.push('sous-traitants ultérieurs');
    return issues;
  }

  private requireSite(siteId:string):{id:string;name:string;desired_domain:string|null;client_account_id:string} {
    const site=this.db.get<{id:string;name:string;desired_domain:string|null;client_account_id:string|null}>(`SELECT ps.id,ps.name,ps.desired_domain,p.client_account_id
      FROM project_sites ps JOIN projects p ON p.id=ps.project_id WHERE ps.id=?`,[siteId]);
    if(!site)throw Error('Site de Projet introuvable.');
    if(!site.client_account_id)throw Error('Un client doit être associé au Projet avant de préparer un accord RGPD.');
    return {...site,client_account_id:site.client_account_id};
  }
  private get(id:string):DataProcessingAgreement {const row=this.db.get<Row>('SELECT * FROM data_processing_agreements WHERE id=?',[id]);if(!row)throw Error('Accord RGPD introuvable.');return this.map(row);}
  private map(row:Row):DataProcessingAgreement {return {id:row.id,projectSiteId:row.project_site_id,clientAccountId:row.client_account_id,versionNumber:Number(row.version_number),previousVersionId:row.previous_version_id,status:row.status,sourceReference:row.source_reference,sourceSha256:row.source_sha256,payload:JSON.parse(row.payload_json) as DataProcessingAgreementPayload,sentAt:row.sent_at,signedAt:row.signed_at,signedDocumentId:row.signed_document_id,createdAt:row.created_at,updatedAt:row.updated_at};}
  private defaults(name:string,domain:string|null):DataProcessingAgreementPayload {return {siteReference:name,domain:domain??'',contractReference:'',services:[],operations:[],purpose:'',instructions:'',dataSubjects:[],dataCategories:[],specialDataDetails:'',exitInstruction:'to-confirm',exitDetails:'',toolsAndAccesses:'',processingStart:'',processingEnd:'',incidentContactName:'',incidentContactEmail:'',securityNotes:'',exchangeProtection:'',backupNotes:'Sauvegardes assurées par o2switch Cloud selon le service effectivement souscrit ; aucune sauvegarde indépendante AtoumWeb n’est présumée.',providers:[{name:'o2switch',role:'Hébergement Cloud',data:'Données hébergées et sauvegardes du Site selon le service souscrit',accountHolder:'unknown',rgpdRole:'to-confirm',country:'France',authorized:false}],transfers:'to-confirm',transferDetails:'',retentionNotes:''};}
  private validatePayloadShape(payload:DataProcessingAgreementPayload):void {if(!payload||!Array.isArray(payload.operations)||!Array.isArray(payload.providers)||!Array.isArray(payload.dataSubjects)||!Array.isArray(payload.dataCategories))throw Error('Contenu RGPD invalide.');}
  private log(id:string,action:string,summary:string):void {this.db.run('INSERT INTO activity_log(entity_type,entity_id,action,summary,created_at) VALUES(?,?,?,?,?)',['data_processing_agreement',id,action,summary,new Date().toISOString()]);}
}
