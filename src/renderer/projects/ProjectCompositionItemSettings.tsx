import { buildComponentPreview } from './componentPreview';
import {
  extractComponentTexts,
  extractComponentVisuals,
  replaceComponentText,
  updateComponentVisual,
  type ComponentTextField,
  type ComponentVisualField,
} from './componentLocalEditor';
import { useEffect, useMemo, useState } from 'react';
import type {
  AtoumWebCompositionDetail,
  AtoumWebCompositionItem,
  AtoumWebCompositionItemLocalSettings,
  AtoumWebTechnicalVersion,
} from '../../shared/referentials';

export interface CodeParts {
  html: string;
  css: string;
  javascript: string;
}

interface ColorField {
  origin: string;
  value: string;
}

interface EditorSnapshot {
  draft: CodeParts;
  texts: ComponentTextField[];
  colors: ColorField[];
  visuals: ComponentVisualField[];
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

function previewDocument(parts: CodeParts): string {
  return buildComponentPreview([{ ...parts, label: 'Module préparé' }]);
}

function extractColors(css: string): ColorField[] {
  const matches = css.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g) ?? [];
  return Array.from(new Set(matches)).slice(0, 16).map((value) => ({ origin: value, value }));
}

function replaceAll(source: string, current: string, next: string): string {
  return current === next ? source : source.split(current).join(next);
}

function colorChannels(value: string): Uint8ClampedArray | null {
  if (!CSS.supports('color', value)) return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  return context.getImageData(0, 0, 1, 1).data;
}

function toPickerHex(value: string): string | null {
  const channels = colorChannels(value);
  return channels ? '#' + Array.from(channels.slice(0, 3)).map((v) => v.toString(16).padStart(2, '0')).join('') : null;
}

function pickedColor(current: string, hex: string): string {
  const alpha = colorChannels(current)?.[3] ?? 255;
  return alpha === 255 ? hex : hex + alpha.toString(16).padStart(2, '0');
}

function copySnapshot(snapshot: EditorSnapshot): EditorSnapshot {
  return {
    draft: { ...snapshot.draft },
    texts: snapshot.texts.map((entry) => ({ ...entry })),
    colors: snapshot.colors.map((entry) => ({ ...entry })),
    visuals: snapshot.visuals.map((entry) => ({ ...entry, elementPath: [...entry.elementPath], symbolPath: entry.symbolPath && [...entry.symbolPath], labelPath: entry.labelPath && [...entry.labelPath] })),
    note: snapshot.note,
  };
}

