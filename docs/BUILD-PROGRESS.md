# AbilityAPP — build progress log

**Always read this before starting work.** Update after every shipped slice.  
**Roadmap:** [SCOPE-ROADMAP.md](./SCOPE-ROADMAP.md) · **Standards:** [BUILD-EXPECTATIONS.md](./BUILD-EXPECTATIONS.md)

---

## Overall program progress

| Metric | Value |
|--------|-------|
| **Overall completion** | **19%** |
| **Current work package** | WP-A — Client foundation (Chunk 1) |
| **Active slice** | WP-A.1 — Client lifecycle status ✅ shipped |
| **Next slice** | WP-A.2 — Plan budget line table |
| **Last verified** | 2026-06-18 — build + page-guides OK |
| **Last push** | 2026-06-18 — `6032a7f` |

Progress is weighted by scope chunk size (rostering and downstream modules carry more weight once started).

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
| 1 | Client & plan management | 12% | **18%** | 🔵 In progress | None |
| 2 | Service agreements | 10% | 5% | 🟡 Partial | Templates (default scaffold OK) |
| 3 | Service bookings compliance | 12% | 8% | 🟡 Partial | Needs Chunk 1 budgets |
| 4 | Rostering | 22% | 0% | ⬜ Placeholder | **Requires Chunk 1–3** |
| 5 | Service planning | 8% | 0% | ⬜ Not started | Chunk 1 budgets |
| 6 | Timesheets & payroll export | 10% | 2% | ⬜ Placeholder | Chunk 4 shifts; payroll OAuth |
| 7 | Billing & claiming | 10% | 0% | ⬜ Not started | PRODA/gateway |
| 8 | Reconciliation | 6% | 3% | ⬜ Not started | Chunks 5 + 7 |

**Platform cross-cutting** (auth, roles, audit, AI, reports): ~85% — not counted in chunk weights above.

---

## WP-A — Client foundation (Chunk 1)

| Slice | Deliverable | Status | % of WP-A |
|-------|-------------|--------|-----------|
| A.1 | Client lifecycle status (DB, UI, filters, audit) | ✅ Done | 20% |
| A.2 | Plan budget line table (Core/CB/Capital categories) | ⬜ Next | 25% |
| A.3 | Consent tab alignment (service / information / photo) | ⬜ | 15% |
| A.4 | Plan manual entry wizard | ⬜ | 20% |
| A.5 | Utilisation summary panel (read-only) | ⬜ | 20% |

**WP-A completion:** 20% (1/5 slices)

---

## WP-B — Service booking compliance (Chunk 3)

| Slice | Deliverable | Status |
|-------|-------------|--------|
| B.1 | Compliance rule engine module | ⬜ |
| B.2 | UI warnings vs hard blocks | ⬜ |
| B.3 | Cancellation policy engine | ⬜ |
| B.4 | Budget line validation link | ⬜ Blocked on A.2 |

**WP-B completion:** 0% — start after WP-A.2

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
| 2026-06-18 | 6032a7f | WP-A.1: `lifecycle_status`, plan review due, exit reason; list filters; audit + governance docs |
| 2026-06-18 | _prior_ | Governance docs (BUILD-EXPECTATIONS, SCOPE-ROADMAP, AGENT-PLAYBOOK) |
| 2026-06 | 5126a5d | Roles window access tile UI |
| 2026-06 | e35e09f | Per-window read/write access |
| 2026-06 | 42c1f20 | Roles page scroll fix |

---

## Verification log

| Date | Command | Result |
|------|---------|--------|
| 2026-06-18 | `npm run build` | exit 0 |
| 2026-06-18 | `npm run page-guides:check` | exit 0 (76 routes) |
| 2026-06-18 | `npm run supabase:push-remote` | migration `20260624120000` applied |

---

## How to update this file

1. After each slice: update chunk %, WP slice status, overall %, shipped log, verification log.
2. Recalculate **Overall completion** using chunk weights × chunk % complete (approximate is fine).
3. Set **Next slice** to the first incomplete item on the critical path.
