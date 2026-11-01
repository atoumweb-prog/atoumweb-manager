import { useEffect, useMemo, useState } from 'react';
import type { ClientDocument } from '../../shared/clientDocuments';
import { DATA_PROCESSING_OPERATIONS, type DataProcessingAgreement, type DataProcessingAgreementPayload, type DataProcessingOperation } from '../../shared/dataProcessingAgreements';

const OPERATION_LABELS:Record<DataProcessingOperation,string>={access:'Accès technique',hosting:'Hébergement',maintenance:'Maintenance',support:'Support',backup:'Sauvegarde',migration:'Migration',analytics:'Mesure d’audience'};
const STATUS_LABELS={preparation:'En préparation',sent:'Envoyé',signed:'Signé',revision:'Révision'} as const;
const split=(value:string)=>value.split('\n').map(item=>item.trim()).filter(Boolean);

export function ProjectSiteDataProtectionPanel({siteId,onMessage}:{siteId:string;onMessage:(message:string)=>void}){
  const [items,setItems]=useState<DataProcessingAgreement[]>([]);
  const [draft,setDraft]=useState<DataProcessingAgreementPayload|null>(null);
  const [documents,setDocuments]=useState<ClientDocument[]>([]);
  const [proofId,setProofId]=useState('');
  const [busy,setBusy]=useState(false);
  const latest=items[0]??null;
  const editable=latest&&(latest.status==='preparation'||latest.status==='revision')?latest:null;
  const gate=useMemo(()=>latest?.payload.operations.length?latest.status==='signed'?'ready':'blocked':'not-required',[latest]);

  async function load(){
    const next=await window.atoumweb.projects.dataProcessingAgreements.listForSite(siteId);
    setItems(next);setDraft(next[0]&&(next[0].status==='preparation'||next[0].status==='revision')?next[0].payload:null);
    const clientId=next[0]?.clientAccountId;
    setDocuments(clientId?(await window.atoumweb.clientDocuments.list(clientId)).filter(doc=>doc.category==='legal'||doc.category==='contract'):[]);
  }
  useEffect(()=>{void load().catch(error=>onMessage(error instanceof Error?error.message:'Impossible de charger l’accord RGPD.'));},[siteId]);
  async function run(action:()=>Promise<unknown>,message:string){setBusy(true);try{await action();await load();onMessage(message);}catch(error){onMessage(error instanceof Error?error.message:'Action RGPD impossible.');}finally{setBusy(false);}}
  function patch(next:Partial<DataProcessingAgreementPayload>){setDraft(current=>current?{...current,...next}:current);}

  return <section className="project-site-rgpd">
    <header><div><span className="eyebrow">Protection des données</span><h4>Accord RGPD du Site</h4></div>{latest&&<span className={`status-pill rgpd-${latest.status}`}>V{latest.versionNumber} · {STATUS_LABELS[latest.status]}</span>}</header>
    {!latest&&<div className="project-site-rgpd-empty"><p>Aucun accord séparé n’est préparé. Il n’est créé que si AtoumWeb traite des données pour ce Site.</p><button className="secondary-button" disabled={busy} type="button" onClick={()=>void run(()=>window.atoumweb.projects.dataProcessingAgreements.createDraft(siteId),'Accord RGPD préparé.')}>Préparer un accord RGPD</button></div>}
    {latest&&<>
      <p className={`project-site-rgpd-gate ${gate}`}>{gate==='ready'?'Accord signé : les traitements déclarés peuvent être exécutés.':gate==='blocked'?'Traitements déclarés : signature requise avant leur exécution.':'Aucun traitement soumis à cet accord n’est sélectionné.'}</p>
      {draft&&editable&&<div className="project-site-rgpd-form">
        <label>Référence contractuelle<input value={draft.contractReference} onChange={event=>patch({contractReference:event.target.value})} placeholder="Ex. DEV-2026-003" /></label>
        <label>Domaine<input value={draft.domain} onChange={event=>patch({domain:event.target.value})} /></label>
        <fieldset><legend>Traitements réalisés par AtoumWeb</legend><div className="rgpd-checks">{DATA_PROCESSING_OPERATIONS.map(operation=><label key={operation}><input type="checkbox" checked={draft.operations.includes(operation)} onChange={event=>patch({operations:event.target.checked?[...draft.operations,operation]:draft.operations.filter(value=>value!==operation)})}/>{OPERATION_LABELS[operation]}</label>)}</div></fieldset>
        <label className="wide">Finalité<textarea value={draft.purpose} onChange={event=>patch({purpose:event.target.value})} placeholder="Pourquoi ces traitements sont nécessaires" /></label>
        <label>Personnes concernées <small>une par ligne</small><textarea value={draft.dataSubjects.join('\n')} onChange={event=>patch({dataSubjects:split(event.target.value)})}/></label>
        <label>Données traitées <small>une par ligne</small><textarea value={draft.dataCategories.join('\n')} onChange={event=>patch({dataCategories:split(event.target.value)})}/></label>
        <label>Sort des données<select value={draft.exitInstruction} onChange={event=>patch({exitInstruction:event.target.value as DataProcessingAgreementPayload['exitInstruction']})}><option value="to-confirm">À confirmer</option><option value="return">Restitution</option><option value="delete">Suppression</option></select></label>
        <label>Contact incident<input type="email" value={draft.incidentContactEmail} onChange={event=>patch({incidentContactEmail:event.target.value})} placeholder="client@exemple.fr" /></label>
        <label>Transferts hors UE<select value={draft.transfers} onChange={event=>patch({transfers:event.target.value as DataProcessingAgreementPayload['transfers']})}><option value="to-confirm">À confirmer</option><option value="none">Aucun</option><option value="yes">Oui, à détailler</option></select></label>
        <label>Hébergeur / sous-traitant<select value={draft.providers[0]?.authorized?'authorized':'to-confirm'} onChange={event=>patch({providers:draft.providers.map((provider,index)=>index?provider:{...provider,authorized:event.target.value==='authorized',rgpdRole:event.target.value==='authorized'?'subprocessor':'to-confirm'})})}><option value="to-confirm">o2switch à confirmer</option><option value="authorized">o2switch autorisé</option></select></label>
        <div className="button-row wide"><button className="secondary-button" disabled={busy} type="button" onClick={()=>setDraft(editable.payload)}>Annuler les changements</button><button className="primary-button" disabled={busy} type="button" onClick={()=>void run(()=>window.atoumweb.projects.dataProcessingAgreements.updateDraft(editable.id,draft),'Accord RGPD enregistré.')}>Enregistrer</button><button className="secondary-button" disabled={busy} type="button" onClick={()=>void run(async()=>{await window.atoumweb.projects.dataProcessingAgreements.updateDraft(editable.id,draft);await window.atoumweb.projects.dataProcessingAgreements.markSent(editable.id);},'Envoi de l’accord RGPD confirmé.')}>Confirmer l’envoi</button></div>
      </div>}
      {latest.status==='sent'&&<div className="project-site-rgpd-proof"><label>Preuve signée<select value={proofId} onChange={event=>setProofId(event.target.value)}><option value="">Choisir un document juridique du client…</option>{documents.map(document=><option value={document.id} key={document.id}>{document.title} · {document.fileName}</option>)}</select></label><button className="primary-button" disabled={busy||!proofId} type="button" onClick={()=>void run(()=>window.atoumweb.projects.dataProcessingAgreements.markSigned(latest.id,proofId),'Signature de l’accord RGPD confirmée.')}>Confirmer la signature</button></div>}
      {(latest.status==='sent'||latest.status==='signed')&&<button className="secondary-button" disabled={busy} type="button" onClick={()=>void run(()=>window.atoumweb.projects.dataProcessingAgreements.createRevision(latest.id),'Révision RGPD créée sans modifier la version précédente.')}>Créer une révision</button>}
      {items.length>1&&<details><summary>Historique · {items.length} versions</summary><ul>{items.map(item=><li key={item.id}>V{item.versionNumber} · {STATUS_LABELS[item.status]} · {new Date(item.updatedAt).toLocaleDateString('fr-FR')}</li>)}</ul></details>}
    </>}
  </section>;
}
