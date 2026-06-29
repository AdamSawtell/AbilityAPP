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
| 5 | Rostering → New shift | Service-delivery editor shows Clients (billing), Workers (payroll), Session key, and collective risks |
| 6 | Add second client with ratio `1:4`; save as Draft; reopen | Two client lines and ratio persist; vacant worker line persists |
| 7 | Rostering → RoC | Rollover defaults panel shows Organisation lookahead/status/skip-existing values; RoC table has Worker, Ratio, Session columns |
| 8 | Rostering → RoC → Bulk rollover, Scope = By location → Glenelg SIL House, 4 weeks, Draft | Preview shows shifts across 3 RoC templates; Publish creates merged multi-client sessions; re-running with Skip dates already published reports all skipped |
| 9 | Rostering → Fortnight review | Select pay period; command centre lists RoC vs live roster issues for that fortnight; missing/draft/vacant/worker-changed/extra badges link back to the roster week or RoC |
| 10 | My workplace → My shifts as a secondary worker on a shared session | Worker sees the shared shift, can check in/out from their worker line, and timesheet generation creates a line for that employee |

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

## TEST-064 — Assistant client grounding + availability-aware claim (Karen QA)

| | |
|--|--|
| **User** | SuperUser / flamingo (assistant) and a worker login linked to an employee (claim) |
| **DATA** | Client `Bernadette Rose` (`bp-bern`); worker availability set to weekday daytime |
| **Pass if** | Assistant only grounds on the named client and asks when unsure; open-shift claim warns before an outside-availability claim and the claimed shift is visible in My shifts → All |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open the AI assistant and ask to log an activity note for "Bernadette Rose" | Step 1 confirms **Bernadette Rose** — never Henry/another client |
| 2 | Ask to log a note for a name with a typo ("Bernedette Rose") | Still grounds on Bernadette Rose |
| 3 | Ask to log a note for a client that does not exist | Assistant asks which client / lists candidates — does not guess or fall back to the open record |
| 4 | Set My workplace → Availability to a weekday daytime pattern | Availability saved |
| 5 | My workplace → Open shifts | Matching shifts listed first with "Within your availability" tag |
| 6 | Claim a shift outside your availability (e.g. overnight 22:00–06:00) | Card warns; button changes to **Claim anyway?**; claim only proceeds on the second confirm |
| 7 | Confirm the claim, then open My shifts → All | Confirmation names date/time/client/location; claimed shift appears under All |

Regression: `npm run test:karen` covers the matching/typo/availability logic.

---

## TEST-065 — Organisation app theme (AB-0017 Phase 1)

| | |
|--|--|
| **User** | SuperUser / flamingo |
| **DATA** | Default org on `/system/organization` |
| **Pass if** | Theme presets preview live, save persists colours, reset restores AbilityVua defaults |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | `/system/organization` → App theme | Section shows four colour fields, presets, Preview live toggle |
| 2 | Click **Teal care** preset | Primary and accent fields update |
| 3 | Turn on **Preview live** | Workspace header/links/buttons shift to teal without saving |
| 4 | Save | Success; audit footer records theme fields |
| 5 | Reload page | Saved colours still applied |
| 6 | **Reset theme** then Save | App returns to default pink; sign-in gradient matches |

---

## TEST-066 — Karen AiTester support-worker day (seeded)

| | |
|--|--|
| **User** | `KarenAiTester` / `welcome` (role Support Worker) |
| **DATA** | `npm run supabase:seed-karen` — attaches a full day on `Bernadette Rose` (`bp-bern`) to the KarenAiTester login |
| **Pass if** | Today's two shifts show in My shifts; client profile, care plan, goals, case notes and a draft timesheet are all present and editable |
| **Note** | Flows 7 (medication assistance) and 8 (travel/kilometres) are backlog — no feature to test yet |

Seeded for the automated browser tester (re-runnable, fixed ids):

