/**
 * Human-friendly relative date formatting without pulling a heavy locale dep.
 * Uses the global Intl.RelativeTimeFormat; we already have `date-fns` but
 * this keeps the dashboard card bundle tiny.
 */
const RTF = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
const ABS_FMT = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
];

export function formatRelativeDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs >= 60 * 60 * 24 * 14) {
    // Beyond two weeks → absolute date reads better than "hace 3 meses".
    return ABS_FMT.format(d);
  }
  for (const [unit, seconds] of STEPS) {
    if (abs >= seconds || unit === 'minute') {
      return RTF.format(Math.round(diffSec / seconds), unit);
    }
  }
  return RTF.format(diffSec, 'second');
}
