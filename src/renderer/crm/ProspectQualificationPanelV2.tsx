import { useEffect, useMemo, useState } from 'react';
import type { ProspectInput, ProspectSummary } from '../../shared/crm';

const MISSING_OPTIONS = [
  ['logo', 'Logo / charte graphique'],
  ['texts', 'Textes / contenus'],
  ['photos', 'Photos / médias'],
  ['hosting', 'Accès hébergement'],
  ['domain', 'Nom de domaine'],
  ['legal', 'Informations légales'],
  ['budget', 'Budget à confirmer'],
  ['decision', 'Validation du décideur'],
  ['brief', 'Cahier des charges / brief'],
] as const;

type MissingKey = (typeof MISSING_OPTIONS)[number][0];
type ReadinessKey = 'summary' | 'decision' | 'budget' | 'timeline' | 'need';

export function FieldHelp({ text }: { text: string }) {
  return <span className="field-help" tabIndex={0} role="note" aria-label={text} title={text}>?</span>;
}

function parseMissing(value?: string | null): { selected: MissingKey[]; other: string } {
  if (!value) return { selected: [], other: '' };
  try {
    const parsed = JSON.parse(value) as { selected?: MissingKey[]; other?: string };
    return { selected: Array.isArray(parsed.selected) ? parsed.selected : [], other: parsed.other ?? '' };
  } catch {
    return { selected: [], other: value };
  }
}

function eurosToCents(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0) throw new Error('Montant de budget invalide.');
  return Math.round(number * 100);
}

