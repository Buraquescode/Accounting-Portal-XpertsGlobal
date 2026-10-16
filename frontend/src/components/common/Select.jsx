import { useId } from 'react';

export default function Select({ label, error, hint, id, children, ...rest }) {
  const auto = useId();
  const fid = id || auto;
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      {label && <label className="field__label" htmlFor={fid}>{label}</label>}
      <select id={fid} className="field__control" aria-invalid={!!error} {...rest}>{children}</select>
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}
