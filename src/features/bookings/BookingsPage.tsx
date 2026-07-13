import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import { ChevronLeft, ChevronRight, Download, Filter, Globe, Radio, ShieldCheck, Smartphone, XCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Badge, StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDateRange } from '@/store/dateRange';
import { formatRWF, cn } from '@/lib/utils';

// Stub data (Rwanda). Wired later to /bookings, /analytics (velocity/channel), /tracking (occupancy).
const velocity = [
  { h: '00:00', v: 22 },
  { h: '03:00', v: 34 },
  { h: '06:00', v: 55 },
  { h: '09:00', v: 70 },
  { h: '12:00', v: 96 },
  { h: '15:00', v: 82 },
  { h: '18:00', v: 61 },
  { h: '23:59', v: 33 },
];

const channel = [
  { name: 'web', value: 4102, color: '#0F766E' },
  { name: 'agent', value: 1598, color: '#C7EDE7' },
];

const feed = [
  { name: 'John D. Kayitana', route: 'Kigali → Musanze (Express)', amount: 5000, source: 'App', time: '2m' },
  { name: 'Marie Umutoni', route: 'Rubavu → Kigali (Standard)', amount: 3500, source: 'Web', time: '5m' },
  { name: 'H. Rwagatare', cancelled: true, reason: 'Payment timeout', time: '8m' },
  { name: 'Alain Gakwaya', route: 'Kigali → Huye (VIP)', amount: 6500, source: 'App', time: '12m' },
];

const rows = [
  { id: '#TK-8921', name: 'Jean Paul N.', phone: '078****923', route: 'KGL-MUS · 14:00', status: 'confirmed', bus: 'RAB 123 C / NYG' },
  { id: '#TK-8919', name: 'Sandrine M.', phone: '073****112', route: 'KGL-RUB · 15:30', status: 'hold', bus: 'RAB 123 C / NYG' },
  { id: '#TK-8915', name: 'Erick Gatete', phone: '072****445', route: 'KGL-HUY · 14:45', status: 'cancelled', bus: 'RAB 123 C / NYG' },
  { id: '#TK-8910', name: 'Divine I.', phone: '079****001', route: 'KGL-GIS · 16:00', status: 'confirmed', bus: 'RAB 123 C / NYG' },
];

