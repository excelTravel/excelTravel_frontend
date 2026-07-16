import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Users, UserCog, Mail, Phone, MapPin, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusPill, Badge } from '@/components/ui/badge';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { cn } from '@/lib/utils';
import { InviteUserModal, InviteAgentModal, AssignStationModal } from './TeamModals';
import { STAFF, AGENTS, type Agent } from './team';

const TABS = [
  { key: 'users', icon: Users },
  { key: 'agents', icon: UserCog },
] as const;
type TeamTab = (typeof TABS)[number]['key'];

export function TeamPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TeamTab>('users');
  return (
    <Reveal className="space-y-6">
      <RevealItem>
        <div role="tablist" aria-label={t('nav.team')} className="inline-flex gap-1 rounded-xl bg-secondary/60 p-1">
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
      <RevealItem>{tab === 'users' ? <UsersPanel /> : <AgentsPanel />}</RevealItem>
    </Reveal>
  );
}

function UsersPanel() {
  const { t } = useTranslation();
  const [invite, setInvite] = useState(false);
  return (
    <GlassCard className="overflow-hidden">
      <InviteUserModal open={invite} onClose={() => setInvite(false)} />
      <div className="flex items-center justify-between p-5">
        <h3 className="text-base font-semibold">{t('team.tabs.users')}</h3>
        <Button size="sm" onClick={() => setInvite(true)}><Plus className="size-4" /> {t('team.inviteUser')}</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">{t('team.colUser')}</th>
              <th className="px-5 py-3 font-medium">{t('team.colPhone')}</th>
              <th className="px-5 py-3 font-medium">{t('team.colRole')}</th>
              <th className="px-5 py-3 font-medium">{t('team.colStatus')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {STAFF.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-secondary/40">
                <td className="whitespace-nowrap px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{u.name.charAt(0)}</span>
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-5 py-3 tabular-nums text-muted-foreground">{u.phone}</td>
                <td className="px-5 py-3"><Badge tone={u.role === 'company_admin' ? 'info' : u.role === 'manager' ? 'teal' : 'neutral'}>{t(`team.roles.${u.role}`)}</Badge></td>
                <td className="px-5 py-3"><StatusPill status={u.status}>{t(`team.status.${u.status}`)}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

function AgentsPanel() {
  const { t } = useTranslation();
  const [agents, setAgents] = useState(AGENTS);
  const [invite, setInvite] = useState(false);
  const [assign, setAssign] = useState<Agent | null>(null);

  function addStation(id: string, station: string) {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, stations: [...a.stations, station] } : a)));
    setAssign(null);
  }
  function removeStation(id: string, station: string) {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, stations: a.stations.filter((s) => s !== station) } : a)));
  }

  return (
    <div className="space-y-4">
      <InviteAgentModal open={invite} onClose={() => setInvite(false)} />
      <AssignStationModal agent={assign} onClose={() => setAssign(null)} onAssign={addStation} />
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setInvite(true)}><Plus className="size-4" /> {t('team.inviteAgent')}</Button>
      </div>
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
                  {a.stations.length > 0 ? (
                    a.stations.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                        {s}
                        <button type="button" aria-label={t('team.removeStation')} onClick={() => removeStation(a.id, s)} className="text-muted-foreground hover:text-destructive">
                          <X className="size-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('team.noStations')}</span>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-auto" onClick={() => setAssign(a)}>
                <Plus className="size-4" /> {t('team.assignStation')}
              </Button>
            </GlassCard>
          </RevealItem>
        ))}
      </Reveal>
    </div>
  );
}
