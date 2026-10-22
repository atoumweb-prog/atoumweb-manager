import {useUnsavedDraft,requestUnsavedExit} from '../unsaved/unsaved';
import { useEffect, useMemo, useState } from 'react';
import type { ActivityEvent, CrmAction, ProspectSummary } from '../../shared/crm';
import type { WorkflowIdentity } from '../../shared/workflow';

const EARLY_PRESETS = [
  ['call', 'Appeler le prospect'],
  ['callback', 'Rappeler / relancer'],
  ['email', 'Envoyer un email'],
  ['request_info', 'Demander des informations'],
  ['meeting', 'Planifier un rendez-vous'],
  ['prepare_quote', 'Préparer le devis'],
  ['custom', 'Autre action'],
] as const;

const QUOTE_PRESETS = [
  ['follow_up_quote', 'Relancer pour le devis'],
  ['call', 'Appeler le prospect'],
  ['email', 'Envoyer un email'],
  ['request_info', 'Demander des informations'],
  ['meeting', 'Planifier un rendez-vous'],
  ['custom', 'Autre action'],
] as const;

const GENERAL_REASONS = [
  ['first_contact', 'Premier contact'],
  ['identify_decision_maker', 'Identifier le décisionnaire'],
  ['decision_maker_unavailable', 'Décisionnaire absent / indisponible'],
  ['no_answer', 'Pas de réponse'],
  ['requested_callback', 'Rappel demandé'],
  ['information_needed', 'Information à obtenir'],
  ['meeting', 'Rendez-vous'],
  ['other', 'Autre'],
] as const;

const QUOTE_REASONS = [
  ['quote_no_reply', 'Pas de réponse au devis'],
  ['quote_question', 'Question sur le devis'],
  ['decision_pending', 'Décision / validation en attente'],
  ['negotiation', 'Modification / négociation'],
  ['requested_callback', 'Rappel demandé'],
  ['other', 'Autre'],
] as const;

const CHANNELS = [
  ['phone', 'Téléphone'],
  ['email', 'Email'],
  ['sms', 'SMS'],
  ['meeting', 'Rendez-vous'],
  ['other', 'Autre'],
] as const;

const OUTCOMES = [
  ['prospect_reached', 'Prospect / interlocuteur joint'],
  ['decision_maker_reached', 'Décisionnaire joint'],
  ['decision_maker_absent', 'Interlocuteur joint, décisionnaire absent'],
  ['no_answer', 'Pas de réponse'],
  ['message_left', 'Message laissé'],
  ['call_back', 'À rappeler'],
  ['meeting_set', 'RDV fixé'],
  ['information_requested', 'Informations demandées'],
  ['not_interested_yet', 'Pas intéressé pour le moment'],
  ['categorical_refusal', 'Refus catégorique'],
  ['wrong_contact', 'Mauvais interlocuteur'],
  ['invalid_contact', 'Coordonnées invalides'],
  ['other', 'Autre'],
] as const;

const RECURRENCES = [
  ['none', 'Aucune'],
  ['weekly', 'Chaque semaine'],
  ['monthly', 'Chaque mois'],
  ['quarterly', 'Chaque trimestre'],
  ['yearly', 'Chaque année'],
] as const;

function date(value?: string | null) {
  return value ? new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'Sans date';
}

function toDueAt(value: string, time: string): string | null {
  if (!value) return null;
  return new Date(`${value}T${time || '09:00'}:00`).toISOString();
}

function isQuoteFollowUpStage(prospect: ProspectSummary): boolean {
  return ['quote_sent', 'follow_up', 'negotiation', 'waiting'].includes(prospect.stage ?? 'new');
}

