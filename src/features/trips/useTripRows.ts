import { useTrips, useRoutes, useVehicles } from '@/lib/api/hooks';
import type { TripRow, TripGroup } from './trips';

// Backend trip status → the UI's coarse group.
function toGroup(status: string): TripGroup {
  if (status === 'scheduled') return 'scheduled';
  if (status === 'completed') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'active'; // boarding / in_transit / delayed
}

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

// Joins live /trips with /routes (for from→to) and /vehicles (for the plate) into the TripRow shape the
// Trips screens already render. Occupancy/revenue/driver aren't in these endpoints yet, so they degrade
// to 0 / — (see docs/integration-map.md — needs bookings aggregation + a driver join).
export function useTripRows() {
  const trips = useTrips();
  const routes = useRoutes();
  const vehicles = useVehicles();

  const routeById = new Map((routes.data ?? []).map((r) => [r.id, r]));
  const vehById = new Map((vehicles.data ?? []).map((v) => [v.id, v]));

  const rows: TripRow[] = (trips.data ?? []).map((t) => {
    const r = routeById.get(t.routeId);
    const v = vehById.get(t.vehicleId);
    const group = toGroup(t.status);
    const dep = new Date(t.departureTime);
    const durMin = r?.estimatedDurationMin ?? 0;
    const arr = new Date(dep.getTime() + durMin * 60_000);
    return {
      id: t.id,
      from: r?.origin ?? '—',
      to: r?.destination ?? '—',
      kind: t.direction === 'return' ? 'Return' : 'Outbound',
      date: dep.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      departs: fmtTime(t.departureTime),
      arrives: durMin ? fmtTime(arr.toISOString()) : '—',
      bus: v?.plateNumber ?? '—',
      driver: '—',
      booked: 0,
      capacity: v?.capacity ?? 0,
      status: t.status,
      group,
      revenue: 0,
      progress: group === 'active' ? 0.5 : undefined,
    };
  });

  return {
    data: rows,
    isLoading: trips.isLoading || routes.isLoading || vehicles.isLoading,
    isError: trips.isError || routes.isError || vehicles.isError,
    refetch: () => { void trips.refetch(); void routes.refetch(); void vehicles.refetch(); },
  };
}
