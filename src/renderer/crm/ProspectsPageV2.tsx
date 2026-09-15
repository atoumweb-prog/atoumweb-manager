import { useEffect, useMemo, useState, type FormEvent } from 'react';
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
import { ProspectActionsPanel } from './ProspectActionsPanel';
import { ProspectIdentityPanel } from './ProspectIdentityPanel';
import { ProspectNeedsPanel } from './ProspectNeedsPanel';
import { FieldHelp, ProspectQualificationPanelV2 } from './ProspectQualificationPanelV2';
import { ProspectQuotePanel } from './ProspectQuotePanel';

const ACTIVE_STAGES: ProspectStage[] = ['new', 'qualifying', 'need_identified', 'quote_to_prepare', 'quote_to_send', 'quote_sent', 'follow_up', 'negotiation', 'waiting'];
const STAGE_LABELS: Record<ProspectStage, string> = {
  new: 'Nouveau contact',
  qualifying: 'À qualifier',
  need_identified: 'Besoin à identifier',
  quote_to_prepare: 'Devis à préparer',
  quote_to_send: 'Devis à envoyer',
  quote_sent: 'En attente de retour',
  follow_up: 'À relancer',
  negotiation: 'Négociation',
  waiting: 'En attente',
  won: 'Gagné',
  lost: 'Perdu',
};
const TEMPERATURE_LABELS: Record<ProspectTemperature, string> = { cold: 'Froid', neutral: 'Neutre', warm: 'Tiède', hot: 'Chaud' };
const SOURCE_LABELS: Record<ProspectSource, string> = {
  website: 'Demande entrante · Site web',
  referral: 'Recommandation',
  google: 'Demande entrante · Google',
  social: 'Demande entrante · Réseaux sociaux',
  event: 'Événement / rencontre',
  outbound: 'Prospection AtoumWeb',
  former_client: 'Ancien client / relation existante',
  other: 'Autre',
};
const LOSS_REASONS = [
  ['too_expensive', 'Trop cher'],
  ['competitor', 'Concurrent choisi'],
  ['abandoned', 'Projet abandonné'],
  ['no_response', 'Pas de réponse'],
  ['timing', 'Délai incompatible'],
  ['out_of_scope', 'Besoin hors périmètre AtoumWeb'],
  ['other', 'Autre'],
] as const;
const QUOTE_FOLLOW_UP_STAGES: ProspectStage[] = ['quote_sent', 'follow_up', 'negotiation', 'waiting'];
const QUOTE_VISIBLE_STAGES: ProspectStage[] = ['quote_to_prepare', 'quote_to_send', 'quote_sent', 'follow_up', 'negotiation', 'waiting'];
const MANUAL_STAGE_OPTIONS: Record<ProspectStage, ProspectStage[]> = {
  new: ['new', 'qualifying'],
  qualifying: ['qualifying', 'new', 'need_identified'],
  need_identified: ['need_identified', 'qualifying'],
  quote_to_prepare: ['quote_to_prepare'],
  quote_to_send: ['quote_to_send'],
  quote_sent: ['quote_sent', 'follow_up', 'negotiation', 'waiting'],
  follow_up: ['follow_up', 'quote_sent', 'negotiation', 'waiting'],
  negotiation: ['negotiation', 'follow_up', 'waiting'],
  waiting: ['waiting', 'quote_sent', 'follow_up', 'negotiation'],
  won: ['won'],
  lost: ['lost'],
};

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
function manualStages(prospect: ProspectSummary): ProspectStage[] { return MANUAL_STAGE_OPTIONS[prospect.stage ?? 'new'].filter((stage) => ACTIVE_STAGES.includes(stage)); }
function cleanBusinessError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  return error.message
    .replace(/^Error invoking remote method ['"][^'"]+['"]:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim() || fallback;
}
function humanActivity(summary: string) {
  return summary.replace(/\bnew\b/g, 'Nouveau contact').replace(/\bqualifying\b/g, 'À qualifier').replace(/\bneed_identified\b/g, 'Besoin à identifier').replace(/\bquote_to_prepare\b/g, 'Devis à préparer').replace(/\bquote_to_send\b/g, 'Devis à envoyer').replace(/\bquote_sent\b/g, 'En attente de retour').replace(/\bfollow_up\b/g, 'À relancer').replace(/\bnegotiation\b/g, 'Négociation').replace(/\bwaiting\b/g, 'En attente').replace(/\bwon\b/g, 'Gagné').replace(/\blost\b/g, 'Perdu');
}
function nextOpenAction(actions: CrmAction[]): CrmAction | null {
  return [...actions]
    .filter((item) => item.status === 'open')
    .sort((a, b) => {
      if (!a.dueAt && !b.dueAt) return a.createdAt.localeCompare(b.createdAt);
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return a.dueAt.localeCompare(b.dueAt);
    })[0] ?? null;
}

