// Trip bars/rosters are laid out on an Africa/Kigali day, regardless of the viewing browser's local
// timezone.
export const kigaliHM = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Africa/Kigali' });

export function kigaliHour(iso: string): number {
  const parts = kigaliHM.formatToParts(new Date(iso));
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h + m / 60;
}

// The Kigali calendar-day key (YYYY-MM-DD) for an ISO timestamp — used to group trips by day
// independent of the viewer's local timezone.
const kigaliYMD = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali', year: 'numeric', month: '2-digit', day: '2-digit' });
export function kigaliDayKey(iso: string): string {
  return kigaliYMD.format(new Date(iso));
}
