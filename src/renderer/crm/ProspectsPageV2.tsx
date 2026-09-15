import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { CatalogItemSummary } from '../../shared/commercial';
import {
  PROSPECT_SOURCES,
  PROSPECT_TEMPERATURES,
  type ActivityEvent,
  type CrmAction,
  type ProspectSource,
  type ProspectStage,
  type ProspectSummary,
  type ProspectTemperature,
} from '../../shared/crm';
import type { NeedInput } from '../../shared/workflow';
import { ProspectIdentityPanel } from './ProspectIdentityPanel';
import { NeedDraftSelector, ProspectNeedsPanel } from './ProspectNeedsPanel';
import { FieldHelp, ProspectQualificationPanelV2 } from './ProspectQualificationPanelV2';
import { ProspectQuotePanel } from './ProspectQuotePanel';

const ACTIVE_STAGES: ProspectStage[] = ['new', 'qualifying', 'need_identified', 'quote_to_prepare', 'quote_to_send', 'quote_sent', 'follow_up', 'negotiation', 'waiting'];
const STAGE_LABELS: Record<ProspectStage, string> = {
  new: 'Nouveau contact', qualifying: 'À qualifier', need_identified: 'Besoin identifié', quote_to_prepare: 'Devis en préparation', quote_to_send: 'Devis à envoyer', quote_sent: 'Devis envoyé', follow_up: 'À relancer', negotiation: 'Négociation', waiting: 'En attente', won: 'Gagné', lost: 'Perdu',
};
const TEMPERATURE_LABELS: Record<ProspectTemperature, string> = { cold: 'Froid', neutral: 'Neutre', warm: 'Tiède', hot: 'Chaud' };
const SOURCE_LABELS: Record<ProspectSource, string> = { website: 'Site web', referral: 'Recommandation', google: 'Google', social: 'Réseaux sociaux', event: 'Événement', outbound: 'Prospection', former_client: 'Ancien client', other: 'Autre' };
const LOST_REASONS = ['Trop cher', 'Concurrent choisi', 'Projet abandonné', 'Pas de réponse', 'Délai incompatible', 'Besoin hors périmètre AtoumWeb', 'Autre'];
const QUOTE_FOLLOW_UP_STAGES: ProspectStage[] = ['quote_sent', 'follow_up', 'negotiation', 'waiting'];

interface ProspectDraft {
  company: string; industry: string; activityDescription: string; website: string;
  addressLine1: string; addressLine2: string; postalCode: string; city: string; country: string;
  firstName: string; lastName: string; jobTitle: string; email: string; phone: string;
  source: ProspectSource; sourceDetail: string; temperature: ProspectTemperature; estimatedValueEuros: string;
  firstActionDate: string; firstActionText: string;
}
const EMPTY_DRAFT: ProspectDraft = {
  company: '', industry: '', activityDescription: '', website: '', addressLine1: '', addressLine2: '', postalCode: '', city: '', country: 'France',
  firstName: '', lastName: '', jobTitle: '', email: '', phone: '', source: 'website', sourceDetail: '', temperature: 'neutral', estimatedValueEuros: '', firstActionDate: '', firstActionText: '',
};

type View = 'pipeline' | 'history';

function formatDate(value?: string | null) { return value ? new Date(value).toLocaleDateString('fr-FR') : 'Sans date'; }
function isClosed(prospect: ProspectSummary) { return Boolean(prospect.archivedAt || prospect.clientAccountId || prospect.stage === 'won' || prospect.stage === 'lost'); }
function isQuoteFollowUpStage(stage?: ProspectStage | null) { return QUOTE_FOLLOW_UP_STAGES.includes(stage ?? 'new'); }
function humanActivity(summary: string) {
  return summary.replace(/\bnew\b/g, 'Nouveau contact').replace(/\bqualifying\b/g, 'À qualifier').replace(/\bneed_identified\b/g, 'Besoin identifié').replace(/\bquote_to_prepare\b/g, 'Devis en préparation').replace(/\bquote_to_send\b/g, 'Devis à envoyer').replace(/\bquote_sent\b/g, 'Devis envoyé').replace(/\bfollow_up\b/g, 'À relancer').replace(/\bnegotiation\b/g, 'Négociation').replace(/\bwaiting\b/g, 'En attente').replace(/\bwon\b/g, 'Gagné').replace(/\blost\b/g, 'Perdu');
}

