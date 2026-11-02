import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { DataProcessingAgreement, DataProcessingAgreementGate, DataProcessingAgreementPayload, DataProcessingAgreementStatus, DataProcessingIncident, DataProcessingIncidentInput, DataProcessingSendAttestation, DataProcessingSignatureAttestation, DataProcessingSiteAssessment, DataProcessingSiteAssessmentInput } from '../../shared/dataProcessingAgreements';

const SOURCE_REFERENCE = 'AtoumWeb_Accord_RGPD_V3.docx';
const SOURCE_SHA256 = '7C646476C7F35E73D1681F2DAD602994873C018048A98ECCE086CDDD7B07B51F';

type Row = {
  id:string; project_site_id:string; client_account_id:string; version_number:number;
  previous_version_id:string|null; status:DataProcessingAgreementStatus; source_reference:string;
  source_sha256:string; payload_json:string; sent_at:string|null; signed_at:string|null;
  transmission_mode:'external_attestation'|'manager_dispatch'|null;transmission_channel:string|null;transmission_recipient:string|null;transmission_reference:string|null;sent_document_id:string|null;sent_payload_sha256:string|null;
  signed_document_id:string|null;signed_payload_sha256:string|null;signature_reference:string|null; created_at:string; updated_at:string;
};
type IncidentRow={id:string;project_site_id:string;agreement_id:string|null;summary:string;details:string|null;occurred_at:string;reported_at:string|null;resolved_at:string|null;resolution:string|null;created_at:string;updated_at:string};
type AssessmentRow={project_site_id:string;state:'to_assess'|'not_required'|'required';operations_json:string;rationale:string|null;services_verified_at:string|null;verified_by:string|null;created_at:string;updated_at:string};

export class DataProcessingAgreementService {
  constructor(private readonly db: DatabaseAdapter) {}

  listForSite(siteId:string):DataProcessingAgreement[] {
    this.requireSite(siteId);
    return this.db.all<Row>('SELECT * FROM data_processing_agreements WHERE project_site_id=? ORDER BY version_number DESC',[siteId]).map(row=>this.map(row));
  }

