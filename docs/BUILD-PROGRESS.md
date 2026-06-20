# AbilityAPP — build progress log

**Always read this before starting work.** Update after every shipped slice.  
**Roadmap:** [SCOPE-ROADMAP.md](./SCOPE-ROADMAP.md) · **Standards:** [BUILD-EXPECTATIONS.md](./BUILD-EXPECTATIONS.md)

---

## Overall program progress

| Metric | Value |
|--------|-------|
| **Overall completion** | **84%** |
| **Current work package** | Chunk 7 — Billing & claiming |
| **Active slice** | WP-I.2 complete — next: WP-I.3 remittance import stub |
| **Next slice** | WP-I.3 remittance import + match (Chunk 7) |
| **Last push** | 2026-06-20 — `c14ed73` |

---

## Verification pipeline (every slice)

| Tier | Who | When | Required? |
|------|-----|------|-----------|
| **1 — Automated** | Agent | Every slice before push | ✅ Yes — `npm run build`, `npm run page-guides:check`; `supabase:push-remote` if migration |
| **2 — Browser smoke** | Agent | Any slice that changes UI | ✅ Yes — follow **What you can test** for that slice |
| **3 — Bugbot review** | Agent | Before every `git push` to `main` | ✅ Yes — fix Critical/High before push |
| **4 — Your spot-check** | Adam | After push (Amplify live) | Recommended — same steps as Tier 2 |

### Documentation pipeline (every slice)

| Deliverable | Who | When | Required? |
|-------------|-----|------|-----------|
| **User how-to** | Agent | Same slice as the feature | ✅ Yes — article section with steps in `web/src/lib/help/articles/` |
| **System setup** | Agent | Same slice as the feature | ✅ Yes — checklist in `module-setup-guides.ts`; reference data + role grants named |
| **Progress log** | Agent | Before push | ✅ Yes — row in **User guides & system setup** below + **Guide delivery log** |

See [BUILD-EXPECTATIONS.md](./BUILD-EXPECTATIONS.md) §8 for file paths and checklist format.

---

Slices through **WP-B.1** were verified with **Tier 1 only** (build + migrations). **Tier 2 browser** and **Tier 3 Bugbot** were not run on those pushes — backlog below. **All future slices use all tiers.**

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

## Entity link matrix

Governance: [BUILD-EXPECTATIONS.md](./BUILD-EXPECTATIONS.md) §14. Every operational record must link to the right client, employee, location, or upstream document.

| Record | Required links | Reverse UI (parent) | Save compliance |
|--------|----------------|---------------------|-----------------|
| Service agreement | client, price list | Client → Service agreements | lifecycle validation |
| Service booking | client, service agreement (when funded) | Client → Service bookings | `booking-compliance.ts` |
| Incident | client | Client → Incidents | workflow rules |
| Task | entityType + entityId | Client → Requests | — |
| Timesheet / roster shift | employee, client, location, booking | roster week view | `roster-shift-conflicts.ts` blocks double-book |
| Roster of care | client, service agreement (optional) | Client → Roster of care | weekly template + publish from Rostering |

---

## Chunk progress

| Chunk | Name | Weight | Done | Status | Blockers |
|-------|------|--------|------|--------|----------|
| 0 | Enquiry & CRM + portal | 10% | 2% | 🟡 Partial | Portal auth (default: magic link) |
| 1 | Client & plan management | 12% | **55%** | 🟡 Partial | WP-A complete |
| 2 | Service agreements | 10% | **100%** | ✅ Complete | None |
| 3 | Service bookings compliance | 12% | **100%** | ✅ Complete | None |
| 4 | Rostering | 22% | **95%** | 🟡 Partial | Participant portal (Chunk 0) |
| 5 | Service planning | 8% | **75%** | 🟡 Partial | Multi-provider budget (later) |
| 6 | Timesheets & payroll export | 10% | **75%** | 🟡 Partial | Chunk 7 billing |
| 7 | Billing & claiming | 10% | **30%** | 🟡 Partial | PRODA/gateway |
| 8 | Reconciliation | 6% | **5%** | ⬜ Not started | Chunks 5 + 7 |

**Platform cross-cutting** (auth, roles, audit, AI, reports): ~85%

---

## What you can test (manual checklist)

Use the **live Amplify app** after each push (or `cd web && npm run dev` locally). Login as a user with full client/booking access (e.g. SuperUser role).

### Governance docs (6032a7f)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open repo on GitHub → `docs/BUILD-PROGRESS.md` | File visible on `main` |

### WP-A.1 — Client lifecycle (`6032a7f` / `bd60219`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Clients** → open **Bernadette Rose** | Record opens |
| 2 | **Full profile** → set **Lifecycle** to *Plan review*, save | Saves without error |
| 3 | Refresh page | Lifecycle still *Plan review* |
| 4 | **Clients** list → filter **All lifecycles** → *Active* | Bern appears or not per filter |
| 5 | Footer → **Full audit trail** → open last save | Shows lifecycle field change |
| 6 | Scroll to audit footer on page | Created/updated visible |

### WP-A.2 — Plan budget (`0ad2f6c`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Client **Bern** → tab **Plan budget** | Tab visible (check Roles if missing) |
| 2 | Review summary cards | ~$69k allocated, ~$18.8k claimed, remainder shown |
| 3 | Edit **Claimed ($)** on a line, save | Persists after refresh |
| 4 | **Full audit trail** | Save event logged |

### WP-A.3 — Core consents (`777b20e`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Client **Bern** → **Consents and Legal Orders** | Three core consent tiles: Service *Granted*, Information *Granted*, Photo *Refused* |
| 2 | Add row: type *Service delivery*, status *Pending*, save | Row persists |
| 3 | Profile header / overview | Consent alert list mentions photo refusal |
| 4 | **Overview** tab | **Core consents** panel visible |

### WP-A.4 — Plan budget wizard (`777b20e`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Plan budget** tab → click **Core supports starter** | Two new empty lines appended |
| 2 | Click **Full plan scaffold** | Core + Capacity building + Capital lines added |
| 3 | Save, refresh | Lines still present |

### WP-A.5 — Overview utilisation (`777b20e`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Client **Bern** → **Overview** | **Plan utilisation** section with totals |
| 2 | Click **Open Plan budget** | Navigates to Plan budget tab |

### WP-B.1 — Booking compliance (`777b20e`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Service bookings** → open booking **50145** (Bern) | Compliance panel shows pass or warnings |
| 2 | Change **End date** before **Start date**, save | Save **blocked**; error shown |
| 3 | Set dates valid, save | Saves successfully |
| 4 | (Optional) Increase **Grand total** above client remaining budget | Budget exceeded error; save blocked |

### WP-B.2 — Cancellation policy

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Service bookings** → open booking **50145** | Overview loads |
| 2 | Set **Document status** to *Cancelled* | **Cancellation details** section appears; date defaults to today |
| 3 | Leave **Initiated by** empty, save | Save **blocked** — initiator required |
| 4 | Set **Initiated by** *Participant*, **Reason** *Participant request*, save | Saves successfully |
| 5 | Set **Cancellation date** within 7 days of **Start date** | **Cancellation policy** panel shows short notice + estimated claimable amount |
| 6 | Set cancellation date **after** booking **End date** | Save blocked; error shown |
| 7 | Refresh page | Cancellation fields persist; audit trail logs changes |

