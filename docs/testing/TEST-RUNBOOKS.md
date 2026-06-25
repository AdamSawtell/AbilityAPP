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
| 5 | Activity tab → Add activity → click row → fill subject and description in drawer → Save enquiry | Line in list; persists after refresh |
| 6 | Full audit trail | Save event with field detail |

---

## TEST-061 — Client activity line drawer

| | |
|--|--|
| **User** | SuperUser / flamingo |
| **DATA** | `bp-bern` |
| **Pass if** | Activity list + drawer; parent save persists line |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open `/clients/bp-bern?tab=Activity` | Summary columns visible |
| 2 | Click a row | Line drawer opens |
| 3 | Edit description; close drawer; Save client | Persists after refresh |
| 4 | Add activity | Drawer opens; new row in list after close |
| 5 | Full audit trail | Save shows line change |

---

## TEST-062 — Activity deletion policy

| | |
|--|--|
| **User** | GabrielaWilson / welcome → Support Coordinator (non-admin), then SuperUser / flamingo |
| **DATA** | `bp-bern` |
| **Pass if** | Non-admin sees Request deletion (not Remove); request creates admin task; admin sees Remove |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | As coordinator, open `/clients/bp-bern?tab=Activity` | Hint about admin-only removal |
| 2 | Open a row in drawer | Request deletion visible; no Remove |
| 3 | Click Request deletion | Success message with task number |
| 4 | Switch to SuperUser (Admin) | Remove visible in drawer |
| 5 | Tasks for Admin role | Open activity-deletion task linked to client |

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
| 3 | Support Plan — edit About me field; save | Persists; audit |
| 4 | Support Plan — Print support plan | Print opens or registry message; no error banner |
| 5 | Support Plan — Send via Email on `bp-bern` | Registry reference; email draft opens (PDF attached when server render succeeds) |
| 6 | Full profile — lifecycle **active** | Filter on Clients list |
| 7 | New service booking — compliance hint if intake/exit | Warning only when applicable |

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

## TEST-061 — Buddy shift management (AB-0022)

| | |
|--|--|
| **User** | RileyShaw / welcome (rostering); System admin for policy |
| **DATA** | `rs-bern-mon-buddy`, `?week=2025-10-06`, org `buddyShiftPayPolicy=ask` |
| **Pass if** | Seeded buddy visible; policy saves; non-payable line on timesheet; excluded from payroll CSV and claim generation |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | `/system/settings/buddy-shifts` (System sign-in) | Policy radio group loads; save persists |
| 2 | `/rostering?week=2025-10-06` | `BERN-MON-BUDDY` shows Buddy + Non-payable badges |
| 3 | Add buddy shift on staffed shift | Editor opens with purpose, billing, pay, reason, linked primary |
| 4 | Cancel primary shift with linked buddy | Buddy shift status Cancelled |
| 5 | `/generate-timesheets` for week | Buddy line on timesheet with Non-payable badge |
| 6 | Payroll export / generate claims | Non-payable excluded from payroll; non-billable skipped in claims preview |

---

## TEST-063 — Training and meeting scheduling (AB-0021)

| | |
|--|--|
| **User** | RileyShaw / welcome or SuperUser / flamingo |
| **DATA** | `rs-train-manual-isla`, `rs-train-manual-gabriela`, week `2025-10-06` |
| **Pass if** | Training session schedules roster rows, roster shows Training/Admin cost badges, attendance sign-off stamps attendee rows, and cost centre summary updates |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | `/workforce-planning/training` | Training and meetings page loads with audit footer |
| 2 | Schedule a Training session for two attendees | Success message; session appears in Scheduled sessions |
| 3 | `/rostering?week=2025-10-06` | Seeded Manual handling refresher rows show Training + Admin cost badges |
| 4 | Set one attendee to Attended | Row shows signed-off user/time and status Completed |
| 5 | Review Cost summary | Training cost centre shows signed-off attended hours and estimated cost |

---

## TEST-070 — Agency staffing smoke (WP-AG.1)

