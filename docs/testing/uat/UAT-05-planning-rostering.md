# UAT-05 — Service planning & rostering

**Pack:** UAT-05 | **Priority:** P0 | **Owner:** RileyShaw (Rostering Manager) | **HP:** Flow 4

## Preconditions

- `?week=2026-06-09`; `npm run supabase:seed-e2e-amplify`

## Scenarios

| UAT ID | Scenario | Steps | Expected | Result |
|--------|----------|-------|----------|--------|
| UAT-05-S-001 | Service planning | `/service-planning` | Demand from bookings | **Pass** — June 2026 plans; Bern + ELCL12 rows |
| UAT-05-S-002 | Multi-provider budget | `/multi-provider-budget` | View loads | **Pass** — link from service planning |
| UAT-05-S-003 | Roster week view | `/rostering?week=2026-06-09` | Shifts on grid | **Pass** — week 8–14 Jun; Bern shifts (IslaR, OlvW, GabW) |
| UAT-05-S-004 | Assign worker | Edit shift — worker | Saves; hints shown | **Pass** — staffed shifts on grid (T1 TEST-051) |
| UAT-05-S-005 | Publish week | Publish staffed drafts | Published; notify task | **Pass** — **1 ready · 0 blocked**; RileyShaw publish (TEST-060) |
| UAT-05-S-006 | Qualification block | Worker without WWCC | Publish blocked | **Pass** — publish panel blocks missing credentials (seeded WWCC fix in TEST-060) |
| UAT-05-S-007 | RoC / forward plan | Roster views | Load without error | **Pass** — RoC + Forward plan tabs render |
| UAT-05-S-008 | Open shifts list | Rostering open shifts tab | Vacant shifts visible | **Pass** — **Open shifts 23** tab |
| UAT-05-S-009 | Agency worker register | `/agency-workers` | Vendor-linked workers list | **Pass** — Jane/Mike → StaffPlus (localhost 2026-06-24) |
| UAT-05-S-010 | Request agency on gap | `/rostering?week=2025-10-06` Gaps | Request agency drawer on BERN-TUE-VAC | **Pass** — Amplify 2026-06-24 RileyShaw; StaffPlus in vendor list |
| UAT-05-S-011 | Site orientation gate | Confirm without orientation | Block with message | **Pass** — logic in `confirmAgencyShift`; Jane seeded oriented at Glenelg SIL |
| UAT-05-S-012 | Agency portal help | `/agency-portal/help` after vendor sign-in | Vendor-only how-to and escalation paths visible | **Pass** — Amplify smoke (2026-06-25) |
| UAT-05-S-013 | Agency portal dashboard | `/agency-portal` after vendor sign-in | Next-step banner, summary tiles (Awaiting you / Ready to invoice / With finance / Paid), badged action cards | **Pass** — Amplify smoke (2026-06-25); StaffPlus "1 invoice with finance" |
| UAT-05-S-014 | Agency portal login landing | `/agency-portal/login` | Branded landing with org logo/name/address/contact strip, help + staff links, and vendor magic-link request | **Pass** — Amplify 2026-06-25; `roster@staffplus.example` returned **Open agency portal** demo link |
| UAT-05-S-015 | Buddy shift on roster | `/rostering?week=2025-10-06` | Seeded `BERN-MON-BUDDY` with Buddy + Non-payable badges | Pending seeded DB smoke — local dataset did not include the seeded buddy row |
| UAT-05-S-016 | Add buddy shift | Add buddy shift on staffed card | Linked shift editor opens with pay/billing fields | **Pass** — localhost 2026-06-25; editor opens with purpose, billing, pay, reason, and linked primary |
| UAT-05-S-017 | Buddy pay policy | `/system/settings/buddy-shifts` | Org policy saves (always pay / don't pay / ask) | **Partial** — localhost 2026-06-25; policy options and audit footer render after System access fix; save not mutated |
| UAT-05-S-018 | Primary cancel cascade | Cancel primary shift | Linked buddy shift auto-cancelled | Pending seeded DB smoke |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-05** — all **Pass** on Amplify (2026-06-22).
