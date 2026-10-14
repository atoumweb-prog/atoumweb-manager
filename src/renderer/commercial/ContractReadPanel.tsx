import { useEffect, useState } from 'react';
import type { ContractPresentation } from '../../shared/contractPresentation';
import { contractCopy } from '../../shared/contractPresentation';
import { reviewContractTextImport } from '../../shared/contractImportReview';
import './contract-library.css';

export function ContractReadPanel({presentation,commercial='',unsaved=false,copy=true}:{presentation:ContractPresentation;commercial?:string;unsaved?:boolean;copy?:boolean}) {
  const [message,setMessage]=useState('');
  const [proposedText,setProposedText]=useState('');
  // A pasted comparison must never leak into the next quote or historical snapshot.
  useEffect(()=>setProposedText(''),[presentation.text,presentation.state,presentation.compiledAt]);
  const review=proposedText?reviewContractTextImport({originalText:presentation.text,importedText:proposedText,quoteState:presentation.state}):null;
  async function copyText(text:string,label:string) {
    try { await window.atoumweb.contractTerms.copyText(text);setMessage(`${label} copié.`); }
    catch {setMessage('Copie impossible. Le texte reste sélectionnable.');}
  }
  return <section className="contract-read-panel" aria-label="Contrat & CGV">
    <header><h3>{presentation.template?'Aperçu du contrat type':'Contrat & CGV'}</h3><span>{presentation.template?'Consultation seule — aucun devis créé':presentation.state==='frozen'?'Snapshot contractuel figé':presentation.state==='historical_missing'?'Absence historique conservée':'Assemblage courant — non figé'}{presentation.compiledAt?` · ${new Date(presentation.compiledAt).toLocaleString('fr-FR')}`:''}</span></header>
    <p className="muted">Lecture et copies depuis les valeurs enregistrées. Le contrat fait partie du devis. Aucune validation juridique globale des clauses n’est supposée.</p>
    {unsaved&&<p role="status" className="cgv-warning">Des modifications ne sont pas enregistrées. La lecture et les copies portent sur la dernière version enregistrée.</p>}
    {copy&&<div className="contract-toolbar">
      <button type="button" className="primary-button" disabled={unsaved||!presentation.text} onClick={()=>void copyText(contractCopy('abby',presentation,commercial),'Contenu pour Abby')}>Copier pour Abby</button>
      <button type="button" className="secondary-button" disabled={unsaved||!presentation.text} onClick={()=>void copyText(contractCopy('contract',presentation,commercial),'Contrat')}>Copier le contrat</button>
      <button type="button" className="secondary-button" disabled={unsaved||!presentation.text||!commercial} onClick={()=>void copyText(contractCopy('all',presentation,commercial),'Bloc commercial et contrat')}>Copier tout</button>
      <button type="button" className="secondary-button" onClick={()=>window.dispatchEvent(new CustomEvent('atoumweb:open-contract-library',{detail:null}))}>Bibliothèque contractuelle</button>
    </div>}
    {message&&<p role="status">{message}</p>}
    <div className="contract-reading-scroll" tabIndex={0} aria-label="Lecture du contrat assemblé">
      {presentation.sections.map(section=><details key={section.id} open className="contract-reading-section">
        <summary>{section.title}</summary><div className="contract-paragraph">{section.text}</div>
        {copy&&section.text&&<button type="button" className="secondary-button compact-button" disabled={unsaved} onClick={()=>void copyText(`${section.title}\n\n${section.text}`,'Section')}>Copier cette section</button>}
      </details>)}
      {!presentation.sections.length&&<p>Snapshot contractuel vide conservé. Aucun contenu ajouté depuis la bibliothèque actuelle.</p>}
    </div>
    {!presentation.template&&<details className="contract-module-inventory">
      <summary>Comparer un texte externe au contrat enregistré (lecture seule)</summary>
      <p className="muted">Coller uniquement du texte extrait d’un document. Ce contrôle n’importe pas un fichier DOCX et ne remplace jamais un contrat enregistré ou signé.</p>
      <textarea aria-label="Texte contractuel externe à comparer" value={proposedText} onChange={event=>setProposedText(event.target.value)} maxLength={1000001} rows={5} />
      {review&&<div role="status">
        <p>{review.reason}</p>
        {review.changed&&<p>Différence (extraits limités) : supprimé «{review.removedExcerpt}» ; ajouté «{review.addedExcerpt}».</p>}
        {review.mayProposeDraft&&<p>Proposition uniquement : aucune écriture automatique. Une validation humaine et un enregistrement explicite restent nécessaires.</p>}
      </div>}
      <button type="button" className="secondary-button" onClick={()=>setProposedText('')} disabled={!proposedText}>Effacer la comparaison</button>
    </details>}
    <details className="contract-module-inventory"><summary>Modules inclus ({presentation.modules.length}) et références utilisées</summary>
      {presentation.modules.map((m,i)=><div key={i}><strong>{m.title}</strong> · {m.code}{m.version!==null?` · v${m.version}`:''} · {m.source==='base'?'Socle commun':m.source==='catalog'?'Prestation vendue':'Particulière'}</div>)}
      {presentation.types.map(t=><button type="button" key={t.id} className="secondary-button" onClick={()=>window.dispatchEvent(new CustomEvent('atoumweb:open-contract-library',{detail:t.id}))}>{t.name} · v{t.versionNumber}</button>)}
    </details>
  </section>;
}
