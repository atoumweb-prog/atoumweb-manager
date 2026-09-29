import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ProjectNode } from '../../shared/projects';
import type {
  AtoumWebCompositionDetail,
  AtoumWebCompositionItem,
  AtoumWebCompositionSummary,
  AtoumWebLibraryCategory,
  AtoumWebTechnicalItemDetail,
  AtoumWebTechnicalItemSummary,
  AtoumWebTechnicalVersion,
} from '../../shared/referentials';
import { ProjectCompositionItemSettings } from './ProjectCompositionItemSettings';
import './ProjectPageCompositionPanel.css';
import { buildComponentPreview } from './componentPreview';

type PanelMode = null | 'library' | 'create' | 'attach' | 'inspect' | 'preview';
type CreateMode = 'new' | 'variant';
type CodeInputMode = 'complete' | 'separated';
type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

const VISUAL_CATEGORIES: Array<{ id: AtoumWebLibraryCategory; label: string }> = [
  { id: 'hero', label: 'Hero' },
  { id: 'section', label: 'Section' },
  { id: 'header', label: 'Header' },
  { id: 'footer', label: 'Footer' },
  { id: 'form', label: 'Formulaire' },
  { id: 'gallery', label: 'Galerie' },
  { id: 'carousel', label: 'Carrousel' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'divi', label: 'Module Divi' },
];

interface PreviewParts {
  html: string;
  css: string;
  javascript: string;
  previewable: boolean;
  raw: string;
}

interface CreateForm {
  mode: CreateMode;
  name: string;
  category: AtoumWebLibraryCategory;
  sourceItemId: string;
  vertical: string;
  description: string;
  html: string;
  css: string;
  javascript: string;
}

const EMPTY_FORM: CreateForm = {
  mode: 'new',
  name: '',
  category: 'section',
  sourceItemId: '',
  vertical: '',
  description: '',
  html: '',
  css: '',
  javascript: '',
};

function parseParts(version?: AtoumWebTechnicalVersion | null): PreviewParts {
  if (!version?.contentText) return { html: '', css: '', javascript: '', previewable: false, raw: '' };
  const raw = version.contentText;
  const language = (version.language ?? '').toLowerCase();
  if (version.contentType === 'code' && (language === 'html' || language === 'htm')) {
    return { html: raw, css: '', javascript: '', previewable: true, raw };
  }
  if (version.contentType !== 'json') {
    return { html: '', css: '', javascript: '', previewable: false, raw };
  }
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    const reusable = value.reusable && typeof value.reusable === 'object' && !Array.isArray(value.reusable)
      ? value.reusable as Record<string, unknown>
      : null;
    if (reusable) {
      return {
        html: typeof reusable.html === 'string' ? reusable.html : '',
        css: typeof reusable.css === 'string' ? reusable.css : '',
        javascript: typeof reusable.javascript === 'string' ? reusable.javascript : '',
        previewable: typeof reusable.html === 'string' && Boolean(reusable.html.trim()),
        raw,
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
        previewable: typeof work.html === 'string' && Boolean(work.html.trim()),
        raw,
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
        previewable: typeof original.html === 'string' && Boolean(original.html.trim()),
        raw,
      };
    }
  } catch {
    // Le contenu brut reste visible dans l'inspecteur.
  }
  return { html: '', css: '', javascript: '', previewable: false, raw };
}

function effectiveParts(item: AtoumWebCompositionItem, source: PreviewParts): PreviewParts {
  if (!item.hasLocalChanges || !item.localHtml) return source;
  return {
    html: item.localHtml,
    css: item.localCss ?? '',
    javascript: item.localJavascript ?? '',
    previewable: Boolean(item.localHtml.trim()),
    raw: source.raw,
  };
}

function buildPreviewDocument(parts: PreviewParts, label: string): string {
  return buildComponentPreview([{ html: parts.previewable ? parts.html : '<p>Aperçu visuel indisponible.</p>', css: parts.css, label }]);
}

