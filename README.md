# excelTravel — Web Frontend

Responsive web portals for all excelTravel roles (super admin, company admin, ops manager, agent, driver,
passenger). React + TypeScript + Vite + Tailwind + shadcn/ui, talking to `excelTravel_backend`.

## Quick start
```bash
cp .env.example .env.local   # fill in the values
npm install
npm run openapi:types        # generate API types from ../excelTravel_backend/openapi.json
npm run dev                  # http://localhost:5173
```

## Docs
- `CLAUDE.md` — technical reference + context anchor (stack, backend contract, conventions, screen checklist).
- `docs/frontend-plan.md` — the full build plan (design system, per-role screens, integration, testing).

## Scripts
`dev` · `build` · `preview` · `typecheck` · `lint` · `openapi:types` · `test` · `test:e2e`

The backend must be running (and its migrations applied) for live data. Local dev can use the backend's
dev-auth shortcut — see `../excelTravel_backend`.
