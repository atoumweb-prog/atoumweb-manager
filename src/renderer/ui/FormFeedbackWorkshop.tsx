import { useEffect, useRef, useState } from 'react';
import './form-feedback-workshop.css';
import { AppButton } from './AppButton';
import { AppNotice } from './AppNotice';
import { AppTextField } from './AppTextField';
import { FormFeedbackIndicator } from './FormFeedbackIndicator';
import { UnsavedGroup, installUnsavedLifecycleBridge, requestUnsavedExit, useUnsavedDraft } from '../unsaved/unsaved';
import { mergeDraft } from '../../shared/draftSection';

/**
 * UX V2 01E workshop only: two unrelated fictitious editors.
 * It is NOT exported from App or mounted in an existing business route.
 * The simulation has no business IPC, SQLite connection, or contract effect.
 */
function SimulatedForm({ id }: { id: 'a' | 'b' }) {
  const label = id === 'a' ? 'Dossier fictif A' : 'Dossier fictif B';
  const group = `uxv2:form-workshop/${id}`;
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [requests, setRequests] = useState(0);
  const confirmedText = useRef(''); // Same confirmed baseline as the UX-01 draft, only in this TEST editor.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const saveInFlight = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; if (timer.current !== null) clearTimeout(timer.current); };
  }, []);
  const draft = useUnsavedDraft(`Brouillon du ${label}`, text, { group, pending, discard: setText });

  async function mockSave(refused = false) {
    // A conflict needs an explicit resolution even in this test-only workshop.
    if (conflict || saveInFlight.current) return;
    saveInFlight.current = true;
    setRequests(value => value + 1);
    // Deliberately test-only: the "service reply" is simulated, not persisted.
    const submittedText = text; // Immutable value actually sent to the simulated service.
    setPending(true);
    setError(false);
    setConfirmed(false);
    await new Promise<void>(resolve => { timer.current = setTimeout(resolve, 700); });
    if (!mounted.current) return;
    saveInFlight.current = false;
    if (refused) { setPending(false); setError(true); return; }
    // A later edit must stay dirty; only the submitted snapshot becomes the baseline.
    draft.saved(submittedText);
    confirmedText.current = submittedText;
    setPending(false);
    setConfirmed(true);
  }

  function mockRemoteUpdate() {
    // Exercise the shared three-way conflict detector, not a new merge algorithm.
    // Only a TEST server revision exists; nothing is fetched or persisted.
    const remoteNote = `VERSION DISTANTE TEST — ${label}`;
    const merged = mergeDraft({ note: confirmedText.current }, { note: text }, { note: remoteNote });
    if (merged.conflicts.length === 0) {
      confirmedText.current = remoteNote;
      draft.initial(merged.value.note);
    }
    setText(merged.value.note);
    setConflict(merged.conflicts.length > 0);
    setError(false);
    setConfirmed(false);
  }

  return <article className="aw-form-workshop-card" aria-label={label} data-editor-id={id} data-save-requests={requests}>
    <h2>{label}</h2>
    <AppTextField
      label={`Note fictive — ${label}`}
      value={text}
      onChange={event => { setText(event.target.value); setConfirmed(false); }}
      description="Ce texte reste en mémoire dans l'atelier de démonstration."
    />
    <FormFeedbackIndicator editorLabel={label} feedback={{ dirty: draft.dirty, pending, error, conflict, serviceConfirmed: confirmed }}/>
    <div className="aw-form-workshop-actions">
      <AppButton pending={pending} disabled={conflict} onAction={() => mockSave()}>Simuler un retour positif (TEST)</AppButton>
      <AppButton disabled={pending || conflict} onAction={() => mockSave(true)}>Simuler un échec asynchrone (TEST)</AppButton>
      <AppButton disabled={pending} onAction={() => { setError(true); setConfirmed(false); }}>Simuler un refus (TEST)</AppButton>
      <AppButton disabled={pending} onAction={mockRemoteUpdate}>Simuler une version distante (TEST)</AppButton>
      <AppButton disabled={pending || !conflict} onAction={() => setConflict(false)}>Effacer conflit fictif (TEST)</AppButton>
      <AppButton disabled={pending} onAction={() => { requestUnsavedExit(() => { setConfirmed(false); setError(false); setConflict(false); }, group); }}>Annuler cette note</AppButton>
    </div>
  </article>;
}

export function FormFeedbackWorkshop({ manageLifecycle = true }: { manageLifecycle?: boolean } = {}) {
  const [showA, setShowA] = useState(true);
  const [showB, setShowB] = useState(true);
  useEffect(() => manageLifecycle ? installUnsavedLifecycleBridge() : undefined, [manageLifecycle]);
  return <section className="aw-form-workshop" aria-label="Atelier 01E — formulaires fictifs" onKeyDown={event => {
    if (event.key !== 'Escape') return;
    const id = (event.target as HTMLElement).closest<HTMLElement>('[data-editor-id]')?.dataset.editorId;
    if (id !== 'a' && id !== 'b') return;
    event.preventDefault(); requestUnsavedExit(() => id === 'a' ? setShowA(false) : setShowB(false), `uxv2:form-workshop/${id}`);
  }}>
    <h1>Atelier 01E — formulaires et confirmations</h1>
    <AppNotice level="warning">
      Démonstration TEST isolée : les retours de service sont simulés, rien n'est réellement enregistré.
    </AppNotice>
    <details className="aw-form-workshop-gallery"><summary>Référence visuelle des six états (TEST)</summary>{[
      { dirty: false }, { dirty: true }, { dirty: true, pending: true }, { dirty: true, error: true },
      { dirty: true, conflict: true }, { dirty: false, serviceConfirmed: true },
    ].map((feedback, index) => <FormFeedbackIndicator key={index} editorLabel="État de démonstration" feedback={feedback}/>)}</details>
    <UnsavedGroup name="uxv2:form-workshop">
      <div className="aw-form-workshop-actions">
        <AppButton disabled={showA} onAction={() => setShowA(true)}>Ouvrir A</AppButton>
        <AppButton disabled={showB} onAction={() => setShowB(true)}>Ouvrir B</AppButton>
      </div>
      {showA && <div><SimulatedForm id="a"/><AppButton onAction={() => { requestUnsavedExit(() => setShowA(false), 'uxv2:form-workshop/a'); }}>Fermer A (garde UX-01)</AppButton></div>}
      {showB && <div><SimulatedForm id="b"/><AppButton onAction={() => { requestUnsavedExit(() => setShowB(false), 'uxv2:form-workshop/b'); }}>Fermer B (garde UX-01)</AppButton></div>}
    </UnsavedGroup>
  </section>;
}
