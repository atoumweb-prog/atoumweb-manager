import { useEffect, useMemo, useRef, useState } from 'react';
import {ProspectDecisionEditor} from './ProspectDecisionEditor';
import { FieldHelp } from '../ui/FieldHelp';
export { FieldHelp } from '../ui/FieldHelp';
import type { ProspectInput, ProspectOrigin, ProspectSummary } from '../../shared/crm';

const TARGETING_REASONS = [
  ['no_site', 'Pas de site'],
  ['old_site', 'Site vieillissant'],
  ['not_mobile', 'Site non adapté mobile'],
  ['poor_local_visibility', 'Mauvaise visibilité locale'],
  ['poor_conversion', 'Pas de réservation / prise de contact efficace'],
  ['weak_identity', 'Identité visuelle faible'],
  ['social_only', 'Réseaux présents mais pas de site'],
  ['no_shop', 'Boutique absente'],
  ['automation', 'Besoin d’automatisation'],
  ['business_opportunity', 'Opportunité métier repérée'],
  ['other', 'Autre'],
] as const;

const CONTACT_RESULTS = [
  ['not_reached', 'Pas joint'],
  ['message_left', 'Message laissé'],
  ['interested', 'Intéressé'],
  ['call_back', 'À rappeler'],
  ['not_interested', 'Pas intéressé'],
  ['asks_information', 'Demande des informations'],
  ['meeting_planned', 'RDV prévu'],
  ['wrong_contact', 'Mauvais interlocuteur'],
  ['other', 'Autre'],
] as const;

const INTEREST_LEVELS: Array<{ value: NonNullable<ProspectInput['interestLevel']>; label: string }> = [
  { value: 'none', label: 'Aucun' },
  { value: 'low', label: 'Faible' },
  { value: 'confirm', label: 'À confirmer' },
  { value: 'interested', label: 'Intéressé' },
  { value: 'very_interested', label: 'Très intéressé' },
];

const ORIGIN_LABELS: Record<ProspectOrigin, string> = {
  outbound: 'Prospection AtoumWeb',
  inbound: 'Demande entrante',
  referral: 'Recommandation',
  existing: 'Ancien client / relation existante',
  partner: 'Partenaire / apporteur',
  other: 'Autre',
};

function inferOrigin(prospect: ProspectSummary): ProspectOrigin {
  if (prospect.originType) return prospect.originType;
  if (prospect.source === 'outbound') return 'outbound';
  if (prospect.source === 'referral') return 'referral';
  if (prospect.source === 'former_client') return 'existing';
  if (prospect.source === 'website' || prospect.source === 'google' || prospect.source === 'social') return 'inbound';
  return 'other';
}

