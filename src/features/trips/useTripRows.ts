import { useTrips, useRoutes } from '@/lib/api/hooks';
import type { TripRow, TripGroup } from './trips';

// Backend trip status → the UI's coarse group.
function toGroup(status: string): TripGroup {
  if (status === 'scheduled' || status === 'delayed') return 'scheduled';
  if (status === 'completed') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'active'; // boarding / departed / in_transit / arriving
}

// Upcoming first: scheduled on top, then active, then completed, then cancelled at the bottom.
const GROUP_ORDER: Record<TripGroup, number> = { scheduled: 0, active: 1, completed: 2, cancelled: 3 };

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

// Joins live /trips with /routes for each trip's planned origin/destination (the route endpoints, swapped
// for a return trip). Passengers, bus, driver and revenue come straight off the enriched /trips payload.
export function useTripRows() {
  const trips = useTrips();
  const routes = useRoutes();

  const routeById = new Map((routes.data ?? []).map((r) => [r.id, r]));

  const rows: TripRow[] = (trips.data ?? []).map((t) => {
    const r = routeById.get(t.routeId);
    const isReturn = t.direction === 'return';
    const origin = r ? (isReturn ? r.destination : r.origin) : '—';
    const destination = r ? (isReturn ? r.origin : r.destination) : '—';
    const dep = new Date(t.departureTime);
    return {
      id: t.id,
      tripNo: t.tripNo,
      origin,
      destination,
      direction: isReturn ? 'Return' : 'Outbound',
      date: dep.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }),
      departs: fmtTime(t.departureTime),
      arrives: t.arrivalTime ? fmtTime(t.arrivalTime) : '—',
      booked: t.booked,
      capacity: t.capacity ?? 0,
      bus: t.vehiclePlate ?? '—',
      driver: t.driverName ?? '—',
      status: t.status,
      group: toGroup(t.status),
      revenue: t.revenue,
      departureAt: t.departureTime,
    };
  });

  // Scheduled up top (soonest first), completed/cancelled at the bottom (most recent first).
  rows.sort((a, b) => {
    const g = GROUP_ORDER[a.group] - GROUP_ORDER[b.group];
    if (g !== 0) return g;
    const asc = a.group === 'scheduled' || a.group === 'active';
    return asc ? a.departureAt.localeCompare(b.departureAt) : b.departureAt.localeCompare(a.departureAt);
  });

  return {
    data: rows,
    isLoading: trips.isLoading || routes.isLoading,
    isError: trips.isError || routes.isError,
    refetch: () => { void trips.refetch(); void routes.refetch(); },
  };
}