export function ProspectsPage({ onMessage, initialId }: { onMessage: (message: string) => void; initialId?: string | null }) {
  const [prospects, setProspects] = useState<ProspectSummary[]>([]);
  const [actions, setActions] = useState<CrmAction[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [view, setView] = useState<View>('pipeline');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<ProspectDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deskModeId, setDeskModeId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<ProspectStage | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [scheduleDateForId, setScheduleDateForId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const [nextProspects, nextActions] = await Promise.all([window.atoumweb.crm.prospects.list({ includeArchived: true }), window.atoumweb.crm.actions.list({ ownerType: 'prospect' })]);
      setProspects(nextProspects); setActions(nextActions);
      if (selectedId && !nextProspects.some((item) => item.id === selectedId)) setSelectedId(null);
      if (deskModeId && !nextProspects.some((item) => item.id === deskModeId)) setDeskModeId(null);
    } finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);
  useEffect(() => { if (!selectedId) { setActivity([]); return; } void window.atoumweb.crm.activity.list('prospect', selectedId).then(setActivity); }, [selectedId, prospects, actions]);
  useEffect(() => { const reload = () => void refresh(); window.addEventListener('atoumweb:changed', reload); return () => window.removeEventListener('atoumweb:changed', reload); }, []);

  const active = useMemo(() => prospects.filter((item) => !isClosed(item)), [prospects]);
  const closed = useMemo(() => prospects.filter(isClosed), [prospects]);
  const selected = prospects.find((item) => item.id === selectedId) ?? null;
  const deskProspect = prospects.find((item) => item.id === deskModeId) ?? null;
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
      if (draft.firstActionText.trim() || draft.firstActionDate) await window.atoumweb.crm.actions.create({ ownerType: 'prospect', ownerId: prospect.id, type: 'action', title: draft.firstActionText.trim() || 'Première prise de contact', dueAt: draft.firstActionDate ? new Date(`${draft.firstActionDate}T09:00:00`).toISOString() : null });
      setDraft(EMPTY_DRAFT); setShowForm(false); await refresh(); setSelectedId(prospect.id); setExpandedId(prospect.id); onMessage('Prospect créé. Il reste en « Nouveau contact » jusqu’au démarrage de la prospection.');
    } catch (e) { setFormError(cleanBusinessError(e, 'Création impossible.')); }
    finally { setSaving(false); }
  }

  async function updateTemperature(prospect: ProspectSummary, temperature: ProspectTemperature) {
    try {
      await window.atoumweb.crm.prospects.update(prospect.id, { ...prospect, temperature });
      await refresh(); onMessage(`Température commerciale : ${TEMPERATURE_LABELS[temperature]}.`);
    } catch (e) { onMessage(cleanBusinessError(e, 'Modification de la température commerciale impossible.')); }
  }

  async function changeStage(prospect: ProspectSummary, stage: ProspectStage) {
    if (stage === prospect.stage || !ACTIVE_STAGES.includes(stage)) return;
    try {
      await window.atoumweb.crm.prospects.changeStage(prospect.id, stage);
      await refresh();
      onMessage(`Prospect déplacé vers « ${STAGE_LABELS[stage]} ».`);
    } catch (e) {
      onMessage(`Impossible d’avancer ce prospect : ${cleanBusinessError(e, 'vérifie les informations nécessaires à cette étape.')}`);
    }
  }

  async function startProspecting(prospect: ProspectSummary) {
    if (prospect.stage === 'new') await changeStage(prospect, 'qualifying');
    setSelectedId(prospect.id);
    setDeskModeId(prospect.id);
  }

  async function scheduleAt(prospect: ProspectSummary, dueAt: Date) {
    try {
      const quoteFollowUp = isQuoteFollowUpStage(prospect.stage);
      await window.atoumweb.crm.actions.create({
        ownerType: 'prospect',
        ownerId: prospect.id,
        type: quoteFollowUp ? 'follow_up' : 'action',
        title: quoteFollowUp ? 'Relancer le prospect' : 'Rappeler le prospect',
        dueAt: dueAt.toISOString(),
      });
      setScheduleDateForId(null);
      setScheduleDate('');
      await refresh();
      onMessage(quoteFollowUp ? 'Relance du devis programmée.' : 'Rappel programmé.');
    } catch (e) { onMessage(cleanBusinessError(e, 'Programmation impossible.')); }
  }

  async function scheduleQuick(prospect: ProspectSummary, days: number) {
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + days);
    dueAt.setHours(9, 0, 0, 0);
    await scheduleAt(prospect, dueAt);
  }

  async function scheduleExact(prospect: ProspectSummary) {
    if (!scheduleDate) { onMessage('Choisis une date pour programmer le rappel.'); return; }
    await scheduleAt(prospect, new Date(`${scheduleDate}T09:00:00`));
  }

  async function archive(prospect: ProspectSummary) { await window.atoumweb.workflow.archiveProspect(prospect.id, true); setSelectedId(null); setDeskModeId(null); await refresh(); onMessage('Prospect archivé.'); }

  async function markLost(prospect: ProspectSummary, reasonCode: string, reasonText: string) {
    if (!reasonText.trim()) return;
    try {
      await window.atoumweb.crm.prospects.updateQualification(prospect.id, { lostReasonCode: reasonCode });
      await window.atoumweb.crm.prospects.changeStage(prospect.id, 'lost', reasonText.trim());
      setSelectedId(null); setDeskModeId(null); await refresh(); onMessage('Prospect classé perdu.');
    } catch (e) { onMessage(cleanBusinessError(e, 'Classement en perdu impossible.')); }
  }

  async function handleDrop(stage: ProspectStage) {
    const prospect = prospects.find((item) => item.id === draggingId);
    setDraggingId(null); setDropStage(null);
    if (!prospect) return;
    if (!manualStages(prospect).includes(stage)) {
      onMessage(`Le passage vers « ${STAGE_LABELS[stage]} » se fait par l’action métier correspondante.`);
      return;
    }
    await changeStage(prospect, stage);
  }

  const detail = selected ? <ProspectDetailV2
    prospect={selected}
    actions={selectedActions}
    activity={activity}
    mode="panel"
    onRefresh={(message) => { void refresh(); if (message) onMessage(message); }}
    onClose={() => setSelectedId(null)}
    onOpenDesk={() => setDeskModeId(selected.id)}
    onTemperature={(temperature) => void updateTemperature(selected, temperature)}
    onStart={() => void startProspecting(selected)}
    onLost={(code, reason) => void markLost(selected, code, reason)}
    onArchive={() => void archive(selected)}
  /> : null;

  return <div className="crm-stack prospects-v2">
    <div className="prospect-view-switch" role="tablist"><button className={view === 'pipeline' ? 'active' : ''} onClick={() => setView('pipeline')}>Pipeline <span>{active.length}</span></button><button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>Historique <span>{closed.length}</span></button></div>
    {view === 'pipeline' ? <>
      <div className="module-toolbar prospect-toolbar"><div><strong>{active.length}</strong><span> prospect{active.length > 1 ? 's' : ''} actif{active.length > 1 ? 's' : ''}</span></div><div className="toolbar-controls"><button className="secondary-button" onClick={() => void refresh()}>↻ Actualiser</button><button className="primary-button" onClick={() => setShowForm((v) => !v)}>{showForm ? 'Fermer' : '+ Nouveau prospect'}</button></div></div>
      {showForm && <form className="panel crm-form prospect-create-v2" onSubmit={(e) => void submitProspect(e)}><div className="panel-title"><div><span className="eyebrow">Prospect</span><h2>Nouveau contact commercial</h2><p className="muted">Enregistre l’identité, l’origine du contact et les coordonnées. Le besoin sera travaillé ensuite dans le parcours commercial.</p></div></div><div className="form-grid">
        <label>Société <FieldHelp text="Nom commercial ou nom de la structure." /><input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} /></label>
        <label>Activité / type de structure <FieldHelp text="Ex. artisan, restaurant, commerçant, association, profession libérale…" /><input value={draft.industry} onChange={(e) => setDraft({ ...draft, industry: e.target.value })} placeholder="Ex. restaurant" /></label>
        <label>Site web<input type="url" value={draft.website} onChange={(e) => setDraft({ ...draft, website: e.target.value })} placeholder="https://…" /></label>
        <label className="form-span-3">Description de l’activité <FieldHelp text="Quelques mots pour comprendre rapidement ce que fait l’entreprise et son positionnement." /><textarea value={draft.activityDescription} onChange={(e) => setDraft({ ...draft, activityDescription: e.target.value })} /></label>
        <label>Adresse<input value={draft.addressLine1} onChange={(e) => setDraft({ ...draft, addressLine1: e.target.value })} /></label><label>Complément<input value={draft.addressLine2} onChange={(e) => setDraft({ ...draft, addressLine2: e.target.value })} /></label><label>Code postal<input value={draft.postalCode} onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })} /></label><label>Ville<input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></label><label>Pays<input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} /></label>
        <label>Prénom interlocuteur<input value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} /></label><label>Nom interlocuteur<input value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} /></label><label>Fonction<input value={draft.jobTitle} onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })} placeholder="Gérant, responsable…" /></label><label>Email<input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label><label>Téléphone<input inputMode="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
        <label>Origine du contact <FieldHelp text="Le parcours de qualification s’adaptera à l’origine du prospect." /><select value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value as ProspectSource })}>{PROSPECT_SOURCES.map((source) => <option key={source} value={source}>{SOURCE_LABELS[source]}</option>)}</select></label>{draft.source === 'other' && <label>Préciser l’origine<input value={draft.sourceDetail} onChange={(e) => setDraft({ ...draft, sourceDetail: e.target.value })} placeholder="Partenaire, apporteur, autre…" /></label>}
        <label>Température commerciale<select value={draft.temperature} onChange={(e) => setDraft({ ...draft, temperature: e.target.value as ProspectTemperature })}>{PROSPECT_TEMPERATURES.map((temperature) => <option key={temperature} value={temperature}>{TEMPERATURE_LABELS[temperature]}</option>)}</select></label><label>Valeur estimée (€)<input inputMode="decimal" value={draft.estimatedValueEuros} onChange={(e) => setDraft({ ...draft, estimatedValueEuros: e.target.value })} /></label>
        <label>Première action — date<input type="date" value={draft.firstActionDate} onChange={(e) => setDraft({ ...draft, firstActionDate: e.target.value })} /></label><label className="form-span-2">Première action<input value={draft.firstActionText} onChange={(e) => setDraft({ ...draft, firstActionText: e.target.value })} placeholder="Ex. appeler le prospect" /></label>
      </div>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="form-actions"><button className="primary-button" disabled={saving} type="submit">{saving ? 'Création…' : 'Créer le prospect'}</button></div></form>}
      {loading ? <div className="panel"><p className="muted">Chargement…</p></div> : <div className={selected && !deskProspect ? 'prospects-layout with-detail' : 'prospects-layout'}><div className="kanban-board">{ACTIVE_STAGES.map((stage) => <section className={`kanban-column ${dropStage === stage ? 'drag-over' : ''}`} key={stage} onDragOver={(e) => e.preventDefault()} onDragEnter={() => setDropStage(stage)} onDrop={(e) => { e.preventDefault(); void handleDrop(stage); }}><header><strong>{STAGE_LABELS[stage]}</strong><span>{byStage.get(stage)?.length ?? 0}</span></header><div className="kanban-cards stacked-cards">{(byStage.get(stage) ?? []).map((prospect) => { const expanded = expandedId === prospect.id; const itemActions = actions.filter((a) => a.ownerId === prospect.id && a.status === 'open'); const quoteFollowUp = isQuoteFollowUpStage(prospect.stage); const nextAction = nextOpenAction(itemActions); return <article className={`prospect-card stacked-card prospect-temperature-${prospect.temperature ?? 'neutral'} ${expanded ? 'expanded-card' : 'collapsed-card'} ${selectedId === prospect.id ? 'selected-prospect' : ''}`} key={prospect.id}><div className="prospect-card-head card-drag-handle" draggable onDragStart={(e) => { setDraggingId(prospect.id); e.dataTransfer.setData('text/plain', prospect.id); }} onClick={() => { setSelectedId(prospect.id); setExpandedId((id) => id === prospect.id ? null : prospect.id); }}><strong>{prospect.displayName}</strong><span className={`temperature temperature-${prospect.temperature ?? 'neutral'}`}>{TEMPERATURE_LABELS[prospect.temperature ?? 'neutral']}</span></div><div className="prospect-card-body"><small>{prospect.secondaryLabel || 'Interlocuteur à préciser'}</small><p>{prospect.primaryNeed || (prospect.stage === 'new' || prospect.stage === 'qualifying' ? 'Besoin à travailler plus tard' : 'Besoin à préciser')}</p>{prospect.estimatedValueCents != null && <small>Estimation : {(prospect.estimatedValueCents / 100).toLocaleString('fr-FR')} €</small>}{nextAction && <div className="card-action-line next-action-line"><span>Prochaine action</span><strong>{nextAction.title}</strong><small>{formatDate(nextAction.dueAt)}</small></div>}<div className="quick-followups"><button type="button" onClick={() => void scheduleQuick(prospect, 1)}>{quoteFollowUp ? 'Relance demain' : 'Rappel demain'}</button><button type="button" onClick={() => void scheduleQuick(prospect, 7)}>{quoteFollowUp ? 'Relance +7 jours' : 'Rappel +7 jours'}</button><button type="button" onClick={() => { setScheduleDateForId((id) => id === prospect.id ? null : prospect.id); setScheduleDate(''); }}>Programmer…</button></div>{scheduleDateForId === prospect.id && <div className="quick-date-scheduler"><input aria-label="Date du rappel" type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} /><button type="button" className="secondary-button" onClick={() => void scheduleExact(prospect)}>Programmer</button></div>}{prospect.stage === 'new' && <button type="button" className="primary-button card-start-button" onClick={() => void startProspecting(prospect)}>Démarrer la prospection</button>}<span className="status-pill">{STAGE_LABELS[prospect.stage ?? 'new']}</span></div></article>; })}{(byStage.get(stage)?.length ?? 0) === 0 && <div className="kanban-empty">Déposer ici</div>}</div></section>)}</div>{selected && !deskProspect && detail}</div>}
    </> : <HistoryView prospects={closed.filter((item) => [item.displayName, item.primaryNeed, item.lostReason].filter(Boolean).join(' ').toLocaleLowerCase('fr-FR').includes(historySearch.toLocaleLowerCase('fr-FR')))} search={historySearch} onSearch={setHistorySearch} onSelect={(item) => setSelectedId(item.id)} selected={selected} activity={activity} onClose={() => setSelectedId(null)} />}
    {deskProspect && <div className="prospect-desk-overlay" role="dialog" aria-modal="true" aria-label={`Fiche de travail ${deskProspect.displayName}`}><div className="prospect-desk-shell"><ProspectDetailV2 prospect={deskProspect} actions={actions.filter((item) => item.ownerId === deskProspect.id)} activity={selectedId === deskProspect.id ? activity : []} mode="desk" onRefresh={(message) => { void refresh(); if (message) onMessage(message); }} onClose={() => setDeskModeId(null)} onTemperature={(temperature) => void updateTemperature(deskProspect, temperature)} onStart={() => void startProspecting(deskProspect)} onLost={(code, reason) => void markLost(deskProspect, code, reason)} onArchive={() => void archive(deskProspect)} /></div></div>}
  </div>;
}

