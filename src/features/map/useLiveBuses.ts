import { useMemo } from 'react';
import { useTracking, useVehicles, useTrips, useRoutes, useDrivers, useMaintenanceLogs } from '@/lib/api/hooks';
import { maintenanceStatus, licenseStatus, type UrgencyStatus } from '@/lib/fleetStatus';

// Live bus positions for the map, from the /tracking snapshot (all current company vehicle locations),
// polled for near-live movement. Each position is enriched with its vehicle plate, driver, current
// passenger count, and locked route. The per-trip socket (useTripLive) drives the individual trip detail;
// this fleet view is the company snapshot.

export type BusStatus = 'in_transit' | 'delayed' | 'arriving';

export interface LiveBus {
  id: string; // vehicleId
  code: string; // plate number
  driverName: string | null;
  routeName: string;
  from: string;
  to: string;
  status: BusStatus;
  eta: string;
  lng: number;
  lat: number;
  passengers: number;
  capacity: number | null;
  maintenance: UrgencyStatus;
  license: UrgencyStatus;
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
  const drivers = useDrivers();
  const maintenance = useMaintenanceLogs();

  return useMemo(() => {
    const vehicleById = new Map((vehicles.data ?? []).map((v) => [v.id, v]));
    const routeById = new Map((routes.data ?? []).map((r) => [r.id, r]));
    const driverById = new Map((drivers.data ?? []).map((d) => [d.id, d]));
    // The live trip currently running on each vehicle (for the route + status label + driver + passengers).
    const tripByVehicle = new Map(
      (trips.data ?? []).filter((tp) => tp.vehicleId && LIVE_TRIP.has(tp.status)).map((tp) => [tp.vehicleId!, tp]),
    );
    // Most recent nextServiceDate per vehicle (logs come back newest-first from the backend).
    const nextServiceByVehicle = new Map<string, string | null>();
    for (const log of maintenance.data ?? []) {
      if (!nextServiceByVehicle.has(log.vehicleId)) nextServiceByVehicle.set(log.vehicleId, log.nextServiceDate);
    }

    return (tracking.data ?? []).map((loc) => {
      const vehicle = vehicleById.get(loc.vehicleId);
      const trip = tripByVehicle.get(loc.vehicleId);
      const route = routeById.get(trip?.routeId ?? vehicle?.routeId ?? '');
      const from = route?.origin ?? '—';
      const to = route?.destination ?? '—';
      const driver = trip?.driverId ? driverById.get(trip.driverId) : (loc.driverId ? driverById.get(loc.driverId) : undefined);
      return {
        id: loc.vehicleId,
        code: vehicle?.plateNumber ?? loc.vehicleId,
        driverName: trip?.driverName ?? driver?.name ?? null,
        routeName: route ? `${from} → ${to}` : '—',
        from,
        to,
        status: busStatus(trip?.status),
        eta: loc.speed != null ? `${Math.round(loc.speed)} km/h` : '',
        lng: loc.longitude,
        lat: loc.latitude,
        passengers: trip?.booked ?? 0,
        capacity: trip?.capacity ?? vehicle?.capacity ?? null,
        maintenance: maintenanceStatus(nextServiceByVehicle.get(loc.vehicleId) ?? null),
        license: licenseStatus(driver?.licenseExpiry ?? null),
      };
    });
  }, [tracking.data, vehicles.data, trips.data, routes.data, drivers.data, maintenance.data]);
}
