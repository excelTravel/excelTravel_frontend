import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronRight, Plus, ArrowRight, Info, Coins, Upload, FileText, Bus, Snowflake, AlertTriangle, Pencil } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Modal } from '@/components/ui/modal';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Badge, StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Async } from '@/components/ui/async';
import { SegmentedDonut } from '@/components/ui/segmented-donut';
import { CountUp } from '@/components/ui/count-up';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import {
  useRoutes,
  useStops,
  useTrips,
  useIncidents,
  useTripTemplates,
  useTripManifests,
  useImportFares,
  type ApiRoute,
  type ApiTrip,
  type ApiIncident,
  type ApiIncidentCategory,
  type ApiManifestEntry,
} from '@/lib/api/hooks';
import { AddRouteModal, AddFareModal, EditRouteModal } from '@/features/network/NetworkModals';
import { RouteFares } from '@/features/network/RouteFares';
import { SchedulesTable } from '@/features/trips/SchedulesTable';
import { formatRWF, cn } from '@/lib/utils';
import { useDateRange, rangeToQuery } from '@/store/dateRange';

// Stable empty-array reference so `trips` doesn't change identity every render while its query is
// loading — it feeds two useMemo dependency arrays below and a fresh [] each render would defeat them.
const EMPTY_TRIPS: ApiTrip[] = [];

