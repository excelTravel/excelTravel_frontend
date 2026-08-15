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
  fixturePeakBooking,
  fixtureNotifications,
} from './fixtures';

const BASE = 'http://localhost:3000/api/v1';

export const handlers = [
  http.get(`${BASE}/analytics/overview`, () => HttpResponse.json(fixtureOverview)),
  http.get(`${BASE}/analytics/peak-booking`, () => HttpResponse.json(fixturePeakBooking)),
  http.get(`${BASE}/trips`, () => HttpResponse.json(fixtureTrips)),
  http.get(`${BASE}/routes`, () => HttpResponse.json(fixtureRoutes)),
  http.get(`${BASE}/waitlist`, () => HttpResponse.json(fixtureWaitlists)),
  http.get(`${BASE}/notifications`, () => HttpResponse.json(fixtureNotifications)),
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
