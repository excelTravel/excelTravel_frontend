import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { Async } from '@/components/ui/async';
import { WaitlistBoard } from './WaitlistBoard';
import { TripRequestsBoard } from './TripRequestsBoard';
import { TripSchedule } from './TripSchedule';
import { NewTripModal } from './TripManagement';
import { useTripRows } from './useTripRows';
import { type TripRow, type TripGroup } from './trips';
import { formatRWF, cn } from '@/lib/utils';
import { useDateRange, rangeToQuery } from '@/store/dateRange';
import { useWaitlists } from '@/lib/api/hooks';

// One row = one individual trip. Trip No. leads; the route is shown as its planned origin -> destination.
// Clicking a row opens that trip's detail (where all the actions live) — there is no per-row Manage here.
export function TripsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [newTripOpen, setNewTripOpen] = useState(false);
  const { range } = useDateRange();
  const tripsQ = useTripRows(rangeToQuery(range));
  const allRows = tripsQ.data;
  const countBy = (g: TripGroup) => allRows.filter((r) => r.group === g).length;
  const waitlistQ = useWaitlists('open');
  const openWaitlists = waitlistQ.data?.length ?? 0;

  const cols: Column<TripRow>[] = [
    {
      key: 'tripNo', header: t('tripsList.colTripNo'), sort: (r) => r.tripNo ?? 0,
      cell: (r) => <span className="font-semibold tabular-nums">#{r.tripNo ?? '—'}</span>, td: 'whitespace-nowrap',
    },
    { key: 'origin', header: t('tripsList.colOrigin'), filter: (r) => r.origin, sort: (r) => r.origin, cell: (r) => r.origin, td: 'whitespace-nowrap font-medium' },
    {
      key: 'destination', header: t('tripsList.colDestination'), filter: (r) => r.destination, sort: (r) => r.destination,
      cell: (r) => <span className="flex items-center gap-1.5 font-medium"><ArrowRight className="size-3.5 text-muted-foreground" /> {r.destination}</span>, td: 'whitespace-nowrap',
    },
    { key: 'date', header: t('tripsList.colDate'), filter: (r) => r.date, sort: (r) => r.departureAt, cell: (r) => r.date, td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
    { key: 'departs', header: t('tripsList.colDeparts'), sort: (r) => r.departs, cell: (r) => r.departs, td: 'whitespace-nowrap tabular-nums' },
    { key: 'arrives', header: t('tripsList.colArrives'), sort: (r) => r.arrives, cell: (r) => r.arrives, td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
    {
      key: 'passengers', header: t('tripsList.colPassengers'), sort: (r) => (r.capacity ? r.booked / r.capacity : 0),
      cell: (r) => {
        const pct = r.capacity ? Math.round((r.booked / r.capacity) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-secondary">
              <div className={cn('h-full rounded-full', pct >= 100 ? 'bg-warning' : 'bg-teal')} style={{ width: `${pct}%` }} />
            </div>
            <span className="tabular-nums text-xs text-muted-foreground">{r.booked}/{r.capacity || '—'}</span>
          </div>
        );
      },
    },
    { key: 'bus', header: t('tripsList.colBus'), filter: (r) => r.bus, sort: (r) => r.bus, cell: (r) => r.bus, td: 'whitespace-nowrap text-muted-foreground' },
    { key: 'driver', header: t('tripsList.colDriver'), filter: (r) => r.driver, sort: (r) => r.driver, cell: (r) => r.driver, td: 'whitespace-nowrap' },
    { key: 'status', header: t('tripsList.colStatus'), sort: (r) => r.status, cell: (r) => <StatusPill status={r.status}>{t(`tripsList.status.${r.status}`, r.status)}</StatusPill> },
    { key: 'revenue', header: t('tripsList.colRevenue'), align: 'right', sort: (r) => r.revenue, cell: (r) => (r.revenue ? formatRWF(r.revenue) : '—'), td: 'whitespace-nowrap font-semibold tabular-nums' },
  ];

  return (
    <Reveal className="space-y-6">
      <NewTripModal open={newTripOpen} onClose={() => setNewTripOpen(false)} />

      {/* KPI cards */}
      <RevealItem className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label={t('tripsList.kpiTotal')} value={allRows.length.toLocaleString()} />
        <KpiCard label={t('tripsList.kpiScheduled')} value={String(countBy('scheduled'))} />
        <KpiCard label={t('tripsList.kpiActive')} value={String(countBy('active'))} badge={{ text: t('tripsList.live'), tone: 'teal' }} />
        <KpiCard label={t('tripsList.kpiCompleted')} value={String(countBy('completed'))} />
        <KpiCard
          label={t('tripsList.kpiWaitlist')}
          value={String(openWaitlists)}
          tone={openWaitlists > 0 ? 'danger' : 'default'}
          badge={openWaitlists > 0 ? { text: t('tripsList.needsAttention'), tone: 'danger' } : undefined}
        />
      </RevealItem>

      {/* Trip schedule — what's planned, by day/week/month */}
      <RevealItem><TripSchedule onNewTrip={() => setNewTripOpen(true)} /></RevealItem>

      {/* Trips history — individual trips, upcoming first */}
      <RevealItem>
        <GlassCard className="overflow-hidden">
          <div className="border-b border-border p-5 pb-3">
            <h3 className="text-base font-semibold">{t('tripsList.historyTitle')}</h3>
            <p className="text-sm text-muted-foreground">{t('tripsList.historySub')}</p>
          </div>
          <Async query={tripsQ} skeleton={<div className="space-y-2 p-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-9 rounded" />)}</div>}>
            {(data) => (
              <DataTable
                rows={data}
                columns={cols}
                rowKey={(r) => r.id}
                onRowClick={(r) => navigate(`/trips/${r.id}`)}
                search={(r) => `${r.tripNo} ${r.origin} ${r.destination} ${r.bus} ${r.driver}`}
                searchPlaceholder={t('tripsList.search')}
                empty={t('tripsList.emptyTitle')}
              />
            )}
          </Async>
        </GlassCard>
      </RevealItem>

      {/* Agent & passenger waitlist */}
      <RevealItem><WaitlistBoard /></RevealItem>

      {/* Agent demand-pooling trip requests */}
      <RevealItem><TripRequestsBoard /></RevealItem>
    </Reveal>
  );
}