export function ProspectsPage({ onMessage, initialId }: { onMessage: (message: string) => void; initialId?: string | null }) {
  const [prospects, setProspects] = useState<ProspectSummary[]>([]);
  const [actions, setActions] = useState<CrmAction[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [view, setView] = useState<View>('pipeline');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<ProspectDraft>(EMPTY_DRAFT);
  const [needsDraft, setNeedsDraft] = useState<NeedInput[]>([]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<ProspectStage | null>(null);
  const [historySearch, setHistorySearch] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const [nextProspects, nextActions] = await Promise.all([window.atoumweb.crm.prospects.list({ includeArchived: true }), window.atoumweb.crm.actions.list({ ownerType: 'prospect' })]);
      setProspects(nextProspects); setActions(nextActions);
      if (selectedId && !nextProspects.some((item) => item.id === selectedId)) setSelectedId(null);
    } finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);
  useEffect(() => { if (!selectedId) { setActivity([]); return; } void window.atoumweb.crm.activity.list('prospect', selectedId).then(setActivity); }, [selectedId, prospects, actions]);
  useEffect(() => { const reload = () => void refresh(); window.addEventListener('atoumweb:changed', reload); return () => window.removeEventListener('atoumweb:changed', reload); }, []);

  const active = useMemo(() => prospects.filter((item) => !isClosed(item)), [prospects]);
  const closed = useMemo(() => prospects.filter(isClosed), [prospects]);
  const selected = prospects.find((item) => item.id === selectedId) ?? null;
  const selectedActions = actions.filter((item) => item.ownerId === selectedId);
  const byStage = useMemo(() => { const map = new Map<ProspectStage, ProspectSummary[]>(); ACTIVE_STAGES.forEach((stage) => map.set(stage, [])); active.forEach((item) => map.get(item.stage ?? 'new')?.push(item)); return map; }, [active]);

  async function submitProspect(event: FormEvent) {
    event.preventDefault(); setFormError('');
    if (!draft.company.trim() && (!draft.firstName.trim() || !draft.lastName.trim())) { setFormError('Renseigne une société ou le prénom et le nom du contact.'); return; }
    setSaving(true);
    try {
      let organizationId: string | null = null; let contactId: string | null = null;
      if (draft.company.trim()) {
        const organization = await window.atoumweb.crm.organizations.create({ name: draft.company.trim(), industry: draft.industry.trim() || null, notes: draft.activityDescription.trim() || null, website: draft.website.trim() || null, addressLine1: draft.addressLine1.trim() || null, addressLine2: draft.addressLine2.trim() || null, postalCode: draft.postalCode.trim() || null, city: draft.city.trim() || null, country: draft.country.trim() || null });
        organizationId = organization.id;
      }
      if (draft.firstName.trim() && draft.lastName.trim()) {
        const contact = await window.atoumweb.crm.contacts.create({ organizationId, firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), jobTitle: draft.jobTitle.trim() || null, email: draft.email.trim() || null, phone: draft.phone.trim() || null });
        contactId = contact.id;
        if (draft.email.trim()) await window.atoumweb.crm.contactMethods.save({ contactId, type: 'email', value: draft.email.trim(), label: 'Principal', isPrimary: true });
        if (draft.phone.trim()) await window.atoumweb.crm.contactMethods.save({ contactId, type: 'phone', value: draft.phone.trim(), label: 'Principal', isPrimary: true });
      } else if (organizationId) {
        if (draft.email.trim()) await window.atoumweb.crm.contactMethods.save({ organizationId, type: 'email', value: draft.email.trim(), label: 'Accueil / principal', isPrimary: true });
        if (draft.phone.trim()) await window.atoumweb.crm.contactMethods.save({ organizationId, type: 'phone', value: draft.phone.trim(), label: 'Accueil / principal', isPrimary: true });
      }
      const normalized = draft.estimatedValueEuros.trim().replace(',', '.');
      const estimatedValueCents = normalized ? Math.round(Number(normalized) * 100) : null;
      if (estimatedValueCents != null && (!Number.isFinite(estimatedValueCents) || estimatedValueCents < 0)) throw new Error('Valeur estimée invalide.');
      const prospect = await window.atoumweb.crm.prospects.create({ organizationId, contactId, stage: 'new', temperature: draft.temperature, source: draft.source, sourceDetail: draft.source === 'other' ? draft.sourceDetail.trim() || null : null, estimatedValueCents });
      for (const need of needsDraft.filter((item) => item.catalogItemId || item.otherText?.trim())) await window.atoumweb.workflow.saveNeed('prospect', prospect.id, need);
      if (draft.firstActionText.trim() || draft.firstActionDate) await window.atoumweb.crm.actions.create({ ownerType: 'prospect', ownerId: prospect.id, type: 'action', title: draft.firstActionText.trim() || 'Première prise de contact', dueAt: draft.firstActionDate ? new Date(`${draft.firstActionDate}T09:00:00`).toISOString() : null });
      setDraft(EMPTY_DRAFT); setNeedsDraft([]); setShowForm(false); await refresh(); setSelectedId(prospect.id); setExpandedId(prospect.id); onMessage('Prospect créé. Tu peux maintenant commencer la prospection.');
    } catch (e) { setFormError(e instanceof Error ? e.message : 'Création impossible.'); }
    finally { setSaving(false); }
  }

  async function updateTemperature(prospect: ProspectSummary, temperature: ProspectTemperature) {
    await window.atoumweb.crm.prospects.update(prospect.id, { ...prospect, temperature });
    await refresh(); onMessage(`État commercial : ${TEMPERATURE_LABELS[temperature]}.`);
  }

  async function changeStage(prospect: ProspectSummary, stage: ProspectStage) {
    if (stage === prospect.stage || !ACTIVE_STAGES.includes(stage)) return;
    try { await window.atoumweb.crm.prospects.changeStage(prospect.id, stage); await refresh(); onMessage(`Prospect déplacé vers « ${STAGE_LABELS[stage]} ».`); }
    catch (e) { onMessage(e instanceof Error ? e.message : 'Changement d’étape impossible.'); }
  }

  async function createQuote(prospect: ProspectSummary) {
    try {
      const [needs, catalog] = await Promise.all([window.atoumweb.workflow.needs('prospect', prospect.id), window.atoumweb.catalog.list({ status: 'active' })]);
      if (!needs.length) { onMessage('Ajoute au moins un besoin avant de créer le devis.'); return; }
      const byId = new Map<string, CatalogItemSummary>(catalog.map((item) => [item.id, item]));
      const lines = needs.map((need) => {
        if (need.catalogItemId) {
          const item = byId.get(need.catalogItemId); const versionId = item?.currentVersion?.id;
          if (versionId) return {
            catalogVersionId: versionId,
            input: {
              label: item?.name ?? need.label,
              proposedUnitPriceCents: item?.currentVersion?.priceCents ?? 0,
            },
          };
        }
        return { input: { label: need.label || need.otherText || 'Prestation à chiffrer', proposedUnitPriceCents: 0, catalogUnitPriceCents: 0 } };
      });
      const quote = await window.atoumweb.quotes.createWithLines({ prospectId: prospect.id, subject: prospect.projectSummary?.trim() || needs.map((item) => item.label).join(' + '), needSummary: needs.map((item) => item.label).join(' · ') }, lines);
      await refresh(); onMessage(`Devis ${quote.number} créé en préparation avec les prestations du prospect.`); window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) { onMessage(e instanceof Error ? e.message : 'Création du devis impossible.'); }
  }

  async function scheduleQuick(prospect: ProspectSummary, days: number) {
    const d = new Date(); d.setDate(d.getDate() + days); d.setHours(9, 0, 0, 0);
    const quoteFollowUp = isQuoteFollowUpStage(prospect.stage);
    await window.atoumweb.crm.actions.create({
      ownerType: 'prospect',
      ownerId: prospect.id,
      type: quoteFollowUp ? 'follow_up' : 'action',
      title: quoteFollowUp ? 'Relancer le prospect' : 'Rappeler le prospect',
      dueAt: d.toISOString(),
    });
    await refresh(); onMessage(quoteFollowUp ? 'Relance du devis programmée.' : 'Rappel de prospection programmé.');
  }

  async function addAction(prospect: ProspectSummary) {
    const title = window.prompt('Action à réaliser', 'Recontacter le prospect'); if (!title?.trim()) return;
    const date = window.prompt('Date (AAAA-MM-JJ, facultative)', '');
    await window.atoumweb.crm.actions.create({ ownerType: 'prospect', ownerId: prospect.id, type: 'action', title: title.trim(), dueAt: date?.trim() ? new Date(`${date.trim()}T09:00:00`).toISOString() : null });
    await refresh();
  }

  async function completeAction(action: CrmAction) {
    const channel = window.prompt('Canal utilisé : téléphone, email, SMS, rendez-vous, autre', action.type === 'follow_up' ? 'téléphone' : ''); if (channel === null) return;
    const outcome = window.prompt('Résultat : client joint, message laissé, email envoyé, pas de réponse, retour attendu, demande de modification…', 'réalisée'); if (outcome === null) return;
    const notes = window.prompt('Compte rendu / information importante', ''); if (notes === null) return;
    await window.atoumweb.crm.actions.complete(action.id, { channel, outcome, notes }); await refresh();
  }

  async function archive(prospect: ProspectSummary) { await window.atoumweb.workflow.archiveProspect(prospect.id, true); setSelectedId(null); await refresh(); onMessage('Prospect archivé.'); }

  async function markLost(prospect: ProspectSummary) {
    const first = window.prompt(`Raison de perte :\n${LOST_REASONS.join(' / ')}`, 'Pas de réponse'); if (!first?.trim()) return;
    await window.atoumweb.crm.prospects.changeStage(prospect.id, 'lost', first.trim()); setSelectedId(null); await refresh(); onMessage('Prospect classé perdu.');
  }

  async function handleDrop(stage: ProspectStage) { const prospect = prospects.find((item) => item.id === draggingId); setDraggingId(null); setDropStage(null); if (prospect) await changeStage(prospect, stage); }

  return <div className="crm-stack prospects-v2">
    <div className="prospect-view-switch" role="tablist"><button className={view === 'pipeline' ? 'active' : ''} onClick={() => setView('pipeline')}>Pipeline <span>{active.length}</span></button><button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>Historique <span>{closed.length}</span></button></div>
    {view === 'pipeline' ? <>
      <div className="module-toolbar prospect-toolbar"><div><strong>{active.length}</strong><span> prospect{active.length > 1 ? 's' : ''} actif{active.length > 1 ? 's' : ''}</span></div><div className="toolbar-controls"><button className="secondary-button" onClick={() => void refresh()}>↻ Actualiser</button><button className="primary-button" onClick={() => setShowForm((v) => !v)}>{showForm ? 'Fermer' : '+ Nouveau prospect'}</button></div></div>
      {showForm && <form className="panel crm-form prospect-create-v2" onSubmit={(e) => void submitProspect(e)}><div className="panel-title"><div><span className="eyebrow">Prospect</span><h2>Nouveau contact commercial</h2><p className="muted">Identifie la structure et l’interlocuteur. Le besoin peut être précisé plus tard pendant la qualification.</p></div></div><div className="form-grid">
        <label>Société <FieldHelp text="Nom commercial ou nom de la structure." /><input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} /></label>
        <label>Activité / type de structure <FieldHelp text="Ex. artisan, restaurant, commerçant, association, profession libérale…" /><input value={draft.industry} onChange={(e) => setDraft({ ...draft, industry: e.target.value })} placeholder="Ex. artisan cirier" /></label>
        <label>Site web<input type="url" value={draft.website} onChange={(e) => setDraft({ ...draft, website: e.target.value })} placeholder="https://…" /></label>
        <label className="form-span-3">Description de l’activité <FieldHelp text="Quelques mots pour comprendre rapidement ce que fait l’entreprise et son positionnement." /><textarea value={draft.activityDescription} onChange={(e) => setDraft({ ...draft, activityDescription: e.target.value })} /></label>
        <label>Adresse<input value={draft.addressLine1} onChange={(e) => setDraft({ ...draft, addressLine1: e.target.value })} /></label><label>Complément<input value={draft.addressLine2} onChange={(e) => setDraft({ ...draft, addressLine2: e.target.value })} /></label><label>Code postal<input value={draft.postalCode} onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })} /></label><label>Ville<input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></label><label>Pays<input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} /></label>
        <label>Prénom interlocuteur<input value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} /></label><label>Nom interlocuteur<input value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} /></label><label>Fonction<input value={draft.jobTitle} onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })} placeholder="Gérant, responsable…" /></label><label>Email<input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label><label>Téléphone<input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
        <label>Source <FieldHelp text="Permet de savoir comment le prospect a connu AtoumWeb et d’identifier les canaux efficaces." /><select value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value as ProspectSource })}>{PROSPECT_SOURCES.map((source) => <option key={source} value={source}>{SOURCE_LABELS[source]}</option>)}</select></label>{draft.source === 'other' && <label>Préciser la source<input value={draft.sourceDetail} onChange={(e) => setDraft({ ...draft, sourceDetail: e.target.value })} /></label>}
        <label>État commercial<select value={draft.temperature} onChange={(e) => setDraft({ ...draft, temperature: e.target.value as ProspectTemperature })}>{PROSPECT_TEMPERATURES.map((temperature) => <option key={temperature} value={temperature}>{TEMPERATURE_LABELS[temperature]}</option>)}</select></label><label>Valeur estimée (€)<input inputMode="decimal" value={draft.estimatedValueEuros} onChange={(e) => setDraft({ ...draft, estimatedValueEuros: e.target.value })} /></label>
        <NeedDraftSelector value={needsDraft} onChange={setNeedsDraft} />
        <label>Première action — date<input type="date" value={draft.firstActionDate} onChange={(e) => setDraft({ ...draft, firstActionDate: e.target.value })} /></label><label className="form-span-2">Première action<input value={draft.firstActionText} onChange={(e) => setDraft({ ...draft, firstActionText: e.target.value })} placeholder="Ex. appeler pour qualifier le besoin" /></label>
      </div>{formError && <p className="form-error">{formError}</p>}<div className="form-actions"><button className="primary-button" disabled={saving} type="submit">{saving ? 'Création…' : 'Créer le prospect'}</button></div></form>}
      {loading ? <div className="panel"><p className="muted">Chargement…</p></div> : <div className={selected ? 'prospects-layout with-detail' : 'prospects-layout'}><div className="kanban-board">{ACTIVE_STAGES.map((stage) => <section className={`kanban-column ${dropStage === stage ? 'drag-over' : ''}`} key={stage} onDragOver={(e) => e.preventDefault()} onDragEnter={() => setDropStage(stage)} onDrop={(e) => { e.preventDefault(); void handleDrop(stage); }}><header><strong>{STAGE_LABELS[stage]}</strong><span>{byStage.get(stage)?.length ?? 0}</span></header><div className="kanban-cards stacked-cards">{(byStage.get(stage) ?? []).map((prospect) => { const expanded = expandedId === prospect.id; const itemActions = actions.filter((a) => a.ownerId === prospect.id && a.status === 'open'); const quoteFollowUp = isQuoteFollowUpStage(prospect.stage); return <article className={`prospect-card stacked-card prospect-temperature-${prospect.temperature ?? 'neutral'} ${expanded ? 'expanded-card' : 'collapsed-card'} ${selectedId === prospect.id ? 'selected-prospect' : ''}`} key={prospect.id}><div className="prospect-card-head card-drag-handle" draggable onDragStart={(e) => { setDraggingId(prospect.id); e.dataTransfer.setData('text/plain', prospect.id); }} onClick={() => { setSelectedId(prospect.id); setExpandedId((id) => id === prospect.id ? null : prospect.id); }}><strong>{prospect.displayName}</strong><span className={`temperature temperature-${prospect.temperature ?? 'neutral'}`}>{TEMPERATURE_LABELS[prospect.temperature ?? 'neutral']}</span></div><div className="prospect-card-body"><small>{prospect.secondaryLabel || 'Interlocuteur à préciser'}</small><p>{prospect.primaryNeed || 'Besoin à préciser'}</p><small>{prospect.estimatedValueCents != null ? `${(prospect.estimatedValueCents / 100).toLocaleString('fr-FR')} €` : 'Valeur non estimée'}</small><div className="card-state-control"><label>État commercial<select value={prospect.temperature ?? 'neutral'} onChange={(e) => void updateTemperature(prospect, e.target.value as ProspectTemperature)}>{PROSPECT_TEMPERATURES.map((temp) => <option key={temp} value={temp}>{TEMPERATURE_LABELS[temp]}</option>)}</select></label></div>{itemActions.slice(0, 2).map((action) => <div className="card-action-line" key={action.id}><span>{action.type === 'follow_up' ? 'Relance' : 'Action'}</span><strong>{action.title}</strong><small>{formatDate(action.dueAt)}</small></div>)}<div className="quick-followups"><button onClick={() => void scheduleQuick(prospect, 1)}>{quoteFollowUp ? 'Relance demain' : 'Rappel demain'}</button><button onClick={() => void scheduleQuick(prospect, 7)}>+7 j</button><button onClick={() => void addAction(prospect)}>+ Action</button></div><select aria-label="Étape" value={prospect.stage} onChange={(e) => void changeStage(prospect, e.target.value as ProspectStage)}>{ACTIVE_STAGES.map((item) => <option key={item} value={item}>{STAGE_LABELS[item]}</option>)}</select></div></article>; })}{(byStage.get(stage)?.length ?? 0) === 0 && <div className="kanban-empty">Déposer ici</div>}</div></section>)}</div>{selected && <ProspectDetailV2 prospect={selected} actions={selectedActions} activity={activity} onRefresh={(message) => { void refresh(); if (message) onMessage(message); }} onClose={() => setSelectedId(null)} onTemperature={(temperature) => void updateTemperature(selected, temperature)} onStage={(stage) => void changeStage(selected, stage)} onCreateQuote={() => void createQuote(selected)} onAddAction={() => void addAction(selected)} onComplete={(action) => void completeAction(action)} onLost={() => void markLost(selected)} onArchive={() => void archive(selected)} />}</div>}
    </> : <HistoryView prospects={closed.filter((item) => [item.displayName, item.primaryNeed, item.lostReason].filter(Boolean).join(' ').toLocaleLowerCase('fr-FR').includes(historySearch.toLocaleLowerCase('fr-FR')))} search={historySearch} onSearch={setHistorySearch} onSelect={(item) => setSelectedId(item.id)} selected={selected} activity={activity} onClose={() => setSelectedId(null)} />}
  </div>;
}

