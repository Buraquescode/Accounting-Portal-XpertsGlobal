import StatusBadge from './StatusBadge';
import { ROLE_LABELS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';
import { relativeTime } from '../../utils/relativeTime';
import '../../styles/detail.css';

const TITLES = {
  SUBMITTED: 'Request submitted', REVIEW_STARTED: 'Review started', FORWARDED: 'Forwarded to Final Approver',
  APPROVED: 'Approved', REJECTED: 'Rejected', PAID: 'Marked as paid',
};

// Read-only by design: there are no edit or delete controls, and the database blocks changes too.
export default function HistoryTimeline({ history = [] }) {
  const last = history.length - 1;
  return (
    <div>
      <div className="lock-note"><span>Immutable record - entries cannot be edited or deleted.</span><strong>Read-only</strong></div>
      <ol className="tl">
        {history.map((h, i) => {
          const roles = (h.actor?.roles || []).map((r) => ROLE_LABELS[r] || r).join(', ');
          return (
            <li key={h.id} className={`tl__item${i === last ? ' tl__item--latest' : ''}`}>
              <span className={`tl__dot tl__dot--${String(h.action).toLowerCase()}`} aria-hidden="true" />
              <div className="tl__title">{TITLES[h.action] || h.action}</div>
              <div className="tl__row">
                {h.fromStatus && <><StatusBadge status={h.fromStatus} /><span aria-hidden="true">-&gt;</span></>}
                <StatusBadge status={h.toStatus} />
              </div>
              <div>{h.actor?.name}{roles && <span className="muted"> ({roles})</span>}</div>
              {h.comment && <p className="tl__comment">&ldquo;{h.comment}&rdquo;</p>}
              <div className="tl__time">{formatDateTime(h.createdAt)} - {relativeTime(h.createdAt)}</div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