function cleanError(error: unknown): string {
  if (!(error instanceof Error)) return 'Une erreur est survenue.';
  return error.message
    .replace(/^Error invoking remote method ['\"][^'\"]+['\"]:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();
}

function humanActivity(summary: string) {
  return summary
    .replace(/\bnew\b/g, 'Nouveau contact')
    .replace(/\bqualifying\b/g, 'À qualifier')
    .replace(/\bneed_identified\b/g, 'Besoin à identifier')
    .replace(/\bquote_to_prepare\b/g, 'Devis à préparer')
    .replace(/\bquote_to_send\b/g, 'Devis à envoyer')
    .replace(/\bquote_sent\b/g, 'En attente de retour')
    .replace(/\bfollow_up\b/g, 'À relancer')
    .replace(/\bnegotiation\b/g, 'Négociation')
    .replace(/\bwaiting\b/g, 'En attente')
    .replace(/\bwon\b/g, 'Gagné')
    .replace(/\blost\b/g, 'Perdu');
}

export function ProspectActionsPanel({ prospect, actions, onChanged, showJournal = true }: {
  showJournal?: boolean;
  prospect: ProspectSummary;
  actions: CrmAction[];
  onChanged: (message?: string) => void;
}) {
  const openActions = useMemo(() => actions.filter((item) => item.status === 'open'), [actions]);
  const quoteContext = isQuoteFollowUpStage(prospect);
  const presets = quoteContext ? QUOTE_PRESETS : EARLY_PRESETS;
  const reasons = quoteContext ? QUOTE_REASONS : GENERAL_REASONS;
  const [identity, setIdentity] = useState<WorkflowIdentity | null>(null);
  const [latestQuote, setLatestQuote] = useState<{ id: string; number: string; subject: string } | null>(null);
  const [journal, setJournal] = useState<ActivityEvent[]>([]);
  const [showAllJournal, setShowAllJournal] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [preset, setPreset] = useState<string>(quoteContext ? 'follow_up_quote' : 'call');
  const [title, setTitle] = useState(quoteContext ? 'Relancer pour le devis' : 'Appeler le prospect');
  const [targetContactId, setTargetContactId] = useState('');
  const [reasonCode, setReasonCode] = useState(quoteContext ? 'quote_no_reply' : 'first_contact');
  const [reasonText, setReasonText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [notes, setNotes] = useState('');
  const [recurrence, setRecurrence] = useState<'none' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('none');
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [channel, setChannel] = useState('phone');
  const [outcome, setOutcome] = useState('prospect_reached');
  const [completionNotes, setCompletionNotes] = useState('');
  const [programNext, setProgramNext] = useState(false);
  const [nextTitle, setNextTitle] = useState('');
  const [nextTargetContactId, setNextTargetContactId] = useState('');
  const [nextReasonCode, setNextReasonCode] = useState('requested_callback');
  const [nextReasonText, setNextReasonText] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [nextTime, setNextTime] = useState('');
  const [nextNotes, setNextNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [creationCycle,setCreationCycle]=useState(0);
  const actionGuard=useUnsavedDraft('Action ou relance',{preset,title,targetContactId,reasonCode,reasonText,dueDate,dueTime,notes,recurrence},{ready:createOpen,retainWhenHidden:true,resetKey:creationCycle,pending:busy,discard:s=>{setPreset(s.preset);setTitle(s.title);setTargetContactId(s.targetContactId);setReasonCode(s.reasonCode);setReasonText(s.reasonText);setDueDate(s.dueDate);setDueTime(s.dueTime);setNotes(s.notes);setRecurrence(s.recurrence);}});
  const completeGuard=useUnsavedDraft('Compte rendu d’action',{channel,outcome,completionNotes,programNext,nextTitle,nextTargetContactId,nextReasonCode,nextReasonText,nextDate,nextTime,nextNotes},{ready:!!completingId,resetKey:completingId,pending:busy,discard:s=>{setChannel(s.channel);setOutcome(s.outcome);setCompletionNotes(s.completionNotes);setProgramNext(s.programNext);setNextTitle(s.nextTitle);setNextTargetContactId(s.nextTargetContactId);setNextReasonCode(s.nextReasonCode);setNextReasonText(s.nextReasonText);setNextDate(s.nextDate);setNextTime(s.nextTime);setNextNotes(s.nextNotes);}});


  useEffect(() => {
    void Promise.all([
      window.atoumweb.workflow.identity('prospect', prospect.id),
      window.atoumweb.quotes.list({ prospectId: prospect.id }),
      window.atoumweb.crm.activity.list('prospect', prospect.id),
    ]).then(([nextIdentity, quoteList, activity]) => {
      setIdentity(nextIdentity);
      setJournal(activity);
      const nextQuote = quoteList[0] ?? null;
      setLatestQuote(nextQuote ? { id: nextQuote.id, number: nextQuote.number, subject: nextQuote.subject } : null);
      if (!targetContactId) setTargetContactId(nextIdentity.decisionMaker?.id ?? nextIdentity.contact?.id ?? '');
    }).catch((e) => setError(cleanError(e)));
  }, [prospect.id, prospect.updatedAt, actions]);

  const contactOptions = useMemo(() => {
    if (!identity) return [] as Array<{ id: string; label: string }>;
    return identity.contacts.map((contact) => {
      const role = contact.id === identity.decisionMaker?.id
        ? 'Décisionnaire'
        : contact.id === identity.contact?.id
          ? 'Interlocuteur principal'
          : contact.jobTitle || 'Contact lié';
      return { id: contact.id, label: `${contact.firstName} ${contact.lastName} · ${role}` };
    });
  }, [identity]);

  function contactLabel(id?: string | null): string {
    if (!id) return 'Prospect / entreprise';
    return contactOptions.find((item) => item.id === id)?.label ?? 'Contact lié';
  }

  function reasonLabel(code?: string | null, text?: string | null): string {
    if (text) return text;
    return [...GENERAL_REASONS, ...QUOTE_REASONS].find(([key]) => key === code)?.[1] ?? '';
  }

  function selectPreset(value: string) {
    setPreset(value);
    const item = presets.find(([key]) => key === value);
    setTitle(value === 'custom' ? '' : item?.[1] ?? '');
    if (value === 'callback') setReasonCode('requested_callback');
    if (value === 'follow_up_quote') setReasonCode('quote_no_reply');
  }

  function resetNext() {
    setProgramNext(false); setNextTitle(''); setNextDate(''); setNextTime(''); setNextNotes(''); setNextReasonText('');
  }

  function selectOutcome(value: string, action?: CrmAction) {
    setOutcome(value);
    const currentTarget = action?.targetContactId ?? identity?.decisionMaker?.id ?? identity?.contact?.id ?? '';
    if (value === 'decision_maker_absent') {
      setProgramNext(true);
      setNextTitle(identity?.decisionMaker ? `Rappeler ${identity.decisionMaker.firstName} ${identity.decisionMaker.lastName}` : 'Rappeler pour joindre le décisionnaire');
      setNextTargetContactId(identity?.decisionMaker?.id ?? identity?.contact?.id ?? '');
      setNextReasonCode('decision_maker_unavailable');
    } else if (['no_answer', 'message_left', 'call_back'].includes(value)) {
      setProgramNext(true);
      setNextTitle('Rappeler le prospect');
      setNextTargetContactId(currentTarget);
      setNextReasonCode(value === 'no_answer' ? 'no_answer' : 'requested_callback');
    } else if (value === 'wrong_contact') {
      setProgramNext(true);
      setNextTitle('Identifier le bon interlocuteur');
      setNextTargetContactId('');
      setNextReasonCode('identify_decision_maker');
    } else if (value === 'meeting_set') {
      setProgramNext(true);
      setNextTitle('Rendez-vous avec le prospect');
      setNextTargetContactId(currentTarget);
      setNextReasonCode('meeting');
    } else {
      resetNext();
    }
  }

  async function createAction() {
    if (!title.trim()) { setError('Renseigne l’objet de l’action.'); return; }
    const followUp = preset === 'callback' || (quoteContext && preset === 'follow_up_quote');
    if (followUp && !dueDate) { setError('Choisis une date pour le rappel / la relance.'); return; }
    setBusy(true); setError('');
    try {
      await window.atoumweb.crm.actions.create({
        ownerType: 'prospect', ownerId: prospect.id, type: followUp ? 'follow_up' : 'action', title: title.trim(),
        dueAt: toDueAt(dueDate, dueTime), notes: notes.trim() || null,
        targetContactId: targetContactId || null, reasonCode: reasonCode || null,
        reasonText: reasonCode === 'other' ? reasonText.trim() || null : null,
        relatedType: quoteContext && latestQuote ? 'quote' : null,
        relatedId: quoteContext && latestQuote ? latestQuote.id : null, recurrence,
      });
      actionGuard.saved();setCreationCycle(n=>n+1);setCreateOpen(false); setDueDate(''); setDueTime(''); setNotes(''); setReasonText(''); setRecurrence('none');
      onChanged(followUp ? 'Rappel / relance programmé.' : 'Action commerciale ajoutée.');
      window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) { setError(cleanError(e)); }
    finally { setBusy(false); }
  }

  async function completeAction(action: CrmAction) {
    if (programNext && (!nextTitle.trim() || !nextDate)) { setError('Renseigne l’action suivante et sa date, ou décoche « Programmer une suite ».'); return; }
    setBusy(true); setError('');
    try {
      const explicitNext = programNext ? {
        ownerType: 'prospect' as const, ownerId: prospect.id, type: 'follow_up' as const, title: nextTitle.trim(),
        dueAt: toDueAt(nextDate, nextTime), notes: nextNotes.trim() || null,
        targetContactId: nextTargetContactId || null, reasonCode: nextReasonCode || null,
        reasonText: nextReasonCode === 'other' ? nextReasonText.trim() || null : null,
        relatedType: action.relatedType, relatedId: action.relatedId, recurrence: 'none' as const,
      } : undefined;
      await window.atoumweb.crm.actions.complete(action.id, {
        channel,
        outcome,
        notes: completionNotes.trim() || null,
        nextAction: outcome === 'categorical_refusal' ? null : explicitNext,
      });
      if (outcome === 'categorical_refusal') {
        await window.atoumweb.crm.prospects.updateQualification(prospect.id, { lostReasonCode: 'categorical_refusal' });
        await window.atoumweb.crm.prospects.changeStage(prospect.id, 'lost', 'Refus catégorique');
      }
      completeGuard.saved();setCompletingId(null); setCompletionNotes(''); resetNext();
      onChanged(outcome === 'categorical_refusal' ? 'Refus enregistré et prospect classé comme perdu.' : 'Action terminée et enregistrée dans l’historique.');
      window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) { setError(cleanError(e)); }
    finally { setBusy(false); }
  }

  async function cancelAction(action: CrmAction) {
    setBusy(true); setError('');
    try {
      await window.atoumweb.crm.actions.cancel(action.id);
      if (completingId === action.id) setCompletingId(null);
      onChanged('Action annulée.'); window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) { setError(cleanError(e)); }
    finally { setBusy(false); }
  }

  const visibleJournal = showAllJournal ? journal : journal.slice(0, 10);
  const latestJournalDate = journal[0]?.createdAt ? new Date(journal[0].createdAt).toLocaleString('fr-FR') : 'Aucune activité';

  return <>
    <section className="prospect-work-section prospect-actions-panel">
      <div className="work-section-heading"><div><span className="eyebrow">Actions & relances</span><strong>{openActions.length} en cours</strong></div><button className="secondary-button compact-button" type="button" onClick={() => setCreateOpen((value) => !value)}>{createOpen ? 'Fermer' : '+ Action'}</button></div>

      {createOpen && <div className="inline-editor">
        <strong>Programmer une action</strong>
        <div className="action-editor-grid">
          <label>Action<select value={preset} onChange={(e) => selectPreset(e.target.value)} disabled={busy}>{presets.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label>À qui ?<select value={targetContactId} onChange={(e) => setTargetContactId(e.target.value)} disabled={busy}><option value="">Prospect / entreprise</option>{contactOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label>Pourquoi ?<select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} disabled={busy}>{reasons.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          {reasonCode === 'other' && <label>Préciser le motif<input value={reasonText} onChange={(e) => setReasonText(e.target.value)} disabled={busy} /></label>}
          <label className="span-2">Objet<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Action à réaliser" disabled={busy} /></label>
          <label>Date<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={busy} /></label>
          <label>Heure <small>(facultative)</small><input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} disabled={busy} /></label>
          <label className="span-all">Contexte / note<textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ce qu’il faut savoir au moment du rappel ou de l’action…" disabled={busy} /></label>
        </div>
        {quoteContext && latestQuote && <small className="muted">Lié à {latestQuote.number} · {latestQuote.subject}</small>}
        <details><summary>Options avancées</summary><label>Récurrence<select value={recurrence} onChange={(e) => setRecurrence(e.target.value as typeof recurrence)} disabled={busy}>{RECURRENCES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></details>
        <div className="inline-editor-actions"><button className="secondary-button" type="button" onClick={() => {actionGuard.discard();setCreateOpen(false);}}>Annuler</button><button className="primary-button" type="button" disabled={busy} onClick={() => void createAction()}>Enregistrer l’action</button></div>
      </div>}

      {openActions.length === 0 ? <p className="muted">Aucune action en cours.</p> : <div className="work-items">{openActions.map((action) => <div className="work-item action-work-item" key={action.id}>
        <button className="work-check" type="button" title="Action effectuée : saisir le compte rendu" aria-label="Action effectuée : saisir le compte rendu" onClick={() => completeGuard.request(() => { const opening = completingId !== action.id; setCompletingId(opening ? action.id : null); if (opening) { setOutcome('prospect_reached'); setCompletionNotes(''); resetNext(); } })}>✓ Effectuée</button>
        <div className="work-item-main"><strong>{action.title}</strong><small>{action.type === 'follow_up' ? 'Rappel / relance' : 'Action'} · {date(action.dueAt)}{action.dueAt&&new Date(action.dueAt).getTime()<Date.now()?' · En retard':''} · {contactLabel(action.targetContactId)}{reasonLabel(action.reasonCode, action.reasonText) ? ` · ${reasonLabel(action.reasonCode, action.reasonText)}` : ''}{action.notes ? ` · ${action.notes}` : ''}</small></div>
        <button className="secondary-button compact-button" type="button" disabled={busy} onClick={() => void cancelAction(action)}>Annuler l’action</button>
        {completingId === action.id && <div className="inline-editor action-completion-editor">
          <strong>Terminer : {action.title}</strong>
          <div className="action-editor-grid">
            <label>Canal<select value={channel} onChange={(e) => setChannel(e.target.value)} disabled={busy}>{CHANNELS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <label className="span-2">Résultat<select value={outcome} onChange={(e) => selectOutcome(e.target.value, action)} disabled={busy}>{OUTCOMES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <label className="span-all">Compte rendu<textarea value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)} placeholder="Ce qui s’est passé, ce qui a été convenu, information utile…" disabled={busy} /></label>
          </div>
          {outcome === 'categorical_refusal' && <p className="form-error">Le prospect sera classé « Perdu » avec le motif « Refus catégorique ». Aucune relance ne sera créée automatiquement.</p>}
          {outcome !== 'categorical_refusal' && <label className="check-option"><input type="checkbox" checked={programNext} onChange={(e) => setProgramNext(e.target.checked)} disabled={busy} />Programmer une suite</label>}
          {programNext && outcome !== 'categorical_refusal' && <div className="action-followup-grid">
            <label className="span-2">Action suivante<input value={nextTitle} onChange={(e) => setNextTitle(e.target.value)} placeholder="Ex. rappeler le décisionnaire" disabled={busy} /></label>
            <label>À qui ?<select value={nextTargetContactId} onChange={(e) => setNextTargetContactId(e.target.value)} disabled={busy}><option value="">Prospect / entreprise</option>{contactOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <label>Pourquoi ?<select value={nextReasonCode} onChange={(e) => setNextReasonCode(e.target.value)} disabled={busy}>{GENERAL_REASONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            {nextReasonCode === 'other' && <label className="span-2">Préciser le motif<input value={nextReasonText} onChange={(e) => setNextReasonText(e.target.value)} disabled={busy} /></label>}
            <label>Date<input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} disabled={busy} /></label>
            <label>Heure <small>(facultative)</small><input type="time" value={nextTime} onChange={(e) => setNextTime(e.target.value)} disabled={busy} /></label>
            <label className="span-all">Contexte / note<input value={nextNotes} onChange={(e) => setNextNotes(e.target.value)} placeholder="Ex. le décisionnaire revient jeudi matin" disabled={busy} /></label>
          </div>}
          <div className="inline-editor-actions"><button className="secondary-button" type="button" onClick={() => {completeGuard.discard();setCompletingId(null);}}>Annuler</button><button className="primary-button" type="button" disabled={busy} onClick={() => void completeAction(action)}>{outcome === 'categorical_refusal' ? 'Terminer et classer comme perdu' : programNext ? 'Terminer et programmer la suite' : 'Terminer l’action'}</button></div>
        </div>}
      </div>)}</div>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>

    {showJournal&&<details className="activity-journal">
      <summary><span>Historique du dossier · {journal.length} événement{journal.length > 1 ? 's' : ''}</span><small>Dernière activité : {latestJournalDate}</small></summary>
      <div className="activity-journal-content">
        {visibleJournal.map((event) => <div className="activity-item" key={event.id}><span className="activity-dot" /><div><p>{humanActivity(event.summary)}</p><small>{new Date(event.createdAt).toLocaleString('fr-FR')}</small></div></div>)}
        {journal.length === 0 && <p className="muted">Aucune activité.</p>}
        {journal.length > 10 && <button type="button" className="secondary-button compact-button" onClick={(event) => { event.preventDefault(); setShowAllJournal((value) => !value); }}>{showAllJournal ? 'Afficher les 10 plus récents' : `Afficher les ${journal.length} événements`}</button>}
      </div>
    </details>}
  </>;
}
