import { useTranslation } from 'react-i18next';
import { AlertTriangle, Wrench, Gauge, CalendarDays, MoreVertical } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/badge';
import { CountUp } from '@/components/ui/count-up';
import { MotionCard, Reveal, RevealItem } from '@/components/motion/Motion';
import { formatRWF } from '@/lib/utils';
import { JOBS, type Job } from './data';

const ACCENT: Record<Job['urgency'], string> = {
  overdue: 'hsl(var(--destructive))',
  due_soon: 'hsl(var(--warning))',
  logged: 'hsl(var(--muted-foreground))',
};

export function MaintenancePanel() {
  const { t } = useTranslation();
  const overdue = JOBS.filter((j) => j.urgency === 'overdue').length;
  const dueSoon = JOBS.filter((j) => j.urgency === 'due_soon').length;
  const logged = JOBS.filter((j) => j.urgency === 'logged').length;
  const monthCost = JOBS.reduce((s, j) => s + j.cost, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MiniStat label={t('maintenance.overdue')} value={overdue} danger />
        <MiniStat label={t('maintenance.dueSoon')} value={dueSoon} />
        <MiniStat label={t('maintenance.logged')} value={logged} />
        <MiniStat label={t('maintenance.monthCost')} value={monthCost} money />
      </div>

      {overdue > 0 && (
        <GlassCard className="flex items-start gap-3 border-l-4 border-l-destructive p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">{t('maintenance.alertTitle', { count: overdue })}</p>
            <p className="text-sm text-muted-foreground">{t('maintenance.alertSub')}</p>
          </div>
        </GlassCard>
      )}

      <Reveal className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {JOBS.map((j) => (
          <RevealItem key={j.id}>
            <MotionCard className="flex overflow-hidden p-0">
              <div className="w-1 shrink-0" style={{ background: ACCENT[j.urgency] }} aria-hidden />
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-secondary text-muted-foreground">
                      <Wrench className="size-4" />
                    </span>
                    <div>
                      <p className="font-semibold leading-tight">{j.serviceType}</p>
                      <p className="text-xs text-muted-foreground">{j.id} · {j.vehicle}</p>
                    </div>
                  </div>
                  <StatusPill status={j.urgency}>{t(`maintenance.urgency.${j.urgency}`)}</StatusPill>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" /> {j.when}</span>
                  <span className="inline-flex items-center gap-1.5 tabular-nums"><Gauge className="size-3.5" /> {j.odometerKm.toLocaleString()} km</span>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-base font-bold tabular-nums">{formatRWF(j.cost)}</span>
                  <button type="button" aria-label={t('maintenance.actions')} className="text-muted-foreground hover:text-foreground">
                    <MoreVertical className="size-4" />
                  </button>
                </div>
              </div>
            </MotionCard>
          </RevealItem>
        ))}
      </Reveal>
    </div>
  );
}

function MiniStat({ label, value, danger, money }: { label: string; value: number; danger?: boolean; money?: boolean }) {
  return (
    <GlassCard className="p-4">
      <p className={danger ? 'text-sm font-medium text-destructive' : 'text-sm font-medium text-muted-foreground'}>{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">
        {money ? <CountUp value={value} format={(n) => formatRWF(Math.round(n))} /> : <CountUp value={value} />}
      </p>
    </GlassCard>
  );
}