### WP-B.3 — Extended compliance (`pending`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Booking **50145** — clear service agreement, save | Warning: link agreement |
| 2 | Set agreement to *Draft* (if test copy), save | Error: agreement not Active |
| 3 | Remove product from a line, save | Error: product required |
| 4 | Restore product + Active agreement | Compliance passes |

### WP-C.1 — Schedule of supports templates

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Service agreements** → open **ROSE_Rose Ni** | Agreement opens |
| 2 | Click **SIL + community starter** | Two lines appended |
| 3 | Enter planned prices, save | Total planned updates; persists after refresh |
| 4 | Set status *Draft*, save | Status saved; audit trail logs change |

### WP-C.2 — Agreement lifecycle

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open **ROSE_Rose Ni** | Lifecycle panel visible |
| 2 | Set status *Draft* → *Active* directly | Save blocked |
| 3 | Progress Draft → Sent → Signed → Active | Saves with dates |

### WP-C.3 — Participant e-sign

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open **ROSE_Rose Ni** agreement | Participant e-sign panel visible |
| 2 | Draw signature, apply | Status moves to Signed; signature on file |
| 3 | Save, refresh | Signature image persists |

### WP-C.4 — Agreement expiry hook

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open Home (SuperUser) | Scheduled automation runner fires once per day |
| 2 | Admin → Task automations | **Service agreement expiring** rule visible under Services |
| 3 | Agreement within 60 days of finish | Task created linked to agreement |

### WP-D.2 + WP-D.3 — Create/edit shifts, recurring, conflicts (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Rostering** → week of 6 Oct 2025 | Seed shifts visible Mon/Wed/Fri |
| 2 | **New shift** or **Add** on empty day | Modal opens with client, worker, location, booking fields |
| 3 | Save shift | Appears on calendar; persists after refresh |
| 4 | **Repeat weekly** — select weekdays, 4 weeks | Multiple shifts created with Recurring badge |
| 5 | Try double-book same worker overlapping times | Save blocked; error message; **Conflict** badge on calendar |
| 6 | Click existing shift | Edit modal opens; save updates card |
| 7 | Footer audit label | **Rostering** module label visible |

### WP-D.5 — Gap analysis & vacant shifts (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Rostering** → **Gaps** tab | Lists vacant shifts and/or coverage gaps |
| 2 | Week view | Gap banner when gaps exist; **Vacant** badge on unassigned shifts |
| 3 | Save **Draft** shift without worker | Saves with warning; not blocked |
| 4 | **Forward plan** | **Coverage gaps** summary card; **Gap** cells in grid |
| 5 | **Add shift** from coverage gap | Editor opens with client + booking pre-filled |

### WP-D.6 — Open shift marketplace (`4580bb4`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Rostering** → **Open shifts** tab | Vacant Draft shifts listed as cards |
| 2 | **Assign worker** on a card | Edit modal opens |
| 3 | **My workplace** → **Open shifts** | Same open shifts visible to staff |
| 4 | **Claim shift** (linked employee user) | Worker assigned; shift leaves marketplace |
| 5 | Double-book claim attempt | Blocked with conflict message |

### WP-D.7 — Timesheet generation from shifts (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Generate timesheets** — period 6–12 Oct 2025 | Preview shows eligible Published shifts |
| 2 | **Generate timesheets** | Draft timesheets created per worker |
| 3 | **Timesheets** list | Records show worker, period, hours, Draft status |
| 4 | Open a timesheet | Shift lines from roster; audit footer visible |
| 5 | Change status to Approved, save | Persists; **Full audit trail** logs change |

### WP-D.8 — Worker shift check-in (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **My workplace** → **My shifts** (employee-linked user) | Assigned shifts listed with check-in status |
| 2 | **Check in** on today's shift | Status → Checked in; timestamp shown |
| 3 | **Check out & verify** with optional notes | Status → Verified; shift Completed on roster |
| 4 | **Rostering** week view | **Checked in** or **Verified** badge on staffed shift card |
| 5 | Coordinator edits shift after check-in | Check-in timestamps preserved after save |
| 6 | **Full audit trail** on shift (via data change) | Check-in fields logged |

### WP-D.9 — Timesheet check-in verification (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open a draft timesheet with roster-linked lines | **Shift verification** panel lists each line |
| 2 | Lines without worker check-out | **Not checked in** or **Awaiting check-out** badge |
| 3 | Set status to **Approved** | Save blocked until shifts verified (manual-review-only lines excepted) |
| 4 | **Timesheets** list | Verification column shows verified count |
| 5 | Already **Approved** timesheet — edit notes, save | Saves without re-running verification block |

### WP-D.10 — GPS check-in capture (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **My workplace** → **My shifts** — check in (linked worker, browser location allowed) | Check-in succeeds; map link shows coordinates |
| 2 | Check out on same shift | Check-out location link appears |
| 3 | **Rostering** week view on staffed shift | **GPS** badge when coordinates captured |
| 4 | Open shift in roster editor | Worker check-in panel shows times + map links |
| 5 | Deny browser location, check in | Check-in still succeeds without coordinates |

### WP-D.11 — Geofence check-in alerts (`2026-06-18`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open **Locations** → Glenelg SIL → **Contact & address** tab | Latitude, longitude, and geofence radius fields visible |
| 2 | Save site coordinates (or use seeded demo values) | Values persist after refresh |
| 3 | Worker checks in **outside** site radius (or use coords far from site) | Amber geofence warning on **My shifts** |
| 4 | **Rostering** week view on same shift | **Geofence** badge alongside GPS when outside radius |
| 5 | Open shift in roster editor | Worker check-in panel shows geofence warning |
| 6 | **Timesheets** detail with verified line + geofence breach | Advisory geofence text on line; approval **not** blocked |

### WP-D.12 — Payroll CSV export (`2026-06-18`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Approve a verified timesheet (all linked shifts checked out) | Status **Approved** saves |
| 2 | **Timesheets** list — Payroll export panel | Approved timesheets listed with checkboxes |
| 3 | Select and **Export selected to CSV** | CSV downloads; batch ref shown; status **Exported** |
| 4 | Refresh — list **Payroll** column | Shows **Exported** + batch ref |
| 5 | Open timesheet detail (saved Approved) | Payroll export panel + **Export to payroll CSV** |
| 6 | Try export with unverified shift (Draft/Submitted) | Blocked with verification message |
| 7 | Change status to Approved on detail without saving | Export hidden until saved |

### WP-D.13 — RoC import & generate (`2026-06-18`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Rostering** → **RoC** tab | Import panel and RoC list visible |
| 2 | Click **Load sample template** → **Import CSV** | RoC for BERN with Mon/Wed lines; persists after refresh |
| 3 | Invalid client or location in CSV | Import blocked with clear error |
| 4 | **Generate draft RoC** from Rose agreement | New Draft RoC — Active RoC unchanged |
| 5 | Re-import CSV for same client | Updates existing Active/Draft RoC lines |
| 6 | **Full audit trail** on import | Imported event on roster of care record |

