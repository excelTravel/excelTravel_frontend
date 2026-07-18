import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Download } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { useDateRange } from '@/store/dateRange';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { formatRWF, cn } from '@/lib/utils';

// Stub data (Rwanda). Wired later to /bookings (list/filter), /analytics (velocity/channel).
const velocityByHour = [
  { h: '00:00', v: 22 }, { h: '03:00', v: 34 }, { h: '06:00', v: 55 }, { h: '09:00', v: 70 },
  { h: '12:00', v: 96 }, { h: '15:00', v: 82 }, { h: '18:00', v: 61 }, { h: '23:59', v: 33 },
];
const velocityByDay = [
  { h: 'Mon', v: 60 }, { h: 'Tue', v: 72 }, { h: 'Wed', v: 68 }, { h: 'Thu', v: 96 },
  { h: 'Fri', v: 88 }, { h: 'Sat', v: 40 }, { h: 'Sun', v: 52 },
];
const channel = [
  { name: 'web', value: 4102, color: '#0F766E' },
  { name: 'agent', value: 1598, color: '#C7EDE7' },
];

interface BookingRow {
  id: string;
  name: string;
  phone: string;
  route: string;
  pickup: string; // station/stop the passenger chose to board at (booked from)
  time: string;
  status: string;
  bus: string;
  amount: number;
}
const BOOKINGS: BookingRow[] = [
  { id: 'TK-8921', name: 'Jean Paul N.', phone: '078****923', route: 'Kigali → Musanze', pickup: 'Nyabugogo', time: '14:00', status: 'confirmed', bus: 'RAB-123-C', amount: 5000 },
  { id: 'TK-8919', name: 'Sandrine M.', phone: '073****112', route: 'Kigali → Rubavu', pickup: 'Nyabugogo', time: '15:30', status: 'hold', bus: 'RAC-112-D', amount: 3500 },
  { id: 'TK-8915', name: 'Erick Gatete', phone: '072****445', route: 'Kigali → Huye', pickup: 'Muhanga', time: '14:45', status: 'cancelled', bus: 'RAD-088-A', amount: 0 },
  { id: 'TK-8910', name: 'Divine I.', phone: '079****001', route: 'Kigali → Gisenyi', pickup: 'Nyabugogo', time: '16:00', status: 'paid', bus: 'RAE-027-B', amount: 4200 },
  { id: 'TK-8907', name: 'Patrick H.', phone: '078****338', route: 'Kigali → Nyagatare', pickup: 'Kayonza', time: '11:30', status: 'confirmed', bus: 'RAF-051-C', amount: 4800 },
  { id: 'TK-8904', name: 'Aline U.', phone: '073****900', route: 'Musanze → Kigali', pickup: 'Musanze', time: '12:00', status: 'boarding', bus: 'RAB-402-C', amount: 5000 },
  { id: 'TK-8901', name: 'Claude N.', phone: '072****771', route: 'Huye → Kigali', pickup: 'Huye', time: '13:15', status: 'paid', bus: 'RAG-014-B', amount: 3900 },
  { id: 'TK-8898', name: 'Grace M.', phone: '079****205', route: 'Kigali → Rusizi', pickup: 'Nyabugogo', time: '06:00', status: 'confirmed', bus: 'RAH-009-A', amount: 6200 },
  { id: 'TK-8895', name: 'Eric K.', phone: '078****664', route: 'Kigali → Musanze', pickup: 'Nyabugogo', time: '09:30', status: 'cancelled', bus: 'RAB-123-C', amount: 0 },
  { id: 'TK-8890', name: 'Josiane R.', phone: '073****018', route: 'Rubavu → Kigali', pickup: 'Rubavu', time: '10:45', status: 'paid', bus: 'RAC-112-D', amount: 3500 },
];

