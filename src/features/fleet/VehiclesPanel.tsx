import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SegmentedDonut } from '@/components/ui/segmented-donut';
import { CountUp } from '@/components/ui/count-up';
import { Async } from '@/components/ui/async';
import { Reveal, RevealItem } from '@/components/motion/Motion';
import { useVehicles, useMaintenanceLogs, useTrips, useRoutes, type ApiVehicle, type ApiTrip, type ApiRoute } from '@/lib/api/hooks';
import { VehicleCard } from './VehicleCard';
import { VehicleDetailModal } from './VehicleDetailModal';
import { AddVehicleModal } from './AddVehicleModal';
import { type Vehicle, type VehicleStatus } from './data';

const nextServiceFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const tripTimeFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const LIVE_STATUSES = new Set(['boarding', 'departed', 'in_transit', 'arriving']);

// A trip's planned origin/destination, swapped for a return leg (route stores one direction's endpoints).
function endpoints(trip: ApiTrip, route: ApiRoute | undefined): string {
  if (!route) return '—';
  const isReturn = trip.direction === 'return';
  const origin = isReturn ? route.destination : route.origin;
  const destination = isReturn ? route.origin : route.destination;
  return `${origin} → ${destination}`;
}

// Map a live /vehicles row onto the Vehicle shape the card renders, joined against this vehicle's own
// trips (client-side, since /vehicles carries no trip data) to find: a trip in progress right now, else
// the next scheduled one, else where its last completed trip ended. nextServiceDate is real — the most
// recent maintenance log's next_service_date for this vehicle, if any.
function toVehicle(v: ApiVehicle, nextServiceDate: string | null, vehicleTrips: ApiTrip[], routeById: Map<string, ApiRoute>): Vehicle {
  const status = (['active', 'maintenance', 'retired'].includes(v.status) ? v.status : 'active') as VehicleStatus;

  const current = vehicleTrips.find((tr) => LIVE_STATUSES.has(tr.status));
  const upcoming = vehicleTrips
    .filter((tr) => tr.status === 'scheduled' || tr.status === 'delayed')
    .sort((a, b) => a.departureTime.localeCompare(b.departureTime))[0];
  const lastCompleted = vehicleTrips
    .filter((tr) => tr.status === 'completed')
    .sort((a, b) => b.departureTime.localeCompare(a.departureTime))[0];
  const lastRoute = lastCompleted ? routeById.get(lastCompleted.routeId) : undefined;
  const lastDestination = lastCompleted && lastRoute
    ? (lastCompleted.direction === 'return' ? lastRoute.origin : lastRoute.destination)
    : null;

  return {
    id: v.id,
    plate: v.plateNumber,
    model: v.model ?? '—',
    capacity: v.capacity,
    year: v.year ?? 0,
    status,
    nextServiceDate: status === 'maintenance' ? 'In service' : status === 'retired' ? '—' : nextServiceDate ? nextServiceFmt.format(new Date(nextServiceDate)) : '—',
    currentTrip: current ? { code: `#${current.tripNo ?? '—'}`, route: endpoints(current, routeById.get(current.routeId)) } : null,
    nextTrip: upcoming
      ? { code: `#${upcoming.tripNo ?? '—'}`, route: endpoints(upcoming, routeById.get(upcoming.routeId)), time: tripTimeFmt.format(new Date(upcoming.departureTime)) }
      : null,
    lastDestination,
    maintenanceSince: null,
    photoUrl: v.photoUrl,
  };
}

const STATUS_COLOR: Record<VehicleStatus, string> = {
  active: 'hsl(var(--teal))',
  maintenance: 'hsl(var(--warning))',
  retired: 'hsl(var(--muted-foreground))',
};

export function VehiclesPanel() {
  const { t } = useTranslation();
  const vehiclesQ = useVehicles();
  const maintenanceQ = useMaintenanceLogs();
  const tripsQ = useTrips();
  const routesQ = useRoutes();
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Logs come back newest-first, so the first one seen per vehicle is its most recent next-service date.
  const nextServiceByVehicle = new Map<string, string | null>();
  for (const log of maintenanceQ.data ?? []) {
    if (!nextServiceByVehicle.has(log.vehicleId)) nextServiceByVehicle.set(log.vehicleId, log.nextServiceDate);
  }

  const routeById = new Map((routesQ.data ?? []).map((r) => [r.id, r]));
  const tripsByVehicle = new Map<string, ApiTrip[]>();
  for (const tr of tripsQ.data ?? []) {
    if (!tr.vehicleId) continue;
    const list = tripsByVehicle.get(tr.vehicleId) ?? [];
    list.push(tr);
    tripsByVehicle.set(tr.vehicleId, list);
  }

  return (
    <div className="space-y-4">
      <VehicleDetailModal vehicle={selected} open={selected !== null} onClose={() => setSelected(null)} />
      <AddVehicleModal open={addOpen} onClose={() => setAddOpen(false)} />

      {/* Toolbar above the cards */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" /> {t('fleet.addVehicle')}
        </Button>
      </div>

      <Async query={vehiclesQ} isEmpty={(d) => d.length === 0} skeleton={<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><div className="shimmer h-56 rounded-2xl" /><div className="shimmer h-56 rounded-2xl" /><div className="shimmer h-56 rounded-2xl" /></div>}>
        {(apiVehicles) => {
          const vehicles = apiVehicles.map((v) => toVehicle(v, nextServiceByVehicle.get(v.id) ?? null, tripsByVehicle.get(v.id) ?? [], routeById));
          const counts = { active: 0, maintenance: 0, retired: 0 } as Record<VehicleStatus, number>;
          for (const v of vehicles) counts[v.status] += 1;
          const total = vehicles.length;
          const utilization = total ? Math.round((counts.active / total) * 100) : 0;
          const composition: { key: VehicleStatus; count: number; color: string }[] = [
            { key: 'active', count: counts.active, color: STATUS_COLOR.active },
            { key: 'maintenance', count: counts.maintenance, color: STATUS_COLOR.maintenance },
            { key: 'retired', count: counts.retired, color: STATUS_COLOR.retired },
          ];
          return (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
              <Reveal className="grid gap-5 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
                {vehicles.map((v) => (
                  <RevealItem key={v.id} className="min-w-0">
                    <VehicleCard vehicle={v} onOpenDetails={() => setSelected(v)} />
                  </RevealItem>
                ))}
              </Reveal>

              {/* Side rail: live 3-colour fleet composition ring */}
              <aside className="space-y-6">
                <GlassCard className="p-5">
                  <div className="flex items-center gap-4">
                    <SegmentedDonut size={116} segments={composition.map((s) => ({ value: s.count, color: s.color }))}>
                      <span className="text-2xl font-bold tabular-nums leading-none">
                        <CountUp value={utilization} format={(n) => `${Math.round(n)}%`} />
                      </span>
                      <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{t('fleet.utilShort')}</span>
                    </SegmentedDonut>
                    <div>
                      <p className="text-3xl font-bold tabular-nums leading-none"><CountUp value={total} /></p>
                      <p className="mt-1 text-xs text-muted-foreground">{t('fleet.vehiclesTracked')}</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-2">
                    {composition.map((s) => (
                      <div key={s.key} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm odd:bg-secondary/40">
                        <span className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                          {t(`vehicles.status.${s.key}`)}
                        </span>
                        <span className="font-semibold tabular-nums"><CountUp value={s.count} /></span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </aside>
            </div>
          );
        }}
      </Async>
    </div>
  );
}
