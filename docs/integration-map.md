# Frontend ↔ Backend integration map

_Backend audited from `excelTravel_backend` **main** branch (route files + `*.validation.ts` Zod schemas),
not the stale `openapi.json`. ~50 routes across 18 modules._

Legend: ✅ endpoint exists & maps cleanly · 🟡 partial / needs a small backend addition · ❌ no backend yet.

## Backend endpoint surface (main)

```
companies     GET/POST /companies · GET/PATCH /companies/{id}
users         GET /users · POST /users/invite · GET/PATCH/DELETE /users/{id}
agents        GET/POST /agents · GET/DELETE /agents/{id} · POST/DELETE /agents/{id}/stations[/{stationId}]
drivers       GET/POST /drivers · GET/PATCH/DELETE /drivers/{id} · POST /drivers/{id}/transfer · GET /drivers/{id}/history
vehicles      GET/POST /vehicles · GET/PATCH/DELETE /vehicles/{id}
routes        GET/POST /routes · GET/PATCH/DELETE /routes/{id}
stops         GET/POST /stops · GET/PATCH/DELETE /stops/{id}
fares         GET/POST /fares · GET /fares/between
trips         GET/POST /trips · GET/PATCH /trips/{id} · PATCH /trips/{id}/status
bookings      GET/POST /bookings · GET /bookings/{id} · POST /bookings/{id}/cancel
tracking      GET /tracking · GET/POST /tracking/{vehicleId}
analytics     GET /analytics/peak-travel · /peak-booking · /trips/{tripId}/seat-map
maintenance   GET/POST /maintenance · GET /maintenance/{id}
packages      GET/POST /packages · GET /packages/{id} · POST /{id}/hand-to-driver|deliver|collect|cancel · PATCH /{id}/fee · POST /{id}/pay
incidents     GET/POST /incidents · GET /incidents/{id} · POST /{id}/approve|reject
notifications GET/POST /notifications · PATCH /notifications/{id}
private-book. GET/POST /private-bookings · GET /private-bookings/{id}
audit-logs    GET /audit-logs
me            GET/PATCH /me · PUT /me/device-token
driver-shifts GET /driver-shifts?driverId= · PUT /driver-shifts (upsert by day-of-week) · DELETE /driver-shifts/{id}
trip-templates GET/POST /trip-templates · GET/PATCH/DELETE /trip-templates/{id} · POST /trip-templates/{id}/generate
waitlist      GET /waitlist?status= · POST /waitlist/join · GET /waitlist/{id} · POST /waitlist/{id}/dispatch|deny
zones         GET /zones?level=&parentZoneId=&withBoundary= · GET /zones/resolve?latitude=&longitude=
tracking realtime (socket): bus:location · bus:alert · trip:status  (join:trip / leave:trip)
```

## Screen-by-screen mapping

### Overview
| UI element | Endpoint | Status |
|---|---|---|
| Daily/MTD revenue, tickets KPIs | `GET /analytics/*` + `GET /bookings` | 🟡 analytics has peak-travel/peak-booking/seat-map only; **revenue/ticket totals + deltas need aggregation endpoints** |
| Buses active now | `GET /tracking` | ✅ |
| Passenger volume chart | `GET /analytics/peak-travel` (or bookings agg) | 🟡 no direct daily-volume endpoint |
| Active routes mini-map | `GET /tracking` + socket | ✅ |
| Top routes / booking source / alerts | bookings/notifications aggregation | 🟡 needs agg |

### Live Map
| UI | Endpoint | Status |
|---|---|---|
| Bus markers + positions | `GET /tracking`, `GET /tracking/{vehicleId}` | ✅ |
| Live movement | socket `bus:location` / `trip:status` | ✅ (socket not wired yet in UI) |
| Active-trips panel | `GET /trips` (status active) | ✅ |

