// Turns "8h", "30m", "15s" or "7d" into milliseconds, so the JWT lifetime, the session row
// and the cookie all expire at exactly the same moment (one setting: JWT_EXPIRES_IN).
const UNITS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

export function durationToMs(value) {
  const match = /^(\d+)\s*([smhd])$/.exec(String(value).trim());
  if (!match) throw new Error(`Invalid duration "${value}". Use a number plus s, m, h or d (e.g. 8h)`);
  return Number(match[1]) * UNITS[match[2]];
}
