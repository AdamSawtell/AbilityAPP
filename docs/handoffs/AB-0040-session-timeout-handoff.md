# AB-0040 session timeout handoff

## Scope

AB-0040 adds an organisation-level idle workspace timeout. Staff now receive a 2-minute warning after the configured idle period. If they do not click **Stay signed in**, AbilityVua logs them out, records the session as timed out, and redirects to `/login?expired=inactivity`.

## Delivered

| Area | Outcome |
|------|---------|
| Client idle timer | `useIdleTimer` tracks mouse, click, key, and touch activity per browser tab |
| Warning modal | Non-dismissible `SessionExpiryModal` with countdown and **Stay signed in** |
| Workspace wiring | `SessionIdleGate` runs inside the authenticated app and skips login, System, portal, and agency portal routes |
| Logout/audit | Inactivity logout passes `reason=inactivity`; `/api/auth/session` records `timed_out` via session audit |
| Health check | `/api/auth/session/health` checks active sessions after focus or device wake |
| Admin settings | `/system/settings/security` lets System operators set 5 to 120 minutes |
| Data | `app_organization.idle_timeout_minutes` default 15, check constraint 5 to 120 |
| Docs | Help article, page guide, TEST-103, UAT-13-S-017, core docs, and database guide updated |

## Test plan

1. Sign in to System setup and open `/system/settings/security`.
2. Save a timeout between 5 and 120 minutes.
3. Confirm the audit footer is visible and Full audit trail shows Idle session timeout.
4. Wait idle until the modal appears.
5. Click **Stay signed in** and confirm the modal closes without losing page state.
6. Wait again and let the countdown expire.
7. Confirm redirect to `/login?expired=inactivity` and the login page inactivity message.
8. Open User Session Audit and confirm the session is timed out.

## Verification

| Check | Result |
|-------|--------|
| `npm run build` | exit 0 |
| `npm run page-guides:check` | exit 0 (142 routes, 0 article gaps) |
| `npx tsc --noEmit` | exit 0 |
| `npm run uat:inventory` | exit 0 (181 windows, 48 processes, 10 reports) |
| `npm run supabase:push-remote` | exit 0; applied `20260630171200_session_idle_timeout` |
| `node scripts/run-all-remote-seeds.mjs supabase/seed-access.sql` | exit 0 |
| Browser smoke | PASS on localhost: `/system/settings/security` loads for System operator; setting save succeeds and restores to 15; audit footer/help visible; simulated inactivity logout redirects to login message |

**Note:** Cursor browser instrumentation added `data-cursor-ref` attributes to the loading skeleton and triggered a dev hydration warning. Functional smoke passed.
