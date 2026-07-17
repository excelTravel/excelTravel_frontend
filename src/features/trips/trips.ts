// Stub trips (Rwanda). Wired later to /trips (list, filter by status) + /bookings (occupancy).
// A ROUTE (e.g. Kigali → Nyagatare) is a corridor on which many buses are dispatched through the day;
// each dispatch is one TRIP on that route. The reverse (Nyagatare → Kigali) is a separate route.
// deriveRoutes() groups trips by direction so a route can be viewed with its trips combined.
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
  progress?: number; // 0..1 along the route (active trips only) — drives the live-bus connector
}

export const TRIPS: TripRow[] = [
  { id: 'TRP-8492', from: 'Kigali', to: 'Musanze', kind: 'Express', departs: '08:30', bus: 'RAB-402-C', driver: 'S. Uwase', booked: 38, capacity: 40, status: 'in_transit', group: 'active', revenue: 1482000, progress: 0.62 },
  { id: 'TRP-8495', from: 'Kigali', to: 'Rubavu', kind: 'Standard', departs: '09:00', bus: 'RAC-112-D', driver: 'P. Habimana', booked: 22, capacity: 30, status: 'delayed', group: 'active', revenue: 770000, progress: 0.34 },
  { id: 'TRP-8502', from: 'Kigali', to: 'Huye', kind: 'Express', departs: '09:15', bus: 'RAD-088-A', driver: 'L. Ingabire', booked: 40, capacity: 40, status: 'in_transit', group: 'active', revenue: 1520000, progress: 0.78 },
  { id: 'TRP-8506', from: 'Kigali', to: 'Nyagatare', kind: 'Express', departs: '10:30', bus: 'RAB-402-C', driver: 'S. Uwase', booked: 31, capacity: 33, status: 'in_transit', group: 'active', revenue: 1395000, progress: 0.45 },
  { id: 'TRP-8510', from: 'Kigali', to: 'Nyagatare', kind: 'Standard', departs: '11:30', bus: 'RAE-027-B', driver: 'J. Mugabo', booked: 12, capacity: 33, status: 'scheduled', group: 'scheduled', revenue: 0 },
  { id: 'TRP-8512', from: 'Kigali', to: 'Nyagatare', kind: 'Standard', departs: '12:30', bus: 'RAF-051-C', driver: 'C. Umutoni', booked: 5, capacity: 33, status: 'scheduled', group: 'scheduled', revenue: 0 },
  { id: 'TRP-8488', from: 'Kigali', to: 'Nyagatare', kind: 'Express', departs: '07:30', bus: 'RAG-014-B', driver: 'E. Nkusi', booked: 33, capacity: 33, status: 'completed', group: 'completed', revenue: 1485000 },
  { id: 'TRP-8514', from: 'Nyagatare', to: 'Kigali', kind: 'Express', departs: '12:00', bus: 'RAF-051-C', driver: 'C. Umutoni', booked: 27, capacity: 40, status: 'in_transit', group: 'active', revenue: 1026000, progress: 0.28 },
  { id: 'TRP-8516', from: 'Nyagatare', to: 'Kigali', kind: 'Standard', departs: '13:00', bus: 'RAE-027-B', driver: 'J. Mugabo', booked: 9, capacity: 33, status: 'scheduled', group: 'scheduled', revenue: 0 },
  { id: 'TRP-8478', from: 'Kigali', to: 'Rusizi', kind: 'Standard', departs: '06:00', bus: 'RAG-014-B', driver: 'E. Nkusi', booked: 33, capacity: 33, status: 'completed', group: 'completed', revenue: 1650000 },
  { id: 'TRP-8480', from: 'Huye', to: 'Kigali', kind: 'Express', departs: '06:30', bus: 'RAH-009-A', driver: 'M. Uwase', booked: 39, capacity: 40, status: 'completed', group: 'completed', revenue: 1560000 },
  { id: 'TRP-8471', from: 'Kigali', to: 'Nyamata', kind: 'Standard', departs: '05:45', bus: 'RAB-402-C', driver: 'S. Uwase', booked: 4, capacity: 30, status: 'cancelled', group: 'cancelled', revenue: 0 },
];

