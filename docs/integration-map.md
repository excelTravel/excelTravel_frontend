# Frontend ↔ Backend integration map

_Rewritten from scratch by direct code inspection (not by patching the previous version), because the
previous version had drifted significantly out of date — several items it listed as "🟡 needs backend
work" or "still on stub" turned out to already be fully built and wired on both sides. Every ✅ below was
confirmed by reading the actual hook/service call, not inferred from a comment or an older doc._

Legend: ✅ built and wired end-to-end · 🟡 backend exists, frontend UI not wired to it · ❌ neither side built.

## Backend endpoint surface (`dev` branch)

```
companies      GET/POST /companies · GET/PATCH /companies/{id} · PATCH /companies/{id}/parcel-pricing
users          GET /users · POST /users/invite · GET/PATCH/DELETE /users/{id}
agents         GET/POST /agents · GET/DELETE /agents/{id} · POST/DELETE /agents/{id}/stations[/{stationId}]
               · GET /agents/me · PATCH /agents/me · GET /agents/me/sales · GET /agents/me/stats
drivers        GET/POST /drivers · GET/PATCH/DELETE /drivers/{id} · POST /drivers/{id}/transfer
               · GET /drivers/{id}/history · GET/PATCH /drivers/me (+ 7 more me/* self-service routes)
driver-shifts  GET /driver-shifts?driverId= · PUT /driver-shifts · DELETE /driver-shifts/{id}
passengers     GET /passengers · GET /passengers/lookup
vehicles       GET/POST /vehicles · GET/PATCH/DELETE /vehicles/{id}
routes         GET/POST /routes · GET/PATCH/DELETE /routes/{id}
stops          GET/POST /stops · GET/PATCH/DELETE /stops/{id}
fares          GET/POST /fares · GET /fares/between
trips          GET/POST /trips · GET/PATCH /trips/{id} · PATCH /trips/{id}/status · GET /trips/{id}/eta
               · POST /trips/{id}/message-driver · POST /trips/{id}/broadcast
trip-templates GET/POST /trip-templates · GET/PATCH/DELETE /trip-templates/{id} · POST /{id}/generate
waitlist       GET /waitlist?status= · POST /waitlist/join · GET /waitlist/{id} · POST /{id}/dispatch|deny
trip-requests  GET /trip-requests?status= · POST /trip-requests (agent) · GET /{id} · POST /{id}/dispatch|deny
bookings       GET/POST /bookings · GET /bookings/{id} · POST /bookings/{id}/cancel
tracking       GET /tracking · GET/POST /tracking/{vehicleId}
analytics      GET /analytics/overview · /routes/revenue · /peak-travel · /peak-booking
               · /trips/{tripId}/seat-map
maintenance    GET/POST /maintenance · GET /maintenance/{id}
packages       GET/POST /packages · GET /packages/{id} · GET /packages/mine (passenger self-service)
               · POST /{id}/hand-to-driver|deliver|collect|cancel · PATCH /{id}/fee · POST /{id}/pay
incidents      GET/POST /incidents · GET /incidents/{id} · POST /{id}/approve|reject
notifications  GET/POST /notifications · PATCH /notifications/{id} · PATCH /notifications/{id}/read
private-book.  GET/POST /private-bookings · GET /private-bookings/{id}
audit-logs     GET /audit-logs
zones          GET /zones?level=&parentZoneId=&withBoundary= · GET /zones/resolve?latitude=&longitude=
me             GET/PATCH /me · PUT /me/device-token
tracking realtime (socket): bus:location · bus:alert · trip:status · notification:changed
  (client: join:trip / leave:trip)
```

## Screen-by-screen mapping

### Overview (`src/features/overview/OverviewPage.tsx`)
| UI element | Hook → endpoint | Status |
|---|---|---|
| Daily/MTD revenue, tickets today, buses active | `useOverview()` → `GET /analytics/overview` | ✅ |
| Top routes by revenue (chart + list) | same, `topRoutes` | ✅ |
| Booking-source split | same, `sourceSplit` | ✅ |
| Recent alerts | `useNotifications()` | ✅ |
| Active routes mini-map | `MapPreview` → `useTracking()`/`useLiveBuses()` | ✅ |

### Network — Map / Routes / Stops / Fares / Zones (`src/features/network/*`)
| UI | Hook → endpoint | Status |
|---|---|---|
| Bus markers + live movement | `useLiveBuses()` (`GET /tracking` + `/vehicles` + `/trips` + `/drivers`) + `useTripLive()` socket (`bus:location`/`bus:alert`/`trip:status`) | ✅ — real socket subscription, not polling-only |
| Bus list panel (desktop side panel / mobile bottom sheet) | same | ✅ |
| Pin-to-add station/stop, zone auto-resolve on drop | `useCreateStop()`, `GET /zones/resolve` | ✅ |
| Routes / Stops / Fares matrix tabs | `useRoutes`/`useStops`/`useFares` | ✅ |
| Admin Zones list + boundary rendering | `useZones()` | ✅ |

