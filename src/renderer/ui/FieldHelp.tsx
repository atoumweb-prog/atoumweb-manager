export function FieldHelp({ text }: { text: string }) {
  return (
    <span
      className="field-help"
      tabIndex={0}
      role="note"
      aria-label={text}
      title={text}
    >?</span>
  );
}
