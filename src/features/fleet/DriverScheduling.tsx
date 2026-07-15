import { useTranslation } from 'react-i18next';
import { CalendarRange, AlertTriangle } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DRIVERS, ROSTER, WEEK_DAYS, WEEKLY_CAP, weeklyHours } from './data';

type Load = 'off' | 'ok' | 'high' | 'over';
function loadOf(hours: number): Load {
  if (hours === 0) return 'off';
  if (hours > WEEKLY_CAP) return 'over';
  if (hours >= 36) return 'high';
  return 'ok';
}
const LOAD_COLOR: Record<Load, string> = {
  off: 'bg-muted-foreground/40',
  ok: 'bg-teal',
  high: 'bg-warning',
  over: 'bg-destructive',
};
const LOAD_TEXT: Record<Load, string> = {
  off: 'text-muted-foreground',
  ok: 'text-teal',
  high: 'text-warning',
  over: 'text-destructive',
};

export function DriverScheduling() {
  const { t } = useTranslation();
  const hours = DRIVERS.map((d) => ({ d, h: weeklyHours(d.id) }));
  const working = hours.filter((x) => x.h > 0);
  const avg = working.length ? Math.round(working.reduce((s, x) => s + x.h, 0) / working.length) : 0;
  const overCap = hours.filter((x) => x.h > WEEKLY_CAP).length;
  const offWeek = hours.filter((x) => x.h === 0).length;

  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <CalendarRange className="size-4" /> {t('drivers.rosterTitle')}
          </h3>
          <p className="text-sm text-muted-foreground">{t('drivers.rosterSub')}</p>
        </div>
        {overCap > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
            <AlertTriangle className="size-3.5" /> {t('drivers.overCapAlert', { count: overCap })}
          </span>
        )}
      </div>

      {/* Fairness strip */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label={t('drivers.avgHours')} value={`${avg}h`} />
        <MiniStat label={t('drivers.capLabel')} value={`${WEEKLY_CAP}h`} />
        <MiniStat label={t('drivers.overCap')} value={String(overCap)} danger={overCap > 0} />
        <MiniStat label={t('drivers.offWeek')} value={String(offWeek)} />
      </div>

      {/* Weekly roster grid */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-y-1 text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-2 pb-2 text-left font-medium">{t('drivers.colDriver')}</th>
              {WEEK_DAYS.map((day) => (
                <th key={day} className="px-1 pb-2 text-center font-medium">{t(`analytics.day.${day}`)}</th>
              ))}
              <th className="px-2 pb-2 text-right font-medium">{t('drivers.colTotal')}</th>
            </tr>
          </thead>
          <tbody>
            {DRIVERS.map((d) => {
              const shifts = ROSTER[d.id] ?? [];
              const h = weeklyHours(d.id);
              const load = loadOf(h);
              return (
                <tr key={d.id}>
                  <td className="whitespace-nowrap px-2">
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{d.name.charAt(0)}</span>
                      <span className="font-medium">{d.name}</span>
                    </div>
                  </td>
                  {WEEK_DAYS.map((day, i) => {
                    const s = shifts[i];
                    return (
                      <td key={day} className="px-1">
                        {s ? (
                          <div className="grid h-9 place-items-center rounded-md bg-[hsl(var(--teal))]/15 text-[11px] font-semibold text-[hsl(var(--teal))]">
                            {s.start}–{s.end}
                          </div>
                        ) : (
                          <div className="grid h-9 place-items-center rounded-md border border-dashed border-border text-muted-foreground/50">·</div>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-2">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                        <div className={cn('h-full rounded-full', LOAD_COLOR[load])} style={{ width: `${Math.min(100, (h / WEEKLY_CAP) * 100)}%` }} />
                      </div>
                      <span className={cn('w-10 text-right font-semibold tabular-nums', LOAD_TEXT[load])}>{h}h</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{t('drivers.rosterHint2')}</p>
    </GlassCard>
  );
}

function MiniStat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-3">
      <p className={danger ? 'text-[11px] font-medium text-destructive' : 'text-[11px] font-medium text-muted-foreground'}>{label}</p>
      <p className="mt-0.5 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
