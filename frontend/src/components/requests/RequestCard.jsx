import StatusBadge from './StatusBadge';
import RowActions from './RowActions';
import { TYPE_LABELS } from '../../utils/constants';
import { formatDateTime, formatMoney } from '../../utils/formatters';
import '../../styles/dashboard.css';

// Mobile layout (under 768px): one card per request.
export default function RequestCard({ request: r, onAction }) {
  return (
    <article className={`req-card${r.availableActions?.length ? ' req-card--action' : ''}`}>
      <div className="req-card__top"><strong>{r.referenceNo}</strong><StatusBadge status={r.status} /></div>
      <div>{formatMoney(r.amount, r.currency)} <span className="req-card__meta">- {TYPE_LABELS[r.type]}</span></div>
      <div className="req-card__meta">By {r.requester?.name} | Approver {r.selectedApprover?.name}</div>
      <div className="req-card__meta">{formatDateTime(r.createdAt)}</div>
      <RowActions request={r} onAction={onAction} />
    </article>
  );
}
