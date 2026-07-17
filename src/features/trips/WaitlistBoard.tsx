import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Bus, Clock, Rocket, Users, BusFront } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DispatchModal } from './SchedulingModals';
import { WAITLIST_CORRIDORS, waitingTotal, fmtCountdown } from './scheduling';

// A bus can be dispatched early once it is within this many seats of full (and pickup stations are boarded).
const EARLY_DISPATCH_SEATS = 5;

interface DispatchTarget { from: string; to: string; pax: number; note?: string }

// Agent + passenger waitlist per corridor: per-station waiting counts, a departure countdown, an
// origin-bus availability check, and early-dispatch once nearly full. Stubbed until the waitlist API lands.
export function WaitlistBoard() {
  const { t } = useTranslation();
  const [dispatch, setDispatch] = useState<DispatchTarget | null>(null);

  return (
    <GlassCard className="flex h-full flex-col p-6">
      <DispatchModal
        open={dispatch !== null}
        onClose={() => setDispatch(null)}
        from={dispatch?.from ?? ''}
        to={dispatch?.to ?? ''}
        pax={dispatch?.pax ?? 0}
        note={dispatch?.note}
      />
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
  );
}
