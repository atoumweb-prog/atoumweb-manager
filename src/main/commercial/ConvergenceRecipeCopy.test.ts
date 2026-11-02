import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { NodeSqliteAdapter } from '../database/NodeSqliteAdapter';
import { applyPendingMigrations } from '../database/migrations';
import { ContractEditorialDraftService, type ContractEditorialProposalDocument } from './ContractEditorialDraftService';
import { CatalogCommercialConvergenceService, type CatalogCommercialConvergenceSource } from './CatalogCommercialConvergenceService';
import { ConvergenceReviewService } from './ConvergenceReviewService';
import { CrmService } from '../crm/CrmService';
import { ProjectService } from '../projects/ProjectService';
import { ProjectSiteService } from '../projects/ProjectSiteService';
import { DataProcessingAgreementService } from '../projects/DataProcessingAgreementService';
import { createWorkspacePaths } from '../workspace';

const sourcePath=process.env.ATOUMWEB_RECIPE_SOURCE_DB;
const copyPath=process.env.ATOUMWEB_RECIPE_COPY_DB;
const root=resolve(__dirname,'../../..');
const editorial=JSON.parse(readFileSync(resolve(root,'data/contracts/atoumweb-contract-library-v37.json'),'utf8')) as ContractEditorialProposalDocument;
const catalog=JSON.parse(readFileSync(resolve(root,'data/catalogue/atoumweb-commercial-convergence-20261031.json'),'utf8')) as CatalogCommercialConvergenceSource;
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

