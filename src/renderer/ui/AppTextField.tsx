import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

export type AppTextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'children' | 'type'> & {
  label: string;
  type?: 'text' | 'email' | 'url' | 'search' | 'tel' | 'number' | 'password';
  description?: string;
  error?: string;
  help?: ReactNode;
  /** Optional top-level field wrapper class; input class remains native. */
  containerClassName?: string;
};

/**
 * 01B presentation pilot, no validation rules or automatic persistence.
 * Native input props and onChange are passed through to the existing owner.
 */
export function AppTextField({
  label, description, error, help, id, type = 'text',
  containerClassName, className, 'aria-describedby': describedBy,
  ...inputProps
}: AppTextFieldProps) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const descriptionIds = [
    describedBy,
    description ? hintId : '',
    error ? errorId : ''
  ].filter(Boolean).join(' ');

  return <div className={['aw-ui-field', containerClassName].filter(Boolean).join(' ')}>
    <div className="aw-ui-field-heading">
      <label className="aw-ui-field-label" htmlFor={fieldId}>
        {label}{inputProps.required && <span className="aw-ui-required" aria-hidden="true"> *</span>}
      </label>
      {help}
    </div>
    {description && <div className="aw-ui-field-hint" id={hintId}>{description}</div>}
    <input
      {...inputProps}
      id={fieldId}
      type={type}
      className={['aw-ui-field-input', className].filter(Boolean).join(' ')}
      aria-invalid={Boolean(error)}
      aria-describedby={descriptionIds || undefined}
    />
    {error && <div className="aw-ui-field-error" id={errorId} role="alert">{error}</div>}
  </div>;
}
