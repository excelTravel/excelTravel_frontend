// Realistic fixture data for MSW integration tests, shaped to match the live backend contracts
// (see src/lib/api/hooks.ts). Kept in one place so every integration test sees a consistent, joinable
// dataset (trip.routeId -> route.id, booking.tripId -> trip.id, etc.) instead of ad-hoc per-test stubs.
import type {
  ApiOverview,
  ApiTrip,
  ApiRoute,
  ApiBooking,
  ApiWaitlist,
  ApiTripRequest,
  ApiPeakBooking,
  ApiPeakTravel,
  ApiNotification,
  ApiVehicle,
  ApiDriver,
  ApiAgent,
  ApiUser,
  ApiPassengerSummary,
  ApiPackage,
  ApiCompany,
  ApiStop,
  Me,
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

export const fixturePeakTravel: ApiPeakTravel[] = [
  { routeId: 'route-1', routeName: 'Kigali - Huye', dayOfWeek: 1, dayName: 'Monday', hourOfDay: 7, passengerCount: 22 },
];

export const fixtureVehicles: ApiVehicle[] = [
  { id: 'vehicle-1', companyId: 'company-1', routeId: 'route-1', plateNumber: 'RAA 001 A', model: 'Yutong ZK6122', capacity: 30, year: 2022, status: 'active', currentKm: 45000, photoUrl: null },
  { id: 'vehicle-2', companyId: 'company-1', routeId: 'route-2', plateNumber: 'RAA 002 B', model: 'Toyota Coaster', capacity: 30, year: 2021, status: 'active', currentKm: 62000, photoUrl: null },
];

export const fixtureDrivers: ApiDriver[] = [
  { id: 'driver-1', userId: 'user-driver-1', companyId: 'company-1', name: 'Jean Bosco', email: null, phone: '+250788100001', licenseNumber: 'RW-DL-000001', licenseExpiry: '2028-01-01', status: 'available', photoUrl: null, licenseImageUrl: null, idImageUrl: null },
  { id: 'driver-2', userId: 'user-driver-2', companyId: 'company-1', name: 'Alice Uwase', email: null, phone: '+250788100002', licenseNumber: 'RW-DL-000002', licenseExpiry: '2027-06-01', status: 'on_trip', photoUrl: null, licenseImageUrl: null, idImageUrl: null },
];

export const fixtureAgents: ApiAgent[] = [
  { id: 'agent-1', userId: 'user-agent-1', companyId: 'company-1', name: 'Claudine Ingabire', email: 'claudine@exceltravel.rw', phone: '+250788200001', photoUrl: null, stationIds: ['stop-1'] },
];

export const fixtureUsers: ApiUser[] = [
  { id: 'user-1', name: 'Test Admin', email: 'admin@exceltravel.rw', phone: '+250788000000', role: 'company_admin', status: 'active', companyId: 'company-1', lastLoginAt: '2026-08-15T08:00:00.000Z', loginCount: 12, updatedAt: '2026-08-15T08:00:00.000Z' },
];

export const fixturePassengers: ApiPassengerSummary[] = [
  { passengerId: 'passenger-1', name: 'Eric Niyonzima', phone: '+250788000001', bookings: 5, lastBookingAt: '2026-08-14T10:00:00.000Z', totalSpend: 25000 },
];

export const fixturePackages: ApiPackage[] = [
  {
    id: 'package-1', companyId: 'company-1', senderName: 'Eric Niyonzima', senderPhone: '+250788000001',
    recipientName: 'Grace Mukamana', recipientPhone: '+250788000002', fromStopId: 'stop-1', toStopId: 'stop-2',
    description: 'Documents', tripId: 'trip-1', weightKg: 2, fee: 2000, paymentStatus: 'paid', status: 'in_transit',
    createdAt: '2026-08-15T09:00:00.000Z',
  },
];

export const fixtureCompanies: ApiCompany[] = [
  {
    id: 'company-1', name: 'Excel Travel and Tours', email: 'admin@exceltravel.rw', phone: '+250789449960',
    address: null, logoUrl: null, commissionRate: 30, status: 'active', parcelBaseFeeRwf: 500,
    parcelSurchargePerKgRwf: 100, driverWeeklyHourCap: 48, createdAt: '2026-07-03T00:00:00.000Z',
  },
];

export const fixtureMe: Me = {
  id: 'user-1', name: 'Test Admin', email: 'admin@exceltravel.rw', phone: '+250788000000',
  role: 'company_admin', companyId: 'company-1', status: 'active', avatarUrl: null,
};

export const fixtureTripRequests: ApiTripRequest[] = [
  { id: 'triprequest-1', companyId: 'company-1', routeId: 'route-1', agentId: 'agent-1', agentName: 'Claudine Ingabire', originStopId: 'stop-1', passengerCount: 6, notes: 'morning rush', status: 'open', denyReason: null, dispatchedTripId: null, resolvedAt: null, createdAt: '2026-08-16T06:00:00.000Z' },
  { id: 'triprequest-2', companyId: 'company-1', routeId: 'route-1', agentId: 'agent-2', agentName: 'Eric Habimana', originStopId: 'stop-1', passengerCount: 4, notes: null, status: 'open', denyReason: null, dispatchedTripId: null, resolvedAt: null, createdAt: '2026-08-16T06:10:00.000Z' },
];

export const fixtureStops: ApiStop[] = [
  { id: 'stop-1', name: 'Nyabugogo Station', type: 'station', parentStationId: null, latitude: -1.9536, longitude: 30.0518, phone: '+250788300001', address: 'Nyabugogo, Kigali', adminZoneId: null },
  { id: 'stop-2', name: 'Huye Station', type: 'station', parentStationId: null, latitude: -2.5975, longitude: 29.7392, phone: '+250788300002', address: 'Huye Town', adminZoneId: null },
];
