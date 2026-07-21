import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { apiFetch } from './client';

// Types mirror the live backend responses (excelTravel_backend). The API returns bare arrays / objects
// (no envelope). Regenerate from openapi.json once it's refreshed; hand-typed here until then.

export interface Me {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'company_admin' | 'manager' | 'agent' | 'driver' | 'passenger';
  companyId: string | null;
  status: 'active' | 'inactive' | 'suspended';
}

export interface ApiRoute {
  id: string;
  companyId: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm: number | null;
  estimatedDurationMin: number | null;
  departureTimes: string[];
  status: 'active' | 'inactive';
}

export interface ApiStop {
  id: string;
  name: string;
  type: 'station' | 'stop';
  parentStationId: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  address: string | null;
}

export interface ApiFare {
  id: string;
  originStationId: string;
  destinationStationId: string;
  fareAmount: number;
  fareSource: 'manual' | 'tapgo';
}

export interface ApiVehicle {
  id: string;
  companyId: string;
  routeId: string | null;
  plateNumber: string;
  model: string | null;
  capacity: number;
  year: number | null;
  status: 'active' | 'maintenance' | 'retired';
  currentKm: number;
}

export interface ApiTrip {
  id: string;
  companyId: string;
  routeId: string;
  vehicleId: string | null;
  driverId: string | null;
  direction: 'outbound' | 'return';
  departureTime: string;
  status: string;
  booked: number;
  capacity: number | null;
  revenue: number;
  driverName: string | null;
  vehiclePlate: string | null;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'company_admin' | 'manager' | 'agent';
  status: 'active' | 'inactive' | 'suspended';
  companyId: string;
}

export interface ApiCompany {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  commissionRate: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface ApiDriver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  rating: number | null;
  status: string;
}

export interface ApiAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  stationIds: string[];
}

export interface ApiBooking {
  id: string;
  tripId: string;
  boardStopId: string;
  alightStopId: string;
  passengerName: string;
  passengerPhone: string | null;
  fareAmount: number;
  paymentMethod: string | null;
  paymentStatus: string;
  status: string;
}

export interface ApiNotification {
  id: string;
  triggerType: string;
  channel: string;
  status: string;
  message: string | null;
  createdAt: string;
}

export interface ApiPackage {
  id: string;
  trackingCode: string;
  senderName: string;
  recipientName: string;
  status: string;
  fee: number | null;
}

// Stable query keys so mutations can invalidate precisely later.
export const qk = {
  me: ['me'] as const,
  routes: ['routes'] as const,
  stops: ['stops'] as const,
  fares: ['fares'] as const,
  vehicles: ['vehicles'] as const,
  trips: ['trips'] as const,
  users: ['users'] as const,
  companies: ['companies'] as const,
  drivers: ['drivers'] as const,
  agents: ['agents'] as const,
  bookings: ['bookings'] as const,
  notifications: ['notifications'] as const,
  packages: ['packages'] as const,
  overview: ['analytics', 'overview'] as const,
  routeRevenue: ['analytics', 'routeRevenue'] as const,
  tracking: ['tracking'] as const,
  tripTemplates: ['tripTemplates'] as const,
  waitlist: ['waitlist'] as const,
  incidents: ['incidents'] as const,
};

export const useMe = () => useQuery({ queryKey: qk.me, queryFn: () => apiFetch<Me>('/me') });
export const useRoutes = () => useQuery({ queryKey: qk.routes, queryFn: () => apiFetch<ApiRoute[]>('/routes') });
export const useStops = () => useQuery({ queryKey: qk.stops, queryFn: () => apiFetch<ApiStop[]>('/stops') });
export const useFares = () => useQuery({ queryKey: qk.fares, queryFn: () => apiFetch<ApiFare[]>('/fares') });
export const useVehicles = () => useQuery({ queryKey: qk.vehicles, queryFn: () => apiFetch<ApiVehicle[]>('/vehicles') });
export const useTrips = () => useQuery({ queryKey: qk.trips, queryFn: () => apiFetch<ApiTrip[]>('/trips') });
export const useUsers = () => useQuery({ queryKey: qk.users, queryFn: () => apiFetch<ApiUser[]>('/users') });
export const useCompanies = () => useQuery({ queryKey: qk.companies, queryFn: () => apiFetch<ApiCompany[]>('/companies') });
export const useDrivers = () => useQuery({ queryKey: qk.drivers, queryFn: () => apiFetch<ApiDriver[]>('/drivers') });
export const useAgents = () => useQuery({ queryKey: qk.agents, queryFn: () => apiFetch<ApiAgent[]>('/agents') });
export const useBookings = () => useQuery({ queryKey: qk.bookings, queryFn: () => apiFetch<ApiBooking[]>('/bookings') });
export const useNotifications = () => useQuery({ queryKey: qk.notifications, queryFn: () => apiFetch<ApiNotification[]>('/notifications') });
export const usePackages = () => useQuery({ queryKey: qk.packages, queryFn: () => apiFetch<ApiPackage[]>('/packages') });

