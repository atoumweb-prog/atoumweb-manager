import { useMemo, useState } from 'react';
import type {
  ProjectTechnicalCategory,
  ProjectTechnicalContentType,
  ProjectTechnicalItemDetail,
  ProjectTechnicalVersion,
} from '../../shared/projects';
import type {
  AtoumWebLibraryCategory,
  AtoumWebReuseStatus,
  ReusePreparationResult,
} from '../../shared/referentials';

const CATEGORY_MAP: Record<ProjectTechnicalCategory, AtoumWebLibraryCategory> = {
  header: 'header',
  footer: 'footer',
  hero: 'hero',
  page: 'page',
  section: 'section',
  css: 'css',
  javascript: 'javascript',
  php: 'php',
  acf: 'acf',
  divi: 'divi',
  woocommerce: 'woocommerce',
  plugin: 'app',
  config: 'note',
  note: 'note',
  other: 'note',
};

const CATEGORY_LABELS: Record<AtoumWebLibraryCategory, string> = {
  header: 'Header', footer: 'Footer', hero: 'Hero', page: 'Page', section: 'Section', form: 'Formulaire',
  gallery: 'Galerie', carousel: 'Carrousel', navigation: 'Navigation', css: 'CSS', javascript: 'JavaScript',
  php: 'PHP', woocommerce: 'WooCommerce', acf: 'ACF', divi: 'Divi', app: 'App / Extension', note: 'Note',
};

const REUSE_LABELS: Record<AtoumWebReuseStatus, string> = {
  ready: 'Prêt à réutiliser', adapt: 'À adapter', reference: 'Référence',
};

