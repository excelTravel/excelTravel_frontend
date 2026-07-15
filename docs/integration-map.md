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

## Backend gaps to flag (frontend wants, backend can't fully serve)
1. **Ops→driver / broadcast messaging** — `notifications.triggerType` enum is passenger-only. Add e.g. `ops_message` / `broadcast`.
2. **Dashboard aggregation analytics** — revenue totals, daily ticket volume, occupancy, period-over-period deltas. Only peak-hours + seat-map exist today.
3. **Driver work-shifts / weekly roster** — no shift/roster table. The Fleet → Drivers **weekly roster + workload/fairness board** is a full mock; needs a `driver_shifts` table (driver, day, start, end) to persist + a weekly-hours aggregate for the fairness cap.
4. **Recurring trip routines** — Trips → Scheduling **recurring routines** are mocked; needs a `trip_templates`/recurring-trips concept (route, frequency, times, vehicle) that materializes trips.
5. **Agent trip requests (demand pooling)** — mocked; needs a `trip_requests` table (agent, corridor/stops, pax count) so ops can pool demand and dispatch.
6. **Passenger waitlist + early dispatch** — mocked; needs a `waitlist` concept (passenger, from/to stop, desired window) + a threshold trigger to dispatch a bus early.
7. **Live demand board** — mocked; derivable once bookings + requests + waitlist aggregate by corridor.
8. **Driver document images** (profile/licence/ID) — drivers store licence number + expiry only; needs image-URL fields (Cloudinary).
9. **Global parcel pricing config** — only per-package `PATCH /packages/{id}/fee` exists; a base-fee + weight-surcharge config endpoint is needed.
10. **Regenerate `openapi.json`** — it's stale (missing drivers/maintenance/analytics/tracking/notifications/incidents/agents/audit/private-bookings). Needed before generating the typed client.

> Maintenance management UI was intentionally removed (replaced by a "Coming soon" placeholder) — the
> `maintenance` backend module still exists and can be surfaced later if prioritized.
