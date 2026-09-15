import { useEffect, useMemo, useState } from 'react';
import type { CatalogItemSummary, CatalogVersion, PriceMode } from '../../shared/commercial';
import type { ProspectSummary } from '../../shared/crm';
import type { Need } from '../../shared/workflow';
import { ProspectPreQuoteReview } from './ProspectPreQuoteReview';

const CATEGORY_ORDER = ['Web', 'E-commerce', 'Maintenance', 'Contenu', 'SEO / Visibilité', 'Visibilité', 'Identité visuelle', 'Création', 'Applications & outils métier', 'Applications', 'Mariage'];

const BUDGET_PRESETS = [
  ['not_disclosed', 'Non communiqué'],
  ['under_500', 'Moins de 500 €'],
  ['500_1000', '500–1 000 €'],
  ['1000_2000', '1 000–2 000 €'],
  ['2000_5000', '2 000–5 000 €'],
  ['5000_10000', '5 000–10 000 €'],
  ['10000_plus', '10 000 € et +'],
  ['custom', 'Fourchette personnalisée'],
  ['exact', 'Montant précis'],
] as const;

type BudgetPreset = (typeof BUDGET_PRESETS)[number][0];

function cleanError(error: unknown): string {
  if (!(error instanceof Error)) return 'Une erreur est survenue.';
  return error.message
    .replace(/^Error invoking remote method ['"][^'"]+['"]:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();
}

function sortedCategories(items: CatalogItemSummary[]) {
  const values = Array.from(new Set(items.map((item) => item.category || 'Autre')));
  return values.sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b, 'fr');
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function priceLabel(version?: CatalogVersion | null): string {
  if (!version) return 'Tarif à préciser';
  if (version.priceMode === 'quote_only') return 'Sur devis';
  if (version.priceMode === 'free') return 'Gratuit';
  if (version.priceCents == null) return 'Tarif à préciser';
  const amount = `${(version.priceCents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
  const prefixes: Partial<Record<PriceMode, string>> = {
    starting_from: 'À partir de ', hourly: '', monthly: '', yearly: '', fixed: '',
  };
  const suffixes: Partial<Record<PriceMode, string>> = { hourly: ' / h', monthly: ' / mois', yearly: ' / an' };
  return `${prefixes[version.priceMode] ?? ''}${amount}${suffixes[version.priceMode] ?? ''}`;
}

function centsFromEuros(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

function deriveBudgetPreset(prospect: ProspectSummary | null): BudgetPreset {
  if (!prospect || prospect.budgetStatus === 'not_disclosed' || (!prospect.budgetStatus && prospect.budgetMinCents == null && prospect.budgetMaxCents == null)) return 'not_disclosed';
  if (prospect.budgetStatus === 'known' && prospect.budgetMinCents != null && prospect.budgetMinCents === prospect.budgetMaxCents) return 'exact';
  const min = prospect.budgetMinCents;
  const max = prospect.budgetMaxCents;
  if (min === 0 && max === 49999) return 'under_500';
  if (min === 50000 && max === 100000) return '500_1000';
  if (min === 100000 && max === 200000) return '1000_2000';
  if (min === 200000 && max === 500000) return '2000_5000';
  if (min === 500000 && max === 1000000) return '5000_10000';
  if (min === 1000000 && max == null) return '10000_plus';
  return 'custom';
}

function budgetValues(preset: BudgetPreset, customMin: string, customMax: string, exact: string): { status: ProspectSummary['budgetStatus']; min: number | null; max: number | null } {
  switch (preset) {
    case 'not_disclosed': return { status: 'not_disclosed', min: null, max: null };
    case 'under_500': return { status: 'range', min: 0, max: 49999 };
    case '500_1000': return { status: 'range', min: 50000, max: 100000 };
    case '1000_2000': return { status: 'range', min: 100000, max: 200000 };
    case '2000_5000': return { status: 'range', min: 200000, max: 500000 };
    case '5000_10000': return { status: 'range', min: 500000, max: 1000000 };
    case '10000_plus': return { status: 'range', min: 1000000, max: null };
    case 'exact': {
      const amount = centsFromEuros(exact);
      return { status: 'known', min: amount, max: amount };
    }
    case 'custom':
    default: return { status: 'range', min: centsFromEuros(customMin), max: centsFromEuros(customMax) };
  }
}

export function ProspectNeedsPanel({ prospectId, onChanged }: { prospectId: string; onChanged?: () => void }) {
  const [catalog, setCatalog] = useState<CatalogItemSummary[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [prospect, setProspect] = useState<ProspectSummary | null>(null);
  const [category, setCategory] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [otherText, setOtherText] = useState('');
  const [editingId, setEditingId] = useState<string | undefined>();
  const [projectSummary, setProjectSummary] = useState('');
  const [projectContext, setProjectContext] = useState('');
  const [budgetPreset, setBudgetPreset] = useState<BudgetPreset>('not_disclosed');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [budgetExact, setBudgetExact] = useState('');
  const [timelineStatus, setTimelineStatus] = useState<NonNullable<ProspectSummary['timelineStatus']>>('not_disclosed');
  const [targetDate, setTargetDate] = useState('');
  const [timelineNote, setTimelineNote] = useState('');
  const [existingStatus, setExistingStatus] = useState<NonNullable<ProspectSummary['existingStatus']>>('unknown');
  const [existingUrl, setExistingUrl] = useState('');
  const [existingNotes, setExistingNotes] = useState('');
  const [missingInformation, setMissingInformation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const categories = useMemo(() => sortedCategories(catalog), [catalog]);
  const choices = useMemo(() => catalog.filter((item) => (item.category || 'Autre') === category), [catalog, category]);
  const selectedItem = catalog.find((item) => item.id === selectedId) ?? null;

  async function load() {
    try {
      const [nextNeeds, nextCatalog, prospects] = await Promise.all([
        window.atoumweb.workflow.needs('prospect', prospectId),
        window.atoumweb.catalog.list({ status: 'active' }),
        window.atoumweb.crm.prospects.list({ includeArchived: true }),
      ]);
      const current = prospects.find((item) => item.id === prospectId) ?? null;
      const available = nextCatalog.filter((item) => Boolean(item.currentVersion));
      setNeeds(nextNeeds);
      setCatalog(available);
      setProspect(current);
      if (!category || !available.some((item) => (item.category || 'Autre') === category)) setCategory(sortedCategories(available)[0] ?? 'Autre');
      if (current) {
        setProjectSummary(current.projectSummary ?? '');
        setProjectContext(current.projectContext ?? '');
        setBudgetPreset(deriveBudgetPreset(current));
        setBudgetMin(current.budgetMinCents != null ? String(current.budgetMinCents / 100) : '');
        setBudgetMax(current.budgetMaxCents != null ? String(current.budgetMaxCents / 100) : '');
        setBudgetExact(current.budgetStatus === 'known' && current.budgetMinCents != null ? String(current.budgetMinCents / 100) : '');
        setTimelineStatus(current.timelineStatus ?? 'not_disclosed');
        setTargetDate(current.targetDate?.slice(0, 10) ?? '');
        setTimelineNote(current.timelineNote ?? '');
        setExistingStatus(current.existingStatus ?? 'unknown');
        setExistingUrl(current.existingUrl ?? '');
        setExistingNotes(current.existingNotes ?? '');
        setMissingInformation(current.missingInformation ?? '');
      }
    } catch (e) { setError(cleanError(e)); }
  }

  useEffect(() => { setEditingId(undefined); setSelectedId(''); setOtherText(''); void load(); }, [prospectId]);

  async function saveNeed() {
    if (!selectedId && !otherText.trim()) return;
    setBusy(true); setError('');
    try {
      await window.atoumweb.workflow.saveNeed('prospect', prospectId, selectedId === 'other'
        ? { catalogItemId: null, otherText: otherText.trim() }
        : { catalogItemId: selectedId, otherText: null }, editingId);
      setSelectedId(''); setOtherText(''); setEditingId(undefined); await load(); onChanged?.();
      window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) { setError(cleanError(e)); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    setBusy(true); setError('');
    try { await window.atoumweb.workflow.removeNeed('prospect', prospectId, id); await load(); onChanged?.(); window.dispatchEvent(new Event('atoumweb:changed')); }
    catch (e) { setError(cleanError(e)); }
    finally { setBusy(false); }
  }

  async function saveIdentification() {
    if (!prospect) return;
    const budget = budgetValues(budgetPreset, budgetMin, budgetMax, budgetExact);
    if (budgetPreset === 'exact' && budget.min == null) { setError('Renseigne le montant précis du budget.'); return; }
    if (budgetPreset === 'custom' && budget.min == null && budget.max == null) { setError('Renseigne au moins une borne de la fourchette budgétaire.'); return; }
    if (budget.min != null && budget.max != null && budget.min > budget.max) { setError('Le budget minimum ne peut pas dépasser le budget maximum.'); return; }
    setBusy(true); setError('');
    try {
      await window.atoumweb.crm.prospects.updateQualification(prospect.id, {
        projectSummary: projectSummary.trim() || null,
        projectContext: projectContext.trim() || null,
        budgetStatus: budget.status,
        timelineStatus,
        timelineNote: timelineStatus === 'note' ? timelineNote.trim() || null : null,
        existingStatus,
        existingUrl: existingStatus === 'yes' ? existingUrl.trim() || null : null,
        existingNotes: existingStatus !== 'no' ? existingNotes.trim() || null : null,
        missingInformation: missingInformation.trim() || null,
      });
      await window.atoumweb.crm.prospects.update(prospect.id, {
        ...prospect,
        budgetMinCents: budget.min,
        budgetMaxCents: budget.max,
        targetDate: timelineStatus === 'date' ? targetDate || null : null,
      });
      await load(); onChanged?.(); window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) { setError(cleanError(e)); }
    finally { setBusy(false); }
  }

  function editNeed(need: Need) {
    setEditingId(need.id);
    setSelectedId(need.catalogItemId ?? 'other');
    setOtherText(need.otherText ?? '');
    if (need.catalogItemId) {
      const item = catalog.find((candidate) => candidate.id === need.catalogItemId);
      if (item) setCategory(item.category || 'Autre');
    }
  }

  const identificationReady = needs.length > 0 && Boolean(projectSummary.trim()) && Boolean(prospect?.budgetStatus) && Boolean(prospect?.timelineStatus);

  return <section className="prospect-work-section needs-panel-v2">
    <div className="work-section-heading"><div><span className="eyebrow">Besoin à identifier</span><strong>Projet & solution AtoumWeb</strong></div><span className={`status-pill ${identificationReady ? 'ready' : ''}`}>{identificationReady ? 'Base renseignée' : 'À compléter'}</span></div>
    <p className="muted">Définis ce qu’AtoumWeb doit réellement proposer. Le catalogue reste la source des noms, tarifs et éléments inclus ; le devis ne sera créé qu’après le contrôle final.</p>
    {error && <p className="form-error">{error}</p>}

    <div className="need-current-list">{needs.map((need) => {
      const item = need.catalogItemId ? catalog.find((candidate) => candidate.id === need.catalogItemId) : null;
      const version = item?.currentVersion;
      return <div className="need-current-row need-solution-card" key={need.id}><div><span className="eyebrow">{item ? (item.type === 'offer' ? 'Offre envisagée' : 'Prestation envisagée') : 'Besoin spécifique'}</span><strong>{need.label}</strong>{version && <><small className="need-price">{priceLabel(version)}</small>{version.inclusions && version.inclusions.length > 0 && <div className="offer-inclusions"><span>Socle inclus</span>{version.inclusions.map((entry) => <small key={entry}>✓ {entry}</small>)}</div>}</>}</div><div className="need-row-actions"><button className="secondary-button compact-button" type="button" onClick={() => editNeed(need)}>Modifier</button><button className="secondary-button compact-button" type="button" disabled={busy} onClick={() => void remove(need.id)}>Retirer</button></div></div>;
    })}</div>

    <div className="need-add-block">
      <div className="need-selector-title"><strong>{editingId ? 'Modifier la solution' : 'Ajouter une offre / prestation au besoin'}</strong><small>Une sélection, un seul bouton de validation.</small></div>
      <div className="need-add-row">
        <label>Famille de solution<select value={category} onChange={(e) => { setCategory(e.target.value); setSelectedId(''); setOtherText(''); }}>{categories.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <label>Offre / prestation envisagée<select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}><option value="">Choisir…</option>{choices.map((item) => <option key={item.id} value={item.id}>{item.name} · {priceLabel(item.currentVersion)}</option>)}<option value="other">Autre / sur mesure</option></select></label>
        {selectedId === 'other' && <label>Préciser<input value={otherText} onChange={(e) => setOtherText(e.target.value)} placeholder="Décrire le besoin spécifique" /></label>}
      </div>
      {selectedItem?.currentVersion && <div className="selected-offer-preview"><div><span className="eyebrow">{selectedItem.type === 'offer' ? 'Offre' : 'Prestation'}</span><strong>{selectedItem.name}</strong><small>{priceLabel(selectedItem.currentVersion)}</small></div>{selectedItem.currentVersion.description && <p>{selectedItem.currentVersion.description}</p>}{selectedItem.currentVersion.inclusions && selectedItem.currentVersion.inclusions.length > 0 && <div className="offer-inclusions"><span>Ce que comprend actuellement le catalogue</span>{selectedItem.currentVersion.inclusions.map((entry) => <small key={entry}>✓ {entry}</small>)}</div>}</div>}
      <div className="inline-editor-actions">{editingId && <button type="button" className="secondary-button" onClick={() => { setEditingId(undefined); setSelectedId(''); setOtherText(''); }}>Annuler</button>}<button type="button" className="primary-button" disabled={busy || (!selectedId && !otherText.trim()) || (selectedId === 'other' && !otherText.trim())} onClick={() => void saveNeed()}>{editingId ? 'Enregistrer la modification' : 'Ajouter au besoin'}</button></div>
    </div>

    <div className="need-identification-fields">
      <div className="work-section-heading"><div><span className="eyebrow">Affiner le besoin</span><strong>Périmètre nécessaire au chiffrage</strong></div></div>
      <div className="workflow-fields">
        <label className="form-span-2">Projet / problématique<textarea value={projectSummary} onChange={(e) => setProjectSummary(e.target.value)} placeholder="Ce que le prospect veut obtenir ou résoudre" /></label>
        <label className="form-span-2">Contexte, contraintes et éléments hors socle<textarea value={projectContext} onChange={(e) => setProjectContext(e.target.value)} placeholder="Fonctionnalité particulière, volume, intégration, contenu important, contrainte technique…" /></label>

        <label>Budget<select value={budgetPreset} onChange={(e) => setBudgetPreset(e.target.value as BudgetPreset)}>{BUDGET_PRESETS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {budgetPreset === 'custom' && <div className="qualification-two-fields form-span-2"><label>Minimum (€)<input inputMode="decimal" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} /></label><label>Maximum (€)<input inputMode="decimal" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} /></label></div>}
        {budgetPreset === 'exact' && <label>Montant précis (€)<input inputMode="decimal" value={budgetExact} onChange={(e) => setBudgetExact(e.target.value)} /></label>}

        <label>Calendrier<select value={timelineStatus} onChange={(e) => setTimelineStatus(e.target.value as NonNullable<ProspectSummary['timelineStatus']>)}><option value="not_disclosed">Non communiqué</option><option value="date">Date cible</option><option value="note">Période / contrainte à préciser</option></select></label>
        {timelineStatus === 'date' && <label>Date cible<input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></label>}
        {timelineStatus === 'note' && <label className="form-span-2">Précision calendrier<input value={timelineNote} onChange={(e) => setTimelineNote(e.target.value)} placeholder="Ex. avant l’ouverture du restaurant, idéalement en novembre…" /></label>}

        <label>Site / outil existant<select value={existingStatus} onChange={(e) => setExistingStatus(e.target.value as NonNullable<ProspectSummary['existingStatus']>)}><option value="unknown">À vérifier</option><option value="yes">Oui</option><option value="no">Non</option></select></label>
        {existingStatus === 'yes' && <label>URL / référence existante<input value={existingUrl} onChange={(e) => setExistingUrl(e.target.value)} placeholder="https://…" /></label>}
        {existingStatus !== 'no' && <label className="form-span-2">Précisions sur l’existant<input value={existingNotes} onChange={(e) => setExistingNotes(e.target.value)} /></label>}

        <label className="form-span-2">Informations encore nécessaires au chiffrage<textarea value={missingInformation} onChange={(e) => setMissingInformation(e.target.value)} placeholder="Seulement les points nécessaires avant devis. Les éléments utiles uniquement au démarrage du projet ne bloquent pas le devis." /></label>
        <div className="need-scope-assessment form-span-2"><span className="eyebrow">Lecture du périmètre</span><strong>{missingInformation.trim() ? 'À préciser — des informations restent nécessaires avant devis' : projectContext.trim() ? 'Périmètre décrit — contrôle final à effectuer' : 'Socle sélectionné — vérifier les éventuels compléments hors offre'}</strong><small>Cette indication ne crée pas encore le devis. Le contrôle final décidera si le dossier est prêt à chiffrer.</small></div>
        <button type="button" className="primary-button" disabled={busy} onClick={() => void saveIdentification()}>{busy ? 'Enregistrement…' : 'Enregistrer l’identification du besoin'}</button>
      </div>
    </div>

    {prospect && <ProspectPreQuoteReview prospect={prospect} needs={needs} catalog={catalog} onChanged={() => { void load(); onChanged?.(); }} />}
    {needs.length === 0 && <p className="muted">Commence par sélectionner au moins une solution ou prestation envisagée. Rien n’est encore envoyé au devis à ce stade.</p>}
  </section>;
}
