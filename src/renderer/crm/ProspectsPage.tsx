import { DossierPanel, NeedChoices } from '../workflow/DossierPanel';
import type { NeedInput } from '../../shared/workflow';
import {ProspectQualificationPanel} from './ProspectQualificationPanel';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  PROSPECT_SOURCES,
  PROSPECT_TEMPERATURES,
  type ActivityEvent,
  type ActionRecurrence,
  type CrmAction,
  type CrmActionType,
  type ProspectSource,
  type ProspectStage,
  type ProspectSummary,
  type ProspectTemperature,
} from '../../shared/crm';

const ACTIVE_STAGES: ProspectStage[] = [
  'new',
  'qualifying',
  'need_identified',
  'quote_to_prepare',
  'quote_to_send',
  'quote_sent',
  'follow_up',
  'negotiation',
  'waiting',
];

const STAGE_LABELS: Record<ProspectStage, string> = {
  new: 'Nouveau contact',
  qualifying: 'À qualifier',
  need_identified: 'Besoin identifié',
  quote_to_prepare: 'Devis en préparation',
  quote_to_send: 'Devis à envoyer',
  quote_sent: 'Devis envoyé',
  follow_up: 'À relancer',
  negotiation: 'Négociation',
  waiting: 'En attente',
  won: 'Gagné',
  lost: 'Perdu',
};

const TEMPERATURE_LABELS: Record<ProspectTemperature, string> = {
  cold: 'Froid',
  neutral: 'Neutre',
  warm: 'Tiède',
  hot: 'Chaud',
};

const SOURCE_LABELS: Record<ProspectSource, string> = {
  website: 'Site web',
  referral: 'Recommandation',
  google: 'Google',
  social: 'Réseaux sociaux',
  event: 'Événement',
  outbound: 'Prospection',
  former_client: 'Ancien client',
  other: 'Autre',
};

type ProspectView = 'pipeline' | 'history';
type HistoryFilter = 'all' | 'won' | 'lost';

interface ProspectDraft {
  company: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  primaryNeed: string;
  source: ProspectSource;
  temperature: ProspectTemperature;
  estimatedValueEuros: string;
  firstActionDate: string;
  firstActionText: string;
}

interface ActionEditor {
  prospectId: string;
  type: CrmActionType;
  date: string;
  text: string;
  notes: string;
  recurrence: ActionRecurrence;
}

interface LostEditor {
  prospectId: string;
  reason: string;
}

const EMPTY_DRAFT: ProspectDraft = {
  company: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  primaryNeed: '',
  source: 'website',
  temperature: 'neutral',
  estimatedValueEuros: '',
  firstActionDate: '',
  firstActionText: '',
};

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value?: string | null): string {
  if (!value) return 'Sans date';
  return new Date(value).toLocaleDateString('fr-FR');
}

function actionDueInput(value?: string | null): string {
  if (!value) return todayInput();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? todayInput() : date.toISOString().slice(0, 10);
}

function isClosed(prospect: ProspectSummary): boolean {
  return Boolean(prospect.archivedAt) || Boolean(prospect.clientAccountId) || prospect.stage === 'won' || prospect.stage === 'lost';
}

