# CLAUDE.md — excelTravel Frontend (web)

> AI operating rules live in the workspace-root `../CLAUDE.md`. Product/architecture WHY lives in
> `../project context.md`. This file is the **frontend technical reference + context anchor** — read it first
> so any session resumes without re-deriving context.

## What this is
The **web frontend** for excelTravel — responsive portals for **all six roles** (super_admin, company_admin,
manager, agent, driver, passenger). It talks to the `excelTravel_backend` API. Native Flutter apps
(`excelTravel_mobile`) come later and reuse these flows. Design language = the approved **glassmorphism**
Overview: navy base + **teal** signature accent, frosted cards, RWF currency, EN/KIN, Rwanda live map.

## Stack (locked)
- **React 18 + TypeScript + Vite** (SPA behind in-house OTP auth — no SSR, self-hostable as static files, zero billing).
- **Tailwind CSS + shadcn/ui** (Radix). Icons: **lucide-react**.
- **TanStack Query** for server state; **Zustand** for light UI state.
- **React Router** for routing.
- **In-house email/phone + OTP auth** (`src/lib/auth/session.ts` zustand store + `src/lib/api/client.ts`): short-lived
  access token kept in memory and attached as a bearer token on API calls; an opaque refresh token persists in
  `localStorage` so `bootstrapSession()` can silently restore a session on reload via `POST /auth/refresh`.
- **react-i18next** (EN + KIN); **date-fns** (Africa/Kigali timezone), RWF/number locale formatting.
- **React Hook Form + Zod** for forms + input validation; **DOMPurify** for any rich text.
- **MapLibre GL + free OSM tiles** (zero billing) for live tracking maps. Map feature lives in
  `src/features/map/`: `RwandaMap` (lazy-loaded/code-split; OSM raster fallback or `VITE_MAP_STYLE_URL`
  vector style; route lines + pulsing bus markers), `MapPreview` (compact non-interactive card that
  deep-links to `/map`), and `useLiveBuses` (STUB positions today; matches the `bus:location` socket payload
  so it swaps to a live subscription with no call-site changes). Map stays light in both themes — for dark
  tiles set a dark `VITE_MAP_STYLE_URL` (inverting the raster canvas would also invert markers/routes).
- **Recharts** for charts. **socket.io-client** for realtime. **Cloudinary** for image uploads.
- **framer-motion** for motion. Shared vocabulary in `src/lib/motion.ts` (durations/easings/variants) +
  primitives in `src/components/motion/Motion.tsx` (`PageTransition`, `Reveal`/`RevealItem` staggered section
  reveals, `MotionCard` hover-lift). Reuse these — do not hand-roll page/section animations. Route transitions
  are wired once in `AppShell` (keyed `AnimatePresence`). All primitives honor `prefers-reduced-motion` in JS.
- Tests: **Vitest + Testing Library + MSW** (integration from the OpenAPI spec) + **Playwright** (E2E).

## Backend contract (how we talk to it)
- Base URL from `VITE_API_BASE_URL` (dev: `http://localhost:3000`). All API under `/api/v1`.
- **Types are generated from `../excelTravel_backend/openapi.json`** (`npm run openapi:types` →
  `src/lib/api/types.ts`). This is build-time only; **runtime calls go directly to the backend over HTTP.**
- Auth: our own access token (from `src/lib/auth/session.ts`) as a bearer token in `Authorization`. Local dev can use the backend's dev-auth (no token) — see backend `.env`.
- Realtime socket events: `bus:location`, `bus:alert`, `trip:status` (join a trip room to receive them).
- The backend enforces RLS/RBAC — the frontend only hides/disables what a role can't use (never the security boundary).

## Folder structure
```
src/
├── app/            # providers, router, app shell
├── components/ui/  # shadcn/ui + shared primitives (Button, GlassCard, KpiCard, StatusPill, Skeleton, ...)
├── features/       # one folder per domain (trips, bookings, tracking, packages, ...): components + hooks
├── lib/
│   ├── api/        # generated types, apiFetch wrapper, normalizeError, TanStack Query hooks
│   ├── i18n/       # react-i18next setup + en/kin messages
│   └── utils.ts    # cn(), formatters (RWF, dates)
├── store/          # zustand stores (theme, ui)
└── styles/         # tokens.css (design tokens), index.css
```

## Conventions
- Feature-folder pattern (mirrors the backend). Named exports. No `any`.
- **Every data surface ships loading (skeleton) + empty + error states** — never a bare spinner or raw error text.
- **Errors are informational**: a central `normalizeError()` maps HTTP status → friendly, i18n'd, color-coded,
  positioned messages (inline on fields · toast for actions · full-page for load failures) with a recovery action.
- **Security (frontend responsibilities):** validate every input with Zod before submit; sanitize any rich text
  with DOMPurify; never `dangerouslySetInnerHTML` on user content; no secrets in the client. SQL injection is a
  backend concern (Prisma parameterizes + Zod validates + RLS) — the backend always re-validates.
- Tokens only (no raw hex in components). Glass utility only on elevated cards, never behind dense tables.
- Respect `prefers-reduced-motion`; keep contrast ≥4.5:1 (test on glass). Mobile-first for passenger/driver portals.

## Commands
```
npm run dev            # Vite dev server
npm run build          # typecheck + production build
npm run preview        # preview the build
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run openapi:types  # regenerate API types from ../excelTravel_backend/openapi.json
npm run test           # vitest
npm run test:e2e       # playwright
```

## Screen checklist (update as screens land)
Foundation: [x] scaffold [x] tokens [x] API client [x] i18n [x] auth/shell [ ] design-system page
Screens: [x] Overview [x] Trips — **route-centric**: Routes view (live-trip connector + combined revenue +
drill-in of active/scheduled/completed) + All-trips list + Scheduling (agent+passenger waitlist, early-dispatch,
origin-bus check) + detail + per-trip Manage [x] Booking desk (Bookings → Desk toggle) [x] Bookings
[x] Fleet console (Vehicles / Drivers roster+fairness / Maintenance=coming-soon / Accidents)
[x] Network — **Map** (live+scheduled buses, pin-to-add-stop) / Routes / Stops / Fares (per-route + matrix)
[x] Users (Staff / Agents / Passengers-with-metrics) [x] Analytics [x] Parcels [x] Notifications [x] Settings
Auth: [x] Login (email/phone + OTP) · Passenger/Driver/Agent portals: built, but in `excelTravel_mobile`
(Flutter), not this repo — manager/company_admin/super_admin have no native app by design and use this
web console, so it needs to be genuinely mobile-responsive too, not just desktop.
Removed from ops build: standalone Live Map (now Network→Map), Admin/Companies/Audit (→ future
system-admin surface). Private-bookings (whole-bus charter) was reactivated into Bookings → "Charter
requests" tab. Plates are formatted `RAA-000-A`.

**Screens are wired to the live API** via `src/lib/api/hooks.ts` (TanStack Query, ~840 lines, consumed from
37+ page/feature files) — this is stale-doc territory to double-check before trusting: verify with
`grep -rl "lib/api/hooks" src` rather than assuming. Full EN/KIN i18n + dark mode + code-split routes.
Remaining mock-ahead features (screens still waiting on a backend endpoint) + known backend gaps are tracked
in `docs/integration-map.md` — check that file for the current per-screen list rather than assuming
everything is live.

## Status
Foundation being set up while final visual designs are prepared (Stitch → Figma). Design-dependent screens
wait for designs; design-independent foundation (scaffold, tokens, API client, i18n, auth, shell, tests) proceeds now.