export function ProspectQualificationPanelV2({ prospect, onSaved }: { prospect: ProspectSummary; onSaved: (message?: string) => void }) {
  const parsedMissing = parseMissing(prospect.missingInformation);
  const [draft, setDraft] = useState<Partial<ProspectInput>>({ ...prospect });
  const [budgetKnown, setBudgetKnown] = useState(prospect.budgetMinCents != null ? String(prospect.budgetMinCents / 100) : '');
  const [budgetMin, setBudgetMin] = useState(prospect.budgetMinCents != null ? String(prospect.budgetMinCents / 100) : '');
  const [budgetMax, setBudgetMax] = useState(prospect.budgetMaxCents != null ? String(prospect.budgetMaxCents / 100) : '');
  const [targetDate, setTargetDate] = useState(prospect.targetDate?.slice(0, 10) ?? '');
  const [missing, setMissing] = useState<MissingKey[]>(parsedMissing.selected);
  const [missingOther, setMissingOther] = useState(parsedMissing.other);
  const [needCount, setNeedCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadNeeds = async () => {
      try {
        const needs = await window.atoumweb.workflow.needs('prospect', prospect.id);
        if (!cancelled) setNeedCount(needs.length);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    };
    const reload = () => void loadNeeds();
    void loadNeeds();
    window.addEventListener('atoumweb:changed', reload);
    return () => {
      cancelled = true;
      window.removeEventListener('atoumweb:changed', reload);
    };
  }, [prospect.id]);

  const readiness = useMemo<Array<{ key: ReadinessKey; label: string; ok: boolean }>>(() => {
    const budgetOk = draft.budgetStatus === 'not_disclosed'
      || (draft.budgetStatus === 'known' && Boolean(budgetKnown.trim()))
      || (draft.budgetStatus === 'range' && Boolean(budgetMin.trim()) && Boolean(budgetMax.trim()));
    const timelineOk = draft.timelineStatus === 'not_disclosed'
      || (draft.timelineStatus === 'date' && Boolean(targetDate))
      || (draft.timelineStatus === 'note' && Boolean(draft.timelineNote?.trim()));
    return [
      { key: 'summary', label: 'Résumé du projet', ok: Boolean(draft.projectSummary?.trim()) },
      { key: 'decision', label: 'Décisionnaire', ok: Boolean(draft.decisionStatus) },
      { key: 'budget', label: 'Budget', ok: budgetOk },
      { key: 'timeline', label: 'Calendrier', ok: timelineOk },
      { key: 'need', label: 'Besoin / prestation', ok: needCount > 0 },
    ];
  }, [draft, budgetKnown, budgetMin, budgetMax, targetDate, needCount]);

  async function save() {
    setBusy(true);
    setError('');
    try {
      let minCents: number | null = prospect.budgetMinCents ?? null;
      let maxCents: number | null = prospect.budgetMaxCents ?? null;
      if (draft.budgetStatus === 'known') {
        minCents = eurosToCents(budgetKnown);
        maxCents = minCents;
      } else if (draft.budgetStatus === 'range') {
        minCents = eurosToCents(budgetMin);
        maxCents = eurosToCents(budgetMax);
        if (minCents != null && maxCents != null && minCents > maxCents) throw new Error('Le budget minimum ne peut pas dépasser le maximum.');
      } else if (draft.budgetStatus === 'not_disclosed') {
        minCents = null;
        maxCents = null;
      }

      const normalizedTarget = draft.timelineStatus === 'date' && targetDate ? targetDate : null;
      const missingInformation = JSON.stringify({ selected: missing, other: missingOther.trim() });

      await window.atoumweb.crm.prospects.update(prospect.id, {
        ...prospect,
        budgetMinCents: minCents,
        budgetMaxCents: maxCents,
        targetDate: normalizedTarget,
      });
      const updated = await window.atoumweb.crm.prospects.updateQualification(prospect.id, {
        ...draft,
        missingInformation,
        timelineNote: draft.timelineStatus === 'note' ? draft.timelineNote : null,
      });

      const latestNeeds = await window.atoumweb.workflow.needs('prospect', prospect.id);
      setNeedCount(latestNeeds.length);
      const complete = readiness.filter((item) => item.key !== 'need').every((item) => item.ok) && latestNeeds.length > 0;
      if (prospect.stage === 'qualifying' && complete) {
        await window.atoumweb.crm.prospects.changeStage(prospect.id, 'need_identified');
        onSaved('Qualification enregistrée : le prospect passe automatiquement en « Besoin identifié ».');
      } else if (prospect.stage === 'qualifying' && latestNeeds.length === 0) {
        onSaved('Qualification enregistrée. Ajoute au moins un besoin / une prestation avant le passage en « Besoin identifié ».');
      } else {
        onSaved(updated.stage === 'need_identified' ? 'Qualification mise à jour.' : 'Qualification enregistrée.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function toggleMissing(key: MissingKey) {
    setMissing((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  return <section className="prospect-work-section qualification-panel-v2">
    <div className="work-section-heading">
      <div><span className="eyebrow">Qualification</span><strong>{readiness.filter((x) => x.ok).length}/{readiness.length} informations clés</strong></div>
    </div>
    <div className="qualification-readiness" aria-label="État de préparation">
      {readiness.map((item) => <span key={item.key} className={item.ok ? 'ready' : 'missing'}>{item.ok ? '✓' : '○'} {item.label}</span>)}
    </div>
    <div className="workflow-fields">
      <label>Résumé du projet <FieldHelp text="Décris clairement ce que le prospect veut obtenir. Cette information servira de base au devis." />
        <textarea value={draft.projectSummary ?? ''} onChange={(e) => setDraft({ ...draft, projectSummary: e.target.value })} />
      </label>
      <label>Contexte <FieldHelp text="Note le métier, le problème actuel, les objectifs et les contraintes utiles pour comprendre la demande." />
        <textarea value={draft.projectContext ?? ''} onChange={(e) => setDraft({ ...draft, projectContext: e.target.value })} />
      </label>
      <label>Décisionnaire <FieldHelp text="Indique si ton interlocuteur peut réellement valider le devis. Si ce n’est pas lui, précise qui décide." />
        <select value={draft.decisionStatus ?? ''} onChange={(e) => setDraft({ ...draft, decisionStatus: (e.target.value || null) as ProspectInput['decisionStatus'] })}>
          <option value="">À préciser</option><option value="yes">Oui</option><option value="no">Non</option><option value="unknown">Inconnu</option>
        </select>
      </label>
      {draft.decisionStatus !== 'yes' && <label>Qui décide / précisions <FieldHelp text="Nom, fonction ou fonctionnement de validation si l’interlocuteur n’est pas le décideur." />
        <input value={draft.decisionMakerDetails ?? ''} onChange={(e) => setDraft({ ...draft, decisionMakerDetails: e.target.value })} />
      </label>}

      <label>Budget <FieldHelp text="Permet de vérifier que la proposition est cohérente. Tu peux saisir un montant, une fourchette ou indiquer qu’il n’est pas communiqué." />
        <select value={draft.budgetStatus ?? ''} onChange={(e) => setDraft({ ...draft, budgetStatus: (e.target.value || null) as ProspectInput['budgetStatus'] })}>
          <option value="">À préciser</option><option value="known">Connu</option><option value="range">Fourchette</option><option value="not_disclosed">Non communiqué</option>
        </select>
      </label>
      {draft.budgetStatus === 'known' && <label>Budget connu (€) <FieldHelp text="Montant communiqué par le prospect. Il sert à cadrer la proposition mais ne fixe pas le prix du devis." /><input inputMode="decimal" value={budgetKnown} onChange={(e) => setBudgetKnown(e.target.value)} placeholder="Ex. 1 500" /></label>}
      {draft.budgetStatus === 'range' && <div className="qualification-two-fields"><label>Budget minimum (€) <FieldHelp text="Borne basse de la fourchette annoncée par le prospect." /><input inputMode="decimal" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} /></label><label>Budget maximum (€) <FieldHelp text="Borne haute de la fourchette annoncée par le prospect." /><input inputMode="decimal" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} /></label></div>}

      <label>Calendrier <FieldHelp text="Indique quand le prospect souhaite disposer du site ou du service. Une date réelle peut être saisie directement." />
        <select value={draft.timelineStatus ?? ''} onChange={(e) => setDraft({ ...draft, timelineStatus: (e.target.value || null) as ProspectInput['timelineStatus'] })}>
          <option value="">À préciser</option><option value="date">Date connue</option><option value="note">Indication libre</option><option value="not_disclosed">Non communiqué</option>
        </select>
      </label>
      {draft.timelineStatus === 'date' && <label>Date souhaitée <FieldHelp text="Date cible souhaitée par le prospect. Elle pourra ensuite être confirmée ou ajustée lors de la création du projet." /><input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></label>}
      {draft.timelineStatus === 'note' && <label>Précision calendrier <FieldHelp text="Conserve une contrainte souple lorsque le prospect ne donne pas de date exacte." /><input value={draft.timelineNote ?? ''} onChange={(e) => setDraft({ ...draft, timelineNote: e.target.value })} placeholder="Ex. avant Noël, courant novembre…" /></label>}

      <label>Site ou outil déjà existant ? <FieldHelp text="Précise s’il existe déjà un site, une boutique ou un outil à reprendre, auditer ou remplacer." />
        <select value={draft.existingStatus ?? ''} onChange={(e) => setDraft({ ...draft, existingStatus: (e.target.value || null) as ProspectInput['existingStatus'] })}>
          <option value="">À préciser</option><option value="yes">Oui</option><option value="no">Non</option><option value="unknown">Inconnu</option>
        </select>
      </label>
      {draft.existingStatus === 'yes' && <><label>URL / accès public <FieldHelp text="Adresse du site ou de l’outil existant pour pouvoir l’examiner avant le devis." /><input type="url" value={draft.existingUrl ?? ''} onChange={(e) => setDraft({ ...draft, existingUrl: e.target.value })} placeholder="https://…" /></label><label>Remarques sur l’existant <FieldHelp text="Note les points à conserver, remplacer, migrer ou vérifier sur l’existant." /><textarea value={draft.existingNotes ?? ''} onChange={(e) => setDraft({ ...draft, existingNotes: e.target.value })} /></label></>}

      <fieldset className="missing-info-fieldset"><legend>Informations encore nécessaires <FieldHelp text="Coche ce qu’il faudra récupérer avant ou pendant la préparation du devis. Ces éléments restent visibles dans le suivi." /></legend>
        <div className="missing-info-grid">{MISSING_OPTIONS.map(([key, label]) => <label className="check-option" key={key}><input type="checkbox" checked={missing.includes(key)} onChange={() => toggleMissing(key)} /> {label}</label>)}</div>
        <label>Autre / précisions<textarea value={missingOther} onChange={(e) => setMissingOther(e.target.value)} /></label>
      </fieldset>

      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="button" className="primary-button" disabled={busy} onClick={() => void save()}>{busy ? 'Enregistrement…' : 'Enregistrer la qualification'}</button>
      {prospect.stage === 'qualifying' && readiness.every((item) => item.ok) && <p className="qualification-auto-note">✓ Tous les éléments essentiels, dont au moins un besoin, sont renseignés : l’enregistrement fera passer automatiquement le prospect en « Besoin identifié ».</p>}
      {prospect.stage === 'qualifying' && needCount === 0 && <p className="muted">Ajoute au moins un besoin / une prestation pour pouvoir terminer la qualification.</p>}
    </div>
  </section>;
}
