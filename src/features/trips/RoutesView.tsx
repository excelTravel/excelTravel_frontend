import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bus, MapPin, Radio, ArrowRight, Circle, CheckCircle2, Clock } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusPill, Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { RevealItem } from '@/components/motion/Motion';
import { deriveRoutes, type RouteSummary, type TripRow } from './trips';
import { formatRWF, cn } from '@/lib/utils';

// Visual "connection of a trip": origin ●─── live bus ───○ destination. The bus sits at `progress` (0..1)
// for a live trip; otherwise the corridor is drawn idle.
function TripConnector({ progress }: { progress: number | null }) {
  const live = progress !== null;
  return (
    <div className="relative my-1 h-6">
      <div className="absolute left-2 right-2 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-border" />
      {live && (
        <div className="absolute left-2 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-teal" style={{ width: `calc((100% - 1rem) * ${progress})` }} />
      )}
      <MapPin className="absolute left-0 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <MapPin className="absolute right-0 top-1/2 size-3.5 -translate-y-1/2 text-primary" />
      {live && (
        <span
          className="absolute top-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-teal text-white shadow ring-2 ring-card"
          style={{ left: `calc(0.5rem + (100% - 1rem) * ${progress})` }}
        >
          <Bus className="size-3.5" />
        </span>
      )}
    </div>
  );
}

export function RoutesView({ trips }: { trips: TripRow[] }) {
  const { t } = useTranslation();
  const routes = deriveRoutes(trips);
  const [open, setOpen] = useState<RouteSummary | null>(null);

  return (
    <>
      <RevealItem className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {routes.map((r) => (
          <GlassCard key={r.key} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  {r.from} <ArrowRight className="size-4 text-muted-foreground" /> {r.to}
                </h3>
                <p className="text-xs text-muted-foreground">{t('routesView.tripsToday', { count: r.trips.length })}</p>
              </div>
              {r.liveCount > 0 && (
                <Badge tone="teal"><Radio className="size-3" /> {t('routesView.liveN', { count: r.liveCount })}</Badge>
              )}
            </div>

            <TripConnector progress={r.active?.progress ?? null} />
            {r.active ? (
              <p className="text-xs text-muted-foreground">
                {t('routesView.tracking', { bus: r.active.bus, departs: r.active.departs })}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {r.nextDeparture ? t('routesView.nextAt', { time: r.nextDeparture }) : t('routesView.noneScheduled')}
              </p>
            )}

            <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('routesView.combinedRevenue')}</p>
                <p className="text-lg font-bold tabular-nums">{formatRWF(r.revenue)}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setOpen(r)}>{t('routesView.viewTrips')}</Button>
            </div>
          </GlassCard>
        ))}
      </RevealItem>

      <RouteTripsModal route={open} onClose={() => setOpen(null)} />
    </>
  );
}

const STATUS_ICON = { active: Radio, scheduled: Clock, completed: CheckCircle2, cancelled: Circle } as const;

function RouteTripsModal({ route, onClose }: { route: RouteSummary | null; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  if (!route) return null;
  const groups: { key: TripRow['group']; trips: TripRow[] }[] = (['active', 'scheduled', 'completed', 'cancelled'] as const)
    .map((key) => ({ key, trips: route.trips.filter((tr) => tr.group === key) }))
    .filter((g) => g.trips.length > 0);

  return (
    <Modal
      open={route !== null}
      onClose={onClose}
      size="lg"
      title={`${route.from} → ${route.to}`}
      description={t('routesView.modalSub', { count: route.trips.length })}
      footer={<Button variant="outline" onClick={onClose}>{t('forms.close')}</Button>}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <Stat label={t('routesView.combinedRevenue')} value={formatRWF(route.revenue)} />
          <Stat label={t('routesView.liveNow')} value={String(route.liveCount)} tone={route.liveCount > 0 ? 'teal' : undefined} />
          <Stat label={t('routesView.scheduledN')} value={String(route.scheduledCount)} />
        </div>

        {groups.map((g) => {
          const Icon = STATUS_ICON[g.key];
          return (
            <section key={g.key}>
              <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Icon className="size-3.5" /> {t(`routesView.group.${g.key}`)}
              </h4>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {g.trips.map((tr) => (
                  <li key={tr.id} className={cn('flex items-center gap-3 px-4 py-3 text-sm', g.key === 'active' && 'bg-teal/5')}>
                    <span className="w-12 shrink-0 font-semibold tabular-nums">{tr.departs}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{tr.bus} · {tr.driver}</p>
                      <p className="text-xs text-muted-foreground">{tr.id} · {tr.booked}/{tr.capacity} · {tr.kind}</p>
                    </div>
                    <StatusPill status={tr.status}>{t(`tripsList.status.${tr.status}`)}</StatusPill>
                    <span className="hidden w-20 text-right font-semibold tabular-nums sm:inline">{tr.revenue ? formatRWF(tr.revenue) : '—'}</span>
                    {g.key === 'active' && (
                      <Button size="sm" onClick={() => { onClose(); navigate(`/trips/${tr.id}`); }}>
                        <Radio className="size-4" /> {t('routesView.trackLive')}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </Modal>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'teal' }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('text-lg font-bold tabular-nums', tone === 'teal' && 'text-teal')}>{value}</p>
    </div>
  );
}
