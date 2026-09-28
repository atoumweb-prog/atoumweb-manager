import { useEffect, useMemo, useState } from 'react';
import type {
  AtoumWebCompositionDetail,
  AtoumWebCompositionItem,
  AtoumWebCompositionItemLocalSettings,
  AtoumWebTechnicalVersion,
} from '../../shared/referentials';

interface CodeParts {
  html: string;
  css: string;
  javascript: string;
}

interface TextField {
  origin: string;
  value: string;
}

interface ColorField {
  origin: string;
  value: string;
}

function parseVersion(version?: AtoumWebTechnicalVersion | null): CodeParts {
  if (!version?.contentText) return { html: '', css: '', javascript: '' };
  if (version.contentType === 'code' && ['html', 'htm'].includes((version.language ?? '').toLowerCase())) {
    return { html: version.contentText, css: '', javascript: '' };
  }
  if (version.contentType !== 'json') return { html: '', css: '', javascript: '' };
  try {
    const value = JSON.parse(version.contentText) as Record<string, unknown>;
    const reusable = value.reusable && typeof value.reusable === 'object' && !Array.isArray(value.reusable)
      ? value.reusable as Record<string, unknown>
      : null;
    if (reusable) {
      return {
        html: typeof reusable.html === 'string' ? reusable.html : '',
        css: typeof reusable.css === 'string' ? reusable.css : '',
        javascript: typeof reusable.javascript === 'string' ? reusable.javascript : '',
      };
    }
    const work = value.work && typeof value.work === 'object' && !Array.isArray(value.work)
      ? value.work as Record<string, unknown>
      : null;
    if (work) {
      return {
        html: typeof work.html === 'string' ? work.html : '',
        css: typeof work.css === 'string' ? work.css : '',
        javascript: typeof work.javascript === 'string' ? work.javascript : '',
      };
    }
    const original = value.original && typeof value.original === 'object' && !Array.isArray(value.original)
      ? value.original as Record<string, unknown>
      : null;
    const prepared = value.prepared && typeof value.prepared === 'object' && !Array.isArray(value.prepared)
      ? value.prepared as Record<string, unknown>
      : null;
    if (original) {
      return {
        html: typeof original.html === 'string' ? original.html : '',
        css: [
          typeof prepared?.cssGlobalUseful === 'string' ? prepared.cssGlobalUseful : '',
          typeof prepared?.cssPageUseful === 'string' ? prepared.cssPageUseful : '',
          typeof original.cssModule === 'string' ? original.cssModule : '',
        ].filter(Boolean).join('\n'),
        javascript: typeof original.javascript === 'string' ? original.javascript : '',
      };
    }
  } catch {
    return { html: '', css: '', javascript: '' };
  }
  return { html: '', css: '', javascript: '' };
}

function escapeStyle(value: string): string {
  return value.replace(/<\/style/gi, '<\\/style');
}

