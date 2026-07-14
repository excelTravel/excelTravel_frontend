import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import { Download } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { useDateRange } from '@/store/dateRange';

// Stub data (Rwanda). Wired later to /analytics/peak-travel, /analytics/peak-booking, /analytics/seat-map.
const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

// Deterministic occupancy heatmap: twin peaks (morning + evening), lighter weekends.
function occupancy(dayIdx: number, hour: number): number {
  const weekend = dayIdx >= 5 ? 0.6 : 1;
  const morning = Math.exp(-((hour - 8) ** 2) / 3);
  const evening = Math.exp(-((hour - 18) ** 2) / 4);
  return Math.round(Math.min(100, (morning * 0.95 + evening * 0.85) * 100 * weekend));
}

const booking = [
  { h: '06:00', v: 42 },
  { h: '08:00', v: 88 },
  { h: '10:00', v: 61 },
  { h: '12:00', v: 74 },
  { h: '14:00', v: 55 },
  { h: '16:00', v: 69 },
  { h: '18:00', v: 93 },
  { h: '20:00', v: 47 },
];

const revenue = [
  { d: 'W1', v: 3.1 },
  { d: 'W2', v: 3.6 },
  { d: 'W3', v: 3.4 },
  { d: 'W4', v: 4.2 },
  { d: 'W5', v: 4.0 },
  { d: 'W6', v: 4.8 },
];

const routes = [
  { route: 'Kigali → Musanze', trips: 128, occ: 92, rev: '6.4M' },
  { route: 'Kigali → Rubavu', trips: 96, occ: 84, rev: '5.1M' },
  { route: 'Kigali → Huye', trips: 74, occ: 71, rev: '3.8M' },
  { route: 'Kigali → Nyagatare', trips: 52, occ: 63, rev: '2.4M' },
];

// Teal at full intensity, fading to a faint tint at zero — colour intensity encodes load.
function heatColor(v: number): string {
  return `rgba(20,184,166,${(0.06 + (v / 100) * 0.9).toFixed(3)})`;
}

export function AnalyticsPage() {
  const { t } = useTranslation();
  const preset = useDateRange((s) => s.preset);
  const compare = t(`range.compare.${preset}`);

  return (
    <Reveal className="space-y-6">
      <RevealItem>
        <PageHeader
          subtitle={t('analytics.subtitle')}
          actions={
            <Button variant="outline" size="sm">
              <Download className="size-4" /> {t('bookings.export')}
            </Button>
          }
        />
      </RevealItem>

      {/* KPI row */}
      <RevealItem className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t('analytics.avgOccupancy')} value="78%" delta={{ value: '+4.1%', direction: 'up', comparison: compare }} />
        <KpiCard label={t('analytics.onTimeRate')} value="91%" delta={{ value: '+2.3%', direction: 'up', comparison: compare }} />
        <KpiCard label={t('analytics.revenuePerTrip')} value="52K" unit="RWF" delta={{ value: '-1.8%', direction: 'down', comparison: compare }} />
        <KpiCard label={t('analytics.busiestRoute')} value="KGL — MUS" badge={{ text: '92%', tone: 'teal' }} />
      </RevealItem>

      {/* Peak travel heatmap */}
      <RevealItem>
      <GlassCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">{t('analytics.peakTravel')}</h3>
            <p className="text-sm text-muted-foreground">{t('analytics.peakTravelSub')}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t('analytics.less')}</span>
            <div className="flex overflow-hidden rounded">
              {[0, 25, 50, 75, 100].map((v) => (
                <span key={v} className="size-4" style={{ backgroundColor: heatColor(v) }} aria-hidden />
              ))}
            </div>
            <span>{t('analytics.more')}</span>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[560px]">
            {/* hour axis */}
            <div className="mb-1 flex pl-10">
              {HOURS.map((h) => (
                <div key={h} className="flex-1 text-center text-[10px] tabular-nums text-muted-foreground">
                  {h % 2 === 0 ? h : ''}
                </div>
              ))}
            </div>
            {DAY_KEYS.map((day, di) => (
              <div key={day} className="flex items-center">
                <span className="w-10 text-xs font-medium capitalize text-muted-foreground">{t(`analytics.day.${day}`)}</span>
                <div className="flex flex-1 gap-1 py-0.5">
                  {HOURS.map((h) => {
                    const v = occupancy(di, h);
                    return (
                      <div
                        key={h}
                        className="h-6 flex-1 rounded-[3px]"
                        style={{ backgroundColor: heatColor(v) }}
                        title={`${t(`analytics.day.${day}`)} ${h}:00 · ${v}%`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
      </RevealItem>

      {/* Booking hours + revenue trend */}
      <RevealItem className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <GlassCard className="p-6">
          <h3 className="text-base font-semibold">{t('analytics.peakBooking')}</h3>
          <p className="text-sm text-muted-foreground">{t('analytics.peakBookingSub')}</p>
          <div className="mt-6 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={booking} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <XAxis dataKey="h" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  cursor={{ fill: '#64748B', opacity: 0.12 }}
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--popover-foreground))', fontSize: 12 }}
                />
                <Bar dataKey="v" radius={[8, 8, 0, 0]}>
                  {booking.map((d) => (
                    <Cell key={d.h} fill={d.v >= 85 ? '#14B8A6' : 'rgba(20,184,166,0.28)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">{t('analytics.revenueTrend')}</h3>
              <p className="text-sm text-muted-foreground">{t('analytics.revenueTrendSub')}</p>
            </div>
            <Badge tone="success">+18.4%</Badge>
          </div>
          <div className="mt-6 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  cursor={{ stroke: '#64748B', strokeOpacity: 0.3 }}
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--popover-foreground))', fontSize: 12 }}
                  formatter={(v: number) => [`${v}M RWF`, '']}
                />
                <Area type="monotone" dataKey="v" stroke="#0F766E" strokeWidth={2} fill="url(#revFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </RevealItem>

      {/* Route performance */}
      <RevealItem>
      <GlassCard className="overflow-hidden">
        <h3 className="p-5 text-base font-semibold">{t('analytics.routePerformance')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">{t('analytics.colRoute')}</th>
                <th className="px-5 py-3 font-medium">{t('analytics.colTrips')}</th>
                <th className="px-5 py-3 font-medium">{t('analytics.colOccupancy')}</th>
                <th className="px-5 py-3 text-right font-medium">{t('analytics.colRevenue')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {routes.map((r) => (
                <tr key={r.route} className="transition-colors hover:bg-secondary/40">
                  <td className="whitespace-nowrap px-5 py-3 font-medium">{r.route}</td>
                  <td className="px-5 py-3 tabular-nums">{r.trips}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${r.occ}%` }} />
                      </div>
                      <span className="tabular-nums text-muted-foreground">{r.occ}%</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums">{r.rev}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
      </RevealItem>
    </Reveal>
  );
}
