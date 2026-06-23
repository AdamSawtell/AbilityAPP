# UAT-14 — Participant portal

**Pack:** UAT-14 | **Priority:** P3 | **Owner:** Product  
**Environment:** localhost + [Amplify demo](https://main.d3vim3geq5td01.amplifyapp.com)  
**Tester:** AI-browser | **Completed:** 2026-06-18 / 2026-06-23 Amplify re-check | **Result:** **Pass**

## How to access (not in staff sidebar)

| Step | Action |
|------|--------|
| 1 | Open **[Amplify portal login](https://main.d3vim3geq5td01.amplifyapp.com/portal/login)** or `http://localhost:3000/portal/login` locally |
| 2 | Do **not** use staff `/login` — portal is a separate surface |
| 3 | Enter **`Bernie@email`** (must match client **Email** on `/clients/bp-bern`) |
| 4 | **Email me a sign-in link** → click **Open portal** under the demo link |
| 5 | Hub at `/portal` — **My services**, **My funding**, **Request a service** |

**Demo participant:** `Bernie@email` (Bernadette Rose / `bp-bern`)

## Scenarios

| UAT ID | Route | Expected | Result |
|--------|-------|----------|--------|
| UAT-14-S-001 | `/portal/login` | Sign-in form; magic link request for participant email | **Pass** — localhost + Amplify demo link |
| UAT-14-S-002 | `/portal` | Dashboard hub signed in as participant | **Pass** — "Hello, Bernie" + nav cards |
| UAT-14-S-003 | `/portal/budget` | Plan budget summary (read-only) | **Pass** — page loads; empty state when no budget lines published |
| UAT-14-S-004 | `/portal/services` | Upcoming rostered supports (week + list) | **Pass** — 2 supports in current week calendar |
| UAT-14-S-005 | `/portal/requests` | Submit service request | **Pass** — request submitted; success message shown |

## Steps (reference)

1. Open [portal login](https://main.d3vim3geq5td01.amplifyapp.com/portal/login) (Amplify) or `http://localhost:3000/portal/login` (local) — no staff session required.
2. Enter `Bernie@email` → **Email me a sign-in link** → open **Demo sign-in link** (dev and Amplify demo with `PORTAL_DEMO_EXPOSE_LINK=true`).
3. Hub → **My services** — week view shows rostered shifts.
4. **My funding** — budget summary or empty-state message.
5. **Request a service** → **New request** → fill description → **Submit request** → confirmation banner.

## Staff cross-check (optional)

- Client **Bern** → **Requests** tab — portal request listed with review task link.

## Notes

- Production outbound email for magic links is not wired; demo exposes the link via `PORTAL_DEMO_EXPOSE_LINK` (default `true` in `amplify.yml`).
- Portal is **MVP in release** — not full production participant self-service (no NDIS login, no branded tenant URLs).

## Related

- Help: **Participant portal** article  
- BUILD-PROGRESS: WP-0.3, WP-0.4, WP-G.0, WP-0.7  
- [HAPPY-PATH-E2E-MATRIX.md](../HAPPY-PATH-E2E-MATRIX.md) — portal row updated to **Live (MVP)**