function splitCompleteCode(value: string): { html: string; css: string; javascript: string } {
  let source = value.trim()
    .replace(/^\`\`\`(?:html|javascript|js|css)?\s*/i, '')
    .replace(/\s*\`\`\`$/i, '');
  const css: string[] = [];
  const javascript: string[] = [];
  source = source.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_match, content: string) => {
    css.push(content.trim());
    return '';
  });
  source = source.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (_match, content: string) => {
    javascript.push(content.trim());
    return '';
  });
  return {
    html: source.trim(),
    css: css.filter(Boolean).join('\n\n'),
    javascript: javascript.filter(Boolean).join('\n\n'),
  };
}

function effectiveReady(item: AtoumWebTechnicalItemSummary): boolean {
  if (item.reuseStatus !== 'ready' || item.archivedAt) return false;
  const tags = new Set(item.tags ?? []);
  const content = item.currentVersion?.contentText ?? '';
  const bridgeReusable = tags.has('bridge') || content.includes('atoumweb-library-reusable-component');
  return !bridgeReusable || tags.has('bridge-human-validated') || tags.has('manager-direct');
}

export function ProjectPageCompositionPanel({
  page,
  onMessage,
  inspectorHostId,
  onInspectorOpenChange,
}: {
  page: ProjectNode;
  onMessage: (message: string) => void;
  inspectorHostId?: string;
  onInspectorOpenChange?: (open: boolean) => void;
}) {
  const [composition, setComposition] = useState<AtoumWebCompositionDetail | null>(null);
  const [allCompositions, setAllCompositions] = useState<AtoumWebCompositionSummary[]>([]);
  const [library, setLibrary] = useState<AtoumWebTechnicalItemSummary[]>([]);
  const [mode, setMode] = useState<PanelMode>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [attachId, setAttachId] = useState('');
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_FORM);
  const [codeInputMode, setCodeInputMode] = useState<CodeInputMode>('complete');
  const [fullCode, setFullCode] = useState('');
  const [inspected, setInspected] = useState<{ item: AtoumWebCompositionItem; detail: AtoumWebTechnicalItemDetail; parts: PreviewParts } | null>(null);
  const [previewDoc, setPreviewDoc] = useState('');
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [inspectionMode, setInspectionMode] = useState(false);
  const [settingsItemId, setSettingsItemId] = useState<string | null>(null);
  const [inspectExpanded, setInspectExpanded] = useState(false);
  const [inspectDevice, setInspectDevice] = useState<PreviewDevice>('desktop');

  async function reload(): Promise<void> {
    const [nextComposition, nextCompositions, nextLibrary] = await Promise.all([
      window.atoumweb.referentials.compositions.getForProjectPage(page.id),
      window.atoumweb.referentials.compositions.list(false),
      window.atoumweb.referentials.library.list({ includeArchived: false }),
    ]);
    setComposition(nextComposition);
    setAllCompositions(nextCompositions);
    setLibrary(nextLibrary);
  }

  useEffect(() => {
    setMode(null);
    setInspected(null);
    setInspectExpanded(false);
    setInspectDevice('desktop');
    setPreviewDoc('');
    onInspectorOpenChange?.(false);
    void reload().catch((error) =>
      onMessage(error instanceof Error ? error.message : 'Impossible de charger la composition de la Page.'),
    );
  }, [page.id]);

  useEffect(() => {
    onInspectorOpenChange?.(Boolean(inspected));
  }, [inspected?.item.id]);

  const visualLibrary = useMemo(() => library.filter((item) =>
    ['header','footer','hero','page','section','form','gallery','carousel','navigation','divi'].includes(item.category)
  ), [library]);
  const readyLibrary = useMemo(() => visualLibrary.filter(effectiveReady), [visualLibrary]);
  const filteredLibrary = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('fr-FR');
    if (!needle) return visualLibrary;
    return visualLibrary.filter((item) => [
      item.name,
      item.category,
      item.vertical ?? '',
      item.familyDisplayName ?? '',
      item.variantKey ?? '',
      ...(item.tags ?? []),
    ].join(' ').toLocaleLowerCase('fr-FR').includes(needle));
  }, [visualLibrary, search]);

  async function withBusy(action: () => Promise<void>): Promise<void> {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Opération impossible sur la composition.');
    } finally {
      setBusy(false);
    }
  }

  async function ensureComposition(): Promise<AtoumWebCompositionDetail> {
    if (composition) return composition;
    const created = await window.atoumweb.referentials.compositions.ensureForProjectPage(page.id);
    setComposition(created);
    return created;
  }

  async function addLibraryItem(itemId: string): Promise<void> {
    await withBusy(async () => {
      const target = await ensureComposition();
      const next = await window.atoumweb.referentials.compositions.addItem(target.id, { libraryItemId: itemId });
      setComposition(next);
      setMode(null);
      onMessage('Composant ajouté à la Page.');
      await reload();
    });
  }

  async function move(item: AtoumWebCompositionItem, delta: number): Promise<void> {
    if (!composition) return;
    const nextIndex = Math.max(0, Math.min(composition.items.length - 1, item.sortOrder + delta));
    if (nextIndex === item.sortOrder) return;
    await withBusy(async () => {
      const next = await window.atoumweb.referentials.compositions.moveItem(composition.id, item.id, { targetIndex: nextIndex });
      setComposition(next);
    });
  }

  async function remove(item: AtoumWebCompositionItem): Promise<void> {
    if (!composition) return;
    await withBusy(async () => {
      const next = await window.atoumweb.referentials.compositions.removeItem(composition.id, item.id);
      setComposition(next);
      onMessage('Composant retiré de la Page. La Bibliothèque source reste intacte.');
    });
  }

  async function inspect(item: AtoumWebCompositionItem): Promise<void> {
    if (inspected?.item.id === item.id) {
      setInspected(null);
      setInspectExpanded(false);
      return;
    }
    await withBusy(async () => {
      const detail = await window.atoumweb.referentials.library.get(item.sourceItemId);
      const version = detail.versions.find((candidate) => candidate.id === item.sourceVersionId) ?? null;
      const sourceParts = parseParts(version);
      setInspected({ item, detail, parts: effectiveParts(item, sourceParts) });
      setInspectDevice('desktop');
      setInspectExpanded(false);
      setMode(null);
    });
  }

  async function attachExisting(): Promise<void> {
    if (!attachId) return;
    await withBusy(async () => {
      const next = await window.atoumweb.referentials.compositions.attachToProjectPage(page.id, attachId);
      setComposition(next);
      setMode(null);
      setAttachId('');
      onMessage('Composition existante rattachée à la Page.');
      await reload();
    });
  }

  function analyzeFullCode(): void {
    const parsed = splitCompleteCode(fullCode);
    if (!parsed.html) {
      onMessage('Aucun HTML détecté dans le code complet.');
      return;
    }
    setCreateForm((value) => ({
      ...value,
      html: parsed.html,
      css: parsed.css,
      javascript: parsed.javascript,
    }));
    setCodeInputMode('separated');
    onMessage(`Code analysé : HTML${parsed.css ? ' + CSS' : ''}${parsed.javascript ? ' + JavaScript' : ''}.`);
  }

    async function createAndAdd(): Promise<void> {
    if (!createForm.name.trim() || !createForm.html.trim()) {
      onMessage('Nom et HTML sont requis.');
      return;
    }
    await withBusy(async () => {
      const created = createForm.mode === 'variant'
        ? await window.atoumweb.referentials.library.createVariantCode({
            sourceItemId: createForm.sourceItemId,
            name: createForm.name.trim(),
            vertical: createForm.vertical.trim() || null,
            description: createForm.description.trim() || null,
            html: createForm.html,
            css: createForm.css || null,
            javascript: createForm.javascript || null,
          })
        : await window.atoumweb.referentials.library.createReusableCode({
            name: createForm.name.trim(),
            category: createForm.category,
            vertical: createForm.vertical.trim() || null,
            description: createForm.description.trim() || null,
            html: createForm.html,
            css: createForm.css || null,
            javascript: createForm.javascript || null,
          });

      const target = await ensureComposition();
      const next = await window.atoumweb.referentials.compositions.addItem(target.id, { libraryItemId: created.id });
      setComposition(next);
      setCreateForm(EMPTY_FORM);
      setFullCode('');
      setCodeInputMode('complete');
      setMode(null);
      onMessage(createForm.mode === 'variant' ? 'Déclinaison créée et ajoutée à la Page.' : 'Composant créé et ajouté à la Page.');
      await reload();
    });
  }

  async function buildPagePreview(inspect = inspectionMode): Promise<void> {
    if (!composition || composition.items.length === 0) return;
    await withBusy(async () => {
      const details = await Promise.all(composition.items.map((item) => window.atoumweb.referentials.library.get(item.sourceItemId)));
      const rendered = composition.items.map((item, index) => {
        const detail = details[index];
        const version = detail.versions.find((candidate) => candidate.id === item.sourceVersionId) ?? null;
        const sourceParts = parseParts(version);
        const parts = effectiveParts(item, sourceParts);
        return { item, parts };
      });
      setPreviewDoc(buildComponentPreview(rendered.map(({item, parts}) => ({
        label: item.displayName,
        html: parts.previewable ? parts.html : '<p>Aperçu indisponible.</p>',
        css: parts.css,
      })), inspect));
      setMode('preview');
    });
  }

  const createPreview = buildPreviewDocument({
    html: createForm.html,
    css: createForm.css,
    javascript: createForm.javascript,
    previewable: Boolean(createForm.html.trim()),
    raw: createForm.html,
  }, createForm.name || 'Nouveau composant');

  const availableHistorical = allCompositions.filter((candidate) => candidate.id !== composition?.id && candidate.status !== 'archived');
  const deviceWidth = previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? '768px' : '390px';
  const inspectWidth = inspectDevice === 'desktop' ? '100%' : inspectDevice === 'tablet' ? '768px' : '390px';
  const inspectorHost = inspectorHostId && typeof document !== 'undefined'
    ? document.getElementById(inspectorHostId)
    : null;

  return <section className="project-page-composition">
    <header className="project-page-composition-head">
      <div>
        <span className="eyebrow">Composants AtoumWeb</span>
        <h3>{composition ? `${composition.items.length} composant${composition.items.length > 1 ? 's' : ''}` : 'Composition facultative'}</h3>
        <p>Ajoute uniquement ce que tu veux préparer depuis Manager. Le reste de la Page pourra être construit librement dans Divi.</p>
      </div>
      <div className="project-page-composition-actions">
        {composition?.items.length ? <button className="secondary-button" type="button" onClick={() => void buildPagePreview()}>Aperçu de la Page</button> : null}
        <button className="secondary-button" type="button" onClick={() => setMode(mode === 'library' ? null : 'library')}>+ Bibliothèque</button>
        <button className="primary-button" type="button" onClick={() => setMode(mode === 'create' ? null : 'create')}>+ Créer un composant</button>
      </div>
    </header>

    <div className="project-page-composition-workspace">
      <div className="project-page-composition-primary">
      {!composition && <div className="project-page-composition-empty">
        <strong>Aucun composant Manager pour cette Page.</strong>
        <span>C’est valide : tu peux construire entièrement cette Page dans Divi.</span>
        {availableHistorical.length > 0 && <button className="link-button" type="button" onClick={() => setMode('attach')}>Rattacher une composition existante</button>}
      </div>}
  
      {composition && <div className="project-page-composition-list">
        {composition.items.map((item, index) => {
          const occurrence = composition.items
            .slice(0, index + 1)
            .filter((candidate) => candidate.sourceItemId === item.sourceItemId).length;
          const totalSameSource = composition.items.filter((candidate) => candidate.sourceItemId === item.sourceItemId).length;
          return <div className="project-page-composition-item-wrap" key={item.id}>
            <article>
              <span className="project-page-composition-order">{index + 1}</span>
              <div className="project-page-composition-main">
                <strong>{item.displayName}{totalSameSource > 1 ? ` · occurrence ${occurrence}` : ''}</strong>
                <small>
                  {item.category} · v{item.sourceVersionNumber}{item.variantKey ? ` · ${item.variantKey}` : ''}
                  {item.hasLocalChanges ? ' · préparé localement' : ''}
                </small>
              </div>
              <div className="project-page-composition-row-actions">
                <button type="button" disabled={busy || index === 0} onClick={() => void move(item, -1)} title="Monter">↑</button>
                <button type="button" disabled={busy || index === composition.items.length - 1} onClick={() => void move(item, 1)} title="Descendre">↓</button>
                <button
                  type="button"
                  className={settingsItemId === item.id ? 'active' : ''}
                  disabled={busy}
                  onClick={() => setSettingsItemId((current) => current === item.id ? null : item.id)}
                >Réglages {settingsItemId === item.id ? '▴' : '▾'}</button>
                <button type="button" className={inspected?.item.id === item.id ? 'active' : ''} disabled={busy} onClick={() => void inspect(item)}>
                  {inspected?.item.id === item.id ? 'Fermer aperçu' : 'Code / aperçu'}
                </button>
                <button type="button" disabled={busy} onClick={() => void remove(item)}>Retirer</button>
              </div>
            </article>
            {settingsItemId === item.id && <ProjectCompositionItemSettings
              compositionId={composition.id}
              item={item}
              pageName={page.name}
              onUpdated={(updated) => setComposition(updated)}
              onMessage={onMessage}
            />}
          </div>;
        })}
        {composition.items.length === 0 && <p className="muted">Composition créée, mais encore vide.</p>}
      </div>}
  
      {mode === 'attach' && <div className="project-page-composition-inline-panel">
        <div><strong>Rattacher une composition existante</strong><span>Les compositions historiques ne sont jamais devinées à partir de leur nom.</span></div>
        <select value={attachId} onChange={(event) => setAttachId(event.target.value)}>
          <option value="">Choisir…</option>
          {availableHistorical.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.itemCount} composant(s)</option>)}
        </select>
        <button className="primary-button" type="button" disabled={!attachId || busy} onClick={() => void attachExisting()}>Rattacher</button>
      </div>}
  
        </div>

    </div>

    {inspected && inspectorHost && createPortal(
      <div className="project-page-inspector-dock">
        <header>
          <div>
            <span className="eyebrow">Code / aperçu</span>
            <strong>{inspected.item.displayName}</strong>
            <small>Source figée · v{inspected.item.sourceVersionNumber}</small>
          </div>
          <div>
            <button className="secondary-button" type="button" onClick={() => setInspectExpanded(true)}>Agrandir</button>
            <button className="secondary-button" type="button" aria-label="Fermer le volet Code / aperçu" onClick={() => setInspected(null)}>×</button>
          </div>
        </header>
        <div className="project-page-preview-controls project-page-inspector-device-controls">
          <button type="button" className={inspectDevice === 'desktop' ? 'active' : ''} onClick={() => setInspectDevice('desktop')}>Desktop</button>
          <button type="button" className={inspectDevice === 'tablet' ? 'active' : ''} onClick={() => setInspectDevice('tablet')}>Tablette</button>
          <button type="button" className={inspectDevice === 'mobile' ? 'active' : ''} onClick={() => setInspectDevice('mobile')}>Mobile</button>
        </div>
        <div className="project-page-inspector-dock-preview">
          <div style={{ width: inspectWidth }}>
            <iframe title={`Aperçu direct ${inspected.item.displayName}`} sandbox="" srcDoc={buildPreviewDocument(inspected.parts, inspected.item.displayName)} />
          </div>
        </div>
        <div className="project-page-code-tabs project-page-inspector-dock-code">
          <details open><summary>HTML</summary><pre>{inspected.parts.html || '—'}</pre></details>
          <details><summary>CSS</summary><pre>{inspected.parts.css || '—'}</pre></details>
          <details><summary>JavaScript</summary><pre>{inspected.parts.javascript || '—'}</pre></details>
          {!inspected.parts.previewable && <details><summary>Contenu brut</summary><pre>{inspected.parts.raw || '—'}</pre></details>}
        </div>
      </div>,
      inspectorHost,
    )}

    {mode === 'library' && <div className="project-page-composition-modal library-modal" role="dialog" aria-modal="true">
      <div className="project-page-composition-modal-backdrop" onClick={() => setMode(null)} />
      <div className="project-page-composition-modal-panel">
        <header>
          <div>
            <span className="eyebrow">Bibliothèque AtoumWeb</span>
            <h3>Ajouter un composant</h3>
            <p>{readyLibrary.length} prêt(s) à ajouter · {visualLibrary.length} élément(s) visuel(s) dans la Bibliothèque</p>
          </div>
          <button className="secondary-button" type="button" onClick={() => setMode(null)}>Fermer</button>
        </header>
        <div className="project-page-library-modal-body">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un Hero, une section, une variante…" />
          <div className="project-page-library-grid">
            {filteredLibrary.map((item) => {
              const ready = effectiveReady(item);
              return <div key={item.id} className={ready ? 'project-page-library-card ready' : 'project-page-library-card not-ready'}>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.category}{item.familyDisplayName ? ` · ${item.familyDisplayName}` : ''}{item.variantKey ? ` · ${item.variantKey}` : ''}</small>
                  {!ready && <small>Statut : {item.reuseStatus === 'adapt' ? 'À adapter / valider' : 'Référence'}</small>}
                </span>
                <button type="button" disabled={!ready || busy} onClick={() => void addLibraryItem(item.id)}>
                  {ready ? 'Ajouter' : 'À valider'}
                </button>
              </div>;
            })}
            {filteredLibrary.length === 0 && <p className="muted">Aucun composant correspondant.</p>}
          </div>
        </div>
      </div>
    </div>}

    {mode === 'create' && <div className="project-page-composition-modal create-modal" role="dialog" aria-modal="true">
      <div className="project-page-composition-modal-backdrop" onClick={() => setMode(null)} />
      <div className="project-page-composition-modal-panel">
        <header>
          <div><span className="eyebrow">Création directe</span><h3>Nouveau composant / déclinaison</h3><p>Colle un code complet ou travaille champ par champ.</p></div>
          <button className="secondary-button" type="button" onClick={() => setMode(null)}>Fermer</button>
        </header>
        <div className="project-page-component-editor-body">
          <div className="project-page-component-editor-grid">
            <div className="project-page-component-form">
              <div className="project-page-component-mode">
                <button type="button" className={createForm.mode === 'new' ? 'active' : ''} onClick={() => {
                  setCreateForm({ ...EMPTY_FORM, mode: 'new' }); setFullCode(''); setCodeInputMode('complete');
                }}>Nouvel élément</button>
                <button type="button" className={createForm.mode === 'variant' ? 'active' : ''} onClick={() => {
                  setCreateForm({ ...EMPTY_FORM, mode: 'variant' }); setFullCode(''); setCodeInputMode('complete');
                }}>Déclinaison d’un modèle</button>
              </div>
              {createForm.mode === 'variant' && <label>Modèle source
                <select value={createForm.sourceItemId} onChange={(event) => {
                  const source = library.find((item) => item.id === event.target.value);
                  setCreateForm((value) => ({
                    ...value,
                    sourceItemId: event.target.value,
                    category: source?.category ?? value.category,
                    vertical: source?.vertical ?? value.vertical,
                  }));
                }}>
                  <option value="">Choisir le modèle…</option>
                  {readyLibrary.map((item) => <option key={item.id} value={item.id}>{item.name}{item.variantKey ? ` · ${item.variantKey}` : ''}</option>)}
                </select>
              </label>}
              <div className="project-page-component-form-grid">
                <label>Nom<input value={createForm.name} onChange={(event) => setCreateForm((value) => ({ ...value, name: event.target.value }))} placeholder={createForm.mode === 'variant' ? 'Ex. Fleuriste' : 'Ex. Hero Fleuriste'} /></label>
                {createForm.mode === 'new' && <label>Type<select value={createForm.category} onChange={(event) => setCreateForm((value) => ({ ...value, category: event.target.value as AtoumWebLibraryCategory }))}>{VISUAL_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>}
                <label>Métier<input value={createForm.vertical} onChange={(event) => setCreateForm((value) => ({ ...value, vertical: event.target.value }))} placeholder="Ex. fleuriste" /></label>
              </div>
              <label>Description<textarea rows={2} value={createForm.description} onChange={(event) => setCreateForm((value) => ({ ...value, description: event.target.value }))} /></label>

              <div className="project-page-code-mode">
                <button type="button" className={codeInputMode === 'complete' ? 'active' : ''} onClick={() => setCodeInputMode('complete')}>Code complet</button>
                <button type="button" className={codeInputMode === 'separated' ? 'active' : ''} onClick={() => setCodeInputMode('separated')}>HTML / CSS / JS séparés</button>
              </div>

              {codeInputMode === 'complete' ? <>
                <label>Code complet
                  <textarea rows={22} value={fullCode} onChange={(event) => setFullCode(event.target.value)} placeholder={"<style>…</style>\n<section>…</section>\n<script>…</script>"} />
                </label>
                <button className="secondary-button" type="button" disabled={!fullCode.trim()} onClick={analyzeFullCode}>Analyser et répartir le code</button>
              </> : <>
                <label>HTML<textarea rows={10} value={createForm.html} onChange={(event) => setCreateForm((value) => ({ ...value, html: event.target.value }))} placeholder="<section>…</section>" /></label>
                <label>CSS<textarea rows={8} value={createForm.css} onChange={(event) => setCreateForm((value) => ({ ...value, css: event.target.value }))} placeholder=".hero { … }" /></label>
                <label>JavaScript <span>facultatif · non exécuté dans l’aperçu</span><textarea rows={5} value={createForm.javascript} onChange={(event) => setCreateForm((value) => ({ ...value, javascript: event.target.value }))} /></label>
              </>}

              <button className="primary-button" type="button" disabled={busy || !createForm.name.trim() || !createForm.html.trim() || (createForm.mode === 'variant' && !createForm.sourceItemId)} onClick={() => void createAndAdd()}>
                {createForm.mode === 'variant' ? 'Créer la déclinaison et l’ajouter' : 'Créer le composant et l’ajouter'}
              </button>
            </div>
            <div className="project-page-component-live-preview">
              <strong>Aperçu</strong>
              <iframe title="Aperçu du nouveau composant" sandbox="" srcDoc={createPreview} />
            </div>
          </div>
        </div>
      </div>
    </div>}

    {inspectExpanded && inspected && <div className="project-page-composition-modal" role="dialog" aria-modal="true">
      <div className="project-page-composition-modal-backdrop" onClick={() => setInspectExpanded(false)} />
      <div className="project-page-composition-modal-panel">
        <header>
          <div><span className="eyebrow">Composant {inspected.item.sortOrder + 1}</span><h3>{inspected.item.displayName}</h3><p>Version source figée : v{inspected.item.sourceVersionNumber}</p></div>
          <div className="project-page-preview-controls">
            <button type="button" className={inspectDevice === 'desktop' ? 'active' : ''} onClick={() => setInspectDevice('desktop')}>Desktop</button>
            <button type="button" className={inspectDevice === 'tablet' ? 'active' : ''} onClick={() => setInspectDevice('tablet')}>Tablette</button>
            <button type="button" className={inspectDevice === 'mobile' ? 'active' : ''} onClick={() => setInspectDevice('mobile')}>Mobile</button>
            <button className="secondary-button" type="button" onClick={() => setInspectExpanded(false)}>Fermer</button>
          </div>
        </header>
        <div className="project-page-inspector-grid">
          <div className="project-page-inspector-preview-large">
            <div style={{ width: inspectWidth }}>
              <iframe title={`Aperçu ${inspected.item.displayName}`} sandbox="" srcDoc={buildPreviewDocument(inspected.parts, inspected.item.displayName)} />
            </div>
          </div>
          <div className="project-page-code-tabs">
            <details open><summary>HTML</summary><pre>{inspected.parts.html || '—'}</pre></details>
            <details><summary>CSS</summary><pre>{inspected.parts.css || '—'}</pre></details>
            <details><summary>JavaScript</summary><pre>{inspected.parts.javascript || '—'}</pre></details>
            {!inspected.parts.previewable && <details><summary>Contenu brut</summary><pre>{inspected.parts.raw || '—'}</pre></details>}
          </div>
        </div>
      </div>
    </div>}

    {mode === 'preview' && previewDoc && <div className="project-page-composition-modal page-preview" role="dialog" aria-modal="true">
      <div className="project-page-composition-modal-backdrop" onClick={() => setMode(null)} />
      <div className="project-page-composition-modal-panel">
        <header>
          <div><span className="eyebrow">Composition préparée par Manager</span><h3>{page.name} — aperçu global</h3><p>Ce rendu n’inclut pas les modules Divi natifs ajoutés plus tard.</p></div>
          <div className="project-page-preview-controls">
            <button type="button" className={previewDevice === 'desktop' ? 'active' : ''} onClick={() => setPreviewDevice('desktop')}>Desktop</button>
            <button type="button" className={previewDevice === 'tablet' ? 'active' : ''} onClick={() => setPreviewDevice('tablet')}>Tablette</button>
            <button type="button" className={previewDevice === 'mobile' ? 'active' : ''} onClick={() => setPreviewDevice('mobile')}>Mobile</button>
            <label><input type="checkbox" checked={inspectionMode} onChange={(event) => {
              const next = event.target.checked;
              setInspectionMode(next);
              void buildPagePreview(next);
            }} /> Inspection</label>
            <button className="secondary-button" type="button" onClick={() => setMode(null)}>Fermer</button>
          </div>
        </header>
        <div className="project-page-global-preview">
          <div style={{ width: deviceWidth }}><iframe key={`${page.id}-${previewDevice}-${inspectionMode}-${previewDoc.length}`} title={`Aperçu global ${page.name}`} sandbox="" srcDoc={previewDoc} /></div>
        </div>
      </div>
    </div>}
  </section>;
}
