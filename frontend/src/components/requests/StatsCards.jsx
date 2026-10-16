import { STATUS_LABELS } from '../../utils/constants';
import '../../styles/dashboard.css';

const ORDER = ['PENDING', 'UNDER_REVIEW', 'AWAITING_FINAL_APPROVAL', 'APPROVED', 'REJECTED'];

// Counts come from the API (same scope as the list). Clicking a card sets the status filter.
export default function StatsCards({ counts = {}, active, onSelect }) {
  const total = ORDER.reduce((n, s) => n + (counts[s] || 0), 0) + (counts.PAID || 0);
  const cards = [{ key: '', label: 'Total', value: total }, ...ORDER.map((s) => ({ key: s, label: STATUS_LABELS[s], value: counts[s] || 0 }))];
  return (
    <div className="stats">
      {cards.map((c) => (
        <button key={c.key || 'all'} type="button" className={`stat${(active || '') === c.key ? ' stat--active' : ''}`} onClick={() => onSelect(c.key)} aria-pressed={(active || '') === c.key}>
          <span className="stat__value">{c.value}</span>
          <span className="stat__label">{c.label}</span>
        </button>
      ))}
    </div>
  );
}
