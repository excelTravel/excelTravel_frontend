import { useTranslation } from 'react-i18next';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { AlertTriangle, ArrowUpRight, Bus } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Async } from '@/components/ui/async';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { MapPreview } from '@/features/map/MapPreview';
import { formatRWF } from '@/lib/utils';
import { useOverview, useNotifications, type ApiNotification } from '@/lib/api/hooks';
import { useDateRange, rangeToQuery } from '@/store/dateRange';

const K = (n: number): string => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${Math.round(n / 1_000)}K` : String(n));

function alertTone(trigger: string): 'info' | 'warning' | 'danger' {
  if (trigger === 'cancellation') return 'danger';
  if (trigger === 'delay') return 'warning';
  return 'info';
}
function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

export function OverviewPage() {
  const { t } = useTranslation();
  const { preset, range, label } = useDateRange();
  const overviewQ = useOverview(rangeToQuery(range));
  const notificationsQ = useNotifications();
  const o = overviewQ.data;
  // dailyRevenue/ticketsToday follow the picker's range (default: today); revenueMtd/busesActive don't
  // (fixed month-to-date / live-now concepts) — so only the former get the active-range subtext.
  const rangeSub = preset !== 'all' && preset !== 'today' ? label : undefined;

  return (
    <Reveal className="space-y-6">
      {/* KPI row — live from GET /analytics/overview */}
      <RevealItem className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard hero loading={overviewQ.isLoading} label={t('overview.dailyRevenue')} value={o ? K(o.dailyRevenue) : '—'} unit="RWF" sub={rangeSub} />
        <KpiCard loading={overviewQ.isLoading} label={t('overview.revenueMtd')} value={o ? K(o.revenueMtd) : '—'} unit="RWF" />
        <KpiCard loading={overviewQ.isLoading} label={t('overview.ticketsToday')} value={o ? String(o.ticketsToday) : '—'} sub={rangeSub} />
        <KpiCard loading={overviewQ.isLoading} label={t('overview.busesActive')} value={o ? String(o.busesActive) : '—'} />
      </RevealItem>

      {/* Top routes by revenue + live map */}
      <RevealItem className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <GlassCard className="p-6 xl:col-span-2">
          <div>
            <h3 className="text-base font-semibold">{t('overview.topRoutes')}</h3>
            <p className="text-sm text-muted-foreground">{t('overview.revenueMtd')}</p>
          </div>
          <div className="mt-6 h-64">
            <Async query={overviewQ} isEmpty={(d) => d.topRoutes.length === 0} skeleton={<div className="shimmer h-full rounded-xl" />}>
              {(data) => {
                const bars = data.topRoutes.map((r) => ({ label: `${r.origin} → ${r.destination}`, value: r.revenue }));
                const max = Math.max(...bars.map((b) => b.value), 0);
                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bars} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} interval={0} />
                      <Tooltip
                        cursor={{ fill: '#64748B', opacity: 0.12 }}
                        contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--popover-foreground))', fontSize: 12 }}
                        formatter={(v: number) => [formatRWF(v), '']}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {bars.map((d) => (
                          <Cell key={d.label} fill={d.value === max ? '#14B8A6' : 'rgba(20,184,166,0.28)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              }}
            </Async>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-base font-semibold">{t('overview.activeRoutesMap')}</h3>
          <p className="text-sm text-muted-foreground">{t('overview.liveDispatch')}</p>
          <MapPreview className="mt-4 h-64 rounded-xl border border-border" />
        </GlassCard>
      </RevealItem>

      {/* Bottom row — top routes detail, booking sources, alerts (all live) */}
      <RevealItem className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="p-6">
          <h3 className="text-base font-semibold">{t('overview.topRoutes')}</h3>
          <Async query={overviewQ} isEmpty={(d) => d.topRoutes.length === 0} skeleton={<div className="shimmer mt-4 h-40 rounded-xl" />}>
            {(data) => (
              <ul className="mt-4 space-y-4">
                {data.topRoutes.map((r) => (
                  <li key={r.routeId} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                        <Bus className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{r.origin} → {r.destination}</p>
                        <p className="text-xs text-muted-foreground">{t('overview.passengers', { count: r.bookings })}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{formatRWF(r.revenue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Async>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-base font-semibold">{t('overview.bookingSource')}</h3>
          <Async query={overviewQ} isEmpty={(d) => d.sourceSplit.length === 0} skeleton={<div className="shimmer mt-4 h-40 rounded-xl" />}>
            {(data) => {
              const total = data.sourceSplit.reduce((s, b) => s + b.count, 0) || 1;
              return (
                <ul className="mt-4 space-y-4">
                  {data.sourceSplit.map((b) => {
                    const pct = Math.round((b.count / total) * 100);
                    return (
                      <li key={b.source}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium capitalize">{b.source.replace('_', ' ')}</span>
                          <span className="tabular-nums text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              );
            }}
          </Async>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">{t('overview.recentAlerts')}</h3>
            <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden />
          </div>
          <Async query={notificationsQ} isEmpty={(d) => d.length === 0} skeleton={<div className="shimmer mt-4 h-40 rounded-xl" />}>
            {(data: ApiNotification[]) => (
              <ul className="mt-4 space-y-3">
                {data.slice(0, 5).map((a) => {
                  const tone = alertTone(a.triggerType);
                  return (
                    <li key={a.id} className="flex gap-3">
                      <span className={tone === 'danger' ? 'mt-0.5 text-destructive' : tone === 'warning' ? 'mt-0.5 text-warning' : 'mt-0.5 text-primary'}>
                        <AlertTriangle className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm leading-snug">{a.message ?? a.triggerType}</p>
                        <p className="text-xs text-muted-foreground">{ago(a.createdAt)} ago</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Async>
        </GlassCard>
      </RevealItem>
    </Reveal>
  );
}
