# AbilityAPP — build progress log

**Always read this before starting work.** Update after every shipped slice.  
**Roadmap:** [SCOPE-ROADMAP.md](./SCOPE-ROADMAP.md) · **Standards:** [BUILD-EXPECTATIONS.md](./BUILD-EXPECTATIONS.md)

---

## Overall program progress

| Metric | Value |
|--------|-------|
| **Overall completion** | **24%** |
| **Current work package** | WP-B — Service booking compliance (Chunk 3) |
| **Active slice** | WP-B.1 — Compliance rule engine ✅ shipped |
| **Next slice** | WP-B.2 — Cancellation policy engine |
| **Last verified** | 2026-06-18 — build OK |
| **Last push** | _pending_ |

---

## Dependency spine (do not skip)

```
Chunk 1 Client ──► Chunk 3 Booking ──► Chunk 4 Roster ──► Chunk 7 Billing
       │                  │                    │                  │
       └──── Chunk 2 Agreement ──────────────┴──► Chunk 6 Timesheet
       │
       └──► Chunk 5 Planning ──► Chunk 8 Reconcile
Chunk 0 Portal/CRM (parallel after Chunk 1 basics)
```

---

## Chunk progress

| Chunk | Name | Weight | Done | Status | Blockers |
|-------|------|--------|------|--------|----------|
| 0 | Enquiry & CRM + portal | 10% | 2% | 🟡 Partial | Portal auth (default: magic link) |
| 1 | Client & plan management | 12% | **55%** | 🟡 Partial | WP-A complete |
| 2 | Service agreements | 10% | 5% | 🟡 Partial | Templates (default scaffold OK) |
| 3 | Service bookings compliance | 12% | **25%** | 🔵 In progress | None |
| 4 | Rostering | 22% | 0% | ⬜ Placeholder | Requires Chunk 1–3 |
| 5 | Service planning | 8% | 0% | ⬜ Not started | Chunk 1 budgets ✅ |
| 6 | Timesheets & payroll export | 10% | 2% | ⬜ Placeholder | Chunk 4 shifts |
| 7 | Billing & claiming | 10% | 0% | ⬜ Not started | PRODA/gateway |
| 8 | Reconciliation | 6% | 3% | ⬜ Not started | Chunks 5 + 7 |

**Platform cross-cutting** (auth, roles, audit, AI, reports): ~85%

---

## WP-A — Client foundation (Chunk 1) ✅ COMPLETE

| Slice | Deliverable | Status | % of WP-A |
|-------|-------------|--------|-----------|
| A.1 | Client lifecycle status | ✅ Done | 20% |
| A.2 | Plan budget line table | ✅ Done | 25% |
| A.3 | Consent tab alignment (service / information / photo) | ✅ Done | 15% |
| A.4 | Plan manual entry wizard | ✅ Done | 20% |
| A.5 | Utilisation summary on Overview | ✅ Done | 20% |

**WP-A completion:** 100%

---

## WP-B — Service booking compliance (Chunk 3)

| Slice | Deliverable | Status |
|-------|-------------|--------|
| B.1 | Compliance rule engine + UI panel + save blocks | ✅ Done |
| B.2 | UI warnings vs hard blocks (extend rules) | ⬜ Next |
| B.3 | Cancellation policy engine | ⬜ |
| B.4 | Budget line validation link | ✅ Done (in B.1) |

**WP-B completion:** 35%

---

## WP-C — Service agreements (Chunk 2)

| Slice | Deliverable | Status |
|-------|-------------|--------|
| C.1 | Template + schedule of supports | ⬜ |
| C.2 | Lifecycle states Draft → Active | ⬜ |
| C.3 | In-app e-sign capture | ⬜ |
| C.4 | Expiry notification hook | ⬜ |

**WP-C completion:** 0%

---

## Shipped log

| Date | Commit | What shipped |
|------|--------|--------------|
| 2026-06-18 | _pending_ | WP-A.3–A.5: consent status, core consent summary, plan wizard, overview utilisation |
| 2026-06-18 | _pending_ | WP-B.1: booking compliance engine + panel + save block |
| 2026-06-18 | 0ad2f6c | WP-A.2: plan budget lines |
| 2026-06-18 | bd60219 | WP-A.1: lifecycle status + governance |

---

## Verification log

| Date | Command | Result |
|------|---------|--------|
| 2026-06-18 | `npm run build` | exit 0 |
| 2026-06-18 | `npm run page-guides:check` | exit 0 |
| 2026-06-18 | `npm run supabase:push-remote` | `20260624160000` applied |

---

## How to update this file

1. After each slice: update chunk %, WP slice status, overall %, shipped log, verification log.
2. Set **Next slice** to the first incomplete item on the critical path.