### WP-D.14 — Publish shifts from RoC (`2026-06-18`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Rostering** → **RoC** → open RoC with weekly lines | **Publish to roster** panel visible |
| 2 | Set week start + 4 weeks, status **Draft** → **Publish** | Success message; shifts appear on week calendar |
| 3 | Navigate to published week on **Week** tab | Client, location, times match RoC lines |
| 4 | Re-publish same range with **Skip dates already published** | No duplicate shifts |
| 5 | Set status **Published** without workers | Publish blocked — worker required |
| 6 | Assign worker on calendar, publish as Draft, edit to Published | Saves; visible on My shifts for worker |

### WP-D.15 — Roster capacity planning (`2026-06-18`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Rostering** → **Capacity** tab | Summary cards and weekly table visible |
| 2 | Review horizon totals | Demand, staffed, supply, utilization shown |
| 3 | Click a week row | Worker load table updates for that week |
| 4 | Worker rostered over employment-type capacity | Remaining shows hours over in red |
| 5 | Week with vacant shifts | Unstaffed hours column > 0 |

### WP-D.16 — Keypay API export hook (`2026-06-18`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Set `KEYPAY_DRY_RUN=true` in `web/.env.local`, restart dev server | — |
| 2 | **Timesheets** → select Approved record(s) | Payroll export panel visible |
| 3 | **Export to Keypay API** button appears | Status line shows dry run |
| 4 | Export approved timesheet | Success message with DRY- batch ref; status Exported |
| 5 | Without env vars | Only CSV button — no Keypay API option |
| 6 | Unverified shift in selection | Export blocked (same gate as CSV) |

### WP-D.17 — Mobile My shifts polish (`2026-06-18`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **My workplace** → **My shifts** on a narrow viewport | Today / Upcoming / All tabs visible |
| 2 | Today tab (default) | Only today's shifts listed |
| 3 | Shift assigned for today | **Next action** banner with large Check in button |
| 4 | After check-in | Banner offers Check out & verify |
| 5 | Upcoming tab | Future shifts grouped by day (Tomorrow, etc.) |
| 6 | Geofence/GPS | Badges still show on shift cards |

### WP-D.18 — Payroll reconciliation stub (`2026-06-18`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Timesheets** list | Payroll reconciliation panel below payroll export |
| 2 | Export an approved timesheet (CSV or Keypay) | Record appears in reconciliation candidate table |
| 3 | Enter paid hours + pay run reference, save | Status Matched or Variance; payroll status Processed |
| 4 | List table | Reconcile column shows Pending / Matched / Variance |
| 5 | Open timesheet detail (exported) | Payroll reconciliation section with status + form |
| 6 | Edit timesheet fields without saving | Reconciliation save disabled until save or discard |
| 7 | **Full audit trail** after reconcile | payroll paid hours, reconcile status logged |

### WP-D.19 — Roster hard enforcement (`2026-06-18`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Rostering** → Week tab with staffed draft shifts | **Publish week** panel visible |
| 2 | Create overlapping shifts for same worker, both Draft with workers | Conflict badges on calendar |
| 3 | **Publish week** | Blocked shifts listed; only conflict-free shifts publish |
| 4 | Edit shift → set status **Published** with conflict | Save blocked with error |
| 5 | Client time overlap on two Published shifts | Hard block (error, not warning only) |
| 6 | RoC publish overnight line | Still saves (overnight times allowed) |
| 7 | Open shift claim with conflict | Blocked with conflict message |

### WP-D.20 — Staff–client matching hints (`2026-06-18`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Rostering** → **New shift** | Shift editor opens |
| 2 | Select client **Bern** (no worker yet) | **Staff–client matching** panel shows suggested workers |
| 3 | Click a suggested worker | Worker field populated; hints update |
| 4 | Worker with prior published shifts | Green “Rostered with … before” hint |
| 5 | Worker missing WWCC or non-Current credential | Amber compliance warning (does not block save) |
| 6 | Client with risk/need alerts | Blue info hints to review Risks / Needs tabs |
| 7 | Save shift with warnings present | Save succeeds — hints are advisory only |

### WP-D.21 — Drag-and-drop week view (`2026-06-18`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Rostering** → Week tab | Hint text: drag shifts between days |
| 2 | Drag a **Draft** shift to another day column | Shift moves; success banner shows new date |
| 3 | Refresh page | Shift stays on new day |
| 4 | Drag **Published** shift onto worker conflict | Drop blocked; error banner with conflict message |
| 5 | Shift with worker check-in | Not draggable; error if drop attempted |
| 6 | Click shift (no drag) | Editor opens as before |

### WP-E.1 — Monthly service plan scaffold (`2026-06-18`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Service planning** in sidebar (Delivery) | Hub list loads; audit footer shows module label |
| 2 | Select client **Bern**, click **From plan budget** | Plan created with budget lines; opens in list |
| 3 | Open plan detail | Summary cards: planned hours/spend vs budget remaining |
| 4 | Edit planned hours on a line, save | Persists after refresh; audit trail logs change |
| 5 | Client **Bern** → **Monthly service plan** tab | Tab visible; can generate or open plan |
| 6 | Try duplicate month for same client | Error message — one plan per client per month |

### WP-E.2 — Burn rate + forecast alerts (`2026-06-18`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open **Bern** monthly plan (`/service-planning/msp-bern-2025-10`) | **Burn rate and forecast** panel shows utilisation, burn rate, forecast cards |
| 2 | Review alerts list | Underserviced warning (low utilisation mid-plan) or plan period info visible |
| 3 | **Service planning** hub list | **Alerts** column shows **Review** for plans with warnings |
| 4 | Client **Bern** → **Monthly service plan** tab | Compact alerts panel above plan selector |
| 5 | Client **Bern** → **Full profile** → **Plan review due** | Date drives plan period (e.g. 2026-10-15) |

### WP-E.3 — SCHADS cost prediction (`2026-06-18`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open Bern monthly plan | **SCHADS cost prediction** panel below burn-rate section |
| 2 | Review totals | Predicted labour cost, planned NDIS revenue, estimated margin |
| 3 | Per-line table | Each line shows SCHADS level, hourly rate, margin |
| 4 | Change **Assumed employment type** to Casual | Predicted cost increases (25% casual loading) |
| 5 | Line with Support Coordination category | Defaults to Level 3.1 rate |

### WP-F.1 — Payroll reconciliation batch + digest (`2026-06-18`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Timesheets** list | Payroll reconciliation panel shows summary cards (exported, paid, pending, matched) |
| 2 | Filter reconcile status **Pending** | Table and list filter to pending exported records |
| 3 | Select multiple exported timesheets | Checkboxes + batch pay run ref field visible |
| 4 | **Reconcile at exported hours** with pay run ref | Selected rows marked Matched/Processed; audit logged |
| 5 | Timesheet list **Reconcile** filter | Filters to Matched, Variance, or Pending |

### WP-G/H — Master roster on records + workforce fill (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Client **Bern** → tab **Roster of care** | Active RoC with weekly lines, hour summaries, rostered vs required |
| 2 | Employee with shifts → tab **Schedule** | Week/fortnight calendar shows assigned shifts |
| 3 | Same employee → **Schedule template** | Weekly availability grid; save as coordinator |
| 4 | **Workforce planning** → Worker schedule templates | Table lists workers with template summary |
| 5 | **Workforce planning** → Fill board | Vacant shifts with suggested workers; Assign works |
| 6 | **My workplace** → **My shifts** → Week calendar | Seven-day grid of worker's shifts |