// ---------------------------------------------------------------------------
// New response shapes (mirror excelTravel_backend validation)
// ---------------------------------------------------------------------------

export interface ApiRouteRevenue {
  routeId: string;
  name: string;
  origin: string;
  destination: string;
  revenue: number;
  bookings: number;
}
export interface ApiSourceSplit {
  source: string;
  count: number;
}
export interface ApiOverview {
  dailyRevenue: number;
  revenueMtd: number;
  ticketsToday: number;
  tripsToday: number;
  busesActive: number;
  topRoutes: ApiRouteRevenue[];
  sourceSplit: ApiSourceSplit[];
}

export interface ApiLocation {
  vehicleId: string;
  driverId: string | null;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  timestamp: string;
}

export interface ApiTripSearchResult {
  tripId: string;
  routeId: string;
  departureTime: string;
  status: string;
  vehiclePlate: string | null;
  driverName: string | null;
  boardStopId: string;
  alightStopId: string;
  fare: number | null;
  availableSeats: number;
}

export interface ApiManifestEntry {
  bookingId: string;
  passengerName: string;
  passengerPhone: string | null;
  status: string;
  paymentStatus: string;
  boardStopName: string;
  boardStopOrder: number;
  alightStopName: string;
  alightStopOrder: number;
  boardedAt: string | null;
  alightedAt: string | null;
}

export interface ApiSeatMapLeg {
  legOrder: number;
  fromStopName: string;
  toStopName: string;
  capacity: number;
  occupied: number;
  available: number;
}

export interface ApiTicketValidation {
  found: boolean;
  valid: boolean;
  reason: string;
  bookingId?: string;
  passengerName?: string;
  paymentStatus?: string;
  boarded?: boolean;
}

export interface ApiPassengerLookup {
  found: boolean;
  name?: string;
  source?: string;
}

export interface ApiTripTemplate {
  id: string;
  companyId: string;
  routeId: string;
  direction: 'outbound' | 'return';
  frequency: 'daily' | 'weekly' | 'monthly';
  daysOfWeek: number[];
  dayOfMonth: number | null;
  departureTimes: string[];
  vehicleId: string | null;
  driverId: string | null;
  active: boolean;
  createdAt: string;
}

export interface ApiWaitlistJoiner {
  id: string;
  passengerId: string | null;
  passengerName: string;
  passengerPhone: string;
  currentOriginStopId: string;
  joinedAt: string;
}
export interface ApiWaitlist {
  id: string;
  companyId: string;
  routeId: string;
  status: 'open' | 'dispatched' | 'denied';
  denyReason: string | null;
  dispatchedTripId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  joinerCount: number;
  joiners: ApiWaitlistJoiner[];
}

