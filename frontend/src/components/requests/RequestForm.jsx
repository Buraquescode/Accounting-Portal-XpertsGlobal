import { useEffect, useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import FileDropzone from '../common/FileDropzone';
import { CURRENCIES, TYPE_LABELS } from '../../utils/constants';
import * as usersApi from '../../api/users.api';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/request-form.css';

const TYPE_HELP = {
  EXPENSE: 'Money you already spent and want reimbursed. Attach the receipt.',
  FUND_REQUEST: 'Money you need in advance for an upcoming activity.',
  BUDGET_APPROVAL: 'Approval of a planned budget before spending begins.',
};
const EMPTY = { type: 'EXPENSE', currency: 'PKR', amount: '', notes: '', selectedApproverId: '' };

// Mirrors the server zod rules for fast feedback; the server stays the authority.
function validate(v, file) {
  const e = {};
  const amt = Number(v.amount);
  if (!v.amount || Number.isNaN(amt) || amt <= 0) e.amount = 'Enter an amount greater than 0.';
  else if (amt > 999999999.99) e.amount = 'Amount is too large.';
  else if (!/^\d+(\.\d{1,2})?$/.test(String(v.amount))) e.amount = 'Use at most 2 decimal places.';
  const notes = v.notes.trim();
  if (notes.length < 3) e.notes = 'Notes must be at least 3 characters.';
  if (notes.length > 1000) e.notes = 'Notes must be 1000 characters or fewer.';
  if (!v.selectedApproverId) e.selectedApproverId = 'Choose an approver.';
  if (!file) e.file = 'Attach a receipt, invoice or bill.';
  return e;
}

// Server field errors may arrive as an object or as an array of { field | path, message }.
function mapServerErrors(raw) {
  const map = {};
  if (Array.isArray(raw)) {
    raw.forEach((x) => {
      const k = x.field || (Array.isArray(x.path) ? x.path[0] : x.path);
      if (k) map[k] = x.message;
    });
  } else if (raw && typeof raw === 'object') {
    Object.entries(raw).forEach(([k, m]) => { map[k] = Array.isArray(m) ? m[0] : m; });
  }
  return map;
}

export default function RequestForm({ onSubmit }) {
  const { user } = useAuth();
  const [values, setValues] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [approvers, setApprovers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    usersApi.approvers()
      .then((r) => setApprovers(r.data.filter((a) => a.id !== user?.id)))
      .catch(() => setBanner('Could not load approvers.'));
  }, [user?.id]);

  const set = (k) => (e) => { setValues((v) => ({ ...v, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };

  const submit = async (e) => {
    e.preventDefault();
    setBanner(null);
    const found = validate(values, file);
    setErrors(found);
    if (Object.keys(found).length) return;
    const fd = new FormData();
    Object.entries({ ...values, notes: values.notes.trim() }).forEach(([k, v]) => fd.append(k, v));
    fd.append('file', file);
    setLoading(true);
    try {
      await onSubmit(fd, values);
    } catch (err) {
      setBanner(err.message);
      setErrors(mapServerErrors(err.errors));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="stack">
      {banner && <div className="banner-error" role="alert">{banner}</div>}
      <Select label="Request type" value={values.type} onChange={set('type')} hint={TYPE_HELP[values.type]} error={errors.type}>
        {Object.entries(TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </Select>
      <div className="form-grid form-grid--2">
        <Select label="Currency" value={values.currency} onChange={set('currency')} error={errors.currency}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Input label="Amount" type="number" inputMode="decimal" step="0.01" min="0.01" value={values.amount} onChange={set('amount')} error={errors.amount} placeholder="0.00" />
      </div>
      <Textarea label="Notes" rows={4} maxLength={1000} value={values.notes} onChange={set('notes')} error={errors.notes} hint={`${values.notes.length}/1000`} />
      <Select label="Selected approver" value={values.selectedApproverId} onChange={set('selectedApproverId')} error={errors.selectedApproverId}>
        <option value="">Choose an approver</option>
        {approvers.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </Select>
      <FileDropzone file={file} onChange={(f) => { setFile(f); setErrors((x) => ({ ...x, file: undefined })); }} error={errors.file} />
      <div className="row">
        <Button type="submit" loading={loading}>Submit request</Button>
      </div>
    </form>
  );
}
