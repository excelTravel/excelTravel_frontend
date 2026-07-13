import { useTranslation } from 'react-i18next';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { AlertTriangle, ArrowUpRight, Bus, MapPin, TrendingUp } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Badge } from '@/components/ui/badge';
import { formatRWF } from '@/lib/utils';

// NOTE: values are placeholders annotated with the backend endpoint each will read from. When wired, the
// hooks take the global date range (useDateRange → rangeToSince) so ALL cards/charts re-scope to it, and
// each KPI delta is computed as this-period vs previous-period from real data (not hardcoded).

const passengerVolume = [
  { day: 'Mon', value: 620 },
  { day: 'Tue', value: 700 },
  { day: 'Wed', value: 660 },
  { day: 'Thu', value: 940 },
  { day: 'Fri', value: 880 },
  { day: 'Sat', value: 410 },
  { day: 'Sun', value: 560 },
];

const topRoutes = [
  { route: 'Nyabugogo → Huye', passengers: 1240, revenue: 5580000 },
  { route: 'Remera → Nyagatare', passengers: 980, revenue: 5880000 },
  { route: 'Nyabugogo → Musanze', passengers: 870, revenue: 2610000 },
];

const bookingSources = [
  { source: 'Agent (cash)', pct: 58 },
  { source: 'Mobile money', pct: 34 },
  { source: 'Online', pct: 8 },
];

const recentAlerts: { text: string; time: string; tone: 'info' | 'warning' | 'danger' }[] = [
  { text: 'Bus RAB123A is 5 km from Nyabugogo', time: '2m', tone: 'info' },
  { text: 'Trip Kigali → Musanze delayed 15 min', time: '18m', tone: 'warning' },
  { text: 'Incident on Trip #4821 — transfer requested', time: '1h', tone: 'danger' },
];

export function OverviewPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      {/* KPI row — /analytics (revenue), /bookings (tickets), /tracking (buses active) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard hero label={t('overview.dailyRevenue')} value="4,250K" unit="RWF" delta={{ value: '+12.5%', direction: 'up' }} />
        <KpiCard label={t('overview.revenueMtd')} value="85.4M" unit="RWF" delta={{ value: '+8.2%', direction: 'up' }} />
        <KpiCard label={t('overview.ticketsToday')} value="750" delta={{ value: '-5.2%', direction: 'down' }} />
        <KpiCard label={t('overview.busesActive')} value="18" delta={{ value: '+3', direction: 'up' }} />
      </div>

      {/* Passenger volume + live map */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <GlassCard className="p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">{t('overview.passengerVolume')}</h3>
              <p className="text-sm text-muted-foreground">{t('overview.peakHours')}</p>
            </div>
            <Badge tone="success">
              <TrendingUp className="size-3" /> {t('overview.thisWeek')}
            </Badge>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={passengerVolume} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  cursor={{ fill: '#64748B', opacity: 0.12 }}
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    color: 'hsl(var(--popover-foreground))',
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [t('overview.passengers', { count: v }), '']}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {passengerVolume.map((d) => (
                    <Cell key={d.day} fill={d.day === 'Thu' ? '#14B8A6' : 'rgba(20,184,166,0.28)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-base font-semibold">{t('overview.activeRoutesMap')}</h3>
          <p className="text-sm text-muted-foreground">{t('overview.liveDispatch')}</p>
          <div className="mt-4 flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-secondary/40 text-muted-foreground">
            <div className="text-center">
              <MapPin className="mx-auto size-6" aria-hidden />
              <p className="mt-2 text-sm">{t('overview.mapOnMapScreen')}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="p-6">
          <h3 className="text-base font-semibold">{t('overview.topRoutes')}</h3>
          <ul className="mt-4 space-y-4">
            {topRoutes.map((r) => (
              <li key={r.route} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <Bus className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.route}</p>
                    <p className="text-xs text-muted-foreground">{t('overview.passengers', { count: r.passengers })}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums">{formatRWF(r.revenue)}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-base font-semibold">{t('overview.bookingSource')}</h3>
          <ul className="mt-4 space-y-4">
            {bookingSources.map((b) => (
              <li key={b.source}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{b.source}</span>
                  <span className="tabular-nums text-muted-foreground">{b.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-teal" style={{ width: `${b.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">{t('overview.recentAlerts')}</h3>
            <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden />
          </div>
          <ul className="mt-4 space-y-3">
            {recentAlerts.map((a) => (
              <li key={a.text} className="flex gap-3">
                <span
                  className={
                    a.tone === 'danger'
                      ? 'mt-0.5 text-destructive'
                      : a.tone === 'warning'
                        ? 'mt-0.5 text-warning'
                        : 'mt-0.5 text-primary'
                  }
                >
                  <AlertTriangle className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm leading-snug">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.time} ago</p>
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
