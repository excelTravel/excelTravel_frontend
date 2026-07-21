import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Info, Coins, Upload, FileText, Bus } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Badge, StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Async } from '@/components/ui/async';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { useRoutes, useStops, useTrips, useImportFares, type ApiRoute, type ApiStop, type ApiTrip } from '@/lib/api/hooks';
import { AddRouteModal, AddStopModal, AddFareModal } from '@/features/network/NetworkModals';
import { RouteFares } from '@/features/network/RouteFares';
import { SchedulesTable } from '@/features/trips/SchedulesTable';
import { formatRWF } from '@/lib/utils';

// Route management: KPI cards + Routes / Stops & stations / Fares. Moved out of the (now Live-Map-only)
// Network section. Tables use the shared DataTable (search + filter + sort + 10-row pagination).
export function RouteManagementPage() {
  const { t } = useTranslation();
  const routesQ = useRoutes();
  const stopsQ = useStops();
  const tripsQ = useTrips();
  const [addRoute, setAddRoute] = useState(false);
  const [addStop, setAddStop] = useState(false);
  const [addFare, setAddFare] = useState(false);
  const [uploadFares, setUploadFares] = useState(false);
  const [drillRoute, setDrillRoute] = useState<ApiRoute | null>(null);

  const routes = routesQ.data ?? [];
  const stops = stopsQ.data ?? [];
  const trips = tripsQ.data ?? [];

  // Route performance: trips covered + combined revenue per route (each trip accounts to its route).
  const revByRoute = new Map<string, number>();
  const cntByRoute = new Map<string, number>();
  for (const tr of trips) {
    cntByRoute.set(tr.routeId, (cntByRoute.get(tr.routeId) ?? 0) + 1);
    revByRoute.set(tr.routeId, (revByRoute.get(tr.routeId) ?? 0) + tr.revenue);
  }
  const topRouteId = [...cntByRoute.entries()].sort((a, b) => (revByRoute.get(b[0]) ?? 0) - (revByRoute.get(a[0]) ?? 0) || b[1] - a[1])[0]?.[0];
  const topRoute = routes.find((r) => r.id === topRouteId);

  const nameById = (id: string | null) => (id ? stops.find((s) => s.id === id)?.name ?? '—' : '—');

  const routeCols: Column<ApiRoute>[] = [
    {
      key: 'route', header: t('network.colRoute'),
      cell: (r) => (
        <div>
          <p className="font-medium">{r.name}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">{r.origin} <ArrowRight className="size-3" /> {r.destination}</p>
        </div>
      ),
      sort: (r) => r.name, filter: (r) => r.name,
    },
    { key: 'distance', header: t('network.colDistance'), cell: (r) => (r.distanceKm == null ? '—' : `${r.distanceKm} km`), sort: (r) => r.distanceKm ?? 0, td: 'whitespace-nowrap tabular-nums' },
    { key: 'trips', header: t('routesMgmt.tripsCovered'), cell: (r) => (cntByRoute.get(r.id) ?? 0).toLocaleString(), sort: (r) => cntByRoute.get(r.id) ?? 0, align: 'right', td: 'whitespace-nowrap tabular-nums' },
    { key: 'revenue', header: t('routesMgmt.revenue'), cell: (r) => formatRWF(revByRoute.get(r.id) ?? 0), sort: (r) => revByRoute.get(r.id) ?? 0, align: 'right', td: 'whitespace-nowrap font-semibold tabular-nums' },
    { key: 'times', header: t('network.colTimes'), cell: (r) => (r.departureTimes.length ? r.departureTimes.join(' · ') : '—'), td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
    { key: 'status', header: t('network.colStatus'), cell: (r) => <Badge tone={r.status === 'active' ? 'success' : 'neutral'}>{t(`network.${r.status}`)}</Badge> },
  ];

  const stopCols: Column<ApiStop>[] = [
    { key: 'name', header: t('network.colName'), cell: (s) => <span className="font-medium">{s.name}</span>, sort: (s) => s.name, td: 'whitespace-nowrap' },
    { key: 'type', header: t('network.colType'), cell: (s) => <StatusPill status={s.type === 'station' ? 'active' : 'idle'}>{t(`network.${s.type}`)}</StatusPill>, filter: (s) => s.type },
    { key: 'parent', header: t('network.colParent'), cell: (s) => nameById(s.parentStationId), filter: (s) => nameById(s.parentStationId), td: 'whitespace-nowrap text-muted-foreground' },
    { key: 'phone', header: t('network.colPhone'), cell: (s) => s.phone ?? '—', td: 'whitespace-nowrap text-muted-foreground' },
  ];

  return (
    <Reveal className="space-y-6">
      <AddRouteModal open={addRoute} onClose={() => setAddRoute(false)} />
      <AddStopModal open={addStop} onClose={() => setAddStop(false)} />
      <AddFareModal open={addFare} onClose={() => setAddFare(false)} />
      <UploadFaresModal open={uploadFares} onClose={() => setUploadFares(false)} />
      <RouteTripsModal route={drillRoute} trips={trips} onClose={() => setDrillRoute(null)} />

      {/* KPI cards */}
      <RevealItem className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard label={t('routesMgmt.totalRoutes')} value={routes.length.toLocaleString()} />
        <KpiCard label={t('routesMgmt.activeRoutes')} value={routes.filter((r) => r.status === 'active').length.toLocaleString()} />
        <KpiCard label={t('routesMgmt.stations')} value={stops.filter((s) => s.type === 'station').length.toLocaleString()} />
        <KpiCard label={t('routesMgmt.topRoute')} value={topRoute?.name ?? '—'} />
      </RevealItem>

      {/* Routes */}
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
                search={(r) => `${r.name} ${r.origin} ${r.destination}`}
                searchPlaceholder={t('routesMgmt.searchRoutes')}
                empty={t('network.noRoutes')}
                toolbarRight={<Button size="sm" onClick={() => setAddRoute(true)}><Plus className="size-4" /> {t('network.addRoute')}</Button>}
              />
            )}
          </Async>
        </GlassCard>
      </RevealItem>

      {/* Route schedules — the recurring template each route runs on */}
      <RevealItem><SchedulesTable /></RevealItem>

      {/* Stops & stations */}
      <RevealItem>
        <GlassCard className="overflow-hidden">
          <div className="border-b border-border p-5 pb-3">
            <h3 className="text-base font-semibold">{t('network.tabs.stops')}</h3>
          </div>
          <Async query={stopsQ} skeleton={<TableSkeleton />}>
            {(data) => (
              <DataTable
                rows={data}
                columns={stopCols}
                rowKey={(s) => s.id}
                search={(s) => s.name}
                searchPlaceholder={t('routesMgmt.searchStops')}
                empty={t('network.noStops')}
                toolbarRight={<Button size="sm" onClick={() => setAddStop(true)}><Plus className="size-4" /> {t('network.addStop')}</Button>}
              />
            )}
          </Async>
        </GlassCard>
      </RevealItem>

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
    </Reveal>
  );
}