export interface ApiIncident {
  id: string;
  tripId: string;
  companyId: string;
  reportedBy: string | null;
  imageUrl: string | null;
  description: string;
  status: string;
  oldVehicleId: string | null;
  newVehicleId: string | null;
  approvedBy: string | null;
  opsComment: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiFareImportResult {
  totalRows: number;
  imported: number;
  skipped: { line: number; origin: string; destination: string; reason: string }[];
}

// ---------------------------------------------------------------------------
// Read hooks
// ---------------------------------------------------------------------------

export interface ApiPeakBooking {
  dayOfWeek: number;
  dayName: string;
  hourOfDay: number;
  bookingCount: number;
}
export interface ApiPeakTravel {
  routeId: string;
  routeName: string;
  dayOfWeek: number;
  dayName: string;
  hourOfDay: number;
  passengerCount: number;
}

export const useOverview = () => useQuery({ queryKey: qk.overview, queryFn: () => apiFetch<ApiOverview>('/analytics/overview') });
export const usePeakBooking = () => useQuery({ queryKey: ['analytics', 'peakBooking'], queryFn: () => apiFetch<ApiPeakBooking[]>('/analytics/peak-booking') });
export const usePeakTravel = () => useQuery({ queryKey: ['analytics', 'peakTravel'], queryFn: () => apiFetch<ApiPeakTravel[]>('/analytics/peak-travel') });
export const useRouteRevenue = () => useQuery({ queryKey: qk.routeRevenue, queryFn: () => apiFetch<ApiRouteRevenue[]>('/analytics/routes/revenue') });
export const useTracking = () => useQuery({ queryKey: qk.tracking, queryFn: () => apiFetch<ApiLocation[]>('/tracking') });
export const useTripTemplates = () => useQuery({ queryKey: qk.tripTemplates, queryFn: () => apiFetch<ApiTripTemplate[]>('/trip-templates') });
export const useWaitlists = (status?: 'open' | 'dispatched' | 'denied') =>
  useQuery({ queryKey: [...qk.waitlist, status ?? 'open'], queryFn: () => apiFetch<ApiWaitlist[]>(`/waitlist${status ? `?status=${status}` : ''}`) });
export const useIncidents = (tripId?: string) =>
  useQuery({ queryKey: [...qk.incidents, tripId ?? 'all'], queryFn: () => apiFetch<ApiIncident[]>(`/incidents${tripId ? `?tripId=${tripId}` : ''}`) });
export const useBookingsByTrip = (tripId?: string) =>
  useQuery({ queryKey: [...qk.bookings, tripId ?? 'all'], queryFn: () => apiFetch<ApiBooking[]>(`/bookings${tripId ? `?tripId=${tripId}` : ''}`) });

export const useTripSearch = (params: { originStopId?: string; destStopId?: string; date?: string }) =>
  useQuery({
    queryKey: ['tripSearch', params],
    enabled: Boolean(params.originStopId && params.destStopId),
    queryFn: () => {
      const q = new URLSearchParams({ originStopId: params.originStopId!, destStopId: params.destStopId!, ...(params.date ? { date: params.date } : {}) });
      return apiFetch<ApiTripSearchResult[]>(`/trips/search?${q.toString()}`);
    },
  });

export const useTripManifest = (tripId?: string) =>
  useQuery({ queryKey: ['manifest', tripId], enabled: Boolean(tripId), queryFn: () => apiFetch<ApiManifestEntry[]>(`/trips/${tripId}/manifest`) });
export const useTripFreeSeats = (tripId?: string) =>
  useQuery({ queryKey: ['freeSeats', tripId], enabled: Boolean(tripId), queryFn: () => apiFetch<ApiSeatMapLeg[]>(`/trips/${tripId}/free-seats`) });

// ---------------------------------------------------------------------------
// Mutation layer — each invalidates the query keys it affects
// ---------------------------------------------------------------------------

function useApiMutation<TInput, TOutput>(mutationFn: (input: TInput) => Promise<TOutput>, invalidate: readonly (readonly unknown[])[]) {
  const qc: QueryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => invalidate.forEach((key) => void qc.invalidateQueries({ queryKey: key as unknown[] })),
  });
}

const jsonBody = (data: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(data) });
const patchBody = (data: unknown): RequestInit => ({ method: 'PATCH', body: JSON.stringify(data) });

// Bookings
export const useCreateBooking = () =>
  useApiMutation<Record<string, unknown>, ApiBooking>((b) => apiFetch<ApiBooking>('/bookings', jsonBody(b)), [qk.bookings, qk.trips, qk.overview]);
export const useCancelBooking = () =>
  useApiMutation<{ id: string; reason?: string; override?: boolean }, ApiBooking>(
    ({ id, ...body }) => apiFetch<ApiBooking>(`/bookings/${id}/cancel`, jsonBody(body)),
    [qk.bookings, qk.trips, qk.overview],
  );
export const useUpdatePayment = () =>
  useApiMutation<{ id: string; paymentStatus: string; paymentMethod?: string; note?: string }, ApiBooking>(
    ({ id, ...body }) => apiFetch<ApiBooking>(`/bookings/${id}/payment`, patchBody(body)),
    [qk.bookings, qk.overview],
  );
export const useBoardBooking = () =>
  useApiMutation<{ id: string }, ApiBooking>(({ id }) => apiFetch<ApiBooking>(`/bookings/${id}/board`, { method: 'POST' }), [qk.bookings]);
export const useValidateTicket = () =>
  useApiMutation<{ tripId: string; phone: string }, ApiTicketValidation>(
    ({ tripId, phone }) => apiFetch<ApiTicketValidation>(`/bookings/validate?tripId=${tripId}&phone=${encodeURIComponent(phone)}`),
    [],
  );
export const useLookupPassenger = () =>
  useApiMutation<{ phone: string }, ApiPassengerLookup>(({ phone }) => apiFetch<ApiPassengerLookup>(`/passengers/lookup?phone=${encodeURIComponent(phone)}`), []);