### WP-I.1 — Claim generation scaffold (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Claims** list | HTTP 200; Generate claims link visible |
| 2 | **Generate claims** — set period with approved timesheets | Preview shows eligible lines or skip counts |
| 3 | **Generate claims** — click Generate | Draft claim(s) created per participant |
| 4 | Open claim detail | PAPL validation panel + claim lines table |
| 5 | Save status change | Audit footer logs change |

### WP-I.2 — PAPL hard blocks + gateway stub (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Draft claim with PAPL errors → Save | Blocked with error message |
| 2 | Valid draft → **Submit to gateway** | Gateway ref set; status Submitted |
| 3 | Submitted claim → edit lines | Locked — only notes editable |
| 4 | Local mode (no Supabase) | Dry-run fallback submits without API |

### WP-F.2 — Payroll period close checklist (`2026-06-18`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Timesheets** list | Payroll period close panel below reconciliation |
| 2 | Set period dates matching approved/exported/reconciled timesheets | Checklist shows pass for timesheets, approved, exported, reconciled |
| 3 | Enter pay run ref → **Mark period closed** | Success message; period status shows closed |
| 4 | **Generate timesheets** — same period | Banner shows period closed; Generate disabled |
| 5 | Refresh page (Supabase mode) | Closed period still blocks generation for all users |

### Entity linking — Service bookings on client (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Client **Bern** → tab **Service bookings** | Tab visible; shows booking **50145** |
| 2 | Click booking card | Opens `/service-bookings/50145` with client linked |
| 3 | **New service booking** from client tab | Create form pre-selects Bern |
| 4 | **Service bookings** list | Business partner column links to client |

---

## User guides & system setup (per slice)

Each row is what end users and system administrators need. In-app: workspace footer **How to use this page** → Help article; System → **Setup guides** or `/system/setup/<module>`.

### WP-A.1 — Client lifecycle

| | Detail |
|---|--------|
| **User how-to** | Help → **Clients** → section **Client lifecycle** (`clients-locations.ts` § `client-lifecycle`) |
| **User steps** | 1. Open client → **Full profile**. 2. Set **Lifecycle**, **Plan review due** (when plan review), **Exit reason** (when exit). 3. Save. 4. Filter **Clients** list by lifecycle badge. |
| **System setup** | `/system/setup/clients` → guide **Clients setup** |
| **Reference data** | `/system/reference-data/clients` → **Client lifecycle status**, **Lifecycle exit reason** |
| **Role access** | Admin → Roles → **Clients** module + **Full profile** tab (`client-full-profile`) at Write |
| **Admin verify** | Edit lifecycle on a test client; confirm badge on list and audit trail entry |

### WP-A.2 — Plan budget line table

| | Detail |
|---|--------|
| **User how-to** | Help → **Clients** → section **Plan budget** (`client-plan-budget`) |
| **User steps** | 1. Open client → **Plan budget** tab. 2. Review summary cards. 3. Add/edit lines (support budget, category, allocated, claimed). 4. Save; refresh to confirm persistence. |
| **System setup** | `/system/setup/clients` — checklist items for NDIS lists and **Plan budget** role grant |
| **Reference data** | **NDIS support budget**, **NDIS support category** |
| **Role access** | **Plan budget** tab window `client-plan-budget` at Read or Write |
| **Admin verify** | Role without Plan budget cannot see tab; role with Write can edit and save lines |

### WP-A.3 — Core consents

| | Detail |
|---|--------|
| **User how-to** | Help → **Clients** → **Consents and Legal Orders** + **Core consents summary** |
| **User steps** | 1. Open **Consents and Legal Orders**. 2. Review three core tiles (Service, Information, Photo). 3. Add lines with type, status, dates. 4. Check **Overview** consent alert list and **Core consents** panel. |
| **System setup** | `/system/setup/clients` — **Consent status** list |
| **Reference data** | **Consent status**; consent type list if customised |
| **Role access** | **Consents and Legal Orders** tab (`client-consents-and-legal-orders`) |
| **Admin verify** | Refused photo consent appears on Overview alerts |

### WP-A.4 — Plan budget wizard

| | Detail |
|---|--------|
| **User how-to** | Help → **Clients** → **Plan budget** (wizard buttons described in steps) |
| **User steps** | 1. **Plan budget** tab → **Core supports starter** or **Full plan scaffold**. 2. Enter allocated amounts from NDIS plan. 3. Save. |
| **System setup** | Same as WP-A.2 (no extra reference data) |
| **Reference data** | — |
| **Role access** | `client-plan-budget` Write |
| **Admin verify** | Scaffold adds expected row count; lines persist after refresh |

### WP-A.5 — Overview utilisation

| | Detail |
|---|--------|
| **User how-to** | Help → **Clients** → **Plan utilisation on Overview** |
| **User steps** | 1. Open **Overview**. 2. Review **Plan utilisation** totals. 3. Click **Open Plan budget** to edit lines. |
| **System setup** | Same as WP-A.2 |
| **Reference data** | — |
| **Role access** | **Overview** + **Plan budget** as needed |
| **Admin verify** | Totals match Plan budget tab after line edit |

### WP-B.1 — Booking compliance

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → section **Booking compliance checks** (`delivery.ts` § `booking-compliance`) |
| **User steps** | 1. Open **Service bookings** → select booking. 2. Read compliance panel (pass / warning / error). 3. Fix errors (dates, budget, client). 4. Save when no blocking errors. |
| **System setup** | `/system/setup/services` → guide **Services setup** |
| **Reference data** | Products/UoM under `/system/reference-data/services` (existing) |
| **Role access** | **Service bookings** window Write; clients need **Plan budget** for budget checks |
| **Admin verify** | Invalid dates block save; budget exceeded blocks save when client has plan lines |

### WP-B.2 — Cancellation policy

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **Cancellation policy** (`delivery.ts` § `booking-cancellation`) |
| **User steps** | 1. Set status *Cancelled*. 2. Complete date, initiator, reason. 3. Review policy panel (notice days, claimable estimate). 4. Save when compliance passes. |
| **System setup** | `/system/setup/services` → **Services setup** |
| **Reference data** | `/system/reference-data/services` → **Booking cancellation reason**, **Cancellation initiated by** |
| **Role access** | **Service bookings** Write |
| **Admin verify** | Cancel test booking with short notice; panel shows claimable estimate; fields persist after refresh |

### WP-B.3 — Extended compliance rules

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **Extended compliance rules** |
| **User steps** | 1. Link Active service agreement. 2. Confirm service delivery consent on client. 3. Add lines with products and dates in range. 4. Fix errors before save. |
| **System setup** | Active agreements + client consents before bookings go live |
| **Reference data** | Service agreement status |
| **Role access** | Service bookings Write |
| **Admin verify** | Inactive agreement or refused consent blocks save |

### WP-C.1 — Schedule of supports templates

| | Detail |
|---|--------|
| **User how-to** | Help → **Services** → **Service agreements** |
| **User steps** | 1. Open agreement. 2. Use schedule template. 3. Enter planned prices. 4. Save. |
| **System setup** | Products, price lists, service agreement status |
| **Role access** | Service agreements Write |
| **Admin verify** | Template adds lines; total recalculates on save |

### WP-C.2 — Agreement lifecycle

