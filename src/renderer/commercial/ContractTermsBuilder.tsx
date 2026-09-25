import { useEffect, useMemo, useState } from 'react';
import type { CatalogItemSummary, QuoteDetail } from '../../shared/commercial';
import type {
  ContractClauseAudience,
  ContractClauseScope,
  ContractClauseTemplate,
  QuoteContractBuild,
  QuoteContractClause,
} from '../../shared/contractTerms';

interface ClauseDraft {
  title: string;
  body: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sourceLabel(clause: QuoteContractClause): string {
  if (clause.sourceKind === 'base') return 'Socle AtoumWeb';
  if (clause.sourceKind === 'catalog') return 'Prestation';
  return 'Particulière';
}

export function ContractTermsBuilder({ quote }: { quote: QuoteDetail }) {
  const [build, setBuild] = useState<QuoteContractBuild | null>(null);
  const [templates, setTemplates] = useState<ContractClauseTemplate[]>([]);
  const [catalog, setCatalog] = useState<CatalogItemSummary[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ClauseDraft>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateCode, setTemplateCode] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateScope, setTemplateScope] = useState<ContractClauseScope>('base');
  const [templateAudience, setTemplateAudience] = useState<ContractClauseAudience>('all');
  const [templateBody, setTemplateBody] = useState('');
  const [versionEditors, setVersionEditors] = useState<Record<string, string | undefined>>({});

  const editable = quote.status === 'draft' && !quote.finalizedAt;
  const textForAbby = (build?.snapshotText || build?.compiledText || '').trim();

  const counts = useMemo(() => {
    const clauses = build?.clauses ?? [];
    return {
      base: clauses.filter((clause) => clause.sourceKind === 'base' && clause.enabled).length,
      catalog: clauses.filter((clause) => clause.sourceKind === 'catalog' && clause.enabled).length,
      custom: clauses.filter((clause) => clause.sourceKind === 'custom' && clause.enabled).length,
    };
  }, [build]);

  function setBuildAndDrafts(next: QuoteContractBuild): void {
    setBuild(next);
    setDrafts(Object.fromEntries(next.clauses.map((clause) => [
      clause.id,
      { title: clause.title, body: clause.body },
    ])));
  }

  async function refreshLibrary(): Promise<void> {
    const [nextTemplates, nextCatalog] = await Promise.all([
      window.atoumweb.contractTerms.library.list(),
      window.atoumweb.catalog.list({ status: 'active' }),
    ]);
    setTemplates(nextTemplates);
    setCatalog(nextCatalog);
  }

