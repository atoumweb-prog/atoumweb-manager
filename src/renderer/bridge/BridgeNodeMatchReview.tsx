import { useEffect, useState } from 'react';
import type { BridgeModulePreview, BridgeNodeSummary, BridgeNodeMatchCandidate, BridgeNodeMatchDecision, BridgePageNodeMatchReview, BridgePageSnapshotDetail } from '../../shared/bridgeSnapshots';

interface Props {
  review: BridgePageNodeMatchReview;
  pageTitle: string;
  beforeDate: string;
  afterDate: string;
  busy: boolean;
  error: string | null;
  onDecision(before: string, after: string, decision: 'accepted' | 'rejected' | 'pending'): Promise<void>;
}

export function BridgeNodeMatchReviewPanel(props: Props) {
  const { review } = props;
  const [pages, setPages] = useState<[BridgePageSnapshotDetail, BridgePageSnapshotDetail] | null>(null);
  useEffect(() => {
    let active = true;
    setPages(null);
    Promise.all([
      window.atoumweb.bridgeSnapshots.getPage(review.beforePageSnapshotId),
      window.atoumweb.bridgeSnapshots.getPage(review.afterPageSnapshotId),
    ]).then((value) => { if (active) setPages(value); }).catch(() => { /* Les aperçus restent accessibles individuellement. */ });
    return () => { active = false; };
  }, [review.beforePageSnapshotId, review.afterPageSnapshotId]);
  return <section className="bridge-match-context">
    <h3>Reconnaître les éléments de « {props.pageTitle} »</h3>
    <p>Est-ce le même bloc dans les deux copies ? Ouvrez son contenu avant de décider. Vous pouvez laisser toute proposition en attente et poursuivre votre travail.</p>
    {props.error && <p role="alert">{props.error}</p>}
    {!review.candidates.length && <p>Aucune correspondance proposée pour cette page.</p>}
    {review.candidates.map((candidate, index) => <MatchCard key={`${candidate.beforeOccurrenceId}:${candidate.afterOccurrenceId}`}
      {...props} candidate={candidate} index={index}
      beforeNode={pages?.[0].nodes.find((node) => node.occurrenceId === candidate.beforeOccurrenceId)}
      afterNode={pages?.[1].nodes.find((node) => node.occurrenceId === candidate.afterOccurrenceId)}
      decision={review.decisions.find((item) => item.beforeOccurrenceId === candidate.beforeOccurrenceId && item.afterOccurrenceId === candidate.afterOccurrenceId)} />)}
  </section>;
}

