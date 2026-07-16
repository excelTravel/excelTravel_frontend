import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { ChevronLeft, ChevronRight, Download, Radio, Search, ShieldCheck, Smartphone, XCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Badge, StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/form';
import { SortableTh } from '@/components/ui/sortable-th';
import { useSort } from '@/lib/useSort';
import { useDateRange } from '@/store/dateRange';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { BookingDesk } from './BookingDesk';
import { formatRWF, cn } from '@/lib/utils';

// Stub data (Rwanda). Wired later to /bookings (list/filter), /analytics (velocity/channel).
const velocity = [
  { h: '00:00', v: 22 }, { h: '03:00', v: 34 }, { h: '06:00', v: 55 }, { h: '09:00', v: 70 },
  { h: '12:00', v: 96 }, { h: '15:00', v: 82 }, { h: '18:00', v: 61 }, { h: '23:59', v: 33 },
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

interface BookingRow {
  id: string;
  name: string;
  phone: string;
  route: string;
  time: string;
  status: string;
  bus: string;
  amount: number;
}
const BOOKINGS: BookingRow[] = [
  { id: 'TK-8921', name: 'Jean Paul N.', phone: '078****923', route: 'Kigali → Musanze', time: '14:00', status: 'confirmed', bus: 'RAB-123-C', amount: 5000 },
  { id: 'TK-8919', name: 'Sandrine M.', phone: '073****112', route: 'Kigali → Rubavu', time: '15:30', status: 'hold', bus: 'RAC-112-D', amount: 3500 },
  { id: 'TK-8915', name: 'Erick Gatete', phone: '072****445', route: 'Kigali → Huye', time: '14:45', status: 'cancelled', bus: 'RAD-088-A', amount: 0 },
  { id: 'TK-8910', name: 'Divine I.', phone: '079****001', route: 'Kigali → Gisenyi', time: '16:00', status: 'paid', bus: 'RAE-027-B', amount: 4200 },
  { id: 'TK-8907', name: 'Patrick H.', phone: '078****338', route: 'Kigali → Nyagatare', time: '11:30', status: 'confirmed', bus: 'RAF-051-C', amount: 4800 },
  { id: 'TK-8904', name: 'Aline U.', phone: '073****900', route: 'Musanze → Kigali', time: '12:00', status: 'boarding', bus: 'RAB-402-C', amount: 5000 },
  { id: 'TK-8901', name: 'Claude N.', phone: '072****771', route: 'Huye → Kigali', time: '13:15', status: 'paid', bus: 'RAG-014-B', amount: 3900 },
  { id: 'TK-8898', name: 'Grace M.', phone: '079****205', route: 'Kigali → Rusizi', time: '06:00', status: 'confirmed', bus: 'RAH-009-A', amount: 6200 },
  { id: 'TK-8895', name: 'Eric K.', phone: '078****664', route: 'Kigali → Musanze', time: '09:30', status: 'cancelled', bus: 'RAB-123-C', amount: 0 },
  { id: 'TK-8890', name: 'Josiane R.', phone: '073****018', route: 'Rubavu → Kigali', time: '10:45', status: 'paid', bus: 'RAC-112-D', amount: 3500 },
];

const STATUS_FILTERS = ['all', 'confirmed', 'paid', 'boarding', 'hold', 'cancelled'] as const;

export function BookingsPage() {
  const { t } = useTranslation();
  const preset = useDateRange((s) => s.preset);
  const compare = t(`range.compare.${preset}`);
  const [view, setView] = useState<'dashboard' | 'desk'>('dashboard');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('all');

  const filtered = BOOKINGS.filter((b) => {
    const matchesStatus = status === 'all' || b.status === status;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.route.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });
  const { sorted, sortKey, sortDir, toggle } = useSort<BookingRow>(
    filtered,
    (row, key) => (row as unknown as Record<string, string | number>)[key] ?? '',
    { key: 'id', dir: 'desc' },
  );

  return (
    <Reveal className="space-y-6">
      <RevealItem>
        <div role="tablist" aria-label={t('nav.bookings')} className="inline-flex gap-1 rounded-xl bg-secondary/60 p-1">
          {(['dashboard', 'desk'] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn('rounded-lg px-4 py-2 text-sm font-medium transition-colors', view === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              {t(`bookings.view.${v}`)}
            </button>
          ))}
        </div>
      </RevealItem>

      {view === 'desk' && <BookingDesk />}

      {view === 'dashboard' && (
      <>
      {/* KPI row */}
      <RevealItem className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t('bookings.totalDaily')} value="1,284" delta={{ value: '+12%', direction: 'up', comparison: compare }} />
        <KpiCard label={t('bookings.monthly')} value="32,910" delta={{ value: '+5.4%', direction: 'up', comparison: compare }} />
        <KpiCard label={t('bookings.revenueToday')} value="4.2M" unit="RWF" badge={{ text: t('bookings.stable'), tone: 'neutral' }} />
        <KpiCard label={t('bookings.dailyGoal')} value="85%" badge={{ text: t('bookings.stable'), tone: 'success' }} />
      </RevealItem>

      {/* Velocity + channel split */}
      <RevealItem className="grid grid-cols-1 gap-6 xl:grid-cols-3">
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
                <Tooltip cursor={{ fill: '#64748B', opacity: 0.12 }} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, color: 'hsl(var(--popover-foreground))', fontSize: 12 }} />
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

      {/* Live feed + revenue protection */}
      <RevealItem className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', f.cancelled ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary')}>
                  {f.cancelled ? <XCircle className="size-4" /> : <Smartphone className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{f.name}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{f.time} ago</span>
                  </div>
                  {f.cancelled ? (
                    <p className="text-xs text-destructive">{t('bookings.cancelled')} · {f.reason}</p>
                  ) : (
                    <>
                      <p className="truncate text-xs text-muted-foreground">{f.route}</p>
                      <p className="mt-0.5 text-xs font-semibold text-success">{t('bookings.paid')} {formatRWF(f.amount!)} · {f.source}</p>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="size-4 text-destructive" /> {t('bookings.revenueProtection')}
          </h3>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary/50 p-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t('bookings.refundQueue')}</p>
              <p className="text-lg font-bold tabular-nums">{formatRWF(450200)}</p>
            </div>
            <Button variant="destructive" size="sm">{t('bookings.processAll')}</Button>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('bookings.cancelledToday')}</span>
                <span className="font-semibold">{t('bookings.tickets', { n: 18 })}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full w-2/3 rounded-full bg-destructive" /></div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('bookings.recoveredLeads')}</span>
                <span className="font-semibold">{t('bookings.tickets', { n: 7 })}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full w-1/4 rounded-full bg-success" /></div>
            </div>
          </div>
        </GlassCard>
      </RevealItem>

      {/* All bookings — full-width table with in-table search + status filter + sortable headers */}
      <RevealItem>
        <GlassCard className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <h3 className="text-base font-semibold">{t('bookings.recentDetailed')}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('bookings.search')}
                  aria-label={t('bookings.search')}
                  className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-56"
                />
              </div>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 w-auto" aria-label={t('bookings.colStatus')}>
                {STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>{t(`bookings.st.${s}`)}</option>
                ))}
              </Select>
              <Button variant="outline" size="sm"><Download className="size-4" /> {t('bookings.export')}</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <SortableTh label={t('bookings.colTicket')} sortKey="id" activeKey={sortKey} dir={sortDir} onSort={toggle} className="px-5" />
                  <SortableTh label={t('bookings.colPassenger')} sortKey="name" activeKey={sortKey} dir={sortDir} onSort={toggle} className="px-5" />
                  <SortableTh label={t('bookings.colRoute')} sortKey="route" activeKey={sortKey} dir={sortDir} onSort={toggle} className="px-5" />
                  <SortableTh label={t('bookings.colTime')} sortKey="time" activeKey={sortKey} dir={sortDir} onSort={toggle} className="px-5" />
                  <SortableTh label={t('bookings.colStatus')} sortKey="status" activeKey={sortKey} dir={sortDir} onSort={toggle} className="px-5" />
                  <SortableTh label={t('bookings.colAmount')} sortKey="amount" activeKey={sortKey} dir={sortDir} onSort={toggle} align="right" className="px-5" />
                  <th className="px-5 py-3 font-medium">{t('bookings.colBusStation')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-secondary/40">
                    <td className="whitespace-nowrap px-5 py-3 font-semibold">#{r.id}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">{r.phone}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{r.route}</td>
                    <td className="whitespace-nowrap px-5 py-3 tabular-nums">{r.time}</td>
                    <td className="px-5 py-3"><StatusPill status={r.status} /></td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums">{r.amount ? formatRWF(r.amount) : '—'}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{r.bus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sorted.length === 0 && (
              <div className="p-10 text-center">
                <p className="text-sm font-medium">{t('bookings.emptyTitle')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('bookings.emptySub')}</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between p-5">
            <p className="text-sm text-muted-foreground">{t('bookings.showing', { shown: sorted.length, total: '1,248' })}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="size-8" aria-label={t('tripsList.prev')}><ChevronLeft className="size-4" /></Button>
              {[1, 2, 3].map((p) => (
                <Button key={p} variant={p === 1 ? 'default' : 'outline'} size="icon" className="size-8">{p}</Button>
              ))}
              <Button variant="outline" size="icon" className="size-8" aria-label={t('tripsList.next')}><ChevronRight className="size-4" /></Button>
            </div>
          </div>
        </GlassCard>
      </RevealItem>
      </>
      )}
    </Reveal>
  );
}
