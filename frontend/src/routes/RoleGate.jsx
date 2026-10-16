import { useAuth } from '../hooks/useAuth';
import EmptyState from '../components/common/EmptyState';

// UI convenience only. The API enforces roles on every request.
export default function RoleGate({ roles, children }) {
  const { hasAnyRole } = useAuth();
  if (!hasAnyRole(...roles)) {
    return <EmptyState title="You do not have access" message="Your account does not have permission to open this page." />;
  }
  return children;
}
