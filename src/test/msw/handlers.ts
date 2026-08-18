// MSW request handlers for integration tests. Covers the read endpoints the tested pages (and the
// hooks they compose) call. Anything not central to a specific test resolves to an empty array by
// default via the catch-all at the bottom, so an untested page dependency never crashes a test —
// but tests that care about a resource's content override it with `server.use(...)`.
import { http, HttpResponse } from 'msw';
import {
  fixtureOverview,
  fixtureTrips,
  fixtureRoutes,
  fixtureBookings,
  fixtureWaitlists,
  fixtureTripRequests,
  fixturePeakBooking,
  fixturePeakTravel,
  fixtureNotifications,
  fixtureVehicles,
  fixtureDrivers,
  fixtureAgents,
  fixtureUsers,
  fixturePassengers,
  fixturePackages,
  fixtureCompanies,
  fixtureMe,
  fixtureStops,
} from './fixtures';

const BASE = 'http://localhost:3000/api/v1';

export const handlers = [
  http.get(`${BASE}/analytics/overview`, () => HttpResponse.json(fixtureOverview)),
  http.get(`${BASE}/analytics/peak-booking`, () => HttpResponse.json(fixturePeakBooking)),
  http.get(`${BASE}/analytics/peak-travel`, () => HttpResponse.json(fixturePeakTravel)),
  http.get(`${BASE}/analytics/routes/revenue`, () => HttpResponse.json(fixtureOverview.topRoutes)),
  http.get(`${BASE}/trips`, () => HttpResponse.json(fixtureTrips)),
  http.get(`${BASE}/routes`, () => HttpResponse.json(fixtureRoutes)),
  http.get(`${BASE}/waitlist`, () => HttpResponse.json(fixtureWaitlists)),
  http.get(`${BASE}/trip-requests`, () => HttpResponse.json(fixtureTripRequests)),
  http.get(`${BASE}/notifications`, () => HttpResponse.json(fixtureNotifications)),
  http.get(`${BASE}/vehicles`, () => HttpResponse.json(fixtureVehicles)),
  http.get(`${BASE}/drivers`, () => HttpResponse.json(fixtureDrivers)),
  http.get(`${BASE}/driver-shifts`, () => HttpResponse.json([])),
  http.get(`${BASE}/agents`, () => HttpResponse.json(fixtureAgents)),
  http.get(`${BASE}/users`, () => HttpResponse.json(fixtureUsers)),
  http.get(`${BASE}/passengers`, () => HttpResponse.json(fixturePassengers)),
  http.get(`${BASE}/packages`, () => HttpResponse.json(fixturePackages)),
  http.get(`${BASE}/companies`, () => HttpResponse.json(fixtureCompanies)),
  http.get(`${BASE}/me`, () => HttpResponse.json(fixtureMe)),
  http.get(`${BASE}/stops`, () => HttpResponse.json(fixtureStops)),
  http.get(`${BASE}/tracking`, () => HttpResponse.json([])),
  http.get(`${BASE}/maintenance`, () => HttpResponse.json([])),
  http.get(`${BASE}/incidents`, () => HttpResponse.json([])),
  http.get(`${BASE}/bookings`, ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? fixtureBookings.length);
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const page = fixtureBookings.slice(offset, offset + limit);
    return HttpResponse.json(page, { headers: { 'X-Total-Count': String(fixtureBookings.length) } });
  }),

  // Catch-all for every other GET under /api/v1 — keeps unrelated hooks (fired by pages composing many
  // queries) from throwing in tests that don't care about their content.
  http.get(`${BASE}/*`, () => HttpResponse.json([])),
  http.post(`${BASE}/*`, () => HttpResponse.json({})),
  http.patch(`${BASE}/*`, () => HttpResponse.json({})),
  http.delete(`${BASE}/*`, () => new HttpResponse(null, { status: 204 })),
];