### Trips (list + detail)
| UI | Endpoint | Status |
|---|---|---|
| Trips table + filter tabs | `GET /trips` | ✅ |
| Trip detail | `GET /trips/{id}` | ✅ |
| **Download manifest** | `GET /bookings?tripId={id}` → client CSV | ✅ (client-side export) |
| Manifest / seat map | `GET /analytics/trips/{tripId}/seat-map` | ✅ |
| **Message driver** | `POST /notifications {userId: driverUserId, type, message}` | 🟡 works, but `triggerType` enum is passenger-only (5km/2km/arrived/delay/cancellation) — **add an `ops_message` trigger** for clean ops→driver messaging |
| Reroute / vehicle swap | `PATCH /trips/{id} {vehicleId}` | ✅ |
| Emergency broadcast | `POST /notifications` (per booking/user) | 🟡 same trigger gap |
| Trip status change | `PATCH /trips/{id}/status` | ✅ |

### Fleet — Vehicles
| UI | Endpoint | Status |
|---|---|---|
| Vehicle cards / list | `GET /vehicles` | ✅ |
| **Add Vehicle** | `POST /vehicles {plateNumber, model?, capacity?, year?, routeId?}` | ✅ (note: no status on create; vehicle is **route-locked**) |
| **View details** | `GET /vehicles/{id}` | ✅ |
| **Edit vehicle** | `PATCH /vehicles/{id} {model?, capacity?, status?, currentKm?, routeId?}` | ✅ (plate & year are **immutable** — not editable) |
| Archive vehicle | `DELETE /vehicles/{id}` | ✅ |
| Assigned driver on card | derived from `GET /trips` (driver of active trip) | ✅ derived |

### Fleet — Drivers
| UI | Endpoint | Status |
|---|---|---|
| Driver cards / roster | `GET /drivers` | ✅ |
| Trip schedule board | `GET /trips?driverId` (assigned trips) | ✅ derived |
| **Assign driver** | `PATCH /trips/{id} {driverId, vehicleId}` (assign to a scheduled run) | ✅ |
| Add driver | `POST /drivers` (invite) | ✅ |
| Driver history | `GET /drivers/{id}/history` | ✅ |
| Transfer driver | `POST /drivers/{id}/transfer` | ✅ (super_admin) |
| Driver status pill (available/on_trip/off_duty/suspended) | `GET /drivers` + `PATCH /drivers/{id}` | ✅ |
| Shift roster (clock-in/out) | — | ❌ no shift table (schedule is derived from trips instead) |

### Fleet — Maintenance
| UI | Endpoint | Status |
|---|---|---|
| Maintenance cards / stats | `GET /maintenance` | ✅ |
| Log maintenance | `POST /maintenance` | ✅ |
| Urgency (overdue/due-soon/logged) | derived from `next_service_date` | ✅ derived (no priority/status column) |

### Bookings
| UI | Endpoint | Status |
|---|---|---|
| **All bookings table** | `GET /bookings` | ✅ |
| Booking detail | `GET /bookings/{id}` | ✅ |
| Cancel booking | `POST /bookings/{id}/cancel` | ✅ |
| Sell ticket (booking desk) | `POST /bookings` (capacity-safe) | ✅ |
| Velocity / channel split charts | analytics aggregation | 🟡 needs agg |

### Parcels
| UI | Endpoint | Status |
|---|---|---|
| Parcels table | `GET /packages` | ✅ |
| Register parcel | `POST /packages {sender/recipient, from/toStopId, description, fee?}` | ✅ |
| **Journey / stages timeline** | `GET /packages/{id}` → `events[]` (custody chain) + `status` | ✅ |
| Stage actions: hand to driver / deliver / collect | `POST /packages/{id}/hand-to-driver \| /deliver \| /collect` | ✅ |
| Cancel parcel | `POST /packages/{id}/cancel` | ✅ |
| Pricing / set fee | `PATCH /packages/{id}/fee` · `POST /packages/{id}/pay` | ✅ |

### Analytics
| UI | Endpoint | Status |
|---|---|---|
| Peak travel heatmap | `GET /analytics/peak-travel` | ✅ |
| Peak booking chart | `GET /analytics/peak-booking` | ✅ |
| Seat map | `GET /analytics/trips/{tripId}/seat-map` | ✅ |
| Revenue trend / route perf / occupancy | — | 🟡 **no revenue/occupancy analytics endpoints yet** |

