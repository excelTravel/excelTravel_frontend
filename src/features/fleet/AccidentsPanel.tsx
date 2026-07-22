import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image as ImageIcon, Check, X, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Field, Select } from '@/components/ui/form';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { Async } from '@/components/ui/async';
import { useIncidents, useApproveIncident, useRejectIncident, useVehicles, useTrips, useRoutes, type ApiIncident, type ApiVehicle } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';

// Live incidents: GET /incidents, POST /{id}/approve { newVehicleId }, POST /{id}/reject. A driver reports an
// on-road accident (photo + description); ops approves (reassigns a bus) or rejects.
const FILTERS = ['all', 'pending', 'approved', 'rejected'] as const;

function ago(iso: string): string {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}

export function AccidentsPanel() {
  const { t } = useTranslation();
  const incidentsQ = useIncidents();
  const vehiclesQ = useVehicles();
  const tripsQ = useTrips();
  const routesQ = useRoutes();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [approve, setApprove] = useState<ApiIncident | null>(null);
  const reject = useRejectIncident();

  const incidents = incidentsQ.data ?? [];
  const plateOf = useMemo(() => {
    const m = new Map((vehiclesQ.data ?? []).map((v) => [v.id, v.plateNumber]));
    return (id: string | null) => (id ? m.get(id) ?? '—' : '—');
  }, [vehiclesQ.data]);
  const routeOf = useMemo(() => {
    const tripRoute = new Map((tripsQ.data ?? []).map((tp) => [tp.id, tp.routeId]));
    const routeName = new Map((routesQ.data ?? []).map((r) => [r.id, `${r.origin} → ${r.destination}`]));
    return (tripId: string) => routeName.get(tripRoute.get(tripId) ?? '') ?? tripId;
  }, [tripsQ.data, routesQ.data]);

  const rows = filter === 'all' ? incidents : incidents.filter((i) => i.status === filter);
  const count = (s: string) => incidents.filter((i) => i.status === s).length;

  return (
    <div className="space-y-6">
      <ApproveModal
        incident={approve}
        vehicles={(vehiclesQ.data ?? []).filter((v) => v.status === 'active')}
        plateOf={plateOf}
        routeOf={routeOf}
        onClose={() => setApprove(null)}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MiniStat label={t('accidents.pending')} value={count('pending')} danger={count('pending') > 0} />
        <MiniStat label={t('accidents.approved')} value={count('approved')} />
        <MiniStat label={t('accidents.rejected')} value={count('rejected')} />
        <MiniStat label={t('accidents.total')} value={incidents.length} />
      </div>

      <div role="tablist" aria-label={t('accidents.title')} className="inline-flex flex-wrap gap-1 rounded-xl bg-secondary/60 p-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`accidents.filter.${f}`)}
          </button>
        ))}
      </div>

      <Async
        query={incidentsQ}
        isEmpty={() => rows.length === 0}
        skeleton={<div className="grid gap-5 lg:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="shimmer h-40 rounded-2xl" />)}</div>}
        empty={<GlassCard className="p-10 text-center"><p className="text-sm font-medium">{t('accidents.emptyTitle')}</p><p className="mt-1 text-sm text-muted-foreground">{t('accidents.emptySub')}</p></GlassCard>}
      >
        {() => (
          <Reveal className="grid gap-5 lg:grid-cols-2">
            {rows.map((inc) => (
              <RevealItem key={inc.id}>
                <GlassCard className="flex h-full gap-4 p-5">
                  <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-secondary/50 text-muted-foreground">
                    {inc.imageUrl ? <img src={inc.imageUrl} alt="" className="size-full object-cover" /> : <ImageIcon className="size-6" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{routeOf(inc.tripId)}</p>
                        <p className="truncate text-xs text-muted-foreground">{ago(inc.createdAt)}</p>
                      </div>
                      <StatusPill status={inc.status}>{t(`accidents.status.${inc.status}`, inc.status)}</StatusPill>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm">{inc.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {inc.newVehicleId && (
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                          {plateOf(inc.oldVehicleId)} <ArrowRight className="size-3" /> {plateOf(inc.newVehicleId)}
                        </span>
                      )}
                      {inc.opsComment && <span>· {inc.opsComment}</span>}
                    </div>
                    {inc.status === 'pending' && (
                      <div className="mt-3 flex gap-2 border-t border-border pt-3">
                        <Button size="sm" className="flex-1" onClick={() => setApprove(inc)}>
                          <Check className="size-4" /> {t('accidents.approve')}
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-destructive hover:text-destructive" disabled={reject.isPending} onClick={() => reject.mutate({ id: inc.id })}>
                          <X className="size-4" /> {t('accidents.reject')}
                        </Button>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </RevealItem>
            ))}
          </Reveal>
        )}
      </Async>
    </div>
  );
}

function ApproveModal({ incident, vehicles, plateOf, routeOf, onClose }: {
  incident: ApiIncident | null;
  vehicles: ApiVehicle[];
  plateOf: (id: string | null) => string;
  routeOf: (tripId: string) => string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [vehicle, setVehicle] = useState('');
  const approve = useApproveIncident();
  if (!incident) return null;
  return (
    <Modal
      open={incident !== null}
      onClose={onClose}
      title={t('accidents.approveTitle')}
      description={t('accidents.approveSub')}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={approve.isPending}>{t('forms.cancel')}</Button>
          <Button disabled={!vehicle || approve.isPending} onClick={() => approve.mutate({ id: incident.id, newVehicleId: vehicle }, { onSuccess: () => { setVehicle(''); onClose(); } })}>
            <Check className="size-4" /> {approve.isPending ? t('forms.saving') : t('accidents.approveReassign')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-secondary/40 p-3 text-sm">
          <p className="font-semibold">{routeOf(incident.tripId)}</p>
          <p className="mt-1 text-muted-foreground">{incident.description}</p>
        </div>
        <Field label={t('accidents.currentBus')}>
          <div className="flex h-10 items-center rounded-lg border border-input bg-secondary/40 px-3 text-sm">{plateOf(incident.oldVehicleId)}</div>
        </Field>
        <Field label={t('accidents.replacementBus')} htmlFor="ap-vehicle" required>
          <Select id="ap-vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
            <option value="" disabled>{t('forms.selectVehicle')}</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.plateNumber}</option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

function MiniStat({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <GlassCard className="p-4">
      <p className={danger ? 'text-sm font-medium text-destructive' : 'text-sm font-medium text-muted-foreground'}>{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </GlassCard>
  );
}
