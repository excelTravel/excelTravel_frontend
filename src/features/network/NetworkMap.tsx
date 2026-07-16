import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Radio, Bus, Clock, MapPin, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/ui/badge';
import { useLiveBuses } from '@/features/map/useLiveBuses';
import { TRIPS } from '@/features/trips/trips';
import { AddStopModal } from './NetworkModals';
import { STATIONS } from './network';
import { cn } from '@/lib/utils';

// MapLibre is heavy → code-split; shimmer shows while the chunk + tiles load.
const RwandaMap = lazy(() => import('@/features/map/RwandaMap').then((m) => ({ default: m.RwandaMap })));

// Live Map folded into Network: shows route corridors + live buses, lets you drop a stop by pinning the map,
// and lists live + scheduled trips alongside. Live positions are the useLiveBuses stub (swaps to the socket).
export function NetworkMap() {
  const { t } = useTranslation();
  const buses = useLiveBuses();
  const [selected, setSelected] = useState<string | null>(null);
  const [pinMode, setPinMode] = useState(false);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [stopOpen, setStopOpen] = useState(false);
  const scheduled = TRIPS.filter((tr) => tr.group === 'scheduled');

  function handlePick(lng: number, lat: number) {
    setPin({ lng, lat });
    setPinMode(false);
    setStopOpen(true);
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <AddStopModal open={stopOpen} onClose={() => setStopOpen(false)} pin={pin} />

      <div className="xl:col-span-2">
        <GlassCard className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-teal/12 px-3 py-1.5 text-xs font-semibold text-teal">
              <Radio className="size-3.5 animate-pulse" /> {t('map.live')}
            </span>
            <Button size="sm" variant={pinMode ? 'default' : 'outline'} onClick={() => setPinMode((v) => !v)}>
              {pinMode ? <X className="size-4" /> : <MapPin className="size-4" />}
              {pinMode ? t('network.pinCancel') : t('network.addStopPin')}
            </Button>
          </div>
          {pinMode && (
            <p className="flex items-center gap-1.5 bg-teal/5 px-4 py-2 text-xs text-teal">
              <MapPin className="size-3.5" /> {t('network.pinPrompt')}
            </p>
          )}
          <Suspense fallback={<div className="shimmer h-[520px] w-full" />}>
            <RwandaMap
              buses={buses}
              selectedId={selected}
              onSelectBus={setSelected}
              stops={STATIONS}
              pinMode={pinMode}
              onPick={handlePick}
              loadingLabel={t('map.loading')}
              className="h-[520px] w-full"
            />
          </Suspense>
        </GlassCard>
      </div>

      <GlassCard className="flex h-full flex-col p-5">
        {/* Live trips */}
        <h3 className="flex items-center gap-2 text-base font-semibold"><Radio className="size-4 text-teal" /> {t('map.activeTrips')}</h3>
        <ul className="mt-3 space-y-2">
          {buses.map((b) => {
            const active = b.id === selected;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => setSelected(active ? null : b.id)}
                  aria-pressed={active}
                  className={cn('flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors', active ? 'border-primary/40 bg-primary/5' : 'border-border/60 hover:border-border hover:bg-secondary/40')}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-teal/15 text-teal"><Bus className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{b.code}</p>
                      <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">{b.eta}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{b.routeName}</p>
                  </div>
                  <StatusPill status={b.status}>{t(`map.status.${b.status}`)}</StatusPill>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Scheduled trips */}
        <h4 className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Clock className="size-3.5" /> {t('network.scheduledBuses')}
        </h4>
        <ul className="mt-2 space-y-1.5">
          {scheduled.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm">
              <span className="truncate">{s.from} → {s.to}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{s.bus} · {s.departs}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