export function BookingsPage() {
  const { t } = useTranslation();
  const preset = useDateRange((s) => s.preset);
  const compare = t(`range.compare.${preset}`);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t('bookings.totalDaily')} value="1,284" delta={{ value: '+12%', direction: 'up', comparison: compare }} />
        <KpiCard label={t('bookings.monthly')} value="32,910" delta={{ value: '+5.4%', direction: 'up', comparison: compare }} />
        <KpiCard label={t('bookings.revenueToday')} value="4.2M" unit="RWF" badge={{ text: t('bookings.stable'), tone: 'neutral' }} />
        <KpiCard label={t('bookings.dailyGoal')} value="85%" badge={{ text: t('bookings.stable'), tone: 'success' }} />
      </div>

      {/* Velocity + channel split */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <GlassCard className="p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">{t('bookings.velocity')}</h3>
              <p className="text-sm text-muted-foreground">{t('bookings.throughput')}</p>
            </div>
            <Badge tone="success">+12.4% {t('bookings.vsPrev')}</Badge>
          </div>
          <div className="mt-6 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={velocity} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <XAxis dataKey="h" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} interval={1} />
                <Tooltip
                  cursor={{ fill: '#64748B', opacity: 0.12 }}
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--popover-foreground))', fontSize: 12 }}
                />
                <Bar dataKey="v" radius={[8, 8, 0, 0]}>
                  {velocity.map((d) => (
                    <Cell key={d.h} fill={d.v >= 90 ? '#14B8A6' : 'rgba(20,184,166,0.28)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-base font-semibold">{t('bookings.channelSplit')}</h3>
          <p className="text-sm text-muted-foreground">{t('bookings.webVsAgent')}</p>
          <div className="relative mx-auto mt-4 h-44 w-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={channel} dataKey="value" innerRadius={58} outerRadius={80} paddingAngle={2} stroke="none">
                  {channel.map((c) => (
                    <Cell key={c.name} fill={c.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums">72%</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t('bookings.directWeb')}
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-primary" /> {t('bookings.webPortal')}
              </span>
              <span className="font-semibold tabular-nums">4,102</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-accent" /> {t('bookings.agentNetwork')}
              </span>
              <span className="font-semibold tabular-nums">1,598</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Live feed + occupancy */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Radio className="size-4 text-primary" /> {t('bookings.liveFeed')}
            </h3>
            <span className="size-2.5 animate-pulse rounded-full bg-success" aria-hidden />
          </div>
          <ul className="mt-4 space-y-4">
            {feed.map((f) => (
              <li key={f.name} className="flex gap-3">
                <span
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-lg',
                    f.cancelled ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
                  )}
                >
                  {f.cancelled ? <XCircle className="size-4" /> : <Smartphone className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{f.name}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{f.time} ago</span>
                  </div>
                  {f.cancelled ? (
                    <p className="text-xs text-destructive">
                      {t('bookings.cancelled')} · {f.reason}
                    </p>
                  ) : (
                    <>
                      <p className="truncate text-xs text-muted-foreground">{f.route}</p>
                      <p className="mt-0.5 text-xs font-semibold text-success">
                        {t('bookings.paid')} {formatRWF(f.amount!)} · {f.source}
                      </p>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between p-6 pb-3">
            <div>
              <h3 className="text-base font-semibold">{t('bookings.occupancy')}</h3>
              <p className="text-sm text-muted-foreground">{t('bookings.routeDensity')}</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-full bg-destructive" /> {t('bookings.peak')}
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-full bg-primary" /> {t('bookings.normal')}
              </span>
            </div>
          </div>
          <div className="flex h-72 items-center justify-center border-t border-border bg-secondary/40 text-muted-foreground">
            <div className="text-center">
              <Globe className="mx-auto size-7" aria-hidden />
              <p className="mt-2 text-sm">Route load map on the Map screen</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Revenue protection + detailed table */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <GlassCard className="p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="size-4 text-destructive" /> {t('bookings.revenueProtection')}
          </h3>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary/50 p-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t('bookings.refundQueue')}
              </p>
              <p className="text-lg font-bold tabular-nums">{formatRWF(450200)}</p>
            </div>
            <Button variant="destructive" size="sm">
              {t('bookings.processAll')}
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('bookings.cancelledToday')}</span>
                <span className="font-semibold">{t('bookings.tickets', { n: 18 })}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-2/3 rounded-full bg-destructive" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('bookings.recoveredLeads')}</span>
                <span className="font-semibold">{t('bookings.tickets', { n: 7 })}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-1/4 rounded-full bg-success" />
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="overflow-hidden xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <h3 className="text-base font-semibold">{t('bookings.recentDetailed')}</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="size-4" /> {t('bookings.filter')}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="size-4" /> {t('bookings.export')}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">{t('bookings.colTicket')}</th>
                  <th className="px-5 py-3 font-medium">{t('bookings.colPassenger')}</th>
                  <th className="px-5 py-3 font-medium">{t('bookings.colRoute')}</th>
                  <th className="px-5 py-3 font-medium">{t('bookings.colStatus')}</th>
                  <th className="px-5 py-3 font-medium">{t('bookings.colBusStation')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-secondary/40">
                    <td className="whitespace-nowrap px-5 py-3 font-semibold">{r.id}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">{r.phone}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{r.route}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{r.bus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-5">
            <p className="text-sm text-muted-foreground">{t('bookings.showing', { shown: 10, total: '1,248' })}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="size-8" aria-label="Previous page">
                <ChevronLeft className="size-4" />
              </Button>
              {[1, 2, 3].map((p) => (
                <Button key={p} variant={p === 1 ? 'default' : 'outline'} size="icon" className="size-8">
                  {p}
                </Button>
              ))}
              <Button variant="outline" size="icon" className="size-8" aria-label="Next page">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