function MatchCard(props: Props & { candidate: BridgeNodeMatchCandidate; index: number; beforeNode?: BridgeNodeSummary; afterNode?: BridgeNodeSummary; decision?: BridgeNodeMatchDecision }) {
  const { candidate, decision, review } = props;
  const [open, setOpen] = useState(false);
  const [previews, setPreviews] = useState<[BridgeModulePreview, BridgeModulePreview] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [later, setLater] = useState(false);
  async function inspect() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (previews) return;
    setLoading(true);
    setError(null);
    try {
      setPreviews(await Promise.all([
        window.atoumweb.bridgeSnapshots.getModulePreview(review.beforePageSnapshotId, candidate.beforeOccurrenceId),
        window.atoumweb.bridgeSnapshots.getModulePreview(review.afterPageSnapshotId, candidate.afterOccurrenceId),
      ]));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Contenu indisponible.'); }
    finally { setLoading(false); }
  }
  const recognizable = previews?.every((preview) => Boolean(excerpt(preview.html))
    || /<img\b[^>]*\bsrc\s*=\s*["']data:image\//i.test(preview.html));
  const title = previews?.[0] ? excerpt(previews[0].html) : '';
  const history = review.history.filter((item) => item.beforeOccurrenceId === candidate.beforeOccurrenceId && item.afterOccurrenceId === candidate.afterOccurrenceId);
  return <article className="bridge-match-card">
    <header>
      <h4>{title || `${readableLabel(candidate.beforeLabel)} · élément ${props.index + 1}`}</h4>
      <strong>{decision ? decision.decision === 'accepted' ? 'Même élément confirmé' : 'Éléments différents' : later ? 'À examiner plus tard' : 'Proposition en attente'}</strong>
    </header>
    <p>{props.pageTitle} · {position(props.beforeNode)} → {position(props.afterNode)}</p>
    {decision && <p>Votre décision du {new Date(decision.decidedAt).toLocaleString('fr-FR')} est enregistrée.</p>}
    <button className="secondary-button" type="button" onClick={() => void inspect()} disabled={loading}>{open ? 'Replier les deux copies' : 'Voir le contenu avant / après'}</button>
    {open && <>
      {loading && <p>Chargement des deux copies…</p>}
      {error && <p role="alert">{error}</p>}
      {previews && <div className="bridge-match-before-after">
        <MatchPreview label="Avant" date={props.beforeDate} preview={previews[0]} node={props.beforeNode} />
        <MatchPreview label="Après" date={props.afterDate} preview={previews[1]} node={props.afterNode} />
      </div>}
      <p className="muted">Aperçus reconstruits depuis les copies : JavaScript et chargements externes désactivés. La mise en page peut être incomplète.</p>
      {!recognizable && !loading && <p>Ces copies ne fournissent pas assez de contenu visuel pour identifier ce bloc. Laissez cette proposition en attente.</p>}
      {!decision && <div className="button-row">
        <button type="button" className="primary-button" disabled={props.busy || !recognizable} onClick={() => void props.onDecision(candidate.beforeOccurrenceId, candidate.afterOccurrenceId, 'accepted')}>C’est le même élément</button>
        <button type="button" className="secondary-button" disabled={props.busy || !recognizable} onClick={() => void props.onDecision(candidate.beforeOccurrenceId, candidate.afterOccurrenceId, 'rejected')}>Ce sont deux éléments différents</button>
        <button type="button" className="secondary-button" disabled={props.busy} onClick={() => { setLater(true); setOpen(false); }}>À examiner plus tard</button>
      </div>}
    </>}
    {decision && <button type="button" className="secondary-button" disabled={props.busy} onClick={() => void props.onDecision(candidate.beforeOccurrenceId, candidate.afterOccurrenceId, 'pending')}>Réexaminer cette décision</button>}
    {history.length > 0 && <details><summary>Décisions précédentes ({history.length})</summary>{history.map((item) => <p key={item.id}>
      {item.decision === 'accepted' ? 'Même élément confirmé' : 'Éléments différents'} le {new Date(item.decidedAt).toLocaleString('fr-FR')} — remis en attente le {new Date(item.reopenedAt).toLocaleString('fr-FR')}.
    </p>)}</details>}
    <details><summary>Détails techniques</summary>
      <p>Ressemblance calculée : {candidate.score}/100. Ce score ne garantit pas l’identité du bloc et ne constitue pas une validation humaine.</p>
      <p>{candidate.beforeOccurrenceId} → {candidate.afterOccurrenceId}</p>
      <ul>{candidate.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
      {decision?.logicalNodeId && <p>Identité Manager : {decision.logicalNodeId}</p>}
    </details>
  </article>;
}

function MatchPreview({ label, date, preview, node }: { label: string; date: string; preview: BridgeModulePreview; node?: BridgeNodeSummary }) {
  const text = excerpt(preview.html);
  return <section><h4>{label} · {new Date(date).toLocaleDateString('fr-FR')}</h4>
    <p>{position(node)}{text ? ` — ${text}` : ''}</p>
    {preview.html.trim() ? <iframe title={`${label} — ${preview.pageTitle} — ${position(node)}`} sandbox="" referrerPolicy="no-referrer" srcDoc={previewDocument(preview)} /> : <p>Aucun aperçu exploitable pour ce conteneur ou module.</p>}
  </section>;
}

function readableLabel(label: string): string {
  const names: Record<string, string> = { code: 'Bloc de contenu', section: 'Section', row: 'Rangée', column: 'Colonne', placeholder: 'Emplacement' };
  const key = label.replace(/^divi\//i, '').toLowerCase();
  return names[key] ?? label;
}
function position(node?: BridgeNodeSummary): string {
  return node ? `${readableLabel(node.label || node.moduleType || node.nodeType)} · position ${node.position + 1} dans son conteneur · niveau ${node.depth + 1}` : 'Position non disponible';
}
function excerpt(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,style,template,noscript').forEach((node) => node.remove());
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 160);
}
function previewDocument(preview: BridgeModulePreview): string {
  const doc = new DOMParser().parseFromString(preview.html, 'text/html');
  doc.querySelectorAll('script,iframe,object,embed,form,base,meta,link').forEach((node) => node.remove());
  doc.querySelectorAll('[href],[xlink\\:href]').forEach((node) => { node.removeAttribute('href'); node.removeAttribute('xlink:href'); });
  const css = [preview.globalCss, preview.pageCss, preview.moduleCss].join('\n').replace(/<\/style/gi, '<\\/style');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; form-action 'none'; base-uri 'none';"><style>body{margin:12px;background:white;color:#111;font-family:Arial,sans-serif}*{box-sizing:border-box}${css}</style></head><body>${doc.body.innerHTML}</body></html>`;
}