describe.skipIf(!sourcePath||!copyPath)('recette de convergence sur copie isolée',()=>{
  it('migre, prépare, rejoue et contrôle la conservation historique',()=>{
    mkdirSync(dirname(copyPath!),{recursive:true});copyFileSync(sourcePath!,copyPath!);
    const db=new NodeSqliteAdapter(copyPath!);
    try{
      applyPendingMigrations(db);
      const before={
        quotes:db.all('SELECT * FROM quotes ORDER BY id'),
        quoteClauses:db.all('SELECT id,quote_id,source_clause_version_id,title,body,enabled,sort_order FROM quote_contract_clauses ORDER BY id'),
        publishedClauses:db.all("SELECT id,clause_id,version_number,title,body,status FROM contract_clause_versions WHERE status='published' ORDER BY id"),
        publishedCatalog:db.all("SELECT id,item_id,version_number,price_cents,price_mode,status FROM catalog_versions WHERE status='published' ORDER BY id"),
      };
      const contractService=new ContractEditorialDraftService(db),catalogService=new CatalogCommercialConvergenceService(db);
      const editorialReference='Bibliothèque contractuelle AtoumWeb — version retenue V3.7 — 1er novembre 2026';
      const contractPlan=contractService.simulate(editorial,editorialReference);
      expect(contractPlan.anomalies).toEqual([]);expect(contractPlan.counts.draftsToCreate).toBe(118);
      const catalogPlan=catalogService.simulate(catalog);expect(catalogPlan).toHaveLength(6);
      expect(db.get('SELECT canonical_code FROM catalog_items WHERE id=\'atoumweb-wordpress\'')).toEqual({canonical_code:'AW-MAINT-WP-M'});
      contractService.apply(editorial,editorialReference,contractPlan.planSha256);
      catalogService.apply(catalog,catalogPlan);
      const reviewService=new ConvergenceReviewService(db),review=reviewService.simulate();
      expect(()=>reviewService.decideContractDrafts({codes:['APP-CADRAGE','CLAUSE-INCONNUE'],decision:'approved_for_publication',reviewer:'Recette isolée',note:'Cette décision doit être annulée entièrement',expectedPlanSha256:review.contract.planSha256})).toThrow(/Clause inconnue/);
      expect(db.get<{n:number}>('SELECT COUNT(*) n FROM contract_convergence_decisions')).toEqual({n:0});
      expect(db.get<{n:number}>('SELECT COUNT(*) n FROM contract_convergence_decision_events')).toEqual({n:0});
      reviewService.decideContractDrafts({codes:['APP-CADRAGE','BASE-CONFIDENTIALITE'],decision:'approved_for_publication',reviewer:'Recette isolée',note:'Décision groupée de test sans publication',expectedPlanSha256:review.contract.planSha256});
      expect(db.get("SELECT clause_code,decision,reviewer FROM contract_convergence_decisions WHERE clause_code='APP-CADRAGE'")).toEqual({clause_code:'APP-CADRAGE',decision:'approved_for_publication',reviewer:'Recette isolée'});
      expect(db.get<{n:number}>('SELECT COUNT(*) n FROM contract_convergence_decisions')).toEqual({n:2});
      expect(db.get<{n:number}>('SELECT COUNT(*) n FROM contract_convergence_decision_events')).toEqual({n:2});
      expect(db.get<{n:number}>(`SELECT COUNT(*) n FROM contract_convergence_decision_events e JOIN contract_convergence_decisions d ON d.draft_version_id=e.draft_version_id WHERE e.clause_code IN ('APP-CADRAGE','BASE-CONFIDENTIALITE')`)).toEqual({n:2});
      expect(()=>reviewService.decideContractDrafts({codes:['APP-CADRAGE'],decision:'needs_revision',reviewer:'Recette isolée',note:'   ',expectedPlanSha256:review.contract.planSha256})).toThrow(/note de décision/i);
      expect(db.get<{n:number}>('SELECT COUNT(*) n FROM contract_convergence_decision_events')).toEqual({n:2});
      reviewService.decideContractDrafts({codes:['APP-CADRAGE'],decision:'needs_revision',reviewer:'Recette isolée',note:'Nouvelle décision conservée dans l’historique',expectedPlanSha256:review.contract.planSha256});
      expect(db.get<{n:number}>('SELECT COUNT(*) n FROM contract_convergence_decisions')).toEqual({n:2});
      expect(db.get<{n:number}>('SELECT COUNT(*) n FROM contract_convergence_decision_events')).toEqual({n:3});
      expect(db.get("SELECT decision,note FROM contract_convergence_decisions WHERE clause_code='APP-CADRAGE'")).toEqual({decision:'needs_revision',note:'Nouvelle décision conservée dans l’historique'});
      const history=reviewService.simulate().contract.rows.find(row=>row.code==='APP-CADRAGE')!.decisionHistory;
      expect(history).toHaveLength(2);
      expect(history.map(entry=>entry.decision)).toContain('approved_for_publication');
      expect(history.map(entry=>entry.decision)).toContain('needs_revision');
      expect(db.get('SELECT canonical_code FROM catalog_items WHERE id=\'atoumweb-wordpress\'')).toEqual({canonical_code:'AW-MAINT-WP-M'});
      expect(db.get<{n:number}>("SELECT COUNT(*) n FROM catalog_items WHERE canonical_code IN ('AW-MAINT-WP-M','AW-MAINT-WC-M')")).toEqual({n:2});
      const replayContract=contractService.simulate(editorial,editorialReference);
      expect(replayContract.counts).toEqual({draftsToCreate:0,draftsKept:118,conflicts:0});
      expect(()=>catalogService.apply(catalog,catalogPlan.map((row,index)=>index?row:{...row,nextVersionNumber:999}))).toThrow(/plan Catalogue a changé/);
      catalogService.apply(catalog,catalogPlan);

      const crm=new CrmService(db);
      const organization=crm.createOrganization({name:'TEST — Recette RGPD croisée'});
      const client=crm.createClient({organizationId:organization.id});
      const sites=new ProjectSiteService(db);
      const projects=new ProjectService(db,createWorkspacePaths(resolve(dirname(copyPath!),'workspace-rgpd')),sites);
      const project=projects.createInternal({name:'TEST — Site RGPD croisé',projectType:'website'});
      db.run('UPDATE projects SET client_account_id=? WHERE id=?',[client.id,project.id]);
      const site=sites.create(project.id,{name:'Site RGPD croisé',desiredDomain:'rgpd-recette.example'});
      const agreements=new DataProcessingAgreementService(db);
      expect(agreements.assessment(site.id).state).toBe('to_assess');
      expect(agreements.gate(site.id)).toMatchObject({required:true,allowed:false});
      agreements.saveAssessment(site.id,{state:'required',operations:['hosting','maintenance'],rationale:'Hébergement et maintenance impliquant un accès aux données.',servicesVerifiedAt:'2026-11-02T08:00:00.000Z',verifiedBy:'Recette croisée'});
      const initial=agreements.createDraft(site.id);
      const draft=agreements.updateDraft(initial.id,{...initial.payload,contractReference:'RECETTE-RGPD-001',operations:['hosting','maintenance'],purpose:'Héberger et maintenir le Site selon les instructions du responsable.',dataSubjects:['Utilisateurs du Site'],dataCategories:['Coordonnées'],exitInstruction:'delete',incidentContactEmail:'client@example.test',transfers:'none',providers:initial.payload.providers.map(provider=>({...provider,accountHolder:'client',rgpdRole:'subprocessor',authorized:true,outsideEea:false,verifiedAt:'2026-11-02T08:00:00.000Z'}))});
      const sent=agreements.markSent(draft.id,{channel:'Email externe',recipient:'client@example.test',reference:'MSG-RGPD-RECETTE-001',sentAt:'2026-11-02T09:00:00.000Z'});
      expect(sent).toMatchObject({status:'sent',transmissionMode:'external_attestation'});
      expect(sent.sentPayloadSha256).toMatch(/^[a-f0-9]{64}$/);
      const proofId='proof-rgpd-recette-croisee',now='2026-11-02T10:00:00.000Z';
      db.run(`INSERT INTO client_documents(id,client_account_id,category,title,original_name,relative_path,size_bytes,created_at,updated_at)
        VALUES(?,?,'legal','Accord RGPD signé','accord-rgpd-signe.pdf','clients/recette/accord-rgpd-signe.pdf',123,?,?)`,[proofId,client.id,now,now]);
      expect(()=>agreements.markSigned(sent.id,{documentId:proofId,signedAt:now,signatureReference:'SIGN-RGPD-RECETTE-ERR',expectedVersionNumber:sent.versionNumber+1,expectedPayloadSha256:sent.sentPayloadSha256!})).toThrow(/version exacte/);
      expect(agreements.listForSite(site.id)[0]).toMatchObject({status:'sent',signedDocumentId:null});
      const signed=agreements.markSigned(sent.id,{documentId:proofId,signedAt:now,signatureReference:'SIGN-RGPD-RECETTE-001',expectedVersionNumber:sent.versionNumber,expectedPayloadSha256:sent.sentPayloadSha256!});
      expect(signed.signedPayloadSha256).toBe(sent.sentPayloadSha256);
      expect(agreements.gate(site.id)).toMatchObject({required:true,allowed:true,agreementId:signed.id});
      const revision=agreements.createRevision(signed.id);
      expect(revision).toMatchObject({versionNumber:2,previousVersionId:signed.id,status:'revision'});
      expect(agreements.gate(site.id)).toMatchObject({required:true,allowed:false,agreementId:revision.id});
      const after={
        quotes:db.all('SELECT * FROM quotes ORDER BY id'),
        quoteClauses:db.all('SELECT id,quote_id,source_clause_version_id,title,body,enabled,sort_order FROM quote_contract_clauses ORDER BY id'),
        publishedClauses:db.all("SELECT id,clause_id,version_number,title,body,status FROM contract_clause_versions WHERE status='published' ORDER BY id"),
        publishedCatalog:db.all("SELECT id,item_id,version_number,price_cents,price_mode,status FROM catalog_versions WHERE status='published' ORDER BY id"),
      };
      expect(after).toEqual(before);
      const report={sourcePath,copyPath,createdAt:new Date().toISOString(),reconciledLegacyItems:['atoumweb-wordpress','atoumweb-woocommerce'],duplicates:0,beforeHashes:{quotes:hash(before.quotes),quoteClauses:hash(before.quoteClauses),publishedClauses:hash(before.publishedClauses),publishedCatalog:hash(before.publishedCatalog)},afterHashes:{quotes:hash(after.quotes),quoteClauses:hash(after.quoteClauses),publishedClauses:hash(after.publishedClauses),publishedCatalog:hash(after.publishedCatalog)},prepared:{contractDrafts:118,catalogDrafts:6},rgpd:{assessmentWithoutSheet:'blocked',externalTransmissionReference:sent.transmissionReference,payloadSha256:sent.sentPayloadSha256,signedPayloadSha256:signed.signedPayloadSha256,wrongVersionRejected:true,revisionBlocksProcessing:true,providersVerified:true,outsideEea:false},idempotence:'ok',rollback:'ok',historicalPreservation:'ok'};
      writeFileSync(resolve(dirname(copyPath!),'RECETTE-CONVERGENCE.json'),JSON.stringify(report,null,2)+'\n');
    }finally{db.close();}
  });
});