function ProspectDetailV2({ prospect, actions, activity, onRefresh, onClose, onTemperature, onStage, onCreateQuote, onAddAction, onComplete, onLost, onArchive }: { prospect: ProspectSummary; actions: CrmAction[]; activity: ActivityEvent[]; onRefresh: (message?: string) => void; onClose: () => void; onTemperature: (value: ProspectTemperature) => void; onStage: (value: ProspectStage) => void; onCreateQuote: () => void; onAddAction: () => void; onComplete: (action: CrmAction) => void; onLost: () => void; onArchive: () => void }) {
  const openActions = actions.filter((item) => item.status === 'open');
  return <aside className="panel prospect-detail-panel prospect-detail-v2"><div className="detail-panel-heading"><div><span className="eyebrow">Fiche prospect</span><h2>{prospect.displayName}</h2></div><button className="close-detail" onClick={onClose}>×</button></div>
    <div className="prospect-controls-v2"><label>État commercial<select value={prospect.temperature ?? 'neutral'} onChange={(e) => onTemperature(e.target.value as ProspectTemperature)}>{PROSPECT_TEMPERATURES.map((value) => <option key={value} value={value}>{TEMPERATURE_LABELS[value]}</option>)}</select></label><label>Étape<select value={prospect.stage} onChange={(e) => onStage(e.target.value as ProspectStage)}>{ACTIVE_STAGES.map((value) => <option key={value} value={value}>{STAGE_LABELS[value]}</option>)}</select></label></div>
    <div className="detail-badges"><span className={`temperature temperature-${prospect.temperature ?? 'neutral'}`}>{TEMPERATURE_LABELS[prospect.temperature ?? 'neutral']}</span><span className="status-pill">{STAGE_LABELS[prospect.stage ?? 'new']}</span>{prospect.source && <span className="status-pill">{SOURCE_LABELS[prospect.source]}{prospect.source === 'other' && prospect.sourceDetail ? ` · ${prospect.sourceDetail}` : ''}</span>}</div>
    {prospect.stage === 'new' && <button className="primary-button start-qualification-button" onClick={() => onStage('qualifying')}>Commencer la prospection / qualification</button>}
    <ProspectIdentityPanel prospect={prospect} onSaved={() => onRefresh('Informations du prospect mises à jour.')} />
    <ProspectQuotePanel prospect={prospect} onChanged={onRefresh} />
    <ProspectNeedsPanel prospectId={prospect.id} onChanged={() => onRefresh()} />
    {(prospect.stage === 'qualifying' || prospect.stage === 'need_identified') && <ProspectQualificationPanelV2 prospect={prospect} onSaved={onRefresh} />}
    {prospect.stage === 'need_identified' && <button className="primary-button create-quote-button" onClick={onCreateQuote}>Créer le devis depuis les besoins</button>}
    <section className="prospect-work-section"><div className="work-section-heading"><div><span className="eyebrow">Actions & relances</span><strong>{openActions.length} en cours</strong></div><button className="secondary-button compact-button" onClick={onAddAction}>+ Action</button></div>{openActions.length === 0 ? <p className="muted">Aucune action en cours.</p> : <div className="work-items">{openActions.map((action) => <div className="work-item" key={action.id}><button className="work-check" onClick={() => onComplete(action)}>✓</button><div className="work-item-main"><strong>{action.title}</strong><small>{action.type === 'follow_up' ? 'Relance' : 'Action'} · {formatDate(action.dueAt)}{action.notes ? ` · ${action.notes}` : ''}</small></div></div>)}</div>}</section>
    <div className="detail-actions"><button className="secondary-button danger-outline" onClick={onLost}>Perdu</button><button className="secondary-button" onClick={onArchive}>Archiver le prospect</button></div>
    <div className="activity-preview"><strong>Journal du dossier</strong>{activity.slice(0, 20).map((event) => <div className="activity-item" key={event.id}><span className="activity-dot" /><div><p>{humanActivity(event.summary)}</p><small>{new Date(event.createdAt).toLocaleString('fr-FR')}</small></div></div>)}{activity.length === 0 && <p className="muted">Aucune activité.</p>}</div>
  </aside>;
}

