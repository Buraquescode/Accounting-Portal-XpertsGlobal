import Badge from '../common/Badge';
import { STATUS_LABELS, STATUS_STYLES } from '../../utils/constants';

export default function StatusBadge({ status }) {
  return <Badge tone={STATUS_STYLES[status] || 'neutral'}>{STATUS_LABELS[status] || status}</Badge>;
}
