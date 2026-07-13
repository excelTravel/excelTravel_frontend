import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, MoreVertical, Plus } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/ui/kpi-card';
import { GlassCard } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Stub active-trip data (Rwanda). Wired later to /trips (active) + /tracking (ETA/progress) + /vehicles + /me.
type TripStatus = 'on_schedule' | 'delayed' | 'approaching';
interface FleetTrip {
  code: string;
  status: TripStatus;
  eta: string;
  etaNote?: string;
  routeName: string;
  from: string;
  to: string;
  progress: number;
  progressTone: 'ok' | 'late';
  time: string;
  note: string;
  driver: string;
  vehicle: string;
}

const trips: FleetTrip[] = [
  { code: 'TRP-8492', status: 'on_schedule', eta: '14:30', routeName: 'Nyabugogo Express', from: 'Nyabugogo', to: 'Huye', progress: 65, progressTone: 'ok', time: '13:00', note: '65% complete', driver: 'M. Uwase', vehicle: 'Bus RAB402' },
  { code: 'TRP-8495', status: 'delayed', eta: '15:15', etaNote: '+15 min', routeName: 'Eastern Shuttle', from: 'Remera', to: 'Nyagatare', progress: 40, progressTone: 'late', time: '14:00', note: 'Traffic alert', driver: 'S. Habimana', vehicle: 'Van RAC112' },
  { code: 'TRP-8502', status: 'approaching', eta: '14:05', routeName: 'Musanze Coach', from: 'Kigali', to: 'Musanze', progress: 92, progressTone: 'ok', time: '13:45', note: '< 5 mins away', driver: 'L. Ingabire', vehicle: 'Coach RAD88' },
];

const statusToPill: Record<TripStatus, string> = { on_schedule: 'completed', delayed: 'cancelled', approaching: 'arrived' };

function TripCard({ trip, statusLabel }: { trip: FleetTrip; statusLabel: string }) {
  const late = trip.status === 'delayed';
  return (
    <GlassCard className="flex flex-col p-5">
      <div className="flex items-start justify-between">
        <StatusPill status={statusToPill[trip.status]} className="capitalize">
          {statusLabel}
        </StatusPill>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">ETA</p>
          <p className={cn('text-2xl font-bold tabular-nums', late ? 'text-destructive' : 'text-primary')}>{trip.eta}</p>
          {trip.etaNote && <p className="text-xs font-medium text-destructive">{trip.etaNote}</p>}
        </div>
      </div>

      <p className="mt-3 text-lg font-bold tracking-tight">{trip.code}</p>
      <p className="text-sm text-muted-foreground">{trip.routeName}</p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>{trip.from}</span>
          <span>{trip.to}</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className={cn('h-full rounded-full', trip.progressTone === 'late' ? 'bg-destructive' : 'bg-teal')}
            style={{ width: `${trip.progress}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground tabular-nums">{trip.time}</span>
          <span className={late ? 'font-medium text-destructive' : 'text-muted-foreground'}>{trip.note}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {trip.driver.slice(0, 1)}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-medium">{trip.driver}</p>
            <p className="text-xs text-muted-foreground">{trip.vehicle}</p>
          </div>
        </div>
        <button type="button" aria-label="More" className="text-muted-foreground hover:text-foreground">
          <MoreVertical className="size-4" />
        </button>
      </div>
    </GlassCard>
  );
}

export function FleetPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<'card' | 'list'>('card');
  const statusLabels: Record<TripStatus, string> = {
    on_schedule: t('fleet.onSchedule'),
    delayed: t('fleet.delayed'),
    approaching: t('fleet.approaching'),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('fleet.title')}
        subtitle={t('fleet.subtitle')}
        actions={
          <>
            <Button variant="outline" size="sm">
              <Filter className="size-4" /> {t('fleet.filter')}
            </Button>
            <Button size="sm">
              <Plus className="size-4" /> {t('fleet.addVehicle')}
            </Button>
          </>
        }
      />

      {/* KPIs — /vehicles (count), /trips (active), /maintenance (alerts), computed efficiency */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t('fleet.totalFleet')} value="142" delta={{ value: '+2%', direction: 'up' }} />
        <KpiCard label={t('fleet.activeRoutes')} value="87" delta={{ value: '+5%', direction: 'up' }} />
        <KpiCard label={t('fleet.maintenanceAlerts')} value="12" tone="danger" badge={{ text: t('fleet.actionRequired'), tone: 'danger' }} />
        <KpiCard label={t('fleet.fleetEfficiency')} value="94%" badge={{ text: t('fleet.optimal'), tone: 'success' }} />
      </div>

      {/* View toggle */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-sm">
          {(['card', 'list'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={cn(
                'rounded-md px-3 py-1.5 font-medium transition-colors',
                view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {v === 'card' ? t('fleet.cardView') : t('fleet.listView')}
            </button>
          ))}
        </div>
      </div>

      {view === 'card' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {trips.map((tr) => (
            <TripCard key={tr.code} trip={tr} statusLabel={statusLabels[tr.status]} />
          ))}
        </div>
      ) : (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Trip</th>
                <th className="px-5 py-3 font-medium">Route</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">ETA</th>
                <th className="px-5 py-3 font-medium">Driver</th>
                <th className="px-5 py-3 font-medium">Vehicle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {trips.map((tr) => (
                <tr key={tr.code} className="transition-colors hover:bg-secondary/40">
                  <td className="px-5 py-3 font-medium">{tr.code}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {tr.from} → {tr.to}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill status={statusToPill[tr.status]}>{statusLabels[tr.status]}</StatusPill>
                  </td>
                  <td className="px-5 py-3 tabular-nums">{tr.eta}</td>
                  <td className="px-5 py-3">{tr.driver}</td>
                  <td className="px-5 py-3 text-muted-foreground">{tr.vehicle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}