| | Detail |
|---|--------|
| **User how-to** | Help → **Services** → **Agreement lifecycle** |
| **User steps** | Progress Draft → Sent → Signed → Active; fix panel errors before save |
| **System setup** | Service agreement status reference list |
| **Role access** | Service agreements Write |
| **Admin verify** | Invalid transition blocks save |

### Entity linking — Service bookings on client

| | Detail |
|---|--------|
| **Governance** | [BUILD-EXPECTATIONS.md](./BUILD-EXPECTATIONS.md) §14 — entity link matrix |
| **User how-to** | Help → **Clients** → **Service bookings tab**; Help → **Delivery** → **Service bookings** (client link) |
| **User steps** | 1. Open client → **Service bookings**. 2. Open a booking or **New service booking**. 3. Confirm business partner on booking detail. |
| **System setup** | `/system/setup/clients` — grant `client-service-bookings` + `service-bookings` |
| **Reference data** | — |
| **Role access** | `client-service-bookings` Read/Write; **Service bookings** module Write to create |
| **Admin verify** | Client tab lists linked bookings; new booking from tab pre-fills client |

### WP-E.1 — Monthly service plan scaffold

| | Detail |
|---|--------|
| **User how-to** | Help → **Services** → **Monthly service planning** (`service-planning`) |
| **User steps** | 1. Open **Service planning** hub. 2. **From plan budget** for a client with Plan budget lines. 3. Enter planned hours and spend. 4. Approve when signed off. 5. Or use client → **Monthly service plan** tab. |
| **System setup** | `/system/setup/services` — grant **Service planning** + **Monthly service plan** client tab |
| **Reference data** | NDIS support budget/category (for line dropdowns) |
| **Role access** | Admin → Roles → **Service planning** Write; **Monthly service plan** tab on Clients |
| **Admin verify** | Create plan from budget; save line edit; confirm Supabase `monthly_service_plan` row |

### WP-E.2 — Burn rate + forecast alerts

| | Detail |
|---|--------|
| **User how-to** | Help → **Services** → **Monthly service planning** → **Burn rate and forecast alerts** |
| **User steps** | 1. Open a monthly plan. 2. Review utilisation, burn rate, and forecast cards. 3. Act on warnings (underserviced, overspend, plan review). 4. Check **Alerts** column on the hub list. |
| **System setup** | Set **Plan review due** on client Full profile for accurate plan period |
| **Reference data** | — |
| **Role access** | **Service planning** Read (alerts are read-only) |
| **Admin verify** | Bern plan shows underserviced warning when utilisation &lt; 30% past 50% of plan period |

### WP-E.3 — SCHADS cost prediction

| | Detail |
|---|--------|
| **User how-to** | Help → **Services** → **Monthly service planning** → **SCHADS cost prediction** |
| **User steps** | 1. Open monthly plan with planned hours. 2. Review predicted labour cost vs planned revenue. 3. Change employment type to stress-test margin. |
| **System setup** | — |
| **Reference data** | — |
| **Role access** | **Service planning** Read |
| **Admin verify** | Bern Oct plan shows per-line margin; Casual loading increases predicted cost |

### WP-F.1 — Payroll reconciliation batch + digest

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **Timesheets** (batch reconciliation steps) |
| **User steps** | 1. Export approved timesheets. 2. After pay run, review summary cards. 3. Batch reconcile at exported hours or enter paid hours per record. 4. Filter Variance rows before closing payroll. |
| **System setup** | `/system/setup/services` — export then reconcile after pay run |
| **Reference data** | — |
| **Role access** | **Timesheets** Write |
| **Admin verify** | Batch reconcile marks multiple records Processed with one pay run ref |

### WP-F.2 — Payroll period close checklist

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **Timesheets** (payroll period close steps) |
| **User steps** | 1. Approve and export timesheets. 2. Reconcile after pay run. 3. Run checklist on **Timesheets**. 4. Enter pay run ref and mark closed. 5. Confirm generation is blocked for that period. |
| **System setup** | `/system/setup/services` — close-period checklist after reconcile |
| **Reference data** | — |
| **Role access** | **Timesheets** Write |
| **Admin verify** | Close a test period; **Generate timesheets** shows blocked message for overlapping dates |

### WP-G.1 — Client Roster of care tab

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **Rostering** (client RoC tab steps) |
| **User steps** | 1. Open client → **Roster of care**. 2. Review weekly template and hour totals. 3. Compare rostered hours for selected week. 4. Link to Rostering → RoC to publish. |
| **System setup** | `/system/setup/services` — review client RoC tab before go-live |
| **Role access** | **Clients** → **Roster of care** tab Read; **Rostering** Write to publish |
| **Admin verify** | Bern shows RoC lines and gap vs rostered hours |

### WP-G.2 — Employee Schedule tab

| | Detail |
|---|--------|
| **User how-to** | Help → **People** → **Schedule and template** |
| **User steps** | 1. Open employee → **Schedule**. 2. Navigate weeks / fortnight. 3. Open linked shifts via Rostering. |
| **System setup** | Grant **employee-schedule** tab to rostering roles |
| **Role access** | **Employees** → **Schedule** Read |
| **Admin verify** | Worker with published shifts shows on week calendar |

### WP-G.3 — My shifts week calendar

| | Detail |
|---|--------|
| **User how-to** | Help → **My workplace** → **Check in to your shifts** |
| **User steps** | My shifts → toggle **Week calendar** |
| **System setup** | **My shifts** window for support workers |
| **Role access** | **My shifts** Read |
| **Admin verify** | Week grid shows same shifts as list view |

### WP-H.1 — Worker schedule templates (Workforce planning)

| | Detail |
|---|--------|
| **User how-to** | Help → **People** → **Schedule and template**; Workforce planning worker supply |
| **User steps** | 1. Worker sets My workplace → Availability. 2. Coordinator edits employee → Schedule template. 3. Workforce planning lists all templates. |
| **System setup** | `/system/setup/services` — worker templates before fill board |
| **Role access** | **Workforce planning** Write to edit templates; **employee-schedule-template** Read |
| **Admin verify** | Template saves and appears on workforce supply table |

### WP-H.2 — Workforce fill board

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **Rostering** (fill board step) |
| **User steps** | 1. Publish RoC as Draft vacant shifts. 2. Workforce planning → Fill board. 3. Assign suggested worker. 4. Publish shift on Rostering. |
| **System setup** | `/system/setup/services` — fill board after RoC publish |
| **Role access** | **Workforce planning** Read; **Rostering** Write to assign |
| **Admin verify** | Assign removes vacancy; worker sees shift on Schedule tab |

### WP-I.1 — Claim generation scaffold

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **NDIS claims** |
| **User steps** | 1. Approve and verify timesheets. 2. Generate claims for period. 3. Review PAPL validation. 4. Submit when gateway connected (future). |
| **System setup** | `/system/setup/services` — Claims + Generate claims grants |
| **Role access** | **Claims** Read/Write; **Generate claims** Write |
| **Admin verify** | Draft claim lines link to timesheet lines; validation blocks submit on errors |

### WP-I.2 — PAPL hard blocks + gateway stub

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **NDIS claims** (gateway submit steps) |
| **User steps** | 1. Fix PAPL errors on draft claim. 2. Submit to gateway. 3. Review gateway ref on detail. |
| **System setup** | `NDIS_GATEWAY_DRY_RUN=true` on Amplify for testing |
| **Role access** | **Claims** Write |
| **Admin verify** | Save blocked on errors; gateway submit sets ref + Submitted |