| What | Detail |
|------|--------|
| Today (relative to run date) | Two **Published** shifts on `bp-bern` — AM SIL `09:00–15:00` (`rs-karen-jun26-am`), PM community access `15:30–18:00` (`rs-karen-jun26-pm`), neither checked in |
| History | Two **Completed** checked-in/out shifts on the previous two days (`rs-karen-jun24/25`) |
| Timesheet | Draft `ts-karen-jun` (12h, 2 lines) ready to submit |
| Case notes | Three activity notes on `bp-bern` (`act-karen-1/2/3`) |
| Goal progress | One review on goal-1 transfers (`gpr-karen-goal1`) |
| Incident | One reported incident `inc-karen-1` for history |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Sign in as `KarenAiTester` / `welcome` → My shifts | Today's AM + PM shifts on Bernadette Rose listed |
| 2 | Open the client profile for Bernadette Rose | Profile, care plan and risks visible (read) |
| 3 | Clock on the AM shift | Check-in recorded; status reflects on shift |
| 4 | Add a case note on Bernadette | New activity row saves and persists after reload |
| 5 | Record goal progress on goal-1 | Progress review row saves (history now ≥ 2) |
| 6 | Incidents → Submit incident here | New incident created; list shows My incidents only (seed includes `inc-karen-1`) |
| 7 | Check out the AM shift, then My timesheets → submit `TS-KAREN-JUN` | Checkout recorded; draft timesheet submits |

---

## TEST-068 — Incidents role visibility and Submit incident here

| | |
|--|--|
| **User** | `KarenAiTester` / `welcome` (Support Worker), then SuperUser as Quality Manager |
| **DATA** | Seed incident `inc-karen-1` on Karen account; org register has additional incidents |
| **Pass if** | Support worker sees My incidents only + wide Submit incident here; manager/see-all sees full register, summary cards, and dashboard link |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Sign in as KarenAiTester → Incidents | Sidebar **My incidents**; info banner explains limited view |
| 2 | List content | Only own open incidents (e.g. INC-KAREN-1); no open/reportable/all summary cards |
| 3 | Submit incident here | Wide button visible below info banner; opens guided new incident flow |
| 4 | Sidebar | No Dashboard & analytics link |
| 5 | `/incidents/dashboard` direct | Blocked or short message with link back to Incidents |
| 6 | Sign in as SuperUser → switch to Quality Manager → Incidents | Full summary cards, all incidents in list, **Submit incident here** below cards |
| 7 | Sidebar | Dashboard & analytics link present; dashboard loads stats |
| 8 | Admin → Roles → Support Worker → Incidents | **Can see all incidents** off by default |

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
| **Pass if** | Complaints register + incident dashboard load (Quality Manager has Can see all incidents) |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | `/complaints` | List + audit module label |
| 2 | `/incidents/dashboard` | Stats render |
| 3 | `/incidents` | Full register visible (not My incidents only) |
| 4 | `/tasks?scope=assigned-to-me` | Task hub scopes load |

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

## TEST-069 — Entity header (record banner)

| | |
|--|--|
| **User** | SuperUser / flamingo |
| **Routes** | `/clients/bp-bern`, an employee record, a location record, a business partner/provider record, `/admin/organization` |
| **Pass if** | All master record surfaces show the same banner pattern: hero image/logo/initials, name, badges, icon contact details, right summary panel |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open `bp-bern` | Large photo/initials, big name, lifecycle + status + alert badges, email/phone/address icons, Funding/Disability summary |
| 2 | Click a badge (e.g. consents/restrictive) | Navigates to that tab |
| 3 | Open an employee with expiring/expired credentials | Compliance warning banner above the header; credential badges link to Credentials Assigned |
| 4 | Open a location | Status + client/staff/service badges; Capacity/City summary |
| 5 | Open a business partner/provider | Initials hero, partner/status/invoice badges, email/phone/address/remittance icons, ABN/payment summary |
| 6 | Open `/admin/organization` | Logo/initials hero, registration/GST badges, general contact + primary contact, ABN/NDIS summary |
| 7 | Narrow the window to tablet then mobile | Summary stacks below; photo moves above details; no overflow |

---

## TEST-071 — Location-based security (Phase 1)