export function ProspectsPage({ onMessage, initialId }: { onMessage: (message: string) => void; initialId?: string | null }) {
  const [prospects, setProspects] = useState<ProspectSummary[]>([]);
  const [actions, setActions] = useState<CrmAction[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ProspectView>('pipeline');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<ProspectDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? null);
  const [needsDraft,setNeedsDraft] = useState<NeedInput[]>([]);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<ProspectStage | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [actionEditor, setActionEditor] = useState<ActionEditor | null>(null);
  const [lostEditor, setLostEditor] = useState<LostEditor | null>(null);

  async function refresh(): Promise<void> {
    setLoading(true);
    try {
      let nextProspects = await window.atoumweb.crm.prospects.list({includeArchived:true});
      const inconsistentConverted = nextProspects.filter((prospect) => prospect.clientAccountId && prospect.stage !== 'won');
      if (inconsistentConverted.length > 0) {
        await Promise.all(inconsistentConverted.map((prospect) => window.atoumweb.crm.prospects.changeStage(prospect.id, 'won')));
        nextProspects = await window.atoumweb.crm.prospects.list({includeArchived:true});
      }
      const nextActions = await window.atoumweb.crm.actions.list({ ownerType: 'prospect' });
      setProspects(nextProspects);
      if(initialId && nextProspects.some(p=>p.id===initialId && isClosed(p))) setView('history');
      setActions(nextActions);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setActivity([]);
      return;
    }
    void window.atoumweb.crm.activity.list('prospect', selectedId).then(setActivity);
  }, [selectedId, prospects, actions]);

  const activeProspects = useMemo(() => prospects.filter((prospect) => !isClosed(prospect)), [prospects]);
  const closedProspects = useMemo(() => prospects.filter(isClosed), [prospects]);

  const byStage = useMemo(() => {
    const map = new Map<ProspectStage, ProspectSummary[]>();
    ACTIVE_STAGES.forEach((stage) => map.set(stage, []));
    activeProspects.forEach((prospect) => {
      const stage = prospect.stage ?? 'new';
      if (ACTIVE_STAGES.includes(stage)) map.get(stage)?.push(prospect);
    });
    return map;
  }, [activeProspects]);

  const filteredHistory = useMemo(() => {
    const query = historySearch.trim().toLocaleLowerCase('fr-FR');
    return closedProspects.filter((prospect) => {
      const won = Boolean(prospect.clientAccountId) || prospect.stage === 'won';
      if (historyFilter === 'won' && !won) return false;
      if (historyFilter === 'lost' && prospect.stage !== 'lost') return false;
      if (!query) return true;
      return [prospect.displayName, prospect.secondaryLabel, prospect.primaryNeed, prospect.lostReason]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase('fr-FR').includes(query));
    });
  }, [closedProspects, historyFilter, historySearch]);

  useEffect(()=>{const reload=()=>void refresh();window.addEventListener('atoumweb:changed',reload);return()=>window.removeEventListener('atoumweb:changed',reload);},[]);
  const selected = prospects.find((prospect) => prospect.id === selectedId) ?? null;
  const selectedActions = actions.filter((action) => action.ownerId === selectedId);
  const selectedOpenActions = selectedActions.filter((action) => action.status === 'open');
  const selectedClosedActions = selectedActions.filter((action) => action.status !== 'open');

  function openActionsFor(prospectId: string, type?: CrmActionType): CrmAction[] {
    return actions.filter((action) => action.ownerId === prospectId && action.status === 'open' && (!type || action.type === type));
  }

  function selectProspect(prospect: ProspectSummary): void {
    setSelectedId(prospect.id);
    setExpandedCardId((current) => current === prospect.id ? null : prospect.id);
    setActionEditor(null);
    setLostEditor(null);
  }

  async function submitProspect(event: FormEvent): Promise<void> {
    event.preventDefault();
    setFormError(null);
    if (!draft.company.trim() && (!draft.firstName.trim() || !draft.lastName.trim())) {
      setFormError('Renseigne une société ou le prénom et le nom du contact.');
      return;
    }

    setSaving(true);
    let demoBatch: string | null = null;
    try {
      if (demoMode) demoBatch = await window.atoumweb.workflow.beginDemoCapture('prospect saisi manuellement');
      let organizationId: string | null = null;
      let contactId: string | null = null;

      if (draft.company.trim()) {
        const organization = await window.atoumweb.crm.organizations.create({
          name: draft.company.trim(),
          email: !draft.firstName.trim() ? draft.email.trim() || null : null,
          phone: !draft.firstName.trim() ? draft.phone.trim() || null : null,
        });
        organizationId = organization.id;
      }

      if (draft.firstName.trim() && draft.lastName.trim()) {
        const contact = await window.atoumweb.crm.contacts.create({
          organizationId,
          firstName: draft.firstName.trim(),
          lastName: draft.lastName.trim(),
          email: draft.email.trim() || null,
          phone: draft.phone.trim() || null,
        });
        contactId = contact.id;
      }

      const value = draft.estimatedValueEuros.trim()
        ? Math.round(Number(draft.estimatedValueEuros.replace(',', '.').replace(/\s*euros?$/i, '')) * 100)
        : null;
      if (value != null && (!Number.isFinite(value) || value < 0)) throw new Error('La valeur estimée est invalide.');

      const prospect = await window.atoumweb.crm.prospects.create({
        organizationId,
        contactId,
        stage: 'new',
        temperature: draft.temperature,
        source: draft.source,
        primaryNeed: draft.primaryNeed.trim() || null,
        estimatedValueCents: value,
      });

      for (const need of needsDraft) await window.atoumweb.workflow.saveNeed('prospect', prospect.id, need);
      setNeedsDraft([]);
      if (draft.firstActionText.trim() || draft.firstActionDate) {
        await window.atoumweb.crm.actions.create({
          ownerType: 'prospect',
          ownerId: prospect.id,
          type: 'action',
          title: draft.firstActionText.trim() || 'Action à effectuer',
          dueAt: draft.firstActionDate ? new Date(`${draft.firstActionDate}T09:00:00`).toISOString() : null,
        });
      }

      setDraft(EMPTY_DRAFT);
      setDemoMode(false);
      setShowForm(false);
      await refresh();
      setSelectedId(prospect.id);
      setExpandedCardId(prospect.id);
      onMessage('Prospect créé.');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Impossible de créer le prospect.');
    } finally {
      if (demoBatch) await window.atoumweb.workflow.endDemoCapture(demoBatch);
      setSaving(false);
    }
  }

  async function convert(prospect: ProspectSummary): Promise<void> {
    const result = await window.atoumweb.crm.prospects.convertToClient(prospect.id);
    setSelectedId(null);
    setExpandedCardId(null);
    setActionEditor(null);
    setLostEditor(null);
    await refresh();
    onMessage(result.createdClient ? 'Prospect transformé en nouveau client et retiré du pipeline.' : 'Prospect rattaché au client existant et retiré du pipeline.');
  }

  async function createQuoteFromProspect(prospect:ProspectSummary):Promise<void>{try{const needs=await window.atoumweb.workflow.needs('prospect',prospect.id);if(!needs.length){onMessage('Ajoute au moins un besoin avant de créer le devis.');return;}const quote=await window.atoumweb.quotes.create({prospectId:prospect.id,subject:prospect.projectSummary||needs.map(n=>n.label).join(' + '),needSummary:needs.map(n=>n.label).join(' · ')});await refresh();window.dispatchEvent(new CustomEvent('atoumweb:navigate',{detail:{entityType:'quote',entityId:quote.id,title:quote.subject}}));}catch(error){onMessage(error instanceof Error?error.message:'Création du devis impossible.');}}

  async function changeStage(prospect: ProspectSummary, stage: ProspectStage): Promise<void> {
    if (stage === prospect.stage) return;
    if (prospect.clientAccountId) {
      onMessage('Ce prospect est déjà devenu client. Son statut se gère désormais dans Clients.');
      return;
    }
    if (!ACTIVE_STAGES.includes(stage)) return;
    if (!['new','qualifying'].includes(stage) && !window.confirm(`Confirmer le passage vers « ${STAGE_LABELS[stage]} » ?`)) return;
    if(stage==='waiting'){const reason=window.prompt('Motif de mise en attente');if(!reason?.trim())return;const resume=window.prompt('Date de reprise prévue (AAAA-MM-JJ), facultative')||null;await window.atoumweb.crm.prospects.updateQualification(prospect.id,{waitingReasonCode:'other',waitingReasonText:reason,waitingResumeAt:resume});}
    await window.atoumweb.crm.prospects.changeStage(prospect.id, stage);
    await refresh();
    onMessage(`Prospect déplacé vers « ${STAGE_LABELS[stage]} ».`);
  }

  async function handleDrop(stage: ProspectStage): Promise<void> {
    const prospect = prospects.find((item) => item.id === draggingId);
    setDropStage(null);
    setDraggingId(null);
    if (!prospect) return;
    await changeStage(prospect, stage);
  }

  async function schedulePreset(prospect: ProspectSummary, days: number): Promise<void> {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(9, 0, 0, 0);
    await window.atoumweb.crm.actions.create({
      ownerType: 'prospect',
      ownerId: prospect.id,
      type: 'follow_up',
      title: 'Relancer le prospect',
      dueAt: date.toISOString(),
    });
    await refresh();
    onMessage(`Relance programmée dans ${days} jour${days > 1 ? 's' : ''} et dossier déplacé dans « À relancer ».`);
  }

  function openActionEditor(prospect: ProspectSummary, type: CrmActionType): void {
    setSelectedId(prospect.id);
    setExpandedCardId(prospect.id);
    setLostEditor(null);
    setActionEditor({
      prospectId: prospect.id,
      type,
      date: type === 'follow_up' ? todayInput() : '',
      text: type === 'follow_up' ? 'Relancer le prospect' : '',
      notes: '',
      recurrence: 'none',
    });
  }

  async function saveAction(): Promise<void> {
    if (!actionEditor) return;
    const text = actionEditor.text.trim();
    if (!text) {
      onMessage('Renseigne le libellé de l’action.');
      return;
    }
    if (actionEditor.type === 'follow_up' && !actionEditor.date) {
      onMessage('Une relance doit avoir une date.');
      return;
    }
    const dueAt = actionEditor.date ? new Date(`${actionEditor.date}T09:00:00`).toISOString() : null;
    await window.atoumweb.crm.actions.create({
      ownerType: 'prospect',
      ownerId: actionEditor.prospectId,
      type: actionEditor.type,
      title: text,
      dueAt,
      notes: actionEditor.notes.trim() || null,
      recurrence: actionEditor.recurrence,
    });
    const type = actionEditor.type;
    setActionEditor(null);
    await refresh();
    onMessage(type === 'follow_up' ? 'Relance ajoutée.' : 'Action ajoutée.');
  }

  async function completeAction(action: CrmAction): Promise<void> {
    const channel=window.prompt('Canal utilisé (téléphone, email, visio…)',action.type==='follow_up'?'téléphone':'');if(channel===null)return;
    const outcome=window.prompt('Résultat de l’action','réalisée');if(outcome===null)return;
    const notes=window.prompt('Compte rendu (facultatif)','');if(notes===null)return;
    await window.atoumweb.crm.actions.complete(action.id,{channel,outcome,notes});
    await refresh();
    onMessage(`${action.type === 'follow_up' ? 'Relance' : 'Action'} terminée.`);
  }

  async function cancelAction(action: CrmAction): Promise<void> {
    await window.atoumweb.crm.actions.cancel(action.id);
    await refresh();
    onMessage(`${action.type === 'follow_up' ? 'Relance' : 'Action'} annulée.`);
  }

  async function reopenAction(action: CrmAction): Promise<void> {
    await window.atoumweb.crm.actions.reopen(action.id);
    await refresh();
    onMessage('Action rouverte.');
  }

  function openLostEditor(prospect: ProspectSummary): void {
    setSelectedId(prospect.id);
    setExpandedCardId(prospect.id);
    setActionEditor(null);
    setLostEditor({ prospectId: prospect.id, reason: prospect.lostReason ?? '' });
  }

  async function confirmLost(): Promise<void> {
    if (!lostEditor) return;
    const reason = lostEditor.reason.trim();
    if (!reason) {
      onMessage('Indique la raison de la perte avant de valider.');
      return;
    }
    await window.atoumweb.crm.prospects.changeStage(lostEditor.prospectId, 'lost', reason);
    setLostEditor(null);
    setSelectedId(null);
    setExpandedCardId(null);
    await refresh();
    onMessage('Prospect classé perdu et retiré du pipeline actif.');
  }

  async function seedDevelopmentPipeline(): Promise<void> {
    setSeeding(true);
    try { await window.atoumweb.workflow.createDemo('vitrine'); await refresh(); onMessage('Parcours Vitrine créé et marqué demo.'); }
    catch(error) { onMessage(String(error)); } finally { setSeeding(false); }
  }

  function switchView(next: ProspectView): void {
    setView(next);
    setShowForm(false);
    setSelectedId(null);
    setExpandedCardId(null);
    setActionEditor(null);
    setLostEditor(null);
  }

  return (
    <div className="crm-stack">
      <div className="prospect-view-switch" role="tablist" aria-label="Vue prospects">
        <button className={view === 'pipeline' ? 'active' : ''} type="button" onClick={() => switchView('pipeline')}>Pipeline <span>{activeProspects.length}</span></button>
        <button className={view === 'history' ? 'active' : ''} type="button" onClick={() => switchView('history')}>Historique <span>{closedProspects.length}</span></button>
      </div>

      {view === 'pipeline' ? (
        <>
          <div className="module-toolbar prospect-toolbar">
            <div><strong>{activeProspects.length}</strong><span> prospect{activeProspects.length > 1 ? 's' : ''} actif{activeProspects.length > 1 ? 's' : ''}</span></div>
            <div className="toolbar-controls prospect-toolbar-actions">
              <button className="secondary-button" type="button" onClick={() => void refresh()}>↻ Actualiser</button>
              <button className="secondary-button dev-button" type="button" disabled={seeding} onClick={() => void seedDevelopmentPipeline()}>{seeding ? 'Création…' : 'Créer un parcours test Vitrine'}</button>
              <button className="primary-button" type="button" onClick={() => setShowForm((value) => !value)}>{showForm ? 'Fermer' : '+ Nouveau prospect'}</button>
            </div>
          </div>

          {showForm && (
            <form className="panel crm-form" onSubmit={(event) => void submitProspect(event)}>
              <div className="panel-title"><div><span className="eyebrow">Prospect</span><h2>Nouveau contact commercial</h2></div></div>
              <button className="secondary-button" type="button" onClick={() => { setDemoMode(true); setDraft({ ...EMPTY_DRAFT, company: 'DEMO — Boulangerie Martin', firstName: 'Camille', lastName: 'Martin', email: 'camille@example.test', primaryNeed: 'Site vitrine', estimatedValueEuros: '848', firstActionText: 'Préparer le devis' }); setNeedsDraft([{ catalogItemId: 'atoumweb-vitrine' }, { catalogItemId: 'atoumweb-article-seo' }]); }}>Remplir avec des données test</button>
              <div className="form-grid">
                <label>Société<input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} /></label>
                <label>Prénom<input value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} /></label>
                <label>Nom<input value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} /></label>
                <label>Email<input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
                <label>Téléphone<input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
                <NeedChoices value={needsDraft} onChange={setNeedsDraft} />
                <label>Source<select value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value as ProspectSource })}>{PROSPECT_SOURCES.map((source) => <option key={source} value={source}>{SOURCE_LABELS[source]}</option>)}</select></label>
                <label>Température<select value={draft.temperature} onChange={(e) => setDraft({ ...draft, temperature: e.target.value as ProspectTemperature })}>{PROSPECT_TEMPERATURES.map((temperature) => <option key={temperature} value={temperature}>{TEMPERATURE_LABELS[temperature]}</option>)}</select></label>
                <label>Valeur estimée (€)<input inputMode="decimal" value={draft.estimatedValueEuros} onChange={(e) => setDraft({ ...draft, estimatedValueEuros: e.target.value })} placeholder="Ex. 900" /></label>
                <label>Première action — date<input type="date" value={draft.firstActionDate} onChange={(e) => setDraft({ ...draft, firstActionDate: e.target.value })} /></label>
                <label className="form-span-2">Première action<input value={draft.firstActionText} onChange={(e) => setDraft({ ...draft, firstActionText: e.target.value })} placeholder="Ex. préparer le devis" /></label>
              </div>
              {formError && <p className="form-error">{formError}</p>}
              <div className="form-actions"><button className="primary-button" disabled={saving} type="submit">{saving ? 'Création…' : 'Créer le prospect'}</button></div>
            </form>
          )}

          {loading ? <div className="panel"><p className="muted">Chargement des prospects…</p></div> : (
            <div className={selected ? 'prospects-layout with-detail' : 'prospects-layout'}>
              <div className="kanban-board">
                {ACTIVE_STAGES.map((stage) => (
                  <section
                    className={`kanban-column ${dropStage === stage ? 'drag-over' : ''}`}
                    key={stage}
                    onDragOver={(event) => event.preventDefault()}
                    onDragEnter={() => setDropStage(stage)}
                    onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropStage(null); }}
                    onDrop={(event) => { event.preventDefault(); void handleDrop(stage); }}
                  >
                    <header><strong>{STAGE_LABELS[stage]}</strong><span>{byStage.get(stage)?.length ?? 0}</span></header>
                    <div className="kanban-cards stacked-cards">
                      {(byStage.get(stage) ?? []).map((prospect) => {
                        const expanded = expandedCardId === prospect.id;
                        const cardActions = openActionsFor(prospect.id);
                        return (
                          <article className={`prospect-card stacked-card ${expanded ? 'expanded-card' : 'collapsed-card'} ${selectedId === prospect.id ? 'selected-prospect' : ''} ${draggingId === prospect.id ? 'dragging' : ''}`} key={prospect.id}>
                            <div
                              className="prospect-card-head card-drag-handle"
                              draggable
                              onDragStart={(event) => {
                                setDraggingId(prospect.id);
                                event.dataTransfer.effectAllowed = 'move';
                                event.dataTransfer.setData('text/plain', prospect.id);
                              }}
                              onDragEnd={() => { setDraggingId(null); setDropStage(null); }}
                              onClick={() => selectProspect(prospect)}
                              title="Cliquer pour ouvrir · Faire glisser pour déplacer"
                            >
                              <strong>{prospect.displayName}</strong>
                              <span className={`temperature temperature-${prospect.temperature ?? 'neutral'}`} aria-label={`Température : ${TEMPERATURE_LABELS[prospect.temperature ?? 'neutral']}`}>{TEMPERATURE_LABELS[prospect.temperature ?? 'neutral']}</span>
                            </div>

                            <div className="prospect-card-body" onClick={() => setSelectedId(prospect.id)}>
                              {prospect.secondaryLabel && <small>{prospect.secondaryLabel}</small>}
                              <p>{prospect.primaryNeed || 'Besoin à préciser'}</p>
                              <div className="prospect-meta"><span>{prospect.estimatedValueCents != null ? `${(prospect.estimatedValueCents / 100).toLocaleString('fr-FR')} €` : 'Valeur non estimée'}</span></div>

                              <div className="card-action-preview">
                                {cardActions.slice(0, 2).map((action) => <ActionPreview key={action.id} action={action} />)}
                                {cardActions.length > 2 && <small className="more-actions">+ {cardActions.length - 2} autre{cardActions.length - 2 > 1 ? 's' : ''}</small>}
                                {cardActions.length === 0 && <small className="muted">Aucune action en cours</small>}
                              </div>

                              <div className="quick-followups" onClick={(event) => event.stopPropagation()}>
                                <span className="quick-label">Relance</span>
                                <button type="button" onClick={() => void schedulePreset(prospect, 1)}>Demain</button>
                                <button type="button" onClick={() => void schedulePreset(prospect, 3)}>+3 j</button>
                                <button type="button" onClick={() => void schedulePreset(prospect, 7)}>+7 j</button>
                                <button type="button" onClick={() => void schedulePreset(prospect, 30)}>+30 j</button>
                                <button type="button" onClick={() => openActionEditor(prospect, 'follow_up')}>Date…</button>
                              </div>

                              <div className="card-secondary-actions" onClick={(event) => event.stopPropagation()}>
                                <button className="secondary-button compact-button" type="button" onClick={() => openActionEditor(prospect, 'action')}>+ Action</button>
                              </div>

                              <select aria-label="Étape du prospect" value={prospect.stage} onClick={(event) => event.stopPropagation()} onChange={(event) => void changeStage(prospect, event.target.value as ProspectStage)}>
                                {ACTIVE_STAGES.map((item) => <option key={item} value={item}>{STAGE_LABELS[item]}</option>)}
                              </select>
                              <div className="prospect-card-actions" onClick={(event) => event.stopPropagation()}>
                                <button className="secondary-button compact-button" type="button" onClick={() => openLostEditor(prospect)}>Perdu</button>
                                <button className="primary-button compact-button" type="button" onClick={() => void convert(prospect)}>Transformer en client</button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                      {(byStage.get(stage)?.length ?? 0) === 0 && <div className="kanban-empty">Déposer ici</div>}
                    </div>
                  </section>
                ))}
              </div>

              {selected && <ProspectDetail
                prospect={selected}
                actions={selectedActions}
                openActions={selectedOpenActions}
                closedActions={selectedClosedActions}
                activity={activity}
                actionEditor={actionEditor}
                lostEditor={lostEditor}
                setActionEditor={setActionEditor}
                setLostEditor={setLostEditor}
                onClose={() => { setSelectedId(null); setExpandedCardId(null); setActionEditor(null); setLostEditor(null); }}
                onAddAction={(type) => openActionEditor(selected, type)}
                onSaveAction={() => void saveAction()}
                onComplete={(action) => void completeAction(action)}
                onCancel={(action) => void cancelAction(action)}
                onReopen={(action) => void reopenAction(action)}
                onLost={() => openLostEditor(selected)}
                onConfirmLost={() => void confirmLost()}
                onConvert={() => void convert(selected)}
                onCreateQuote={() => void createQuoteFromProspect(selected)}
                onQualificationSaved={() => void refresh()}
              />}
            </div>
          )}
        </>
      ) : (
        <HistoryView
          prospects={filteredHistory}
          count={closedProspects.length}
          filter={historyFilter}
          search={historySearch}
          selected={selected}
          actions={selectedActions}
          activity={activity}
          onFilter={setHistoryFilter}
          onSearch={setHistorySearch}
          onRefresh={() => void refresh()}
          onSelect={(prospect) => { setSelectedId(prospect.id); setExpandedCardId(null); setActionEditor(null); setLostEditor(null); }}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function ActionPreview({ action }: { action: CrmAction }) {
  const overdue = Boolean(action.dueAt && new Date(action.dueAt) < new Date());
  return (
    <div className={`card-action-line ${action.type === 'follow_up' ? 'follow-up' : 'action'} ${overdue ? 'overdue' : ''}`}>
      <span>{action.type === 'follow_up' ? 'Relance' : 'Action'}</span>
      <strong>{action.title}</strong>
      <small>{formatDate(action.dueAt)}</small>
    </div>
  );
}

function ProspectDetail({
  prospect,
  actions,
  openActions,
  closedActions,
  activity,
  actionEditor,
  lostEditor,
  setActionEditor,
  setLostEditor,
  onClose,
  onAddAction,
  onSaveAction,
  onComplete,
  onCancel,
  onReopen,
  onLost,
  onConfirmLost,
  onConvert,
  onCreateQuote,
  onQualificationSaved,
}: {
  prospect: ProspectSummary;
  actions: CrmAction[];
  openActions: CrmAction[];
  closedActions: CrmAction[];
  activity: ActivityEvent[];
  actionEditor: ActionEditor | null;
  lostEditor: LostEditor | null;
  setActionEditor: (editor: ActionEditor | null) => void;
  setLostEditor: (editor: LostEditor | null) => void;
  onClose: () => void;
  onAddAction: (type: CrmActionType) => void;
  onSaveAction: () => void;
  onComplete: (action: CrmAction) => void;
  onCancel: (action: CrmAction) => void;
  onReopen: (action: CrmAction) => void;
  onLost: () => void;
  onConfirmLost: () => void;
  onConvert: () => void;
  onCreateQuote: () => void;
  onQualificationSaved: () => void;
}) {
  const active = !isClosed(prospect);
  const followUps = openActions.filter((action) => action.type === 'follow_up');
  const tasks = openActions.filter((action) => action.type === 'action');

  return (
    <aside className="panel prospect-detail-panel">
      <div className="detail-panel-heading">
        <div><span className="eyebrow">Fiche prospect</span><h2>{prospect.displayName}</h2></div>
        <button className="close-detail" type="button" onClick={onClose}>×</button>
      </div>

      <div className="detail-badges">
        <span className={`temperature temperature-${prospect.temperature ?? 'neutral'}`} aria-label={`Température : ${TEMPERATURE_LABELS[prospect.temperature ?? 'neutral']}`}>{TEMPERATURE_LABELS[prospect.temperature ?? 'neutral']}</span>
        <span className="status-pill">{prospect.clientAccountId ? 'Client' : STAGE_LABELS[prospect.stage ?? 'new']}</span>
        {prospect.source && <span className="status-pill">{SOURCE_LABELS[prospect.source]}</span>}
      </div>

      <DossierPanel owner="prospect" id={prospect.id} />
      {active&&<button className="primary-button" type="button" onClick={onCreateQuote}>Créer un devis depuis ce prospect</button>}
      <ProspectQualificationPanel prospect={prospect} onSaved={onQualificationSaved}/>
      <div className="summary-list">
        <SummaryLine label="Contact" value={prospect.secondaryLabel || 'Non renseigné'} />
        <SummaryLine label="Besoin" value={prospect.primaryNeed || 'À préciser'} />
        <SummaryLine label="Valeur estimée" value={prospect.estimatedValueCents != null ? `${(prospect.estimatedValueCents / 100).toLocaleString('fr-FR')} €` : 'Non estimée'} />
        <SummaryLine label="Prochaine échéance" value={prospect.nextActionAt ? `${prospect.nextActionText || 'Action'} · ${formatDate(prospect.nextActionAt)}` : 'Aucune'} />
        <SummaryLine label="Créé le" value={new Date(prospect.createdAt).toLocaleDateString('fr-FR')} />
      </div>

      {prospect.notes && <div className="client-notes"><strong>Notes</strong><p>{prospect.notes}</p></div>}
      {prospect.lostReason && <div className="client-notes"><strong>Raison de perte</strong><p>{prospect.lostReason}</p></div>}

      <section className="prospect-work-section followup-section">
        <div className="work-section-heading"><div><span className="eyebrow">Relances</span><strong>{followUps.length} en cours</strong></div>{active && <button className="secondary-button compact-button" type="button" onClick={() => onAddAction('follow_up')}>+ Relance</button>}</div>
        <ActionList actions={followUps} empty="Aucune relance programmée." onComplete={onComplete} onCancel={onCancel} />
      </section>

      <section className="prospect-work-section">
        <div className="work-section-heading"><div><span className="eyebrow">Actions</span><strong>{tasks.length} en cours</strong></div>{active && <button className="secondary-button compact-button" type="button" onClick={() => onAddAction('action')}>+ Action</button>}</div>
        <ActionList actions={tasks} empty="Aucune action en cours." onComplete={onComplete} onCancel={onCancel} />
      </section>

      {actionEditor?.prospectId === prospect.id && (
        <div className="inline-editor action-editor-card">
          <strong>{actionEditor.type === 'follow_up' ? 'Nouvelle relance' : 'Nouvelle action'}</strong>
          <label>Libellé<input value={actionEditor.text} onChange={(event) => setActionEditor({ ...actionEditor, text: event.target.value })} placeholder={actionEditor.type === 'follow_up' ? 'Ex. rappeler pour le devis' : 'Ex. préparer la proposition'} /></label>
          <label>Date {actionEditor.type === 'action' && <small>(facultative)</small>}<input type="date" value={actionEditor.date} onChange={(event) => setActionEditor({ ...actionEditor, date: event.target.value })} /></label>
          <label>Note <small>(facultative)</small><textarea value={actionEditor.notes} onChange={(event) => setActionEditor({ ...actionEditor, notes: event.target.value })} /></label>
          <label>Récurrence<select value={actionEditor.recurrence} onChange={event=>setActionEditor({...actionEditor,recurrence:event.target.value as ActionRecurrence})}><option value="none">Aucune</option><option value="weekly">Chaque semaine</option><option value="monthly">Chaque mois</option><option value="quarterly">Chaque trimestre</option><option value="yearly">Chaque année</option></select></label>
          <div className="inline-editor-actions"><button className="secondary-button compact-button" type="button" onClick={() => setActionEditor(null)}>Annuler</button><button className="primary-button compact-button" type="button" onClick={onSaveAction}>Ajouter</button></div>
        </div>
      )}

      {lostEditor?.prospectId === prospect.id && (
        <div className="inline-editor danger-editor">
          <strong>Classer ce prospect comme perdu</strong>
          <p className="muted">Il quittera le pipeline actif mais restera dans Historique.</p>
          <label>Raison<textarea value={lostEditor.reason} onChange={(event) => setLostEditor({ ...lostEditor, reason: event.target.value })} placeholder="Ex. budget insuffisant, projet abandonné…" /></label>
          <div className="inline-editor-actions"><button className="secondary-button compact-button" type="button" onClick={() => setLostEditor(null)}>Annuler</button><button className="danger-button compact-button" type="button" onClick={onConfirmLost}>Confirmer Perdu</button></div>
        </div>
      )}

      {active && (
        <div className="detail-actions">
          <button className="secondary-button danger-outline" type="button" onClick={onLost}>Perdu</button>
          <button className="primary-button" type="button" onClick={onConvert}>Transformer en client</button>
        </div>
      )}

      {closedActions.length > 0 && (
        <section className="prospect-work-section action-history-section">
          <div className="work-section-heading"><div><span className="eyebrow">Actions terminées</span><strong>{closedActions.length}</strong></div></div>
          <div className="work-items">
            {closedActions.slice(0, 8).map((action) => (
              <div className="work-item completed" key={action.id}>
                <div className="work-item-main"><span className={`work-type ${action.type}`}>{action.type === 'follow_up' ? 'Relance' : 'Action'}</span><strong>{action.title}</strong><small>{action.status === 'done' ? `Terminée${action.completedAt ? ` le ${formatDate(action.completedAt)}` : ''}` : 'Annulée'}</small></div>
                <button className="link-button" type="button" onClick={() => onReopen(action)}>Rouvrir</button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="activity-preview">
        <strong>Journal du dossier</strong>
        {activity.slice(0, 12).map((event) => <div className="activity-item" key={event.id}><span className="activity-dot" /><div><p>{event.summary}</p><small>{new Date(event.createdAt).toLocaleString('fr-FR')}</small></div></div>)}
        {activity.length === 0 && <p className="muted">Aucune activité enregistrée.</p>}
      </div>
      {actions.length === 0 && <p className="muted action-empty-note">Aucune action n’a encore été enregistrée pour ce dossier.</p>}
    </aside>
  );
}

function ActionList({ actions, empty, onComplete, onCancel }: { actions: CrmAction[]; empty: string; onComplete: (action: CrmAction) => void; onCancel: (action: CrmAction) => void }) {
  if (actions.length === 0) return <p className="muted work-empty">{empty}</p>;
  return (
    <div className="work-items">
      {actions.map((action) => {
        const overdue = Boolean(action.dueAt && new Date(action.dueAt) < new Date());
        return (
          <div className={`work-item ${overdue ? 'overdue' : ''}`} key={action.id}>
            <button className="work-check" type="button" title="Marquer comme terminée" onClick={() => onComplete(action)}>✓</button>
            <div className="work-item-main"><strong>{action.title}</strong><small>{action.dueAt ? `${overdue ? 'En retard · ' : ''}${formatDate(action.dueAt)}` : 'Sans date'}{action.notes ? ` · ${action.notes}` : ''}</small></div>
            <button className="work-cancel" type="button" title="Annuler" onClick={() => onCancel(action)}>×</button>
          </div>
        );
      })}
    </div>
  );
}

function HistoryView({
  prospects,
  count,
  filter,
  search,
  selected,
  actions,
  activity,
  onFilter,
  onSearch,
  onRefresh,
  onSelect,
  onClose,
}: {
  prospects: ProspectSummary[];
  count: number;
  filter: HistoryFilter;
  search: string;
  selected: ProspectSummary | null;
  actions: CrmAction[];
  activity: ActivityEvent[];
  onFilter: (filter: HistoryFilter) => void;
  onSearch: (value: string) => void;
  onRefresh: () => void;
  onSelect: (prospect: ProspectSummary) => void;
  onClose: () => void;
}) {
  return (
    <div className="history-view-stack">
      <div className="module-toolbar history-toolbar">
        <div><strong>{count}</strong><span> dossier{count > 1 ? 's' : ''} clos</span></div>
        <div className="toolbar-controls">
          <button className="secondary-button" type="button" onClick={onRefresh}>↻ Actualiser</button>
          <input className="inline-search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Rechercher dans l’historique…" />
          <select value={filter} onChange={(event) => onFilter(event.target.value as HistoryFilter)}><option value="all">Tous</option><option value="won">Gagnés</option><option value="lost">Perdus</option></select>
        </div>
      </div>

      <div className={selected ? 'prospects-layout with-detail' : 'prospects-layout'}>
        <section className="panel history-prospects-panel">
          <div className="history-list-heading"><span>Prospect</span><span>Issue</span><span>Besoin</span><span>Valeur</span><span>Clôture</span></div>
          <div className="history-prospect-list">
            {prospects.map((prospect) => {
              const won = Boolean(prospect.clientAccountId) || prospect.stage === 'won';
              const closedAt = won ? prospect.wonAt : prospect.lostAt;
              return (
                <button className={`history-prospect-row ${selected?.id === prospect.id ? 'selected' : ''}`} type="button" key={prospect.id} onClick={() => onSelect(prospect)}>
                  <div><strong>{prospect.displayName}</strong><small>{prospect.secondaryLabel || 'Contact non renseigné'}</small></div>
                  <span className={`history-outcome ${won ? 'won' : 'lost'}`}>{won ? 'Gagné' : 'Perdu'}</span>
                  <span>{prospect.primaryNeed || '—'}{prospect.lostReason ? <small>Raison : {prospect.lostReason}</small> : null}</span>
                  <span>{prospect.estimatedValueCents != null ? `${(prospect.estimatedValueCents / 100).toLocaleString('fr-FR')} €` : '—'}</span>
                  <span>{closedAt ? formatDate(closedAt) : '—'}</span>
                </button>
              );
            })}
            {prospects.length === 0 && <div className="history-empty">Aucun dossier ne correspond à ces filtres.</div>}
          </div>
        </section>

        {selected && (
          <aside className="panel prospect-detail-panel history-detail-panel">
            <div className="detail-panel-heading"><div><span className="eyebrow">Historique prospect</span><h2>{selected.displayName}</h2></div><button className="close-detail" type="button" onClick={onClose}>×</button></div>
            <div className="detail-badges"><span className={`history-outcome ${selected.stage === 'lost' ? 'lost' : 'won'}`}>{selected.archivedAt ? 'Archivé' : selected.stage === 'lost' ? 'Perdu' : 'Gagné · Client'}</span></div>
            <DossierPanel owner="prospect" id={selected.id}/><div className="summary-list"><SummaryLine label="Contact" value={selected.secondaryLabel || 'Non renseigné'} /><SummaryLine label="Besoin" value={selected.primaryNeed || '—'} /><SummaryLine label="Valeur" value={selected.estimatedValueCents != null ? `${(selected.estimatedValueCents / 100).toLocaleString('fr-FR')} €` : '—'} />{selected.lostReason && <SummaryLine label="Raison" value={selected.lostReason} />}</div>
            {actions.length > 0 && <section className="prospect-work-section"><div className="work-section-heading"><div><span className="eyebrow">Actions du dossier</span><strong>{actions.length}</strong></div></div><div className="work-items">{actions.slice(0, 10).map((action) => <div className="work-item completed" key={action.id}><div className="work-item-main"><span className={`work-type ${action.type}`}>{action.type === 'follow_up' ? 'Relance' : 'Action'}</span><strong>{action.title}</strong><small>{action.status === 'open' ? 'Restée ouverte' : action.status === 'done' ? 'Terminée' : 'Annulée'}{action.dueAt ? ` · ${formatDate(action.dueAt)}` : ''}</small></div></div>)}</div></section>}
            <div className="activity-preview"><strong>Journal complet</strong>{activity.map((event) => <div className="activity-item" key={event.id}><span className="activity-dot" /><div><p>{event.summary}</p><small>{new Date(event.createdAt).toLocaleString('fr-FR')}</small></div></div>)}{activity.length === 0 && <p className="muted">Aucune activité.</p>}</div>
          </aside>
        )}
      </div>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return <div className="summary-line"><span>{label}</span><strong>{value}</strong></div>;
}
