import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { CheckCircle2, XCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Async } from '@/components/ui/async';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { formatRWF, cn } from '@/lib/utils';
import {
  useOverview,
  usePeakBooking,
  useBookingsInfinite,
  useTrips,
  useRoutes,
  useUpdatePayment,
  useCancelBooking,
  type ApiBooking,
} from '@/lib/api/hooks';
import { useDateRange, rangeToQuery } from '@/store/dateRange';

const K = (n: number): string => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${Math.round(n / 1_000)}K` : String(n));
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Only two booking sources: App (passenger self-book) and Agent (agent-booked, incl. walk-ins).
const CHANNEL_COLORS: Record<string, string> = { app: '#0F766E', agent: '#14B8A6' };

interface BookingRow {
  id: string;
  name: string;
  phone: string;
  route: string;
  time: string;
  status: string;
  paymentStatus: string;
  bus: string;
  amount: number;
}

export function BookingsPage() {
  const { t } = useTranslation();
  const overviewQ = useOverview();
  const peakQ = usePeakBooking();
  const { range } = useDateRange();
  const bookingsQ = useBookingsInfinite(25, rangeToQuery(range));
  const loadedBookings = bookingsQ.data?.pages.flatMap((p) => p.items) ?? [];
  const totalBookings = bookingsQ.data?.pages[0]?.total ?? loadedBookings.length;
  const tripsQ = useTrips();
  const routesQ = useRoutes();
  const updatePayment = useUpdatePayment();
  const cancelBooking = useCancelBooking();
  const [velMode, setVelMode] = useState<'hours' | 'days'>('hours');
  const o = overviewQ.data;

  // Join bookings -> trip -> route so the table shows route / time / bus from live data.
  const rows: BookingRow[] = useMemo(() => {
    const tripById = new Map((tripsQ.data ?? []).map((tp) => [tp.id, tp]));
    const routeById = new Map((routesQ.data ?? []).map((r) => [r.id, r]));
    return (bookingsQ.data?.pages.flatMap((p) => p.items) ?? []).map((b: ApiBooking) => {
      const tp = tripById.get(b.tripId);
      const r = tp ? routeById.get(tp.routeId) : undefined;
      return {
        id: b.id,
        name: b.passengerName,
        phone: b.passengerPhone ?? '—',
        route: r ? `${r.origin} → ${r.destination}` : '—',
        time: tp ? new Date(tp.departureTime).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—',
        status: b.status,
        paymentStatus: b.paymentStatus,
        bus: tp?.vehiclePlate ?? '—',
        amount: b.fareAmount,
      };
    });
  }, [bookingsQ.data, tripsQ.data, routesQ.data]);

  const velocity = useMemo(() => {
    const rowsP = peakQ.data ?? [];
    if (velMode === 'hours') {
      const byHour = new Map<number, number>();
      rowsP.forEach((p) => byHour.set(p.hourOfDay, (byHour.get(p.hourOfDay) ?? 0) + p.bookingCount));
      return [...byHour.entries()].sort((a, b) => a[0] - b[0]).map(([h, v]) => ({ h: `${String(h).padStart(2, '0')}:00`, v }));
    }
    const byDay = new Map<string, number>();
    rowsP.forEach((p) => byDay.set(p.dayName, (byDay.get(p.dayName) ?? 0) + p.bookingCount));
    return DAYS.map((d) => ({ h: d, v: byDay.get(d) ?? 0 }));
  }, [peakQ.data, velMode]);
  const maxVel = Math.max(...velocity.map((d) => d.v), 0);

  const channel = (o?.sourceSplit ?? []).map((s) => ({ name: s.source, value: s.count, color: CHANNEL_COLORS[s.source] ?? '#94A3B8' }));
  const channelTotal = channel.reduce((sum, c) => sum + c.value, 0) || 1;
  const appPct = Math.round(((o?.sourceSplit.find((s) => s.source === 'app')?.count ?? 0) / channelTotal) * 100);

  const cols: Column<BookingRow>[] = [
    { key: 'id', header: t('bookings.colTicket'), sort: (r) => r.id, cell: (r) => <span className="font-semibold">#{r.id.slice(0, 8)}</span>, td: 'whitespace-nowrap' },
    { key: 'name', header: t('bookings.colPassenger'), sort: (r) => r.name, cell: (r) => (<div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground tabular-nums">{r.phone}</p></div>) },
    { key: 'route', header: t('bookings.colRoute'), filter: (r) => r.route, sort: (r) => r.route, cell: (r) => r.route, td: 'whitespace-nowrap text-muted-foreground' },
    { key: 'time', header: t('bookings.colTime'), sort: (r) => r.time, cell: (r) => r.time, td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
    { key: 'status', header: t('bookings.colStatus'), sort: (r) => r.status, cell: (r) => <StatusPill status={r.status} /> },
    { key: 'payment', header: t('bookings.colPayment', 'Payment'), sort: (r) => r.paymentStatus, cell: (r) => <StatusPill status={r.paymentStatus} /> },
    { key: 'bus', header: t('bookings.colBusStation'), filter: (r) => r.bus, sort: (r) => r.bus, cell: (r) => r.bus, td: 'whitespace-nowrap text-muted-foreground' },
    { key: 'amount', header: t('bookings.colAmount'), align: 'right', sort: (r) => r.amount, cell: (r) => (r.amount ? formatRWF(r.amount) : '—'), td: 'whitespace-nowrap font-semibold tabular-nums' },
    {
      key: 'actions',
      header: '',
      cell: (r) => (
        <div className="flex justify-end gap-1">
          {r.status !== 'cancelled' && r.paymentStatus === 'pending' && (
            <Button variant="outline" size="sm" disabled={updatePayment.isPending} onClick={() => updatePayment.mutate({ id: r.id, paymentStatus: 'paid' })}>
              <CheckCircle2 className="size-4" /> {t('bookings.approve', 'Approve')}
            </Button>
          )}
          {r.status !== 'cancelled' && (
            <Button variant="ghost" size="sm" disabled={cancelBooking.isPending} onClick={() => cancelBooking.mutate({ id: r.id, override: true })}>
              <XCircle className="size-4" />
            </Button>
          )}
        </div>
      ),
      td: 'whitespace-nowrap',
    },
  ];

  return (
    <Reveal className="space-y-6">
      {/* KPI row — live from GET /analytics/overview */}
      <RevealItem className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard loading={overviewQ.isLoading} label={t('overview.ticketsToday')} value={o ? String(o.ticketsToday) : '—'} />
        <KpiCard loading={overviewQ.isLoading} label={t('overview.dailyRevenue')} value={o ? K(o.dailyRevenue) : '—'} unit="RWF" />
        <KpiCard loading={overviewQ.isLoading} label={t('overview.revenueMtd')} value={o ? K(o.revenueMtd) : '—'} unit="RWF" />
        <KpiCard loading={overviewQ.isLoading} label={t('overview.busesActive')} value={o ? String(o.busesActive) : '—'} />
      </RevealItem>

      {/* Velocity (hours / days) + channel split — live from peak-booking + overview.sourceSplit */}
      <RevealItem className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <GlassCard className="p-6 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">{t('bookings.velocity')}</h3>
              <p className="text-sm text-muted-foreground">{velMode === 'hours' ? t('bookings.throughput') : t('bookings.byDay')}</p>
            </div>
            <div role="tablist" aria-label={t('bookings.velocity')} className="inline-flex gap-1 rounded-lg bg-secondary/60 p-1">
              {(['hours', 'days'] as const).map((m) => (
                <button key={m} role="tab" aria-selected={velMode === m} onClick={() => setVelMode(m)}
                  className={cn('rounded-md px-3 py-1.5 text-sm font-medium transition-colors', velMode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                  {t(`bookings.vel_${m}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 h-56">
            <Async query={peakQ} isEmpty={() => velocity.length === 0} skeleton={<div className="shimmer h-full rounded-xl" />}>
              {() => (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={velocity} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <XAxis dataKey="h" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} interval={velMode === 'hours' ? 2 : 0} />
                    <Tooltip cursor={{ fill: '#64748B', opacity: 0.12 }} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--popover-foreground))', fontSize: 12 }} />
                    <Bar dataKey="v" radius={[8, 8, 0, 0]}>
                      {velocity.map((d) => <Cell key={d.h} fill={d.v === maxVel && maxVel > 0 ? '#14B8A6' : 'rgba(20,184,166,0.28)'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Async>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-base font-semibold">{t('bookings.channelSplit')}</h3>
          <p className="text-sm text-muted-foreground">{t('bookings.webVsAgent')}</p>
          <Async query={overviewQ} isEmpty={() => channel.length === 0} skeleton={<div className="shimmer mx-auto mt-4 h-44 w-44 rounded-full" />}>
            {() => (
              <>
                <div className="relative mx-auto mt-4 h-44 w-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={channel} dataKey="value" innerRadius={58} outerRadius={80} paddingAngle={2} stroke="none">
                        {channel.map((c) => <Cell key={c.name} fill={c.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold tabular-nums">{appPct}%</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('bookings.directWeb')}</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  {channel.map((c) => (
                    <div key={c.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: c.color }} /> <span className="capitalize">{c.name.replace('_', ' ')}</span></span>
                      <span className="font-semibold tabular-nums">{c.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Async>
        </GlassCard>
      </RevealItem>

      {/* Booking information — live table with ops payment approval + cancel */}
      <RevealItem>
        <GlassCard className="overflow-hidden">
          <div className="border-b border-border p-5 pb-3">
            <h3 className="text-base font-semibold">{t('bookings.bookingInfo')}</h3>
            <p className="text-sm text-muted-foreground">{t('bookings.bookingInfoSub')}</p>
          </div>
          {bookingsQ.isLoading ? (
            <div className="shimmer m-5 h-72 rounded-xl" />
          ) : bookingsQ.isError ? (
            <div className="px-6 py-12 text-center text-sm text-destructive">{t('common.error', 'Could not load bookings.')}</div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">{t('bookings.emptyTitle')}</div>
          ) : (
            <>
              <DataTable
                rows={rows}
                columns={cols}
                rowKey={(r) => r.id}
                search={(r) => `${r.name} ${r.id} ${r.route} ${r.bus}`}
                searchPlaceholder={t('bookings.search')}
                empty={t('bookings.emptyTitle')}
              />
              {bookingsQ.hasNextPage && (
                <div className="flex justify-center border-t border-border p-4">
                  <Button variant="outline" onClick={() => void bookingsQ.fetchNextPage()} disabled={bookingsQ.isFetchingNextPage}>
                    {bookingsQ.isFetchingNextPage ? t('bookings.loading', 'Loading…') : t('bookings.loadMore', { shown: loadedBookings.length, total: totalBookings })}
                  </Button>
                </div>
              )}
            </>
          )}
        </GlassCard>
      </RevealItem>
    </Reveal>
  );
}
