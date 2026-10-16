import Spinner from './Spinner';

export default function Button({ variant = 'primary', size, loading = false, disabled, children, type = 'button', className = '', ...rest }) {
  const cls = ['btn', `btn--${variant}`, size === 'sm' && 'btn--sm', className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <Spinner small />}
      {children}
    </button>
  );
}
