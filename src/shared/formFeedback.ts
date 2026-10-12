/**
 * UX/UI V2 — 01E. Presentation-only feedback for ONE form editor.
 *
 * The caller remains responsible for real service results and its own UX-01
 * registration. In particular, serviceConfirmed must only be true following
 * a successful save response for the current editor/revision.
 */
export interface FormFeedbackInput {
  /** A value different from the editor's confirmed baseline. */
  dirty: boolean;
  /** An actual save request for this editor is still running. */
  pending?: boolean;
  /** An unresolved conflict with a remote revision exists. */
  conflict?: boolean;
  /** The latest attempted save failed or was rejected. */
  error?: boolean;
  /** True only after the service acknowledges this editor's save. */
  serviceConfirmed?: boolean;
}

export type FormFeedbackKind = 'clean' | 'dirty' | 'pending' | 'error' | 'conflict' | 'saved';
export type FormFeedbackLevel = 'info' | 'warning' | 'error' | 'success';
export interface FormFeedbackView {
  kind: FormFeedbackKind;
  level: FormFeedbackLevel;
  text: string;
}

/**
 * Acknowledgment is never enough to hide a dirty/pending/error/conflict state.
 * No network call, registry mutation, editor discard, or implicit saving.
 */
export function resolveFormFeedback(input: Readonly<FormFeedbackInput>): FormFeedbackView {
  if (input.conflict) return {
    kind: 'conflict',
    level: 'error',
    text: 'Conflit à résoudre. Les modifications sont conservées.',
  };
  if (input.pending) return {
    kind: 'pending',
    level: 'info',
    text: 'Enregistrement en cours…',
  };
  if (input.error) return {
    kind: 'error',
    level: 'error',
    text: 'Échec de l’enregistrement. Les modifications sont conservées.',
  };
  if (input.dirty) return {
    kind: 'dirty',
    level: 'warning',
    text: 'Modifications non enregistrées.',
  };
  if (input.serviceConfirmed === true) return {
    kind: 'saved',
    level: 'success',
    text: 'Enregistrement confirmé.',
  };
  return {
    kind: 'clean',
    level: 'info',
    text: 'Aucune modification en attente.',
  };
}
