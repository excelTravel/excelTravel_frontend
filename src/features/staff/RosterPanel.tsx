import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addDays, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarRange } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDrivers, useTrips, useRoutes, type ApiTrip, type ApiRoute } from '@/lib/api/hooks';
import { kigaliHM, kigaliHour, kigaliDayKey } from '@/lib/kigaliTime';

const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const dayHeaderFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' });

function endpoints(trip: ApiTrip, route: ApiRoute | undefined): string {
  if (!route) return '—';
  const isReturn = trip.direction === 'return';
  return isReturn ? `${route.destination} → ${route.origin}` : `${route.origin} → ${route.destination}`;
}

// Trip span in hours (departure -> arrival, 1h fallback when arrival isn't set yet — matches the schedule
// board's own fallback so the two views agree on duration for the same trip).
function tripHours(trip: ApiTrip): number {
  const start = kigaliHour(trip.departureTime);
  const end = trip.arrivalTime ? kigaliHour(trip.arrivalTime) : start + 1;
  return Math.max(end - start, 0);
}

// Day-by-day roster derived straight from assigned trips — reflects live the moment a trip's driverId
// changes, since there's no separate roster table to keep in sync. Distinct from DriverScheduling's
// weekly shift template (which answers "when does this driver normally work"): this answers "what is this
// driver actually assigned to do."
export function RosterPanel() {
  const { t } = useTranslation();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekEnd = addDays(weekStart, 7);

  const driversQ = useDrivers();
  const routesQ = useRoutes();
  const tripsQ = useTrips({ from: weekStart.toISOString(), to: weekEnd.toISOString() });

  const drivers = driversQ.data ?? [];
  const routeById = new Map((routesQ.data ?? []).map((r) => [r.id, r]));

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const dayKeys = days.map((d) => kigaliDayKey(d.toISOString()));

  // driverId -> dayKey -> trips, sorted by departure within each day.
  const byDriverDay = useMemo(() => {
    const m = new Map<string, Map<string, ApiTrip[]>>();
    for (const trip of tripsQ.data ?? []) {
      if (!trip.driverId) continue;
      const dayMap = m.get(trip.driverId) ?? new Map<string, ApiTrip[]>();
      const key = kigaliDayKey(trip.departureTime);
      const list = dayMap.get(key) ?? [];
      list.push(trip);
      dayMap.set(key, list);
      m.set(trip.driverId, dayMap);
    }
    for (const dayMap of m.values()) {
      for (const list of dayMap.values()) list.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
    }
    return m;
  }, [tripsQ.data]);

  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <CalendarRange className="size-4" /> {t('staff.rosterTitle')}
          </h3>
          <p className="text-sm text-muted-foreground">{t('staff.rosterSub')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekStart((d) => addDays(d, -7))} aria-label={t('staff.prevWeek')}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium tabular-nums">{dayHeaderFmt.format(weekStart)} – {dayHeaderFmt.format(addDays(weekStart, 6))}</span>
          <Button variant="outline" size="icon" onClick={() => setWeekStart((d) => addDays(d, 7))} aria-label={t('staff.nextWeek')}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[960px] border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-2 pb-2 text-left font-medium">{t('drivers.colDriver')}</th>
              {days.map((d, i) => (
                <th key={dayKeys[i]} className="px-1 pb-2 text-center font-medium">
                  {t(`analytics.day.${WEEK_DAYS[i]}`)} <span className="font-normal normal-case text-muted-foreground/70">{dayHeaderFmt.format(d)}</span>
                </th>
              ))}
              <th className="px-2 pb-2 text-right font-medium">{t('staff.weekTotal')}</th>
            </tr>
          </thead>
          <tbody>
            {driversQ.isLoading ? (
              <tr><td colSpan={9} className="p-0"><div className="shimmer h-32 rounded-lg" /></td></tr>
            ) : drivers.length === 0 ? (
              <tr><td colSpan={9} className="px-2 py-8 text-center text-muted-foreground">{t('drivers.rosterEmpty')}</td></tr>
            ) : (
              drivers.map((d) => {
                const dayMap = byDriverDay.get(d.id);
                const weekTrips = dayKeys.reduce((n, k) => n + (dayMap?.get(k)?.length ?? 0), 0);
                const weekHours = dayKeys.reduce((h, k) => h + (dayMap?.get(k) ?? []).reduce((s, tr) => s + tripHours(tr), 0), 0);
                return (
                  <tr key={d.id} className="align-top">
                    <td className="whitespace-nowrap px-2 py-1">
                      <div className="flex items-center gap-2">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{d.name.charAt(0)}</span>
                        <span className="font-medium">{d.name}</span>
                      </div>
                    </td>
                    {dayKeys.map((key) => {
                      const dayTrips = dayMap?.get(key) ?? [];
                      const dayHours = dayTrips.reduce((s, tr) => s + tripHours(tr), 0);
                      return (
                        <td key={key} className="px-1 py-1 align-top">
                          <div className="min-h-[3rem] space-y-1 rounded-lg bg-secondary/40 p-1.5">
                            {dayTrips.length === 0 ? (
                              <span className="block text-center text-[11px] text-muted-foreground/60">·</span>
                            ) : (
                              <>
                                {dayTrips.map((trip) => (
                                  <div
                                    key={trip.id}
                                    className="truncate rounded-md bg-[hsl(var(--teal))]/15 px-1.5 py-1 text-[11px] font-medium text-[hsl(var(--teal))]"
                                    title={endpoints(trip, routeById.get(trip.routeId))}
                                  >
                                    {kigaliHM.format(new Date(trip.departureTime))}{trip.arrivalTime ? `–${kigaliHM.format(new Date(trip.arrivalTime))}` : ''} · {endpoints(trip, routeById.get(trip.routeId))}
                                  </div>
                                ))}
                                <p className="px-1 text-[10px] font-semibold tabular-nums text-muted-foreground">
                                  {t('staff.tripsAndHours', { trips: dayTrips.length, hours: Math.round(dayHours * 10) / 10 })}
                                </p>
                              </>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-2 py-1 text-right align-middle">
                      <p className="font-semibold tabular-nums">{weekTrips}</p>
                      <p className="text-[11px] tabular-nums text-muted-foreground">{Math.round(weekHours * 10) / 10}h</p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
