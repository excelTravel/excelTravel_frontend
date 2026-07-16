import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SortableTh } from '@/components/ui/sortable-th';
import { useSort } from '@/lib/useSort';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { TripScheduling } from './TripScheduling';
import { RoutesView } from './RoutesView';
import { NewTripModal, TripManageModal, type ManageTrip } from './TripManagement';
import { TRIPS, countBy, type TripRow, type TripGroup } from './trips';
import { formatRWF, cn } from '@/lib/utils';

const TABS = ['all', 'scheduled', 'active', 'completed', 'cancelled'] as const;
const countTab = (k: (typeof TABS)[number]) => (k === 'all' ? TRIPS.length : countBy(k));

const VIEWS = ['routes', 'trips', 'scheduling'] as const;

export function TripsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [view, setView] = useState<(typeof VIEWS)[number]>('routes');
  const [tab, setTab] = useState<TripGroup | 'all'>('all');
  const [newTripOpen, setNewTripOpen] = useState(false);
  const [manageTrip, setManageTrip] = useState<ManageTrip | null>(null);
  const rows = tab === 'all' ? TRIPS : TRIPS.filter((r) => r.group === tab);
  const { sorted, sortKey, sortDir, toggle } = useSort<TripRow>(rows, (row, key) => {
    switch (key) {
      case 'route': return `${row.from} ${row.to}`;
      case 'occupancy': return row.booked / row.capacity;
      case 'revenue': return row.revenue;
      default: return (row as unknown as Record<string, string | number>)[key] ?? '';
    }
  });

  return (
    <Reveal className="space-y-6">
      <RevealItem>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label={t('nav.trips')} className="inline-flex gap-1 rounded-xl bg-secondary/60 p-1">
            {VIEWS.map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  view === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`tripsList.view.${v}`)}
              </button>
            ))}
          </div>
          {view !== 'scheduling' && (
            <Button size="sm" onClick={() => setNewTripOpen(true)}>
              <Plus className="size-4" /> {t('tripsList.newTrip')}
            </Button>
          )}
        </div>
      </RevealItem>

      <NewTripModal open={newTripOpen} onClose={() => setNewTripOpen(false)} />
      <TripManageModal trip={manageTrip} open={manageTrip !== null} onClose={() => setManageTrip(null)} />

      {view === 'routes' && <RoutesView />}

      {view === 'scheduling' && (
        <RevealItem>
          <TripScheduling />
        </RevealItem>
      )}

      {view === 'trips' && (
      <>
      <RevealItem className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t('tripsList.kpiScheduled')} value={String(countBy('scheduled'))} />
        <KpiCard label={t('tripsList.kpiActive')} value={String(countBy('active'))} badge={{ text: t('tripsList.live'), tone: 'teal' }} />
        <KpiCard label={t('tripsList.kpiCompleted')} value={String(countBy('completed'))} />
        <KpiCard label={t('tripsList.kpiCancelled')} value={String(countBy('cancelled'))} tone="danger" />
      </RevealItem>

      <RevealItem>
        <GlassCard className="overflow-hidden">
          {/* Filter tabs + search */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div role="tablist" aria-label={t('tripsList.title')} className="inline-flex flex-wrap gap-1 rounded-xl bg-secondary/60 p-1">
              {TABS.map((tb) => (
                <button
                  key={tb}
                  role="tab"
                  aria-selected={tab === tb}
                  onClick={() => setTab(tb)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    tab === tb ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(`tripsList.tabs.${tb}`)}
                  <span className="rounded-full bg-secondary px-1.5 text-xs tabular-nums text-muted-foreground">
                    {countTab(tb)}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder={t('tripsList.search')}
                aria-label={t('tripsList.search')}
                className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <SortableTh label={t('tripsList.colRoute')} sortKey="route" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                  <SortableTh label={t('tripsList.colDeparts')} sortKey="departs" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                  <SortableTh label={t('tripsList.colBus')} sortKey="bus" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                  <SortableTh label={t('tripsList.colDriver')} sortKey="driver" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                  <SortableTh label={t('tripsList.colOccupancy')} sortKey="occupancy" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                  <SortableTh label={t('tripsList.colStatus')} sortKey="status" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                  <SortableTh label={t('tripsList.colRevenue')} sortKey="revenue" activeKey={sortKey} dir={sortDir} onSort={toggle} align="right" />
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((r) => {
                  const pct = Math.round((r.booked / r.capacity) * 100);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/trips/${r.id}`)}
                      className="cursor-pointer transition-colors hover:bg-secondary/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2 font-medium">
                          {r.from} <ArrowRight className="size-3.5 text-muted-foreground" /> {r.to}
                        </div>
                        <p className="text-xs text-muted-foreground">{r.id} · {r.kind}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums">{r.departs}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{r.bus}</td>
                      <td className="whitespace-nowrap px-4 py-3">{r.driver}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                            <div
                              className={cn('h-full rounded-full', pct >= 100 ? 'bg-warning' : 'bg-teal')}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="tabular-nums text-xs text-muted-foreground">{r.booked}/{r.capacity}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={r.status}>{t(`tripsList.status.${r.status}`)}</StatusPill>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">
                        {r.revenue ? formatRWF(r.revenue) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setManageTrip({ id: r.id, from: r.from, to: r.to, departs: r.departs, bus: r.bus, driver: r.driver, published: false });
                          }}
                        >
                          {t('tripsList.manage')}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {rows.length === 0 && (
              <div className="p-10 text-center">
                <p className="text-sm font-medium">{t('tripsList.emptyTitle')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('tripsList.emptySub')}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4">
            <p className="text-sm text-muted-foreground">{t('tripsList.showing', { shown: rows.length, total: TRIPS.length })}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="size-8" aria-label={t('tripsList.prev')}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon" className="size-8" aria-label={t('tripsList.next')}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </GlassCard>
      </RevealItem>
      </>
      )}
    </Reveal>
  );
}
