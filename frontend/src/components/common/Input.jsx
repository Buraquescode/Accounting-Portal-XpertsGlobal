import { useId } from 'react';

export default function Input({ label, error, hint, id, ...rest }) {
  const auto = useId();
  const fid = id || auto;
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      {label && <label className="field__label" htmlFor={fid}>{label}</label>}
      <input id={fid} className="field__control" aria-invalid={!!error} aria-describedby={error ? `${fid}-e` : hint ? `${fid}-h` : undefined} {...rest} />
      {hint && !error && <span id={`${fid}-h`} className="field__hint">{hint}</span>}
      {error && <span id={`${fid}-e`} className="field__error">{error}</span>}
    </div>
  );
}
