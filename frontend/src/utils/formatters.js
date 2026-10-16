export function formatMoney(amount, currency = 'PKR') {
  const n = Number(amount);
  if (Number.isNaN(n)) return '-';
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n);
}

export function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
