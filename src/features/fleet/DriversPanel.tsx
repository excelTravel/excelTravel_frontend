import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Star, Bus, Phone, CalendarClock } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MotionCard, Reveal, RevealItem } from '@/components/motion/Motion';
import { DRIVERS } from './data';

const DAY_START = 5;
const DAY_END = 23;
const SPAN = DAY_END - DAY_START;
const TICKS = [6, 9, 12, 15, 18, 21];
const clampPct = (hour: number) => Math.max(0, Math.min(100, ((hour - DAY_START) / SPAN) * 100));

export function DriversPanel() {
  const { t } = useTranslation();
  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const nowPct = clampPct(nowHour);
  const nowVisible = nowHour >= DAY_START && nowHour <= DAY_END;

  return (
    <div className="space-y-6">
      {/* Trip schedule board (derived from assigned trips) */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <CalendarClock className="size-4" /> {t('drivers.schedule')}
          </h3>
          <p className="text-xs text-muted-foreground">{t('drivers.scheduleHint')}</p>
        </div>

        <div className="mt-5 flex pl-44">
          {TICKS.map((h) => (
            <div key={h} className="flex-1 text-[10px] tabular-nums text-muted-foreground">{h}:00</div>
          ))}
        </div>

        <div className="relative mt-1 space-y-2">
          {nowVisible && (
            <div className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-destructive/70" style={{ left: `calc(11.75rem + (100% - 11.75rem) * ${(nowPct / 100).toFixed(4)})` }}>
              <span className="absolute -top-1 -translate-x-1/2 rounded-full bg-destructive px-1 py-0.5 text-[8px] font-bold text-white">
                {t('drivers.now')}
              </span>
            </div>
          )}
          {DRIVERS.map((d) => (
            <div key={d.id} className="flex items-center gap-3">
              <div className="flex w-44 shrink-0 items-center gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {d.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-tight">{d.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{d.vehicle ?? t('drivers.noVehicle')}</p>
                </div>
              </div>
              <div className="relative h-8 flex-1 rounded-lg bg-secondary/60">
                {d.trips.length === 0 ? (
                  <span className="absolute inset-0 grid place-items-center text-[11px] text-muted-foreground">{t('drivers.noTrips')}</span>
                ) : (
                  d.trips.map((trip) => (
                    <motion.div
                      key={trip.code}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      style={{ left: `${clampPct(trip.start)}%`, width: `${clampPct(trip.end) - clampPct(trip.start)}%`, transformOrigin: 'left' }}
                      className="absolute inset-y-1 grid place-items-center overflow-hidden rounded-md bg-[hsl(var(--teal))]/85 px-2 text-[11px] font-semibold text-white"
                      title={`${trip.code} · ${trip.from}→${trip.to} · ${trip.start}:00–${trip.end}:00`}
                    >
                      {trip.from}→{trip.to}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Driver cards */}
      <Reveal className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {DRIVERS.map((d) => (
          <RevealItem key={d.id}>
            <MotionCard className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {d.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-semibold leading-tight">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.license}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
                  <Star className="size-3 fill-warning text-warning" /> {d.rating.toFixed(2)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={d.status}>{t(`drivers.state.${d.status}`)}</StatusPill>
                {d.vehicle && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                    <Bus className="size-3.5 text-muted-foreground" /> {d.vehicle}
                  </span>
                )}
              </div>

              <div className="min-h-[1.75rem]">
                {d.trips.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {d.trips.map((trip) => (
                      <span key={trip.code} className="rounded-md bg-[hsl(var(--teal))]/12 px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--teal))]">
                        {trip.from}→{trip.to} · {trip.start}:00
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{t('drivers.noTrips')}</p>
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-border pt-3">
                <Button variant="outline" size="sm" className="flex-1">{t('drivers.assign')}</Button>
                <Button variant="outline" size="icon" aria-label={t('drivers.call')}>
                  <Phone className="size-4" />
                </Button>
              </div>
            </MotionCard>
          </RevealItem>
        ))}
      </Reveal>
    </div>
  );
}
