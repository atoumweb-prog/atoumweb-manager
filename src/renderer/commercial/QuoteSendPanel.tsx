import {useEffect, useRef, useState} from 'react';
import type {QuoteDetail} from '../../shared/commercial';
import type {ContractIssue} from '../../shared/quoteContractPreparation';
import {approvedBusinessReview} from '../../shared/approvedBusinessPolicy';
import {quoteEmailDraft} from '../../shared/quoteEmailDraft';
import {QUICK_REVIEW_CODES} from '../../shared/quoteQuickReview';
import {unsavedRegistry} from '../unsaved/unsaved';
import {focusContractField} from './contractFieldNavigation';
import './quote-send.css';

/**
 * Lot 4 — un seul bouton « Envoyer le devis ».
 * 1. contrôle des points restants ; 2. préparation (texte du devis et des CGV arrêté) ;
 * 3. PDF unique devis + CGV, montré dans son dossier, et brouillon d'e-mail ; 4. « C'est envoyé ».
 * Le Manager n'envoie rien lui-même. Les protections existantes sont inchangées : l'envoi n'est
 * enregistré que sur confirmation, et la version transmise est alors figée.
 */
export function QuoteSendPanel({quote, onChanged, onMessage}: {quote: QuoteDetail; onChanged: (next: QuoteDetail) => void; onMessage: (text: string) => void}) {
  const [issues, setIssues] = useState<ContractIssue[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [pdfPath, setPdfPath] = useState('');
  const [note, setNote] = useState('');
  const [how, setHow] = useState('');
  const running = useRef(false), current = useRef(quote.id); current.current = quote.id;
  const group = 'quote:' + quote.id;
  const prepared = Boolean(quote.finalizedAt);
  const draft = quoteEmailDraft(quote);

  useEffect(() => { setPdfPath(''); setNote(''); setHow(''); }, [quote.id]);
  useEffect(() => {
    let active = true, revision = 0;
    setIssues(null); setError('');
    const refresh = () => {
      const request = ++revision;
      void Promise.all([window.atoumweb.quotePreparation.get(quote.id), window.atoumweb.quotes.preparationIssues(quote.id)]).then(([preparation, lineIssues]) => {
        if (!active || request !== revision) return;
        setIssues([...preparation.issues.filter(issue => issue.severity === 'blocking'), ...lineIssues.map((message, index) => ({code: 'LINE_' + index, severity: 'blocking' as const, message}))]);
        setError('');
      }).catch(reason => { if (active && request === revision) setError(String(reason)); });
    };
    refresh();
    window.addEventListener('atoumweb:changed', refresh);
    return () => { active = false; window.removeEventListener('atoumweb:changed', refresh); };
  }, [quote.id, quote.updatedAt]);

  async function run(label: string, action: () => Promise<void>): Promise<void> {
    if (running.current) return;
    if (unsavedRegistry.active(group).length) { onMessage('Enregistre ou annule les modifications de ce devis avant de l’envoyer.'); return; }
    running.current = true; setBusy(label); setNote('');
    try { await action(); }
    catch (reason) { if (current.current === quote.id) setNote(reason instanceof Error ? reason.message : String(reason)); }
    finally { running.current = false; if (current.current === quote.id) setBusy(''); }
  }

  /** PDF devis + CGV, montré dans son dossier, puis brouillon d'e-mail. Ne marque rien comme envoyé. */
  async function prepareDocuments(id: string): Promise<void> {
    const pdf = await window.atoumweb.quotes.generatePdf(id);
    if (current.current !== id) return;
    setPdfPath(pdf.path);
    await window.atoumweb.quotes.revealPdf(id).catch(() => false);
    const opened = await window.atoumweb.quotes.openEmailDraft(id).then(() => true).catch(() => false);
    if (current.current === id) setNote(opened ? 'PDF créé et brouillon d’e-mail ouvert : joins le PDF, envoie ton e-mail, puis clique sur « C’est envoyé ».' : 'PDF créé. Aucune messagerie n’a pu être ouverte : envoie le PDF par ton moyen habituel, puis clique sur « C’est envoyé ».');
  }

  const send = (canonicalReview = false) => run('Préparation du devis…', async () => {
    const id = quote.id;
    const review = await window.atoumweb.contractTerms.quotes.get(id);
    if (review.warnings.length > 0 && !window.confirm(`Points d’attention sur les CGV :\n\n${review.warnings.map(warning => '• ' + warning).join('\n')}\n\nContinuer quand même ?`)) return;
    const next = await window.atoumweb.quotes.finalize(id, canonicalReview);
    onChanged(next);
    await prepareDocuments(id);
  });

  const confirmSent = () => run('Enregistrement de l’envoi…', async () => {
    const id = quote.id, provenance = how.trim() || (draft.to ? `E-mail à ${draft.to}` : '');
    if (!provenance) throw Error('Indique comment tu as envoyé le devis (par exemple : e-mail à l’adresse du client).');
    const state = await window.atoumweb.quotes.transmissionState(id);
    if (!state.contentHash) throw Error('Le devis préparé est introuvable : clique sur « Corriger le devis », puis renvoie-le.');
    if (!window.confirm(`Confirmer que le devis ${quote.number} a bien été envoyé au client ?\n\nSon texte et ses CGV seront figés : pour le modifier ensuite, il faudra créer une révision.`)) return;
    const next = await window.atoumweb.quotes.markSent(id, {operationId: crypto.randomUUID(), preparationId: state.preparationId, contentHash: state.contentHash, confirmed: true, channel: 'other', provenance, occurredAt: 'now'});
    onChanged(next);
    onMessage(`Devis ${next.number} envoyé. Sa version est figée.`);
  });

  const resume = () => run('Réouverture du devis…', async () => {
    if (!quote.contractPreparationId || !window.confirm('Corriger ce devis avant de l’envoyer ? Tu devras cliquer de nouveau sur « Envoyer le devis » ensuite.')) return;
    onChanged(await window.atoumweb.quotes.resumeDraft(quote.id, quote.contractPreparationId));
    setPdfPath('');
  });

  if (quote.status !== 'draft') return null;
  const warnings = approvedBusinessReview(quote).warnings;
  const blocking = issues ?? [];
  const model = quote.dataAgreementModel;
  const modelNeeded = Boolean(model?.required), modelOk = !modelNeeded || Boolean(model?.handedAt);
  const quick = blocking.filter(issue => QUICK_REVIEW_CODES.includes(issue.code)).length;

  if (prepared) return <section className="quote-send-panel" aria-label="Envoyer le devis">
    <strong>Ton devis est prêt à partir</strong>
    <ol className="quote-send-steps">
      <li><span>Le PDF (devis + CGV)</span>{pdfPath ? <code>{pdfPath}</code> : <em>à créer</em>}
        <div><button type="button" className="secondary-button" disabled={!!busy} onClick={() => void run('Création du PDF…', () => prepareDocuments(quote.id))}>{pdfPath ? 'Recréer le PDF' : 'Créer le PDF et le brouillon d’e-mail'}</button>
          {pdfPath && <button type="button" className="secondary-button" disabled={!!busy} onClick={() => void window.atoumweb.quotes.revealPdf(quote.id)}>Montrer le fichier</button>}</div></li>
      <li><span>L’e-mail au client</span>{draft.to ? <code>{draft.to}</code> : <em>adresse e-mail du client non renseignée : tu la saisiras dans ta messagerie</em>}
        <div><button type="button" className="secondary-button" disabled={!!busy} onClick={() => void window.atoumweb.quotes.openEmailDraft(quote.id).catch(() => setNote('Aucune messagerie n’a pu être ouverte.'))}>Ouvrir un brouillon d’e-mail</button></div>
        <small>Le Manager n’envoie rien : c’est toi qui joins le PDF et cliques sur Envoyer.</small></li>
      {modelNeeded && <li><span>Le modèle d’accord de protection des données (RGPD)</span>
        <small>Ce devis touche des données personnelles : le modèle est joint à la fin du PDF. Le client peut le consulter avant d’accepter ; l’accord lui-même se prépare et se signe pour chaque site, avant la première opération sur ses données.</small>
        <div><button type="button" className="secondary-button" disabled={!!busy} onClick={() => void run('Création du modèle…', async () => { const pdf = await window.atoumweb.quotes.dataAgreementModelPdf(quote.id); if (current.current === quote.id) setNote('Modèle d’accord RGPD créé : ' + pdf.path); })}>Éditer le modèle d’accord RGPD (PDF)</button></div>
        <label className="quote-send-check"><input type="checkbox" checked={Boolean(model?.handedAt)} disabled={!!busy} onChange={event => void run('Enregistrement…', async () => { onChanged(await window.atoumweb.quotes.setDataAgreementModelHanded(quote.id, event.target.checked)); })}/> Modèle d’accord RGPD remis au client avec le devis{model?.handedAt ? ' (le ' + new Date(model.handedAt).toLocaleDateString('fr-FR') + ')' : ''}</label></li>}
      <li><span>Quand c’est parti</span>
        <label>Comment l’as-tu envoyé ?<input value={how} onChange={event => setHow(event.target.value)} placeholder={draft.to ? `E-mail à ${draft.to}` : 'Ex. e-mail à l’adresse du client'}/></label>
        <div><button type="button" className="primary-button" disabled={!!busy || !modelOk} onClick={() => void confirmSent()}>C’est envoyé</button>
          {!modelOk && <small role="status">Coche d’abord « Modèle d’accord RGPD remis au client avec le devis ».</small>}
          {quote.contractPreparationId && <button type="button" className="secondary-button" disabled={!!busy} onClick={() => void resume()}>Corriger le devis</button>}</div></li>
    </ol>
    {busy && <p role="status">{busy}</p>}
    {note && <p role="status">{note}</p>}
  </section>;

  return <section className="quote-send-panel quote-finalization-check" aria-label="Envoyer le devis">
    <strong>{error ? 'Vérification impossible' : !issues ? 'Vérification du devis…' : blocking.length ? `Encore ${blocking.length} point${blocking.length > 1 ? 's' : ''} à régler avant l’envoi` : 'Tout est prêt : tu peux envoyer ce devis'}</strong>
    {error && <p role="alert">{error}</p>}
    {quick > 0 && <p className="muted">{quick === blocking.length ? 'Ils se règlent tous dans « Avant d’envoyer : 6 réponses à valider », juste au-dessus.' : 'Une partie se règle dans « Avant d’envoyer : 6 réponses à valider », juste au-dessus.'}</p>}
    {blocking.length > 0 && <ul>{blocking.map((issue, index) => <li key={issue.code + index}><button type="button" className="contract-issue-link" data-issue-code={issue.code} onClick={() => issue.code.startsWith('LINE_') ? window.dispatchEvent(new CustomEvent('atoumweb:quote-lines', {detail: {quoteId: quote.id}})) : focusContractField(quote.id, issue.code)}>{issue.message} →</button></li>)}</ul>}
    {warnings.length > 0 && <details open><summary>Points d’attention sur ce devis</summary><ul>{warnings.map(message => <li key={message}>{message}</li>)}</ul></details>}
    <button type="button" className="primary-button quote-send-button" disabled={!issues || !!error || blocking.length > 0 || !!busy} onClick={() => void send(false)}>{busy || 'Envoyer le devis'}</button>
    {issues && !blocking.length && <p className="muted">Le Manager prépare le PDF (devis + CGV) et ouvre un brouillon d’e-mail. Rien ne part sans toi.{modelNeeded ? ' Ce devis touche des données personnelles : le modèle d’accord RGPD sera joint à la fin du PDF. Tu peux le consulter avec le bouton « Modèle d’accord RGPD (PDF) », en haut de cet écran.' : ''}</p>}
    {note && <p role="status">{note}</p>}
    <details><summary>Option avancée</summary><button type="button" className="secondary-button" disabled={!issues || !!error || blocking.length > 0 || !!busy} onClick={() => void send(true)}>Envoyer avec le classement approuvé des clauses</button><p className="muted">Pour les bibliothèques disposant d’un classement approuvé.</p></details>
  </section>;
}
