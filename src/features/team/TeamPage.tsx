import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Button } from '@/components/ui/button';
import { StatusPill, Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { SectionTabs } from '@/components/ui/section-tabs';
import { Async } from '@/components/ui/async';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { useUsers, type ApiUser } from '@/lib/api/hooks';
import { InviteUserModal } from './TeamModals';
import { PASSENGERS, type Passenger } from './team';

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// Deterministic stub login metrics — the backend users table doesn't track logins yet (Clerk owns
// sessions). Stable per id so the table doesn't flicker. Flagged in docs/integration-map.md.
function loginMetrics(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(h, 31) + seed.charCodeAt(i)) >>> 0;
  const day = 86_400_000;
  return {
    logins: 8 + (h % 320),
    lastLogin: new Date(Date.now() - (h % 6) * day).toISOString(),
    updated: new Date(Date.now() - (h % 40) * day).toISOString(),
  };
}

export function TeamPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'staff' | 'passengers'>('staff');
  const [invite, setInvite] = useState(false);
  const usersQ = useUsers();
  const users = usersQ.data ?? [];

  // One fixed KPI row across sub-sections — no layout shift.
  const cards = [
    { label: t('team.kpiStaff'), value: users.length },
    { label: t('team.kpiAgents'), value: users.filter((u) => u.role === 'agent').length },
    { label: t('team.kpiPassengers'), value: PASSENGERS.length },
  ];

  return (
    <Reveal className="space-y-6">
      <InviteUserModal open={invite} onClose={() => setInvite(false)} />

      <RevealItem className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map((c) => (
          <KpiCard key={c.label} label={c.label} value={c.value.toLocaleString()} />
        ))}
      </RevealItem>

      <RevealItem>
        <SectionTabs
          ariaLabel={t('nav.users')}
          active={tab}
          onChange={setTab}
          tabs={[
            { key: 'staff', label: t('team.tabs.staff') },
            { key: 'passengers', label: t('team.tabs.passengers') },
          ]}
        />
      </RevealItem>

      <RevealItem>
        {tab === 'staff' ? <StaffPanel query={usersQ} onInvite={() => setInvite(true)} /> : <PassengersPanel />}
      </RevealItem>
    </Reveal>
  );
}

// Staff = all company users (managers, admins AND agents), with login history. Backend /users already
// returns agents by role, so staff + agents live in one list.
function StaffPanel({ query, onInvite }: { query: ReturnType<typeof useUsers>; onInvite: () => void }) {
  const { t } = useTranslation();
  const cols: Column<ApiUser>[] = [
    {
      key: 'user', header: t('team.colUser'), sort: (u) => u.name,
      cell: (u) => (
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{u.name.charAt(0)}</span>
          <div><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
        </div>
      ),
    },
    { key: 'phone', header: t('team.colPhone'), cell: (u) => u.phone, td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
    {
      key: 'role', header: t('team.colRole'), filter: (u) => t(`team.roles.${u.role}`), sort: (u) => u.role,
      cell: (u) => <Badge tone={u.role === 'company_admin' ? 'info' : u.role === 'manager' ? 'teal' : 'neutral'}>{t(`team.roles.${u.role}`)}</Badge>,
    },
    { key: 'status', header: t('team.colStatus'), cell: (u) => <StatusPill status={u.status}>{t(`team.status.${u.status}`)}</StatusPill> },
    { key: 'logins', header: t('team.colLogins'), sort: (u) => loginMetrics(u.id).logins, cell: (u) => loginMetrics(u.id).logins, td: 'tabular-nums text-muted-foreground' },
    { key: 'lastLogin', header: t('team.colLastLogin'), sort: (u) => loginMetrics(u.id).lastLogin, cell: (u) => fmtDate(loginMetrics(u.id).lastLogin), td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
    { key: 'updated', header: t('team.colUpdated'), align: 'right', sort: (u) => loginMetrics(u.id).updated, cell: (u) => fmtDate(loginMetrics(u.id).updated), td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
  ];
  return (
    <GlassCard className="overflow-hidden">
      <Async query={query} skeleton={<div className="space-y-2 p-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-9 rounded" />)}</div>}>
        {(data) => (
          <DataTable
            rows={data}
            columns={cols}
            rowKey={(u) => u.id}
            search={(u) => `${u.name} ${u.email} ${u.phone}`}
            searchPlaceholder={t('team.searchStaff')}
            toolbarRight={<Button size="sm" onClick={onInvite}><Plus className="size-4" /> {t('team.inviteUser')}</Button>}
          />
        )}
      </Async>
    </GlassCard>
  );
}

function PassengersPanel() {
  const { t } = useTranslation();
  const cols: Column<Passenger>[] = [
    {
      key: 'user', header: t('team.colUser'), sort: (p) => p.name,
      cell: (p) => (
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{p.name.charAt(0)}</span>
          <div><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.email ?? t('team.noEmail')}</p></div>
        </div>
      ),
    },
    { key: 'phone', header: t('team.colPhone'), cell: (p) => p.phone, td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
    {
      key: 'bookings', header: t('team.colBookings'), sort: (p) => p.bookings,
      cell: (p) => (
        <span className="inline-flex items-center gap-2">
          <span className="font-semibold tabular-nums">{p.bookings}</span>
          {p.bookings >= 10 && <Badge tone="teal">{t('team.paxFilter.frequent')}</Badge>}
        </span>
      ),
    },
    { key: 'lastLogin', header: t('team.colLastLogin'), sort: (p) => p.lastLogin, cell: (p) => fmtDate(p.lastLogin), td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
    { key: 'logins', header: t('team.colLogins'), sort: (p) => p.logins, cell: (p) => p.logins, td: 'tabular-nums text-muted-foreground' },
    { key: 'updated', header: t('team.colUpdated'), align: 'right', sort: (p) => p.updated, cell: (p) => fmtDate(p.updated), td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
  ];
  return (
    <GlassCard className="overflow-hidden">
      <DataTable
        rows={PASSENGERS}
        columns={cols}
        rowKey={(p) => p.id}
        search={(p) => `${p.name} ${p.phone} ${p.email ?? ''}`}
        searchPlaceholder={t('team.searchPax')}
        empty={t('team.noPax')}
      />
    </GlassCard>
  );
}
