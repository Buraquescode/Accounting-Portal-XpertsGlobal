export function relativeTime(value) {
  const secs = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units = [['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [u, s] of units) if (Math.abs(secs) >= s) return rtf.format(Math.round(secs / s), u);
  return 'just now';
}
