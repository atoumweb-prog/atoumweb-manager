import { useEffect, useMemo, useState } from 'react';
import {
  PROSPECT_SOURCES,
  PROSPECT_TEMPERATURES,
  type ActivityEvent,
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
  'quote_sent',
  'follow_up',
  'negotiation',
  'waiting',
];

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

interface ActionEditor {
  prospectId: string;
  date: string;
  text: string;
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
  temperature: 'warm',
  estimatedValueEuros: '',
  nextActionDate: '',
  nextActionText: '',
};

function dateInputValue(value?: string | null): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

export function ProspectsPage({ onMessage }: { onMessage: (message: string) => void }) {
  const [prospects, setProspects] = useState<ProspectSummary[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [draft, setDraft] = useState<ProspectDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<ProspectStage | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [actionEditor, setActionEditor] = useState<ActionEditor | null>(null);
  const [lostEditor, setLostEditor] = useState<LostEditor | null>(null);

  async function refresh(): Promise<void> {
    setLoading(true);
    try {
      let next = await window.atoumweb.crm.prospects.list();
      const inconsistentConverted = next.filter((prospect) => prospect.clientAccountId && prospect.stage !== 'won');
      if (inconsistentConverted.length > 0) {
        await Promise.all(inconsistentConverted.map((prospect) => window.atoumweb.crm.prospects.changeStage(prospect.id, 'won')));
        next = await window.atoumweb.crm.prospects.list();
      }
      setProspects(next);
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

  const activeProspects = useMemo(
    () => prospects.filter((prospect) => !prospect.clientAccountId && prospect.stage !== 'won' && prospect.stage !== 'lost'),
    [prospects],
  );

  const closedProspects = useMemo(
    () => prospects.filter((prospect) => Boolean(prospect.clientAccountId) || prospect.stage === 'won' || prospect.stage === 'lost'),
    [prospects],
  );

  const byStage = useMemo(() => {
    const map = new Map<ProspectStage, ProspectSummary[]>();
    ACTIVE_STAGES.forEach((stage) => map.set(stage, []));
    activeProspects.forEach((prospect) => {
      const stage = prospect.stage ?? 'new';
      if (ACTIVE_STAGES.includes(stage)) map.get(stage)?.push(prospect);
    });
    return map;
  }, [activeProspects]);

  const selected = prospects.find((prospect) => prospect.id === selectedId) ?? null;

  function selectProspect(prospect: ProspectSummary): void {
    setSelectedId(prospect.id);
    setExpandedCardId((current) => current === prospect.id ? null : prospect.id);
    setActionEditor(null);
    setLostEditor(null);
  }

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
        nextActionAt: draft.nextActionDate ? new Date(`${draft.nextActionDate}T09:00:00`).toISOString() : null,
        nextActionText: draft.nextActionText.trim() || null,
      });

      setDraft(EMPTY_DRAFT);
      setShowForm(false);
      await refresh();
      setSelectedId(prospect.id);
      setExpandedCardId(prospect.id);
      onMessage('Prospect créé.');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Impossible de créer le prospect.');
    } finally {
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

  async function changeStage(prospect: ProspectSummary, stage: ProspectStage): Promise<void> {
    if (stage === prospect.stage) return;
    if (prospect.clientAccountId) {
      onMessage('Ce prospect est déjà devenu client. Son statut se gère désormais dans Clients.');
      return;
    }
    if (!ACTIVE_STAGES.includes(stage)) return;
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

  function defaultFollowUpText(prospect: ProspectSummary): string {
    return prospect.nextActionText?.trim() || 'Relancer le prospect';
  }

  async function schedulePreset(prospect: ProspectSummary, days: number): Promise<void> {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(9, 0, 0, 0);
    await window.atoumweb.crm.prospects.setNextAction(prospect.id, date.toISOString(), defaultFollowUpText(prospect));
    await refresh();
    onMessage(`Relance programmée dans ${days} jour${days > 1 ? 's' : ''}.`);
  }

  function openActionEditor(prospect: ProspectSummary): void {
    setSelectedId(prospect.id);
    setExpandedCardId(prospect.id);
    setLostEditor(null);
    setActionEditor({
      prospectId: prospect.id,
      date: dateInputValue(prospect.nextActionAt),
      text: defaultFollowUpText(prospect),
    });
  }

  async function saveAction(): Promise<void> {
    if (!actionEditor) return;
    const text = actionEditor.text.trim();
    if (!actionEditor.date || !text) {
      onMessage('Renseigne une date et une action.');
      return;
    }
    const parsed = new Date(`${actionEditor.date}T09:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      onMessage('Date invalide.');
      return;
    }
    await window.atoumweb.crm.prospects.setNextAction(actionEditor.prospectId, parsed.toISOString(), text);
    setActionEditor(null);
    await refresh();
    onMessage('Prochaine action enregistrée.');
  }

  async function clearFollowUp(prospect: ProspectSummary): Promise<void> {
    await window.atoumweb.crm.prospects.setNextAction(prospect.id, null, null);
    setActionEditor(null);
    await refresh();
    onMessage('Prochaine action retirée.');
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
    if (seeding) return;
    const missingStages = ACTIVE_STAGES.filter((stage) => (byStage.get(stage)?.length ?? 0) === 0);
    if (missingStages.length === 0) {
      onMessage('Le pipeline contient déjà au moins un dossier dans chaque étape active.');
      return;
    }

    setSeeding(true);
    try {
      const suffix = Date.now().toString().slice(-6);
      for (const [index, stage] of missingStages.entries()) {
        const organization = await window.atoumweb.crm.organizations.create({ name: `[DEV] ${STAGE_LABELS[stage]} ${suffix}-${index + 1}` });
        const contact = await window.atoumweb.crm.contacts.create({
          organizationId: organization.id,
          firstName: 'Contact',
          lastName: `Test ${index + 1}`,
          email: `dev-${suffix}-${index + 1}@atoumweb.test`,
        });
        await window.atoumweb.crm.prospects.create({
          organizationId: organization.id,
          contactId: contact.id,
          stage,
          temperature: index % 3 === 0 ? 'hot' : index % 3 === 1 ? 'warm' : 'cold',
          source: 'website',
          primaryNeed: `Dossier de test — ${STAGE_LABELS[stage]}`,
          estimatedValueCents: 50000 + (index * 10000),
          nextActionText: 'Action de test',
        });
      }
      await refresh();
      onMessage(`${missingStages.length} dossier${missingStages.length > 1 ? 's' : ''} de test créé${missingStages.length > 1 ? 's' : ''}.`);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="crm-stack">
      <div className="module-toolbar prospect-toolbar">
        <div><strong>{activeProspects.length}</strong><span> prospect{activeProspects.length > 1 ? 's' : ''} actif{activeProspects.length > 1 ? 's' : ''}</span></div>
        <div className="toolbar-controls prospect-toolbar-actions">
          <button className="secondary-button" type="button" onClick={() => void refresh()}>↻ Actualiser</button>
          <button className="secondary-button dev-button" type="button" disabled={seeding} onClick={() => void seedDevelopmentPipeline()}>{seeding ? 'Création…' : 'DEV · Remplir le pipeline'}</button>
          <button className="secondary-button" type="button" onClick={() => setShowClosed((value) => !value)}>{showClosed ? 'Masquer les clos' : `Historique (${closedProspects.length})`}</button>
          <button className="primary-button" type="button" onClick={() => setShowForm((value) => !value)}>{showForm ? 'Fermer' : '+ Nouveau prospect'}</button>
        </div>
      </div>

      {showForm && (
        <form className="panel crm-form" onSubmit={(event) => void submitProspect(event)}>
          <div className="panel-title"><div><span className="eyebrow">Prospect</span><h2>Nouveau contact commercial</h2></div></div>
          <div className="form-grid">
            <label>Société<input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} /></label>
            <label>Prénom<input value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} /></label>
            <label>Nom<input value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} /></label>
            <label>Email<input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></label>
            <label>Téléphone<input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
            <label>Besoin principal<input value={draft.primaryNeed} onChange={(e) => setDraft({ ...draft, primaryNeed: e.target.value })} /></label>
            <label>Source<select value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value as ProspectSource })}>{PROSPECT_SOURCES.map((source) => <option key={source} value={source}>{SOURCE_LABELS[source]}</option>)}</select></label>
            <label>Température<select value={draft.temperature} onChange={(e) => setDraft({ ...draft, temperature: e.target.value as ProspectTemperature })}>{PROSPECT_TEMPERATURES.map((temperature) => <option key={temperature} value={temperature}>{TEMPERATURE_LABELS[temperature]}</option>)}</select></label>
            <label>Valeur estimée (€)<input inputMode="decimal" value={draft.estimatedValueEuros} onChange={(e) => setDraft({ ...draft, estimatedValueEuros: e.target.value })} placeholder="Ex. 900" /></label>
            <label>Prochaine action — date<input type="date" value={draft.nextActionDate} onChange={(e) => setDraft({ ...draft, nextActionDate: e.target.value })} /></label>
            <label className="form-span-2">Prochaine action<input value={draft.nextActionText} onChange={(e) => setDraft({ ...draft, nextActionText: e.target.value })} placeholder="Ex. rappeler pour valider le besoin" /></label>
          </div>
          {formError && <p className="form-error">{formError}</p>}
          <div className="form-actions"><button className="primary-button" disabled={saving} type="submit">{saving ? 'Création…' : 'Créer le prospect'}</button></div>
        </form>
      )}

      {showClosed && (
        <section className="panel closed-prospects-panel">
          <div className="panel-title"><div><span className="eyebrow">Historique</span><h2>Dossiers prospects clos</h2><p className="muted">Les clients gagnés et les prospects perdus quittent le pipeline actif mais restent ici pour l’historique.</p></div></div>
          <div className="closed-prospect-grid">
            {closedProspects.map((prospect) => (
              <button className="closed-prospect-card" type="button" key={prospect.id} onClick={() => { setSelectedId(prospect.id); setExpandedCardId(null); }}>
                <strong>{prospect.displayName}</strong>
                <span>{prospect.clientAccountId || prospect.stage === 'won' ? 'Gagné · devenu client' : 'Perdu'}</span>
                <small>{prospect.primaryNeed || 'Besoin non renseigné'}</small>
                {prospect.lostReason && <small>Raison : {prospect.lostReason}</small>}
              </button>
            ))}
            {closedProspects.length === 0 && <p className="muted">Aucun dossier clos.</p>}
          </div>
        </section>
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
                          <span className={`temperature temperature-${prospect.temperature ?? 'warm'}`}>{TEMPERATURE_LABELS[prospect.temperature ?? 'warm']}</span>
                        </div>

                        <div className="prospect-card-body" onClick={() => setSelectedId(prospect.id)}>
                          {prospect.secondaryLabel && <small>{prospect.secondaryLabel}</small>}
                          <p>{prospect.primaryNeed || 'Besoin à préciser'}</p>
                          <div className="prospect-meta">
                            <span>{prospect.estimatedValueCents != null ? `${(prospect.estimatedValueCents / 100).toLocaleString('fr-FR')} €` : 'Valeur non estimée'}</span>
                            <span className={prospect.nextActionAt && new Date(prospect.nextActionAt) < new Date() ? 'overdue' : ''}>{prospect.nextActionAt ? `${prospect.nextActionText || 'Action'} · ${new Date(prospect.nextActionAt).toLocaleDateString('fr-FR')}` : 'Aucune relance'}</span>
                          </div>
                          <div className="quick-followups" onClick={(event) => event.stopPropagation()}>
                            <button type="button" onClick={() => void schedulePreset(prospect, 1)}>Demain</button>
                            <button type="button" onClick={() => void schedulePreset(prospect, 3)}>+3 j</button>
                            <button type="button" onClick={() => void schedulePreset(prospect, 7)}>+7 j</button>
                            <button type="button" onClick={() => void schedulePreset(prospect, 30)}>+30 j</button>
                            <button type="button" onClick={() => openActionEditor(prospect)}>Date / action…</button>
                            {prospect.nextActionAt && <button type="button" onClick={() => void clearFollowUp(prospect)}>×</button>}
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

          {selected && (
            <aside className="panel prospect-detail-panel">
              <div className="detail-panel-heading">
                <div><span className="eyebrow">Fiche prospect</span><h2>{selected.displayName}</h2></div>
                <button className="close-detail" type="button" onClick={() => { setSelectedId(null); setExpandedCardId(null); setActionEditor(null); setLostEditor(null); }}>×</button>
              </div>

              <div className="detail-badges">
                <span className={`temperature temperature-${selected.temperature ?? 'warm'}`}>{TEMPERATURE_LABELS[selected.temperature ?? 'warm']}</span>
                <span className="status-pill">{selected.clientAccountId ? 'Client' : STAGE_LABELS[selected.stage ?? 'new']}</span>
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

              {actionEditor?.prospectId === selected.id && (
                <div className="inline-editor">
                  <strong>Programmer une action</strong>
                  <label>Date<input type="date" value={actionEditor.date} onChange={(event) => setActionEditor({ ...actionEditor, date: event.target.value })} /></label>
                  <label>Action<input value={actionEditor.text} onChange={(event) => setActionEditor({ ...actionEditor, text: event.target.value })} placeholder="Ex. rappeler le client" /></label>
                  <div className="inline-editor-actions"><button className="secondary-button compact-button" type="button" onClick={() => setActionEditor(null)}>Annuler</button><button className="primary-button compact-button" type="button" onClick={() => void saveAction()}>Enregistrer</button></div>
                </div>
              )}

              {lostEditor?.prospectId === selected.id && (
                <div className="inline-editor danger-editor">
                  <strong>Classer ce prospect comme perdu</strong>
                  <p className="muted">Il quittera le pipeline actif mais restera dans Historique.</p>
                  <label>Raison<textarea value={lostEditor.reason} onChange={(event) => setLostEditor({ ...lostEditor, reason: event.target.value })} placeholder="Ex. budget insuffisant, projet abandonné…" /></label>
                  <div className="inline-editor-actions"><button className="secondary-button compact-button" type="button" onClick={() => setLostEditor(null)}>Annuler</button><button className="danger-button compact-button" type="button" onClick={() => void confirmLost()}>Confirmer Perdu</button></div>
                </div>
              )}

              {!selected.clientAccountId && selected.stage !== 'lost' && (
                <div className="detail-actions">
                  <button className="secondary-button" type="button" onClick={() => openActionEditor(selected)}>Programmer une action</button>
                  <button className="secondary-button danger-outline" type="button" onClick={() => openLostEditor(selected)}>Perdu</button>
                  <button className="primary-button" type="button" onClick={() => void convert(selected)}>Transformer en client</button>
                </div>
              )}

              <div className="activity-preview">
                <strong>Historique</strong>
                {activity.slice(0, 10).map((event) => (
                  <div className="activity-item" key={event.id}><span className="activity-dot" /><div><p>{event.summary}</p><small>{new Date(event.createdAt).toLocaleString('fr-FR')}</small></div></div>
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