// Route management: KPI cards + Routes / Stops & stations / Fares. Moved out of the (now Live-Map-only)
// Network section. Tables use the shared DataTable (search + inline filters + sort + 10-row pagination).
export function RouteManagementPage() {
  const { t } = useTranslation();
  const { range } = useDateRange();
  const routesQ = useRoutes();
  const stopsQ = useStops();
  const tripsQ = useTrips(rangeToQuery(range));
  const incidentsQ = useIncidents();
  const templatesQ = useTripTemplates();
  const [addRoute, setAddRoute] = useState(false);
  const [addFare, setAddFare] = useState(false);
  const [uploadFares, setUploadFares] = useState(false);
  const [drillRoute, setDrillRoute] = useState<ApiRoute | null>(null);
  const [editRoute, setEditRoute] = useState<ApiRoute | null>(null);

  const routes = routesQ.data ?? [];
  const stops = stopsQ.data ?? [];
  const trips = tripsQ.data ?? EMPTY_TRIPS;
  const incidents = incidentsQ.data ?? [];
  const templates = templatesQ.data ?? [];

  // Every trip's manifest, fetched once up front (parallel, cached per trip) so the routes table's
  // booking-source/top-station columns and the Route Details sheet never need a second round trip —
  // opening a route is instant once this initial load settles. Cells show a loading dash until then.
  const tripIds = useMemo(() => trips.map((tr) => tr.id), [trips]);
  const manifestQueries = useTripManifests(tripIds);
  const manifestByTripId = useMemo(() => {
    const m = new Map<string, ApiManifestEntry[]>();
    trips.forEach((tr, i) => {
      const data = manifestQueries[i]?.data;
      if (data) m.set(tr.id, data);
    });
    return m;
  }, [trips, manifestQueries]);
  const manifestsLoaded = manifestQueries.length === 0 || manifestQueries.every((q) => q.isSuccess || q.isError);

  // Route performance: completed trips + combined revenue + booking source + top boarding station,
  // per route (each trip accounts to its route).
  const revByRoute = new Map<string, number>();
  const completedByRoute = new Map<string, number>();
  const tripsByRoute = new Map<string, ApiTrip[]>();
  for (const tr of trips) {
    revByRoute.set(tr.routeId, (revByRoute.get(tr.routeId) ?? 0) + tr.revenue);
    if (tr.status === 'completed') completedByRoute.set(tr.routeId, (completedByRoute.get(tr.routeId) ?? 0) + 1);
    const list = tripsByRoute.get(tr.routeId) ?? [];
    list.push(tr);
    tripsByRoute.set(tr.routeId, list);
  }

  function routeManifests(routeId: string): ApiManifestEntry[] {
    return (tripsByRoute.get(routeId) ?? []).flatMap((tr) => manifestByTripId.get(tr.id) ?? []);
  }
  // Bar instead of plain "64% / 36%" text — teal/navy segments so the split actually reads at a glance.
  function bookingSourceBar(routeId: string) {
    if (!manifestsLoaded) return <span className="text-muted-foreground">…</span>;
    const all = routeManifests(routeId);
    if (all.length === 0) return <span className="text-muted-foreground">—</span>;
    const app = all.filter((m) => m.bookingSource === 'app').length;
    const appPct = Math.round((app / all.length) * 100);
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-2 w-20 overflow-hidden rounded-full bg-secondary" title={`${t('trip.via.app')} ${appPct}% · ${t('trip.via.agent')} ${100 - appPct}%`}>
          <div className="h-full bg-teal" style={{ width: `${appPct}%` }} />
          <div className="h-full bg-[hsl(var(--navy))]" style={{ width: `${100 - appPct}%` }} />
        </div>
        <span className="tabular-nums text-muted-foreground">{appPct}/{100 - appPct}</span>
      </div>
    );
  }
  function topStationLabel(routeId: string): string {
    if (!manifestsLoaded) return '…';
    const all = routeManifests(routeId);
    if (all.length === 0) return '—';
    const counts = new Map<string, number>();
    for (const m of all) counts.set(m.boardStopName, (counts.get(m.boardStopName) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  }
  // A route is "frozen" when it has at least one recurring schedule and every one of them is frozen
  // (paused). Reflects live — freezing a schedule invalidates its query, which refetches this automatically.
  function routeFrozen(routeId: string): boolean {
    const routeTemplates = templates.filter((tpl) => tpl.routeId === routeId);
    return routeTemplates.length > 0 && routeTemplates.every((tpl) => !tpl.active);
  }

  const topRouteId = [...completedByRoute.entries()].sort((a, b) => (revByRoute.get(b[0]) ?? 0) - (revByRoute.get(a[0]) ?? 0) || b[1] - a[1])[0]?.[0];
  const topRoute = routes.find((r) => r.id === topRouteId);

  const routeCols: Column<ApiRoute>[] = [
    {
      key: 'route', header: t('network.colRoute'),
      cell: (r) => (
        <div>
          <p className="font-medium">{r.name}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{r.origin ?? '—'} <ArrowRight className="size-3" /> {r.destination ?? '—'}</p>
        </div>
      ),
      sort: (r) => r.name, filter: (r) => r.name,
    },
    { key: 'distance', header: t('network.colDistance'), cell: (r) => (r.distanceKm == null ? '—' : `${r.distanceKm} km`), sort: (r) => r.distanceKm ?? 0, td: 'whitespace-nowrap tabular-nums' },
    { key: 'trips', header: t('routesMgmt.tripsCompleted'), cell: (r) => (completedByRoute.get(r.id) ?? 0).toLocaleString(), sort: (r) => completedByRoute.get(r.id) ?? 0, align: 'right', td: 'whitespace-nowrap tabular-nums' },
    { key: 'revenue', header: t('routesMgmt.revenue'), cell: (r) => formatRWF(revByRoute.get(r.id) ?? 0), sort: (r) => revByRoute.get(r.id) ?? 0, align: 'right', td: 'whitespace-nowrap font-semibold tabular-nums' },
    { key: 'source', header: t('routesMgmt.bookingSource'), cell: (r) => bookingSourceBar(r.id), td: 'whitespace-nowrap' },
    { key: 'topStation', header: t('routesMgmt.topStation'), cell: (r) => topStationLabel(r.id), td: 'whitespace-nowrap' },
    {
      key: 'status', header: t('network.colStatus'),
      cell: (r) => routeFrozen(r.id)
        ? <Badge tone="info"><Snowflake className="size-3" /> {t('schedules.frozen')}</Badge>
        : <Badge tone={r.status === 'active' ? 'success' : 'neutral'}>{t(`network.${r.status}`)}</Badge>,
    },
  ];

  return (
    <Reveal className="space-y-6">
      <AddRouteModal open={addRoute} onClose={() => setAddRoute(false)} />
      <AddFareModal open={addFare} onClose={() => setAddFare(false)} />
      <UploadFaresModal open={uploadFares} onClose={() => setUploadFares(false)} />
      <EditRouteModal route={editRoute} open={editRoute !== null} onClose={() => setEditRoute(null)} />
      <RouteDetailsSheet
        route={drillRoute}
        trips={trips}
        incidents={incidents}
        manifestByTripId={manifestByTripId}
        manifestsLoaded={manifestsLoaded}
        onClose={() => setDrillRoute(null)}
        onEdit={(r) => {
          setDrillRoute(null);
          setEditRoute(r);
        }}
      />

      {/* KPI cards */}
      <RevealItem className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard label={t('routesMgmt.totalRoutes')} value={routes.length.toLocaleString()} />
        <KpiCard label={t('routesMgmt.activeRoutes')} value={routes.filter((r) => r.status === 'active').length.toLocaleString()} />
        <KpiCard label={t('routesMgmt.stations')} value={stops.filter((s) => s.type === 'station').length.toLocaleString()} />
        <KpiCard label={t('routesMgmt.topRoute')} value={topRoute?.name ?? '—'} />
      </RevealItem>

      {/* Route schedules — the recurring template each route runs on. Lives here, not on Trips, since
          it's route-scoped config; Trips keeps only actual scheduled trip instances. */}
      <RevealItem><SchedulesTable /></RevealItem>

      {/* Fares */}
      <RevealItem>
        <GlassCard className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5 pb-3">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold"><Coins className="size-4" /> {t('network.faresByRoute')}</h3>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Info className="size-3.5" /> {t('network.ruraNote')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setUploadFares(true)}><Upload className="size-4" /> {t('routesMgmt.uploadFares')}</Button>
              <Button size="sm" onClick={() => setAddFare(true)}><Plus className="size-4" /> {t('network.addFare')}</Button>
            </div>
          </div>
          <div className="p-5"><RouteFares /></div>
        </GlassCard>
      </RevealItem>

      {/* Routes — every route the company covers, including ones with no trips/revenue yet */}
      <RevealItem>
        <GlassCard className="overflow-hidden">
          <div className="border-b border-border p-5 pb-3">
            <h3 className="text-base font-semibold">{t('network.tabs.routes')}</h3>
          </div>
          <Async query={routesQ} skeleton={<TableSkeleton />}>
            {(data) => (
              <DataTable
                rows={data}
                columns={routeCols}
                rowKey={(r) => r.id}
                onRowClick={(r) => setDrillRoute(r)}
                search={(r) => `${r.name} ${r.origin ?? ''} ${r.destination ?? ''}`}
                searchPlaceholder={t('routesMgmt.searchRoutes')}
                empty={t('network.noRoutes')}
                filtersInline
                toolbarRight={<Button size="sm" onClick={() => setAddRoute(true)}><Plus className="size-4" /> {t('network.addRoute')}</Button>}
              />
            )}
          </Async>
        </GlassCard>
      </RevealItem>
    </Reveal>
  );
}

function TableSkeleton() {
  return <div className="space-y-2 p-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-9 rounded" />)}</div>;
}

const drillDateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'Africa/Kigali' });
const drillTimeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' });
const ROUTE_TRIPS_PAGE_SIZE = 10;

// Route drill-in: performance cards for the route (trips completed, passengers, revenue, busiest bus,
// incidents + category + worst bus, animated booking source split) + every trip ever run on it, paginated
// 10-at-a-time. Opens as a full-height slide-over (Sheet) rather than a centered modal — there's enough
// content here (cards + a long trip list) to want the room. All passenger/booking-source figures are
// computed from manifests the parent page already eagerly fetched for every trip — no per-row fetch, no
// expand-to-view-manifest: each row shows its own numbers immediately, and rows link straight to the trip.
function RouteDetailsSheet({ route, trips, incidents, manifestByTripId, manifestsLoaded, onClose, onEdit }: {
  route: ApiRoute | null;
  trips: ApiTrip[];
  incidents: ApiIncident[];
  manifestByTripId: Map<string, ApiManifestEntry[]>;
  manifestsLoaded: boolean;
  onClose: () => void;
  onEdit: (route: ApiRoute) => void;
}) {
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(ROUTE_TRIPS_PAGE_SIZE);

  const rows = route ? trips.filter((tr) => tr.routeId === route.id).sort((a, b) => b.departureTime.localeCompare(a.departureTime)) : [];
  const revenue = rows.reduce((s, tr) => s + tr.revenue, 0);
  const visibleRows = rows.slice(0, visibleCount);
  const hasMore = visibleCount < rows.length;
  const completedCount = rows.filter((tr) => tr.status === 'completed').length;

  // Accidents are reported per-trip (ApiIncident.tripId) — scope the already-loaded full incident list to
  // this route's trips. "Bus that encountered most incidents" reads the trip's own vehicle at report time.
  const tripIds = new Set(rows.map((tr) => tr.id));
  const plateByTripId = new Map(rows.map((tr) => [tr.id, tr.vehiclePlate]));
  const routeIncidents = incidents.filter((i) => tripIds.has(i.tripId));
  const incidentCountByTrip = new Map<string, number>();
  for (const inc of routeIncidents) incidentCountByTrip.set(inc.tripId, (incidentCountByTrip.get(inc.tripId) ?? 0) + 1);

  let topCategory: ApiIncidentCategory | null = null;
  let worstBus: string | null = null;
  if (routeIncidents.length > 0) {
    const catCounts = new Map<ApiIncidentCategory, number>();
    const busCounts = new Map<string, number>();
    for (const inc of routeIncidents) {
      catCounts.set(inc.category, (catCounts.get(inc.category) ?? 0) + 1);
      const plate = plateByTripId.get(inc.tripId);
      if (plate) busCounts.set(plate, (busCounts.get(plate) ?? 0) + 1);
    }
    topCategory = [...catCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const topBus = [...busCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    worstBus = topBus ? topBus[0] : null;
  }

  // All passengers across all trips on the route — the real manifest count (can exceed capacity from
  // mid-route leg pickups), not the seat-booked count.
  const allManifests = rows.flatMap((tr) => manifestByTripId.get(tr.id) ?? []);
  const passengersBoarded = allManifests.length;
  const appCount = allManifests.filter((m) => m.bookingSource === 'app').length;
  const appPct = allManifests.length ? Math.round((appCount / allManifests.length) * 100) : 0;

  let busiestBuses: { plates: string[]; count: number } | null = null;
  {
    const counts = new Map<string, number>();
    for (const tr of rows) {
      if (!tr.vehiclePlate) continue;
      counts.set(tr.vehiclePlate, (counts.get(tr.vehiclePlate) ?? 0) + 1);
    }
    const max = Math.max(0, ...counts.values());
    if (max > 0) busiestBuses = { plates: [...counts.entries()].filter(([, c]) => c === max).map(([p]) => p), count: max };
  }

  return (
    <Sheet
      open={route !== null}
      onClose={onClose}
      width="lg"
      title={route ? `${route.origin} → ${route.destination}` : ''}
      description={route ? t('routesMgmt.routeTripsSub', { trips: rows.length, revenue: formatRWF(revenue) }) : ''}
      footer={route && <Button variant="outline" size="sm" onClick={() => onEdit(route)}><Pencil className="size-4" /> {t('network.editRoute')}</Button>}
    >
      {rows.length === 0 ? (
        <div className="grid place-items-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <Bus className="size-7" /> {t('routesMgmt.noTripsForRoute')}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <RouteStat label={t('routesMgmt.tripsCompleted')} value={<CountUp value={completedCount} />} />
            <RouteStat
              label={t('routesMgmt.stat.passengers')}
              value={manifestsLoaded ? <CountUp value={passengersBoarded} /> : '…'}
              sub={t('routesMgmt.stat.passengersSub')}
            />
            <RouteStat label={t('routesMgmt.stat.totalRevenue')} value={<CountUp value={revenue} format={(n) => formatRWF(Math.round(n))} />} />
            <BusiestBusStat buses={busiestBuses} />
            <RouteStat
              label={t('routesMgmt.stat.accidents')}
              value={routeIncidents.length.toLocaleString()}
              danger={routeIncidents.length > 0}
              sub={topCategory && worstBus ? t('routesMgmt.stat.accidentsSub', { category: t(`routesMgmt.category.${topCategory}`), bus: worstBus }) : undefined}
            />
            <GlassCard className="p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('routesMgmt.stat.bookingSource')}</p>
              {manifestsLoaded && allManifests.length > 0 ? (
                <div className="mt-1 flex items-center gap-3">
                  <SegmentedDonut size={56} segments={[{ value: appCount, color: 'hsl(var(--teal))' }, { value: allManifests.length - appCount, color: 'hsl(var(--navy))' }]}>
                    <span className="text-[11px] font-bold tabular-nums"><CountUp value={appPct} format={(n) => `${Math.round(n)}%`} /></span>
                  </SegmentedDonut>
                  <div className="text-xs">
                    <p className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-teal" /> {t('trip.via.app')} <span className="font-semibold tabular-nums">{appPct}%</span></p>
                    <p className="mt-0.5 flex items-center gap-1.5"><span className="size-2 rounded-full bg-[hsl(var(--navy))]" /> {t('trip.via.agent')} <span className="font-semibold tabular-nums">{100 - appPct}%</span></p>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-lg font-bold text-muted-foreground">{manifestsLoaded ? '—' : '…'}</p>
              )}
            </GlassCard>
          </div>

          <ul className="space-y-2">
            {visibleRows.map((tr) => {
              const accCount = incidentCountByTrip.get(tr.id) ?? 0;
              const tripManifest = manifestByTripId.get(tr.id);
              const boarded = tripManifest?.length ?? tr.booked;
              const tripApp = tripManifest?.filter((m) => m.bookingSource === 'app').length ?? 0;
              const tripAppPct = tripManifest?.length ? Math.round((tripApp / tripManifest.length) * 100) : null;

              return (
                <li key={tr.id} className="grid grid-cols-[1fr,auto,auto] items-start gap-4 rounded-xl border border-border p-3">
                  {/* Column 1: trip id, date, departure & arrival (same row), driver & vehicle (same row) */}
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                      <span className="tabular-nums">#{tr.tripNo ?? '—'}</span>
                      <StatusPill status={tr.status}>{t(`tripsList.status.${tr.status}`)}</StatusPill>
                      {accCount > 0 && (
                        <Badge tone="danger"><AlertTriangle className="size-3" /> {t('routesMgmt.stat.accidentBadge', { n: accCount })}</Badge>
                      )}
                    </p>
                    <p className="mt-1 text-xs tabular-nums text-muted-foreground">{drillDateFmt.format(new Date(tr.departureTime))}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{departureLine(t, tr)}</span>
                      <span>{arrivalLine(t, tr)}</span>
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{tr.driverName ?? t('trip.noDriver')}</span>
                      <span>{tr.vehiclePlate ?? '—'}</span>
                    </p>
                  </div>

                  {/* Column 2: passengers who booked + this trip's booking source */}
                  <div className="w-32 shrink-0 text-xs">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('routesMgmt.stat.passengersCol')}</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">{tripManifest ? boarded : '…'}</p>
                    <p className="mt-1 text-muted-foreground">
                      {tripAppPct != null ? t('routesMgmt.stat.tripSourceLine', { app: tripAppPct, agent: 100 - tripAppPct }) : '…'}
                    </p>
                  </div>

                  {/* Column 3: revenue + view more details */}
                  <div className="w-36 shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums">{formatRWF(tr.revenue)}</p>
                    <Link to={`/trips/${tr.id}`} onClick={onClose} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      {t('routesMgmt.stat.openTrip')} <ChevronRight className="size-3.5" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={() => setVisibleCount((c) => c + ROUTE_TRIPS_PAGE_SIZE)}>
                {t('routesMgmt.viewMoreTrips', { shown: visibleRows.length, total: rows.length })}
              </Button>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

// Status-aware departure line: "Departs at" while still scheduled, "Departed at" once it has (or should
// have) left.
function departureLine(t: ReturnType<typeof useTranslation>['t'], tr: ApiTrip): string {
  const time = drillTimeFmt.format(new Date(tr.departureTime));
  return tr.status === 'scheduled' ? t('routesMgmt.stat.departsAt', { time }) : t('routesMgmt.stat.departedAt', { time });
}

// Status-aware arrival line. Scheduled trips haven't departed yet; completed trips show the actual
// arrival time; cancelled trips never arrived (the trip model has no cancellation timestamp to show);
// anything still live (boarding/departed/in_transit/arriving) is en route.
function arrivalLine(t: ReturnType<typeof useTranslation>['t'], tr: ApiTrip): string {
  if (tr.status === 'scheduled') return t('routesMgmt.stat.arrivedNotDeparted');
  if (tr.status === 'cancelled') return t('routesMgmt.stat.cancelledLabel');
  if (tr.status === 'completed' && tr.arrivalTime) return t('routesMgmt.stat.arrivedAt', { time: drillTimeFmt.format(new Date(tr.arrivalTime)) });
  return t('routesMgmt.stat.arrivedEnRoute');
}

function RouteStat({ label, value, sub, danger }: { label: string; value: React.ReactNode; sub?: string; danger?: boolean }) {
  return (
    <GlassCard className="p-3">
      <p className={cn('text-[10px] font-semibold uppercase tracking-wide', danger ? 'text-destructive' : 'text-muted-foreground')}>{label}</p>
      <p className={cn('mt-1 truncate text-lg font-bold tabular-nums', danger && 'text-destructive')}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </GlassCard>
  );
}

// Busiest bus card — when two or more vehicles are tied for the most trips, lists all of them instead of
// arbitrarily picking one.
function BusiestBusStat({ buses }: { buses: { plates: string[]; count: number } | null }) {
  const { t } = useTranslation();
  if (!buses) return <RouteStat label={t('routesMgmt.stat.busiestBus')} value="—" />;
  if (buses.plates.length === 1) {
    return <RouteStat label={t('routesMgmt.stat.busiestBus')} value={buses.plates[0]} sub={t('routesMgmt.stat.busiestBusSub', { n: buses.count })} />;
  }
  return (
    <GlassCard className="p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('routesMgmt.stat.busiestBus')}</p>
      <p className="mt-1 text-sm font-bold leading-snug">{buses.plates.join(', ')}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{t('routesMgmt.stat.busiestBusTie', { n: buses.count })}</p>
    </GlassCard>
  );
}

// Upload the RURA fares CSV (origin, destination, fare) → server matches stations by name and upserts the
// national fare matrix, reporting rows it imported and any it skipped.
function UploadFaresModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const importFares = useImportFares();
  const result = importFares.data;

  function close() {
    setFile(null);
    importFares.reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={t('routesMgmt.uploadFaresTitle')}
      description={t('routesMgmt.uploadFaresSub')}
      footer={<><Button variant="outline" onClick={close}>{t('forms.close')}</Button><Button disabled={!file || importFares.isPending} onClick={() => file && importFares.mutate(file)}>{importFares.isPending ? t('forms.saving') : t('routesMgmt.importRows')}</Button></>}
    >
      <div className="space-y-4">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:bg-secondary/40">
          <Upload className="size-7 text-muted-foreground" />
          <span className="text-sm font-medium">{file ? file.name : t('routesMgmt.dropPdf')}</span>
          <span className="text-xs text-muted-foreground">{t('routesMgmt.pdfHint')}</span>
          <input type="file" accept="text/csv,.csv" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); importFares.reset(); }} />
        </label>
        {file && !result && (
          <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3 text-sm"><FileText className="size-4 text-primary" /> {file.name}</div>
        )}
        {importFares.isError && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{importFares.error instanceof Error ? importFares.error.message : t('routesMgmt.importRows')}</p>
        )}
        {result ? (
          <div className="space-y-2">
            <p className="rounded-lg bg-success/10 p-3 text-sm font-medium text-success">{t('routesMgmt.importDone', { imported: result.imported, total: result.totalRows })}</p>
            {result.skipped.length > 0 && (
              <div className="rounded-lg bg-warning/10 p-3 text-xs text-warning">
                <p className="font-semibold">{t('routesMgmt.importSkipped', { n: result.skipped.length })}</p>
                <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto">
                  {result.skipped.map((s) => <li key={s.line}>#{s.line} {s.origin} → {s.destination}: {s.reason}</li>)}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-xs text-warning">
            <Info className="mt-0.5 size-3.5 shrink-0" /> {t('routesMgmt.uploadPending')}
          </p>
        )}
      </div>
    </Modal>
  );
}
