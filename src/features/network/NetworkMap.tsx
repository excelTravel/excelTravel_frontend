import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Radio, Bus, MapPin, X, Users, IdCard, Wrench } from 'lucide-react';
import { Badge, StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLiveBuses } from '@/features/map/useLiveBuses';
import { useStops } from '@/lib/api/hooks';
import { AddStopModal } from './NetworkModals';
import { cn } from '@/lib/utils';

// MapLibre is heavy → code-split; shimmer shows while the chunk + tiles load.
const RwandaMap = lazy(() => import('@/features/map/RwandaMap').then((m) => ({ default: m.RwandaMap })));

// Live Map: the map fills the whole section, with the bus list floating as a scrollable overlay on the
// right rather than sitting in its own column — selecting a bus there filters the map down to just that
// one (select again, or the list's own item, to clear back to the full fleet).
export function NetworkMap() {
  const { t } = useTranslation();
  const buses = useLiveBuses();
  const stopsQ = useStops();
  const stations = (stopsQ.data ?? []).filter((s) => s.type === 'station').map((s) => ({ id: s.id, name: s.name, lng: s.longitude, lat: s.latitude }));
  const [selected, setSelected] = useState<string | null>(null);
  const [pinMode, setPinMode] = useState(false);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [stopOpen, setStopOpen] = useState(false);

  function handlePick(lng: number, lat: number) {
    setPin({ lng, lat });
    setPinMode(false);
    setStopOpen(true);
  }

  const visibleBuses = selected ? buses.filter((b) => b.id === selected) : buses;

  return (
    <div className="relative h-[85dvh] min-h-[560px] w-full overflow-hidden rounded-2xl border border-border">
      <AddStopModal open={stopOpen} onClose={() => setStopOpen(false)} pin={pin} />

      <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-card/90 px-3 py-1.5 text-xs font-semibold text-teal shadow-sm backdrop-blur">
          <Radio className="size-3.5 animate-pulse" /> {t('map.live')}
        </span>
        <Button size="sm" variant={pinMode ? 'default' : 'outline'} className="shadow-sm" onClick={() => setPinMode((v) => !v)}>
          {pinMode ? <X className="size-4" /> : <MapPin className="size-4" />}
          {pinMode ? t('network.pinCancel') : t('network.addStopPin')}
        </Button>
      </div>
      {pinMode && (
        <p className="absolute left-3 top-14 z-10 flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 text-xs text-teal shadow-sm backdrop-blur">
          <MapPin className="size-3.5" /> {t('network.pinPrompt')}
        </p>
      )}

      <Suspense fallback={<div className="shimmer size-full" />}>
        <RwandaMap
          buses={visibleBuses}
          selectedId={selected}
          onSelectBus={setSelected}
          stops={stations}
          pinMode={pinMode}
          onPick={handlePick}
          loadingLabel={t('map.loading')}
          className="size-full"
        />
      </Suspense>

      {/* Bus list — floats over the map on the right, scrolls within itself. Selecting a bus filters the
          map to just that one; selecting the same bus again (or nothing matches) clears back to all. */}
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
  );
}
