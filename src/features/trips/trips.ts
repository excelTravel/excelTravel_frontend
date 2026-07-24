// Trip row shape rendered by the Trips screens (built from live /trips + /routes in useTripRows).
// A ROUTE (e.g. Kigali → Nyagatare) is a corridor; each dispatch is one TRIP on that route, with its own
// planned origin/destination (the route endpoints, swapped for a return trip).
export type TripGroup = 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface TripRow {
  id: string;
  tripNo: number | null;
  origin: string;
  destination: string;
  direction: string;
  date: string; // day the trip runs
  departs: string; // scheduled departure time
  arrives: string; // actual arrival time (logged on completion) or '—'
  booked: number;
  capacity: number;
  bus: string;
  driver: string;
  status: string;
  group: TripGroup;
  revenue: number;
  departureAt: string; // ISO, for sorting
}
