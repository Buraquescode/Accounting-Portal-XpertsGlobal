import { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import ActionModal from './ActionModal';
import { ACTION_LABELS } from '../../utils/constants';
import { runAction, SUCCESS_TEXT } from '../../utils/runAction';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const VARIANT = { REJECT: 'danger' };

// Text-only explanation shown when the server returns no actions. No permission decisions here.
function waitingText(request, user) {
  if (request.requesterId === user.id || request.requester?.id === user.id) return 'You cannot act on your own request.';
  switch (request.status) {
    case 'AWAITING_FINAL_APPROVAL': return "Waiting for Muhammad's final decision.";
    case 'APPROVED': return 'Approved. Waiting for Accounting to record payment.';
    case 'PAID': case 'REJECTED': return 'This request is closed.';
    default: return `Waiting for ${request.selectedApprover?.name || 'the selected approver'} to review.`;
  }
}

export default function ActionPanel({ request, onUpdated }) {
  const { user } = useAuth();
  const toast = useToast();
  const [action, setAction] = useState(null);
  const actions = request.availableActions || [];

  const confirm = async (a, comment) => {
    const res = await runAction(request.id, a, comment);
    toast.success(`${request.referenceNo}: ${SUCCESS_TEXT[a]}`);
    setAction(null);
    onUpdated(res.data); // the API returns the refreshed request with history and availableActions
  };

  return (
    <Card title="Actions">
      {actions.length === 0 ? (
        <p className="muted">{waitingText(request, user)}</p>
      ) : (
        <div className="row">
          {actions.map((a) => (
            <Button key={a} variant={VARIANT[a] || 'primary'} onClick={() => setAction(a)}>{ACTION_LABELS[a]}</Button>
          ))}
        </div>
      )}
      <ActionModal action={action} onClose={() => setAction(null)} onConfirm={confirm} />
    </Card>
  );
}
