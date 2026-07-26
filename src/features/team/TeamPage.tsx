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
import { useUsers, useAgents, usePassengers, type ApiUser, type ApiPassengerSummary } from '@/lib/api/hooks';
import { InviteUserModal, EditUserModal } from './TeamModals';
import { formatRWF } from '@/lib/utils';

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export function TeamPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'staff' | 'passengers'>('staff');
  const [invite, setInvite] = useState(false);
  const usersQ = useUsers();
  const passengersQ = usePassengers();
  const users = usersQ.data ?? [];

  // One fixed KPI row across sub-sections — no layout shift.
  const cards = [
    { label: t('team.kpiStaff'), value: users.length },
    { label: t('team.kpiAgents'), value: users.filter((u) => u.role === 'agent').length },
    { label: t('team.kpiPassengers'), value: passengersQ.data?.length ?? 0 },
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
        {tab === 'staff' ? <StaffPanel query={usersQ} onInvite={() => setInvite(true)} /> : <PassengersPanel query={passengersQ} />}
      </RevealItem>
    </Reveal>
  );
}

// Staff = all company users (managers, admins AND agents), with login history. Backend /users already
// returns agents by role, so staff + agents live in one list.
function StaffPanel({ query, onInvite }: { query: ReturnType<typeof useUsers>; onInvite: () => void }) {
  const { t } = useTranslation();
  const [editUser, setEditUser] = useState<ApiUser | null>(null);
  const agentsQ = useAgents();
  const editAgent = editUser?.role === 'agent' ? (agentsQ.data?.find((a) => a.userId === editUser.id) ?? null) : null;
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
    { key: 'logins', header: t('team.colLogins'), sort: (u) => u.loginCount, cell: (u) => u.loginCount, td: 'tabular-nums text-muted-foreground' },
    { key: 'lastLogin', header: t('team.colLastLogin'), sort: (u) => u.lastLoginAt ?? '', cell: (u) => fmtDate(u.lastLoginAt), td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
    { key: 'updated', header: t('team.colUpdated'), align: 'right', sort: (u) => u.updatedAt, cell: (u) => fmtDate(u.updatedAt), td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
  ];
  return (
    <GlassCard className="overflow-hidden">
      <EditUserModal user={editUser} agent={editAgent} open={editUser !== null} onClose={() => setEditUser(null)} />
      <Async query={query} skeleton={<div className="space-y-2 p-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-9 rounded" />)}</div>}>
        {(data) => (
          <DataTable
            rows={data}
            columns={cols}
            rowKey={(u) => u.id}
            onRowClick={(u) => setEditUser(u)}
            search={(u) => `${u.name} ${u.email} ${u.phone}`}
            searchPlaceholder={t('team.searchStaff')}
            toolbarRight={<Button size="sm" onClick={onInvite}><Plus className="size-4" /> {t('team.inviteUser')}</Button>}
          />
        )}
      </Async>
    </GlassCard>
  );
}

// Passengers who have booked with this company (GET /passengers, derived from bookings). Booking count,
// last booking and total spend are all real; there is no login history for passengers here.
function PassengersPanel({ query }: { query: ReturnType<typeof usePassengers> }) {
  const { t } = useTranslation();
  const cols: Column<ApiPassengerSummary>[] = [
    {
      key: 'user', header: t('team.colUser'), sort: (p) => p.name,
      cell: (p) => (
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{p.name.charAt(0)}</span>
          <p className="font-medium">{p.name}</p>
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
    { key: 'spend', header: t('team.colSpend'), align: 'right', sort: (p) => p.totalSpend, cell: (p) => formatRWF(p.totalSpend), td: 'whitespace-nowrap font-semibold tabular-nums' },
    { key: 'lastBooking', header: t('team.colLastBooking'), align: 'right', sort: (p) => p.lastBookingAt ?? '', cell: (p) => fmtDate(p.lastBookingAt), td: 'whitespace-nowrap tabular-nums text-muted-foreground' },
  ];
  return (
    <GlassCard className="overflow-hidden">
      <Async query={query} isEmpty={(d) => d.length === 0} skeleton={<div className="space-y-2 p-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-9 rounded" />)}</div>} empty={<div className="px-6 py-12 text-center text-sm text-muted-foreground">{t('team.noPax')}</div>}>
        {(data) => (
          <DataTable
            rows={data}
            columns={cols}
            rowKey={(p) => p.phone}
            search={(p) => `${p.name} ${p.phone}`}
            searchPlaceholder={t('team.searchPax')}
            empty={t('team.noPax')}
          />
        )}
      </Async>
    </GlassCard>
  );
}
