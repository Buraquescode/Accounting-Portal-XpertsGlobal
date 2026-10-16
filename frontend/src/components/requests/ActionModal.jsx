import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Textarea from '../common/Textarea';
import { ACTION_LABELS } from '../../utils/constants';
import { COMMENT_REQUIRED } from '../../utils/runAction';

// One confirm dialog for every action. Reject needs a comment (min 3 chars); others are optional.
export default function ActionModal({ action, onClose, onConfirm }) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const required = COMMENT_REQUIRED.includes(action);

  useEffect(() => { setComment(''); setError(null); setLoading(false); }, [action]);

  const confirm = async () => {
    if (required && comment.trim().length < 3) { setError('Please give a reason (at least 3 characters).'); return; }
    setLoading(true);
    try {
      await onConfirm(action, comment.trim());
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!action) return null;
  const label = ACTION_LABELS[action];
  return (
    <Modal
      open
      title={`${label} request`}
      onClose={loading ? () => {} : onClose}
      actions={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={action === 'REJECT' ? 'danger' : 'primary'} onClick={confirm} loading={loading}>{label}</Button>
        </>
      )}
    >
      <Textarea
        label={required ? 'Reason (required)' : 'Comment (optional)'}
        rows={4} maxLength={500} value={comment}
        onChange={(e) => { setComment(e.target.value); setError(null); }}
        error={error} hint={`${comment.length}/500`}
      />
    </Modal>
  );
}
