import { useEffect, useMemo, useState } from 'react';
import {
  PROSPECT_SOURCES,
  PROSPECT_STAGES,
  PROSPECT_TEMPERATURES,
  type ActivityEvent,
  type ProspectSource,
  type ProspectStage,
  type ProspectSummary,
  type ProspectTemperature,
} from '../../shared/crm';

const STAGE_LABELS: Record<ProspectStage, string> = {
  new: 'Nouveau contact',
  qualifying: 'À qualifier',
  need_identified: 'Besoin identifié',
  quote_to_prepare: 'Devis à préparer',
  quote_sent: 'Devis envoyé',
  follow_up: 'À relancer',
  negotiation: 'Négociation',
  waiting: 'En attente',
  won: 'Gagné',
  lost: 'Perdu',
};

const TEMPERATURE_LABELS: Record<ProspectTemperature, string> = {
  cold: 'Froid',
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
  nextActionDate: string;
  nextActionText: string;
}

const EMPTY_DRAFT: ProspectDraft = {
  company: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  primaryNeed: '',
  source: 'website',
  temperature: 'warm',
  estimatedValueEuros: '',
  nextActionDate: '',
  nextActionText: '',
};

export function ProspectsPage({ onMessage }: { onMessage: (message: string) => void }) {
  const [prospects, setProspects] = useState<ProspectSummary[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<ProspectDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function refresh(): Promise<void> {
    setLoading(true);
    try {
      setProspects(await window.atoumweb.crm.prospects.list());
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
  }, [selectedId, prospects]);

  const byStage = useMemo(() => {
    const map = new Map<ProspectStage, ProspectSummary[]>();
    PROSPECT_STAGES.forEach((stage) => map.set(stage, []));
    prospects.forEach((prospect) => {
      const stage = prospect.stage ?? 'new';
      map.get(stage)?.push(prospect);
    });
    return map;
  }, [prospects]);

  const selected = prospects.find((prospect) => prospect.id === selectedId) ?? null;

  async function submitProspect(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setFormError(null);
    if (!draft.company.trim() && (!draft.firstName.trim() || !draft.lastName.trim())) {
      setFormError('Renseigne une société ou le prénom et le nom du contact.');
      return;
    }

    setSaving(true);
    try {
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
        ? Math.round(Number(draft.estimatedValueEuros.replace(',', '.')) * 100)
        : null;
      if (value != null && (!Number.isFinite(value) || value < 0)) {
        throw new Error('La valeur estimée est invalide.');
      }

      const prospect = await window.atoumweb.crm.prospects.create({
        organizationId,
        contactId,
        stage: 'new',
        temperature: draft.temperature,
        source: draft.source,
        primaryNeed: draft.primaryNeed.trim() || null,
        estimatedValueCents: value,
        nextActionAt: draft.nextActionDate ? new Date(`${draft.nextActionDate}T09:00:00`).toISOString() : null,
        nextActionText: draft.nextActionText.trim() || null,
      });

      setDraft(EMPTY_DRAFT);
      setShowForm(false);
      await refresh();
      setSelectedId(prospect.id);
      onMessage('Prospect créé.');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Impossible de créer le prospect.');
    } finally {
      setSaving(false);
    }
  }

  async function changeStage(prospect: ProspectSummary, stage: ProspectStage): Promise<void> {
    if (stage === prospect.stage) return;
    let lostReason: string | null = null;
    if (stage === 'lost') {
      lostReason = window.prompt('Pourquoi ce prospect est-il perdu ?')?.trim() || null;
      if (!lostReason) return;
    }
    await window.atoumweb.crm.prospects.changeStage(prospect.id, stage, lostReason);
    await refresh();
    onMessage(`Prospect déplacé vers « ${STAGE_LABELS[stage]} ».`);
  }

  function defaultFollowUpText(prospect: ProspectSummary): string {
    return prospect.nextActionText?.trim() || 'Relancer le prospect';
  }

  async function scheduleFollowUp(prospect: ProspectSummary, days: number): Promise<void> {
    const action = window.prompt('Action à prévoir ?', defaultFollowUpText(prospect))?.trim();
    if (!action) return;
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(9, 0, 0, 0);
    await window.atoumweb.crm.prospects.setNextAction(prospect.id, date.toISOString(), action);
    await refresh();
    onMessage(`Prochaine action programmée dans ${days} jour${days > 1 ? 's' : ''}.`);
  }

  async function scheduleCustomFollowUp(prospect: ProspectSummary): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const dateText = window.prompt('Date de la prochaine action (AAAA-MM-JJ)', today)?.trim();
    if (!dateText) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
      onMessage('Date invalide. Utilise le format AAAA-MM-JJ.');
      return;
    }
    const parsed = new Date(`${dateText}T09:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      onMessage('Date invalide.');
      return;
    }
    const action = window.prompt('Action à prévoir ?', defaultFollowUpText(prospect))?.trim();
    if (!action) return;
    await window.atoumweb.crm.prospects.setNextAction(prospect.id, parsed.toISOString(), action);
    await refresh();
    onMessage('Prochaine action personnalisée enregistrée.');
  }

  async function clearFollowUp(prospect: ProspectSummary): Promise<void> {
    await window.atoumweb.crm.prospects.setNextAction(prospect.id, null, null);
    await refresh();
    onMessage('Prochaine action retirée.');
  }

  async function convert(prospect: ProspectSummary): Promise<void> {
    const result = await window.atoumweb.crm.prospects.convertToClient(prospect.id);
    await refresh();
    onMessage(result.createdClient ? 'Prospect transformé en nouveau client.' : 'Prospect rattaché au client existant.');
  }

  return (
    <div className="crm-stack">
      <div className="module-toolbar">
        <div>
          <strong>{prospects.length}</strong>
          <span> prospect{prospects.length > 1 ? 's' : ''}</span>
        </div>
        <button className="primary-button" type="button" onClick={() => setShowForm((value) => !value)}>
          {showForm ? 'Fermer' : '+ Nouveau prospect'}
        </button>
      </div>

      {showForm && (
        <form className="panel crm-form" onSubmit={(event) => void submitProspect(event)}>
          <div className="panel-title">
            <div><span className="eyebrow">Prospect</span><h2>Nouveau contact commercial</h2></div>
          </div>
          <div className="form-grid">
            <label>Société<input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} /></label>
            <label>Prénom<input value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} /></label>
            <label>Nom<input value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} /></label>
            <label>Email<input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
            <label>Téléphone<input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
            <label>Besoin principal<input value={draft.primaryNeed} onChange={(e) => setDraft({ ...draft, primaryNeed: e.target.value })} /></label>
            <label>Source<select value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value as ProspectSource })}>{PROSPECT_SOURCES.map((source) => <option key={source} value={source}>{SOURCE_LABELS[source]}</option>)}</select></label>
            <label>Température<select value={draft.temperature} onChange={(e) => setDraft({ ...draft, temperature: e.target.value as ProspectTemperature })}>{PROSPECT_TEMPERATURES.map((temperature) => <option key={temperature} value={temperature}>{TEMPERATURE_LABELS[temperature]}</option>)}</select></label>
            <label>Valeur estimée (€)<input inputMode="decimal" value={draft.estimatedValueEuros} onChange={(e) => setDraft({ ...draft, estimatedValueEuros: e.target.value })} /></label>
            <label>Prochaine action — date<input type="date" value={draft.nextActionDate} onChange={(e) => setDraft({ ...draft, nextActionDate: e.target.value })} /></label>
            <label className="form-span-2">Prochaine action<input value={draft.nextActionText} onChange={(e) => setDraft({ ...draft, nextActionText: e.target.value })} placeholder="Ex. rappeler pour valider le besoin" /></label>
          </div>
          {formError && <p className="form-error">{formError}</p>}
          <div className="form-actions"><button className="primary-button" disabled={saving} type="submit">{saving ? 'Création…' : 'Créer le prospect'}</button></div>
        </form>
      )}

      {loading ? <div className="panel"><p className="muted">Chargement des prospects…</p></div> : (
        <div className={selected ? 'prospects-layout with-detail' : 'prospects-layout'}>
          <div className="kanban-board">
            {PROSPECT_STAGES.map((stage) => (
              <section className="kanban-column" key={stage}>
                <header><strong>{STAGE_LABELS[stage]}</strong><span>{byStage.get(stage)?.length ?? 0}</span></header>
                <div className="kanban-cards">
                  {(byStage.get(stage) ?? []).map((prospect) => (
                    <article
                      className={`prospect-card ${selectedId === prospect.id ? 'selected-prospect' : ''}`}
                      key={prospect.id}
                      onClick={() => setSelectedId(prospect.id)}
                    >
                      <div className="prospect-card-head">
                        <strong>{prospect.displayName}</strong>
                        <span className={`temperature temperature-${prospect.temperature ?? 'warm'}`}>{TEMPERATURE_LABELS[prospect.temperature ?? 'warm']}</span>
                      </div>
                      {prospect.secondaryLabel && <small>{prospect.secondaryLabel}</small>}
                      <p>{prospect.primaryNeed || 'Besoin à préciser'}</p>
                      <div className="prospect-meta">
                        <span>{prospect.estimatedValueCents != null ? `${(prospect.estimatedValueCents / 100).toLocaleString('fr-FR')} €` : 'Valeur non estimée'}</span>
                        <span className={prospect.nextActionAt && new Date(prospect.nextActionAt) < new Date() ? 'overdue' : ''}>
                          {prospect.nextActionAt ? `${prospect.nextActionText || 'Action'} · ${new Date(prospect.nextActionAt).toLocaleDateString('fr-FR')}` : 'Aucune relance'}
                        </span>
                      </div>
                      <div className="quick-followups" onClick={(event) => event.stopPropagation()}>
                        <button type="button" onClick={() => void scheduleFollowUp(prospect, 1)}>Demain</button>
                        <button type="button" onClick={() => void scheduleFollowUp(prospect, 3)}>+3 j</button>
                        <button type="button" onClick={() => void scheduleFollowUp(prospect, 7)}>+7 j</button>
                        <button type="button" onClick={() => void scheduleFollowUp(prospect, 30)}>+30 j</button>
                        <button type="button" onClick={() => void scheduleCustomFollowUp(prospect)}>Date…</button>
                        {prospect.nextActionAt && <button type="button" onClick={() => void clearFollowUp(prospect)}>×</button>}
                      </div>
                      <select aria-label="Étape du prospect" value={prospect.stage} onClick={(event) => event.stopPropagation()} onChange={(e) => void changeStage(prospect, e.target.value as ProspectStage)}>
                        {PROSPECT_STAGES.map((item) => <option key={item} value={item}>{STAGE_LABELS[item]}</option>)}
                      </select>
                      {!prospect.clientAccountId && prospect.stage !== 'lost' && (
                        <button className="secondary-button compact-button" type="button" onClick={(event) => { event.stopPropagation(); void convert(prospect); }}>Transformer en client</button>
                      )}
                    </article>
                  ))}
                  {(byStage.get(stage)?.length ?? 0) === 0 && <div className="kanban-empty">Aucun prospect</div>}
                </div>
              </section>
            ))}
          </div>

          {selected && (
            <aside className="panel prospect-detail-panel">
              <div className="detail-panel-heading">
                <div>
                  <span className="eyebrow">Fiche prospect</span>
                  <h2>{selected.displayName}</h2>
                </div>
                <button className="close-detail" type="button" onClick={() => setSelectedId(null)}>×</button>
              </div>

              <div className="detail-badges">
                <span className={`temperature temperature-${selected.temperature ?? 'warm'}`}>{TEMPERATURE_LABELS[selected.temperature ?? 'warm']}</span>
                <span className="status-pill">{STAGE_LABELS[selected.stage ?? 'new']}</span>
                {selected.source && <span className="status-pill">{SOURCE_LABELS[selected.source]}</span>}
              </div>

              <div className="summary-list">
                <SummaryLine label="Contact" value={selected.secondaryLabel || 'Non renseigné'} />
                <SummaryLine label="Besoin" value={selected.primaryNeed || 'À préciser'} />
                <SummaryLine label="Besoin secondaire" value={selected.secondaryNeed || '—'} />
                <SummaryLine label="Valeur estimée" value={selected.estimatedValueCents != null ? `${(selected.estimatedValueCents / 100).toLocaleString('fr-FR')} €` : 'Non estimée'} />
                <SummaryLine label="Probabilité" value={selected.probabilityPercent != null ? `${selected.probabilityPercent} %` : 'Non renseignée'} />
                <SummaryLine label="Prochaine action" value={selected.nextActionAt ? `${selected.nextActionText || 'Action'} · ${new Date(selected.nextActionAt).toLocaleDateString('fr-FR')}` : 'Aucune'} />
                <SummaryLine label="Créé le" value={new Date(selected.createdAt).toLocaleDateString('fr-FR')} />
              </div>

              {selected.notes && <div className="client-notes"><strong>Notes</strong><p>{selected.notes}</p></div>}
              {selected.lostReason && <div className="client-notes"><strong>Raison de perte</strong><p>{selected.lostReason}</p></div>}

              <div className="detail-actions">
                <button className="secondary-button" type="button" onClick={() => void scheduleCustomFollowUp(selected)}>Programmer une action</button>
                {!selected.clientAccountId && selected.stage !== 'lost' && <button className="primary-button" type="button" onClick={() => void convert(selected)}>Transformer en client</button>}
              </div>

              <div className="activity-preview">
                <strong>Historique</strong>
                {activity.slice(0, 8).map((event) => (
                  <div className="activity-item" key={event.id}>
                    <span className="activity-dot" />
                    <div><p>{event.summary}</p><small>{new Date(event.createdAt).toLocaleString('fr-FR')}</small></div>
                  </div>
                ))}
                {activity.length === 0 && <p className="muted">Aucune activité enregistrée.</p>}
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return <div className="summary-line"><span>{label}</span><strong>{value}</strong></div>;
}
