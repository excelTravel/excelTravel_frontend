# excelTravel Frontend — build plan

> **Historical plan — auth has since changed.** This doc reflects the original plan when Clerk was the
> auth provider. The project later migrated to an in-house email/phone + OTP auth system (see the repo
> `CLAUDE.md` for the current flow); the Clerk references below are left as-written for history rather
> than rewritten.

## Context
The backend is built + pushed: full multi-tenant bus-ops API (Clerk auth, RLS, live tracking + proximity
alerts, trips/bookings, fleet, analytics, parcels, incidents, audit) described in a committed `openapi.json`.
This repo is the **web frontend** — responsive portals for **all six roles** (super admin, company admin, ops
manager, agent, driver, passenger). Everyone reaches it from a browser now; native Flutter apps
(`excelTravel_mobile`) come later and reuse these flows. Visual direction: the approved **glassmorphism**
Overview (navy + **teal** accent, frosted cards, RWF, EN/KIN, Rwanda live map) — evolve, not replace.

## Locked stack
React 18 + TypeScript + **Vite** · Tailwind + **shadcn/ui** · **lucide-react** · **TanStack Query** +
**Zustand** · **React Router** · **@clerk/clerk-react** · **react-i18next** (EN/KIN) · **date-fns**
(Africa/Kigali) · **React Hook Form + Zod** · **DOMPurify** · **MapLibre GL + free OSM tiles** (zero billing)
· **Recharts** · **socket.io-client** · **Cloudinary** uploads · **npm** · tests: **Vitest + Testing Library
+ MSW + Playwright**. Types generated from `../excelTravel_backend/openapi.json` (build-time; runtime calls
go directly to the backend).

## Build order
1. **Foundation (design-independent — build now while designs are prepared):** scaffold, design tokens,
   API client, i18n, Clerk auth, app-shell skeleton, testing harness.
2. **Design system + component library** (once visual designs land): tokens finalized + all shared components
   + a `/design-system` living style guide.
3. **Screens** — Overview reference first, then screen-by-screen per role.

## Design system & global UX
- **Tokens:** navy/teal/semantic/slate, **glass** (blur/opacity/border/shadow), typography (display + body +
  **tabular** figures), spacing (4/8), radii, elevation, z-index. Light + dark.
- **Dark mode:** class-based, smooth ~200ms transition, persisted, `prefers-reduced-motion` honored.
- **Responsive (first-class):** staff dashboards desktop-first-but-responsive; **passenger + driver portals
  mobile-first**. Breakpoints 375/768/1024/1280/1440; sidebar collapses to icons/drawer.

## Component inventory (each with default/hover/focus/active/disabled/loading/error)
Buttons · inputs (text/number/tel/email/password) · textarea · Select/Combobox/MultiSelect · Checkbox/Radio/
Switch · **DatePicker/DateRangePicker/TimePicker** (locale-aware, keyboard) · **Search** (debounced, ⌘K
palette) · **Filter bar** · **Sort** (aria-sort) · **Pagination / infinite scroll** · **Data table** (sortable/
filterable, row actions, bulk select, virtualized ≥50 rows) · Tabs · Modal · Drawer · **Toasts** (aria-live) ·
Tooltip · Popover · Dropdown · Breadcrumbs · **StatusPill** · Avatar · **GlassCard** · **KpiCard** (+sparkline)
· **Charts** (tooltips/axes/legend/empty/loading/error, reduced-motion) · **Skeletons** (layout-shaped, not
spinners) · **EmptyState** (illustration + primary action) · **ErrorState** (insightful, retry, trace id) ·
Stepper · **ImageUpload** (Cloudinary drag-drop/preview/progress) · **MapLibre map** (pulsing bus markers) ·
Confirmation dialog · **Form system** (RHF + Zod: labels, required marks, helper text, inline validation on
blur, error summary + focus first error, async submit, unsaved-changes guard, autosave) · route top loading
bar · theme toggle · **EN/KIN switcher** · command palette · notification center · ErrorBoundary · 404/403/500.

## Loading / error / empty philosophy
- **Loading:** layout-matched **skeletons** everywhere; route-change top bar; button spinners on submit.
- **Errors — informational, never raw text:** central `normalizeError()` maps status → friendly, i18n'd,
  color-coded (severity), animated-in, correctly-positioned copy with a recovery action —
  `401`→re-auth · `403`→no access · `404`→not found · `409`→explain conflict · `422`→field validation ·
  `429`→slow down · `5xx`/network→retry + copyable trace id. Toast vs inline vs full-page by context.
