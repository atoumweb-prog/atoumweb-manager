import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { CrmService } from '../crm/CrmService';
import { createWorkspacePaths } from '../workspace';
import { ProjectService } from './ProjectService';
import { ProjectSiteService } from './ProjectSiteService';
import { DataProcessingAgreementService } from './DataProcessingAgreementService';

let db:NodeSqliteAdapter;
let root:string;
let service:DataProcessingAgreementService;
let siteId:string;
let clientId:string;

beforeEach(()=>{
  root=mkdtempSync(join(tmpdir(),'atoumweb-rgpd-v3-'));
  db=new NodeSqliteAdapter(':memory:');
  db.exec('PRAGMA foreign_keys=ON;');
  applyPendingMigrations(db);
  const crm=new CrmService(db);
  const organization=crm.createOrganization({name:'Client TEST RGPD'});
  clientId=crm.createClient({organizationId:organization.id}).id;
  const sites=new ProjectSiteService(db);
  const projects=new ProjectService(db,createWorkspacePaths(root),sites);
  const project=projects.createInternal({name:'Site TEST RGPD',projectType:'website'});
  db.run('UPDATE projects SET client_account_id=? WHERE id=?',[clientId,project.id]);
  siteId=sites.create(project.id,{name:'Site principal',desiredDomain:'test.example'}).id;
  service=new DataProcessingAgreementService(db);
});

afterEach(()=>{db.close();rmSync(root,{recursive:true,force:true});});

function complete(id:string){
  const agreement=service.listForSite(siteId).find(item=>item.id===id)!;
  return service.updateDraft(id,{...agreement.payload,contractReference:'DEV-TEST-001',operations:['hosting','maintenance'],purpose:'Héberger et maintenir le site selon les instructions du client.',dataSubjects:['Clients du responsable'],dataCategories:['Coordonnées'],exitInstruction:'delete',incidentContactEmail:'client@example.test',transfers:'none',providers:agreement.payload.providers.map(provider=>({...provider,accountHolder:'client' as const,rgpdRole:'subprocessor' as const,authorized:true,outsideEea:false,verifiedAt:'2026-11-01T08:00:00.000Z'}))});
}
function assess(){return service.saveAssessment(siteId,{state:'required',operations:['hosting','maintenance'],rationale:'Hébergement et maintenance avec accès aux données du Site.',servicesVerifiedAt:'2026-11-01T08:00:00.000Z',verifiedBy:'Relecteur TEST'});}
function attestSend(id:string){return service.markSent(id,{channel:'Email',recipient:'client@example.test',reference:'MSG-TEST-001',sentAt:'2026-11-01T09:00:00.000Z'});}

