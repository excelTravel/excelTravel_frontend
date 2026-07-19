import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Area, AreaChart, Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Download } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Button } from '@/components/ui/button';
import { Async } from '@/components/ui/async';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { useTrips, useRouteRevenue, usePeakTravel, usePeakBooking } from '@/lib/api/hooks';

const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
// DAY_KEYS index -> Postgres EXTRACT(DOW) (0 = Sunday).
const dowFor = (dayIndex: number): number => (dayIndex + 1) % 7;

// Teal at full intensity, fading to a faint tint at zero — colour intensity encodes load.
function heatColor(v: number): string {
  return `rgba(20,184,166,${(0.06 + (v / 100) * 0.9).toFixed(3)})`;
}

const K = (n: number): string => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${Math.round(n / 1_000)}K` : String(Math.round(n)));

export function AnalyticsPage() {
  const { t } = useTranslation();
  const tripsQ = useTrips();
  const routeRevQ = useRouteRevenue();
  const peakTravelQ = usePeakTravel();
  const peakBookingQ = usePeakBooking();

  // KPIs derived from live trips (occupancy, on-time, revenue per trip) + route revenue (busiest route).
  const kpis = useMemo(() => {
    const trips = tripsQ.data ?? [];
    const withCap = trips.filter((tp) => (tp.capacity ?? 0) > 0);
    const avgOccupancy = withCap.length
      ? Math.round((withCap.reduce((s, tp) => s + tp.booked / (tp.capacity as number), 0) / withCap.length) * 100)
      : 0;
    const onTime = trips.length
      ? Math.round((trips.filter((tp) => tp.status !== 'delayed' && tp.status !== 'cancelled').length / trips.length) * 100)
      : 0;
    const revenueTotal = trips.reduce((s, tp) => s + tp.revenue, 0);
    const revenuePerTrip = trips.length ? revenueTotal / trips.length : 0;
    const busiest = (routeRevQ.data ?? [])[0];
    return { avgOccupancy, onTime, revenuePerTrip, busiest };
  }, [tripsQ.data, routeRevQ.data]);

  // Peak travel heatmap: passengers by day-of-week x hour, normalized against the busiest cell.
  const heat = useMemo(() => {
    const cells = new Map<string, number>();
    let max = 0;
    (peakTravelQ.data ?? []).forEach((p) => {
      const key = `${p.dayOfWeek}-${p.hourOfDay}`;
      const v = (cells.get(key) ?? 0) + p.passengerCount;
      cells.set(key, v);
      if (v > max) max = v;
    });
    return { cells, max };
  }, [peakTravelQ.data]);

  const bookingByHour = useMemo(() => {
    const byHour = new Map<number, number>();
    (peakBookingQ.data ?? []).forEach((p) => byHour.set(p.hourOfDay, (byHour.get(p.hourOfDay) ?? 0) + p.bookingCount));
    return [...byHour.entries()].sort((a, b) => a[0] - b[0]).map(([h, v]) => ({ h: `${String(h).padStart(2, '0')}:00`, v }));
  }, [peakBookingQ.data]);
  const maxBooking = Math.max(...bookingByHour.map((b) => b.v), 0);

  // Revenue trend derived from live trips grouped by departure day.
  const revenueTrend = useMemo(() => {
    const byDay = new Map<string, number>();
    (tripsQ.data ?? []).forEach((tp) => {
      const day = tp.departureTime.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + tp.revenue);
    });
    return [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([d, v]) => ({ d: new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), v: Number((v / 1_000_000).toFixed(2)) }));
  }, [tripsQ.data]);

  // Route performance: revenue/bookings from analytics + trip count and occupancy from live trips.
  const routeRows = useMemo(() => {
    const trips = tripsQ.data ?? [];
    return (routeRevQ.data ?? []).map((r) => {
      const rt = trips.filter((tp) => tp.routeId === r.routeId);
      const withCap = rt.filter((tp) => (tp.capacity ?? 0) > 0);
      const occ = withCap.length ? Math.round((withCap.reduce((s, tp) => s + tp.booked / (tp.capacity as number), 0) / withCap.length) * 100) : 0;
      return { routeId: r.routeId, route: `${r.origin} → ${r.destination}`, trips: rt.length, occ, rev: K(r.revenue) };
    });
  }, [routeRevQ.data, tripsQ.data]);

  return (
    <Reveal className="space-y-6">
      <RevealItem>
        <PageHeader
          subtitle={t('analytics.subtitle')}
          actions={
            <Button variant="outline" size="sm">
              <Download className="size-4" /> {t('bookings.export')}
            </Button>
          }
        />
      </RevealItem>

      {/* KPI row — derived from live trips + route revenue */}
      <RevealItem className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard loading={tripsQ.isLoading} label={t('analytics.avgOccupancy')} value={`${kpis.avgOccupancy}%`} />
        <KpiCard loading={tripsQ.isLoading} label={t('analytics.onTimeRate')} value={`${kpis.onTime}%`} />
        <KpiCard loading={tripsQ.isLoading} label={t('analytics.revenuePerTrip')} value={K(kpis.revenuePerTrip)} unit="RWF" />
        <KpiCard
          loading={routeRevQ.isLoading}
          label={t('analytics.busiestRoute')}
          value={kpis.busiest ? `${kpis.busiest.origin} — ${kpis.busiest.destination}` : '—'}
          {...(kpis.busiest ? { badge: { text: `${kpis.busiest.bookings}`, tone: 'teal' as const } } : {})}
        />
      </RevealItem>

      {/* Peak travel heatmap — live from /analytics/peak-travel */}
      <RevealItem>
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">{t('analytics.peakTravel')}</h3>
              <p className="text-sm text-muted-foreground">{t('analytics.peakTravelSub')}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{t('analytics.less')}</span>
              <div className="flex overflow-hidden rounded">
                {[0, 25, 50, 75, 100].map((v) => (
                  <span key={v} className="size-4" style={{ backgroundColor: heatColor(v) }} aria-hidden />
                ))}
              </div>
              <span>{t('analytics.more')}</span>
            </div>
          </div>
          <Async query={peakTravelQ} isEmpty={(d) => d.length === 0} skeleton={<div className="shimmer mt-5 h-56 rounded-xl" />}>
            {() => (
              <div className="mt-5 overflow-x-auto">
                <div className="min-w-[560px]">
                  <div className="mb-1 flex pl-10">
                    {HOURS.map((h) => (
                      <div key={h} className="flex-1 text-center text-[10px] tabular-nums text-muted-foreground">
                        {h % 2 === 0 ? h : ''}
                      </div>
                    ))}
                  </div>
                  {DAY_KEYS.map((day, di) => (
                    <div key={day} className="flex items-center">
                      <span className="w-10 text-xs font-medium capitalize text-muted-foreground">{t(`analytics.day.${day}`)}</span>
                      <div className="flex flex-1 gap-1 py-0.5">
                        {HOURS.map((h) => {
                          const raw = heat.cells.get(`${dowFor(di)}-${h}`) ?? 0;
                          const v = heat.max ? Math.round((raw / heat.max) * 100) : 0;
                          return (
                            <div
                              key={h}
                              className="h-6 flex-1 rounded-[3px]"
                              style={{ backgroundColor: heatColor(v) }}
                              title={`${t(`analytics.day.${day}`)} ${h}:00 · ${raw}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Async>
        </GlassCard>
      </RevealItem>

      {/* Booking hours + revenue trend — live */}
      <RevealItem className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <GlassCard className="p-6">
          <h3 className="text-base font-semibold">{t('analytics.peakBooking')}</h3>
          <p className="text-sm text-muted-foreground">{t('analytics.peakBookingSub')}</p>
          <div className="mt-6 h-56">
            <Async query={peakBookingQ} isEmpty={() => bookingByHour.length === 0} skeleton={<div className="shimmer h-full rounded-xl" />}>
              {() => (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingByHour} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <XAxis dataKey="h" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} interval={2} />
                    <Tooltip
                      cursor={{ fill: '#64748B', opacity: 0.12 }}
                      contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--popover-foreground))', fontSize: 12 }}
                    />
                    <Bar dataKey="v" radius={[8, 8, 0, 0]}>
                      {bookingByHour.map((d) => (
                        <Cell key={d.h} fill={d.v === maxBooking && maxBooking > 0 ? '#14B8A6' : 'rgba(20,184,166,0.28)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Async>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div>
            <h3 className="text-base font-semibold">{t('analytics.revenueTrend')}</h3>
            <p className="text-sm text-muted-foreground">{t('analytics.revenueTrendSub')}</p>
          </div>
          <div className="mt-6 h-56">
            <Async query={tripsQ} isEmpty={() => revenueTrend.length === 0} skeleton={<div className="shimmer h-full rounded-xl" />}>
              {() => (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#14B8A6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      cursor={{ stroke: '#64748B', strokeOpacity: 0.3 }}
                      contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--popover-foreground))', fontSize: 12 }}
                      formatter={(v: number) => [`${v}M RWF`, '']}
                    />
                    <Area type="monotone" dataKey="v" stroke="#0F766E" strokeWidth={2} fill="url(#revFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Async>
          </div>
        </GlassCard>
      </RevealItem>

      {/* Route performance — live from /analytics/routes/revenue + trips */}
      <RevealItem>
        <GlassCard className="overflow-hidden">
          <h3 className="p-5 text-base font-semibold">{t('analytics.routePerformance')}</h3>
          <Async query={routeRevQ} isEmpty={() => routeRows.length === 0} skeleton={<div className="shimmer m-5 h-40 rounded-xl" />}>
            {() => (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">{t('analytics.colRoute')}</th>
                      <th className="px-5 py-3 font-medium">{t('analytics.colTrips')}</th>
                      <th className="px-5 py-3 font-medium">{t('analytics.colOccupancy')}</th>
                      <th className="px-5 py-3 text-right font-medium">{t('analytics.colRevenue')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {routeRows.map((r) => (
                      <tr key={r.routeId} className="transition-colors hover:bg-secondary/40">
                        <td className="whitespace-nowrap px-5 py-3 font-medium">{r.route}</td>
                        <td className="px-5 py-3 tabular-nums">{r.trips}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${r.occ}%` }} />
                            </div>
                            <span className="tabular-nums text-muted-foreground">{r.occ}%</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums">{r.rev}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Async>
        </GlassCard>
      </RevealItem>
    </Reveal>
  );
}
