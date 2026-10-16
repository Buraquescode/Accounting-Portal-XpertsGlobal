import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import StatusBadge from '../components/requests/StatusBadge';
import ProgressStepper from '../components/requests/ProgressStepper';
import ActionPanel from '../components/requests/ActionPanel';
import HistoryTimeline from '../components/requests/HistoryTimeline';
import * as requestsApi from '../api/requests.api';
import { TYPE_LABELS } from '../utils/constants';
import { formatDateTime, formatFileSize, formatMoney } from '../utils/formatters';
import '../styles/detail.css';

export default function RequestDetailPage() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    setRequest(null);
    requestsApi.get(id).then((r) => setRequest(r.data)).catch((e) => setError(e));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (error) {
    const msg = error.status === 403 ? 'You do not have access to this request.' : error.status === 404 ? 'This request does not exist.' : error.message;
    return <EmptyState title={error.status === 403 ? 'No access' : 'Request unavailable'} message={msg} action={<Link className="btn btn--primary" to="/">Back to dashboard</Link>} />;
  }
  if (!request) return <div className="spinner-wrap"><Spinner /></div>;

  const history = request.history || request.auditLogs || [];
  const url = requestsApi.fileUrl(request.id);
  const isImage = request.fileMimeType?.startsWith('image/');

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Dashboard</Link> / {request.referenceNo}</nav>
      <PageHeader title={request.referenceNo} actions={<StatusBadge status={request.status} />} />
      <ProgressStepper status={request.status} />
      <div className="detail">
        <div className="stack">
          <Card title="Details">
            <dl className="kv">
              <dt>Type</dt><dd>{TYPE_LABELS[request.type]}</dd>
              <dt>Amount</dt><dd><strong>{formatMoney(request.amount, request.currency)}</strong></dd>
              <dt>Notes</dt><dd>{request.notes}</dd>
              <dt>Requester</dt><dd>{request.requester?.name}</dd>
              <dt>Approver</dt><dd>{request.selectedApprover?.name}</dd>
              <dt>Submitted</dt><dd>{formatDateTime(request.createdAt)}</dd>
            </dl>
          </Card>
          <Card title="Receipt" className="receipt">
            {request.hasFile === false ? <p className="muted">No file attached.</p> : (
              <>
                <p className="muted">{request.fileOriginalName} {request.fileSize ? `(${formatFileSize(request.fileSize)})` : ''}</p>
                {isImage ? <img src={url} alt={`Receipt ${request.fileOriginalName}`} /> : <iframe src={url} title="Receipt PDF preview" />}
                <p><a className="btn btn--secondary btn--sm" href={url} target="_blank" rel="noopener noreferrer">Open in new tab</a></p>
              </>
            )}
          </Card>
        </div>
        <div className="stack">
          <ActionPanel request={request} onUpdated={setRequest} />
          <Card title="History"><HistoryTimeline history={history} /></Card>
        </div>
      </div>
    </>
  );
}