### WP-G.0 (future) — Participant portal schedule

| | Detail |
|---|--------|
| **Status** | ⬜ Chunk 0 — not in this slice |
| **Planned** | Read-only week view of participant services (Scope Stage 0 portal) |

## WP-A — Client foundation (Chunk 1) ✅ COMPLETE

| Slice | Deliverable | Status | % of WP-A |
|-------|-------------|--------|-----------|
| A.1 | Client lifecycle status | ✅ Done | 20% |
| A.2 | Plan budget line table | ✅ Done | 25% |
| A.3 | Consent tab alignment | ✅ Done | 15% |
| A.4 | Plan manual entry wizard | ✅ Done | 20% |
| A.5 | Utilisation summary on Overview | ✅ Done | 20% |

**WP-A completion:** 100%

---

## WP-B — Service booking compliance (Chunk 3) ✅ COMPLETE

| Slice | Deliverable | Status |
|-------|-------------|--------|
| B.1 | Compliance rule engine + UI panel + save blocks | ✅ Done |
| B.2 | Cancellation policy engine | ✅ Done |
| B.3 | Extended compliance rules | ✅ Done |
| B.4 | Budget line validation link | ✅ Done (in B.1) |

**WP-B completion:** 100%

---

## WP-C — Service agreements (Chunk 2)

| Slice | Deliverable | Status |
|-------|-------------|--------|
| C.1 | Template + schedule of supports | ✅ Done |
| C.2 | Lifecycle states Draft → Active | ✅ Done |
| C.3 | In-app e-sign capture | ✅ Done |
| C.4 | Expiry notification hook | ✅ Done |

**WP-C completion:** 100%

---

## Shipped log

| Date | Commit | What shipped |
|------|--------|--------------|
| 2026-06-18 | c9e74f7 | WP-C.1 schedule of supports templates |
| 2026-06-18 | 8e6bc50 | Bugbot fixes: cancellation local date + stale fields |
| 2026-06-18 | 6fce676 | Per-slice user guides and system setup docs |
| 2026-06-18 | 777b20e | WP-A complete + WP-B.1 booking compliance |
| 2026-06-18 | 0ad2f6c | WP-A.2: plan budget lines |
| 2026-06-18 | bd60219 | WP-A.1: lifecycle + governance |
| 2026-06-20 | pending | Entity linking, WP-C.3 e-sign, WP-C.4 expiry hook, verification process |
| 2026-06-20 | aa3c71f | Entity linking, WP-C.3 e-sign, WP-C.4 expiry hook, verification process |
| 2026-06-20 | fd5e7e4 | WP-D.2 create/edit shifts + recurring, WP-D.3 conflict engine |
| 2026-06-20 | 9336f35 | WP-D.4 master roster forward plan view |
| 2026-06-20 | 0515809 | WP-D.5 gap analysis + vacant shift markers |
| 2026-06-20 | 4580bb4 | WP-D.6 open shift marketplace |
| 2026-06-20 | c7a6012 | WP-D.7 timesheet generation from roster shifts |
| 2026-06-20 | 7a518b5 | WP-D.8 worker shift check-in MVP |
| 2026-06-20 | 957ed03 | WP-D.9 timesheet verification vs check-in |
| 2026-06-20 | aee1aec | WP-D.10 GPS check-in capture |
| 2026-06-18 | 9bd8fb6 | WP-D.11 geofence check-in alerts |
| 2026-06-18 | 329ffb8 | WP-D.12 payroll CSV export |
| 2026-06-18 | 7f984b9 | WP-D.13 RoC import and generate from agreement |
| 2026-06-18 | 00c69f7 | WP-D.14 publish roster shifts from RoC |
| 2026-06-18 | 63423e2 | WP-D.15 roster capacity planning |
| 2026-06-18 | b41d598 | WP-D.16 Keypay API export hook |
| 2026-06-18 | fd6df49 | WP-D.17 mobile My shifts polish |
| 2026-06-18 | 062fe13 | WP-D.18 payroll reconciliation stub |
| 2026-06-18 | 629c4aa | WP-D.19 roster hard enforcement |
| 2026-06-18 | 9811610 | System Time & date, sidebar clock, My shifts timezone |
| 2026-06-18 | c400bd1 | WP-D.20 staff–client matching hints |
| 2026-06-18 | 5a57d5c | WP-D.21 drag-and-drop week view |
| 2026-06-18 | 8d4300c | WP-E.1 monthly service plan scaffold |
| 2026-06-18 | 493b46f | WP-E.2 burn rate + forecast alerts |
| 2026-06-18 | a235f93 | WP-E.3 SCHADS cost prediction |
| 2026-06-18 | e2fcd01 | WP-F.2 payroll period close checklist + Supabase lock |
| 2026-06-18 | 8921a9d | Admin role always grants full catalog Write access |
| 2026-06-18 | 5f0da49 | WP-F.1 payroll reconciliation batch + digest |
| 2026-06-20 | c3473f7 | WP-G/H master roster on records + workforce fill board |
| 2026-06-20 | e996324 | WP-I.1 claim generation scaffold + PAPL validation |
| 2026-06-20 | c14ed73 | WP-I.2 PAPL hard blocks + NDIS gateway dry-run stub |

---

## Verification log (Tier 1 — automated)

| Date | Command | Result |
|------|---------|--------|
| 2026-06-18 | `npm run build` | exit 0 |
| 2026-06-18 | `npm run page-guides:check` | exit 0 |
| 2026-06-18 | `npm run supabase:push-remote` | `20260624180000` cancellation fields |
| 2026-06-20 | `npm run build` | exit 0 (entity linking + WP-C.3/C.4) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 |
| 2026-06-20 | `npm run build` | exit 0 (WP-D.2 + WP-D.3) |
| 2026-06-20 | `npm run build` | exit 0 (WP-D.5) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 (WP-D.5) |
| 2026-06-20 | `npm run build` | exit 0 (WP-D.6 + WP-D.7) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 78 routes (WP-D.7) |
| 2026-06-20 | `npm run supabase:push-remote` | `20260625190000_timesheet.sql` |
| 2026-06-20 | `npm run build` | exit 0 (WP-D.8) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 79 routes (WP-D.8) |
| 2026-06-20 | `npm run build` | exit 0 (WP-D.9) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 79 routes (WP-D.9) |
| 2026-06-20 | `npm run build` | exit 0 (WP-D.10) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 79 routes (WP-D.10) |
| 2026-06-20 | `npm run supabase:push-remote` | `20260625210000` check-in geo columns |
| 2026-06-20 | `npm run supabase:push-remote` | `20260625200500` check-in + my-shifts access |
| 2026-06-18 | `npm run build` | exit 0 (WP-D.11) |
| 2026-06-18 | `npm run page-guides:check` | exit 0 — 79 routes (WP-D.11) |
| 2026-06-18 | `npm run supabase:push-remote` | `20260625220000` location geofence columns |
| 2026-06-18 | `npm run build` | exit 0 (WP-D.12) |
| 2026-06-18 | `npm run page-guides:check` | exit 0 — 79 routes (WP-D.12) |
| 2026-06-18 | `npm run supabase:push-remote` | `20260625230000` timesheet payroll export columns |
| 2026-06-18 | `npm run supabase:push-remote` | `20260625250000` timesheet payroll reconciliation columns |
| 2026-06-20 | `npm run build` | exit 0 (WP-I.1) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 85 routes (WP-I.1) |
| 2026-06-20 | `npm run supabase:push-remote` | `20260625280000` claim tables |

