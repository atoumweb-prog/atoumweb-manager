import { useEffect, useState } from 'react';
import type { QuoteDetail } from '../../shared/commercial';
import type { ContractPresentation } from '../../shared/contractPresentation';
import { buildQuoteHtml } from '../../shared/quoteDocumentHtml';
import { unsavedRegistry } from '../unsaved/unsaved';

export function QuoteClientPreview({quote,onClose}:{quote:QuoteDetail;onClose:()=>void}) {
  const [presentation,setPresentation]=useState<ContractPresentation|null>(null);
  const [error,setError]=useState(''),[generating,setGenerating]=useState(false),[pdfPath,setPdfPath]=useState('');
  useEffect(()=>{let active=true;setPresentation(null);setError('');setPdfPath('');
    void window.atoumweb.contractTerms.quotes.presentation(quote.id).then(p=>{if(active)setPresentation(p);}).catch(e=>{if(active)setError(e instanceof Error?e.message:String(e));});return()=>{active=false;};
  },[quote.id,quote.status,quote.finalizedAt,quote.contractCompiledAt,quote.updatedAt]);
  async function generate(){if(generating)return;if(unsavedRegistry.active('quote:'+quote.id).length){setError('Enregistre ou annule les saisies avant de générer le PDF.');return;}
    setGenerating(true);setError('');try{const result=await window.atoumweb.quotes.generatePdf(quote.id);setPdfPath(result.path);}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setGenerating(false);}}
  return <div className="quote-preview-overlay" role="dialog" aria-modal="true" aria-label={`Prévisualisation ${quote.number}`}><div className="quote-client-preview">
    <div className="quote-client-preview-toolbar"><div><span className="eyebrow">Aperçu du devis et de son annexe</span><strong>{quote.number}</strong></div><div className="quote-client-preview-actions"><button className="primary-button" disabled={generating||!presentation} type="button" onClick={()=>void generate()}>{generating?'Génération…':'Générer le PDF'}</button><button className="secondary-button" type="button" onClick={onClose}>Fermer</button></div></div>
    {pdfPath&&<div className="quote-pdf-result"><strong>PDF créé</strong><span>{pdfPath}</span></div>}{error&&<div role="alert" className="quote-pdf-error">{error}</div>}
    {presentation?<><p className="quote-preview-help">Même contenu et modèle que le PDF. La pagination est appliquée lors de la génération.</p><iframe title={`Devis et annexe ${quote.number}`} className="quote-document-frame" sandbox="allow-same-origin" srcDoc={buildQuoteHtml(quote,presentation)}/></>:!error&&<p>Chargement du document enregistré…</p>}
  </div></div>;
}