// Trips
export const useUpdateTripStatus = () =>
  useApiMutation<{ id: string; status: string; delayReason?: string }, ApiTrip>(({ id, ...b }) => apiFetch<ApiTrip>(`/trips/${id}/status`, patchBody(b)), [qk.trips, qk.overview]);
export const useUpdateTrip = () =>
  useApiMutation<{ id: string } & Record<string, unknown>, ApiTrip>(({ id, ...b }) => apiFetch<ApiTrip>(`/trips/${id}`, patchBody(b)), [qk.trips]);
// Dispatch controls — send an in-app message to the trip's driver, or broadcast to its passengers.
export const useMessageDriver = () =>
  useApiMutation<{ id: string; message: string }, { sent: boolean }>(({ id, message }) => apiFetch<{ sent: boolean }>(`/trips/${id}/message-driver`, jsonBody({ message })), [qk.notifications]);
export const useBroadcastPassengers = () =>
  useApiMutation<{ id: string; message: string }, { notified: number }>(({ id, message }) => apiFetch<{ notified: number }>(`/trips/${id}/broadcast`, jsonBody({ message })), [qk.notifications]);
export const useCreateTrip = () =>
  useApiMutation<Record<string, unknown>, ApiTrip>((t) => apiFetch<ApiTrip>('/trips', jsonBody(t)), [qk.trips, qk.overview]);

// Trip templates
export const useCreateTemplate = () =>
  useApiMutation<Record<string, unknown>, ApiTripTemplate>((t) => apiFetch<ApiTripTemplate>('/trip-templates', jsonBody(t)), [qk.tripTemplates]);
export const useUpdateTemplate = () =>
  useApiMutation<{ id: string } & Record<string, unknown>, ApiTripTemplate>(({ id, ...b }) => apiFetch<ApiTripTemplate>(`/trip-templates/${id}`, patchBody(b)), [qk.tripTemplates]);
export const useDeleteTemplate = () =>
  useApiMutation<{ id: string }, void>(({ id }) => apiFetch<void>(`/trip-templates/${id}`, { method: 'DELETE' }), [qk.tripTemplates]);
export const useGenerateTrips = () =>
  useApiMutation<{ id: string; from: string; to: string }, { from: string; to: string; created: number; skipped: number }>(
    ({ id, ...b }) => apiFetch(`/trip-templates/${id}/generate`, jsonBody(b)),
    [qk.trips, qk.tripTemplates, qk.overview],
  );

// Waitlist
export const useDispatchWaitlist = () =>
  useApiMutation<{ id: string; departureTime: string; vehicleId?: string; driverId?: string }, ApiWaitlist>(
    ({ id, ...b }) => apiFetch<ApiWaitlist>(`/waitlist/${id}/dispatch`, jsonBody(b)),
    [qk.waitlist, qk.trips],
  );
export const useDenyWaitlist = () =>
  useApiMutation<{ id: string; reason: string }, ApiWaitlist>(({ id, ...b }) => apiFetch<ApiWaitlist>(`/waitlist/${id}/deny`, jsonBody(b)), [qk.waitlist]);

// Incidents
export const useApproveIncident = () =>
  useApiMutation<{ id: string; newVehicleId: string; opsComment?: string; resolution?: string }, ApiIncident>(
    ({ id, ...b }) => apiFetch<ApiIncident>(`/incidents/${id}/approve`, jsonBody(b)),
    [qk.incidents, qk.trips],
  );
export const useRejectIncident = () =>
  useApiMutation<{ id: string; opsComment?: string; resolution?: string }, ApiIncident>(({ id, ...b }) => apiFetch<ApiIncident>(`/incidents/${id}/reject`, jsonBody(b)), [qk.incidents]);
export const useUpdateIncident = () =>
  useApiMutation<{ id: string; opsComment?: string; resolution?: string }, ApiIncident>(({ id, ...b }) => apiFetch<ApiIncident>(`/incidents/${id}`, patchBody(b)), [qk.incidents]);

// Fares
export const useUpsertFare = () =>
  useApiMutation<{ originStationId: string; destinationStationId: string; fareAmount: number; fareSource?: string }, ApiFare>(
    (f) => apiFetch<ApiFare>('/fares', jsonBody(f)),
    [qk.fares],
  );
export const useImportFares = () =>
  useApiMutation<File, ApiFareImportResult>((file) => {
    const form = new FormData();
    form.append('file', file);
    return apiFetch<ApiFareImportResult>('/fares/import', { method: 'POST', body: form });
  }, [qk.fares]);
