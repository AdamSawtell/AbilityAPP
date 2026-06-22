# Happy path — executable test runbooks

Step-by-step smokes for [HAPPY-PATH-E2E-MATRIX.md](./HAPPY-PATH-E2E-MATRIX.md). Log failures in [ISSUE-LOG-TEMPLATE.md](./ISSUE-LOG-TEMPLATE.md).

**Before all smokes:** `npm run supabase:seed-e2e-intake` and `npm run supabase:seed-e2e-amplify` (remote DB).

---

## TEST-010 — Flow 1 enquiry intake

| | |
|--|--|
| **User** | GabrielaWilson / welcome → Intake Coordinator |
| **DATA** | `1000013` (from scratch) or `1000025` (pre-Proposal after intake seed) |
| **Pass if** | Enquiry at Proposal with qualification tier set; activity saves; audit footer visible |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Sign in; open `/enquiries` | List loads; module audit label |
| 2 | Open `/enquiries/1000013` (or `1000025`) | Pipeline panel visible |
| 3 | Advance to Qualification; save NDIS fields on Qualification tab | Score/tier updates |
| 4 | Advance to Proposal | Status `3_Proposal` |
| 5 | Add Activity line; save | Persists after refresh |
| 6 | Full audit trail | Save event with field detail |

---

## TEST-020 — Flow 2 convert to client

| | |
|--|--|
| **User** | GabrielaWilson / welcome → Intake Coordinator (or IslaRobinson with **Intake** role — not Support Coordinator) |
| **DATA** | `1000025` (after intake seed; not converted) |
| **Pass if** | New client linked; enquiry Converted |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open `/enquiries/1000025` | Convert available; no unsaved edits |
| 2 | Convert to client | Redirect/open client record |
| 3 | Enquiry shows Converted; client has enquiry link | IDs match |
| 4 | Full audit trail on both records | Convert logged |

---

## TEST-030 — Flow 3 client ready

| | |
|--|--|
| **User** | IslaRobinson / welcome |
| **DATA** | Converted Samuel client **or** `bp-bern` |
| **Pass if** | Lifecycle active; plan budget + billing saved |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Plan budget tab — review/add line | Saves; audit |
| 2 | Billing and communication — plan manager if plan-managed | Saves |
| 3 | Full profile — lifecycle **active** | Filter on Clients list |
| 4 | New service booking — compliance hint if intake/exit | Warning only when applicable |

---

## TEST-060 — Flow 4 delivery smoke

| | |
|--|--|
| **User** | RileyShaw / welcome (roster); OliverWilliams (worker check optional) |
| **DATA** | `bp-bern`, `?week=2026-06-09`, `rs-e2e-smoke-today` |
| **Pass if** | Publish 1 shift; status Published |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | `/rostering?week=2026-06-09` | June week; smoke shift Fri 12 Jun |
| 2 | Publish week panel | 1 ready · 0 blocked |
| 3 | Publish 1 shift | Shift Published |
| 4 | (Optional) Oliver `/my/shifts` week view | Shift visible for assigned worker |

---

## TEST-085 — Flow 5 billing smoke

| | |
|--|--|
| **User** | SuperUser or JessicaHancock / welcome |
| **DATA** | June 2026 period; `bp-bern` agency claim path |
| **Pass if** | Claims preview/generate sane; rollup aligns |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | `/generate-claims` — June 2026 | Preview lines; PAPL messages |
| 2 | Open `/claims/cl-jun26-bern` (or display ref) | Detail loads |
| 3 | `/generate-invoices` — June 2026 | Eligible count matches seed |
| 4 | Bern plan budget — apply billing rollup | Claimed matches panel |
| 5 | `/plan-reconciliation` — June 2026 | Variance row loads |

---

## TEST-090 — Flow 6 employee credentials

| | |
|--|--|
| **User** | HR manager or SuperUser |
| **DATA** | `emp-oliver` |
| **Pass if** | WWCC + NDIS screening Current on file |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | `/employees/emp-oliver` → Credentials | Mandatory creds Current |
| 2 | Rostering publish week (Riley) | No credential block for Oliver |

---

## TEST-095 — Flow 7 participant exit

| | |
|--|--|
| **User** | IslaRobinson / welcome |
| **DATA** | `bp-e2e-exit` (after intake seed) |
| **Pass if** | Lifecycle exit + reason saved |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open `/clients/bp-e2e-exit` | Active lifecycle |
| 2 | Activity — exit handover note | Saves |
| 3 | Full profile — lifecycle **exit** + reason | Persists after refresh |

---

## TEST-097 — Flow 9 financial close

| | |
|--|--|
| **User** | TessaNguyen / welcome |
| **Pass if** | Checklist loads for June 2026 (close may block — expected) |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | `/financial-close` — period 2026-06 | Checklist renders |
| 2 | Review blocker messages | Documented; no console errors |

---

## TEST-099 — Flow 11 reporting wrap

| | |
|--|--|
| **User** | SuperUser or Quality manager |
| **Pass if** | Audit pack + board report render |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | `/ndis-audit-pack` — June 2026 | Export/run completes |
| 2 | `/board-reporting` | KPI sections render |

---

## Quick chain (release candidate)

```text
seed-e2e-intake → seed-e2e-amplify
TEST-010 → TEST-020 → TEST-030 → TEST-060 → TEST-085
```

Optional same session: TEST-090, TEST-095, TEST-097, TEST-099.
