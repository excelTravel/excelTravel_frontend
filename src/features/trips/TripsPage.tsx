import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Search } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SortableTh } from '@/components/ui/sortable-th';
import { Table, Tbody, Td, Tr } from '@/components/ui/table';
import { useSort } from '@/lib/useSort';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { Async } from '@/components/ui/async';
import { TripScheduling } from './TripScheduling';
import { NewTripModal, TripManageModal, type ManageTrip } from './TripManagement';
import { useTripRows } from './useTripRows';
import { type TripRow, type TripGroup } from './trips';
import { formatRWF, cn } from '@/lib/utils';

const TABS = ['all', 'scheduled', 'active', 'completed', 'cancelled'] as const;

export function TripsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TripGroup | 'all'>('all');
  const [newTripOpen, setNewTripOpen] = useState(false);
  const [manageTrip, setManageTrip] = useState<ManageTrip | null>(null);
  const tripsQ = useTripRows();
  const allRows = tripsQ.data;
  const countBy = (g: TripGroup) => allRows.filter((r) => r.group === g).length;
  const countTab = (k: (typeof TABS)[number]) => (k === 'all' ? allRows.length : countBy(k));
  const rows = tab === 'all' ? allRows : allRows.filter((r) => r.group === tab);
  const { sorted, sortKey, sortDir, toggle } = useSort<TripRow>(rows, (row, key) => {
    switch (key) {
      case 'route': return `${row.from} ${row.to}`;
      case 'occupancy': return row.capacity ? row.booked / row.capacity : 0;
      case 'revenue': return row.revenue;
      default: return (row as unknown as Record<string, string | number>)[key] ?? '';
    }
  });

  return (
    <Reveal className="space-y-6">
      <NewTripModal open={newTripOpen} onClose={() => setNewTripOpen(false)} />
      <TripManageModal trip={manageTrip} open={manageTrip !== null} onClose={() => setManageTrip(null)} />

      {/* KPI cards */}
      <RevealItem className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t('tripsList.kpiScheduled')} value={String(countBy('scheduled'))} />
        <KpiCard label={t('tripsList.kpiActive')} value={String(countBy('active'))} badge={{ text: t('tripsList.live'), tone: 'teal' }} />
        <KpiCard label={t('tripsList.kpiCompleted')} value={String(countBy('completed'))} />
        <KpiCard label={t('tripsList.kpiCancelled')} value={String(countBy('cancelled'))} tone="danger" />
      </RevealItem>

      {/* Trips table */}
      <RevealItem>
        <GlassCard className="overflow-hidden">
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
                  <span className="rounded-full bg-secondary px-1.5 text-xs tabular-nums text-muted-foreground">{countTab(tb)}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder={t('tripsList.search')}
                  aria-label={t('tripsList.search')}
                  className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-56"
                />
              </div>
              <Button size="sm" onClick={() => setNewTripOpen(true)}><Plus className="size-4" /> {t('tripsList.newTrip')}</Button>
            </div>
          </div>

          <Async query={tripsQ} skeleton={<div className="space-y-2 p-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-9 rounded" />)}</div>}>
            {() => (
              <>
                <Table>
                  <thead className="bg-secondary/40">
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <SortableTh label={t('tripsList.colRoute')} sortKey="route" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                      <SortableTh label={t('tripsList.colDeparts')} sortKey="departs" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                      <SortableTh label={t('tripsList.colBus')} sortKey="bus" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                      <SortableTh label={t('tripsList.colDriver')} sortKey="driver" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                      <SortableTh label={t('tripsList.colOccupancy')} sortKey="occupancy" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                      <SortableTh label={t('tripsList.colStatus')} sortKey="status" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                      <SortableTh label={t('tripsList.colRevenue')} sortKey="revenue" activeKey={sortKey} dir={sortDir} onSort={toggle} align="right" />
                      <th className="border-y border-border/70 px-5 py-3 last:pr-6" />
                    </tr>
                  </thead>
                  <Tbody>
                    {sorted.map((r) => {
                      const pct = r.capacity ? Math.round((r.booked / r.capacity) * 100) : 0;
                      return (
                        <Tr key={r.id} onClick={() => navigate(`/trips/${r.id}`)}>
                          <Td className="whitespace-nowrap">
                            <div className="flex items-center gap-2 font-medium">
                              {r.from} <ArrowRight className="size-3.5 text-muted-foreground" /> {r.to}
                            </div>
                            <p className="text-xs text-muted-foreground">{r.kind}</p>
                          </Td>
                          <Td className="whitespace-nowrap tabular-nums">{r.departs}</Td>
                          <Td className="whitespace-nowrap text-muted-foreground">{r.bus}</Td>
                          <Td className="whitespace-nowrap">{r.driver}</Td>
                          <Td className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                                <div className={cn('h-full rounded-full', pct >= 100 ? 'bg-warning' : 'bg-teal')} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="tabular-nums text-xs text-muted-foreground">{r.booked}/{r.capacity}</span>
                            </div>
                          </Td>
                          <Td><StatusPill status={r.status}>{t(`tripsList.status.${r.status}`)}</StatusPill></Td>
                          <Td className="whitespace-nowrap text-right font-semibold tabular-nums">{r.revenue ? formatRWF(r.revenue) : '—'}</Td>
                          <Td className="text-right">
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
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
                {rows.length === 0 && (
                  <div className="p-10 text-center">
                    <p className="text-sm font-medium">{t('tripsList.emptyTitle')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t('tripsList.emptySub')}</p>
                  </div>
                )}
                <div className="flex items-center justify-between p-4">
                  <p className="text-sm text-muted-foreground">{t('tripsList.showing', { shown: rows.length, total: allRows.length })}</p>
                </div>
              </>
            )}
          </Async>
        </GlassCard>
      </RevealItem>

      {/* Scheduling & demand — flattened onto the same page */}
      <RevealItem>
        <h2 className="text-lg font-bold tracking-tight">{t('tripsList.view.scheduling')}</h2>
      </RevealItem>
      <TripScheduling />
    </Reveal>
  );
}