function ProspectDetailV2({ prospect, actions, activity, mode, onRefresh, onClose, onOpenDesk, onTemperature, onStart, onLost, onArchive }: {
  prospect: ProspectSummary;
  actions: CrmAction[];
  activity: ActivityEvent[];
  mode: 'panel' | 'desk';
  onRefresh: (message?: string) => void;
  onClose: () => void;
  onOpenDesk?: () => void;
  onTemperature: (value: ProspectTemperature) => void;
  onStart: () => void;
  onLost: (code: string, reason: string) => void;
  onArchive: () => void;
}) {
  const [lossOpen, setLossOpen] = useState(false);
  const [lossCode, setLossCode] = useState('no_response');
  const [lossOther, setLossOther] = useState('');
  const selectedLoss = LOSS_REASONS.find(([key]) => key === lossCode)?.[1] ?? 'Pas de réponse';
  const lossReason = lossCode === 'other' ? lossOther.trim() : selectedLoss;
  const quoteVisible = QUOTE_VISIBLE_STAGES.includes(prospect.stage ?? 'new');

  return <aside className={`panel prospect-detail-panel prospect-detail-v2 prospect-detail-${mode} prospect-temperature-${prospect.temperature ?? 'neutral'}`}><div className="detail-panel-heading"><div><span className="eyebrow">{mode === 'desk' ? 'Fiche de travail prospect' : 'Fiche prospect'}</span><h2>{prospect.displayName}</h2><div className="prospect-header-meta"><span className="status-pill">{STAGE_LABELS[prospect.stage ?? 'new']}</span>{prospect.source && <span className="status-pill">{SOURCE_LABELS[prospect.source]}{prospect.source === 'other' && prospect.sourceDetail ? ` · ${prospect.sourceDetail}` : ''}</span>}</div></div><div className="detail-heading-actions">{mode === 'panel' && onOpenDesk && <button className="secondary-button open-desk-button" type="button" onClick={onOpenDesk}>Ouvrir en grand</button>}<button className="close-detail" onClick={onClose}>×</button></div></div>
    <div className="prospect-temperature-control"><label>Température commerciale<select value={prospect.temperature ?? 'neutral'} onChange={(e) => onTemperature(e.target.value as ProspectTemperature)}>{PROSPECT_TEMPERATURES.map((value) => <option key={value} value={value}>{TEMPERATURE_LABELS[value]}</option>)}</select></label></div>
    {prospect.stage === 'new' && <button className="primary-button start-qualification-button" onClick={onStart}>Démarrer la prospection</button>}
    <ProspectIdentityPanel prospect={prospect} onSaved={() => onRefresh('Informations du prospect mises à jour.')} />
    {prospect.stage === 'qualifying' && <ProspectQualificationPanelV2 prospect={prospect} onSaved={onRefresh} />}
    {prospect.stage === 'need_identified' && <><ProspectNeedsPanel prospectId={prospect.id} onChanged={() => onRefresh()} /><section className="prospect-work-section prequote-gate-placeholder"><div className="work-section-heading"><div><span className="eyebrow">Étape suivante</span><strong>Contrôle avant devis</strong></div></div><p className="muted">Le passage au devis se fera ici après vérification des informations nécessaires au chiffrage. Tant que ce contrôle n’est pas validé, le prospect reste dans « Besoin à identifier ».</p><button className="primary-button" type="button" disabled>Contrôler avant devis — en cours de mise en place</button></section></>}
    {quoteVisible && <ProspectQuotePanel prospect={prospect} onChanged={onRefresh} />}
    <ProspectActionsPanel prospect={prospect} actions={actions} onChanged={onRefresh} />
    <div className="detail-actions"><button className="secondary-button danger-outline" onClick={() => setLossOpen((value) => !value)}>Perdu</button><button className="secondary-button" onClick={onArchive}>Archiver le prospect</button></div>
    {lossOpen && <div className="inline-editor prospect-loss-editor"><strong>Classer le prospect comme perdu</strong><label>Raison<select value={lossCode} onChange={(e) => setLossCode(e.target.value)}>{LOSS_REASONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>{lossCode === 'other' && <label>Préciser<input value={lossOther} onChange={(e) => setLossOther(e.target.value)} /></label>}<div className="inline-editor-actions"><button className="secondary-button" type="button" onClick={() => setLossOpen(false)}>Annuler</button><button className="secondary-button danger-outline" type="button" disabled={!lossReason} onClick={() => onLost(lossCode, lossReason)}>Confirmer Perdu</button></div></div>}
    <div className="activity-preview"><strong>Journal du dossier</strong>{activity.slice(0, 20).map((event) => <div className="activity-item" key={event.id}><span className="activity-dot" /><div><p>{humanActivity(event.summary)}</p><small>{new Date(event.createdAt).toLocaleString('fr-FR')}</small></div></div>)}{activity.length === 0 && <p className="muted">Aucune activité.</p>}</div>
  </aside>;
}

function HistoryView({ prospects, search, onSearch, onSelect, selected, activity, onClose }: { prospects: ProspectSummary[]; search: string; onSearch: (value: string) => void; onSelect: (item: ProspectSummary) => void; selected: ProspectSummary | null; activity: ActivityEvent[]; onClose: () => void }) {
  return <div className="history-view-stack"><div className="module-toolbar"><div><strong>{prospects.length}</strong><span> dossier(s)</span></div><input className="inline-search" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Rechercher l’historique…" /></div><div className={selected ? 'prospects-layout with-detail' : 'prospects-layout'}><section className="panel history-prospects-panel"><div className="history-prospect-list">{prospects.map((item) => <button className="history-prospect-row" key={item.id} onClick={() => onSelect(item)}><div><strong>{item.displayName}</strong><small>{item.secondaryLabel || 'Contact non renseigné'}</small></div><span className={`history-outcome ${item.stage === 'lost' ? 'lost' : 'won'}`}>{item.stage === 'lost' ? 'Perdu' : 'Gagné / Client'}</span><span>{item.primaryNeed || '—'}</span><span>{item.estimatedValueCents != null ? `${item.estimatedValueCents / 100} €` : '—'}</span><span>{formatDate(item.lostAt || item.wonAt)}</span></button>)}</div></section>{selected && <aside className="panel prospect-detail-panel"><div className="detail-panel-heading"><div><span className="eyebrow">Historique</span><h2>{selected.displayName}</h2></div><button className="close-detail" onClick={onClose}>×</button></div><div className="summary-list"><div className="summary-line"><span>Issue</span><strong>{selected.stage === 'lost' ? 'Perdu' : 'Gagné / Client'}</strong></div><div className="summary-line"><span>Besoin</span><strong>{selected.primaryNeed || '—'}</strong></div>{selected.lostReason && <div className="summary-line"><span>Raison</span><strong>{selected.lostReason}</strong></div>}</div><div className="activity-preview"><strong>Journal</strong>{activity.map((event) => <div className="activity-item" key={event.id}><span className="activity-dot" /><div><p>{humanActivity(event.summary)}</p><small>{new Date(event.createdAt).toLocaleString('fr-FR')}</small></div></div>)}</div></aside>}</div></div>;
}
