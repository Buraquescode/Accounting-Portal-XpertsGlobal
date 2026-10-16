import { Link } from 'react-router-dom';
import Button from '../common/Button';
import { ACTION_LABELS } from '../../utils/constants';
import '../../styles/dashboard.css';

const VARIANT = { START_REVIEW: 'secondary', FORWARD: 'primary', REJECT: 'danger', APPROVE: 'success', MARK_PAID: 'primary' };

// Renders exactly the actions the server listed; never decides permissions itself.
export default function RowActions({ request, onAction }) {
  return (
    <div className="cell-actions">
      {(request.availableActions || []).map((a) => (
        <Button key={a} size="sm" variant={VARIANT[a] === 'success' ? 'primary' : VARIANT[a]} className={VARIANT[a] === 'success' ? 'btn--success' : ''} onClick={() => onAction(request, a)}>
          {ACTION_LABELS[a]}
        </Button>
      ))}
      <Link className="btn btn--ghost btn--sm" to={`/requests/${request.id}`}>View</Link>
    </div>
  );
}
