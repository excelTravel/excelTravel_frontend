// Realistic fixture data for MSW integration tests, shaped to match the live backend contracts
// (see src/lib/api/hooks.ts). Kept in one place so every integration test sees a consistent, joinable
// dataset (trip.routeId -> route.id, booking.tripId -> trip.id, etc.) instead of ad-hoc per-test stubs.
import type {
  ApiOverview,
  ApiTrip,
  ApiRoute,
  ApiBooking,
  ApiWaitlist,
  ApiPeakBooking,
  ApiNotification,
} from '@/lib/api/hooks';

export const fixtureRoutes: ApiRoute[] = [
  {
    id: 'route-1',
    companyId: 'company-1',
    name: 'Kigali - Huye',
    origin: 'Kigali',
    destination: 'Huye',
    distanceKm: 135,
    estimatedDurationMin: 150,
    departureTimes: ['06:00', '14:00'],
    status: 'active',
  },
  {
    id: 'route-2',
    companyId: 'company-1',
    name: 'Kigali - Musanze',
    origin: 'Kigali',
    destination: 'Musanze',
    distanceKm: 106,
    estimatedDurationMin: 120,
    departureTimes: ['07:00'],
    status: 'active',
  },
];

export const fixtureTrips: ApiTrip[] = [
  {
    id: 'trip-1',
    tripNo: 101,
    companyId: 'company-1',
    routeId: 'route-1',
    vehicleId: 'vehicle-1',
    driverId: 'driver-1',
    direction: 'outbound',
    departureTime: '2026-08-06T06:00:00.000Z',
    arrivalTime: null,
    status: 'scheduled',
    booked: 12,
    capacity: 30,
    revenue: 60000,
    driverName: 'Jean Bosco',
    vehiclePlate: 'RAA 001 A',
  },
  {
    id: 'trip-2',
    tripNo: 102,
    companyId: 'company-1',
    routeId: 'route-2',
    vehicleId: 'vehicle-2',
    driverId: 'driver-2',
    direction: 'outbound',
    departureTime: '2026-08-06T07:00:00.000Z',
    arrivalTime: null,
    status: 'in_transit',
    booked: 20,
    capacity: 30,
    revenue: 100000,
    driverName: 'Alice Uwase',
    vehiclePlate: 'RAA 002 B',
  },
];

export const fixtureBookings: ApiBooking[] = [
  {
    id: 'booking-1',
    tripId: 'trip-1',
    boardStopId: 'stop-1',
    alightStopId: 'stop-2',
    passengerName: 'Eric Niyonzima',
    passengerPhone: '+250788000001',
    fareAmount: 5000,
    paymentMethod: 'mobile_money',
    paymentStatus: 'paid',
    status: 'confirmed',
    bookingSource: 'agent',
  },
  {
    id: 'booking-2',
    tripId: 'trip-2',
    boardStopId: 'stop-3',
    alightStopId: 'stop-4',
    passengerName: 'Grace Mukamana',
    passengerPhone: '+250788000002',
    fareAmount: 5000,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    status: 'confirmed',
    bookingSource: 'app',
  },
];

export const fixtureWaitlists: ApiWaitlist[] = [
  {
    id: 'waitlist-1',
    companyId: 'company-1',
    routeId: 'route-1',
    status: 'open',
    denyReason: null,
    dispatchedTripId: null,
    resolvedAt: null,
    createdAt: '2026-08-06T05:00:00.000Z',
    joinerCount: 2,
    joiners: [],
  },
];

export const fixturePeakBooking: ApiPeakBooking[] = [
  { dayOfWeek: 1, dayName: 'Monday', hourOfDay: 8, bookingCount: 14 },
];

export const fixtureOverview: ApiOverview = {
  dailyRevenue: 160000,
  revenueMtd: 2400000,
  ticketsToday: 32,
  tripsToday: 6,
  busesActive: 4,
  topRoutes: [
    { routeId: 'route-1', name: 'Kigali - Huye', origin: 'Kigali', destination: 'Huye', revenue: 900000, bookings: 40 },
    { routeId: 'route-2', name: 'Kigali - Musanze', origin: 'Kigali', destination: 'Musanze', revenue: 600000, bookings: 25 },
  ],
  sourceSplit: [
    { source: 'agent', count: 30 },
    { source: 'app', count: 20 },
  ],
};

export const fixtureNotifications: ApiNotification[] = [];
