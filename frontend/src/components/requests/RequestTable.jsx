import StatusBadge from './StatusBadge';
import RowActions from './RowActions';
import { TYPE_LABELS } from '../../utils/constants';
import { formatDateTime, formatMoney } from '../../utils/formatters';
import '../../styles/dashboard.css';

export default function RequestTable({ requests, onAction }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr><th>Reference</th><th>Type</th><th>Requester</th><th>Amount</th><th>Approver</th><th>Status</th><th>Submitted</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id} className={r.availableActions?.length ? 'row--action' : ''}>
              <td><strong>{r.referenceNo}</strong></td>
              <td>{TYPE_LABELS[r.type]}</td>
              <td>{r.requester?.name}</td>
              <td>{formatMoney(r.amount, r.currency)}</td>
              <td>{r.selectedApprover?.name}</td>
              <td><StatusBadge status={r.status} /></td>
              <td>{formatDateTime(r.createdAt)}</td>
              <td><RowActions request={r} onAction={onAction} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
