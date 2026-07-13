import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Radio, Bus, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { GlassCard } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/badge';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { cn } from '@/lib/utils';
import { useLiveBuses } from './useLiveBuses';

// MapLibre is heavy, so the map is code-split; the shimmer shows while its chunk + tiles load.
const RwandaMap = lazy(() => import('./RwandaMap').then((m) => ({ default: m.RwandaMap })));

export function LiveMapPage() {
  const { t } = useTranslation();
  const buses = useLiveBuses();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Reveal className="space-y-6">
      <RevealItem>
        <PageHeader
          title={t('map.title')}
          subtitle={t('map.subtitle')}
          actions={
            <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--teal))]/12 px-3 py-1.5 text-xs font-semibold text-[hsl(var(--teal))]">
              <Radio className="size-3.5 animate-pulse" /> {t('map.live')}
            </span>
          }
        />
      </RevealItem>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RevealItem className="xl:col-span-2">
          <GlassCard className="overflow-hidden p-0">
            <Suspense fallback={<div className="shimmer h-[560px] w-full" />}>
              <RwandaMap
                buses={buses}
                selectedId={selected}
                onSelectBus={setSelected}
                loadingLabel={t('map.loading')}
                className="h-[560px] w-full"
              />
            </Suspense>
          </GlassCard>
        </RevealItem>

        <RevealItem>
          <GlassCard className="flex h-full flex-col p-5">
            <h3 className="text-base font-semibold">{t('map.activeTrips')}</h3>
            <p className="text-sm text-muted-foreground">{t('map.activeTripsSub')}</p>
            <ul className="mt-4 space-y-2">
              {buses.map((b) => {
                const active = b.id === selected;
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(active ? null : b.id)}
                      aria-pressed={active}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                        active
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border/60 hover:border-border hover:bg-secondary/40',
                      )}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[hsl(var(--teal))]/15 text-[hsl(var(--teal))]">
                        <Bus className="size-4" />
                      </span>
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
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ChevronRight className="size-3.5" /> {t('map.focusHint')}
            </p>
          </GlassCard>
        </RevealItem>
      </div>
    </Reveal>
  );
}
