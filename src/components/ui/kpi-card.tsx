import { useTranslation } from 'react-i18next';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge, type BadgeProps } from './badge';

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
  badge?: { text: string; tone: BadgeProps['tone'] };
  hero?: boolean; // dark navy emphasized card
  tone?: 'default' | 'danger'; // red-tinted card (e.g. maintenance alerts)
  loading?: boolean;
}

export function KpiCard({ label, value, unit, delta, badge, hero, tone = 'default', loading }: KpiCardProps) {
  const { t } = useTranslation();

  const surface = hero
    ? 'bg-gradient-to-br from-[hsl(var(--navy))] to-[hsl(223_55%_26%)] text-white'
    : tone === 'danger'
      ? 'border border-destructive/30 bg-destructive/5'
      : 'glass';

  if (loading) {
    return (
      <div className={cn('rounded-2xl p-5 shadow-sm', hero ? 'bg-[hsl(var(--navy))]' : 'glass')}>
        <div className={cn('h-4 w-24 animate-pulse rounded', hero ? 'bg-white/20' : 'bg-muted')} />
        <div className={cn('mt-3 h-8 w-32 animate-pulse rounded', hero ? 'bg-white/20' : 'bg-muted')} />
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl p-5 shadow-sm', surface)}>
      <p
        className={cn(
          'text-sm font-medium',
          hero ? 'text-white/70' : tone === 'danger' ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        {label}
      </p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-3xl font-bold tabular-nums tracking-tight">{value}</span>
        {unit && <span className={cn('text-sm', hero ? 'text-white/60' : 'text-muted-foreground')}>{unit}</span>}
        {badge && <Badge tone={badge.tone}>{badge.text}</Badge>}
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