function HistoryView({ prospects, search, onSearch, onSelect, selected, activity, onClose }: { prospects: ProspectSummary[]; search: string; onSearch: (value: string) => void; onSelect: (item: ProspectSummary) => void; selected: ProspectSummary | null; activity: ActivityEvent[]; onClose: () => void }) {
  return <div className="history-view-stack"><div className="module-toolbar"><div><strong>{prospects.length}</strong><span> dossier(s)</span></div><input className="inline-search" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Rechercher l’historique…" /></div><div className={selected ? 'prospects-layout with-detail' : 'prospects-layout'}><section className="panel history-prospects-panel"><div className="history-prospect-list">{prospects.map((item) => <button className="history-prospect-row" key={item.id} onClick={() => onSelect(item)}><div><strong>{item.displayName}</strong><small>{item.secondaryLabel || 'Contact non renseigné'}</small></div><span className={`history-outcome ${item.stage === 'lost' ? 'lost' : 'won'}`}>{item.stage === 'lost' ? 'Perdu' : 'Gagné / Client'}</span><span>{item.primaryNeed || '—'}</span><span>{item.estimatedValueCents != null ? `${item.estimatedValueCents / 100} €` : '—'}</span><span>{formatDate(item.lostAt || item.wonAt)}</span></button>)}</div></section>{selected && <aside className="panel prospect-detail-panel"><div className="detail-panel-heading"><div><span className="eyebrow">Historique</span><h2>{selected.displayName}</h2></div><button className="close-detail" onClick={onClose}>×</button></div><div className="summary-list"><div className="summary-line"><span>Issue</span><strong>{selected.stage === 'lost' ? 'Perdu' : 'Gagné / Client'}</strong></div><div className="summary-line"><span>Besoin</span><strong>{selected.primaryNeed || '—'}</strong></div>{selected.lostReason && <div className="summary-line"><span>Raison</span><strong>{selected.lostReason}</strong></div>}</div><div className="activity-preview"><strong>Journal</strong>{activity.map((event) => <div className="activity-item" key={event.id}><span className="activity-dot" /><div><p>{humanActivity(event.summary)}</p><small>{new Date(event.createdAt).toLocaleString('fr-FR')}</small></div></div>)}</div></aside>}</div></div>;
}
