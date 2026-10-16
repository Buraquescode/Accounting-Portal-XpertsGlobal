export default function EmptyState({ title, message, action }) {
  return (
    <div className="empty card">
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}
