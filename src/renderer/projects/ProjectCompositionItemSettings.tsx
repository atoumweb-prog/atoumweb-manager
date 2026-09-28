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

interface EditorSnapshot {
  draft: CodeParts;
  texts: TextField[];
  colors: ColorField[];
  note: string;
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
<style>${escapeStyle(parts.css)}</style>
<style>html,body{display:block!important;visibility:visible!important;opacity:1!important;margin:0!important;min-height:100%!important;background:#fff;color:#111}*,*::before,*::after{box-sizing:border-box}</style>
</head><body>${parts.html || '<p style="padding:20px">Aucun HTML prévisualisable.</p>'}</body></html>`;
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
  return Array.from(new Set(matches)).slice(0, 16).map((value) => ({ origin: value, value }));
}

function replaceAll(source: string, current: string, next: string): string {
  return current === next ? source : source.split(current).join(next);
}

function toPickerHex(value: string): string | null {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  const short = trimmed.match(/^#([0-9a-fA-F]{3})$/);
  if (short) {
    const [r, g, b] = short[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  const rgb = trimmed.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
  if (!rgb) return null;
  const values = rgb.slice(1, 4).map((entry) => Math.max(0, Math.min(255, Number(entry))));
  return `#${values.map((entry) => Math.round(entry).toString(16).padStart(2, '0')).join('')}`;
}

function copySnapshot(snapshot: EditorSnapshot): EditorSnapshot {
  return {
    draft: { ...snapshot.draft },
    texts: snapshot.texts.map((entry) => ({ ...entry })),
    colors: snapshot.colors.map((entry) => ({ ...entry })),
    note: snapshot.note,
  };
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
  const [modulePreviewOpen, setModulePreviewOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<EditorSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<EditorSnapshot[]>([]);

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
      setUndoStack([]);
      setRedoStack([]);
      setLoading(false);
    }).catch((error) => {
      if (!cancelled) {
        setLoading(false);
        onMessage(error instanceof Error ? error.message : 'Impossible de charger le composant source.');
      }
    });
    return () => { cancelled = true; };
  }, [item.id, item.sourceVersionId]);

  const settings = useMemo<AtoumWebCompositionItemLocalSettings>(() => ({
    textEdits: texts
      .filter((entry) => entry.origin !== entry.value)
      .map((entry) => ({ from: entry.origin, to: entry.value })),
    colorEdits: colors
      .filter((entry) => entry.origin !== entry.value)
      .map((entry) => ({ from: entry.origin, to: entry.value })),
    note: note.trim() || null,
  }), [texts, colors, note]);

  function snapshot(): EditorSnapshot {
    return copySnapshot({ draft, texts, colors, note });
  }

  function remember(): void {
    const current = snapshot();
    setUndoStack((stack) => [...stack.slice(-39), current]);
    setRedoStack([]);
  }

  function applySnapshot(value: EditorSnapshot): void {
    const next = copySnapshot(value);
    setDraft(next.draft);
    setTexts(next.texts);
    setColors(next.colors);
    setNote(next.note);
  }

  function undo(): void {
    const previous = undoStack.at(-1);
    if (!previous) return;
    const current = snapshot();
    setUndoStack((stack) => stack.slice(0, -1));
    setRedoStack((stack) => [...stack.slice(-39), current]);
    applySnapshot(previous);
  }

  function redo(): void {
    const next = redoStack.at(-1);
    if (!next) return;
    const current = snapshot();
    setRedoStack((stack) => stack.slice(0, -1));
    setUndoStack((stack) => [...stack.slice(-39), current]);
    applySnapshot(next);
  }

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
    remember();
    setBusy(true);
    try {
      const updated = await window.atoumweb.referentials.compositions.resetItemLocalCode(compositionId, item.id);
      setDraft(base);
      setTexts(extractTexts(base.html));
      setColors(extractColors(base.css));
      setNote('');
      onUpdated(updated);
      onMessage('Bloc réinitialisé exactement à la version Bibliothèque de départ.');
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
    <div className="project-component-settings-toolbar">
      <div>
        <strong>Préparer ce bloc</strong>
        <small>Modifications locales uniquement · source Bibliothèque intacte</small>
      </div>
      <div>
        <button className="secondary-button" type="button" disabled={!undoStack.length || busy} onClick={undo} title="Annuler la dernière modification">↶ Annuler</button>
        <button className="secondary-button" type="button" disabled={!redoStack.length || busy} onClick={redo} title="Rétablir la modification">↷ Rétablir</button>
        <button className="secondary-button" type="button" disabled={busy} onClick={() => void reset()}>⟲ Version Bibliothèque</button>
      </div>
    </div>

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
              remember();
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
            <p>Clique sur le carré de couleur pour choisir visuellement avec la souris, ou saisis une valeur CSS.</p>
          </div>
          {colors.length === 0 && <p className="muted">Aucune couleur CSS simple détectée automatiquement.</p>}
          <div className="project-component-color-grid">
            {colors.map((entry, index) => {
              const pickerValue = toPickerHex(entry.value);
              return <label key={`${entry.origin}-${index}`} className="project-component-color-card">
                <span>Couleur {index + 1}</span>
                <div>
                  {pickerValue && <input
                    className="project-component-color-picker"
                    type="color"
                    value={pickerValue}
                    title="Choisir la couleur"
                    onChange={(event) => {
                      remember();
                      const next = event.target.value;
                      setDraft((current) => ({ ...current, css: replaceAll(current.css, entry.value, next) }));
                      setColors((current) => current.map((candidate, candidateIndex) =>
                        candidateIndex === index ? { ...candidate, value: next } : candidate
                      ));
                    }}
                  />}
                  <span className="project-component-color-swatch" style={{ background: entry.value }} aria-hidden="true" />
                  <input value={entry.value} onChange={(event) => {
                    remember();
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
          <textarea rows={2} value={note} onChange={(event) => {
            remember();
            setNote(event.target.value);
          }} placeholder="Ex. couleurs du client, texte à confirmer…" />
        </label>

        <details className="project-component-advanced" open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}>
          <summary>Code avancé</summary>
          <label>HTML<textarea rows={10} value={draft.html} onChange={(event) => {
            remember();
            setDraft((current) => ({ ...current, html: event.target.value }));
          }} /></label>
          <label>CSS<textarea rows={9} value={draft.css} onChange={(event) => {
            remember();
            setDraft((current) => ({ ...current, css: event.target.value }));
          }} /></label>
          <label>JavaScript<textarea rows={5} value={draft.javascript} onChange={(event) => {
            remember();
            setDraft((current) => ({ ...current, javascript: event.target.value }));
          }} /></label>
        </details>

        <div className="project-component-settings-actions">
          <button className="primary-button" type="button" disabled={busy || !draft.html.trim()} onClick={() => void save()}>Enregistrer les réglages</button>
          <button className="secondary-button" type="button" onClick={() => setModulePreviewOpen(true)}>Voir le module seul</button>
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
          <span className="eyebrow">Aperçu du module</span>
          <strong>{item.displayName}</strong>
          {item.hasLocalChanges && <small>Adaptation locale enregistrée</small>}
          <button className="secondary-button" type="button" onClick={() => setModulePreviewOpen(true)}>Agrandir</button>
        </div>
        <iframe title={`Aperçu préparé ${item.displayName}`} sandbox="" srcDoc={previewDocument(draft)} />
      </div>
    </div>

    {modulePreviewOpen && <div className="project-page-composition-modal module-only-preview" role="dialog" aria-modal="true">
      <div className="project-page-composition-modal-backdrop" onClick={() => setModulePreviewOpen(false)} />
      <div className="project-page-composition-modal-panel">
        <header>
          <div>
            <span className="eyebrow">Aperçu du module seul</span>
            <h3>{item.displayName}</h3>
            <p>Version préparée pour cette occurrence de « {pageName} ».</p>
          </div>
          <button className="secondary-button" type="button" onClick={() => setModulePreviewOpen(false)}>Fermer</button>
        </header>
        <div className="project-component-module-preview-large">
          <iframe className="interactive-preview" title={`Aperçu grand format ${item.displayName}`} sandbox="" srcDoc={previewDocument(draft)} />
        </div>
      </div>
    </div>}
  </div>;
}
