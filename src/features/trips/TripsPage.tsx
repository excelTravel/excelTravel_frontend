import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { Async } from '@/components/ui/async';
import { WaitlistBoard } from './WaitlistBoard';
import { NewTripModal, TripManageModal, type ManageTrip } from './TripManagement';
import { useTripRows } from './useTripRows';
import { type TripRow, type TripGroup } from './trips';
import { formatRWF, cn } from '@/lib/utils';

export function TripsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [newTripOpen, setNewTripOpen] = useState(false);
  const [manageTrip, setManageTrip] = useState<ManageTrip | null>(null);
  const tripsQ = useTripRows();
  const allRows = tripsQ.data;
  const countBy = (g: TripGroup) => allRows.filter((r) => r.group === g).length;

  // Trips history — every dispatched trip. Filter only on route / bus / driver (per the table rules).
  const cols: Column<TripRow>[] = [
    {
      key: 'route', header: t('tripsList.colRoute'), sort: (r) => `${r.from} ${r.to}`, filter: (r) => `${r.from} → ${r.to}`,
      cell: (r) => (
        <div>
          <div className="flex items-center gap-2 font-medium">{r.from} <ArrowRight className="size-3.5 text-muted-foreground" /> {r.to}</div>
          <p className="text-xs text-muted-foreground">{r.kind}</p>
        </div>
      ),
    },
    { key: 'date', header: t('tripsList.colDate'), sort: (r) => r.date, cell: (r) => r.date, td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
    { key: 'departs', header: t('tripsList.colDeparts'), sort: (r) => r.departs, cell: (r) => r.departs, td: 'whitespace-nowrap tabular-nums' },
    { key: 'arrives', header: t('tripsList.colArrives'), sort: (r) => r.arrives, cell: (r) => r.arrives, td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
    { key: 'bus', header: t('tripsList.colBus'), filter: (r) => r.bus, sort: (r) => r.bus, cell: (r) => r.bus, td: 'whitespace-nowrap text-muted-foreground' },
    { key: 'driver', header: t('tripsList.colDriver'), filter: (r) => r.driver, sort: (r) => r.driver, cell: (r) => r.driver, td: 'whitespace-nowrap' },
    {
      key: 'occupancy', header: t('tripsList.colOccupancy'), sort: (r) => (r.capacity ? r.booked / r.capacity : 0),
      cell: (r) => {
        const pct = r.capacity ? Math.round((r.booked / r.capacity) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
              <div className={cn('h-full rounded-full', pct >= 100 ? 'bg-warning' : 'bg-teal')} style={{ width: `${pct}%` }} />
            </div>
            <span className="tabular-nums text-xs text-muted-foreground">{r.booked}/{r.capacity}</span>
          </div>
        );
      },
    },
    { key: 'status', header: t('tripsList.colStatus'), sort: (r) => r.status, cell: (r) => <StatusPill status={r.status}>{t(`tripsList.status.${r.status}`)}</StatusPill> },
    { key: 'revenue', header: t('tripsList.colRevenue'), align: 'right', sort: (r) => r.revenue, cell: (r) => (r.revenue ? formatRWF(r.revenue) : '—'), td: 'whitespace-nowrap font-semibold tabular-nums' },
    {
      key: 'actions', header: '',
      cell: (r) => (
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setManageTrip({ id: r.id, from: r.from, to: r.to, departs: r.departs, bus: r.bus, driver: r.driver, published: false }); }}>
          {t('tripsList.manage')}
        </Button>
      ),
      td: 'text-right',
    },
  ];

  return (
    <Reveal className="space-y-6">
      <NewTripModal open={newTripOpen} onClose={() => setNewTripOpen(false)} />
      <TripManageModal trip={manageTrip} open={manageTrip !== null} onClose={() => setManageTrip(null)} />

      {/* KPI cards */}
      <RevealItem className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t('tripsList.kpiTotal')} value={allRows.length.toLocaleString()} />
        <KpiCard label={t('tripsList.kpiScheduled')} value={String(countBy('scheduled'))} />
        <KpiCard label={t('tripsList.kpiActive')} value={String(countBy('active'))} badge={{ text: t('tripsList.live'), tone: 'teal' }} />
        <KpiCard label={t('tripsList.kpiCompleted')} value={String(countBy('completed'))} />
      </RevealItem>

      {/* Agent & passenger waitlist (route schedules now live under Routes) */}
      <RevealItem><WaitlistBoard /></RevealItem>

      {/* Trips history */}
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
                search={(r) => `${r.from} ${r.to} ${r.bus} ${r.driver}`}
                searchPlaceholder={t('tripsList.search')}
                empty={t('tripsList.emptyTitle')}
                toolbarRight={<Button size="sm" onClick={() => setNewTripOpen(true)}><Plus className="size-4" /> {t('tripsList.newTrip')}</Button>}
              />
            )}
          </Async>
        </GlassCard>
      </RevealItem>
    </Reveal>
  );
}
