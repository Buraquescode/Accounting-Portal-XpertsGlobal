import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import Card from '../components/common/Card';
import RequestForm from '../components/requests/RequestForm';
import * as requestsApi from '../api/requests.api';
import { useToast } from '../hooks/useToast';
import { formatMoney } from '../utils/formatters';
import '../styles/request-form.css';

export default function NewRequestPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (formData, values) => {
    const res = await requestsApi.create(formData);
    const req = res.data;
    toast.success(`${req.referenceNo} submitted for ${formatMoney(values.amount, values.currency)}`);
    navigate(`/requests/${req.id}`);
  };

  return (
    <>
      <PageHeader title="New request" subtitle="Submit an expense, fund request or budget for approval." />
      <div className="new-request">
        <Card><RequestForm onSubmit={handleSubmit} /></Card>
        <Card title="How approval works">
          <ol className="steps-list">
            <li><strong>Pending</strong><small>Your selected approver can pick it up.</small></li>
            <li><strong>Under Review</strong><small>The approver checks the details and receipt.</small></li>
            <li><strong>Awaiting Final Approval</strong><small>Forwarded to Muhammad, the Final Approver.</small></li>
            <li><strong>Approved or Rejected</strong><small>Nothing is approved until the Final Approver decides.</small></li>
          </ol>
        </Card>
      </div>
    </>
  );
}