### Trips (`src/features/trips/*`)
| UI | Hook → endpoint | Status |
|---|---|---|
| Trips table + Routes view | `useTripRows` (`/trips` joined with `/routes`+`/vehicles`) | ✅ |
| Trip detail, live map on the detail page | `useTrip`, `useTripLive` | ✅ |
| Download manifest | `/bookings?tripId=` → client CSV | ✅ |
| Seat map | `GET /analytics/trips/{tripId}/seat-map` | ✅ |
| Message driver / broadcast passengers | `POST /trips/{id}/message-driver` \| `/broadcast` | ✅ (uses the existing generic `dispatch` notification trigger — no separate `ops_message` type needed) |
| Reroute / vehicle+driver assign, status change | `PATCH /trips/{id}`, `PATCH /trips/{id}/status` | ✅ |
| **Scheduling → recurring routines** | `useCreateTemplate` → `POST /trip-templates` | ✅ |
| **Scheduling → waitlist / early dispatch** | `useWaitlists`, `useDispatchWaitlist`, `useDenyWaitlist` | ✅ |
| **Scheduling → agent trip-request pooling** | `useTripRequests`, `useDispatchTripRequest`, `useDenyTripRequest` (`TripRequestsBoard.tsx`) | ✅ |
| Scheduling calendar (day/week/month) | `useTripRows` scoped by range | ✅ |

### Fleet (`src/features/fleet/*`)
| UI | Hook → endpoint | Status |
|---|---|---|
| Vehicle cards, live trip status derived per card | `useVehicles`, `useTrips` | ✅ |
| Add / edit / archive vehicle | `useCreateVehicle`/`useUpdateVehicle`/`useDeleteVehicle` | ✅ |
| Driver roster, add/transfer/history | `useDrivers`, `useCreateDriver`, driver detail modals | ✅ |
| **Weekly roster / fairness board** | `useDriverShifts`, `useSetDriverShift`, `useDeleteDriverShift` | ✅ |
| Maintenance log + stats | `useMaintenanceLogs`, `useCreateMaintenanceLog` | ✅ |
| Accidents/incidents panel | `useIncidents` | ✅ |

### Bookings (`src/features/bookings/*`)
| UI | Hook → endpoint | Status |
|---|---|---|
| Bookings table, detail, cancel | `useBookingsInfinite`, `useCancelBooking` | ✅ |
| Inline filters, date-scope control, channel column | derived client-side from the same feed | ✅ |
| **Booking Desk (in-person sale)** | `useCreateBooking()` → `POST /bookings` | ✅ |

### Parcels (`src/features/parcels/*`)
| UI | Hook → endpoint | Status |
|---|---|---|
| Manifest table, register, custody timeline, stage actions | `usePackages`, `useStops` | ✅ |
| **Pricing config (base fee + weight surcharge)** | `useUpdateParcelPricing` → `PATCH /companies/{id}/parcel-pricing` | ✅ |

### Analytics (`src/features/analytics/AnalyticsPage.tsx`)
| UI | Hook → endpoint | Status |
|---|---|---|
| Route revenue table/chart | `useRouteRevenue` → `GET /analytics/routes/revenue` | ✅ |
| Peak travel heatmap, peak booking chart | `usePeakTravel`, `usePeakBooking` | ✅ |
| Seat map | `GET /analytics/trips/{tripId}/seat-map` | ✅ |

### Users — Staff / Agents / Passengers (`src/features/team/TeamPage.tsx`, admin-only route)
| UI | Hook → endpoint | Status |
|---|---|---|
| Staff list + invite | `useUsers` | ✅ |
| Agents + station assignment | `useAgents` | ✅ |
| **Passengers tab — last login, login count** | `usePassengers()` → `.loginCount`/`.lastLoginAt` (already tracked on every OTP verify) | ✅ |

### Settings / Notifications
| UI | Hook → endpoint | Status |
|---|---|---|
| Company profile, `me` | `useMe`, `useUpdateCompany`, `useUpdateMe` | ✅ |
| Notifications list, mark read | `useNotifications`, `useMarkNotificationRead` | ✅ |

## Genuinely open gaps (both sides checked, neither exists)

1. **Live demand board** — a single view combining bookings + waitlist + trip-requests aggregated by
   corridor. Each input now exists (agent trip-request pooling landed — see Trips → Scheduling above and
   `mobile: agent_trip_request_sheet.dart`); the combined visualization itself hasn't been built.

## Deliberately out of scope for this build
- **Companies / Audit-log / Private-bookings admin section** — removed from this per-company ops console;
  reserved for a future system-admin surface across the multi-tenant platform. Backend modules for all
  three still exist and work (`GET /companies`, `GET /audit-logs`, `GET /private-bookings`).
- **Map-pinned stop coordinates** are UI-only by design — `POST /stops` already accepts `latitude`/
  `longitude`, so dropping a pin on the map just fills those fields; no backend change was ever needed here.
- **Fares** are shown per-route in the UI but still read from the single national RURA station-to-station
  matrix — the "national fares, no `route_id`" invariant is unchanged.

## Local dev setup
- **Base URL**: `VITE_API_BASE_URL` must include `/api/v1`. Local: `http://localhost:3000/api/v1`.
- **CORS**: backend `CORS_ORIGINS=http://localhost:5173` — run the frontend on port **5173** to hit a local
  backend.
- **Client**: `lib/api/hooks.ts` (typed TanStack Query hooks), `lib/api/client.ts` (`apiFetch`),
  `lib/socket.ts` (`useTripLive`, `useLiveNotifications`), `components/ui/async.tsx` (loading/error/empty
  wrapper for any query).
- Hosted-environment reachability was not re-verified as part of this rewrite — this doc tracks
  frontend↔backend code wiring, not deployment/ops status.