export function ProjectCompositionItemSettings({
  compositionId,
  item,
  pageName,
  onUpdated,
  onMessage,
  docked = false,
  onClose,
  onCollapse,
  onExpand,
  onDraftChange,
}: {
  compositionId: string;
  item: AtoumWebCompositionItem;
  pageName: string;
  onUpdated: (detail: AtoumWebCompositionDetail) => void;
  onMessage: (message: string) => void;
  docked?: boolean;
  onClose?: () => void;
  onCollapse?: () => void;
  onExpand?: () => void;
  onDraftChange?: (draft: CodeParts) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [base, setBase] = useState<CodeParts>({ html: '', css: '', javascript: '' });
  const [draft, setDraft] = useState<CodeParts>({ html: '', css: '', javascript: '' });
  const [texts, setTexts] = useState<ComponentTextField[]>([]);
  const [colors, setColors] = useState<ColorField[]>([]);
  const [visuals, setVisuals] = useState<ComponentVisualField[]>([]);
  const [baseVisuals, setBaseVisuals] = useState<ComponentVisualField[]>([]);
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
      setTexts(extractComponentTexts(effective.html));
      setColors(extractColors(effective.css));
      setBaseVisuals(extractComponentVisuals(source.html));
      setVisuals(extractComponentVisuals(effective.html));
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
      .map((entry) => ({ from: entry.origin, to: entry.value, target: entry.id })),
    colorEdits: colors
      .filter((entry) => entry.origin !== entry.value)
      .map((entry) => ({ from: entry.origin, to: entry.value })),
    visualEdits: visuals.flatMap((entry) => {
      const baseEntry = baseVisuals.find((candidate) => candidate.id === entry.id);
      if (!baseEntry) return [{ target: entry.id, label: entry.label, symbol: entry.symbol, color: entry.color, backgroundColor: entry.backgroundColor, hidden: entry.hidden }];
      const change = {
        target: entry.id,
        ...(entry.label !== baseEntry.label ? { label: entry.label } : {}),
        ...(entry.symbol !== baseEntry.symbol ? { symbol: entry.symbol } : {}),
        ...(entry.color !== baseEntry.color ? { color: entry.color } : {}),
        ...(entry.backgroundColor !== baseEntry.backgroundColor ? { backgroundColor: entry.backgroundColor } : {}),
        ...(entry.hidden !== baseEntry.hidden ? { hidden: entry.hidden } : {}),
      };
      return Object.keys(change).length > 1 ? [change] : [];
    }),
    note: note.trim() || null,
  }), [texts, colors, visuals, baseVisuals, note]);

  const saved = item.hasLocalChanges ? { html: item.localHtml ?? '', css: item.localCss ?? '', javascript: item.localJavascript ?? '' } : base;
  const dirty = draft.html !== saved.html || draft.css !== saved.css || draft.javascript !== saved.javascript
    || note.trim() !== (item.localSettings.note ?? '');

  useEffect(() => {
    if (!loading) onDraftChange?.(draft);
  }, [draft.html, draft.css, draft.javascript, loading]);

  function snapshot(): EditorSnapshot {
    return copySnapshot({ draft, texts, colors, visuals, note });
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
    setVisuals(next.visuals);
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
      onMessage('Changements du bloc validés et enregistrés localement.');
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
      setTexts(extractComponentTexts(base.html));
      setColors(extractColors(base.css));
      setVisuals(extractComponentVisuals(base.html));
      setBaseVisuals(extractComponentVisuals(base.html));
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

  if (loading) return <div className={`project-component-settings-panel ${docked ? 'docked' : ''}`}><p className="muted">Chargement des réglages…</p></div>;

  return <div className={`project-component-settings-panel ${docked ? 'docked' : ''}`}>
    <div className="project-component-settings-toolbar">
      <div>
        <strong>Préparer ce bloc</strong>
        <small>Modifications locales uniquement · source Bibliothèque intacte</small>
      </div>
      <div>
        <button className="secondary-button" type="button" disabled={!undoStack.length || busy} onClick={undo} title="Annuler la dernière modification">↶ Annuler</button>
        <button className="secondary-button" type="button" disabled={!redoStack.length || busy} onClick={redo} title="Rétablir la modification">↷ Rétablir</button>
        <button className="secondary-button" type="button" disabled={busy} onClick={() => void reset()}>⟲ Version Bibliothèque</button>
        <button className="primary-button project-component-validate-button" type="button" disabled={busy || !dirty || !draft.html.trim()} onClick={() => void save()}>
          {dirty ? '✓ Valider les changements' : '✓ Changements validés'}
        </button>
        {onExpand && <button className="secondary-button" type="button" aria-label="Agrandir l’atelier" title="Agrandir l’atelier" onClick={onExpand}>Agrandir</button>}
        {onCollapse && <button className="secondary-button" type="button" aria-label="Réduire Réglages" title="Réduire Réglages" onClick={onCollapse}>←</button>}
        {onClose && <button className="secondary-button" type="button" aria-label="Fermer les réglages" title="Fermer les réglages" onClick={onClose}>×</button>}
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
          {texts.map((entry, index) => <label key={entry.id}>
            Texte {index + 1}
            <input value={entry.value} onChange={(event) => {
              remember();
              const next = event.target.value;
              setDraft((current) => ({ ...current, html: replaceComponentText(current.html, entry.path, next) }));
              setTexts((current) => current.map((candidate, candidateIndex) =>
                candidateIndex === index ? { ...candidate, value: next } : candidate
              ));
            }} />
            <small>{entry.origin}</small>
          </label>)}
        </div>

        <div className="project-component-settings-section project-component-visual-section">
          <div>
            <span className="eyebrow">Éléments visuels</span>
            <p>Icônes et avantages détectés dans ce bloc. Ces réglages restent locaux à cette occurrence.</p>
          </div>
          {visuals.length === 0 && <p className="muted">Aucune icône associée à un texte n’a été détectée automatiquement.</p>}
          <div className="project-component-visual-grid">
            {visuals.map((visual, index) => <fieldset key={visual.id} className="project-component-visual-card">
              <legend>Avantage {index + 1}</legend>
              <label>Texte
                <input value={visual.label} onChange={(event) => {
                  remember();
                  const next = event.target.value;
                  setDraft((current) => ({ ...current, html: updateComponentVisual(current.html, visual, { label: next }) }));
                  setVisuals((current) => current.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, label: next } : candidate));
                  if (visual.labelPath) setTexts((current) => current.map((candidate) =>
                    candidate.path.join('.') === visual.labelPath!.join('.') ? { ...candidate, value: next } : candidate,
                  ));
                }} />
              </label>
              <label>Icône / symbole
                <input value={visual.symbol} disabled={!visual.symbolPath} placeholder={visual.symbolPath ? 'Ex. ✓' : 'Icône CSS ou image'} onChange={(event) => {
                  remember();
                  const next = event.target.value;
                  setDraft((current) => ({ ...current, html: updateComponentVisual(current.html, visual, { symbol: next }) }));
                  setVisuals((current) => current.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, symbol: next } : candidate));
                }} />
              </label>
              <label>Couleur de l’icône
                <input value={visual.color} placeholder="Ex. #d4b170" onChange={(event) => {
                  remember();
                  const next = event.target.value;
                  setDraft((current) => ({ ...current, html: updateComponentVisual(current.html, visual, { color: next }) }));
                  setVisuals((current) => current.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, color: next } : candidate));
                }} />
              </label>
              <label>Fond de l’icône
                <input value={visual.backgroundColor} placeholder="Ex. #fff3c9" onChange={(event) => {
                  remember();
                  const next = event.target.value;
                  setDraft((current) => ({ ...current, html: updateComponentVisual(current.html, visual, { backgroundColor: next }) }));
                  setVisuals((current) => current.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, backgroundColor: next } : candidate));
                }} />
              </label>
              <label className="project-component-visual-toggle">
                <input type="checkbox" checked={visual.hidden} onChange={(event) => {
                  remember();
                  const next = event.target.checked;
                  setDraft((current) => ({ ...current, html: updateComponentVisual(current.html, visual, { hidden: next }) }));
                  setVisuals((current) => current.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, hidden: next } : candidate));
                }} /> Masquer l’icône
              </label>
            </fieldset>)}
          </div>
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
                      const next = pickedColor(entry.value, event.target.value);
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
            const html = event.target.value;
            setDraft((current) => ({ ...current, html }));
            setTexts(extractComponentTexts(html));
            setVisuals(extractComponentVisuals(html));
          }} /></label>
          <label>CSS<textarea rows={9} value={draft.css} onChange={(event) => {
            remember();
            const css = event.target.value;
            setDraft((current) => ({ ...current, css }));
            setColors(extractColors(css));
          }} /></label>
          <label>JavaScript<textarea rows={5} value={draft.javascript} onChange={(event) => {
            remember();
            setDraft((current) => ({ ...current, javascript: event.target.value }));
          }} /></label>
        </details>

        <div className="project-component-settings-actions">
          <button className="primary-button" type="button" disabled={busy || !dirty || !draft.html.trim()} onClick={() => void save()}>
            {dirty ? '✓ Valider les changements' : '✓ Changements validés'}
          </button>
          <button className="secondary-button" type="button" onClick={() => setModulePreviewOpen(true)}>Voir le module seul</button>
        </div>

        <div className="project-component-promotion">
          <div>
            <span className="eyebrow">Capitaliser</span>
            <strong>Envoyer cette adaptation comme variante</strong>
            <p>La nouvelle variante sera créée en « À adapter / valider », jamais directement prête.</p>
          </div>
          <input value={variantName} onChange={(event) => setVariantName(event.target.value)} />
          <button className="secondary-button" type="button" disabled={busy || dirty || !item.hasLocalChanges || !variantName.trim()} onClick={() => void promote()}>
            {dirty ? 'Enregistrer les réglages avant de promouvoir' : 'Envoyer vers la Bibliothèque'}
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