function cleanError(error: unknown): string {
  if (!(error instanceof Error)) return 'Une erreur est survenue.';
  return error.message
    .replace(/^Error invoking remote method ['"][^'"]+['"]:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();
}

export function ProspectQualificationPanelV2({ prospect, onSaved, onGoTo }: { prospect: ProspectSummary; onSaved: (message?: string) => void; onGoTo?: (target: 'identity' | 'decision' | 'contact' | 'need' | 'followup') => void }) {
  const origin = inferOrigin(prospect);
  const [draft, setDraft] = useState<Partial<ProspectInput>>({ ...prospect, originType: origin });
  const [contactCount, setContactCount] = useState(0);
  const [decisionMakerLabel, setDecisionMakerLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const previous=useRef(prospect);

  useEffect(() => {
    const before=previous.current;previous.current=prospect;
    setDraft(current=>before.id!==prospect.id?{...prospect,originType:inferOrigin(prospect)}:{...current,...Object.fromEntries(Object.entries(prospect).filter(([key])=>JSON.stringify(current[key as keyof ProspectInput])===JSON.stringify(before[key as keyof ProspectSummary])))});
  }, [prospect.id,prospect.updatedAt]);

  useEffect(() => {
    let cancelled = false;
    async function loadIdentityContext() {
      try {
        const identity = await window.atoumweb.workflow.identity('prospect', prospect.id);
        const lists = await Promise.all([
          identity.organization ? window.atoumweb.crm.contactMethods.list('organization', identity.organization.id) : Promise.resolve([]),
          identity.contact ? window.atoumweb.crm.contactMethods.list('contact', identity.contact.id) : Promise.resolve([]),
        ]);
        if (!cancelled) {
          setContactCount(lists.flat().length);
          setDecisionMakerLabel(identity.decisionMaker
            ? `${identity.decisionMaker.firstName} ${identity.decisionMaker.lastName}${identity.decisionMaker.jobTitle ? ` · ${identity.decisionMaker.jobTitle}` : ''}`
            : '');
        }
      } catch (e) {
        if (!cancelled) setError(cleanError(e));
      }
    }
    void loadIdentityContext();
    const reload = () => void loadIdentityContext();
    window.addEventListener('atoumweb:changed', reload);
    return () => { cancelled = true; window.removeEventListener('atoumweb:changed', reload); };
  }, [prospect.id]);

  const readiness = useMemo(() => {
    const items: Array<{ key: string; label: string; ok: boolean }> = [
      { key: 'contact', label: 'Moyen de contact valide', ok: contactCount > 0 },
    ];
    const decisionReady = Boolean(draft.decisionStatus)
      && (draft.decisionStatus !== 'no' || Boolean(decisionMakerLabel || draft.decisionMakerDetails?.trim()));
    items.push({ key: 'decision', label: 'Situation du décisionnaire', ok: decisionReady });

    if (origin === 'outbound') {
      items.push(
        { key: 'target', label: 'Motif de ciblage', ok: Boolean(draft.targetingReasonCode || draft.targetingReasonText?.trim()) },
        { key: 'observation', label: 'Constat / opportunité', ok: Boolean(draft.initialObservation?.trim() || draft.detectedOpportunity?.trim()) },
        { key: 'contact_result', label: 'Résultat du premier contact', ok: Boolean(draft.firstContactResultCode || draft.firstContactResultText?.trim()) },
        { key: 'interest', label: 'Intérêt confirmé', ok: draft.interestLevel === 'interested' || draft.interestLevel === 'very_interested' },
      );
    } else if (origin === 'inbound') {
      items.push({ key: 'request', label: 'Demande initiale', ok: Boolean(draft.projectSummary?.trim()) });
    } else {
      items.push({ key: 'context', label: 'Motif / contexte commercial', ok: Boolean(draft.projectSummary?.trim() || draft.projectContext?.trim()) });
    }
    return items;
  }, [contactCount, decisionMakerLabel, draft, origin]);

  const missing = readiness.filter((item) => !item.ok);
  const allReady = missing.length === 0;
  const qualificationStarted = Boolean(
    draft.targetingReasonCode
    || draft.targetingReasonText?.trim()
    || draft.initialObservation?.trim()
    || draft.detectedOpportunity?.trim()
    || draft.firstContactResultCode
    || draft.firstContactResultText?.trim()
    || draft.interestLevel
    || draft.decisionStatus
    || draft.decisionMakerContactId
    || draft.decisionMakerDetails?.trim()
    || draft.projectSummary?.trim()
    || draft.projectContext?.trim()
    || draft.budgetStatus
    || draft.timelineStatus
    || draft.timelineNote?.trim()
    || draft.existingStatus
    || draft.existingUrl?.trim()
    || draft.existingNotes?.trim()
    || draft.missingInformation?.trim()
    || draft.primaryNeed?.trim()
    || draft.secondaryNeed?.trim()
  );
  function goToMissing(key: string) {
    if(key==='decision'){const field=document.querySelector<HTMLElement>('.qualification-panel-v2 [aria-label="Situation du décisionnaire"]');field?.scrollIntoView({behavior:'smooth',block:'center'});field?.focus({preventScroll:true});return;}
    if (key === 'contact') { onGoTo?.(key); return; }
    const labels: Record<string, string> = { target: 'Motif de ciblage', observation: 'Constat', contact_result: 'Résultat du premier contact', interest: 'Niveau d’intérêt', request: 'Demande initiale', context: 'Motif de l’échange' };
    const label = Array.from(document.querySelectorAll<HTMLElement>('.qualification-panel-v2 label')).find((item) => item.textContent?.trim().startsWith(labels[key]));
    label?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    label?.querySelector<HTMLElement>('input, select, textarea')?.focus({ preventScroll: true });
  }

  async function persist(): Promise<ProspectSummary> {
    return window.atoumweb.crm.prospects.updateQualification(prospect.id, {
      originType: origin,
      targetingReasonCode: draft.targetingReasonCode ?? null,
      targetingReasonText: draft.targetingReasonText ?? null,
      initialObservation: draft.initialObservation ?? null,
      detectedOpportunity: draft.detectedOpportunity ?? null,
      firstContactResultCode: draft.firstContactResultCode ?? null,
      firstContactResultText: draft.firstContactResultText ?? null,
      interestLevel: draft.interestLevel ?? null,
      projectSummary: draft.projectSummary ?? null,
      projectContext: draft.projectContext ?? null,
    });
  }

  async function save() {
    setBusy(true); setError('');
    try {
      await persist();
      onSaved(allReady
        ? 'Qualification enregistrée. Tous les éléments minimums sont présents : tu peux la valider.'
        : `Qualification enregistrée. ${missing.length} élément${missing.length > 1 ? 's' : ''} reste${missing.length > 1 ? 'nt' : ''} à compléter.`);
    } catch (e) { setError(cleanError(e)); }
    finally { setBusy(false); }
  }

  async function validateQualification() {
    if (!qualificationStarted) {
      setError('Renseigne au moins une information de qualification avant de passer à l’étape suivante.');
      return;
    }
    setBusy(true); setError('');
    try {
      await persist();
      if (!allReady) {
        const confirmed = window.confirm(`Il reste à préciser : ${missing.map((item) => item.label).join(', ')}.\n\nPasser quand même à « Besoin à identifier » ?\nTu pourras compléter ces informations plus tard.`);
        if (!confirmed) {
          onSaved('Le prospect reste à l’étape « À qualifier ».');
          return;
        }
        await window.atoumweb.crm.prospects.changeStage(prospect.id, 'need_identified', null, true);
        onSaved('Prospect avancé vers « Besoin à identifier » malgré des informations encore à compléter.');
        return;
      }
      await window.atoumweb.crm.prospects.changeStage(prospect.id, 'need_identified');
      onSaved('Qualification validée : le prospect passe en « Besoin à identifier ».');
    } catch (e) { setError(cleanError(e)); }
    finally { setBusy(false); }
  }

  const decisionSummary = draft.decisionStatus === 'yes'
    ? 'L’interlocuteur principal est décisionnaire.'
    : draft.decisionStatus === 'no'
      ? `Décisionnaire : ${decisionMakerLabel || draft.decisionMakerDetails?.trim() || 'à préciser'}.`
      : draft.decisionStatus === 'unknown'
        ? 'Le décisionnaire n’est pas encore connu.'
        : 'La situation du décisionnaire reste à renseigner.';

  return <section className="prospect-work-section qualification-panel-v2">
    <div className="work-section-heading">
      <div><span className="eyebrow">Qualification · {ORIGIN_LABELS[origin]}</span><strong>{readiness.filter((item) => item.ok).length}/{readiness.length} éléments minimums acquis</strong></div>
    </div>

    <div className="qualification-readiness" aria-label="État de la qualification">
      {readiness.map((item) => <span key={item.key} className={item.ok ? 'ready' : 'missing'}>{item.ok ? '✓' : '○'} {item.label}</span>)}
    </div>

    <div className="workflow-fields">
      {origin === 'outbound' && <>
        <label>Motif de ciblage <FieldHelp text="Pourquoi AtoumWeb a sélectionné cette entreprise pour une prise de contact ?" />
          <select value={draft.targetingReasonCode ?? ''} onChange={(e) => setDraft({ ...draft, targetingReasonCode: e.target.value || null })}>
            <option value="">À préciser</option>{TARGETING_REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {draft.targetingReasonCode === 'other' && <label>Autre motif<input value={draft.targetingReasonText ?? ''} onChange={(e) => setDraft({ ...draft, targetingReasonText: e.target.value })} /></label>}
        <label>Constat <FieldHelp text="Ce que tu as observé avant la prise de contact : site absent ou ancien, visibilité faible, parcours client perfectible…" />
          <textarea value={draft.initialObservation ?? ''} onChange={(e) => setDraft({ ...draft, initialObservation: e.target.value })} />
        </label>
        <label>Opportunité détectée <FieldHelp text="Ce qu’AtoumWeb pourrait concrètement améliorer ou apporter à cette entreprise." />
          <textarea value={draft.detectedOpportunity ?? ''} onChange={(e) => setDraft({ ...draft, detectedOpportunity: e.target.value })} />
        </label>
        <label>Résultat du premier contact
          <select value={draft.firstContactResultCode ?? ''} onChange={(e) => setDraft({ ...draft, firstContactResultCode: e.target.value || null })}>
            <option value="">À préciser</option>{CONTACT_RESULTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {draft.firstContactResultCode === 'other' && <label>Préciser le résultat<input value={draft.firstContactResultText ?? ''} onChange={(e) => setDraft({ ...draft, firstContactResultText: e.target.value })} /></label>}
        <label>Niveau d’intérêt
          <select value={draft.interestLevel ?? ''} onChange={(e) => setDraft({ ...draft, interestLevel: (e.target.value || null) as ProspectInput['interestLevel'] })}>
            <option value="">À préciser</option>{INTEREST_LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
      </>}

      {origin === 'inbound' && <>
        <label>Demande initiale <FieldHelp text="Résume ce que le prospect demande au moment où il contacte AtoumWeb. L’identification détaillée du besoin se fera à l’étape suivante." />
          <textarea value={draft.projectSummary ?? ''} onChange={(e) => setDraft({ ...draft, projectSummary: e.target.value })} />
        </label>
        <label>Contexte utile<textarea value={draft.projectContext ?? ''} onChange={(e) => setDraft({ ...draft, projectContext: e.target.value })} /></label>
      </>}

      {!['outbound', 'inbound'].includes(origin) && <>
        <label>Motif de l’échange / demande initiale<textarea value={draft.projectSummary ?? ''} onChange={(e) => setDraft({ ...draft, projectSummary: e.target.value })} /></label>
        <label>Contexte commercial<textarea value={draft.projectContext ?? ''} onChange={(e) => setDraft({ ...draft, projectContext: e.target.value })} /></label>
      </>}

      <div className="qualification-decision-summary">
        <span className="eyebrow">Décisionnaire</span>
        <strong>{decisionSummary}</strong>
        <ProspectDecisionEditor prospect={prospect} onSaved={()=>onSaved('Décisionnaire mis à jour.')} onManageContacts={()=>onGoTo?.('decision')}/>
      </div>

      {!allReady && <div className="qualification-recap" role="status"><strong>Qualification à compléter</strong><p>{readiness.filter((item) => item.ok).length}/{readiness.length} éléments acquis.</p><div>{missing.map((item) => <div className="missing-action" key={item.key}><span>À compléter : {item.label}</span><button type="button" className="secondary-button" onClick={() => goToMissing(item.key)}>Renseigner {item.label.toLocaleLowerCase('fr-FR')}</button></div>)}</div></div>}
      {allReady && <div className="qualification-recap ready" role="status"><strong>Qualification prête à être validée</strong><p>Les éléments commerciaux minimums sont présents. Le besoin détaillé, le budget et le calendrier seront travaillés à l’étape suivante.</p></div>}

      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="qualification-actions"><button type="button" className="secondary-button" disabled={busy} onClick={() => void save()}>{busy ? 'Enregistrement…' : 'Enregistrer la qualification'}</button><button type="button" className="primary-button" disabled={busy || !qualificationStarted} title={!qualificationStarted ? 'Renseigne au moins une information de qualification pour continuer.' : undefined} onClick={() => void validateQualification()}>{allReady ? 'Valider la qualification → Besoin à identifier' : 'Passer à l’étape suivante…'}</button></div>
    </div>
  </section>;
}