export function BookingsPage() {
  const { t } = useTranslation();
  const preset = useDateRange((s) => s.preset);
  const compare = t(`range.compare.${preset}`);
  const [velMode, setVelMode] = useState<'hours' | 'days'>('hours');
  const velocityData = velMode === 'hours' ? velocityByHour : velocityByDay;

  const cols: Column<BookingRow>[] = [
    { key: 'id', header: t('bookings.colTicket'), sort: (r) => r.id, cell: (r) => <span className="font-semibold">#{r.id}</span>, td: 'whitespace-nowrap' },
    { key: 'name', header: t('bookings.colPassenger'), sort: (r) => r.name, cell: (r) => (<div><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground tabular-nums">{r.phone}</p></div>) },
    { key: 'route', header: t('bookings.colRoute'), filter: (r) => r.route, sort: (r) => r.route, cell: (r) => r.route, td: 'whitespace-nowrap text-muted-foreground' },
    { key: 'pickup', header: t('bookings.colPickup'), filter: (r) => r.pickup, sort: (r) => r.pickup, cell: (r) => r.pickup, td: 'whitespace-nowrap text-muted-foreground' },
    { key: 'time', header: t('bookings.colTime'), filter: (r) => r.time, sort: (r) => r.time, cell: (r) => r.time, td: 'whitespace-nowrap tabular-nums' },
    { key: 'status', header: t('bookings.colStatus'), sort: (r) => r.status, cell: (r) => <StatusPill status={r.status} /> },
    { key: 'bus', header: t('bookings.colBusStation'), filter: (r) => r.bus, sort: (r) => r.bus, cell: (r) => r.bus, td: 'whitespace-nowrap text-muted-foreground' },
    { key: 'amount', header: t('bookings.colAmount'), align: 'right', sort: (r) => r.amount, cell: (r) => (r.amount ? formatRWF(r.amount) : '—'), td: 'whitespace-nowrap font-semibold tabular-nums' },
  ];

  return (
    <Reveal className="space-y-6">
      {/* KPI row */}
      <RevealItem className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t('bookings.totalDaily')} value="1,284" delta={{ value: '+12%', direction: 'up', comparison: compare }} />
        <KpiCard label={t('bookings.monthly')} value="32,910" delta={{ value: '+5.4%', direction: 'up', comparison: compare }} />
        <KpiCard label={t('bookings.revenueToday')} value="4.2M" unit="RWF" badge={{ text: t('bookings.stable'), tone: 'neutral' }} />
        <KpiCard label={t('bookings.dailyGoal')} value="85%" badge={{ text: t('bookings.stable'), tone: 'success' }} />
      </RevealItem>

      {/* Velocity (hours / days) + channel split */}
      <RevealItem className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <GlassCard className="p-6 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">{t('bookings.velocity')}</h3>
              <p className="text-sm text-muted-foreground">{velMode === 'hours' ? t('bookings.throughput') : t('bookings.byDay')}</p>
            </div>
            <div role="tablist" aria-label={t('bookings.velocity')} className="inline-flex gap-1 rounded-lg bg-secondary/60 p-1">
              {(['hours', 'days'] as const).map((m) => (
                <button key={m} role="tab" aria-selected={velMode === m} onClick={() => setVelMode(m)}
                  className={cn('rounded-md px-3 py-1.5 text-sm font-medium transition-colors', velMode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                  {t(`bookings.vel_${m}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={velocityData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <XAxis dataKey="h" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} interval={0} />
                <Tooltip cursor={{ fill: '#64748B', opacity: 0.12 }} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--popover-foreground))', fontSize: 12 }} />
                <Bar dataKey="v" radius={[8, 8, 0, 0]}>
                  {velocityData.map((d) => <Cell key={d.h} fill={d.v >= 90 ? '#14B8A6' : 'rgba(20,184,166,0.28)'} />)}
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
                  {channel.map((c) => <Cell key={c.name} fill={c.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums">72%</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('bookings.directWeb')}</span>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-primary" /> {t('bookings.webPortal')}</span>
              <span className="font-semibold tabular-nums">4,102</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-accent" /> {t('bookings.agentNetwork')}</span>
              <span className="font-semibold tabular-nums">1,598</span>
            </div>
          </div>
        </GlassCard>
      </RevealItem>

      {/* Booking information */}
      <RevealItem>
        <GlassCard className="overflow-hidden">
          <div className="border-b border-border p-5 pb-3">
            <h3 className="text-base font-semibold">{t('bookings.bookingInfo')}</h3>
            <p className="text-sm text-muted-foreground">{t('bookings.bookingInfoSub')}</p>
          </div>
          <DataTable
            rows={BOOKINGS}
            columns={cols}
            rowKey={(r) => r.id}
            search={(r) => `${r.name} ${r.id} ${r.route} ${r.pickup}`}
            searchPlaceholder={t('bookings.search')}
            empty={t('bookings.emptyTitle')}
            toolbarRight={<Button variant="outline" size="sm"><Download className="size-4" /> {t('bookings.export')}</Button>}
          />
        </GlassCard>
      </RevealItem>
    </Reveal>
  );
}
