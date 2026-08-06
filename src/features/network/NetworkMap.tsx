import { lazy, Suspense, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Radio, Bus, MapPin, MapPinPlus, X, Users, IdCard, Wrench } from 'lucide-react';
import { Badge, StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLiveBuses } from '@/features/map/useLiveBuses';
import { useStops, useRoute, useZones, type ApiAdminZone } from '@/lib/api/hooks';
import { AddStationModal, AddStopModal } from './NetworkModals';
import { StopsSection } from './StopsSection';
import { ZonesSection } from '@/features/zones/ZonesSection';
import { cn } from '@/lib/utils';

type PinKind = 'station' | 'stop';

// MapLibre is heavy → code-split; shimmer shows while the chunk + tiles load.
const RwandaMap = lazy(() => import('@/features/map/RwandaMap').then((m) => ({ default: m.RwandaMap })));

// Live Map: a toolbar (Live status + Add stop) sits above the map itself — not floating over the
// canvas, where it used to collide with MapLibre's own zoom control in the same corner. The bus list
// still floats over the map on the right (selecting a bus there filters the map down to just that
// one). The Zones list underneath draws a zone's polygon on this same map when clicked, rather than
// opening a separate map.
export function NetworkMap() {
  const { t } = useTranslation();
  const buses = useLiveBuses();
  const stopsQ = useStops();
  const allStops = useMemo(() => stopsQ.data ?? [], [stopsQ.data]);
  const stations = allStops.filter((s) => s.type === 'station').map((s) => ({ id: s.id, name: s.name, lng: s.longitude, lat: s.latitude }));
  const [selected, setSelected] = useState<string | null>(null);
  const [pinMode, setPinMode] = useState<PinKind | null>(null);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [stationOpen, setStationOpen] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ApiAdminZone | null>(null);

  function startPin(kind: PinKind) {
    setPinMode((v) => (v === kind ? null : kind));
  }

  function handlePick(lng: number, lat: number) {
    setPin({ lng, lat });
    if (pinMode === 'station') setStationOpen(true);
    else if (pinMode === 'stop') setStopOpen(true);
    setPinMode(null);
  }

  const visibleBuses = selected ? buses.filter((b) => b.id === selected) : buses;
  const selectedBus = buses.find((b) => b.id === selected) ?? null;

  // The selected bus's real path: its route's stops, in order, resolved to actual coordinates — not
  // the decorative hub-to-hub corridor lines, so "where it's from / where it's heading" is exact.
  const selectedRouteQ = useRoute(selectedBus?.routeId ?? undefined);
  const stopById = useMemo(() => new Map(allStops.map((s) => [s.id, s])), [allStops]);
  const selectedRoute = useMemo(() => {
    const routeStops = selectedRouteQ.data?.stops;
    if (!selectedBus || !routeStops || routeStops.length < 2) return null;
    const coords = [...routeStops]
      .sort((a, b) => a.stopOrder - b.stopOrder)
      .map((rs) => stopById.get(rs.stopId))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s): [number, number] => [s.longitude, s.latitude]);
    if (coords.length < 2) return null;
    return { coords, fromName: selectedBus.from, toName: selectedBus.to };
  }, [selectedBus, selectedRouteQ.data, stopById]);

  // The picked zone's boundary — fetched alongside its siblings (same level + parent), which the
  // Zones list already knows without a boundary, so this only asks the backend for geometry once a
  // zone is actually clicked, never for the whole tree.
  const zoneBoundaryQ = useZones({
    level: selectedZone?.level,
    parentZoneId: selectedZone?.parentZoneId ?? undefined,
    withBoundary: true,
    enabled: Boolean(selectedZone),
  });
  const selectedZoneBoundary = useMemo(() => {
    if (!selectedZone) return null;
    const boundary = zoneBoundaryQ.data?.find((z) => z.id === selectedZone.id)?.boundary;
    return boundary ? { boundary, name: selectedZone.name } : null;
  }, [selectedZone, zoneBoundaryQ.data]);

  function handleSelectZone(zone: ApiAdminZone) {
    setSelectedZone((prev) => (prev?.id === zone.id ? null : zone));
  }

  return (
    <div className="space-y-6">
      <AddStationModal open={stationOpen} onClose={() => setStationOpen(false)} pin={pin} />
      <AddStopModal open={stopOpen} onClose={() => setStopOpen(false)} pin={pin} />

      {/* Toolbar above the map — not overlaid on it. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-teal shadow-sm">
          <Radio className="size-3.5 animate-pulse" /> {t('map.live')}
        </span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={pinMode === 'station' ? 'default' : 'outline'} className="shadow-sm" onClick={() => startPin('station')}>
            {pinMode === 'station' ? <X className="size-4" /> : <MapPinPlus className="size-4" />}
            {pinMode === 'station' ? t('network.pinCancel') : t('network.addStationPin')}
          </Button>
          <Button size="sm" variant={pinMode === 'stop' ? 'default' : 'outline'} className="shadow-sm" onClick={() => startPin('stop')}>
            {pinMode === 'stop' ? <X className="size-4" /> : <MapPin className="size-4" />}
            {pinMode === 'stop' ? t('network.pinCancel') : t('network.addStopPin')}
          </Button>
        </div>
      </div>

      <div className="relative h-[75dvh] min-h-[480px] w-full overflow-hidden rounded-2xl border border-border">
        {pinMode && (
          <p className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 text-xs text-teal shadow-sm backdrop-blur">
            <MapPin className="size-3.5" /> {t('network.pinPrompt')}
          </p>
        )}

        <Suspense fallback={<div className="shimmer size-full" />}>
          <RwandaMap
            buses={visibleBuses}
            selectedId={selected}
            onSelectBus={setSelected}
            stops={stations}
            pinMode={pinMode !== null}
            onPick={handlePick}
            loadingLabel={t('map.loading')}
            className="size-full"
            selectedRoute={selectedRoute}
            selectedZone={selectedZoneBoundary}
          />
        </Suspense>

        {/* Bus list — floats over the map on the right, scrolls within itself. Selecting a bus filters
            the map down to just that one; selecting the same bus again (or nothing matches) clears
            back to all. */}
        <div className="absolute bottom-3 right-3 top-3 z-10 flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card/95 shadow-xl backdrop-blur">
          <div className="border-b border-border p-4 pb-3">
            <h3 className="flex items-center gap-2 text-base font-semibold"><Radio className="size-4 text-teal" /> {t('map.busesOnMap')}</h3>
            <p className="text-sm text-muted-foreground">{selected ? t('map.showingOne') : t('map.busesSub')}</p>
          </div>
          <ul className="flex-1 space-y-2 overflow-y-auto p-3">
            {buses.map((b) => {
              const active = b.id === selected;
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(active ? null : b.id)}
                    aria-pressed={active}
                    className={cn('w-full rounded-xl border p-3 text-left transition-colors', active ? 'border-primary/40 bg-primary/5' : 'border-border/60 hover:border-border hover:bg-secondary/40')}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-teal/15 text-teal"><Bus className="size-4" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{b.code}</p>
                          {b.eta && <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">{b.eta}</span>}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{b.driverName ?? t('map.noDriver')}</p>
                      </div>
                      <StatusPill status={b.status}>{t(`map.status.${b.status}`)}</StatusPill>
                    </div>
                    <p className="mt-2 truncate text-xs text-muted-foreground">{b.routeName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {t('map.passengersOnBoard', { n: b.passengers, capacity: b.capacity ?? '—' })}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone={b.maintenance.tone}><Wrench className="size-3" /> {b.maintenance.label}</Badge>
                      <Badge tone={b.license.tone}><IdCard className="size-3" /> {b.license.label}</Badge>
                    </div>
                  </button>
                </li>
              );
            })}
            {buses.length === 0 && (
              <li className="grid place-items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                <Bus className="size-7" /> {t('map.noBuses')}
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Stops & stations on the left, administrative geography on the right — both are location
          reference data that belongs on the map, not inside route config. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StopsSection />
        <ZonesSection onSelectZone={handleSelectZone} selectedId={selectedZone?.id ?? null} />
      </div>
    </div>
  );
}
