import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import EmptyState from '../components/common/EmptyState';
import StatsCards from '../components/requests/StatsCards';
import RequestTable from '../components/requests/RequestTable';
import RequestCard from '../components/requests/RequestCard';
import ActionModal from '../components/requests/ActionModal';
import { useRequests } from '../hooks/useRequests';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { runAction, SUCCESS_TEXT } from '../utils/runAction';
import { TYPE_LABELS } from '../utils/constants';
import '../styles/dashboard.css';

export default function DashboardPage() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [pending, setPending] = useState(null); // { request, action }
  const { data, meta, loading, error, refresh } = useRequests({ status, type, page });

  const title = hasRole('FINAL_APPROVER') ? 'Final Approvals' : hasRole('APPROVER') ? 'Approvals Queue' : 'My Requests';

  // Search and "needs my action" are client-side filters on the current page of results.
  const rows = useMemo(() => data
    .filter((r) => !search || r.referenceNo.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((r) => !onlyMine || r.availableActions?.length > 0), [data, search, onlyMine]);

  const counts = meta?.statusCounts || meta?.counts || {};
  const onAction = (request, action) => setPending({ request, action });

  const confirm = async (action, comment) => {
    await runAction(pending.request.id, action, comment);
    toast.success(`${pending.request.referenceNo}: ${SUCCESS_TEXT[action]}`);
    setPending(null);
    refresh();
  };

  const selectStatus = (s) => { setStatus(s); setPage(1); };

  return (
    <>
      <PageHeader
        title={title}
        subtitle="Status of requests and the actions you can take."
        actions={hasRole('REQUESTER') && <Link className="btn btn--primary" to="/requests/new">New Request</Link>}
      />
      <StatsCards counts={counts} active={status} onSelect={selectStatus} />

      <div className="filters">
        <Select label="Type" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </Select>
        <Input label="Search reference" placeholder="REQ-2026-0001" value={search} onChange={(e) => setSearch(e.target.value)} />
        <label className="filters__check">
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} /> Only needs my action
        </label>
      </div>

      {error && (
        <div className="banner-error" role="alert">{error} <Button size="sm" variant="secondary" onClick={refresh}>Retry</Button></div>
      )}

      {loading ? (
        <div aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton skeleton-row" />)}</div>
      ) : rows.length === 0 && !error ? (
        <EmptyState title="No requests found" message="Try changing the filters." />
      ) : (
        <>
          <div className="only-desktop"><RequestTable requests={rows} onAction={onAction} /></div>
          <div className="only-mobile req-cards">{rows.map((r) => <RequestCard key={r.id} request={r} onAction={onAction} />)}</div>
        </>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="pager">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span>Page {meta.page} of {meta.totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      <ActionModal action={pending?.action} onClose={() => setPending(null)} onConfirm={confirm} />
    </>
  );
}