| | |
|--|--|
| **User** | RileyShaw / welcome (rostering manager — has agency processes) |
| **DATA** | `bp-staffplus`, `aw-sp-jane`, `rs-bern-tue-vac`, week `2025-10-06` |
| **Pass if** | Register visible; gap request → propose Jane → send pack → confirm → Agency badge |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | `/agency-workers` | Jane Agency + Mike Relief; Works for StaffPlus |
| 1b | `/business-partners/bp-staffplus?tab=Agency workers` | Same workers on vendor tab; count badge |
| 1c | `/locations/loc-glenelg-sil?tab=Site orientation` | Jane orientation listed; add form saves |
| 1d | `/agency-workers/aw-sp-jane` | Site orientations section shows Glenelg row |
| 1e | `/generate-agency-timesheets` week `2025-10-06`–`2025-10-12` | StaffPlus draft; Jane 6 h vendor cost |
| 1f | `/agency-timesheets/{id}` | Approve for vendor invoice |
| 1g | Vendor portal `/agency-portal/help` | Vendor-only guide loads after agency portal sign-in; support escalation paths visible |
| 2 | `/rostering?week=2025-10-06` → **Gaps** | BERN-TUE-VAC vacant listed |
| 3 | **Request agency** → vendor StaffPlus | Request drawer opens; document no assigned |
| 4 | Propose **Jane Agency** → **Send shift pack** | Status Sent; mailto draft available |
| 5 | **Confirm agency shift** | No orientation error; week shows Jane + Agency badge |
| 6 | (Optional) **Complete agency shift** | Request Completed; shift Completed |
| 7 | Full audit trail on shift + request | Process events logged |

**Note:** Intake Coordinator (GabrielaWilson) lacks `request-agency-coverage` — **Request agency** hidden. Use RileyShaw or rostering officer.

---

## TEST-085 — Flow 5 billing smoke

| | |
|--|--|
| **User** | SuperUser or JessicaHancock / welcome |
| **DATA** | June 2026 period; `bp-bern` agency claim path |
| **Pass if** | Finance sidebar groups claims/invoices/reconciliation; claims preview/generate sane; rollup aligns |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open staff app as SuperUser or finance user | Finance menu visible when finance windows are granted |
| 2 | `/generate-claims` — June 2026 | Preview lines; PAPL messages |
| 3 | Open `/claims/cl-jun26-bern` (or display ref) | Detail loads from Finance menu/page |
| 4 | `/generate-invoices` — June 2026 | Eligible count matches seed |
| 5 | Bern plan budget — apply billing rollup | Claimed matches panel |
| 6 | `/plan-reconciliation` — June 2026 | Variance row loads |
| 7 | `/vendor-invoices` | Vendor invoices listed under Finance; how-to link resolves to Finance guide |

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

## TEST-091 — Flow 6 employee hire (extended)

| | |
|--|--|
| **User** | SandraBlake / welcome (HR Manager) |
| **DATA** | `emp-oliver` or new hire record |
| **Pass if** | Location, employment type, credential workflow accessible |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Employee → Address / site assignment | Location line saves |
| 2 | Employment tab — type + department | Employment fields save |
| 3 | My workplace → Credentials (worker) + HR review | Submit / approve path loads |

---

## TEST-092 — Flow 6 worker + roster eligibility

| | |
|--|--|
| **User** | OliverWilliams / welcome; RileyShaw for roster |
| **DATA** | `?week=2026-06-09` |
| **Pass if** | Worker my-workplace links; roster shows credential hints |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Oliver `/my/shifts`, `/my/timesheets` | Both load (not blocked) |
| 2 | Riley `/rostering` — assign / publish panel | Credential warnings when creds missing |

---

## TEST-093 — Flow 6 leave + credential audit

| | |
|--|--|
| **User** | OliverWilliams / welcome; SuperUser for audit |
| **Pass if** | Self-service leave/availability loads; credential save audited |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | `/my/leave`, `/my/availability` | Forms load |
| 2 | Credential save → Full audit trail | Field-level event logged |

---

## TEST-094 — Employee and incident line drawers

