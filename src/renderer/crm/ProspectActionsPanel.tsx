import { useMemo, useState } from 'react';
import type { CrmAction, ProspectSummary } from '../../shared/crm';

const EARLY_PRESETS = [
  ['call', 'Appeler le prospect'],
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

const CHANNELS = [
  ['phone', 'Téléphone'],
  ['email', 'Email'],
  ['sms', 'SMS'],
  ['meeting', 'Rendez-vous'],
  ['other', 'Autre'],
] as const;

const OUTCOMES = [
  ['client_reached', 'Client joint'],
  ['message_left', 'Message laissé'],
  ['email_sent', 'Email envoyé'],
  ['no_answer', 'Pas de réponse'],
  ['awaiting_reply', 'Retour attendu'],
  ['change_requested', 'Demande de modification'],
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
  return value ? new Date(value).toLocaleDateString('fr-FR') : 'Sans date';
}

function toDueAt(value: string): string | null {
  return value ? new Date(`${value}T09:00:00`).toISOString() : null;
}

function isQuoteFollowUpStage(prospect: ProspectSummary): boolean {
  return ['quote_sent', 'follow_up', 'negotiation', 'waiting'].includes(prospect.stage ?? 'new');
}

export function ProspectActionsPanel({ prospect, actions, onChanged }: {
  prospect: ProspectSummary;
  actions: CrmAction[];
  onChanged: (message?: string) => void;
}) {
  const openActions = useMemo(() => actions.filter((item) => item.status === 'open'), [actions]);
  const quoteContext = isQuoteFollowUpStage(prospect);
  const presets = quoteContext ? QUOTE_PRESETS : EARLY_PRESETS;
  const [createOpen, setCreateOpen] = useState(false);
  const [preset, setPreset] = useState<string>(quoteContext ? 'follow_up_quote' : 'call');
  const [title, setTitle] = useState(quoteContext ? 'Relancer pour le devis' : 'Appeler le prospect');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [recurrence, setRecurrence] = useState<'none' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('none');
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [channel, setChannel] = useState('phone');
  const [outcome, setOutcome] = useState('client_reached');
  const [completionNotes, setCompletionNotes] = useState('');
  const [nextTitle, setNextTitle] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function selectPreset(value: string) {
    setPreset(value);
    const item = presets.find(([key]) => key === value);
    setTitle(value === 'custom' ? '' : item?.[1] ?? '');
  }

  async function createAction() {
    if (!title.trim()) { setError('Renseigne l’action à réaliser.'); return; }
    const followUp = quoteContext && preset === 'follow_up_quote';
    if (followUp && !dueDate) { setError('Choisis une date pour la relance du devis.'); return; }
    setBusy(true); setError('');
    try {
      await window.atoumweb.crm.actions.create({
        ownerType: 'prospect',
        ownerId: prospect.id,
        type: followUp ? 'follow_up' : 'action',
        title: title.trim(),
        dueAt: toDueAt(dueDate),
        notes: notes.trim() || null,
        recurrence,
      });
      setCreateOpen(false); setDueDate(''); setNotes(''); setRecurrence('none');
      onChanged(followUp ? 'Relance du devis programmée.' : 'Action commerciale ajoutée.');
      window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  async function completeAction(action: CrmAction) {
    setBusy(true); setError('');
    try {
      const channelLabel = CHANNELS.find(([key]) => key === channel)?.[1] ?? channel;
      const outcomeLabel = OUTCOMES.find(([key]) => key === outcome)?.[1] ?? outcome;
      const explicitNext = nextDate && nextTitle.trim()
        ? {
          ownerType: 'prospect' as const,
          ownerId: prospect.id,
          type: action.type,
          title: nextTitle.trim(),
          dueAt: toDueAt(nextDate),
          relatedType: action.relatedType,
          relatedId: action.relatedId,
          recurrence: action.recurrence ?? 'none',
        }
        : undefined;
      await window.atoumweb.crm.actions.complete(action.id, {
        channel: channelLabel,
        outcome: outcomeLabel,
        notes: completionNotes.trim() || null,
        nextAction: explicitNext,
      });
      setCompletingId(null); setCompletionNotes(''); setNextTitle(''); setNextDate('');
      onChanged('Action terminée et enregistrée dans l’historique.');
      window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  async function cancelAction(action: CrmAction) {
    setBusy(true); setError('');
    try {
      await window.atoumweb.crm.actions.cancel(action.id);
      if (completingId === action.id) setCompletingId(null);
      onChanged('Action annulée.');
      window.dispatchEvent(new Event('atoumweb:changed'));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  return <section className="prospect-work-section prospect-actions-panel">
    <div className="work-section-heading">
      <div><span className="eyebrow">Actions & relances</span><strong>{openActions.length} en cours</strong></div>
      <button className="secondary-button compact-button" type="button" onClick={() => setCreateOpen((value) => !value)}>{createOpen ? 'Fermer' : '+ Action'}</button>
    </div>

    {createOpen && <div className="inline-editor">
      <strong>Programmer une action</strong>
      <label>Action proposée<select value={preset} onChange={(e) => selectPreset(e.target.value)}>{presets.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>Libellé<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Action à réaliser" /></label>
      <label>Date <small>(facultative sauf relance)</small><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>
      <label>Récurrence<select value={recurrence} onChange={(e) => setRecurrence(e.target.value as typeof recurrence)}>{RECURRENCES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>Note<textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Contexte utile, information à demander…" /></label>
      <button className="primary-button" type="button" disabled={busy} onClick={() => void createAction()}>Enregistrer l’action</button>
    </div>}

    {openActions.length === 0 ? <p className="muted">Aucune action en cours.</p> : <div className="work-items">{openActions.map((action) => <div className="work-item action-work-item" key={action.id}>
      <button className="work-check" type="button" title="Terminer" onClick={() => setCompletingId((id) => id === action.id ? null : action.id)}>✓</button>
      <div className="work-item-main"><strong>{action.title}</strong><small>{action.type === 'follow_up' ? 'Relance devis' : 'Action'} · {date(action.dueAt)}{action.notes ? ` · ${action.notes}` : ''}</small></div>
      <button className="secondary-button compact-button" type="button" disabled={busy} onClick={() => void cancelAction(action)}>Annuler</button>
      {completingId === action.id && <div className="inline-editor action-completion-editor">
        <strong>Compte rendu</strong>
        <label>Canal<select value={channel} onChange={(e) => setChannel(e.target.value)}>{CHANNELS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Résultat<select value={outcome} onChange={(e) => setOutcome(e.target.value)}>{OUTCOMES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Compte rendu<textarea value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)} /></label>
        <div className="qualification-two-fields"><label>Prochaine action <small>(facultative)</small><input value={nextTitle} onChange={(e) => setNextTitle(e.target.value)} placeholder="Ex. rappeler après validation" /></label><label>Date suivante<input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} /></label></div>
        <div className="inline-editor-actions"><button className="secondary-button" type="button" onClick={() => setCompletingId(null)}>Annuler</button><button className="primary-button" type="button" disabled={busy} onClick={() => void completeAction(action)}>Terminer l’action</button></div>
      </div>}
    </div>)}</div>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}
