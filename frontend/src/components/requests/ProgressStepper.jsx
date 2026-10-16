import '../../styles/detail.css';

// Submitted -> Under Review -> Final Approval -> outcome. Pure display of the current status.
export default function ProgressStepper({ status }) {
  const rank = { PENDING: 0, UNDER_REVIEW: 1, AWAITING_FINAL_APPROVAL: 2, APPROVED: 3, PAID: 3, REJECTED: 3 }[status] ?? 0;
  const end = status === 'REJECTED' ? { label: 'Rejected', cls: 'bad' } : status === 'PAID' ? { label: 'Paid', cls: 'good' } : status === 'APPROVED' ? { label: 'Approved', cls: 'good' } : { label: 'Approved / Rejected', cls: '' };
  const steps = [{ label: 'Submitted' }, { label: 'Under Review' }, { label: 'Final Approval' }, end];
  return (
    <ol className="progress" aria-label="Request progress">
      {steps.map((s, i) => {
        const cls = i === 3 ? (end.cls || (rank >= 3 ? 'done' : '')) : i < rank ? 'done' : i === rank ? 'current' : '';
        return <li key={s.label} className={cls} aria-current={i === rank ? 'step' : undefined}>{s.label}</li>;
      })}
    </ol>
  );
}
