import { useMutation, useQuery, useQueries, useInfiniteQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { apiFetch, apiFetchPaged, type Page } from './client';

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

export interface ApiRouteStop {
  id: string;
  stopId: string;
  stopOrder: number;
  distanceFromOriginKm: number | null;
}

export interface ApiRouteWithStops extends ApiRoute {
  stops?: ApiRouteStop[];
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
  tripNo: number | null;
  companyId: string;
  routeId: string;
  vehicleId: string | null;
  driverId: string | null;
  direction: 'outbound' | 'return';
  departureTime: string;
  arrivalTime: string | null;
  status: string;
  booked: number;
  capacity: number | null;
  revenue: number;
  driverName: string | null;
  vehiclePlate: string | null;
  // Present on the single-trip fetch (GET /trips/:id): the instantiated stops and per-leg seat map.
  stops?: ApiTripStop[];
  seatMap?: ApiSeatMapLeg[];
}

export interface ApiTripStop {
  id: string;
  stopId: string | null;
  stopName: string;
  stopOrder: number;
  status: string;
  estimatedArrival: string | null;
  actualArrival: string | null;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'company_admin' | 'manager' | 'agent';
  status: 'active' | 'inactive' | 'suspended';
  companyId: string;
  lastLoginAt: string | null;
  loginCount: number;
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
  parcelBaseFeeRwf: number | null;
  parcelSurchargePerKgRwf: number | null;
  driverWeeklyHourCap: number | null;
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
  photoUrl: string | null;
  licenseImageUrl: string | null;
  idImageUrl: string | null;
}

export interface ApiAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  photoUrl: string | null;
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

export interface ApiPackageEvent {
  id: string;
  event: string;
  actorUserId: string | null;
  stopId: string | null;
  photoUrl: string | null;
  notes: string | null;
  createdAt: string;
}
export interface ApiPackage {
  id: string;
  companyId: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  fromStopId: string;
  toStopId: string;
  description: string;
  fee: number | null;
  paymentStatus: string;
  status: string;
  createdAt: string;
  events?: ApiPackageEvent[];
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
  passengers: ['passengers'] as const,
  overview: ['analytics', 'overview'] as const,
  routeRevenue: ['analytics', 'routeRevenue'] as const,
  tracking: ['tracking'] as const,
  tripTemplates: ['tripTemplates'] as const,
  waitlist: ['waitlist'] as const,
  incidents: ['incidents'] as const,
  driverShifts: ['driverShifts'] as const,
};

// Header date-range picker's selected bounds, as accepted by the `from`/`to`-aware list/analytics
// endpoints (see src/store/dateRange.ts `rangeToQuery`). Appended to the query string only when both
// bounds are present, and folded into the query key so each range gets its own cache entry.
export interface RangeQuery {
  from?: string;
  to?: string;
}

function withRange(path: string, range?: RangeQuery): string {
  if (!range?.from || !range?.to) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`;
}

export const useMe = () => useQuery({ queryKey: qk.me, queryFn: () => apiFetch<Me>('/me') });
export const useRoutes = () => useQuery({ queryKey: qk.routes, queryFn: () => apiFetch<ApiRoute[]>('/routes') });
// Single route with its ordered stops (GET /routes/:id) — used to read per-route fare legs.
export const useRoute = (routeId?: string) =>
  useQuery({ queryKey: [...qk.routes, routeId], enabled: Boolean(routeId), queryFn: () => apiFetch<ApiRouteWithStops>(`/routes/${routeId}`) });
export const useStops = () => useQuery({ queryKey: qk.stops, queryFn: () => apiFetch<ApiStop[]>('/stops') });
export const useFares = () => useQuery({ queryKey: qk.fares, queryFn: () => apiFetch<ApiFare[]>('/fares') });
export const useVehicles = () => useQuery({ queryKey: qk.vehicles, queryFn: () => apiFetch<ApiVehicle[]>('/vehicles') });
export const useTrips = (range?: RangeQuery) =>
  useQuery({ queryKey: [...qk.trips, range?.from, range?.to], queryFn: () => apiFetch<ApiTrip[]>(withRange('/trips', range)) });
export const useUsers = () => useQuery({ queryKey: qk.users, queryFn: () => apiFetch<ApiUser[]>('/users') });
export const useCompanies = () => useQuery({ queryKey: qk.companies, queryFn: () => apiFetch<ApiCompany[]>('/companies') });
export const useDrivers = () => useQuery({ queryKey: qk.drivers, queryFn: () => apiFetch<ApiDriver[]>('/drivers') });
export const useAgents = () => useQuery({ queryKey: qk.agents, queryFn: () => apiFetch<ApiAgent[]>('/agents') });
export const useBookings = (range?: RangeQuery) =>
  useQuery({ queryKey: [...qk.bookings, range?.from, range?.to], queryFn: () => apiFetch<ApiBooking[]>(withRange('/bookings', range)) });
export const useNotifications = () => useQuery({ queryKey: qk.notifications, queryFn: () => apiFetch<ApiNotification[]>('/notifications') });
export const usePackages = (range?: RangeQuery) =>
  useQuery({ queryKey: [...qk.packages, range?.from, range?.to], queryFn: () => apiFetch<ApiPackage[]>(withRange('/packages', range)) });
export interface ApiPassengerSummary {
  passengerId: string | null;
  name: string;
  phone: string;
  bookings: number;
  lastBookingAt: string | null;
  totalSpend: number;
}
export const usePassengers = () => useQuery({ queryKey: qk.passengers, queryFn: () => apiFetch<ApiPassengerSummary[]>('/passengers') });

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
  bookingSource: string;
  fareAmount: number;
  boardedAt: string | null;
  alightedAt: string | null;
}

export interface ApiTripLogEntry {
  type: 'published' | 'first_booking' | 'departed' | 'stop_arrival' | 'completed';
  at: string;
  stopName: string | null;
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

// Coarse incident type (backend migration 016) so ops can see which kind of incident happens most,
// per route/bus. Existing rows predating the migration backfill to 'other'.
export type ApiIncidentCategory = 'mechanical' | 'collision' | 'medical' | 'road_hazard' | 'weather' | 'other';

export interface ApiIncident {
  id: string;
  tripId: string;
  companyId: string;
  reportedBy: string | null;
  imageUrl: string | null;
  description: string;
  category: ApiIncidentCategory;
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

export const useOverview = (range?: RangeQuery) =>
  useQuery({ queryKey: [...qk.overview, range?.from, range?.to], queryFn: () => apiFetch<ApiOverview>(withRange('/analytics/overview', range)) });
export const usePeakBooking = () => useQuery({ queryKey: ['analytics', 'peakBooking'], queryFn: () => apiFetch<ApiPeakBooking[]>('/analytics/peak-booking') });
export const usePeakTravel = () => useQuery({ queryKey: ['analytics', 'peakTravel'], queryFn: () => apiFetch<ApiPeakTravel[]>('/analytics/peak-travel') });
export const useRouteRevenue = (range?: RangeQuery) =>
  useQuery({ queryKey: [...qk.routeRevenue, range?.from, range?.to], queryFn: () => apiFetch<ApiRouteRevenue[]>(withRange('/analytics/routes/revenue', range)) });
// Company-wide live vehicle positions; polled for near-live movement on the fleet map.
export const useTracking = () => useQuery({ queryKey: qk.tracking, queryFn: () => apiFetch<ApiLocation[]>('/tracking'), refetchInterval: 10_000 });

export interface ApiMaintenanceLog {
  id: string;
  vehicleId: string;
  companyId: string;
  serviceType: string;
  description: string | null;
  cost: number | null;
  odometerKm: number | null;
  performedBy: string | null;
  performedAt: string;
  nextServiceDate: string | null;
  nextServiceKm: number | null;
  createdAt: string;
}
export const useMaintenanceLogs = (vehicleId?: string) =>
  useQuery({ queryKey: ['maintenance', vehicleId ?? 'all'], queryFn: () => apiFetch<ApiMaintenanceLog[]>(`/maintenance${vehicleId ? `?vehicleId=${vehicleId}` : ''}`) });
export const useTripTemplates = () => useQuery({ queryKey: qk.tripTemplates, queryFn: () => apiFetch<ApiTripTemplate[]>('/trip-templates') });
export const useWaitlists = (status?: 'open' | 'dispatched' | 'denied') =>
  useQuery({ queryKey: [...qk.waitlist, status ?? 'open'], queryFn: () => apiFetch<ApiWaitlist[]>(`/waitlist${status ? `?status=${status}` : ''}`) });
export const useIncidents = (tripId?: string) =>
  useQuery({ queryKey: [...qk.incidents, tripId ?? 'all'], queryFn: () => apiFetch<ApiIncident[]>(`/incidents${tripId ? `?tripId=${tripId}` : ''}`) });
// Infinite (load-more) list for the high-volume bookings endpoint: fetches pages of `pageSize` and stops
// when the accumulated rows reach the server's X-Total-Count.
function useInfiniteList<T>(key: readonly unknown[], path: string, pageSize: number, range?: RangeQuery) {
  const base = withRange(path, range);
  return useInfiniteQuery({
    queryKey: [...key, 'infinite', pageSize, range?.from, range?.to],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => apiFetchPaged<T>(`${base}${base.includes('?') ? '&' : '?'}limit=${pageSize}&offset=${pageParam}`),
    getNextPageParam: (_last: Page<T>, all: Page<T>[]) => {
      const loaded = all.reduce((n, p) => n + p.items.length, 0);
      return loaded < (all[0]?.total ?? 0) ? loaded : undefined;
    },
  });
}
export const useBookingsInfinite = (pageSize = 25, range?: RangeQuery) => useInfiniteList<ApiBooking>(qk.bookings, '/bookings', pageSize, range);
export const useTripsInfinite = (pageSize = 25, range?: RangeQuery) => useInfiniteList<ApiTrip>(qk.trips, '/trips', pageSize, range);

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

export const useTrip = (tripId?: string) =>
  useQuery({ queryKey: [...qk.trips, tripId], enabled: Boolean(tripId), queryFn: () => apiFetch<ApiTrip>(`/trips/${tripId}`) });
export const useTripManifest = (tripId?: string) =>
  useQuery({ queryKey: ['manifest', tripId], enabled: Boolean(tripId), queryFn: () => apiFetch<ApiManifestEntry[]>(`/trips/${tripId}/manifest`) });

// Parallel manifest fetch for a whole route's trips at once (no route-level manifest aggregate endpoint
// exists) — used for Route Details' auto-calculated passenger counts and booking-source split. Each
// trip's manifest is cached under the same ['manifest', tripId] key as useTripManifest, so opening a
// trip's own detail page afterward is instant.
export const useTripManifests = (tripIds: string[]) =>
  useQueries({
    queries: tripIds.map((id) => ({
      queryKey: ['manifest', id],
      queryFn: () => apiFetch<ApiManifestEntry[]>(`/trips/${id}/manifest`),
    })),
  });
export const useTripFreeSeats = (tripId?: string) =>
  useQuery({ queryKey: ['freeSeats', tripId], enabled: Boolean(tripId), queryFn: () => apiFetch<ApiSeatMapLeg[]>(`/trips/${tripId}/free-seats`) });
export const useTripLog = (tripId?: string) =>
  useQuery({ queryKey: ['tripLog', tripId], enabled: Boolean(tripId), queryFn: () => apiFetch<ApiTripLogEntry[]>(`/trips/${tripId}/log`) });

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
// Update the signed-in user's own profile (name/phone/email/language) → PATCH /me.
export const useUpdateMe = () =>
  useApiMutation<{ name?: string; phone?: string; email?: string | null; preferredLanguage?: string }, Me>((b) => apiFetch<Me>('/me', patchBody(b)), [qk.me]);
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

// Staff invitations — each pre-creates the row and fires an email invite. Managers/admins use
// /users/invite; agents and drivers use their own endpoints so the extension row is created too.
export const useInviteUser = () =>
  useApiMutation<{ email: string; phone: string; name: string; role: 'company_admin' | 'manager' | 'agent' }, ApiUser>(
    (b) => apiFetch<ApiUser>('/users/invite', jsonBody(b)),
    [qk.users],
  );
export const useInviteAgent = () =>
  useApiMutation<{ email: string; phone: string; name: string }, ApiAgent>((b) => apiFetch<ApiAgent>('/agents', jsonBody(b)), [qk.users, qk.agents]);
export const useInviteDriver = () =>
  useApiMutation<{ email: string; phone: string; name: string; licenseNumber: string; licenseExpiry: string }, ApiDriver>(
    (b) => apiFetch<ApiDriver>('/drivers', jsonBody(b)),
    [qk.users, qk.drivers],
  );

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
// Create route / stop / vehicle (ops network + fleet management).
export const useCreateRoute = () =>
  useApiMutation<{ name: string; origin: string; destination: string; distanceKm?: number; estimatedDurationMin?: number; departureTimes?: string[] }, ApiRoute>(
    (b) => apiFetch<ApiRoute>('/routes', jsonBody(b)),
    [qk.routes],
  );
export const useCreateStop = () =>
  useApiMutation<{ name: string; type: 'station' | 'stop'; latitude: number; longitude: number; parentStationId?: string | null; phone?: string; address?: string }, ApiStop>(
    (b) => apiFetch<ApiStop>('/stops', jsonBody(b)),
    [qk.stops],
  );
export const useCreateVehicle = () =>
  useApiMutation<{ plateNumber: string; routeId?: string | null; model?: string; capacity?: number; year?: number }, ApiVehicle>(
    (b) => apiFetch<ApiVehicle>('/vehicles', jsonBody(b)),
    [qk.vehicles],
  );
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
