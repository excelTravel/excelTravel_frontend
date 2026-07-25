# Fleet status thresholds — provisional, pending ops manager sign-off

The Live Map (`/network`) and the Fleet → Vehicles panel show a **maintenance** tag and a **driver
license** tag per vehicle. Both tags are computed from real data (a vehicle's most recent maintenance
log `nextServiceDate`, and a driver's `licenseExpiry`), but the *thresholds* that decide which tag shows
— "soon to be maintained" vs "properly maintained", "expiring soon" vs "active" — were **not specified
by the ops manager**. We picked reasonable-sounding defaults so the feature isn't blocked, but these are
our guess, not a confirmed policy. Confirm the real numbers with ops before relying on these tags
operationally, then update the two constants below.

## Where the numbers live

`excelTravel_frontend/src/lib/fleetStatus.ts`:

```ts
export const MAINTENANCE_DUE_SOON_DAYS = 5;
export const LICENSE_EXPIRING_SOON_MONTHS = 3;
```

Both `maintenanceStatus()` and `licenseStatus()` in that file are pure functions (data in, tag out) —
change the two constants and every screen that uses them (Live Map bus list, and once wired, Fleet →
Vehicles cards) updates automatically. No other file needs touching for a threshold change alone.

## Current provisional rules

**Vehicle maintenance** (from the vehicle's latest `maintenance_logs.next_service_date`):

| Condition | Tag | Tone |
|---|---|---|
| No maintenance log exists for the vehicle | "No service logged" | neutral |
| `next_service_date` is in the past | "Due for maintenance" | danger (red) |
| `next_service_date` is within **5 days** from now | "Soon to be maintained" | warning (amber) |
| `next_service_date` is more than 5 days away | "Properly maintained" | success (green) |

**Driver license** (from `drivers.license_expiry`):

| Condition | Tag | Tone |
|---|---|---|
| No `license_expiry` on file | "No license on file" | neutral |
| `license_expiry` is in the past | "License expired" | danger (red) |
| `license_expiry` is within **3 months** from now | "License expiring soon" | warning (amber) |
| `license_expiry` is more than 3 months away | "License active" | success (green) |

## Open questions for the ops manager

- Is 5 days the right maintenance lead time, or does it vary by vehicle type/age/mileage instead of a
  flat day count? (`maintenance_logs.next_service_km` also exists — should the "soon" tag ever key off
  remaining km instead of/alongside the date?)
- Is 3 months the right license-renewal lead time, or should it match whatever grace period Rwanda's
  transport licensing actually gives drivers?
- Should "no service logged" / "no license on file" show as neutral (current behavior) or be escalated
  to a warning, since an untracked vehicle/driver is arguably a bigger operational risk than a tracked
  one that's merely due soon?
- Maintenance is tracked by whoever logs a `maintenance_logs` row by hand today — is there a real
  workflow/reminder process behind that, or does this need building out (recurring reminders, a
  dedicated "log service" action in the UI) before these tags are trustworthy in production?