function TableSkeleton() {
  return <div className="space-y-2 p-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-9 rounded" />)}</div>;
}

const drillTimeFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kigali' });

// Route drill-in: every trip on the route (each direction/time is its own trip), selectable → the trip
// detail. Route history, no live map (the map lives on the individual trip detail).
function RouteTripsModal({ route, trips, onClose }: { route: ApiRoute | null; trips: ApiTrip[]; onClose: () => void }) {
  const { t } = useTranslation();
  const rows = route ? trips.filter((tr) => tr.routeId === route.id).sort((a, b) => b.departureTime.localeCompare(a.departureTime)) : [];
  const revenue = rows.reduce((s, tr) => s + tr.revenue, 0);
  return (
    <Modal
      open={route !== null}
      onClose={onClose}
      title={route ? `${route.origin} → ${route.destination}` : ''}
      description={route ? t('routesMgmt.routeTripsSub', { trips: rows.length, revenue: formatRWF(revenue) }) : ''}
      footer={<Button variant="outline" onClick={onClose}>{t('forms.close')}</Button>}
    >
      {rows.length === 0 ? (
        <div className="grid place-items-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <Bus className="size-7" /> {t('routesMgmt.noTripsForRoute')}
        </div>
      ) : (
        <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {rows.map((tr) => (
            <li key={tr.id}>
              <Link
                to={`/trips/${tr.id}`}
                onClick={onClose}
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-secondary/50"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <span className="tabular-nums">{drillTimeFmt.format(new Date(tr.departureTime))}</span>
                    <span className="text-muted-foreground">{tr.vehiclePlate ?? '—'}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{t(`tripsList.status.${tr.direction === 'return' ? 'return' : 'outbound'}`, tr.direction)} · {tr.booked}/{tr.capacity ?? '—'}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums">{formatRWF(tr.revenue)}</span>
                  <StatusPill status={tr.status}>{t(`tripsList.status.${tr.status}`)}</StatusPill>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Modal>
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
