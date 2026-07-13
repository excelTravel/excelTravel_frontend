import { useTranslation } from 'react-i18next';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KpiDelta {
  value: string; // e.g. "+12.5%"
  direction: 'up' | 'down';
  comparison?: string; // range-aware, e.g. "vs previous 30 days"
}

export interface KpiCardProps {
  label: string;
  value: string;
  unit?: string;
  delta?: KpiDelta;
  hero?: boolean; // the dark navy emphasized card (anchors the KPI row)
  loading?: boolean;
}

// KPI stat card. `hero` renders the emphasized navy gradient card; others are glass. The delta reads
// "+X% increase / -X% decrease" and shows the range-aware comparison period.
export function KpiCard({ label, value, unit, delta, hero, loading }: KpiCardProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className={cn('rounded-2xl p-5 shadow-sm', hero ? 'bg-[hsl(var(--navy))]' : 'glass')}>
        <div className={cn('h-4 w-24 animate-pulse rounded', hero ? 'bg-white/20' : 'bg-muted')} />
        <div className={cn('mt-3 h-8 w-32 animate-pulse rounded', hero ? 'bg-white/20' : 'bg-muted')} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl p-5 shadow-sm',
        hero ? 'bg-gradient-to-br from-[hsl(var(--navy))] to-[hsl(223_55%_26%)] text-white' : 'glass',
      )}
    >
      <p className={cn('text-sm font-medium', hero ? 'text-white/70' : 'text-muted-foreground')}>{label}</p>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tabular-nums tracking-tight">{value}</span>
        {unit && <span className={cn('text-sm', hero ? 'text-white/60' : 'text-muted-foreground')}>{unit}</span>}
      </div>
      {delta && (
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              hero
                ? 'bg-white/15 text-white'
                : delta.direction === 'up'
                  ? 'bg-success/15 text-success'
                  : 'bg-destructive/15 text-destructive',
            )}
          >
            {delta.direction === 'up' ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {delta.value} {t(delta.direction === 'up' ? 'common.increase' : 'common.decrease')}
          </span>
          {delta.comparison && (
            <span className={cn('text-xs', hero ? 'text-white/60' : 'text-muted-foreground')}>{delta.comparison}</span>
          )}
        </div>
      )}
    </div>
  );
}