## Screens NOT built yet (backend fully ready)
Companies (super-admin), Users + invite, Agents + station assignment, Routes, Stops, Fares matrix,
Incidents (approve/reject), Private bookings, Audit-log viewer, Notifications list, Settings/`me`.

## Live wiring status (started 2026-07-17)
The frontend now talks to the real backend. Foundation + first slices are wired and **verified in-browser**.

- **Base URL**: `VITE_API_BASE_URL` must include `/api/v1` (hooks call resource paths like `/trips`). Live server: `http://13.140.133.61:3300/api/v1`. Local: `http://localhost:3000/api/v1`.
- **Auth for local dev**: the backend supports `DEV_AUTH=true` (dev only) + an `X-Dev-User: <user_id>` header. The frontend sends it automatically when `VITE_DEV_USER` is set (see `.env.local`, git-ignored). Seeded company_admin id: `user_3GAhHKHfYTsv8FjymMdUpCSX3Ry`. For any hosted/prod run, leave `VITE_DEV_USER` empty and sign in through the real in-house email/phone + OTP flow so `apiFetch` gets a live access token (`RequireAuth` gates the shell on `useSession`; see `src/lib/auth/session.ts` + `src/lib/api/client.ts`).
- **CORS**: backend `CORS_ORIGINS=http://localhost:5173` — run the frontend on **5173** (`npm run dev`) to hit a local backend; other ports are blocked.
- **Client**: `lib/api/hooks.ts` (typed TanStack Query hooks, hand-typed from live responses — bare arrays, no envelope), `lib/api/client.ts` (`apiFetch`), `components/ui/async.tsx` (`<Async>` loading/error/empty wrapper).
- **Wired + verified** (live data, in-browser, 200s + zero console errors):
  - Shell greeting/profile → `/me` + `/companies`
  - Network → Routes (`/routes`), Stops (`/stops`), **Fares matrix** (`/stops` stations + `/fares`)
  - Users → **Staff** (`/users`), **Agents** (`/agents`, station names via `/stops`)
  - **Trips** → Routes view + All-trips list (`/trips` joined with `/routes` + `/vehicles` in `useTripRows`)
  - **Fleet → Vehicles** (`/vehicles` → cards + composition ring from real statuses)
  - **Notifications** (`/notifications`), **Parcels** master manifest (`/packages`)
