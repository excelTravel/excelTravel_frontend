import { useMemo } from 'react';
import { useTracking, useVehicles, useTrips, useRoutes } from '@/lib/api/hooks';

// Live bus positions for the map, from the /tracking snapshot (all current company vehicle locations),
// polled for near-live movement. Each position is enriched with its vehicle plate and locked route. The
// per-trip socket (useTripLive) drives the individual trip detail; this fleet view is the company snapshot.

export type BusStatus = 'in_transit' | 'delayed' | 'arriving';

export interface LiveBus {
  id: string;
  code: string;
  routeName: string;
  from: string;
  to: string;
  status: BusStatus;
  eta: string;
  lng: number;
  lat: number;
}

type Coord = [number, number];
type Hub = 'kigali' | 'musanze' | 'rubavu' | 'huye' | 'nyagatare';

// Key intercity hubs (lng, lat).
const HUB: Record<Hub, Coord> = {
  kigali: [30.0606, -1.9441],
  musanze: [29.6349, -1.4998],
  rubavu: [29.2586, -1.6777],
  huye: [29.7407, -2.5967],
  nyagatare: [30.3272, -1.2929],
};

// Corridors drawn on the map (Kigali is the national hub).
export const RWANDA_ROUTES: { id: string; coords: Coord[] }[] = [
  { id: 'kgl-mus', coords: [HUB.kigali, HUB.musanze] },
  { id: 'kgl-rub', coords: [HUB.kigali, HUB.rubavu] },
  { id: 'kgl-huy', coords: [HUB.kigali, HUB.huye] },
  { id: 'kgl-nyg', coords: [HUB.kigali, HUB.nyagatare] },
];

const LIVE_TRIP = new Set(['boarding', 'departed', 'in_transit', 'arriving']);
function busStatus(tripStatus: string | undefined): BusStatus {
  if (tripStatus === 'arriving') return 'arriving';
  if (tripStatus === 'delayed') return 'delayed';
  return 'in_transit';
}

export function useLiveBuses(): LiveBus[] {
  const tracking = useTracking();
  const vehicles = useVehicles();
  const trips = useTrips();
  const routes = useRoutes();

  return useMemo(() => {
    const vehicleById = new Map((vehicles.data ?? []).map((v) => [v.id, v]));
    const routeById = new Map((routes.data ?? []).map((r) => [r.id, r]));
    // The live trip currently running on each vehicle (for the route + status label).
    const tripByVehicle = new Map(
      (trips.data ?? []).filter((tp) => tp.vehicleId && LIVE_TRIP.has(tp.status)).map((tp) => [tp.vehicleId!, tp]),
    );

    return (tracking.data ?? []).map((loc) => {
      const vehicle = vehicleById.get(loc.vehicleId);
      const trip = tripByVehicle.get(loc.vehicleId);
      const route = routeById.get(trip?.routeId ?? vehicle?.routeId ?? '');
      const from = route?.origin ?? '—';
      const to = route?.destination ?? '—';
      return {
        id: loc.vehicleId,
        code: vehicle?.plateNumber ?? loc.vehicleId,
        routeName: route ? `${from} → ${to}` : '—',
        from,
        to,
        status: busStatus(trip?.status),
        eta: loc.speed != null ? `${Math.round(loc.speed)} km/h` : '',
        lng: loc.longitude,
        lat: loc.latitude,
      };
    });
  }, [tracking.data, vehicles.data, trips.data, routes.data]);
}
