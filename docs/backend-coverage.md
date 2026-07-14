# Backend ↔ Frontend coverage audit

_Snapshot as of the Fleet-redesign pass. Source of truth = backend route files + `prisma/schema.prisma`
(NOT `openapi.json`, which is stale — see the cross-cutting flag below)._

## Backend feature modules (21)

`agents` · `analytics` · `audit` · `auth/webhook` · `bookings` · `companies` · `drivers` · `fares` ·
`health` · `incidents` · `maintenance` · `me` · `notifications` · `packages` · `private-bookings` ·
`routes` · `stops` · `tracking` · `trips` · `users` · `vehicles`

## Screens the frontend has today

Overview · Live Map (tracking) · Trips (list + detail) · Fleet (vehicles / drivers / maintenance) ·
Bookings · Parcels (packages) · Analytics · Login (Clerk). Shell: notification bell (badge only),
theme, EN/KIN i18n, global date range. **All screens render from local stub data — none are wired to
the API yet.**

## A. Backend capabilities NOT yet surfaced in the frontend (build these)

| Backend module | What it offers | Frontend status |
|---|---|---|
| `companies` | Super-admin company CRUD (multi-tenant) | ❌ none |
| `users` | Staff user list + invite + role/status | ❌ none |
| `agents` | Agent management + station assignments | ❌ none |
| `fares` | RURA station-to-station fare matrix | ❌ none |
| `routes` | Route CRUD (+ ordered stops) | ❌ none |
| `stops` | Stations / stops CRUD | ❌ none |
| `incidents` | Incident list + approve/reject workflow | ❌ none |
| `private-bookings` | Charter / private bookings | ❌ none |
| `notifications` | List + mark-read | ⚠️ bell badge only, no list page |
| `audit` | Audit-log viewer (old/new diff) | ❌ none |
| `me` | Profile / settings, device token | ⚠️ login only |
| `tracking` | Live positions via socket | ⚠️ Live Map UI built, socket feed NOT wired (stub positions) |

Screens that exist but are still stub (need wiring, not building): Overview, Trips, Bookings, Parcels,
Analytics, Fleet.

## B. Frontend elements NOT derivable from the backend (flagged)

1. **Driver work-shifts** — there is **no shift / roster table**. `drivers.status` is
   `available | on_trip | off_duty | suspended`. ✅ Resolved in the redesign: the "roster" is now a
   **trip schedule derived from `trips`** (driver_id + scheduled_departure + vehicle). If you want true
   clock-in/out shifts, that needs a new `driver_shifts` table.
2. **Maintenance priority + work-order status** (open / in-progress) — `maintenance_logs` has **no
   priority and no status column**; it's a service log. ✅ Resolved: urgency is **derived** from
   `next_service_date` → `overdue | due_soon | logged`. A true work-order workflow would need new columns.
3. **Vehicle `idle` status** — enum is `active | maintenance | retired` only. ✅ Fixed (removed `idle`).
4. **Fleet KPIs** (utilization %, drivers on duty, services due) — not stored fields; **derivable by
   aggregation** (active ÷ total; count drivers by status; maintenance_logs vs next_service_date). OK.
5. **KPI deltas / period-over-period** across screens — depend on the `analytics` contract; stubbed today.
6. **Notification counter** — backable via `notifications`, not yet wired.

## C. Cross-cutting flag (important)

**`openapi.json` is stale.** It documents only ~41 endpoints and is missing entire modules that exist in
code: `drivers`, `maintenance`, `analytics`, `tracking`, `incidents`, `notifications`, `agents`, `audit`,
`private-bookings`. Since the frontend typed client is generated from it (`npm run openapi:types`), the
generated types would be **missing most of the app**. → **Regenerate `openapi.json` from the backend
before wiring the typed API client.**