  createDraft(siteId:string):DataProcessingAgreement {
    const site=this.requireSite(siteId);
    const assessment=this.assessment(siteId);
    if(assessment.state==='to_assess')throw Error('Évalue d’abord les traitements du Site avant de préparer un accord RGPD.');
    if(assessment.state==='not_required')throw Error('L’évaluation du Site indique qu’aucun accord n’est requis. Modifie cette évaluation avant de préparer un accord.');
    const existing=this.db.get<{id:string}>('SELECT id FROM data_processing_agreements WHERE project_site_id=? AND status IN (\'preparation\',\'revision\')',[siteId]);
    if(existing) throw Error('Un accord RGPD modifiable existe déjà pour ce Site.');
    const version=(this.db.get<{value:number}>('SELECT COALESCE(MAX(version_number),0)+1 value FROM data_processing_agreements WHERE project_site_id=?',[siteId])?.value??1);
    const id=randomUUID(),now=new Date().toISOString();
    const payload={...this.defaults(site.name,site.desired_domain),operations:[...assessment.operations]};
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

  markSent(id:string,input:DataProcessingSendAttestation):DataProcessingAgreement {
    const current=this.get(id);
    if(current.status!=='preparation'&&current.status!=='revision') throw Error('Seul un accord en préparation peut être marqué envoyé.');
    const issues=this.completenessIssues(current.payload);
    if(issues.length) throw Error(`Accord RGPD incomplet : ${issues.join(' ; ')}`);
    const channel=input.channel?.trim(),recipient=input.recipient?.trim(),reference=input.reference?.trim(),sentAt=input.sentAt?.trim();
    if(!channel||!recipient||!reference||!sentAt)throw Error('Canal, destinataire, référence et date d’envoi sont requis.');
    if(input.sentDocumentId)this.requireClientDocument(input.sentDocumentId,current.clientAccountId);
    const now=new Date().toISOString(),payloadHash=this.payloadHash(current.payload);
    this.db.run("UPDATE data_processing_agreements SET status='sent',sent_at=?,transmission_mode='external_attestation',transmission_channel=?,transmission_recipient=?,transmission_reference=?,sent_document_id=?,sent_payload_sha256=?,updated_at=? WHERE id=?",[sentAt,channel,recipient,reference,input.sentDocumentId??null,payloadHash,now,id]);
    this.log(id,'rgpd_agreement_external_send_attested',`Envoi externe attesté pour l’accord RGPD V${current.versionNumber} · ${channel} · ${reference}.`);
    return this.get(id);
  }

  markSigned(id:string,input:DataProcessingSignatureAttestation):DataProcessingAgreement {
    const current=this.get(id);
    if(current.status!=='sent') throw Error('Seul un accord envoyé peut être marqué signé.');
    if(input.expectedVersionNumber!==current.versionNumber||input.expectedPayloadSha256!==current.sentPayloadSha256)throw Error('La preuve ne confirme pas la version exacte envoyée. Actualise la fiche avant de continuer.');
    this.requireClientDocument(input.documentId,current.clientAccountId);
    const signatureReference=input.signatureReference?.trim(),signedAt=input.signedAt?.trim();if(!signatureReference||!signedAt)throw Error('Date et référence de signature requises.');
    const now=new Date().toISOString();
    this.db.run("UPDATE data_processing_agreements SET status='signed',signed_at=?,signed_document_id=?,signed_payload_sha256=?,signature_reference=?,updated_at=? WHERE id=?",[signedAt,input.documentId,current.sentPayloadSha256,signatureReference,now,id]);
    this.log(id,'rgpd_agreement_signed',`Signature attestée pour l’accord RGPD V${current.versionNumber} · empreinte ${current.sentPayloadSha256} · preuve ${input.documentId}.`);
    return this.get(id);
  }

  gate(siteId:string):DataProcessingAgreementGate {
    this.requireSite(siteId);
    const assessment=this.assessment(siteId);
    if(assessment.state==='to_assess')return {required:true,allowed:false,reason:'Les traitements du Site doivent être évalués avant toute opération impliquant des données personnelles.',agreementId:null};
    if(assessment.state==='not_required')return {required:false,allowed:true,reason:'Une évaluation vérifiée conclut qu’aucun accord distinct n’est requis.',agreementId:null};
    const latest=this.db.get<Row>('SELECT * FROM data_processing_agreements WHERE project_site_id=? ORDER BY version_number DESC LIMIT 1',[siteId]);
    if(!latest) return {required:true,allowed:false,reason:'L’évaluation du Site exige un accord RGPD qui n’est pas encore préparé.',agreementId:null};
    const agreement=this.map(latest),required=agreement.payload.operations.length>0;
    if(!required) return {required:false,allowed:true,reason:'Aucun traitement nécessitant un accord signé n’est sélectionné.',agreementId:agreement.id};
    return agreement.status==='signed'
      ? {required:true,allowed:true,reason:'La dernière version de l’accord RGPD est signée et couvre les traitements déclarés.',agreementId:agreement.id}
      : {required:true,allowed:false,reason:'L’accord RGPD doit être signé avant d’exécuter les traitements déclarés.',agreementId:agreement.id};
  }

  assessment(siteId:string):DataProcessingSiteAssessment{
    this.requireSite(siteId);const row=this.db.get<AssessmentRow>('SELECT * FROM data_processing_site_assessments WHERE project_site_id=?',[siteId]);
    if(!row){const now=new Date().toISOString();return {projectSiteId:siteId,state:'to_assess',operations:[],rationale:'',servicesVerifiedAt:null,verifiedBy:'',createdAt:now,updatedAt:now};}
    return this.mapAssessment(row);
  }
  saveAssessment(siteId:string,input:DataProcessingSiteAssessmentInput):DataProcessingSiteAssessment{
    this.requireSite(siteId);const rationale=input.rationale?.trim(),verifiedBy=input.verifiedBy?.trim(),verifiedAt=input.servicesVerifiedAt?.trim();
    if(!rationale||!verifiedBy||!verifiedAt)throw Error('Motif, relecteur et date de vérification des services sont requis.');
    if(input.state==='required'&&!input.operations.length)throw Error('Sélectionne les traitements nécessitant l’accord.');
    const now=new Date().toISOString(),created=this.db.get<{created_at:string}>('SELECT created_at FROM data_processing_site_assessments WHERE project_site_id=?',[siteId])?.created_at??now;
    this.db.run(`INSERT INTO data_processing_site_assessments(project_site_id,state,operations_json,rationale,services_verified_at,verified_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)
      ON CONFLICT(project_site_id) DO UPDATE SET state=excluded.state,operations_json=excluded.operations_json,rationale=excluded.rationale,services_verified_at=excluded.services_verified_at,verified_by=excluded.verified_by,updated_at=excluded.updated_at`,[siteId,input.state,JSON.stringify(input.operations),rationale,verifiedAt,verifiedBy,created,now]);
    this.log(siteId,'rgpd_site_assessment_saved',`Évaluation RGPD du Site : ${input.state} · ${verifiedBy}.`);return this.assessment(siteId);
  }

  listIncidents(siteId:string):DataProcessingIncident[]{this.requireSite(siteId);return this.db.all<IncidentRow>('SELECT * FROM data_processing_incidents WHERE project_site_id=? ORDER BY occurred_at DESC,created_at DESC',[siteId]).map(row=>this.mapIncident(row));}
  recordIncident(siteId:string,input:DataProcessingIncidentInput):DataProcessingIncident{
    this.requireSite(siteId);const summary=input.summary?.trim(),occurredAt=input.occurredAt?.trim();
    if(!summary||!occurredAt)throw Error('Résumé et date de l’incident requis.');
    if(input.agreementId){const agreement=this.get(input.agreementId);if(agreement.projectSiteId!==siteId)throw Error('Accord RGPD extérieur à ce Site.');}
    const id=randomUUID(),now=new Date().toISOString();
    this.db.run(`INSERT INTO data_processing_incidents(id,project_site_id,agreement_id,summary,details,occurred_at,reported_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)`,[id,siteId,input.agreementId??null,summary,input.details?.trim()||null,occurredAt,input.reportedAt?.trim()||null,now,now]);
    this.log(id,'rgpd_incident_recorded',`Incident de données enregistré : ${summary}.`);return this.getIncident(id);
  }
  resolveIncident(id:string,resolution:string,resolvedAt=new Date().toISOString()):DataProcessingIncident{
    const current=this.getIncident(id);if(current.resolvedAt)throw Error('Cet incident est déjà clôturé.');
    const clean=resolution?.trim();if(!clean)throw Error('La résolution de l’incident est requise.');
    const now=new Date().toISOString();this.db.run('UPDATE data_processing_incidents SET resolution=?,resolved_at=?,updated_at=? WHERE id=?',[clean,resolvedAt,now,id]);
    this.log(id,'rgpd_incident_resolved',`Incident de données clôturé : ${current.summary}.`);return this.getIncident(id);
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
    if(payload.providers.length===0)issues.push('prestataires techniques');
    if(payload.providers.some(provider=>!provider.authorized||provider.rgpdRole==='to-confirm'||!provider.verifiedAt||provider.outsideEea===null||!provider.country.trim()))issues.push('prestataires et transferts à vérifier');
    if(payload.transfers==='to-confirm')issues.push('transferts hors EEE');
    if(payload.transfers==='none'&&payload.providers.some(provider=>provider.outsideEea!==false))issues.push('absence de transfert non vérifiée');
    if(payload.transfers==='yes'&&!payload.transferDetails.trim())issues.push('garanties de transfert hors EEE');
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
  private getIncident(id:string):DataProcessingIncident{const row=this.db.get<IncidentRow>('SELECT * FROM data_processing_incidents WHERE id=?',[id]);if(!row)throw Error('Incident RGPD introuvable.');return this.mapIncident(row);}
  private mapIncident(row:IncidentRow):DataProcessingIncident{return {id:row.id,projectSiteId:row.project_site_id,agreementId:row.agreement_id,summary:row.summary,details:row.details??'',occurredAt:row.occurred_at,reportedAt:row.reported_at,resolvedAt:row.resolved_at,resolution:row.resolution??'',createdAt:row.created_at,updatedAt:row.updated_at};}
  private map(row:Row):DataProcessingAgreement {return {id:row.id,projectSiteId:row.project_site_id,clientAccountId:row.client_account_id,versionNumber:Number(row.version_number),previousVersionId:row.previous_version_id,status:row.status,sourceReference:row.source_reference,sourceSha256:row.source_sha256,payload:JSON.parse(row.payload_json) as DataProcessingAgreementPayload,sentAt:row.sent_at,transmissionMode:row.transmission_mode,transmissionChannel:row.transmission_channel??'',transmissionRecipient:row.transmission_recipient??'',transmissionReference:row.transmission_reference??'',sentDocumentId:row.sent_document_id,sentPayloadSha256:row.sent_payload_sha256,signedAt:row.signed_at,signedDocumentId:row.signed_document_id,signedPayloadSha256:row.signed_payload_sha256,signatureReference:row.signature_reference??'',createdAt:row.created_at,updatedAt:row.updated_at};}
  private defaults(name:string,domain:string|null):DataProcessingAgreementPayload {return {siteReference:name,domain:domain??'',contractReference:'',services:[],operations:[],purpose:'',instructions:'',dataSubjects:[],dataCategories:[],specialDataDetails:'',exitInstruction:'to-confirm',exitDetails:'',toolsAndAccesses:'',processingStart:'',processingEnd:'',incidentContactName:'',incidentContactEmail:'',securityNotes:'',exchangeProtection:'',backupNotes:'Sauvegardes assurées par o2switch Cloud selon le service effectivement souscrit ; aucune sauvegarde indépendante AtoumWeb n’est présumée.',providers:[{name:'o2switch',role:'Hébergement Cloud',data:'Données hébergées et sauvegardes du Site selon le service souscrit',accountHolder:'unknown',rgpdRole:'to-confirm',country:'France',authorized:false,outsideEea:null,transferMechanism:'',verifiedAt:''}],transfers:'to-confirm',transferDetails:'',retentionNotes:''};}
  private validatePayloadShape(payload:DataProcessingAgreementPayload):void {if(!payload||!Array.isArray(payload.operations)||!Array.isArray(payload.providers)||!Array.isArray(payload.dataSubjects)||!Array.isArray(payload.dataCategories))throw Error('Contenu RGPD invalide.');}
  private log(id:string,action:string,summary:string):void {this.db.run('INSERT INTO activity_log(entity_type,entity_id,action,summary,created_at) VALUES(?,?,?,?,?)',['data_processing_agreement',id,action,summary,new Date().toISOString()]);}
  private payloadHash(payload:DataProcessingAgreementPayload):string{return createHash('sha256').update(JSON.stringify(payload)).digest('hex');}
  private requireClientDocument(id:string,clientId:string):void{const document=this.db.get<{id:string;client_account_id:string;archived_at:string|null}>('SELECT id,client_account_id,archived_at FROM client_documents WHERE id=?',[id]);if(!document||document.archived_at||document.client_account_id!==clientId)throw Error('La preuve doit être un document actif du même client.');}
  private mapAssessment(row:AssessmentRow):DataProcessingSiteAssessment{return {projectSiteId:row.project_site_id,state:row.state,operations:JSON.parse(row.operations_json),rationale:row.rationale??'',servicesVerifiedAt:row.services_verified_at,verifiedBy:row.verified_by??'',createdAt:row.created_at,updatedAt:row.updated_at};}
}
