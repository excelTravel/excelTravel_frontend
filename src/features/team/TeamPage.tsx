import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Users, UserCog, UsersRound, Mail, Phone, MapPin, Search } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Button } from '@/components/ui/button';
import { StatusPill, Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/form';
import { SortableTh } from '@/components/ui/sortable-th';
import { Table, Thead, Th, Tbody, Td, Tr } from '@/components/ui/table';
import { useSort } from '@/lib/useSort';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { Async } from '@/components/ui/async';
import { useUsers, useAgents, useStops } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';
import { InviteUserModal, InviteAgentModal, AssignStationModal } from './TeamModals';
import { PASSENGERS, type Agent, type Passenger } from './team';

const TABS = [
  { key: 'staff', icon: Users },
  { key: 'agents', icon: UserCog },
  { key: 'passengers', icon: UsersRound },
] as const;
type TeamTab = (typeof TABS)[number]['key'];

// "16 Jul 2026" — compact, locale-aware.
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export function TeamPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TeamTab>('staff');
  const usersQ = useUsers();
  const agentsQ = useAgents();
  // One fixed KPI row across all sub-sections (Staff / Agents / Passengers) — stable, no layout shift.
  const cards = [
    { label: t('team.kpiStaff'), value: usersQ.data?.length ?? 0 },
    { label: t('team.kpiActive'), value: usersQ.data?.filter((u) => u.status === 'active').length ?? 0 },
    { label: t('team.kpiAgents'), value: agentsQ.data?.length ?? 0 },
    { label: t('team.kpiPassengers'), value: PASSENGERS.length },
  ];
  return (
    <Reveal className="space-y-6">
      <RevealItem className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map((c) => (
          <KpiCard key={c.label} label={c.label} value={c.value.toLocaleString()} />
        ))}
      </RevealItem>
      <RevealItem>
        <div role="tablist" aria-label={t('nav.users')} className="inline-flex gap-1 rounded-xl bg-secondary/60 p-1">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              role="tab"
              aria-selected={tab === tb.key}
              onClick={() => setTab(tb.key)}
              className={cn('inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors', tab === tb.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              <tb.icon className="size-4" /> {t(`team.tabs.${tb.key}`)}
            </button>
          ))}
        </div>
      </RevealItem>
      <RevealItem>
        {tab === 'staff' && <UsersPanel />}
        {tab === 'agents' && <AgentsPanel />}
        {tab === 'passengers' && <PassengersPanel />}
      </RevealItem>
    </Reveal>
  );
}

const PAX_FILTERS = ['all', 'frequent', 'occasional', 'oneTime'] as const;

