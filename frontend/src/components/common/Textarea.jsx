import { useId } from 'react';

export default function Textarea({ label, error, hint, id, ...rest }) {
  const auto = useId();
  const fid = id || auto;
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      {label && <label className="field__label" htmlFor={fid}>{label}</label>}
      <textarea id={fid} className="field__control" aria-invalid={!!error} {...rest} />
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}