- **Degrade to —/0 in the wired screens** (backend doesn't return these yet): trip occupancy + revenue (needs bookings aggregation), trip driver (needs `/drivers` join), vehicle model/year/driver/current-trip/next-service/maintenance.
- **Still on stub** (need backend aggregation endpoints or GPS/socket — not just seed data):
  - **Overview** KPIs, **Analytics** charts, **Bookings** dashboard (velocity/channel/revenue) — no aggregation endpoints (`/analytics/overview` is 404).
  - **Booking desk** create flow (POST /bookings — capacity-safe txn; not yet wired), Network **Map markers/live buses** (needs GPS + socket), Trips **Scheduling** (recurring/waitlist — backend now exists, see gaps #3/#4/#6; only the UI wiring is outstanding), Fleet **Drivers roster / Accidents** tabs (roster backend now exists, see gap #3), **Settings**, Users **Passengers** tab (login metrics — see gap #11), Parcels/Notifications **aggregation KPIs**.

### ⚠ Blockers found while wiring (relay to backend team)
- **Hosted server DB is down**: `http://13.140.133.61:3300` returns **500 on every DB route** (health is fine). Its `DATABASE_URL` is `localhost:5432` — the deploy has no working Postgres/migrations. Wiring was verified against a **local** backend instead. Fix the hosted DB before the frontend can point at the hosted API.
- **Unauth → 500 (should be 401)**: data routes hit Postgres RLS with no tenant context and throw a raw 500 instead of a clean 401.
- **`GET /api/v1/analytics/overview` → 404**: Overview/Analytics need aggregation endpoints (revenue totals, daily volume, occupancy). Only `/analytics/peak-travel` exists (and returns `[]`). See gap #2 below.
- **Empty seed data**: drivers, agents, bookings, notifications, packages, incidents, private-bookings all return `[]` — those screens will show empty states until data is seeded.

## Backend gaps to flag (frontend wants, backend can't fully serve)
1. **Ops→driver / broadcast messaging** — `notifications.triggerType` enum is passenger-only. Add e.g. `ops_message` / `broadcast`.
2. **Dashboard aggregation analytics** — revenue totals, daily ticket volume, occupancy, period-over-period deltas. Only peak-hours + seat-map exist today.
3. ~~**Driver work-shifts / weekly roster**~~ — **backend now exists** (`driver_shifts` table + `GET/PUT/DELETE /driver-shifts`, one row per driver per day-of-week, tested in `tests/driver-shifts.test.ts`). The Fleet → Drivers **weekly roster + workload/fairness board** is still UI-mocked and needs wiring to this endpoint; no further backend work needed.
4. ~~**Recurring trip routines**~~ — **backend now exists** (`trip_templates` table + `GET/POST/PATCH/DELETE /trip-templates` + `POST /trip-templates/{id}/generate`, tested in `tests/trip-templates.test.ts`). Trips → Scheduling **recurring routines** is still UI-mocked and needs wiring; no further backend work needed.
5. **Agent trip requests (demand pooling)** — mocked; needs a `trip_requests` table (agent, corridor/stops, pax count) so ops can pool demand and dispatch. (Distinct from the waitlist below — this is agent-initiated demand pooling, not passenger self-join.)
6. ~~**Passenger waitlist + early dispatch**~~ — **backend now exists** (`route_waitlist`/`waitlist_joins` tables + `GET /waitlist`, `POST /waitlist/join`, `GET /waitlist/{id}`, `POST /waitlist/{id}/dispatch|deny`, tested in `tests/waitlist.test.ts`; passengers can self-join via the existing `passenger_open`/`passenger_join_insert` RLS policies). Trips → Scheduling **waitlist + early-dispatch** is still UI-mocked and needs wiring; no further backend work needed.
7. **Live demand board** — mocked; derivable once bookings + requests + waitlist aggregate by corridor.
8. **Driver document images** (profile/licence/ID) — drivers store licence number + expiry only; needs image-URL fields (Cloudinary).
9. **Global parcel pricing config** — only per-package `PATCH /packages/{id}/fee` exists; a base-fee + weight-surcharge config endpoint is needed.
10. **Regenerate `openapi.json`** — it's stale (missing drivers/maintenance/analytics/tracking/notifications/incidents/agents/audit/private-bookings). Needed before generating the typed client.
11. **Passenger login metrics** — Users → **Passengers** tab shows *last login*, *login count* and *bookings-with-this-company*, all mocked. The `users` table doesn't track logins (sessions are handled in-house via the OTP auth flow); needs either a `last_login`/`login_count` update on each successful OTP verification or a login-events table. Bookings-per-passenger is derivable from `bookings` grouped by `passenger_id`.
12. **Map-pinned stop coordinates** — Network → Map lets you drop a stop by clicking the map; it fills `latitude`/`longitude` for `POST /stops` (which already accepts them), so this is UI-only — no backend change needed.

> **Admin section removed** — Companies / Audit-log / Private-bookings were pulled from this ops build; they
> belong to the future **system-admin** (super-admin) surface for the multi-company platform, not the
> per-company ops console. Their backend modules still exist.
> **Live Map moved into Network** (Map tab) alongside Routes / Stops / Fares; the standalone `/map` route is gone.
> **Fares are shown per-route** but still read from the single national RURA station-to-station matrix — the
> locked "national fares, no route_id" invariant is unchanged.

> Maintenance management UI was intentionally removed (replaced by a "Coming soon" placeholder) — the
> `maintenance` backend module still exists and can be surfaced later if prioritized.
