# UAT-14 — Participant portal

**Pack:** UAT-14 | **Priority:** P3 | **Owner:** Product  
**Environment:** `http://localhost:3000` (dev) + Amplify after `PORTAL_DEMO_EXPOSE_LINK` deploy  
**Tester:** AI-browser | **Completed:** 2026-06-18 | **Result:** **Pass**

**Demo participant:** `Bernie@email` (Bernadette Rose / `bp-bern`)

## Scenarios

| UAT ID | Route | Expected | Result |
|--------|-------|----------|--------|
| UAT-14-S-001 | `/portal/login` | Sign-in form; magic link request for participant email | **Pass** — form loads; demo link returned |
| UAT-14-S-002 | `/portal` | Dashboard hub signed in as participant | **Pass** — "Hello, Bernie" + nav cards |
| UAT-14-S-003 | `/portal/budget` | Plan budget summary (read-only) | **Pass** — page loads; empty state when no budget lines published |
| UAT-14-S-004 | `/portal/services` | Upcoming rostered supports (week + list) | **Pass** — 2 supports in current week calendar |
| UAT-14-S-005 | `/portal/requests` | Submit service request | **Pass** — request submitted; success message shown |

## Steps (reference)

1. Open `/portal/login` — no staff session required.
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