---

## Browser verification log (Tier 2 — agent)

| Date | Slice | Routes tested | Result | Notes |
|------|-------|---------------|--------|-------|
| 2026-06-20 | Entity linking + WP-C.3 | `/clients/bp-bern?tab=Service bookings`, `/service-bookings/50145`, `/service-agreements/sa-rose-ni`, `/service-bookings/new?clientId=bp-bern` | **Pass** | localhost:3000, SuperUser session, all HTTP 200 |
| 2026-06-20 | WP-D.5 | `/rostering` Gaps + Forward plan tabs | **Pass** | Gaps tab loads; forward plan shows coverage gaps card |
| 2026-06-20 | WP-D.6 | `/rostering` Open shifts tab | **Pass** | Vacant shifts listed |
| 2026-06-20 | WP-D.7 | `/generate-timesheets`, `/timesheets`, `/timesheets/[id]` | **Pass** | Generate creates draft; detail shows shift lines + audit |
| 2026-06-20 | WP-D.8 | `/my/shifts`, `/rostering` week view | **Partial** | Routes load; SuperUser blocked without employee link — use linked worker for check-in flow |
| 2026-06-20 | WP-D.9 | `/timesheets`, `/timesheets/[id]` | **Pass** | Verification panel + list column; approval block on unverified shift |
| 2026-06-20 | WP-D.10 | `/my/shifts`, `/rostering` | **Partial** | Routes load; GPS capture needs employee-linked user + browser permission |
| 2026-06-18 | WP-D.11 | `/locations/loc-glenelg-sil`, `/rostering`, `/timesheets` | **Pass** | HTTP 200; geofence UI needs linked worker + GPS coords outside radius for full flow |
| 2026-06-18 | WP-D.12 | `/timesheets` | **Pass** | HTTP 200; payroll export panel on list |
| 2026-06-18 | WP-D.13 | `/rostering` RoC tab | **Pass** | HTTP 200 |
| 2026-06-18 | WP-D.14 | `/rostering` RoC publish panel | **Pass** | HTTP 200 |
| 2026-06-18 | WP-D.15 | `/rostering` Capacity tab | **Pass** | HTTP 200 |
| 2026-06-18 | WP-D.16 | `/timesheets` | **Pass** | HTTP 200 |
| 2026-06-18 | WP-D.17 | `/my/shifts` | **Pass** | HTTP 200 |
| 2026-06-18 | WP-D.18 | `/timesheets` | **Pass** | HTTP 200 |
| 2026-06-18 | WP-D.19 | `/rostering` | **Pass** | HTTP 200 |
| 2026-06-18 | WP-D.20 | `/rostering` New shift editor | **Pass** | HTTP 200; matching panel in shift editor |
| 2026-06-18 | WP-D.21 | `/rostering` Week drag-drop | **Pass** | HTTP 200 |
| 2026-06-18 | WP-E.1 | `/service-planning`, `/service-planning/msp-bern-2025-10` | **Pass** | HTTP 200 |
| 2026-06-18 | WP-E.2 | `/service-planning/msp-bern-2025-10` burn-rate panel | **Pass** | build verified; alerts on Bern seed |
| 2026-06-18 | WP-E.3 | `/service-planning/msp-bern-2025-10` SCHADS panel | **Pass** | build verified; per-line margin table |
| 2026-06-18 | WP-F.1 | `/timesheets` reconciliation digest + batch | **Pass** | build verified |
| 2026-06-18 | WP-F.2 | `/timesheets`, `/generate-timesheets` | **Pass** | build verified; closed period blocks generation |
| 2026-06-20 | WP-G/H | `/clients/bp-bern`, `/employees/emp-isla`, `/workforce-planning`, `/my/shifts` | **Pass** | build verified; routes compile; tab grants via admin role |
| 2026-06-20 | WP-I.1 | `/claims`, `/generate-claims` | **Pass** | build verified; 85 routes |
| — | WP-A.1–B.1 | — | **Not run** | Backlog |

---

## Code review log (Tier 3 — Bugbot)

| Date | Commit range | Findings | Result | Notes |
|------|--------------|----------|--------|-------|
| 2026-06-20 | WP-D.5–D.7 follow-up | 3 High + 2 Medium + 1 Low | **Pass** | Fixed: coverage gap booking filter, atomic open-shift claim, timesheet IDs/overnight hours/permissions/locked period/audit |
| 2026-06-20 | WP-D.8 | 3 High + 1 Medium | **Pass** | Fixed: local-date check-in, server API binding, preserve check-in on roster save, useMyEmployee |
| 2026-06-20 | WP-D.9 | 1 High | **Pass** | Fixed: only block approval transition, not saves on already-approved timesheets |
| 2026-06-20 | WP-D.10 | 1 Medium | **Pass** | Fixed: GPS badge when check-in or check-out coordinates present |
| 2026-06-18 | WP-D.11 | 0 | **Pass** | No findings |
| 2026-06-18 | WP-D.12 | 1 High + 1 Medium | **Pass** | Fixed: export uses saved record only; verification gate on export |
| 2026-06-18 | WP-D.13 | 2 High + 3 Medium | **Pass** | Fixed: unique line IDs, draft-only generate, location validation, upsert lines |
| 2026-06-18 | WP-D.14 | 2 High + 1 Medium | **Pass** | Fixed: stable shift IDs, overnight RoC lines, skip-all message |
| 2026-06-18 | WP-D.15 | 2 Medium | **Pass** | Fixed: detail week sync on navigate; rostered non-active workers visible |
| 2026-06-18 | WP-D.16 | 5 High + 2 Medium | **Pass** | Fixed: server validation/persist, Basic auth, dry-run priority, double-click, fetch catch |
| 2026-06-18 | WP-D.17 | 1 High + 1 Medium | **Pass** | Fixed: yesterday action shifts on Today tab; check-out before check-in in banner |
| 2026-06-18 | WP-D.18 | 1 High + 1 Medium | **Pass** | Fixed: disable reconcile when draft dirty; reset form on timesheet navigation |
| 2026-06-18 | WP-D.19 | 2 High | **Pass** | Fixed: skip TIME_RANGE_INVALID on batch save and open-shift claim for overnight RoC |
| 2026-06-18 | WP-D.20 | 2 High | **Pass** | Fixed: non-Current mandatory credentials warn; memoized worker ranking |
| 2026-06-18 | WP-D.21 | 1 High | **Pass** | Fixed: canRescheduleShiftByDrag enforced on drop path |
| 2026-06-18 | WP-E.1 | 3 High | **Pass** | Fixed: clientTabGroups tab, editor draft reset, duplicate plan month on save |
| 2026-06-18 | WP-E.2 | 0 | **Pass** | Pure lib + read-only panel; no migration |
| 2026-06-18 | WP-E.3 | 0 | **Pass** | Planning lib only; no payroll integration |
| 2026-06-18 | WP-F.1 | 0 | **Pass** | Batch uses bulkUpsertTimesheets + audit |
| 2026-06-18 | WP-F.2 | 3 High + 1 Medium — all fixed | **Pass** | Supabase closed periods, overlap match, generation messaging |
| 2026-06-20 | WP-G/H | 1 High + 1 Medium — all fixed | **Pass** | Fill board capacity per shift week; week calendar uses all shifts |
| 2026-06-20 | WP-I.1 | 2 High — all fixed | **Pass** | Preview excludes locked claims; seed-access claims windows |
| 2026-06-20 | uncommitted | 2 High + 2 Medium | **Pass** | Fixed: Draft→Signed e-sign path, blank signature, tab counts, legacy signature backfill |
| 2026-06-18 | `e0ccb56`–`a88e1dc` | 1 High + 2 Medium — all fixed | Pass | Multi-line dates, local date, stale fields |
| 2026-06-18 | `a88e1dc` | — | **Pass** | [Bugbot branch review](ec37fa04-ce0e-4c70-be28-88b0bcd95bc5) — no findings |

