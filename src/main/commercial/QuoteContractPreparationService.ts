import { activePreparation, contractHash } from './quoteTransmission';
import {draftFingerprint} from '../../shared/draftSection';
import { deriveQuoteContractDefaults } from '../../shared/quoteContractDefaults';
import { CommercialRulesService } from './CommercialRulesService';
import { randomUUID } from 'node:crypto';
import type { DatabaseAdapter } from '../database/DatabaseAdapter';
import type { ClientDocumentService } from '../crm/ClientDocumentService';
import { ADMIN_CONTRACT_KEYS, DOCUMENT_ROLES, emptyAdministration, type ContractAdministration, type ContractDocumentLink, type ContractDocumentLinkInput, type ContractIssue, type QuoteContractParameters, type QuoteContractPreparation } from '../../shared/quoteContractPreparation';

const configurationKey = 'contract-administration-v1';
const present = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0;
const isoDate = (value: unknown): boolean => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime()) && new Date(value).toISOString().slice(0,10) === value;

export class QuoteContractPreparationService {
  constructor(private db: DatabaseAdapter, private documents?: ClientDocumentService) {}

  administration(): ContractAdministration {
    const row = this.db.get<{value_json: string}>('SELECT value_json FROM settings WHERE key=?',[configurationKey]);
    return row ? JSON.parse(row.value_json) as ContractAdministration : emptyAdministration();
  }
  saveAdministration(input: ContractAdministration,expected?:ContractAdministration): ContractAdministration {
    if(expected!==undefined&&draftFingerprint(expected)!==draftFingerprint(this.administration()))throw Error('Les informations communes ont changé dans une autre fenêtre. Votre brouillon est conservé ; actualisez avant de réessayer.');
    if (!input || Object.keys(input).length !== ADMIN_CONTRACT_KEYS.length) throw Error('Configuration administrative invalide.');
    for (const key of ADMIN_CONTRACT_KEYS) {
      const item = input[key];
      if (!item || !['filled','missing','not_applicable','verify'].includes(item.state) || typeof item.value !== 'string' || typeof item.reason !== 'string') throw Error(`Paramètre administratif invalide : ${key}`);
      if (item.state === 'filled' && !present(item.value)) throw Error(`Valeur administrative manquante : ${key}`);
      if (item.state === 'not_applicable' && !present(item.reason)) throw Error(`Justifie la non-applicabilité : ${key}`);
    }
    this.db.run('INSERT INTO settings(key,value_json,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at',[configurationKey,JSON.stringify(input),new Date().toISOString()]);
    this.log(null, 'contract_administration_saved', 'Configuration contractuelle enregistrée explicitement');
    return this.administration();
  }
  parameters(id:string):QuoteContractParameters|null {
    const row=this.quote(id);
    const prepared=activePreparation(this.db,id);
    if(prepared && row.contract_snapshot_json==null)return JSON.parse(prepared.snapshot_json).parameters??null;
    const frozen=row.contract_compiled_at!=null||row.contract_text_snapshot!=null||row.contract_snapshot_json!=null;
    if(frozen)return row.contract_snapshot_json==null?null:(JSON.parse(String(row.contract_snapshot_json)).parameters as QuoteContractParameters|undefined)??null;
    if(row.contract_parameters_json==null)return null;
    const stored=JSON.parse(String(row.contract_parameters_json)) as QuoteContractParameters;
    return row.status==='draft'&&!row.finalized_at?this.defaults(id,stored).parameters:stored;
  }
  private defaults(id:string,p:QuoteContractParameters){
    const row=this.quote(id),lines=this.db.all<Record<string,unknown>>('SELECT id,label,snapshot_json FROM quote_lines WHERE quote_id=? ORDER BY sort_order,created_at',[id]).map(l=>({id:String(l.id),label:String(l.label),snapshot:l.snapshot_json?JSON.parse(String(l.snapshot_json)):null}));
    return deriveQuoteContractDefaults({subject:String(row.subject),needSummary:row.need_summary as string|null,estimatedDelay:row.estimated_delay as string|null,lines},p);
  }
  get(id: string): QuoteContractPreparation {
    const row = this.quote(id);
    const prepared=activePreparation(this.db,id);
    const snapshot = row.contract_snapshot_json == null ? prepared?JSON.parse(prepared.snapshot_json):null : JSON.parse(String(row.contract_snapshot_json)) as Record<string,unknown>;
    const frozen = row.contract_compiled_at != null || row.contract_text_snapshot != null || row.contract_snapshot_json != null;
    const locked = frozen || row.status !== 'draft' || row.finalized_at != null;
    const parameters = this.parameters(id);
    const defaults=!locked&&row.contract_parameters_json?this.defaults(id,JSON.parse(String(row.contract_parameters_json))):null;
    return { parameters,...(defaults?{defaults:{facts:defaults.facts,includedBenefits:defaults.includedBenefits,marriage:defaults.marriage}}:{}), state: frozen ? 'frozen' : prepared ? 'prepared' : locked ? 'historical_missing' : 'draft', snapshot, documents: this.links(id), issues: locked ? parameters ? [{code:'LEGAL_REVIEW',severity:'warning',message:'Snapshot conservé ; sa complétude technique ne démontre pas une conformité juridique.'}] : [{code:'HISTORICAL_PARAMETERS_MISSING',severity:'warning',message:'Absence historique de paramètres structurés conservée ; aucun recalcul.'}] : this.issues(id,parameters) };
  }
  save(id: string, parameters: QuoteContractParameters,expected?:{parameters:QuoteContractParameters|null}): QuoteContractPreparation {
    this.assertEditable(id);
    if(expected!==undefined&&draftFingerprint(expected.parameters)!==draftFingerprint(this.parameters(id)))throw Error('Les paramètres du devis ont changé. Votre brouillon est conservé ; actualisez avant de réessayer.');
    this.validate(parameters);
    const first = parameters.payment.milestones[0]?.percent;
    this.db.run('UPDATE quotes SET contract_parameters_json=?,contract_audience=?,deposit_percent=?,deposit_cents=CAST(ROUND(contract_value_cents*?/100.0) AS INTEGER),balance_cents=contract_value_cents-CAST(ROUND(contract_value_cents*?/100.0) AS INTEGER),updated_at=? WHERE id=?',[JSON.stringify(parameters),parameters.audience,first,first,first,new Date().toISOString(),id]);
    this.log(id,'quote_contract_parameters_saved','Paramètres contractuels du devis enregistrés');
    return this.get(id);
  }
  links(id: string): ContractDocumentLink[] {
    return this.db.all<Record<string,unknown>>('SELECT * FROM quote_document_links WHERE quote_id=? ORDER BY attached_at,id',[id]).map(r=>({transmissionId:r.transmission_id as string|null,id:String(r.id),quoteId:String(r.quote_id),documentId:r.document_id as string|null,role:r.role as ContractDocumentLink['role'],sha256:r.sha256 as string|null,statement:r.statement as string|null,occurredAt:r.occurred_at as string|null,attachedAt:String(r.attached_at),provenance:String(r.provenance),supersedesId:r.supersedes_id as string|null,replacementReason:r.replacement_reason as string|null,relativePath:r.relative_path as string|null,fileName:r.file_name as string|null}));
  }
  attach(id: string, input: ContractDocumentLinkInput): QuoteContractPreparation {
    const quote = this.quote(id);
    if (!DOCUMENT_ROLES.includes(input.role) || !present(input.provenance)) throw Error('Rôle et provenance documentaire requis.');
    if (!this.documents) throw Error('Service documentaire indisponible : rattachement refusé.');
    const doc = this.documents.get(input.documentId);
    const clientId = quote.accepted_client_account_id ?? quote.client_account_id;
    if (!clientId || doc.clientAccountId !== clientId) throw Error('Le document doit appartenir au Client du devis. Convertis/rattache le prospect au Client avant de joindre des preuves.');
    if (doc.archivedAt) throw Error('Restaure le document avant de le rattacher.');
    const sha256 = this.documents.fingerprint(input.documentId);
    const same = this.links(id).find(l=>l.role===input.role&&l.documentId===input.documentId);
    if (same) {if(input.role==='accepted_pdf'&&quote.contract_document_id!==input.documentId)throw Error('Ancienne preuve déjà historisée : importe une nouvelle copie pour un remplacement explicite.');return this.get(id);}
    let supersedesId: string|null = null;
    if (input.role === 'accepted_pdf') {
      if (quote.status !== 'accepted') throw Error('Le devis doit être accepté avant le rattachement du PDF contractuel.');
      if (doc.mimeType !== 'application/pdf') throw Error('Un PDF est requis.');
      const previous = this.links(id).filter(l=>l.role==='accepted_pdf');
      const superseded = new Set(previous.map(l=>l.supersedesId));
      supersedesId = previous.find(l=>!superseded.has(l.id))?.id ?? null;
      if ((supersedesId || quote.contract_document_id && quote.contract_document_id !== input.documentId) && !present(input.replacementReason)) throw Error('Motif explicite requis pour remplacer le PDF ; ancienne preuve conservée.');
      // An old attachment is captured only during an explicit replacement, never by migration/backfill.
      if (!supersedesId && quote.contract_document_id && quote.contract_document_id !== input.documentId) {
        const oldId = String(quote.contract_document_id), oldHash = this.documents.fingerprint(oldId);
        supersedesId = randomUUID();
        this.db.run('INSERT INTO quote_document_links(id,quote_id,document_id,role,sha256,attached_at,provenance) VALUES(?,?,?,?,?,?,?)',[supersedesId,id,oldId,'accepted_pdf',oldHash,String(quote.contract_document_attached_at ?? new Date().toISOString()),'Ancien rattachement conservé lors du remplacement explicite ; empreinte constatée à cette date, non preuve d’intégrité historique']);
      }
    }
    this.db.run('INSERT INTO quote_document_links(id,quote_id,document_id,role,sha256,attached_at,provenance,supersedes_id,replacement_reason,transmission_id) VALUES(?,?,?,?,?,?,?,?,?,(SELECT id FROM quote_contract_transmissions WHERE quote_id=?))',[randomUUID(),id,input.documentId,input.role,sha256,new Date().toISOString(),input.provenance,supersedesId,input.replacementReason?.trim()||null,id]);
    this.log(id,'quote_document_link_added',`Preuve/annexe rattachée : ${input.role}${supersedesId ? ' ; remplacement explicite, ancienne preuve conservée' : ''}`);
    return this.get(id);
  }
  importPath(id:string,role:ContractDocumentLink['role'],provenance:string,path:string):QuoteContractPreparation {
    const row=this.quote(id);
    if(!this.documents||!DOCUMENT_ROLES.includes(role)||!present(provenance))throw Error('Rôle/provenance/document requis.');
    if(role==='accepted_pdf')throw Error('Utilise le rattachement du PDF contractuel accepté.');
    const clientId=(row.accepted_client_account_id??row.client_account_id) as string|null;
    if(clientId){
      const before=new Set(this.documents.list(clientId,true).map(d=>d.id));
      const doc=this.documents.importPaths(clientId,[path],{category:'legal',title:`${role} · ${row.quote_number}`}).find(d=>!before.has(d.id));
      if(!doc)throw Error('Preuve importée introuvable.');
      return this.attach(id,{documentId:doc.id,role,provenance});
    }
    const file=this.documents.importQuoteEvidence(id,path);
    this.db.run('INSERT INTO quote_document_links(id,quote_id,role,sha256,attached_at,provenance,relative_path,file_name,transmission_id) VALUES(?,?,?,?,?,?,?,?,(SELECT id FROM quote_contract_transmissions WHERE quote_id=?))',[randomUUID(),id,role,file.sha256,new Date().toISOString(),provenance,file.relativePath,file.fileName,id]);
    this.log(id,'quote_document_link_added',`Preuve/annexe du prospect conservée dans le dossier du devis : ${role}`);
    return this.get(id);
  }
  recordAcceptance(id:string,statement:string,occurredAt:string,provenance:string):QuoteContractPreparation {
    const quote=this.quote(id);
    if (!['sent','viewed'].includes(String(quote.status))) throw Error('La preuve d’acceptation doit concerner un devis envoyé.');
    if (!present(statement)||!present(provenance)||Number.isNaN(new Date(occurredAt).getTime())||new Date(occurredAt).getTime()>Date.now()) throw Error('Déclaration, date réelle et provenance de l’acceptation requises.');
    this.db.exec('SAVEPOINT quote_acceptance_evidence;');
    try{
      const transmission=this.db.get<{content_hash:string}>('SELECT content_hash FROM quote_contract_transmissions WHERE quote_id=?',[id]);
      if(transmission&&transmission.content_hash!==contractHash([quote.contract_text_snapshot,quote.contract_snapshot_json]))throw Error('La version contractuelle ne correspond plus à l’envoi attesté.');
    this.db.run("INSERT INTO quote_document_links(id,quote_id,role,statement,occurred_at,attached_at,provenance,transmission_id) VALUES(?,?,'acceptance',?,?,?,?,(SELECT id FROM quote_contract_transmissions WHERE quote_id=?))",[randomUUID(),id,statement.trim(),new Date(occurredAt).toISOString(),new Date().toISOString(),provenance.trim(),id]);
    this.log(id,'quote_acceptance_evidence_recorded','Attestation explicite d’acceptation enregistrée ; ne vaut pas PDF signé');
    this.db.exec('RELEASE quote_acceptance_evidence;');
    return this.get(id);
    }catch(error){this.db.exec('ROLLBACK TO quote_acceptance_evidence; RELEASE quote_acceptance_evidence;');throw error;}
  }
  openLinked(linkId: string): string {
    const row = this.db.get<{document_id:string|null;sha256:string|null;relative_path:string|null}>('SELECT document_id,sha256,relative_path FROM quote_document_links WHERE id=?',[linkId]);
    if (!row || !this.documents || !row.sha256) throw Error('Aucun fichier associé à cette attestation.');
    if(!row.document_id){if(!row.relative_path)throw Error('Preuve introuvable.');return this.documents.quoteEvidencePath(row.relative_path,row.sha256);}
    const hash = this.documents.fingerprint(row.document_id);
    if (hash !== row.sha256) throw Error('Intégrité de la preuve rompue : ouverture refusée.');
    return this.documents.verifiedPath(row.document_id);
  }
  assertAcceptance(id: string): void {
    const row = this.quote(id);
    const transmission=this.db.get<{id:string;content_hash:string;legacy:number}>('SELECT id,content_hash,legacy FROM quote_contract_transmissions WHERE quote_id=?',[id]);
    if(transmission&&transmission.content_hash!==contractHash([row.contract_text_snapshot,row.contract_snapshot_json]))throw Error('La preuve ne correspond pas au contrat transmis.');
    if ((!transmission||transmission.legacy) && (!row.contract_parameters_json || !row.contract_snapshot_json || !JSON.parse(String(row.contract_snapshot_json)).parameters)) return; // explicit legacy path, no invented evidence
    const links = this.links(id).filter(l=>(l.role==='acceptance'||l.role==='accepted_pdf')&&(!transmission||l.transmissionId===transmission.id));
    if (!links.length) throw Error('Joins une preuve de validation explicite avant acceptation ; aucun effet du silence.');
    for (const link of links) if (link.documentId||link.relativePath) this.openLinked(link.id);
  }
  freezePayload(id: string): Record<string,unknown> | null {
    const row = this.quote(id);
    if (row.contract_parameters_json == null) return null; // no legacy synthesis
    const parameters = this.parameters(id)!;
    this.validate(parameters);
    const blocking = this.issues(id,parameters).filter(i=>i.severity==='blocking');
    if (blocking.length) throw Error(`Préparation contractuelle incomplète : ${blocking.map(i=>i.message).join(' ; ')}`);
    const total = Number(row.contract_value_cents);
    let used=0;
    const schedule=parameters.payment.milestones.map((m,i)=>{const amountCents=i===parameters.payment.milestones.length-1?total-used:Math.round(total*m.percent/100);used+=amountCents;return{...m,amountCents};});
    const lines = this.db.all<Record<string,unknown>>('SELECT * FROM quote_lines WHERE quote_id=? ORDER BY sort_order,created_at',[id])
      .map<Record<string,unknown>>(line => ({ ...line, option_purchase: this.db.get<Record<string,unknown>>('SELECT * FROM quote_option_purchases WHERE line_id=?',[String(line.id)]) ?? null }));
    return { schemaVersion:2, parameters, schedule, lines, soldCatalogue:lines.map(l=>({lineId:l.id,itemId:l.catalog_item_id,versionId:l.catalog_version_id,quantityMilli:l.quantity_milli,catalogUnitPriceCents:l.catalog_unit_price_cents,proposedUnitPriceCents:l.proposed_unit_price_cents,lineValueCents:l.contract_line_value_cents,dossier:new CommercialRulesService(this.db).parameters(String(l.id)),catalogue:l.snapshot_json==null?null:JSON.parse(String(l.snapshot_json))})), quote:{id:row.id,number:row.quote_number,subject:row.subject,validUntil:row.valid_until,estimatedDelay:row.estimated_delay,prerequisites:row.prerequisites_text,specialTerms:row.special_terms}, administration:this.administration(), documents:this.links(id), totalCents:total, acceptance:{...parameters.acceptance,proofAtFinalization:this.links(id).filter(l=>l.role==='acceptance')} };
  }
  issues(id: string, p: QuoteContractParameters | null): ContractIssue[] {
    const results:ContractIssue[]=[];
    const check=(condition:boolean,code:string,message:string)=>{if(!condition)results.push({code,severity:'blocking',message});};
    if (!p) return [{code:'PARAMETERS_MISSING',severity:'blocking',message:'Paramètres contractuels non préparés (absence conservée).'}];
    const admin=this.administration(), links=this.links(id);
    check(Boolean(this.db.get("SELECT t.id FROM contract_clause_templates t JOIN contract_clause_versions v ON v.id=t.current_version_id WHERE t.scope='base' AND t.status='active' AND v.status='published' AND t.audience IN ('all',?) LIMIT 1",[p.audience])),'PUBLISHED_BASE_MISSING','Aucun socle contractuel publié disponible ; les brouillons ne sont pas consommés');
    const hasRole=(role:ContractDocumentLink['role'])=>links.some(l=>l.role===role);
    if(this.documents&&!this.documents.isDevelopmentWorkspace())for(const key of ADMIN_CONTRACT_KEYS)check(!/^TEST\s*[—-]|\bTEST\b.*fictif/i.test(admin[key].value),`ADMIN_${key.toUpperCase()}_TEST`,`Valeur administrative TEST interdite hors environnement de développement : ${key}`);
    for (const key of ['identity','administrative','vat','complaints'] as const) check(admin[key].state==='filled'&&present(admin[key].value),`ADMIN_${key.toUpperCase()}`,`Informations AtoumWeb à renseigner/vérifier : ${key}`);
    check(Boolean(p.conclusion.channel)&&present(p.conclusion.context)&&present(p.conclusion.purchasePurpose),'CONCLUSION','Canal, contexte et finalité à confirmer');
    check(p.conclusion.channel!=='other'||present(p.conclusion.otherChannelReason),'OTHER_CHANNEL','Précise le canal particulier');
    check(p.digital.kinds.length>0&&p.digital.supply!==null&&present(p.digital.delivery)&&present(p.digital.qualificationReason),'DIGITAL_QUALIFICATION','Qualification de la prestation et livraison à préciser');
    check(p.payment.milestones.every(m=>Boolean(m.dueDate)||present(m.event)),'PAYMENT_DATES','Dates ou événements objectifs de chaque échéance à renseigner');
    check(Boolean(p.initialPayment.dueDate)||present(p.payment.milestones[0]?.event),'INITIAL_DUE','Échéance du paiement initial à renseigner');
    check(p.milestones.length>0&&p.milestones.every(m=>present(m.label)&&(Boolean(m.date)||present(m.event))),'DELIVERY_MILESTONE','Au moins un jalon d’exécution avec date ou événement objectif convenu à renseigner');
    const lineIds=this.db.all<{id:string}>('SELECT id FROM quote_lines WHERE quote_id=?',[id]).map(l=>l.id);
    check(lineIds.every(lineId=>p.warranties.some(w=>w.lineId===lineId)),'WARRANTY_COVERAGE','Qualification de garantie corrective requise pour chaque ligne, y compris non applicable');
    check(p.warranties.every(w=>lineIds.includes(w.lineId)),'WARRANTY_LINE','Une garantie référence une ligne retirée');
    check(p.warranties.every(w=>w.days===null||present(w.startEvent)),'WARRANTY_START','Point de départ de la garantie corrective à préciser');
    check(p.rights.reviewed,'RIGHTS_REVIEW','Besoin de droits/licences à évaluer explicitement');
    check(p.renewal.reviewed,'RENEWAL_REVIEW','Besoin de renouvellement/fin de service à évaluer explicitement');
    check(!p.rights.applicable||[p.rights.uses,p.rights.duration,p.rights.territory,p.rights.sourceDelivery].every(present),'RIGHTS','Usages, durée, territoire et livraison des sources à renseigner');
    check(!p.renewal.applicable||[p.renewal.period,p.renewal.notice,p.renewal.termination,p.renewal.restitution].every(present),'RENEWAL','Modalités de renouvellement, résiliation et restitution à renseigner');
    check(!p.rsvp.applicable||present(p.rsvp.roles),'RSVP_ROLES','Fonctionnement réel et rôles RGPD RSVP à vérifier, sans présomption');
    const hostingIncluded=this.defaults(id,p).includedBenefits.some(x=>x.includes('Hébergement WordPress'));
    if (p.digital.hosting||hostingIncluded||p.rsvp.applicable||p.annexes.some(a=>a.role==='data_processing')) {
      check(admin.providers.state==='filled'&&present(admin.providers.value),'PROVIDERS','Prestataires/hébergeurs réellement utilisés à renseigner');
      check(admin.gdpr.state==='filled'&&present(admin.gdpr.value),'GDPR','Dispositif RGPD réel à renseigner (rôles, conservation, sous-traitants, localisation, restitution)');
    }
    const off=p.conclusion.channel==='off_premises';
    if (off) {
      check(p.conclusion.offPremisesControlsVerified,'OFF_PREMISES','Parcours hors établissement à vérifier : informations, preuves, perception des sommes');
      if(p.audience==='professional')check(p.conclusion.professionalConsumerRegime!=='unknown','PRO_CONSUMER_REGIME','Applicabilité du régime hors établissement au professionnel à déterminer');
    }
    const consumer=p.audience==='consumer'||off&&p.conclusion.professionalConsumerRegime==='applicable';
    if (consumer) {
      check(p.consumer.informationDelivered,'CONSUMER_INFORMATION','Informations précontractuelles à remettre et tracer');
      if(p.audience==='consumer')check(admin.mediator.state==='filled'&&present(admin.mediator.value),'MEDIATOR','Médiateur effectivement compétent à renseigner');
      if (p.conclusion.channel==='distance'||off) {
        check(p.consumer.withdrawal!=='unknown','WITHDRAWAL_STATUS','Droit de rétractation à déterminer');
        if (p.consumer.withdrawal==='applicable') {
          check(admin.withdrawalRecipient.state==='filled'&&present(admin.withdrawalRecipient.value),'WITHDRAWAL_CONTACT','Destinataire de rétractation à renseigner');
          check(hasRole('withdrawal_form'),'WITHDRAWAL_FORM','Formulaire de rétractation à rattacher');
        } else check(present(p.consumer.exceptionReason),'WITHDRAWAL_EXCEPTION','Non-applicabilité à justifier selon la prestation et le contexte');
        if(p.consumer.earlyStartRequested) {
          check(hasRole('early_request'),'EARLY_REQUEST','Preuve de demande de commencement anticipé à rattacher');
          check(hasRole('early_acknowledgement'),'EARLY_ACKNOWLEDGEMENT','Reconnaissances requises : preuve à rattacher selon la qualification');
        }
        check(['verified','not_applicable'].includes(p.consumer.onlineWithdrawal)&&present(p.consumer.onlineWithdrawalReason),'CONS-RETRACTATION-EN-LIGNE','Contrôle applicatif de rétractation en ligne non configuré/vérifié ; aucune clause textuelle créée');
      }
    }
    for (const annex of p.annexes) if(annex.required)check(Boolean(annex.documentId)&&links.some(l=>(l.documentId===annex.documentId||l.id===annex.documentId)&&l.role===annex.role),'ANNEX_MISSING',`Annexe/preuve requise absente : ${annex.role}`);
    for (const link of links) {
      try { if(link.documentId||link.relativePath) this.openLinked(link.id); } catch(e) { results.push({code:'DOCUMENT_INTEGRITY',severity:'blocking',message:e instanceof Error?e.message:String(e)}); }
    }
    results.push({code:'LEGAL_REVIEW',severity:'warning',message:'Complétude technique seulement ; qualification et obligations légales à vérifier selon le fonctionnement réel.'});
    return results;
  }
  private validate(p: QuoteContractParameters): void {
    // Validate the IPC boundary as well as typed callers; no unrecognised data/guest payload is stored.
    const fail=()=>{throw Error('Paramètres contractuels invalides.');};
    const keys=(o:unknown,allowed:string[])=>{if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).length!==allowed.length||Object.keys(o).some(k=>!allowed.includes(k)))fail();};
    keys(p,['schemaVersion','audience','initialPayment','payment','milestones','conclusion','digital','warranties','acceptance','rights','renewal','consumer','annexes','rsvp']);
    if(p.schemaVersion!==1||!['professional','consumer'].includes(p.audience))fail();
    const shapes:[unknown,Record<string,string>][]=[
      [p.initialPayment,{qualification:'string',dueDate:'nullable'}],
      [p.payment,{preset:'string',milestones:'array',professionalTerms:'object_or_null'}],
      [p.conclusion,{channel:'nullable',context:'string',purchasePurpose:'string',professionalConsumerRegime:'string',offPremisesControlsVerified:'boolean',otherChannelReason:'string'}],
      [p.digital,{kinds:'array',mixed:'boolean',supply:'nullable',delivery:'string',hosting:'boolean',associatedServices:'string',qualificationReason:'string'}],
      [p.acceptance,{mode:'string',silenceHasEffect:'boolean'}],
      [p.rights,{reviewed:'boolean',applicable:'boolean',uses:'string',duration:'string',territory:'string',sourceDelivery:'string',exclusivity:'string'}],
      [p.renewal,{reviewed:'boolean',applicable:'boolean',mode:'string',period:'string',notice:'string',termination:'string',restitution:'string'}],
      [p.consumer,{informationDelivered:'boolean',withdrawal:'string',exceptionReason:'string',earlyStartRequested:'boolean',onlineWithdrawal:'string',onlineWithdrawalReason:'string'}],
      [p.rsvp,{applicable:'boolean',mode:'string',sensitiveEnabled:'boolean',sensitiveRoute:'string',roles:'string'}],
    ];
    for(const [object,shape] of shapes){keys(object,Object.keys(shape));for(const [key,type] of Object.entries(shape)){const value=(object as Record<string,unknown>)[key];if(type==='array'?!Array.isArray(value):type==='object_or_null'?(value!==null&&(typeof value!=='object'||Array.isArray(value))):type==='nullable'?(value!==null&&typeof value!=='string'):typeof value!==type)fail();}}
    if(!['acompte','arrhes'].includes(p.initialPayment.qualification)||!['order_100','30_70','30_40_30','custom'].includes(p.payment.preset))fail();
    if(p.audience==='consumer'&&p.payment.professionalTerms!==null||p.audience==='professional'&&p.payment.professionalTerms===null)fail();
    if(p.payment.professionalTerms){keys(p.payment.professionalTerms,['extraDelay','lateRate','recoveryIndemnityCents']);if(typeof p.payment.professionalTerms.extraDelay!=='string'||p.payment.professionalTerms.lateRate!=='three_times_legal'||p.payment.professionalTerms.recoveryIndemnityCents!==4000)fail();}
    if(p.initialPayment.dueDate!==null&&!isoDate(p.initialPayment.dueDate))fail();
    if(p.conclusion.channel!==null&&!['distance','off_premises','on_premises','other'].includes(p.conclusion.channel)||!['unknown','applicable','not_applicable'].includes(p.conclusion.professionalConsumerRegime))fail();
    if(p.digital.supply!==null&&!['one_off','continuous'].includes(p.digital.supply)||p.digital.kinds.some(k=>!['digital_content','digital_service','classical_service'].includes(k))||new Set(p.digital.kinds).size!==p.digital.kinds.length||p.digital.mixed!==(p.digital.kinds.length>1))fail();
    if(p.acceptance.mode!=='explicit'||p.acceptance.silenceHasEffect!==false||p.rsvp.mode!=='minimal'||p.rsvp.sensitiveEnabled!==false||!['disabled','direct_caterer'].includes(p.rsvp.sensitiveRoute))throw Error('Validation explicite uniquement ; RSVP sensible toujours désactivé.');
    if(!['express','monthly_no_commitment'].includes(p.renewal.mode)||!['applicable','not_applicable','unknown'].includes(p.consumer.withdrawal)||!['not_applicable','verified','unconfigured'].includes(p.consumer.onlineWithdrawal))fail();
    if(!Array.isArray(p.milestones)||!Array.isArray(p.warranties)||!Array.isArray(p.annexes)||p.payment.milestones.length<1)fail();
    for(const m of p.payment.milestones){keys(m,['label','percent','dueDate','event']);if(!present(m.label)||typeof m.event!=='string'||!Number.isInteger(m.percent)||m.percent<=0||m.percent>100||m.dueDate!==null&&!isoDate(m.dueDate))fail();}
    if(Math.abs(p.payment.milestones.reduce((n,m)=>n+m.percent,0)-100)>0.000001)throw Error('L’échéancier doit totaliser exactement 100 %.');
    const expected=p.payment.preset==='order_100'?[100]:p.payment.preset==='30_70'?[30,70]:p.payment.preset==='30_40_30'?[30,40,30]:null;
    if(expected&&JSON.stringify(expected)!==JSON.stringify(p.payment.milestones.map(m=>m.percent)))fail();
    for(const m of p.milestones){keys(m,m.event===undefined?['label','date']:['label','date','event']);if(typeof m.label!=='string'||typeof m.date!=='string'||m.date!==''&&!isoDate(m.date)||m.event!==undefined&&typeof m.event!=='string')fail();}
    const durations={small_adjustment:30,wordpress_custom:60,business_app:90,not_applicable:null};
    for(const w of p.warranties){keys(w,['lineId','kind','days','startEvent','statutoryRightsUnaffected']);if(!present(w.lineId)||!Object.hasOwn(durations,w.kind)||w.days!==durations[w.kind]||w.statutoryRightsUnaffected!==true||typeof w.startEvent!=='string')fail();}
    if(new Set(p.warranties.map(w=>w.lineId)).size!==p.warranties.length)fail();
    for(const a of p.annexes){keys(a,['role','required','documentId']);if(!DOCUMENT_ROLES.includes(a.role)||typeof a.required!=='boolean'||a.documentId!==null&&!present(a.documentId))fail();}
  }
  private quote(id:string):Record<string,unknown>{const row=this.db.get<Record<string,unknown>>('SELECT * FROM quotes WHERE id=?',[id]);if(!row)throw Error('Devis introuvable.');return row;}
  private assertEditable(id:string):void{const row=this.quote(id);if(row.status!=='draft'||row.finalized_at||row.contract_compiled_at||row.contract_text_snapshot!==null||row.contract_snapshot_json!==null)throw Error('Paramètres figés ; duplique le devis pour les modifier.');}
  private log(id:string|null,action:string,summary:string):void{this.db.run('INSERT INTO activity_log(entity_type,entity_id,action,summary,created_at) VALUES(?,?,?,?,?)',[id?'quote':'settings',id??configurationKey,action,summary,new Date().toISOString()]);}
}