| | |
|--|--|
| **User** | `user-sw-01` (Support Worker, assigned to GLEN-SIL) then SuperUser with Admin role |
| **Routes** | `/locations`, `/clients`, `/incidents`, `/admin/roles` |
| **Pass if** | Assigned-location scope hides out-of-scope locations/clients; `locations-see-all` on role bypasses filter |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Log in as support worker linked to GLEN-SIL (`emp-isla` or seeded SW user) | Home loads without errors |
| 2 | Open `/locations` | Only locations where the employee appears in **Staff assigned** (e.g. GLEN-SIL) |
| 3 | Open `/clients` | Only clients linked on those locations (e.g. Bernie) |
| 4 | Deep-link `/clients/{out-of-scope-id}` | Client not found |
| 5 | Open `/admin/roles`; expand **Locations** for Support Worker | No **Unrestricted location access** grant |
| 6 | Switch to Admin role (or CEO) with `locations-see-all` | Full location and client registers visible |
| 7 | Ask the workspace AI to search for a client outside your locations | No match / not found (not another participant's record) |
| 8 | Run **Client register** report as scoped user | Rows match `/clients` list only |

---

## TEST-072 — Record line "Created by" reflects the signed-in user

| | |
|--|--|
| **User** | `IslaRobinson` / `welcome` (any non-SuperUser) |
| **Routes** | `/clients/{id}` → Activity tab (also Location and Employee activity tabs) |
| **Pass if** | New activity/credential lines stamp the signed-in user, not "SuperUser" |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Sign in as a non-SuperUser with client access | Workspace loads |
| 2 | Open a client → **Activity** → **Add activity** | New line editor opens |
| 3 | Read the **Created by** field | Shows the signed-in user's name (e.g. Isla Robinson), not "SuperUser" |
| 4 | Save the parent record, reload | **Created by** persists as the signed-in user |
| 5 | Edit an existing line (record with `updatedBy`, e.g. employee credential) | **Updated by** refreshes to the editor |

---

## TEST-073 — Open shifts: assigned locations + browse all

| | |
|--|--|
| **User** | Support worker assigned to one location (e.g. `AvaThomas` / NTH-SIL) |
| **Routes** | `/my/open-shifts` |
| **Pass if** | Default shows only assigned-location shifts (claimable); toggle shows other locations read-only |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Sign in as a location-scoped support worker | Open shifts page loads |
| 2 | Review default list | Only shifts at assigned location(s); **Claim shift** available |
| 3 | Click **Show all available shifts** | Additional cards appear under **Other locations** |
| 4 | Open an other-location card | No claim button; note to call rostering to apply |
| 5 | Click **Hide other locations** | Other-location cards disappear |

---

## TEST-074 — Open shift request workflow

| | |
|--|--|
| **Users** | Worker (`AvaThomas`) + rostering coordinator (`IslaRobinson`) |
| **Routes** | `/my/open-shifts`, `/my/shifts`, `/rostering` (Open shifts tab), Workforce planning fill board |
| **Pass if** | Request does not auto-assign; rostering approves one worker; rejected/declined remain visible |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Worker: Open shifts → **Request shift** on an in-scope vacant shift | Pending status; no assignment yet |
| 2 | Worker: My shifts → **Shift requests** | Request listed as awaiting rostering |
| 3 | Coordinator: Rostering → Open shifts → **Review requests** | Worker request visible with suitability hints |
| 4 | Coordinator: **Approve & assign** | Worker assigned; shift leaves open list |
| 5 | Worker: My shifts → Scheduled | Approved shift appears in schedule |
| 6 | Second worker requests same shift before approval | Multiple pending requests allowed |
| 7 | Coordinator: **Mark critical fill** on vacant shift | Critical badge on worker and coordinator views |
| 8 | Worker: **Available if critical** / **Decline** | Recorded separately from normal request |
| 9 | Fill board filters | Open with requests / Critical fill filters work |

---

## TEST-075 — My Workplace: Contact Rostering communication

| | |
|--|--|
| **Users** | Employee (`AvaThomas` or `IslaRobinson`) + Rostering Officer role |
| **Routes** | `/my/open-shifts`, `/my/shifts`, `/tasks?scope=my-role`, `/tasks/[id]` |
| **Pass if** | Employee creates a Rostering Communication task, sees it immediately in history, and Rostering Officer can continue the same task conversation |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Employee: My workplace → Open shifts | Prominent **Contact Rostering** button appears above page content |
| 2 | Click **Contact Rostering** | Modal opens with Subject, Message, Category, Related shift, Priority, Attachments note, Submit, Cancel |
| 3 | Submit Normal / General Enquiry with no related shift | Modal closes; confirmation shows task reference; history row appears immediately |
| 4 | Submit Urgent with a related visible shift | History row shows urgent badge and related shift label |
| 5 | Open communication from history | Task detail opens with description and activity; employee can add update |
| 6 | Rostering Officer: Tasks → To my role | New Rostering Communication task appears assigned to Rostering Officer |
| 7 | Rostering Officer adds update and marks In progress / Completed | Employee sees update on same task conversation and status changes in history |

---

## TEST-078 — Admin Communications Hub (AB-0034)

| | |
|--|--|
| **Users** | AbilityVua Admin (`IslaRobinson` / `welcome`); recipient Support Worker (`AvaThomas` / `welcome`) |
| **Routes** | `/admin/communications`, `/` (home after login) |
| **Pass if** | Admin publishes role-targeted message; recipient sees forced modal; acknowledgment recorded; modal does not re-show |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Sign in as Isla Robinson → Admin → Communications | Compose tab loads |
| 2 | Compose title/body, audience Support Worker, require acknowledgment, Publish | Message appears in Sent messages |
| 3 | Open sent message | Stats and acknowledgment register load |
| 4 | Sign in as Ava Thomas → Home | Company message modal appears |
| 5 | Wait 3s → **I have read and understood** | Modal closes; app usable |
| 6 | Refresh home | Modal does not re-show |
| 7 | Admin → export CSV | Download contains Ava acknowledged row |

---

| | |
|--|--|
| **Users** | Support worker with assignment + credentials + site orientation (`IslaRobinson` / `welcome`) |
| **Routes** | `/my`, `/locations/loc-glenelg-sil` (rostering manager for flag) |
| **Pass if** | Qualified sites list at top of My workplace; high-demand sites show amber badge and advisory; list is read-only |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Sign in as Isla Robinson → `/my` | **Services I can work at** section appears above Contact Rostering |
| 2 | Review site cards | Glenelg SIL (or other assigned, oriented sites) listed with type and address |
| 3 | High-demand site | Amber highlight + badge; advisory mentions contacting rostering |
| 4 | Rostering manager: Location → Glenelg SIL → Overview | **Staff demand signal** checkbox visible; save persists flag |
| 5 | Employee refresh `/my` | Manual flag still shows high demand (even without vacant shifts) |

---

## TEST-076 — Home: My calendar shows shifts, requests, leave, tasks

| | |
|--|--|
| **Users** | Support worker with a linked employee record and allocated shifts (`AvaThomas` or `IslaRobinson`) |
| **Routes** | `/` (Home → Today → My calendar) |
| **Pass if** | The personal calendar shows the worker's allocated shifts, pending open-shift requests, leave, and tasks on the correct dates |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Sign in and open Home → **Today** → **My calendar** | Calendar renders in month view; legend lists Allocated shifts and Shift requests |
| 2 | Navigate to a week with an allocated shift | Teal **Shift HH:MM–HH:MM** chip appears on the shift date |
| 3 | Submit an open-shift request (`/my/open-shifts`), return to Home | Cyan **Requested HH:MM–HH:MM** chip appears on that shift's date while the request is awaiting decision |
| 4 | Click a shift chip / a request chip | Shift opens `/my/shifts`; request opens `/my/open-shifts` |
| 5 | With pending/approved leave, switch to week or day view | Leave appears on the correct dates alongside shifts and tasks |
| 6 | Fill the requested shift for this worker (approve the request **or** assign directly via the fill board), return to Home | Shift now shows as an allocated (teal) shift only; the request (cyan) chip no longer shows even if the request row is still `requested` |

---

## TEST-100 — NDIS Price Guide Importer (AB-0011)

| | |
|--|--|
| **User** | SuperUser / flamingo (System sign-in) |
| **Route** | `/system/services/ndis-price-importer` |
| **Fixture** | `web/fixtures/ndis-price/sample-2026-27-update.csv` |
| **Pass if** | Preview counts render; apply succeeds; import history shows applied batch; link to Price Dependant Updater |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | System sign-in → Services → NDIS Price Guide Importer | Page loads; audit module label; help link resolves |
| 2 | Upload sample 2026–27 CSV | Preview shows new/updated/error counts; no validation blockers |
| 3 | Confirm and apply | Success message; batch in import history with **applied** status |
| 4 | Open import history **View rows** | Row-level actions and matched products visible |
| 5 | Follow **Review dependent price updates** link | Opens Price Dependant Updater with batch available |

---

## TEST-101 — Price Dependant Updater (AB-0012)

| | |
|--|--|
| **User** | SuperUser / flamingo (System sign-in) |
| **Route** | `/system/services/price-update-review` |
| **Precondition** | Applied AB-0011 batch (TEST-100) |
| **Pass if** | Analysis scans >0 records; Active/Signed agreements are consent-required; apply blocked without evidence; protected billing unchanged |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Select applied import batch → **Run impact analysis** | Summary shows scanned count >0 and impacts by classification |
| 2 | Filter **Consent required** | Active/Signed service agreements listed; **0 ready to apply** |
| 3 | Select a consent-required agreement row | Decision panel requires evidence ref; **Apply approved updates** disabled |
| 4 | Enter evidence ref → **Approve for apply** | Row becomes ready; apply count increases |
| 5 | Tick confirmation → **Apply approved updates** (optional) | Success message; run history shows **applied**; one impact `applied` |
| 6 | Filter **Protected** | Submitted claims / issued invoices present; no apply actions |

---

## TEST-096 — Fleet Vehicle Management (AB-0006)

| | |
|--|--|
| **User** | SuperUser / Admin role |
| **Route** | `/fleet` |
| **Pass if** | Fleet register loads, vehicle detail saves, booking conflict is blocked, failed inspection sets status off road |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open `/fleet` | Fleet register loads with seeded vehicles and audit footer |
| 2 | Open `VEH-001` | Detail page shows Overview, Calendar, Registration & insurance, Servicing, Inspections, Bookings, Fuel & mileage, Accessibility & compliance, Incidents |
| 3 | Edit Overview notes and save | Success message appears; audit footer remains visible |
| 4 | Add a booking for this vehicle | Booking saves and appears in the Bookings table |
| 5 | Open the Calendar tab and navigate to the booking date | Booking shows as a **Vehicle booking** chip on each day it covers; cancelled bookings do not appear |
| 6 | Add another booking with overlapping start/end for the same vehicle | Save is blocked with an overlap/conflict message |
| 7 | Add a failed inspection and save the vehicle | Vehicle status changes to `off_road` |

---

## TEST-102 — Maintenance Request Tool (AB-0005)

| | |
|--|--|
| **User** | SuperUser / Admin role |
| **Route** | `/maintenance` |
| **Pass if** | Register loads, request saves from location tab, calendar shows maintenance chips, incident link action works |

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open `/maintenance` | Maintenance register loads with audit footer |
| 2 | Open a location (e.g. Glenelg) → Maintenance tab → New request | Create form opens with location pre-filled |
| 3 | Enter title, description, priority, save | Request appears in location list and central register |
| 4 | Open the request → Assignment tab | Assign employee or contractor details and save |
| 5 | Set scheduled visit date on Overview, save | Date persists after refresh |
| 6 | Location → Calendar → tick Show maintenance | Maintenance chip appears on scheduled date; overdue bar shows if applicable |
| 7 | Use Create incident from this request | Incident opens with location/description; maintenance record stores incident link |
| 8 | Move status to Resolved, confirm completion, then Closed | Lifecycle validation passes; requestor confirmation recorded |

---

## Quick chain (release candidate)

```text
seed-e2e-intake → seed-e2e-amplify
TEST-010 → TEST-020 → TEST-030 → TEST-060 → TEST-085
```

Optional same session: TEST-090, TEST-095, TEST-097, TEST-099.
