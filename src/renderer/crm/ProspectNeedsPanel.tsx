import { useEffect, useMemo, useState } from 'react';
import type { CatalogItemSummary } from '../../shared/commercial';
import type { Need, NeedInput } from '../../shared/workflow';

const CATEGORY_ORDER = ['Web', 'E-commerce', 'Maintenance', 'Contenu', 'Visibilité', 'Création', 'Applications', 'Mariage'];
const SUGGESTIONS: Record<string, string[]> = {
  'atoumweb-vitrine': ['atoumweb-wordpress', 'atoumweb-seo', 'atoumweb-contenu', 'atoumweb-identite', 'atoumweb-photos'],
  'atoumweb-landing': ['atoumweb-seo', 'atoumweb-contenu', 'atoumweb-identite'],
  'atoumweb-ecommerce': ['atoumweb-woocommerce', 'atoumweb-seo', 'atoumweb-images', 'atoumweb-livraison', 'atoumweb-paiement'],
  'atoumweb-applications': ['atoumweb-dev', 'atoumweb-support'],
};

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

export function NeedDraftSelector({ value, onChange }: { value: NeedInput[]; onChange: (next: NeedInput[]) => void }) {
  const [catalog, setCatalog] = useState<CatalogItemSummary[]>([]);
  const [category, setCategory] = useState('Web');
  const [selectedId, setSelectedId] = useState('');
  const [otherText, setOtherText] = useState('');
  const categories = useMemo(() => sortedCategories(catalog), [catalog]);
  const choices = useMemo(() => catalog.filter((item) => (item.category || 'Autre') === category), [catalog, category]);

  useEffect(() => { void window.atoumweb.catalog.list({ status: 'active' }).then((items) => setCatalog(items.filter((item) => Boolean(item.currentVersion)))); }, []);

  function add() {
    if (selectedId === 'other') {
      if (!otherText.trim()) return;
      onChange([...value, { catalogItemId: null, otherText: otherText.trim() }]);
      setOtherText('');
      return;
    }
    if (!selectedId || value.some((item) => item.catalogItemId === selectedId)) return;
    onChange([...value, { catalogItemId: selectedId, otherText: '' }]);
    setSelectedId('');
  }

  const selectedItems = value.map((need) => need.catalogItemId ? catalog.find((item) => item.id === need.catalogItemId) : null);
  const suggestionIds = Array.from(new Set(selectedItems.flatMap((item) => item ? (SUGGESTIONS[item.id] ?? []) : [])))
    .filter((id) => !value.some((need) => need.catalogItemId === id));
  const suggestions = suggestionIds.map((id) => catalog.find((item) => item.id === id)).filter(Boolean) as CatalogItemSummary[];

  return <div className="need-selector-v2 form-span-3">
    <div className="need-selector-title"><strong>Besoins / Offres / Services</strong><small>Choisis d’abord une catégorie pour éviter une liste interminable.</small></div>
    {value.length > 0 && <div className="need-chip-list">{value.map((need, index) => {
      const item = need.catalogItemId ? catalog.find((candidate) => candidate.id === need.catalogItemId) : null;
      return <span className="need-chip" key={`${need.catalogItemId ?? 'other'}-${index}`}>{item ? `${item.type === 'offer' ? 'Offre' : 'Service'} · ${item.name}` : `Autre · ${need.otherText}`}<button type="button" aria-label="Retirer" onClick={() => onChange(value.filter((_, i) => i !== index))}>×</button></span>;
    })}</div>}
    <div className="need-add-row">
      <label>Catégorie<select value={category} onChange={(e) => { setCategory(e.target.value); setSelectedId(''); }}>{categories.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
      <label>Prestation<select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}><option value="">Choisir…</option>{choices.map((item) => <option key={item.id} value={item.id}>{item.type === 'offer' ? 'Offre' : 'Service'} · {item.name}</option>)}<option value="other">Autre besoin</option></select></label>
      {selectedId === 'other' && <label>Préciser<input value={otherText} onChange={(e) => setOtherText(e.target.value)} /></label>}
      <button type="button" className="secondary-button" onClick={add} disabled={!selectedId || (selectedId === 'other' && !otherText.trim())}>Ajouter</button>
    </div>
    {suggestions.length > 0 && <div className="need-suggestions"><span>Services complémentaires suggérés :</span>{suggestions.map((item) => <button type="button" key={item.id} onClick={() => onChange([...value, { catalogItemId: item.id, otherText: '' }])}>+ {item.name}</button>)}</div>}
  </div>;
}

export function ProspectNeedsPanel({ prospectId, onChanged }: { prospectId: string; onChanged?: () => void }) {
  const [catalog, setCatalog] = useState<CatalogItemSummary[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [draft, setDraft] = useState<NeedInput[]>([]);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const [nextNeeds, nextCatalog] = await Promise.all([window.atoumweb.workflow.needs('prospect', prospectId), window.atoumweb.catalog.list({ status: 'active' })]);
      setNeeds(nextNeeds);
      setCatalog(nextCatalog);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }
  useEffect(() => { setDraft([]); setEditingId(undefined); void load(); }, [prospectId]);

  async function saveDraft() {
    const need = draft[0];
    if (!need || (!need.catalogItemId && !need.otherText?.trim())) return;
    setBusy(true); setError('');
    try {
      await window.atoumweb.workflow.saveNeed('prospect', prospectId, need, editingId);
      setDraft([]); setEditingId(undefined); await load(); onChanged?.();
      window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    setBusy(true); setError('');
    try { await window.atoumweb.workflow.removeNeed('prospect', prospectId, id); await load(); onChanged?.(); window.dispatchEvent(new Event('atoumweb:changed')); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  return <section className="prospect-work-section needs-panel-v2">
    <div className="work-section-heading"><div><span className="eyebrow">Besoins / Offres / Services</span><strong>{needs.length} élément{needs.length > 1 ? 's' : ''}</strong></div></div>
    {error && <p className="form-error">{error}</p>}
    <div className="need-current-list">{needs.map((need) => <div className="need-current-row" key={need.id}><div><strong>{need.type === 'offer' ? 'Offre' : need.type === 'service' ? 'Service' : 'Autre'}</strong><span>{need.label}</span></div><div><button className="secondary-button compact-button" type="button" onClick={() => { setEditingId(need.id); setDraft([{ catalogItemId: need.catalogItemId, otherText: need.otherText }]); }}>Modifier</button><button className="secondary-button compact-button" type="button" disabled={busy} onClick={() => void remove(need.id)}>Retirer</button></div></div>)}</div>
    <NeedDraftSelector value={draft} onChange={(next) => setDraft(next.slice(-1))} />
    {draft.length > 0 && <div className="inline-editor-actions"><button type="button" className="secondary-button" onClick={() => { setDraft([]); setEditingId(undefined); }}>Annuler</button><button type="button" className="primary-button" disabled={busy} onClick={() => void saveDraft()}>{editingId ? 'Enregistrer la modification' : 'Ajouter la prestation'}</button></div>}
    {needs.length === 0 && <p className="muted">Aucun besoin défini pour le moment. Le prospect peut rester en « Nouveau contact » ou « À qualifier » sans besoin.</p>}
  </section>;
}