- **Empty:** contextual copy + one primary action, never a blank card.

## Security (frontend responsibilities)
- **SQL injection is a backend concern** and already handled server-side (Prisma parameterized queries + Zod +
  RLS). The frontend never builds SQL.
- **Validate every input with Zod** before submit (RHF resolver); the backend always re-validates.
- **XSS:** React escapes by default; never `dangerouslySetInnerHTML` on user content; sanitize any rich text
  with **DOMPurify**.
- No secrets in the client (only the Clerk *publishable* key + public config); HTTPS; Clerk owns auth tokens.

## i18n
react-i18next; **EN + KIN** namespaced messages; RWF/date/number locale (Africa/Kigali); persisted switcher;
a check that every used key exists in both locales.

## Image uploads (Cloudinary → store URL)
Company logo · driver/incident photo (`trip_incidents.image_url`) · parcel proof (`package_events.photo_url`)
· avatar. Client → Cloudinary (unsigned preset) → `secure_url` → backend PATCH/POST. Validate type/size,
preview, progress, remove.

## Role interfaces (screens + backend endpoints) — UI-gated per role; backend RLS/RBAC is the real enforcement
- **Super admin:** platform overview · Companies (`/companies`) · Users (`/users`) · Audit log (`/audit-logs`)
  · cross-company analytics.
- **Company admin:** Overview · Live Map (`/tracking`) · Trips (`/trips`) · Bookings (`/bookings`) · Booking
  desk · Fleet (`/vehicles`+`/maintenance`) · People (drivers/agents) · Network (routes/stops/fares) ·
  Analytics · Parcels (`/packages`) · Incidents (`/incidents`) · Private bookings · Notifications · Settings.
- **Ops manager:** Overview · Live Map · Trips(+status) · Analytics · Incidents approval · Parcels · read-only.
- **Agent:** Booking desk (trip → board/alight → fare → pay) · station trips · Parcels (register/handoff/
  collect) · ticket lookup.
- **Passenger (mobile-first):** find + book · my tickets · track my bus (live map + ETA + get-ready alerts) ·
  send/track parcel · notifications · profile. Endpoints: `/trips`,`/fares`,`/bookings`(own),`/tracking`+
  sockets,`/packages`,`/notifications`,`/me`.
- **Driver (mobile-first):** my trips/schedule · manifest · broadcast location (browser Geolocation →
  `/tracking`) · trip status · report incident (photo). Endpoints: `/trips`,`/tracking`,`/incidents`,
  `/bookings`,`/me`.
- **⚠ Passenger self-booking — deferred in backend (not a bug):** bookings are staff-facing (agent-sold, per
  Tap&Go) and `trips` RLS is company-scoped, so passengers can't browse/self-book yet. Small additive backend
  fix (no schema change): (a) passenger-visible trips browse, (b) allow `passenger` to self-book (self-guard).
  **Approach:** build the passenger UI now; connect the working parts live (tickets, tracking, parcels,
  notifications); stub browse+book until those 2 endpoints land, then flip live.

## Backend integration
Typed client from `openapi.json` → per-resource **TanStack Query** hooks (cache keys, invalidation, optimistic
+ rollback) · **`apiFetch`** (base URL + Clerk token + `normalizeError`; 401→sign-in; 5xx retry) · **socket.io**
realtime (join:trip, reconnect + last-updated) · company switcher scoping · local dev via backend dev-auth.

## Testing — "integration is prod-safe" gate
Vitest + Testing Library (components + states) · **MSW** integration tests from `openapi.json` · **contract/
drift guard** (regenerate types in CI, fail on spec mismatch) · **Playwright E2E** (sign-in, create trip, sell
ticket, live-map on GPS ingest, cancel-cutoff+override, parcel custody, onboard, incident→reassign, cross-role
permissions) · axe a11y · i18n key coverage. Gate: every screen renders with real data, all states covered,
permissions enforced, types match spec, E2E + a11y + i18n green.

## Reminders (covered above)
Session expiry/refresh/sign-out · company-switcher scoping · permission-driven nav · socket reconnection +
last-updated · optimistic UI + rollback · pagination vs infinite scroll · server-side sort/filter/search
(client fallback) · destructive confirmations · unsaved-changes guard + autosave · command palette · print/
export (reprint ticket, CSV/PDF, audit) · Africa/Kigali TZ + RWF · favicon/meta · optional PWA · ErrorBoundary
+ 404/403/500 · 429 UX · reduced-motion · first-run empty states · notification center · data-freshness.
