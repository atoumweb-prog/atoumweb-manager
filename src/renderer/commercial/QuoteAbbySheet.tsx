import {useEffect, useState} from 'react';
import type {QuoteDetail} from '../../shared/commercial';
import type {QuoteContractParameters} from '../../shared/quoteContractPreparation';
import {abbySheet} from '../../shared/abbySheet';
import './quote-send.css';

/**
 * Lot 4 — fiche « À recopier dans Abby », affichée dès que le devis est envoyé.
 * Lecture seule : ne modifie ni le devis ni son contrat figé, n'envoie rien à Abby.
 */
export function QuoteAbbySheet({quote, onMessage}: {quote: QuoteDetail; onMessage: (text: string) => void}) {
  const [parameters, setParameters] = useState<QuoteContractParameters | null>(null);
  useEffect(() => {
    let active = true;
    setParameters(null);
    void window.atoumweb.quotePreparation.get(quote.id).then(preparation => { if (active) setParameters(preparation.parameters); }).catch(() => undefined);
    return () => { active = false; };
  }, [quote.id, quote.updatedAt]);

  const sheet = abbySheet(quote, parameters);
  const copy = (text: string, what: string) => void window.atoumweb.contractTerms.copyText(text).then(() => onMessage(`${what} copié${what.endsWith('s') ? 's' : ''} pour Abby.`)).catch(() => onMessage('Copie impossible : sélectionne le texte à la main.'));
  const accepted = quote.status === 'accepted';

  return <section className="quote-abby-sheet" aria-label="À recopier dans Abby">
    <h3>À recopier dans Abby</h3>
    <p>{accepted ? 'Le devis est accepté : voici ce qu’il faut reprendre dans Abby pour facturer.' : 'Le devis est envoyé : voici ce qu’il faut reprendre dans Abby si tu y prépares le devis ou la facture d’acompte.'} Abby reste l’endroit où tu fais tes factures ; le Manager ne lui envoie rien.</p>

    <div className="quote-abby-block">
      <header><strong>Client</strong><button type="button" className="secondary-button" onClick={() => copy(sheet.text.client, 'Client')}>Copier</button></header>
      <pre>{sheet.text.client}</pre>
    </div>

    <div className="quote-abby-block">
      <header><strong>Lignes — {sheet.reference}</strong><button type="button" className="secondary-button" onClick={() => copy(sheet.text.lines, 'Lignes')}>Copier</button></header>
      <table className="quote-abby-table">
        <thead><tr><th>Désignation</th><th>Quantité</th><th className="amount">Prix unitaire</th><th className="amount">Total</th></tr></thead>
        <tbody>{sheet.lines.map((line, index) => <tr key={index}><td>{line.label}</td><td>{line.quantity}</td><td className="amount">{line.unitPrice}</td><td className="amount">{line.total}</td></tr>)}</tbody>
        <tfoot><tr><th colSpan={3}>Total du devis</th><td className="amount"><strong>{sheet.total}</strong></td></tr></tfoot>
      </table>
    </div>

    <div className="quote-abby-block">
      <header><strong>Échéances prévues au devis</strong>{sheet.payments.length > 0 && <button type="button" className="secondary-button" onClick={() => copy(sheet.text.payments, 'Échéances')}>Copier</button>}</header>
      {sheet.payments.length > 0
        ? <table className="quote-abby-table"><tbody>{sheet.payments.map((payment, index) => <tr key={index}><td>{payment.label}</td><td>{payment.when}</td><td className="amount">{payment.amount}</td></tr>)}</tbody></table>
        : <p>Échéancier non disponible pour ce devis.</p>}
      <p>Ce sont les montants prévus. Le Manager ne sait pas si un paiement a été reçu : vérifie-le dans Abby ou sur ton compte.</p>
    </div>
  </section>;
}
