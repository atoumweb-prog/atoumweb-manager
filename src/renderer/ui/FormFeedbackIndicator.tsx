import { AppNotice } from './AppNotice';
import { resolveFormFeedback, type FormFeedbackInput } from '../../shared/formFeedback';

/**
 * 01E pilot: visible state for a single editor, not a global "everything saved".
 *
 * The business editor owns its saving, conflicts, revisions and UX-01 guard.
 * Do not set serviceConfirmed on click: wait for the actual save service reply.
 */
export function FormFeedbackIndicator({ editorLabel, feedback }: {
  editorLabel: string;
  feedback: Readonly<FormFeedbackInput>;
}) {
  const view = resolveFormFeedback(feedback);
  return <div className="aw-form-feedback" data-form-feedback={view.kind}>
    <AppNotice level={view.level}>
      <strong>{editorLabel} :</strong> {view.text}
    </AppNotice>
  </div>;
}