function previewDocument(parts: CodeParts): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; font-src https: data:;">
<style>html,body{margin:0;min-height:100%;background:#fff;color:#111}*,*::before,*::after{box-sizing:border-box}</style>
<style>${escapeStyle(parts.css)}</style></head><body>${parts.html || '<p style="padding:20px">Aucun HTML prévisualisable.</p>'}</body></html>`;
}

function extractTexts(html: string): TextField[] {
  if (!html.trim()) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const seen = new Set<string>();
  const results: TextField[] = [];
  let node = walker.nextNode();
  while (node && results.length < 18) {
    const parent = node.parentElement?.tagName.toLowerCase();
    const value = node.nodeValue?.trim() ?? '';
    if (value.length >= 2 && parent !== 'style' && parent !== 'script' && !seen.has(value)) {
      seen.add(value);
      results.push({ origin: value, value });
    }
    node = walker.nextNode();
  }
  return results;
}

function replaceText(html: string, current: string, next: string): string {
  if (!html.trim() || current === next) return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const raw = node.nodeValue ?? '';
    if (raw.trim() === current) {
      const leading = raw.match(/^\s*/)?.[0] ?? '';
      const trailing = raw.match(/\s*$/)?.[0] ?? '';
      node.nodeValue = `${leading}${next}${trailing}`;
    }
    node = walker.nextNode();
  }
  return doc.body.innerHTML;
}

function extractColors(css: string): ColorField[] {
  const matches = css.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g) ?? [];
  const unique = Array.from(new Set(matches));
  return unique.slice(0, 16).map((value) => ({ origin: value, value }));
}

function replaceAll(source: string, current: string, next: string): string {
  return current === next ? source : source.split(current).join(next);
}

export function ProjectCompositionItemSettings({
  compositionId,
  item,
  pageName,
  onUpdated,
  onMessage,
}: {
  compositionId: string;
  item: AtoumWebCompositionItem;
  pageName: string;
  onUpdated: (detail: AtoumWebCompositionDetail) => void;
  onMessage: (message: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [base, setBase] = useState<CodeParts>({ html: '', css: '', javascript: '' });
  const [draft, setDraft] = useState<CodeParts>({ html: '', css: '', javascript: '' });
  const [texts, setTexts] = useState<TextField[]>([]);
  const [colors, setColors] = useState<ColorField[]>([]);
  const [note, setNote] = useState(item.localSettings.note ?? '');
  const [variantName, setVariantName] = useState(`${item.displayName} — ${pageName}`);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void window.atoumweb.referentials.library.get(item.sourceItemId).then((detail) => {
      if (cancelled) return;
      const version = detail.versions.find((candidate) => candidate.id === item.sourceVersionId) ?? null;
      const source = parseVersion(version);
      const effective = item.hasLocalChanges && item.localHtml
        ? {
            html: item.localHtml,
            css: item.localCss ?? '',
            javascript: item.localJavascript ?? '',
          }
        : source;
      setBase(source);
      setDraft(effective);
      setTexts(extractTexts(effective.html));
      setColors(extractColors(effective.css));
      setNote(item.localSettings.note ?? '');
      setLoading(false);
    }).catch((error) => {
      if (!cancelled) {
        setLoading(false);
        onMessage(error instanceof Error ? error.message : 'Impossible de charger le composant source.');
      }
    });
    return () => { cancelled = true; };
  }, [item.id, item.sourceVersionId, item.localUpdatedAt]);

  const settings = useMemo<AtoumWebCompositionItemLocalSettings>(() => ({
    textEdits: texts
      .filter((entry) => entry.origin !== entry.value)
      .map((entry) => ({ from: entry.origin, to: entry.value })),
    colorEdits: colors
      .filter((entry) => entry.origin !== entry.value)
      .map((entry) => ({ from: entry.origin, to: entry.value })),
    note: note.trim() || null,
  }), [texts, colors, note]);

  async function save(): Promise<void> {
    setBusy(true);
    try {
      const updated = await window.atoumweb.referentials.compositions.updateItemLocalCode(
        compositionId,
        item.id,
        {
          html: draft.html,
          css: draft.css,
          javascript: draft.javascript,
          settings,
        },
      );
      onUpdated(updated);
      onMessage('Réglages locaux du bloc enregistrés.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’enregistrer les réglages du bloc.');
    } finally {
      setBusy(false);
    }
  }

  async function reset(): Promise<void> {
    setBusy(true);
    try {
      const updated = await window.atoumweb.referentials.compositions.resetItemLocalCode(compositionId, item.id);
      setDraft(base);
      setTexts(extractTexts(base.html));
      setColors(extractColors(base.css));
      setNote('');
      onUpdated(updated);
      onMessage('Le bloc utilise de nouveau exactement la version Bibliothèque.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible de réinitialiser le bloc.');
    } finally {
      setBusy(false);
    }
  }

  async function promote(): Promise<void> {
    if (!variantName.trim()) return;
    setBusy(true);
    try {
      const promoted = await window.atoumweb.referentials.compositions.promoteItemVariant(
        compositionId,
        item.id,
        {
          name: variantName.trim(),
          description: `Adaptation proposée depuis la Page « ${pageName} ».`,
        },
      );
      onMessage(`Variante « ${promoted.name} » envoyée dans la Bibliothèque avec le statut « À adapter / valider ».`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Impossible d’envoyer cette adaptation vers la Bibliothèque.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="project-component-settings-panel"><p className="muted">Chargement des réglages…</p></div>;

  return <div className="project-component-settings-panel">
    <div className="project-component-settings-grid">
      <div className="project-component-settings-controls">
        <div className="project-component-settings-section">
          <div>
            <span className="eyebrow">Textes</span>
            <p>Modifie uniquement cette occurrence. Le modèle Bibliothèque reste intact.</p>
          </div>
          {texts.length === 0 && <p className="muted">Aucun texte simple détecté automatiquement.</p>}
          {texts.map((entry, index) => <label key={`${entry.origin}-${index}`}>
            Texte {index + 1}
            <input value={entry.value} onChange={(event) => {
              const next = event.target.value;
              setDraft((current) => ({ ...current, html: replaceText(current.html, entry.value, next) }));
              setTexts((current) => current.map((candidate, candidateIndex) =>
                candidateIndex === index ? { ...candidate, value: next } : candidate
              ));
            }} />
            <small>{entry.origin}</small>
          </label>)}
        </div>

        <div className="project-component-settings-section">
          <div>
            <span className="eyebrow">Couleurs</span>
            <p>Les couleurs détectées sont remplacées uniquement dans le CSS local de cette occurrence.</p>
          </div>
          {colors.length === 0 && <p className="muted">Aucune couleur CSS simple détectée automatiquement.</p>}
          <div className="project-component-color-grid">
            {colors.map((entry, index) => {
              const hex = /^#[0-9a-fA-F]{6}$/.test(entry.value);
              return <label key={`${entry.origin}-${index}`}>
                <span>Couleur {index + 1}</span>
                <div>
                  {hex && <input type="color" value={entry.value} onChange={(event) => {
                    const next = event.target.value;
                    setDraft((current) => ({ ...current, css: replaceAll(current.css, entry.value, next) }));
                    setColors((current) => current.map((candidate, candidateIndex) =>
                      candidateIndex === index ? { ...candidate, value: next } : candidate
                    ));
                  }} />}
                  <input value={entry.value} onChange={(event) => {
                    const next = event.target.value;
                    setDraft((current) => ({ ...current, css: replaceAll(current.css, entry.value, next) }));
                    setColors((current) => current.map((candidate, candidateIndex) =>
                      candidateIndex === index ? { ...candidate, value: next } : candidate
                    ));
                  }} />
                </div>
                <small>Source : {entry.origin}</small>
              </label>;
            })}
          </div>
        </div>

        <label className="project-component-note">Note locale
          <textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ex. couleurs du client, texte à confirmer…" />
        </label>

        <details className="project-component-advanced" open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}>
          <summary>Code avancé</summary>
          <label>HTML<textarea rows={10} value={draft.html} onChange={(event) => setDraft((current) => ({ ...current, html: event.target.value }))} /></label>
          <label>CSS<textarea rows={9} value={draft.css} onChange={(event) => setDraft((current) => ({ ...current, css: event.target.value }))} /></label>
          <label>JavaScript<textarea rows={5} value={draft.javascript} onChange={(event) => setDraft((current) => ({ ...current, javascript: event.target.value }))} /></label>
        </details>

        <div className="project-component-settings-actions">
          <button className="primary-button" type="button" disabled={busy || !draft.html.trim()} onClick={() => void save()}>Enregistrer les réglages</button>
          <button className="secondary-button" type="button" disabled={busy || !item.hasLocalChanges} onClick={() => void reset()}>Réinitialiser</button>
        </div>

        <div className="project-component-promotion">
          <div>
            <span className="eyebrow">Capitaliser</span>
            <strong>Envoyer cette adaptation comme variante</strong>
            <p>La nouvelle variante sera créée en « À adapter / valider », jamais directement prête.</p>
          </div>
          <input value={variantName} onChange={(event) => setVariantName(event.target.value)} />
          <button className="secondary-button" type="button" disabled={busy || !item.hasLocalChanges || !variantName.trim()} onClick={() => void promote()}>
            Envoyer vers la Bibliothèque
          </button>
        </div>
      </div>

      <div className="project-component-settings-preview">
        <div>
          <span className="eyebrow">Aperçu préparé</span>
          <strong>{item.displayName}</strong>
          {item.hasLocalChanges && <small>Adaptation locale enregistrée</small>}
        </div>
        <iframe title={`Aperçu préparé ${item.displayName}`} sandbox="" srcDoc={previewDocument(draft)} />
      </div>
    </div>
  </div>;
}