| | |
|--|--|
| **User** | SuperUser / flamingo |
| **DATA** | `emp-rostering-manager`, `inc-1000001` |
| **Pass if** | Employee and incident child collections render summary rows; add/click opens side drawer; parent save/discard controls appear |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | `/employees/emp-rostering-manager?tab=Credentials%20Assigned` | Summary list shows Search rows + Add credential |
| 2 | Click Add credential | `Credential` drawer opens; required fields and save/discard bar visible |
| 3 | Discard changes | Drawer/draft clears; row count reverts |
| 4 | `/incidents/inc-1000001?tab=Investigation` | Actions/evidence render as summary lists |
| 5 | Click existing action row | `Incident action` drawer opens with full line fields |
| 6 | Close drawer | No data is saved until parent record Save |

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

## TEST-096 — Flow 8 employee exit

| | |
|--|--|
| **User** | SandraBlake / welcome |
| **DATA** | `emp-staff-147` (Naomi Singh — DATA-019 disposable) |
| **Pass if** | Exit checklist complete; status **Terminated**; CSV export |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | `/employees/emp-staff-147?tab=Employment` | Exit workflow panel visible |
| 2 | Separation letter on HR file | Manual doc line OK if auto-generate blocked (org ABN) |
| 3 | End date `2026-06-30` + Overview status **Terminated** | Save; checklist 0 blockers |
| 4 | Export checklist | CSV download |
| 5 | Refresh | Terminated + end date persist |

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

## TEST-098 — Flow 10 governance

| | |
|--|--|
| **User** | QuinnTaylor / welcome (Quality Manager) |
| **Pass if** | Complaints register + incident dashboard load |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | `/complaints` | List + audit module label |
| 2 | `/incidents/dashboard` | Stats render |
| 3 | `/tasks?scope=assigned-to-me` | Task hub scopes load |

---

## TEST-099 — Flow 11 reporting wrap

| | |
|--|--|
| **User** | SuperUser only (`flamingo`) — Quality Manager denied audit pack |
| **Pass if** | Audit pack + board report render |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | `/ndis-audit-pack` — June 2026 | Export/run completes |
| 2 | `/board-reporting` | KPI sections render |

---

## TEST-032 — Role document print permissions

| | |
|--|--|
| **User** | SuperUser / flamingo or Admin role |
| **Route** | `/admin/roles` |
| **Pass if** | Print/send toggles under tabs; tab Read clears document grants |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open `/admin/roles`; select Support Coordinator (or Team Leader) | Clients module card shows tabs with Print & send section on Support Plan |
| 2 | Support Plan tab Write + Print support plan on; Save | Role saves |
| 3 | Sign in as coordinator; open `bp-bern` → Support Plan | Print and Send buttons visible |
| 4 | Back to Roles; Support Plan tab → Read; Save | Print/send grants cleared for that tab |
| 5 | Coordinator refresh Support Plan | Print/Send hidden (edit may still be blocked by tab read) |

---

## TEST-033 — Record Documents section (print, files, audit)

| | |
|--|--|
| **User** | SuperUser / flamingo |
| **Route** | `/clients/bp-bern?tab=Support%20Plan` (or invoice detail) |
| **Pass if** | Documents at bottom; saved files + print log after action |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open Bern → Support Plan; scroll to bottom | **Documents** section with subtle Print/PDF/Send; **How to print and send** link |
| 2 | Click Print | Success message; expand **Saved files** — row with date/time and Open |
| 3 | Expand **Print log** | Row shows user name and timestamp |
| 4 | Open invoice detail; scroll to Documents | Same layout at bottom (Print, PDF, Send via Email) |
| 5 | Open invoice detail; scroll to Documents | Same layout at bottom (Print, PDF, Send via Email) |
| 6 | Claim detail, NDIS audit pack, board report, invoice reconciliation, employee Documents tab | Documents section at bottom on each |

---

## Quick chain (release candidate)

```text
seed-e2e-intake → seed-e2e-amplify
TEST-010 → TEST-020 → TEST-030 → TEST-060 → TEST-085
```

Optional same session: TEST-090, TEST-095, TEST-097, TEST-099.