export function ProjectReusePreparationPanel({ detail, onClose, onMessage, onPromoted }: {
  detail: ProjectTechnicalItemDetail;
  onClose: () => void;
  onMessage: (message: string) => void;
  onPromoted: () => Promise<void>;
}) {
  const defaultVersion = detail.stableVersion ?? detail.currentVersion ?? detail.versions[0];
  const [versionId, setVersionId] = useState(defaultVersion?.id ?? '');
  const [adaptationNotes, setAdaptationNotes] = useState('');
  const [preparation, setPreparation] = useState<ReusePreparationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const selectedVersion = useMemo(
    () => detail.versions.find((version) => version.id === versionId) ?? defaultVersion,
    [detail.versions, versionId, defaultVersion],
  );

  const [globalName, setGlobalName] = useState(`${detail.name} — générique`);
  const [globalCategory, setGlobalCategory] = useState<AtoumWebLibraryCategory>(CATEGORY_MAP[detail.category]);
  const [globalStatus, setGlobalStatus] = useState<AtoumWebReuseStatus>('adapt');
  const [globalDescription, setGlobalDescription] = useState(detail.description ?? '');
  const [globalTags, setGlobalTags] = useState((detail.tags ?? []).join(', '));
  const [contentType, setContentType] = useState<ProjectTechnicalContentType>(defaultVersion?.contentType ?? 'text');
  const [language, setLanguage] = useState(defaultVersion?.language ?? '');
  const [contentText, setContentText] = useState(defaultVersion?.contentText ?? '');
  const [versionNotes, setVersionNotes] = useState(defaultVersion?.notes ?? '');

  function chooseVersion(nextId: string): void {
    setVersionId(nextId);
    setPreparation(null);
    const version = detail.versions.find((candidate) => candidate.id === nextId);
    if (!version) return;
    setContentType(version.contentType);
    setLanguage(version.language ?? '');
    setContentText(version.contentText ?? '');
    setVersionNotes(version.notes ?? '');
  }

  async function prepare(): Promise<void> {
    if (!versionId) return;
    setBusy(true);
    try {
      const result = await window.atoumweb.referentials.reuse.prepareProjectItem({
        itemId: detail.id,
        versionId,
        adaptationNotes: adaptationNotes.trim() || null,
      });
      setPreparation(result);
      onMessage(`Paquet indépendant préparé depuis « ${detail.name} » v${result.versionNumber}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Préparation pour réutilisation impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function openPackage(): Promise<void> {
    if (!preparation) return;
    const result = await window.atoumweb.referentials.reuse.openPackage(preparation.packageDirectory);
    if (!result.ok) onMessage(result.error ?? 'Impossible d’ouvrir le paquet de réutilisation.');
  }

  async function createGlobal(): Promise<void> {
    if (!preparation || !selectedVersion) return;
    setBusy(true);
    try {
      const created = await window.atoumweb.referentials.reuse.createGlobal({
        preparation,
        item: {
          name: globalName.trim(),
          category: globalCategory,
          reuseStatus: globalStatus,
          description: globalDescription.trim() || null,
          tags: globalTags.split(',').map((tag) => tag.trim()).filter(Boolean),
        },
        version: {
          contentType,
          language: language.trim() || null,
          contentText: contentType === 'reference' ? null : contentText,
          notes: versionNotes.trim() || null,
        },
      });
      onMessage(`Composant « ${created.name} » créé volontairement dans la Bibliothèque AtoumWeb avec traçabilité vers le projet source.`);
      await onPromoted();
      onClose();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Création du composant AtoumWeb impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="reuse-preparation-panel">
      <div className="reuse-preparation-heading">
        <div><span className="eyebrow">Phase 6 · Adaptation assistée</span><h3>Préparer pour réutilisation</h3></div>
        <button type="button" className="secondary-button" onClick={onClose}>Fermer</button>
      </div>
      <p className="technical-safety-note">Cette action crée une copie de travail indépendante. AtoumWeb Manager ne réécrit jamais automatiquement les classes, champs ACF, couleurs, URLs, textes ou règles métier du client.</p>

      <div className="technical-editor-grid">
        <label>Version projet source<select value={versionId} onChange={(event) => chooseVersion(event.target.value)}>{detail.versions.map((version) => <option key={version.id} value={version.id}>v{version.versionNumber}{version.stable ? ' · stable' : ''}{version.current ? ' · courante' : ''}</option>)}</select></label>
        <label>État cible<select value={globalStatus} onChange={(event) => setGlobalStatus(event.target.value as AtoumWebReuseStatus)}>{(Object.keys(REUSE_LABELS) as AtoumWebReuseStatus[]).map((status) => <option key={status} value={status}>{REUSE_LABELS[status]}</option>)}</select></label>
      </div>
      <label className="reuse-wide-field">Notes d’adaptation<textarea rows={4} value={adaptationNotes} onChange={(event) => setAdaptationNotes(event.target.value)} placeholder="Ex. remplacer les champs ACF Cazor, retirer les couleurs client, rendre le CPT configurable…" /></label>
      <div className="button-row"><button className="primary-button" type="button" disabled={busy || !versionId} onClick={() => void prepare()}>{busy ? 'Préparation…' : preparation ? 'Recréer le paquet' : 'Créer le paquet de travail'}</button>{preparation && <button className="secondary-button" type="button" onClick={() => void openPackage()}>Ouvrir le paquet</button>}</div>

      {preparation && <>
        <div className="reuse-package-summary">
          <strong>Paquet prêt · v{preparation.versionNumber}</strong>
          <span>{preparation.copiedFiles.filter((file) => file.copied).length} fichier(s) source copié(s)</span>
          {preparation.copiedFiles.some((file) => file.missing) && <span className="reuse-warning">{preparation.copiedFiles.filter((file) => file.missing).length} fichier(s) source manquant(s)</span>}
          <small>{preparation.packageDirectory}</small>
        </div>

        <div className="reuse-promotion">
          <div><span className="eyebrow">Action volontaire</span><h3>Créer la brique AtoumWeb après adaptation</h3><p className="muted">Relis et adapte le contenu ci-dessous avant de créer la brique globale. Le projet source restera inchangé.</p></div>
          <div className="technical-editor-grid">
            <label>Nom générique<input value={globalName} onChange={(event) => setGlobalName(event.target.value)} /></label>
            <label>Catégorie<select value={globalCategory} onChange={(event) => setGlobalCategory(event.target.value as AtoumWebLibraryCategory)}>{(Object.keys(CATEGORY_LABELS) as AtoumWebLibraryCategory[]).map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}</select></label>
            <label>Description<input value={globalDescription} onChange={(event) => setGlobalDescription(event.target.value)} /></label>
            <label>Tags<input value={globalTags} onChange={(event) => setGlobalTags(event.target.value)} /></label>
            <label>Type de contenu<select value={contentType} onChange={(event) => setContentType(event.target.value as ProjectTechnicalContentType)}><option value="code">Code</option><option value="json">JSON</option><option value="text">Texte</option><option value="reference">Référence</option></select></label>
            <label>Langage<input value={language} onChange={(event) => setLanguage(event.target.value)} /></label>
          </div>
          {contentType !== 'reference' && <label className="reuse-wide-field">Contenu adapté<textarea className="technical-code-input" value={contentText} onChange={(event) => setContentText(event.target.value)} spellCheck={false} /></label>}
          <label className="reuse-wide-field">Notes de version<textarea rows={3} value={versionNotes} onChange={(event) => setVersionNotes(event.target.value)} /></label>
          <button className="primary-button" type="button" disabled={busy || !globalName.trim()} onClick={() => void createGlobal()}>Créer volontairement dans la Bibliothèque AtoumWeb</button>
        </div>
      </>}
    </section>
  );
}
