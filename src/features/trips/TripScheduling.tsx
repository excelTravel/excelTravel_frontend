import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Bus, CalendarClock, Clock, Plus, Rocket, TrendingUp, Users, BusFront } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { cn } from '@/lib/utils';
import { DispatchModal, RoutineModal } from './SchedulingModals';
import { ROUTINES, WAITLIST_CORRIDORS, DEMAND_NOW, waitingTotal, fmtCountdown } from './scheduling';

// A bus can be dispatched early once it is within this many seats of full (and pickup stations are boarded).
const EARLY_DISPATCH_SEATS = 5;

interface DispatchTarget { from: string; to: string; pax: number; note?: string }

export function TripScheduling() {
  const { t } = useTranslation();
  const [routineOpen, setRoutineOpen] = useState(false);
  const [dispatch, setDispatch] = useState<DispatchTarget | null>(null);

  return (
    <Reveal className="space-y-6">
      <RoutineModal open={routineOpen} onClose={() => setRoutineOpen(false)} />
      <DispatchModal
        open={dispatch !== null}
        onClose={() => setDispatch(null)}
        from={dispatch?.from ?? ''}
        to={dispatch?.to ?? ''}
        pax={dispatch?.pax ?? 0}
        note={dispatch?.note}
      />

      {/* 1 · Recurring routines */}
      <RevealItem>
        <GlassCard className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <CalendarClock className="size-4" /> {t('sched.routines')}
              </h3>
              <p className="text-sm text-muted-foreground">{t('sched.routinesSub')}</p>
            </div>
            <Button size="sm" onClick={() => setRoutineOpen(true)}>
              <Plus className="size-4" /> {t('sched.newRoutine')}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">{t('sched.colRoute')}</th>
                  <th className="px-5 py-3 font-medium">{t('sched.colFrequency')}</th>
                  <th className="px-5 py-3 font-medium">{t('sched.colTimes')}</th>
                  <th className="px-5 py-3 font-medium">{t('sched.colBus')}</th>
                  <th className="px-5 py-3 font-medium">{t('sched.colStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ROUTINES.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-secondary/40">
                    <td className="whitespace-nowrap px-5 py-3">
                      <span className="flex items-center gap-2 font-medium">{r.from} <ArrowRight className="size-3.5 text-muted-foreground" /> {r.to}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{t(`sched.freq.${r.frequency}`)}</td>
                    <td className="whitespace-nowrap px-5 py-3 tabular-nums">{r.times.join(' · ')}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{r.bus}</td>
                    <td className="px-5 py-3">
                      <Badge tone={r.active ? 'success' : 'neutral'}>{r.active ? t('sched.active') : t('sched.paused')}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </RevealItem>

      {/* 2 · Agent & passenger waitlist → early dispatch */}
      <RevealItem>
        <GlassCard className="flex h-full flex-col p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Users className="size-4" /> {t('sched.waitlist')}
          </h3>
          <p className="text-sm text-muted-foreground">{t('sched.waitlistSub')}</p>
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {WAITLIST_CORRIDORS.map((c) => {
              const total = waitingTotal(c);
              const seatsToFill = Math.max(0, c.capacity - total);
              const eligible = seatsToFill <= EARLY_DISPATCH_SEATS;
              const fill = Math.min(100, Math.round((total / c.capacity) * 100));
              const { h, m } = fmtCountdown(c.minsToDepart);
              const countdown = h > 0 ? t('sched.countdownHm', { h, m }) : t('sched.countdownM', { m });
              return (
                <div key={c.id} className={cn('flex flex-col rounded-xl border p-4', eligible ? 'border-teal/50 bg-teal/5' : 'border-border')}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="flex items-center gap-2 font-semibold">{c.from} <ArrowRight className="size-3.5 text-muted-foreground" /> {c.to}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" /> {t('sched.departsIn', { countdown })} · {c.scheduled}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{total}<span className="text-muted-foreground">/{c.capacity}</span></span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className={cn('h-full rounded-full', eligible ? 'bg-teal' : 'bg-warning')} style={{ width: `${fill}%` }} />
                  </div>

                  {/* per-agent / per-station waiting counts */}
                  <ul className="mt-3 space-y-1.5">
                    {c.segments.map((s) => (
                      <li key={s.agent} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{s.agent} · {s.station}</span>
                        <span className="font-semibold tabular-nums">{t('sched.paxCount', { n: s.pax })}</span>
                      </li>
                    ))}
                  </ul>

                  {/* origin-bus availability check */}
                  <div className={cn('mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs', c.stagedBus ? 'bg-secondary/70' : 'bg-warning/10 text-warning')}>
                    <BusFront className="size-3.5 shrink-0" />
                    {c.stagedBus
                      ? t('sched.busStaged', { plate: c.stagedBus.plate, origin: c.origin })
                      : t('sched.noBusAtOrigin', { origin: c.origin })}
                  </div>

                  <div className="mt-3 flex-1" />
                  {c.stagedBus ? (
                    <Button
                      size="sm"
                      variant={eligible ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setDispatch({
                        from: c.from, to: c.to, pax: total,
                        note: eligible ? t('sched.earlyNote', { seats: seatsToFill, countdown }) : undefined,
                      })}
                    >
                      {eligible ? <Rocket className="size-4" /> : <Bus className="size-4" />}
                      {eligible ? t('sched.dispatchEarly', { plate: c.stagedBus.plate }) : t('sched.dispatchBus')}
                    </Button>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground">
                      {eligible ? t('sched.readyNoBus') : t('sched.waitingMore', { n: seatsToFill })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>
      </RevealItem>

      {/* 4 · Live demand board */}
      <RevealItem>
        <GlassCard className="p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="size-4" /> {t('sched.board')}
          </h3>
          <p className="text-sm text-muted-foreground">{t('sched.boardSub')}</p>
          <div className="mt-4 space-y-3">
            {DEMAND_NOW.map((d) => {
              const spike = d.demand > d.capacity;
              const fill = Math.min(100, Math.round((d.demand / Math.max(d.demand, d.capacity)) * 100));
              const capMark = Math.round((d.capacity / Math.max(d.demand, d.capacity)) * 100);
              return (
                <div key={d.corridor}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{d.corridor}</span>
                    <span className="flex items-center gap-2">
                      {spike && <Badge tone="danger">{t('sched.spike')}</Badge>}
                      <span className="tabular-nums text-muted-foreground">{d.demand} / {d.capacity}</span>
                    </span>
                  </div>
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-secondary">
                    <div className={cn('h-full rounded-full', spike ? 'bg-destructive' : 'bg-teal')} style={{ width: `${fill}%` }} />
                    <span className="absolute top-0 h-full w-0.5 bg-foreground/50" style={{ left: `${capMark}%` }} title={t('sched.capacity')} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </RevealItem>
    </Reveal>
  );
}
