export default function Spinner({ small = false, label = 'Loading' }) {
  const style = small ? { width: 16, height: 16, borderWidth: 2 } : undefined; // dynamic size only
  return <span className="spinner" style={style} role="status" aria-label={label} />;
}
