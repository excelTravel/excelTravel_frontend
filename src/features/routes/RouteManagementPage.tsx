import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ArrowRight, Info, Coins, Upload, FileText } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Badge, StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Async } from '@/components/ui/async';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { useRoutes, useStops, useTrips, type ApiRoute, type ApiStop } from '@/lib/api/hooks';
import { AddRouteModal, AddStopModal, AddFareModal } from '@/features/network/NetworkModals';
import { RouteFares } from '@/features/network/RouteFares';

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

  const routes = routesQ.data ?? [];
  const stops = stopsQ.data ?? [];
  const trips = tripsQ.data ?? [];

  // Top route by combined trip revenue (falls back to trip count while bookings/revenue aren't populated).
  const revByRoute = new Map<string, number>();
  const cntByRoute = new Map<string, number>();
  for (const tr of trips) {
    cntByRoute.set(tr.routeId, (cntByRoute.get(tr.routeId) ?? 0) + 1);
  }
  const topRouteId = [...cntByRoute.entries()].sort((a, b) => (revByRoute.get(b[0]) ?? 0) - (revByRoute.get(a[0]) ?? 0) || b[1] - a[1])[0]?.[0];
  const topRoute = routes.find((r) => r.id === topRouteId);

  const nameById = (id: string | null) => (id ? stops.find((s) => s.id === id)?.name ?? '—' : '—');
  const fmtDuration = (min: number | null) => (min == null ? '—' : `${Math.floor(min / 60)}h ${min % 60}m`);

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
    { key: 'duration', header: t('network.colDuration'), cell: (r) => fmtDuration(r.estimatedDurationMin), sort: (r) => r.estimatedDurationMin ?? 0, td: 'whitespace-nowrap tabular-nums' },
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
                search={(r) => `${r.name} ${r.origin} ${r.destination}`}
                searchPlaceholder={t('routesMgmt.searchRoutes')}
                empty={t('network.noRoutes')}
                toolbarRight={<Button size="sm" onClick={() => setAddRoute(true)}><Plus className="size-4" /> {t('network.addRoute')}</Button>}
              />
            )}
          </Async>
        </GlassCard>
      </RevealItem>

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

// Upload the RURA fares PDF → server parses the from/to/fare rows and upserts routes + the national fare
// matrix, stamping created/updated timestamps. Backend endpoint pending (see docs/integration-map.md) —
// this is the affordance + flow; the parse/import runs server-side once that endpoint lands.
function UploadFaresModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('routesMgmt.uploadFaresTitle')}
      description={t('routesMgmt.uploadFaresSub')}
      footer={<><Button variant="outline" onClick={onClose}>{t('forms.close')}</Button><Button disabled>{t('routesMgmt.importRows')}</Button></>}
    >
      <div className="space-y-4">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:bg-secondary/40">
          <Upload className="size-7 text-muted-foreground" />
          <span className="text-sm font-medium">{file ? file.name : t('routesMgmt.dropPdf')}</span>
          <span className="text-xs text-muted-foreground">{t('routesMgmt.pdfHint')}</span>
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        {file && (
          <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3 text-sm"><FileText className="size-4 text-primary" /> {file.name}</div>
        )}
        <p className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-xs text-warning">
          <Info className="mt-0.5 size-3.5 shrink-0" /> {t('routesMgmt.uploadPending')}
        </p>
      </div>
    </Modal>
  );
}