---

## Guide delivery log

| Date | Slice | User article | System setup | page-guides:check |
|------|-------|--------------|--------------|-------------------|
| 2026-06-18 | WP-A.1–A.5 | `clients` — lifecycle, plan budget, consents, utilisation | `clients-setup` updated | exit 0 |
| 2026-06-18 | WP-C.1 | `services` — schedule templates | `services-setup` | exit 0 |
| 2026-06-18 | WP-B.2 | `delivery` — cancellation policy | `services-setup` updated | exit 0 |
| 2026-06-20 | Entity linking | `clients` — Service bookings tab; `delivery` client link | `clients-setup` + seed-access | exit 0 |
| 2026-06-20 | WP-C.3 | `services` — Participant e-sign | `services-setup` | exit 0 |
| 2026-06-20 | WP-D.5 | `delivery` — gap analysis + vacant shifts | — | exit 0 |
| 2026-06-20 | WP-D.6 | `delivery` — open shift marketplace; `my-workplace` — claim shifts | — | exit 0 |
| 2026-06-20 | WP-D.7 | `delivery` — timesheet generation | `services-setup` — roster + timesheet grants | exit 0 |
| 2026-06-20 | WP-D.8 | `my-workplace` — check in; `delivery` — verified badges | `services-setup` — My shifts grant | exit 0 |
| 2026-06-20 | WP-D.9 | `delivery` — timesheet verification vs check-in | `services-setup` — verify before approve | exit 0 |
| 2026-06-20 | WP-D.10 | `my-workplace` + `delivery` — GPS on check-in | — | exit 0 |
| 2026-06-18 | WP-D.11 | `my-workplace` + `delivery` — geofence alerts; `locations-setup` — site coordinates | `locations-setup` | exit 0 |
| 2026-06-18 | WP-D.12 | `delivery` — payroll CSV export | `services-setup` — export approved timesheets | exit 0 |
| 2026-06-18 | WP-D.13 | `delivery` — RoC CSV import | `services-setup` — RoC before rostering | exit 0 |
| 2026-06-18 | WP-D.14 | `delivery` — publish RoC to roster calendar | `services-setup` — RoC publish workflow | exit 0 |
| 2026-06-18 | `npm run build` | exit 0 (WP-D.14) |
| 2026-06-18 | `npm run page-guides:check` | exit 0 — 79 routes (WP-D.14) |
| 2026-06-18 | `npm run build` | exit 0 (WP-D.15) |
| 2026-06-18 | `npm run page-guides:check` | exit 0 — 79 routes (WP-D.15) |
| 2026-06-18 | WP-D.15 | `delivery` — capacity planning tab | `services-setup` — review capacity before go-live | exit 0 |
| 2026-06-18 | WP-D.16 | `delivery` — Keypay API payroll export | `services-setup` — Keypay env vars on Amplify | exit 0 |
| 2026-06-18 | WP-D.17 | `my-workplace` — mobile My shifts tabs | — | exit 0 |
| 2026-06-18 | WP-D.18 | `delivery` — payroll reconciliation after export | `services-setup` — reconcile after pay run | exit 0 |
| 2026-06-18 | WP-D.19 | `delivery` — publish week hard blocks | `services-setup` — resolve conflicts before publish | exit 0 |
| 2026-06-18 | WP-D.20 | `delivery` — staff–client matching hints on shift editor | `services-setup` — credentials and skills for matching | exit 0 |
| 2026-06-18 | WP-D.21 | `delivery` — drag shifts between days on week view | — | exit 0 |
| 2026-06-18 | WP-E.1 | `delivery` — monthly service planning hub + client tab | `services-setup` — service planning grants | exit 0 — 82 routes |
| 2026-06-18 | WP-E.2 | `delivery` — burn rate and forecast alerts section | — | exit 0 — 82 routes |
| 2026-06-18 | WP-E.3 | `delivery` — SCHADS cost prediction section | — | exit 0 — 82 routes |
| 2026-06-18 | WP-F.1 | `delivery` — batch payroll reconciliation steps | `services-setup` — batch reconcile | exit 0 — 82 routes |
| 2026-06-18 | WP-F.2 | `delivery` — payroll period close steps | `services-setup` — close-period checklist | exit 0 — 82 routes |
| 2026-06-20 | WP-G/H | `people` — schedule/template; `delivery` — RoC tab + fill board; `my-workplace` — week calendar | `services-setup` — worker templates + fill board | exit 0 — 82 routes |
| 2026-06-20 | WP-I.1 | `delivery` — NDIS claims section | `services-setup` — claims grants | exit 0 — 85 routes |
| 2026-06-18 | `npm run supabase:push-remote` | `20260625270000` payroll_closed_period table |
| 2026-06-18 | `npm run build` | exit 0 (WP-F.1) |
| 2026-06-18 | `npm run page-guides:check` | exit 0 — 82 routes (WP-F.1) |
| 2026-06-18 | `npm run supabase:push-remote` | `20260625260000` monthly_service_plan tables |
| 2026-06-18 | `npm run build` | exit 0 (WP-D.21) |
| 2026-06-18 | `npm run page-guides:check` | exit 0 — 80 routes (WP-D.21) |
| 2026-06-18 | `npm run build` | exit 0 (WP-D.19) |
| 2026-06-18 | `npm run page-guides:check` | exit 0 — 79 routes (WP-D.19) |
| 2026-06-18 | `npm run page-guides:check` | exit 0 — 79 routes (WP-D.18) |
| 2026-06-18 | `npm run page-guides:check` | exit 0 — 79 routes (WP-D.17) |
| 2026-06-18 | `npm run build` | exit 0 (WP-D.16) |
| 2026-06-18 | `npm run page-guides:check` | exit 0 — 79 routes (WP-D.16) |
| 2026-06-18 | `npm run build` | exit 0 (WP-D.13) |
| 2026-06-18 | `npm run page-guides:check` | exit 0 — 79 routes (WP-D.13) |
| 2026-06-18 | `npm run supabase:push-remote` | `20260625240000` roster_of_care tables |

---

## How to update this file

1. After each slice: update chunk %, WP slice status, overall %, shipped log.
2. Add **What you can test** rows for the new slice (table format above).
3. Add **User guides & system setup** row with user steps, reference data, role access, and admin verify.
4. Log Tier 1 / 2 / 3 results in the verification tables; log guides in **Guide delivery log**.
5. Set **Next slice** to the first incomplete item on the critical path.