function PassengersPanel() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof PAX_FILTERS)[number]>('all');

  const filtered = PASSENGERS.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.phone.toLowerCase().includes(q) || (p.email?.toLowerCase().includes(q) ?? false);
    const matchesFilter =
      filter === 'all' || (filter === 'frequent' && p.bookings >= 10) || (filter === 'occasional' && p.bookings > 1 && p.bookings < 10) || (filter === 'oneTime' && p.bookings <= 1);
    return matchesQuery && matchesFilter;
  });
  const { sorted, sortKey, sortDir, toggle } = useSort<Passenger>(
    filtered,
    (row, key) => (row as unknown as Record<string, string | number | null>)[key] ?? '',
    { key: 'bookings', dir: 'desc' },
  );

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <h3 className="text-base font-semibold">{t('team.tabs.passengers')}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('team.searchPax')}
              aria-label={t('team.searchPax')}
              className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-56"
            />
          </div>
          <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="h-9 w-auto" aria-label={t('team.paxFilterLabel')}>
            {PAX_FILTERS.map((f) => <option key={f} value={f}>{t(`team.paxFilter.${f}`)}</option>)}
          </Select>
        </div>
      </div>
      <Table>
        <thead className="bg-secondary/40">
          <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <SortableTh label={t('team.colUser')} sortKey="name" activeKey={sortKey} dir={sortDir} onSort={toggle} />
            <SortableTh label={t('team.colPhone')} sortKey="phone" activeKey={sortKey} dir={sortDir} onSort={toggle} />
            <SortableTh label={t('team.colBookings')} sortKey="bookings" activeKey={sortKey} dir={sortDir} onSort={toggle} />
            <SortableTh label={t('team.colLastLogin')} sortKey="lastLogin" activeKey={sortKey} dir={sortDir} onSort={toggle} />
            <SortableTh label={t('team.colLogins')} sortKey="logins" activeKey={sortKey} dir={sortDir} onSort={toggle} />
            <SortableTh label={t('team.colUpdated')} sortKey="updated" activeKey={sortKey} dir={sortDir} onSort={toggle} align="right" />
          </tr>
        </thead>
        <Tbody>
          {sorted.map((p) => (
            <Tr key={p.id}>
              <Td className="whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{p.name.charAt(0)}</span>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.email ?? t('team.noEmail')}</p>
                  </div>
                </div>
              </Td>
              <Td className="whitespace-nowrap tabular-nums text-muted-foreground">{p.phone}</Td>
              <Td>
                <span className="inline-flex items-center gap-2">
                  <span className="font-semibold tabular-nums">{p.bookings}</span>
                  {p.bookings >= 10 && <Badge tone="teal">{t('team.paxFilter.frequent')}</Badge>}
                </span>
              </Td>
              <Td className="whitespace-nowrap tabular-nums text-muted-foreground">{fmtDate(p.lastLogin)}</Td>
              <Td className="tabular-nums text-muted-foreground">{p.logins}</Td>
              <Td className="whitespace-nowrap text-right tabular-nums text-muted-foreground">{fmtDate(p.updated)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {sorted.length === 0 && (
        <div className="p-10 text-center text-sm text-muted-foreground">{t('team.noPax')}</div>
      )}
    </GlassCard>
  );
}

function UsersPanel() {
  const { t } = useTranslation();
  const [invite, setInvite] = useState(false);
  const users = useUsers();
  return (
    <GlassCard className="overflow-hidden">
      <InviteUserModal open={invite} onClose={() => setInvite(false)} />
      <div className="flex items-center justify-between p-5">
        <h3 className="text-base font-semibold">{t('team.tabs.staff')}</h3>
        <Button size="sm" onClick={() => setInvite(true)}><Plus className="size-4" /> {t('team.inviteUser')}</Button>
      </div>
      <Async query={users} isEmpty={(d) => d.length === 0} skeleton={<TableSkeleton cols={4} />}>
        {(data) => (
          <Table>
            <Thead>
              <Th>{t('team.colUser')}</Th>
              <Th>{t('team.colPhone')}</Th>
              <Th>{t('team.colRole')}</Th>
              <Th>{t('team.colStatus')}</Th>
            </Thead>
            <Tbody>
              {data.map((u) => (
                <Tr key={u.id}>
                  <Td className="whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{u.name.charAt(0)}</span>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap tabular-nums text-muted-foreground">{u.phone}</Td>
                  <Td><Badge tone={u.role === 'company_admin' ? 'info' : u.role === 'manager' ? 'teal' : 'neutral'}>{t(`team.roles.${u.role}`)}</Badge></Td>
                  <Td><StatusPill status={u.status}>{t(`team.status.${u.status}`)}</StatusPill></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Async>
    </GlassCard>
  );
}

// Shimmer rows while a table loads.
function TableSkeleton({ cols }: { cols: number }) {
  return (
    <div className="space-y-2 p-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((__, j) => <div key={j} className="shimmer h-5 rounded" />)}
        </div>
      ))}
    </div>
  );
}

function AgentsPanel() {
  const { t } = useTranslation();
  const [invite, setInvite] = useState(false);
  const [assign, setAssign] = useState<Agent | null>(null);
  const agentsQ = useAgents();
  const stopsQ = useStops();
  const stationName = (id: string) => stopsQ.data?.find((s) => s.id === id)?.name ?? id;

  return (
    <div className="space-y-4">
      <InviteAgentModal open={invite} onClose={() => setInvite(false)} />
      <AssignStationModal agent={assign} onClose={() => setAssign(null)} onAssign={() => setAssign(null)} />
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setInvite(true)}><Plus className="size-4" /> {t('team.inviteAgent')}</Button>
      </div>
      <Async query={agentsQ} isEmpty={(d) => d.length === 0} skeleton={<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"><div className="shimmer h-40 rounded-2xl" /><div className="shimmer h-40 rounded-2xl" /></div>} empty={<GlassCard className="p-10 text-center text-sm text-muted-foreground">{t('team.noAgents')}</GlassCard>}>
        {(agents) => (
          <Reveal className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {agents.map((a) => (
              <RevealItem key={a.id}>
                <GlassCard className="flex h-full flex-col gap-3 p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">{a.name.charAt(0)}</span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold leading-tight">{a.name}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><Mail className="size-3" /> {a.email}</p>
                    </div>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="size-3" /> {a.phone}</p>
                  <div>
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <MapPin className="size-3" /> {t('team.stations')}
                    </p>
                    <div className="mt-1.5 flex min-h-[1.75rem] flex-wrap gap-1.5">
                      {a.stationIds.length > 0 ? (
                        a.stationIds.map((s) => (
                          <span key={s} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">{stationName(s)}</span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">{t('team.noStations')}</span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-auto" onClick={() => setAssign({ id: a.id, name: a.name, email: a.email, phone: a.phone, stations: a.stationIds.map(stationName) })}>
                    <Plus className="size-4" /> {t('team.assignStation')}
                  </Button>
                </GlassCard>
              </RevealItem>
            ))}
          </Reveal>
        )}
      </Async>
    </div>
  );
}
