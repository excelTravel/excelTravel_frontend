import { useTranslation } from 'react-i18next';
import { Radio, Bus } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { GlassCard } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Reveal, RevealItem } from '@/components/motion/Motion';

// Live Map is not wired to MapLibre yet — this is an intentional loading state (not a blank placeholder),
// so the screen reads as "streaming in" rather than empty. Swap the canvas for the real map when it lands.

// Faux bus positions on the map canvas (percent offsets) — each renders a pulsing teal marker.
const MARKERS = [
  { top: '28%', left: '32%' },
  { top: '52%', left: '58%' },
  { top: '40%', left: '74%' },
  { top: '68%', left: '40%' },
];

function BusMarker({ top, left }: { top: string; left: string }) {
  return (
    <span className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top, left }}>
      <span className="absolute inset-0 -z-10 rounded-full bg-[hsl(var(--teal))]" style={{ animation: 'ping-soft 2s ease-out infinite' }} />
      <span className="grid size-8 place-items-center rounded-full bg-[hsl(var(--teal))] text-white shadow-lg shadow-[hsl(var(--teal))]/40">
        <Bus className="size-4" />
      </span>
    </span>
  );
}

export function LiveMapPage() {
  const { t } = useTranslation();

  return (
    <Reveal className="space-y-6">
      <RevealItem>
        <PageHeader
          title={t('map.title')}
          subtitle={t('map.preparing')}
          actions={
            <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--teal))]/12 px-3 py-1.5 text-xs font-semibold text-[hsl(var(--teal))]">
              <Radio className="size-3.5 animate-pulse" /> {t('map.connecting')}
            </span>
          }
        />
      </RevealItem>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Map canvas — shimmering ground with faux routes and pulsing bus markers. */}
        <RevealItem className="xl:col-span-2">
          <GlassCard className="relative aspect-[16/11] overflow-hidden p-0 xl:aspect-auto xl:h-[560px]">
            <div className="shimmer absolute inset-0" />
            {/* Faint route grid so the canvas reads as a map, not an empty box. */}
            <svg className="absolute inset-0 h-full w-full opacity-[0.18]" aria-hidden>
              <defs>
                <pattern id="mapgrid" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M48 0H0V48" fill="none" stroke="hsl(var(--navy))" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mapgrid)" />
              <path d="M60 380 C 220 300, 340 240, 520 180 S 780 120, 900 90" fill="none" stroke="hsl(var(--teal))" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 10" opacity="0.5" />
              <path d="M120 120 C 260 200, 380 300, 560 340 S 760 400, 880 460" fill="none" stroke="hsl(var(--navy))" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 10" opacity="0.35" />
            </svg>
            {MARKERS.map((m) => (
              <BusMarker key={`${m.top}-${m.left}`} {...m} />
            ))}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="size-2 animate-pulse rounded-full bg-[hsl(var(--teal))]" />
              {t('map.streaming')}
            </div>
          </GlassCard>
        </RevealItem>

        {/* Active-trips panel — skeleton rows for the buses that will stream in. */}
        <RevealItem>
          <GlassCard className="flex h-full flex-col p-5">
            <h3 className="text-base font-semibold">{t('map.activeTrips')}</h3>
            <p className="text-sm text-muted-foreground">{t('map.activeTripsSub')}</p>
            <div className="mt-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
              ))}
            </div>
          </GlassCard>
        </RevealItem>
      </div>
    </Reveal>
  );
}