describe('DataProcessingAgreementService',()=>{
  it('ne crée rien à la consultation et prépare une seule version sur action explicite',()=>{
    expect(service.listForSite(siteId)).toEqual([]);
    expect(service.gate(siteId)).toMatchObject({required:true,allowed:false,agreementId:null});
    expect(()=>service.createDraft(siteId)).toThrow(/Évalue/);
    assess();
    const draft=service.createDraft(siteId);
    expect(draft.versionNumber).toBe(1);
    expect(draft.status).toBe('preparation');
    expect(draft.payload.backupNotes).toContain('o2switch Cloud');
    expect(()=>service.createDraft(siteId)).toThrow(/modifiable existe déjà/);
  });

  it('bloque uniquement les traitements déclarés tant qu’aucune version n’est signée',()=>{
    assess();const draft=service.createDraft(siteId);
    expect(service.gate(siteId).allowed).toBe(false);
    complete(draft.id);
    expect(service.gate(siteId)).toMatchObject({required:true,allowed:false,agreementId:draft.id});
  });

  it('n’interprète jamais l’absence de fiche comme une absence d’obligation',()=>{
    expect(service.assessment(siteId).state).toBe('to_assess');
    expect(service.gate(siteId)).toMatchObject({required:true,allowed:false});
    service.saveAssessment(siteId,{state:'not_required',operations:[],rationale:'Aucun accès ni traitement après vérification des services TEST.',servicesVerifiedAt:'2026-11-01T08:00:00.000Z',verifiedBy:'Relecteur TEST'});
    expect(service.gate(siteId)).toMatchObject({required:false,allowed:true});
    expect(()=>service.createDraft(siteId)).toThrow(/aucun accord n’est requis/);
  });

  it('fige la version envoyée et conserve intégralement l’historique lors d’une révision',()=>{
    assess();const draft=complete(service.createDraft(siteId).id);
    const sent=attestSend(draft.id);
    expect(sent.status).toBe('sent');
    expect(sent).toMatchObject({transmissionMode:'external_attestation',transmissionReference:'MSG-TEST-001'});
    expect(sent.sentPayloadSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(()=>service.updateDraft(sent.id,{...sent.payload,purpose:'Altération interdite'})).toThrow(/immuable/);

    const now=new Date().toISOString();
    db.run(`INSERT INTO client_documents(id,client_account_id,category,title,original_name,relative_path,size_bytes,created_at,updated_at)
      VALUES('proof-rgpd',?,'legal','Accord RGPD signé','accord-rgpd.pdf','clients/test/accord-rgpd.pdf',123,?,?)`,[clientId,now,now]);
    const signed=service.markSigned(sent.id,{documentId:'proof-rgpd',signedAt:'2026-11-01T10:00:00.000Z',signatureReference:'SIGN-TEST-001',expectedVersionNumber:sent.versionNumber,expectedPayloadSha256:sent.sentPayloadSha256!});
    expect(signed.signedPayloadSha256).toBe(sent.sentPayloadSha256);
    expect(service.gate(siteId)).toMatchObject({required:true,allowed:true,agreementId:signed.id});

    const revision=service.createRevision(signed.id);
    expect(revision).toMatchObject({versionNumber:2,previousVersionId:signed.id,status:'revision'});
    expect(service.listForSite(siteId)).toHaveLength(2);
    expect(service.listForSite(siteId)[1]).toMatchObject({id:signed.id,status:'signed',signedDocumentId:'proof-rgpd'});
    expect(service.gate(siteId)).toMatchObject({required:true,allowed:false,agreementId:revision.id});
  });

  it('refuse une signature qui ne vise pas exactement la version envoyée',()=>{
    assess();const sent=attestSend(complete(service.createDraft(siteId).id).id);const now=new Date().toISOString();
    db.run(`INSERT INTO client_documents(id,client_account_id,category,title,original_name,relative_path,size_bytes,created_at,updated_at) VALUES('proof-version',?,'legal','Preuve version','version.pdf','clients/test/version.pdf',123,?,?)`,[clientId,now,now]);
    expect(()=>service.markSigned(sent.id,{documentId:'proof-version',signedAt:now,signatureReference:'SIGN-VERSION',expectedVersionNumber:sent.versionNumber+1,expectedPayloadSha256:sent.sentPayloadSha256!})).toThrow(/version exacte/);
    expect(service.listForSite(siteId)[0]).toMatchObject({status:'sent',signedDocumentId:null});
  });

  it('refuse « aucun transfert » tant que chaque prestataire n’est pas vérifié',()=>{
    assess();const draft=service.createDraft(siteId);const agreement=service.listForSite(siteId)[0];
    service.updateDraft(draft.id,{...agreement.payload,contractReference:'DEV-TEST',purpose:'Test',dataSubjects:['Clients'],dataCategories:['Email'],exitInstruction:'delete',incidentContactEmail:'client@example.test',transfers:'none'});
    expect(()=>attestSend(draft.id)).toThrow(/prestataires et transferts à vérifier|absence de transfert non vérifiée/);
    expect(service.listForSite(siteId)[0].status).toBe('preparation');
  });

  it('refuse une preuve appartenant à un autre client',()=>{
    assess();const sent=attestSend(complete(service.createDraft(siteId).id).id);
    const crm=new CrmService(db),other=crm.createClient({organizationId:crm.createOrganization({name:'Autre client TEST'}).id});
    const now=new Date().toISOString();
    db.run(`INSERT INTO client_documents(id,client_account_id,category,title,original_name,relative_path,size_bytes,created_at,updated_at)
      VALUES('wrong-proof',?,'legal','Mauvaise preuve','wrong.pdf','clients/other/wrong.pdf',123,?,?)`,[other.id,now,now]);
    expect(()=>service.markSigned(sent.id,{documentId:'wrong-proof',signedAt:'2026-11-01T10:00:00.000Z',signatureReference:'SIGN-WRONG',expectedVersionNumber:sent.versionNumber,expectedPayloadSha256:sent.sentPayloadSha256!})).toThrow(/même client/);
    expect(service.listForSite(siteId)[0].status).toBe('sent');
  });

  it('tient le registre des incidents du Site sans altérer les accords',()=>{
    assess();const agreement=service.createDraft(siteId);
    const incident=service.recordIncident(siteId,{agreementId:agreement.id,summary:'Accès TEST non prévu',details:'Compte de recette concerné.',occurredAt:'2026-11-01T10:00:00.000Z',reportedAt:'2026-11-01T10:15:00.000Z'});
    expect(service.listIncidents(siteId)).toEqual([expect.objectContaining({id:incident.id,resolvedAt:null,agreementId:agreement.id})]);
    const resolved=service.resolveIncident(incident.id,'Accès révoqué et client informé.','2026-11-01T11:00:00.000Z');
    expect(resolved).toMatchObject({resolution:'Accès révoqué et client informé.',resolvedAt:'2026-11-01T11:00:00.000Z'});
    expect(()=>service.resolveIncident(incident.id,'Deuxième clôture')).toThrow(/déjà clôturé/);
    expect(service.listForSite(siteId)[0]).toMatchObject({id:agreement.id,status:'preparation'});
  });
});