  async function load(): Promise<void> {
    setLoading(true);
    setError('');
    try {
      const next = editable
        ? await window.atoumweb.contractTerms.quotes.sync(quote.id)
        : await window.atoumweb.contractTerms.quotes.get(quote.id);
      setBuildAndDrafts(next);
      await refreshLibrary();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [quote.id, quote.status, quote.finalizedAt, quote.contractCompiledAt, quote.updatedAt]);

  async function run(action: () => Promise<QuoteContractBuild>): Promise<void> {
    setBusy(true);
    setError('');
    try {
      setBuildAndDrafts(await action());
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function sync(): Promise<void> {
    await run(() => window.atoumweb.contractTerms.quotes.sync(quote.id));
  }

  async function saveClause(clause: QuoteContractClause): Promise<void> {
    const draft = drafts[clause.id];
    if (!draft) return;
    await run(() => window.atoumweb.contractTerms.quotes.updateClause(clause.id, {
      title: draft.title,
      body: draft.body,
    }));
  }

  async function toggleClause(clause: QuoteContractClause): Promise<void> {
    await run(() => window.atoumweb.contractTerms.quotes.updateClause(clause.id, { enabled: !clause.enabled }));
  }

  async function resetClause(clause: QuoteContractClause): Promise<void> {
    await run(() => window.atoumweb.contractTerms.quotes.resetClause(clause.id));
  }

  async function removeCustom(clause: QuoteContractClause): Promise<void> {
    await run(() => window.atoumweb.contractTerms.quotes.removeCustom(clause.id));
  }

  async function moveClause(clauseId: string, direction: -1 | 1): Promise<void> {
    if (!build) return;
    const ids = build.clauses.map((clause) => clause.id);
    const index = ids.indexOf(clauseId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await run(() => window.atoumweb.contractTerms.quotes.reorder(quote.id, ids));
  }

  async function addCustom(): Promise<void> {
    if (!customTitle.trim()) {
      setError('Renseigne le titre de la clause particulière.');
      return;
    }
    await run(() => window.atoumweb.contractTerms.quotes.addCustom(quote.id, {
      title: customTitle,
      body: customBody,
    }));
    setCustomTitle('');
    setCustomBody('');
    setShowCustom(false);
  }

  async function copyForAbby(): Promise<void> {
    if (!textForAbby) {
      setError('Aucun texte de CGV à copier.');
      return;
    }
    setError('');
    try {
      await window.atoumweb.contractTerms.copyText(textForAbby);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  async function createTemplate(): Promise<void> {
    if (!templateCode.trim() || !templateTitle.trim() || !templateBody.trim()) {
      setError('Code, titre et texte sont requis pour créer une clause.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const created = await window.atoumweb.contractTerms.library.create(
        { code: templateCode, title: templateTitle, scope: templateScope, audience: templateAudience },
        { body: templateBody },
      );
      const draft = created.versions.find((version) => version.status === 'draft');
      if (!draft) throw new Error('La première version de la clause est introuvable.');
      await window.atoumweb.contractTerms.library.publishVersion(draft.id);
      setTemplateCode('');
      setTemplateTitle('');
      setTemplateBody('');
      setTemplateScope('base');
      setTemplateAudience('all');
      setShowCreateTemplate(false);
      await refreshLibrary();
      if (editable) setBuildAndDrafts(await window.atoumweb.contractTerms.quotes.sync(quote.id));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function publishNewVersion(template: ContractClauseTemplate): Promise<void> {
    const body = versionEditors[template.id];
    if (!body?.trim()) {
      setError('Le texte de la nouvelle version est vide.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const draft = await window.atoumweb.contractTerms.library.createVersion(template.id, { body });
      await window.atoumweb.contractTerms.library.publishVersion(draft.id);
      setVersionEditors((current) => ({ ...current, [template.id]: undefined }));
      await refreshLibrary();
      if (editable) setBuildAndDrafts(await window.atoumweb.contractTerms.quotes.sync(quote.id));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function toggleCatalogLink(template: ContractClauseTemplate, itemId: string): Promise<void> {
    const next = template.catalogItemIds.includes(itemId)
      ? template.catalogItemIds.filter((id) => id !== itemId)
      : [...template.catalogItemIds, itemId];
    setBusy(true);
    setError('');
    try {
      await window.atoumweb.contractTerms.library.setCatalogLinks(template.id, next);
      await refreshLibrary();
      if (editable) setBuildAndDrafts(await window.atoumweb.contractTerms.quotes.sync(quote.id));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function toggleTemplateStatus(template: ContractClauseTemplate): Promise<void> {
    setBusy(true);
    setError('');
    try {
      await window.atoumweb.contractTerms.library.setStatus(
        template.id,
        template.status === 'active' ? 'inactive' : 'active',
      );
      await refreshLibrary();
      if (editable) setBuildAndDrafts(await window.atoumweb.contractTerms.quotes.sync(quote.id));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <section className="cgv-builder"><p className="muted">Préparation des CGV du devis…</p></section>;
  }

  return (
    <section className="cgv-builder">
      <div className="cgv-builder-heading">
        <div>
          <span className="eyebrow">Devis contractuel</span>
          <h3>Builder Conditions Générales de Vente</h3>
          <p className="muted">Le socle AtoumWeb et les clauses liées aux prestations sont assemblés ici, puis copiés dans le champ CGV d’Abby.</p>
        </div>
        <div className="cgv-builder-heading-actions">
          {editable && <button className="secondary-button" type="button" disabled={busy} onClick={() => void sync()}>↻ Synchroniser</button>}
          <button className="secondary-button" type="button" onClick={() => setShowLibrary((value) => !value)}>{showLibrary ? 'Masquer la bibliothèque' : 'Bibliothèque CGV'}</button>
        </div>
      </div>

      <div className="cgv-builder-summary">
        <span><strong>{counts.base}</strong> socle</span>
        <span><strong>{counts.catalog}</strong> prestation(s)</span>
        <span><strong>{counts.custom}</strong> particulière(s)</span>
        <span className="status-pill">{build?.audience === 'professional' ? 'Client professionnel' : 'Client particulier'}</span>
        {build?.locked && <span className="status-pill">Version figée</span>}
      </div>

      {build?.warnings.map((warning) => <div className="cgv-warning" key={warning}>{warning}</div>)}
      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="cgv-clause-list">
        {build?.clauses.map((clause, index) => {
          const draft = drafts[clause.id] ?? { title: clause.title, body: clause.body };
          const clauseClass = 'cgv-clause' + (clause.enabled ? '' : ' disabled') + (clause.isOrphaned ? ' orphaned' : '');
          return (
            <details className={clauseClass} key={clause.id}>
              <summary>
                <div>
                  <span className={'cgv-source source-' + clause.sourceKind}>{sourceLabel(clause)}</span>
                  <strong>{clause.title}</strong>
                  {clause.isCustomized && <small>Modifiée pour ce devis</small>}
                  {clause.isOrphaned && <small>Prestation retirée · clause désactivée automatiquement</small>}
                </div>
                <div className="cgv-clause-summary-actions">
                  <span>{clause.enabled ? 'Incluse' : 'Exclue'}</span>
                  <span>#{index + 1}</span>
                </div>
              </summary>
              <div className="cgv-clause-editor">
                <label>Titre<input disabled={!editable || clause.sourceKind === 'base'} value={draft.title} onChange={(event) => setDrafts((current) => ({ ...current, [clause.id]: { ...draft, title: event.target.value } }))} /></label>
                <label>Texte<textarea disabled={!editable || clause.sourceKind === 'base'} value={draft.body} onChange={(event) => setDrafts((current) => ({ ...current, [clause.id]: { ...draft, body: event.target.value } }))} /></label>
                {editable && <div className="cgv-clause-actions">
                  {clause.sourceKind === 'base'
                    ? <span className="status-pill">Socle fixe</span>
                    : <>
                        <button className="primary-button compact-button" type="button" disabled={busy} onClick={() => void saveClause(clause)}>Enregistrer</button>
                        <button className="secondary-button compact-button" type="button" disabled={busy} onClick={() => void toggleClause(clause)}>{clause.enabled ? 'Exclure du devis' : 'Inclure dans le devis'}</button>
                      </>}
                  {clause.sourceClauseId && clause.isCustomized && <button className="secondary-button compact-button" type="button" disabled={busy} onClick={() => void resetClause(clause)}>Revenir au modèle</button>}
                  {clause.sourceKey.startsWith('custom:') && <button className="secondary-button compact-button danger-outline" type="button" disabled={busy} onClick={() => void removeCustom(clause)}>Supprimer</button>}
                  <span className="cgv-spacer" />
                  <button className="secondary-button compact-button" type="button" disabled={busy || index === 0} title="Monter la clause" onClick={() => void moveClause(clause.id, -1)}>↑</button>
                  <button className="secondary-button compact-button" type="button" disabled={busy || index === (build?.clauses.length ?? 1) - 1} title="Descendre la clause" onClick={() => void moveClause(clause.id, 1)}>↓</button>
                </div>}
              </div>
            </details>
          );
        })}
        {build?.clauses.length === 0 && <div className="empty-table">Aucune clause configurée. Ouvre la Bibliothèque CGV pour créer le socle AtoumWeb.</div>}
      </div>

      {editable && <div className="cgv-particular">
        {!showCustom
          ? <button className="secondary-button" type="button" onClick={() => setShowCustom(true)}>+ Ajouter une clause particulière</button>
          : <div className="cgv-custom-form">
              <label>Titre<input value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} placeholder="Ex. Livraison en deux phases" /></label>
              <label>Texte<textarea value={customBody} onChange={(event) => setCustomBody(event.target.value)} /></label>
              <div><button className="primary-button" type="button" disabled={busy} onClick={() => void addCustom()}>Ajouter au devis</button><button className="secondary-button" type="button" onClick={() => setShowCustom(false)}>Annuler</button></div>
            </div>}
      </div>}

      <div className="cgv-output">
        <div className="cgv-output-heading">
          <div><strong>Texte final pour Abby</strong><span>{build?.locked ? 'Snapshot contractuel figé' : 'Aperçu actuel du builder'}</span></div>
          <button className="primary-button" type="button" disabled={!textForAbby} onClick={() => void copyForAbby()}>{copied ? '✓ Copié' : '📋 Copier pour Abby'}</button>
        </div>
        <textarea readOnly value={textForAbby} placeholder="Les CGV assemblées apparaîtront ici." />
      </div>

      {showLibrary && <div className="cgv-library">
        <div className="cgv-library-heading">
          <div><strong>Bibliothèque CGV AtoumWeb</strong><span>Les versions publiées alimentent les devis brouillons. Les devis déjà finalisés ne changent jamais.</span></div>
          <button className="primary-button" type="button" onClick={() => setShowCreateTemplate((value) => !value)}>{showCreateTemplate ? 'Fermer' : '+ Nouvelle clause'}</button>
        </div>

        {showCreateTemplate && <div className="cgv-template-form">
          <div className="cgv-template-fields">
            <label>Code<input value={templateCode} onChange={(event) => setTemplateCode(event.target.value)} placeholder="CGV-PAIEMENT" /></label>
            <label>Titre<input value={templateTitle} onChange={(event) => setTemplateTitle(event.target.value)} placeholder="Modalités de paiement" /></label>
            <label>Type<select value={templateScope} onChange={(event) => setTemplateScope(event.target.value as ContractClauseScope)}><option value="base">Socle commun</option><option value="catalog">Liée aux prestations</option></select></label>
            <label>Public<select value={templateAudience} onChange={(event) => setTemplateAudience(event.target.value as ContractClauseAudience)}><option value="all">Tous les clients</option><option value="professional">Professionnels</option><option value="consumer">Particuliers</option></select></label>
          </div>
          <label>Texte de la version 1<textarea value={templateBody} onChange={(event) => setTemplateBody(event.target.value)} /></label>
          <button className="primary-button" type="button" disabled={busy} onClick={() => void createTemplate()}>Créer et publier</button>
        </div>}

        <div className="cgv-template-list">
          {templates.map((template) => (
            <details className="cgv-template" key={template.id}>
              <summary>
                <div><strong>{template.title}</strong><span>{template.code} · {template.scope === 'base' ? 'Socle commun' : 'Clause prestation'} · {template.audience === 'all' ? 'Tous clients' : template.audience === 'professional' ? 'Professionnels' : 'Particuliers'} · v{template.currentVersion?.versionNumber ?? '—'}</span></div>
                <span className={'catalog-status status-' + template.status}>{template.status === 'active' ? 'Active' : template.status === 'inactive' ? 'Inactive' : 'Archivée'}</span>
              </summary>
              <div className="cgv-template-body">
                <label>Version publiée<textarea readOnly value={template.currentVersion?.body ?? 'Aucune version publiée.'} /></label>
                <div className="cgv-template-actions">
                  <button className="secondary-button compact-button" type="button" disabled={busy || template.status === 'archived'} onClick={() => setVersionEditors((current) => ({ ...current, [template.id]: current[template.id] === undefined ? (template.currentVersion?.body ?? '') : undefined }))}>{versionEditors[template.id] === undefined ? 'Nouvelle version' : 'Annuler la version'}</button>
                  {template.status !== 'archived' && <button className="secondary-button compact-button" type="button" disabled={busy} onClick={() => void toggleTemplateStatus(template)}>{template.status === 'active' ? 'Désactiver' : 'Réactiver'}</button>}
                </div>
                {versionEditors[template.id] !== undefined && <div className="cgv-version-editor">
                  <label>Nouvelle version<textarea value={versionEditors[template.id] ?? ''} onChange={(event) => setVersionEditors((current) => ({ ...current, [template.id]: event.target.value }))} /></label>
                  <button className="primary-button compact-button" type="button" disabled={busy} onClick={() => void publishNewVersion(template)}>Publier cette version</button>
                </div>}
                {template.scope === 'catalog' && <div className="cgv-catalog-links">
                  <strong>Prestations qui déclenchent cette clause</strong>
                  <div>{catalog.map((item) => <label key={item.id}><input type="checkbox" checked={template.catalogItemIds.includes(item.id)} disabled={busy} onChange={() => void toggleCatalogLink(template, item.id)} /><span>{item.type === 'offer' ? 'Offre' : 'Service'} · {item.name}</span></label>)}</div>
                </div>}
              </div>
            </details>
          ))}
          {templates.length === 0 && <p className="muted">La bibliothèque est vide. Commence par créer les clauses du socle commun.</p>}
        </div>
      </div>}
    </section>
  );
}
