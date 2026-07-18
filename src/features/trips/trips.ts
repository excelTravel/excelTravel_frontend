// Trip row shape rendered by the Trips screens (built from live /trips + /routes + /vehicles in useTripRows).
// A ROUTE (e.g. Kigali → Nyagatare) is a corridor; each dispatch is one TRIP on that route.
export type TripGroup = 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface TripRow {
  id: string;
  from: string;
  to: string;
  kind: string;
  departs: string;
  bus: string;
  driver: string;
  booked: number;
  capacity: number;
  status: string;
  group: TripGroup;
  revenue: number;
  date: string; // day the trip runs
  arrives: string; // estimated arrival time
  progress?: number; // 0..1 along the route (active trips only) — drives the live-bus connector
}

