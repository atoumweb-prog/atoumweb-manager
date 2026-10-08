import { commercialAbbyBlock } from '../../shared/commercialAbby';
import type { QuoteDetail } from '../../shared/commercial';

export function QuoteAbbyPanel({quote,onMessage}:{quote:QuoteDetail;onMessage:(text:string)=>void}) {
  const text=commercialAbbyBlock(quote);
  return <section className="panel quote-abby-panel"><h3>Préparer Abby</h3><p>Copiez les lignes commerciales dans Abby, puis le bloc contractuel du Builder. Aucun envoi automatique. Le PDF accepté sera rattaché à ce devis.</p>
    <button type="button" className="secondary-button" onClick={()=>void window.atoumweb.contractTerms.copyText(text).then(()=>onMessage('Bloc commercial copié pour Abby.')).catch(()=>onMessage('Copie impossible ; sélectionnez le texte ci-dessous.'))}>Copier le bloc commercial pour Abby</button>
    <details><summary>Consulter le bloc commercial</summary><textarea readOnly aria-label="Bloc commercial Abby" value={text} rows={12}/></details></section>;
}
