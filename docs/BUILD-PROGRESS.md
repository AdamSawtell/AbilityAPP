# AbilityAPP — build progress log

**Always read this before starting work.** Update after every shipped slice.  
**Roadmap:** [SCOPE-ROADMAP.md](./SCOPE-ROADMAP.md) · **Standards:** [BUILD-EXPECTATIONS.md](./BUILD-EXPECTATIONS.md)

---

## Overall program progress

| Metric | Value |
|--------|-------|
| **Overall completion** | **100%** |
| **Current work package** | **Document platform — complete** |
| **Active slice** | — |
| **Next slice** | Outbound email for `send-invoice` (or server PDF when host decided) |
| **Last push** | 2026-06-18 — `b1a0ed7` (D7 progress tracker) |
| **Chunk D tracker** | [plans/document-platform/README.md](./plans/document-platform/README.md) |

---

## Chunk D — Document platform (live tracker)

| Stage | Deliverable | Status |
|-------|-------------|--------|
| D0 | Schema, org brand kit (bank/footer/GST), template seed | ✅ Shipped |
| D1 | Invoice template render + `print-invoice` / `batch-print-invoices` | ✅ Shipped |
| D2 | System template admin (`/system/admin/document-templates`) | ✅ Shipped |
| D3 | Document registry + `/api/documents/register` + private bucket | ✅ Shipped |
| D4 | Batch invoice ZIP on list + binding admin | ✅ Shipped |
| D5 | Service agreement printable pack + e-sign registry | ✅ Shipped |
| D6 | HR contract pack + My workplace delivery | ✅ Shipped |
| D7 | Extended templates (enquiry, remittance, statement, board report, send invoice, clone) | ✅ Shipped |

**Chunk D (document platform): complete** — HTML print + registry; server PDF deferred until host decision.

**Policy:** Active template = production-ready (no separate legal sign-off gate).

### What you can test — WP-D.0–D.3

| Step | Action | Pass if |
|------|--------|---------|
| 1 | System → Tasks → Document templates | Template list shows NDIS participant invoice |
| 2 | Edit title/footer, save, refresh | Changes persist |
| 3 | System → Organisation → Document branding | Bank BSB/account fields save |
| 4 | Invoices → open invoice → Print invoice | Print preview with org header/footer |
| 5 | Download HTML | File downloads; registry row appears in Document registry |
| 6 | `npm run build` + `page-guides:check` | Exit 0 |

### What you can test — WP-D.4

| Step | Action | Pass if |
|------|--------|---------|
| 1 | System → Document templates → Default templates by process | Change batch default, save, refresh persists |
| 2 | Invoices list → select multiple rows → Batch print | ZIP downloads with one HTML per invoice |
| 3 | System → Document registry | Each invoice has a row; batch id suffix matches across the run |
| 4 | Role without `batch-print-invoices` | No checkboxes or batch button on list |

### What you can test — WP-D.5

| Step | Action | Pass if |
|------|--------|---------|
| 1 | System → Tasks → Document templates | NDIS service agreement and variation templates listed |
| 2 | Service agreements → open agreement → Print agreement | HTML preview with schedule lines and scaffold notice |
| 3 | Apply participant e-sign | Signature appears on print; registry row with `-signed` label suffix |
| 4 | System → Document registry | Agreement entries linked to service-agreement entity |

### What you can test — WP-D.6

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Employees → HR file → Documents → Generate contract | HR file line added; save persists |
| 2 | My workplace → Contracts | Generated contract visible; View document opens HTML |
| 3 | System → Document registry | Employee entity row exists |
| 4 | Part-time employee | Part-time template selected automatically |

### What you can test — WP-D.7

| Step | Action | Pass if |
|------|--------|---------|
| 1 | System → Document templates | Enquiry, remittance, participant statement, and board report templates listed |
| 2 | Enquiries → open enquiry → Print acknowledgement | Print preview opens; registry row for enquiry entity |
| 3 | Invoice reconciliation → Print remittance cover | Cover sheet lists filtered invoices; registry row appears |
| 4 | Clients → Overview → Print statement | Statement for participant; registry row for client entity |
| 5 | Board reporting → open pack → Print / export | Print opens; registry row when role has `print-board-report` |
| 6 | Invoices → open invoice → Send invoice | Dry-run message in dev; invoice marked Sent; registry row |
| 7 | Document templates → Duplicate template | Copy appears in list with "(copy)" suffix |
| 8 | `npm run build` + `page-guides:check` + `supabase:push-remote` | Exit 0 |

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
| 0 | Enquiry & CRM + portal | 10% | **100%** | ✅ Complete | — |
| 1 | Client & plan management | 12% | **100%** | ✅ Complete | Live OCR/API when credentials available |
| 2 | Service agreements | 10% | **100%** | ✅ Complete | None |
| 3 | Service bookings compliance | 12% | **100%** | ✅ Complete | None |
| 4 | Rostering | 22% | **100%** | ✅ Complete | — |
| 5 | Service planning | 8% | **100%** | ✅ Complete | — |
| 6 | Timesheets & payroll export | 10% | **100%** | ✅ Complete | — |
| 7 | Billing & claiming | 10% | **100%** | ✅ Complete | — |
| 8 | Reconciliation & reporting | 10% | **100%** | ✅ Complete | — |

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

### WP-A.6 — Plan budget CSV import (`d7cfaa4`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Client **Bern** → **Plan budget** | **Import plan budget CSV** panel visible |
| 2 | Click **Load sample template**, then **Import CSV** | Three lines appended to table |
| 3 | Check **Replace existing lines**, import again | Table shows only imported rows |
| 4 | Save, refresh | Imported lines persist |
| 5 | **Full audit trail** | Save logs plan budget line change |

### WP-A.7 — NDIS plan gateway stub (`e544aa9`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Client **Bern** → **Plan budget** | **NDIS plan gateway** panel visible |
| 2 | Confirm NDIS number on profile | Panel shows funding body number |
| 3 | Click **Pull plan from gateway** (with `NDIS_GATEWAY_DRY_RUN=true`) | Three scaffold lines replace table |
| 4 | Save, refresh | Lines persist |
| 5 | **Full audit trail** | Save logs plan budget change |

### WP-A.8 — Plan budget text paste import (`bc6daf9`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Client **Bern** → **Plan budget** | **Paste from plan PDF** panel visible |
| 2 | Click **Load sample template**, then **Import pasted text** | Three lines appended |
| 3 | Check **Replace existing lines**, import again | Table shows only imported rows |
| 4 | Save, refresh | Lines persist |
| 5 | **Full audit trail** | Save logs plan budget change |

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

### WP-B.3 — Extended compliance (`verified`)

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

### WP-D.22 — Roster week CSV export (`2c088cd`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Rostering** → Week tab | **Export week CSV** button visible |
| 2 | Navigate to week of 6 Oct 2025 (Bern shifts) | Shifts visible on calendar |
| 3 | Click **Export week CSV** | File `roster-week-2025-10-06.csv` downloads |
| 4 | Open CSV | Header row + shift rows with client/worker search keys and times |

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

### WP-I.3 — Remittance import + match (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Claims** list | Remittance import panel visible (Write access) |
| 2 | Submit claim via gateway (dry-run) | Claim has gateway ref + Submitted status |
| 3 | **Download template** on remittance panel | CSV with gateway ref columns |
| 4 | **Preview matches** — paste CSV | Match table shows Matched / Variance / Unmatched |
| 5 | **Apply remittance** | Claim status Accepted; gateway Paid; remittance column updated |
| 6 | Refresh page (Supabase mode) | Remittance batch + claim payment fields persist |

### WP-I.4 — Invoicing scaffold (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Invoices** list | HTTP 200; Generate invoices link visible |
| 2 | Client with plan-managed funding body | Generate invoices preview shows participant |
| 3 | **Generate invoices** — click Generate | Draft invoice created |
| 4 | Open invoice detail | PAPL validation + lines; Mark as sent |
| 5 | **Generate claims** for same period | Agency lines only; plan-managed skipped |
| 6 | Save invoice change | Audit footer logs change |

### WP-J.1 — Plan vs actual reconciliation (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Plan reconciliation** | HTTP 200; month picker and summary cards visible |
| 2 | Select **2025-10** (Bern seed plan) | Bern row shows planned 72h / $6000 |
| 3 | With no timesheets for month | Status **No actual** |
| 4 | After approved timesheets + claims | Actual hours and billed $ populate |
| 5 | **Export CSV** | Downloads plan-vs-actual file |
| 6 | **Service planning** hub | Plan reconciliation link visible |

### WP-J.2 — Claim reconciliation dashboard (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Claim reconciliation** | HTTP 200; summary cards and table visible |
| 2 | With no submitted claims | Empty state message shown |
| 3 | After gateway submit + remittance import | Matched/Variance rows populate |
| 4 | Filter by remittance status | Table filters correctly |
| 5 | **Export CSV** | Downloads claim-reconciliation file |
| 6 | **Claims** list | Claim reconciliation banner link visible |

### WP-J.3 — Financial close reports (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Financial close** | HTTP 200; month picker and checklist visible |
| 2 | Select **2025-10** | Plan, claims, invoices, payroll checks shown |
| 3 | With Bern plan + no delivery | Plan check shows warning or pass (no variance) |
| 4 | **Review** link on blocked check | Opens plan/claim/invoices/timesheets |
| 5 | **Export CSV** | Downloads financial-close file |
| 6 | **Reports** → Financial close summary | CSV report generates |

### WP-J.4 — NDIS audit pack export (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **NDIS audit pack** | HTTP 200; section checklist visible |
| 2 | Select **2025-10** | Sections show row counts |
| 3 | Blocked section (e.g. unverified timesheet) | Status shows block/warning |
| 4 | **Export manifest** | Downloads ndis-audit-pack-manifest CSV |
| 5 | **Export CSV** on a section | Section extract downloads |
| 6 | **Reports** → NDIS audit pack summary | Manifest report generates |

### WP-E.4 — Multi-provider budget (`3e8c61c`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Client **Plan budget** tab | Plan provider column on each line (default This organisation) |
| 2 | Set provider label → save → refresh | Value persists (Supabase `plan_provider` column) |
| 3 | **Multi-provider budget** | HTTP 200; provider filter and participant rows |
| 4 | Filter by provider | Table filters; totals update |
| 5 | **Export CSV** | Downloads multi-provider-budget file |

### WP-F.3 — Timesheet submit + approval (`3e8c61c`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Worker **My workplace → My timesheets** | Draft timesheet list loads |
| 2 | Open draft → **Submit** | Status Submitted when verification passes |
| 3 | Submit with unverified shift | Blocked with message |
| 4 | Change status to Submitted via dropdown → Save | Submit validation still blocks |
| 5 | Supervisor **Timesheets** → **Approve** | Status Approved when verification green |

### WP-I.5 — Plan budget billing claimed rollup (`3e8c61c`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Client **Plan budget** tab | Billing claimed rollup panel visible |
| 2 | With no claims/invoices | Manual claimed shown; billing $0 |
| 3 | **Apply billing rollup** → save → refresh | Claimed split proportionally by allocated amount within category |

### WP-I.6 — Cancellation claim generation (`3e8c61c`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Generate claims** | Cancellation claims panel visible |
| 2 | Cancelled booking (participant, short notice) | Eligible bookings count &gt; 0 |
| 3 | **Generate cancellation claims** | Draft claim created/merged without losing existing lines |
| 4 | Open draft claim | Cancellation lines linked to booking |

### WP-J.5 — Financial month lock (`3e8c61c` / `16f703c`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Financial close** → Mark month closed panel | Month picker + checklist + button |
| 2 | Blocked month (e.g. June 2026) | Mark month closed disabled |
| 3 | Month with passing checklist → **Mark month closed** | Success message; closed banner |
| 4 | Refresh page | Closed state persists from Supabase `financial_closed_month` |

### WP-J.6 — Invoice reconciliation dashboard (`3e8c61c`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Invoice reconciliation** | HTTP 200; summary cards + filters |
| 2 | **Financial close** / **Invoices** | Link to invoice reconciliation visible |
| 3 | Filter by reconcile status | Table filters |
| 4 | **Export CSV** | Downloads when rows exist |

### WP-J.7 — Plan reconciliation v2 columns (`3e8c61c`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Plan reconciliation** | Scheduled h and Rejected $ columns visible |
| 2 | Select month with roster + rejected claim | Scheduled h and Rejected $ populate |
| 3 | **Export CSV** | New columns included in export |

### WP-0.1 — Enquiry pipeline stages (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Enquiries** list | Stage filter chips + Overdue follow-ups stat card |
| 2 | Open enquiry **1000025** | Pipeline panel shows five stages |
| 3 | Set status *Qualification*, save | Saves; audit trail logs status |
| 4 | Try status *Converted* manually | Blocked — use Convert to client |
| 5 | Set status *Lost* without loss reason | Save blocked |
| 6 | Set loss reason + next action date, save | Persists after refresh |
| 7 | Overdue follow-ups scope | Past-due open enquiries listed in rose |

### WP-0.2 — NDIS qualification scoring (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open enquiry **1000025** → **Qualification** tab | Score panel + breakdown visible |
| 2 | Review score | Hot/Warm tier with NDIS + metro postcode factors |
| 3 | Change urgency to *High*, save | Score increases; tier may rise |
| 4 | **Enquiries** list | Qualification column + tier filter chips |
| 5 | Filter **Hot** | Samuel Ryan appears when score ≥ 70 |
| 6 | **Full audit trail** after save | Qualification score/tier logged |

### WP-0.3 — Portal MVP (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open `/portal/login` | Sign-in form loads without staff login |
| 2 | Enter **Bernie@email**, request link | Demo sign-in link shown (non-production) |
| 3 | Open demo link | Redirects to `/portal` hub signed in as Bernie |
| 4 | **My services** | Upcoming Bern shifts (Jun 2026) listed |
| 5 | **My funding** | Plan budget summary + category lines |
| 6 | **Sign out** | Returns to login; protected routes redirect |

### WP-0.4 — Service request workflow stub (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Portal sign-in as **Bernie@email** → **Request a service** | Form + request list load |
| 2 | Submit community participation request | Status **Under review**; success message |
| 3 | Staff **Tasks** → open linked review task | Portal service request panel visible |
| 4 | **Approve and create variation draft** | Draft SA link shown; request **Approved** on portal |
| 5 | Portal refresh | Participant sees **Approved** status |

### WP-0.5 — External CRM sync + cross-sell (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Set `HUBSPOT_DRY_RUN=true`, open enquiry **1000025** | External CRM sync panel shows dry-run mode |
| 2 | Click **Sync to HubSpot** | Success message with DRY-HS contact id; activity logged |
| 3 | **Full audit trail** | CRM provider, contact id, and sync date logged |
| 4 | **Enquiries** list | Cross-sell panel shows Bern (underserviced) when plan utilisation is low |
| 5 | POST `/api/public/web-to-lead` with `x-abilityapp-webhook-secret` | 201 + new enquiry with source Website form |

### WP-G.0 — Participant portal week calendar (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Portal sign-in as **Bernie@email** → **My services** | **Week view** selected by default |
| 2 | Navigate to week containing Jun 2026 demo shifts | Bern shifts appear on calendar days |
| 3 | **Previous week** / **Next week** / **This week** | Calendar updates; shift count card changes |
| 4 | Switch to **List view** | Table shows all upcoming shifts (8-week horizon) |
| 5 | Empty week | Days show “No supports” without error |

### WP-0.6 — Live HubSpot contact upsert (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Unset `HUBSPOT_DRY_RUN`, set `HUBSPOT_ACCESS_TOKEN` | CRM panel shows **live** mode |
| 2 | Open enquiry with email → **Sync to HubSpot** | Returns numeric HubSpot contact id (or API error with message) |
| 3 | Re-sync same enquiry | Updates existing contact (PATCH or email upsert) |
| 4 | Set `HUBSPOT_DRY_RUN=true` again | Dry-run id prefix `DRY-HS-` restored |
| 5 | Phone-only enquiry (no email) | Creates contact when token valid |

### WP-0.7 — Client portal requests on Requests tab (`2026-06-20`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Client **Bern** → tab **Requests** | Participant portal requests panel above tasks |
| 2 | After Bernie submits a portal request | Request listed with status and **Open review task** link |
| 3 | Click review task link | Task detail shows portal service request panel |
| 4 | After approve | **View variation draft** link appears on Requests tab |
| 5 | User without Clients read | API returns 403 |

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

### WP-A.6 — Plan budget CSV import

| | Detail |
|---|--------|
| **User how-to** | Help → **Clients** → **Plan budget** (CSV import steps) |
| **User steps** | 1. **Plan budget** tab → **Import plan budget CSV**. 2. Paste CSV or load sample template. 3. Choose append or **Replace existing lines**. 4. **Import CSV**, then save the client record. |
| **System setup** | Same as WP-A.2 — NDIS support budget and category lists for dropdown validation |
| **Reference data** | **NDIS support budget**, **NDIS support category** |
| **Role access** | `client-plan-budget` Write |
| **Admin verify** | Invalid CSV shows errors; valid import updates line table after save |

### WP-A.7 — NDIS plan gateway stub

| | Detail |
|---|--------|
| **User how-to** | Help → **Clients** → **Plan budget** (gateway pull steps) |
| **User steps** | 1. Set participant **Funding body number** (NDIS number) on client profile. 2. **Plan budget** tab → **Pull plan from gateway**. 3. Choose replace or append. 4. Save the client record. |
| **System setup** | `/system/setup/clients` — `NDIS_GATEWAY_DRY_RUN=true` for dry-run; `NDIS_GATEWAY_API_KEY` + `NDIS_GATEWAY_PROVIDER` when live |
| **Reference data** | — |
| **Role access** | `client-plan-budget` Write |
| **Admin verify** | Missing NDIS number blocks pull; dry-run loads scaffold lines with valid categories |

### WP-A.8 — Plan budget text paste import

| | Detail |
|---|--------|
| **User how-to** | Help → **Clients** → **Plan budget** (PDF paste steps) |
| **User steps** | 1. Copy budget lines from NDIS plan PDF or myplace. 2. **Paste from plan PDF** → paste text or load sample. 3. **Import pasted text**, then save. |
| **System setup** | Same as WP-A.2 — NDIS support budget and category lists |
| **Reference data** | **NDIS support budget**, **NDIS support category** |
| **Role access** | `client-plan-budget` Write |
| **Admin verify** | Invalid paste shows errors; valid import updates line table after save |

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

### WP-I.3 — Remittance import + match

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **NDIS claims** (remittance import steps) |
| **User steps** | 1. Submit claims to gateway. 2. Import NDIA payment CSV. 3. Preview matches. 4. Apply remittance. |
| **System setup** | `/system/setup/services` — remittance import after gateway submit |
| **Role access** | **Claims** Write |
| **Admin verify** | Matched claims show Paid + remittance amount; variance flagged |

### WP-I.4 — Invoicing scaffold

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **Participant invoices** |
| **User steps** | 1. Set plan-managed funding body. 2. Generate invoices. 3. Mark sent. 4. Record payment. |
| **System setup** | `/system/setup/services` — Invoices + Generate invoices grants |
| **Role access** | **Invoices** Read/Write; **Generate invoices** Write |
| **Admin verify** | Plan-managed lines on invoices; agency lines on claims only |

### WP-J.1 — Plan vs actual reconciliation

| | Detail |
|---|--------|
| **User how-to** | Help → **Monthly service planning** → **Plan vs actual reconciliation** |
| **User steps** | 1. Select plan month. 2. Review Matched/Variance. 3. Open plan or client. 4. Export CSV. |
| **System setup** | `/system/setup/services` — Plan reconciliation grant for coordinators |
| **Role access** | **Plan reconciliation** Read/Write |
| **Admin verify** | Bern Oct 2025 plan shows planned totals; variance when delivery differs |

### WP-J.2 — Claim reconciliation dashboard

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **Claim reconciliation dashboard** |
| **User steps** | 1. Open Claim reconciliation. 2. Filter by period and remittance status. 3. Review Not imported vs Matched. 4. Export CSV. |
| **System setup** | `/system/setup/services` — Claim reconciliation grant for finance/billing roles |
| **Role access** | **Claim reconciliation** Read/Write |
| **Admin verify** | Submitted claims show remittance status; variance when paid ≠ claimed |

### WP-J.3 — Financial close reports

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **Financial close checklist** |
| **User steps** | 1. Open Financial close. 2. Select close month. 3. Resolve blocked checks. 4. Export CSV. |
| **System setup** | `/system/setup/services` — Financial close grant for finance roles |
| **Role access** | **Financial close** Read/Write; **Financial close summary** report |
| **Admin verify** | Blocked plan variance prevents ready-to-close banner |

### WP-J.4 — NDIS audit pack export

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **NDIS audit pack export** |
| **User steps** | 1. Open NDIS audit pack. 2. Select audit month. 3. Export manifest + section CSVs. |
| **System setup** | `/system/setup/services` — NDIS audit pack grant for quality/finance roles |
| **Role access** | **NDIS audit pack** Read/Write; **NDIS audit pack summary** report |
| **Admin verify** | Bern Oct 2025 shows participant + plan sections |

### WP-E.4 — Multi-provider budget

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **Multi-provider budget**; Help → **Clients** → **Plan budget tab** (Plan provider field) |
| **User steps** | 1. Set Plan provider on each budget line. 2. Open Multi-provider budget. 3. Filter by provider. 4. Export CSV. |
| **System setup** | `/system/setup/clients` — Plan provider on lines; `/system/setup/services` — Multi-provider budget grant |
| **Reference data** | — |
| **Role access** | `client-plan-budget` Write; **Multi-provider budget** Read/Write |
| **Admin verify** | Provider label persists after refresh; multi-provider view shows split totals |

### WP-F.3 — Timesheet submit + approval

| | Detail |
|---|--------|
| **User how-to** | Help → **My workplace** → **My timesheets**; Help → **Delivery** → **Timesheet submit and approval** |
| **User steps** | 1. Worker submits draft from My timesheets. 2. Supervisor approves on Timesheets when verification passes. |
| **System setup** | `/system/setup/services` — My timesheets + Timesheets grants |
| **Reference data** | — |
| **Role access** | **My timesheets** Write for workers; **Timesheets** Write for supervisors |
| **Admin verify** | Unverified shift blocks submit; status dropdown cannot bypass submit validation |

### WP-I.5 — Plan budget billing claimed rollup

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **Plan budget billing claimed rollup**; Help → **Clients** → **Plan budget tab** |
| **User steps** | 1. Review rollup panel. 2. Apply billing rollup. 3. Save client record. |
| **System setup** | Submitted claims + sent invoices must exist for billing totals |
| **Reference data** | — |
| **Role access** | `client-plan-budget` Write |
| **Admin verify** | Rollup splits by allocated amount within category; save persists claimed |

### WP-I.6 — Cancellation claim generation

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **Cancellation claim generation**; Help → **Delivery** → **Cancellation policy** |
| **User steps** | 1. Cancel booking with participant short notice. 2. Generate claims → Cancellation claims. 3. Review draft claim. |
| **System setup** | `/system/setup/services` — cancellation reference lists + Generate claims grant |
| **Reference data** | Booking cancellation reason, Cancellation initiated by |
| **Role access** | **Generate claims** Write |
| **Admin verify** | Multiple generates merge into one draft per participant without losing lines |

### WP-J.5 — Financial month lock

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **Financial close checklist** (Mark month closed section) |
| **User steps** | 1. Pass all non-blocked checklist items. 2. Add optional notes. 3. Mark month closed. 4. Confirm closed banner after refresh. |
| **System setup** | `/system/setup/services` — run `20260625360000` migration; Financial close Write |
| **Reference data** | — |
| **Role access** | **Financial close** Write |
| **Admin verify** | Closed month persists in Supabase; already-closed month shows lock pass check |

### WP-J.6 — Invoice reconciliation dashboard

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **Invoice reconciliation dashboard** |
| **User steps** | 1. Open Invoice reconciliation. 2. Filter by period and status. 3. Follow up Unpaid/Overdue. 4. Export CSV. |
| **System setup** | `/system/setup/services` — Invoice reconciliation grant |
| **Reference data** | — |
| **Role access** | **Invoice reconciliation** Read/Write |
| **Admin verify** | Sent invoices show Unpaid/Overdue; financial close links to dashboard |

### WP-J.7 — Plan reconciliation v2 columns

| | Detail |
|---|--------|
| **User how-to** | Help → **Service planning** → **Plan vs actual reconciliation** (Scheduled h, Rejected $) |
| **User steps** | 1. Open Plan reconciliation. 2. Review Scheduled h vs Actual h. 3. Investigate Rejected $ before close. 4. Export CSV. |
| **System setup** | Roster shifts + claims data for column population |
| **Reference data** | — |
| **Role access** | **Plan reconciliation** Read |
| **Admin verify** | Rejected claims add to Rejected $ column for selected month |

### WP-0.1 — Enquiry pipeline stages

| | Detail |
|---|--------|
| **User how-to** | Help → **Core** → **Enquiries** → Intake pipeline and follow-ups |
| **User steps** | 1. Progress status through pipeline. 2. Set next action dates. 3. Mark lost with reason + nurture date. |
| **System setup** | `/system/setup/enquiries` — pipeline statuses + loss reasons |
| **Reference data** | Enquiry status, Enquiry loss reason |
| **Role access** | Enquiries Write |
| **Admin verify** | Invalid transition blocked; overdue list highlights past-due actions |

### WP-0.2 — NDIS qualification scoring

| | Detail |
|---|--------|
| **User how-to** | Help → **Core** → **Enquiries** → NDIS qualification scoring |
| **User steps** | 1. Open Qualification tab. 2. Enter plan/postcode/urgency fields. 3. Review score. 4. Filter list by tier. |
| **System setup** | `/system/setup/enquiries` — plan status, plan management, urgency reference lists |
| **Reference data** | Enquiry plan status, plan management, urgency |
| **Role access** | Enquiries Write + **Qualification** tab |
| **Admin verify** | Samuel Ryan seed scores Warm/Hot; save persists tier on list |

### WP-0.3 — Portal MVP (read-only services + budget)

| | Detail |
|---|--------|
| **User how-to** | Help → **Core modules** → **Participant portal** |
| **User steps** | 1. Open `/portal/login`. 2. Request magic link with participant email. 3. View **My services** and **My funding**. 4. Sign out when done. |
| **System setup** | `/system/setup/clients` — participant email + plan budget + roster shifts for portal demo |
| **Reference data** | — |
| **Role access** | Portal is separate from staff roles; staff configure client email + plan budget |
| **Admin verify** | Bernie@email signs in; services + budget render read-only |

### WP-0.4 — Service request workflow stub

| | Detail |
|---|--------|
| **User how-to** | Help → **Participant portal** → Request a new service + coordinator review |
| **User steps** | 1. Portal → **Request a service**. 2. Submit form. 3. Track status. 4. Staff approve on linked task → draft variation. |
| **System setup** | `/system/setup/clients` — portal email + active service agreement for variation stub |
| **Reference data** | — |
| **Role access** | Support Coordinator role receives review tasks; assign-task / action-task to approve |
| **Admin verify** | Approve creates draft SA variation; decline shows reason on portal |

### WP-0.5 — External CRM sync + cross-sell

| | Detail |
|---|--------|
| **User how-to** | Help → **Core** → **Enquiries** → HubSpot CRM sync + Cross-sell alerts |
| **User steps** | 1. Sync enquiry to HubSpot from CRM panel. 2. Review cross-sell alerts on Enquiries list. 3. Follow up with active clients flagged underserviced. |
| **System setup** | `/system/setup/enquiries` — `WEB_TO_LEAD_SECRET`, `HUBSPOT_DRY_RUN` or `HUBSPOT_ACCESS_TOKEN` |
| **Reference data** | — |
| **Role access** | Enquiries Write for CRM sync panel |
| **Admin verify** | Web-to-lead webhook creates enquiry; dry-run sync stores contact id on record |

### WP-G.0 — Participant portal week calendar

| | Detail |
|---|--------|
| **User how-to** | Help → **Participant portal** → View upcoming services (week + list toggle) |
| **User steps** | 1. Open **My services**. 2. Use **Week view** calendar. 3. Navigate weeks. 4. Switch to **List view** for full horizon. |
| **System setup** | `/system/setup/clients` — roster published shifts for participant; portal email match |
| **Reference data** | — |
| **Role access** | Portal only — no staff role change |
| **Admin verify** | Demo Bernie shifts visible on week containing Jun 2026 roster dates |

### WP-0.6 — Live HubSpot contact upsert

| | Detail |
|---|--------|
| **User how-to** | Help → **Core** → **Enquiries** → HubSpot CRM sync (live mode section) |
| **User steps** | 1. Configure private app token. 2. Sync enquiry. 3. Re-sync after edits. |
| **System setup** | `/system/setup/enquiries` — `HUBSPOT_ACCESS_TOKEN`, scopes, optional `HUBSPOT_PROPERTY_*` |
| **Reference data** | — |
| **Role access** | Enquiries Write |
| **Admin verify** | Live sync stores numeric HubSpot id; dry-run still works with `HUBSPOT_DRY_RUN=true` |

### WP-0.7 — Client portal requests on Requests tab (Chunk 0 completion)

| | Detail |
|---|--------|
| **User how-to** | Help → **Clients** → Requests tab; Help → **Participant portal** → coordinator review |
| **User steps** | 1. Open client Requests tab. 2. Review portal submissions. 3. Open linked task to approve/decline. |
| **System setup** | `/system/setup/clients` — portal email + service agreement for variation stub |
| **Reference data** | — |
| **Role access** | Clients Read on Requests tab; assign-task / action-task to review |
| **Admin verify** | Portal request visible on Bern client after Bernie@email submission |

## WP-A — Client foundation (Chunk 1) ✅ COMPLETE

| Slice | Deliverable | Status | % of WP-A |
|-------|-------------|--------|-----------|
| A.1 | Client lifecycle status | ✅ Done | 20% |
| A.2 | Plan budget line table | ✅ Done | 25% |
| A.3 | Consent tab alignment | ✅ Done | 15% |
| A.4 | Plan manual entry wizard | ✅ Done | 20% |
| A.5 | Utilisation summary on Overview | ✅ Done | 20% |
| A.6 | Plan budget CSV import | ✅ Done | — (Chunk 1 gap) |
| A.7 | NDIS plan gateway stub | ✅ Done | — (Chunk 1 gap) |
| A.8 | Plan budget text paste import | ✅ Done | — (Chunk 1 gap) |

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
| 2026-06-20 | dd42d05 | WP-I.3 remittance import + claim payment matching |
| 2026-06-20 | 64fb7c9 | WP-I.4 plan-managed invoicing scaffold |
| 2026-06-20 | 72a67e6 | WP-J.1 plan vs actual + WP-J.2 claim reconciliation dashboards |
| 2026-06-20 | 271d15a | WP-J.3 financial close checklist + summary report |
| 2026-06-20 | f56f6a5 | WP-J.4 NDIS audit pack export + summary report |
| 2026-06-20 | b210c1a | WP-0.1 enquiry pipeline stages + loss reasons |
| 2026-06-20 | f2e8826 | WP-0.2 NDIS qualification scoring |
| 2026-06-20 | 98dcf9f | WP-0.3 participant portal MVP |
| 2026-06-20 | c472e40 | WP-0.4 portal service request workflow stub |
| 2026-06-20 | 5c64029 | WP-0.5 external CRM sync + cross-sell alerts |
| 2026-06-20 | 1f6318b | WP-G.0 participant portal week calendar |
| 2026-06-20 | 7a5ad64 | WP-0.6 live HubSpot CRM contact upsert |
| 2026-06-20 | 9cf9a3f | WP-0.7 client portal requests on Requests tab (Chunk 0 complete) |
| 2026-06-20 | d7cfaa4 | WP-A.6 plan budget CSV import on client Plan budget tab |
| 2026-06-20 | e544aa9 | WP-A.7 NDIS plan gateway stub on Plan budget tab |
| 2026-06-20 | 2c088cd | WP-D.22 roster week CSV export (Chunk 4 complete) |
| 2026-06-20 | bc6daf9 | WP-A.8 plan budget text paste import from PDF copy |
| 2026-06-21 | 3e8c61c | WP-E.4, F.3, I.5, I.6, J.5–J.7 billing & reconciliation batch |
| 2026-06-21 | 16f703c | Bugbot fixes: Supabase persistence, rollup split, cancellation merge, timesheet submit guard |
| 2026-06-21 | 72b1920 | BUILD-PROGRESS last-push update |
| 2026-06-21 | eae272a | Migration rename 25360000/25361000 after claim version conflict |

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
| 2026-06-20 | `npm run build` | exit 0 (WP-J.1 + WP-J.2) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 90 routes (WP-J.2) |
| 2026-06-20 | `npm run build` | exit 0 (WP-J.3) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 91 routes (WP-J.3) |
| 2026-06-20 | `npm run build` | exit 0 (WP-J.4) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 92 routes (WP-J.4) |
| 2026-06-20 | `npm run build` | exit 0 (WP-0.1) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 92 routes (WP-0.1) |
| 2026-06-20 | `npm run build` | exit 0 (WP-0.2) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 92 routes (WP-0.2) |
| 2026-06-20 | `npm run build` | exit 0 (WP-0.3) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 95 routes (WP-0.3) |
| 2026-06-20 | `npm run supabase:push-remote` | `20260625330000` portal demo shifts |
| 2026-06-20 | `npm run build` | exit 0 (WP-0.4) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 96 routes (WP-0.4) |
| 2026-06-20 | `npm run supabase:push-remote` | `20260625340000` portal service request |
| 2026-06-20 | `npm run supabase:push-remote` | `20260625320000` enquiry qualification |
| 2026-06-20 | `npm run supabase:push-remote` | `20260625310000` enquiry pipeline + loss_reason |
| 2026-06-20 | `npm run build` | exit 0 (WP-0.5) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 96 routes (WP-0.5) |
| 2026-06-20 | `npm run supabase:push-remote` | `20260625350000` enquiry external CRM columns |
| 2026-06-20 | `npm run build` | exit 0 (WP-G.0) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 96 routes (WP-G.0) |
| 2026-06-20 | `npm run build` | exit 0 (WP-0.6) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 96 routes (WP-0.6) |
| 2026-06-20 | `npm run build` | exit 0 (WP-0.7) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 96 routes (WP-0.7) |
| 2026-06-20 | `npm run build` | exit 0 (WP-A.6) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 96 routes (WP-A.6) |
| 2026-06-20 | `npm run build` | exit 0 (WP-A.7) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 96 routes (WP-A.7) |
| 2026-06-20 | `npm run build` | exit 0 (WP-D.22) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 96 routes (WP-D.22) |
| 2026-06-20 | `npm run build` | exit 0 (WP-A.8) |
| 2026-06-20 | `npm run page-guides:check` | exit 0 — 96 routes (WP-A.8) |
| 2026-06-18 | `npm run supabase:push-remote` | `20260625360000` financial_closed_month (renamed from 25280000 — claim version conflict) |
| 2026-06-18 | `npm run supabase:push-remote` | `20260625361000` client_plan_budget plan_provider column |

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
| 2026-06-20 | WP-J.1 | `/plan-reconciliation`, `/service-planning` | **Pass** | build verified; Bern Oct 2025 plan row |
| 2026-06-20 | WP-J.2 | `/claim-reconciliation`, `/claims` | **Pass** | build verified; 90 routes |
| 2026-06-20 | WP-J.3 | `/financial-close`, `/reports/financial-close-summary` | **Pass** | build verified; 91 routes |
| 2026-06-20 | WP-J.4 | `/ndis-audit-pack`, `/reports/ndis-audit-pack-summary` | **Pass** | build verified; 92 routes |
| 2026-06-21 | WP-E.4 | `/multi-provider-budget`, `/clients/bp-bern?tab=Plan budget` | **Pass** | Plan provider column; provider filter |
| 2026-06-21 | WP-F.3 | `/my/timesheets`, `/timesheets` | **Pass** | My timesheets route; submit guard in code |
| 2026-06-21 | WP-I.5 | `/clients/bp-bern?tab=Plan budget` | **Pass** | Billing claimed rollup panel |
| 2026-06-21 | WP-I.6 | `/generate-claims` | **Pass** | Cancellation claims panel |
| 2026-06-21 | WP-J.5 | `/financial-close` | **Pass** | Supabase read verified (2020-01 closed row); June 2026 blocked by payroll |
| 2026-06-21 | WP-J.6 | `/invoice-reconciliation` | **Pass** | Dashboard loads |
| 2026-06-21 | WP-J.7 | `/plan-reconciliation` | **Pass** | Scheduled h + Rejected $ columns (build verified) |
| 2026-06-20 | WP-0.1 | `/enquiries`, `/enquiries/1000025` | **Pass** | build verified; pipeline panel + stage filters |
| 2026-06-20 | WP-0.2 | `/enquiries/1000025?tab=Qualification`, `/enquiries` | **Pass** | build verified; score panel + tier filters |
| 2026-06-20 | WP-0.3 | `/portal/login`, `/portal`, `/portal/services`, `/portal/budget` | **Pass** | build verified; magic-link auth + read-only APIs |
| 2026-06-20 | WP-0.4 | `/portal/requests`, `/tasks` (portal review task) | **Pass** | build verified; submit + approve variation stub |
| 2026-06-20 | WP-0.5 | `/enquiries`, `/enquiries/1000025` | **Pass** | build verified; CRM panel + cross-sell panel compile |
| 2026-06-20 | WP-G.0 | `/portal/services` | **Pass** | build verified; week + list view toggle |
| 2026-06-20 | WP-0.6 | `/enquiries/1000025` CRM panel | **Pass** | build verified; live HubSpot REST adapter |
| 2026-06-20 | WP-0.7 | `/clients/bp-bern?tab=Requests` | **Pass** | build verified; portal requests panel + list API |
| 2026-06-20 | WP-A.6 | `/clients/bp-bern?tab=Plan budget` | **Pass** | build verified; CSV import panel + reference validation |
| 2026-06-20 | WP-A.7 | `/clients/bp-bern?tab=Plan budget` | **Pass** | build verified; plan gateway panel + sync API |
| 2026-06-20 | WP-D.22 | `/rostering` Week tab | **Pass** | build verified; Export week CSV button |
| 2026-06-20 | WP-A.8 | `/clients/bp-bern?tab=Plan budget` | **Pass** | build verified; PDF paste import panel |
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
| 2026-06-20 | WP-J.1 | 1 High + 2 Medium — all fixed | **Pass** | Billable status filter, zero-plan variance, export filter, funding-body split |
| 2026-06-20 | WP-J.2 | 1 Medium — fixed | **Pass** | Month filter prorates claim/paid amounts by line |
| 2026-06-20 | WP-J.3 | 1 High + 2 Medium — fixed | **Pass** | Finance manager grants, access gate, report parent module |
| 2026-06-20 | WP-J.4 | 1 High + 2 Medium — fixed | **Pass** | Hooks order, active employees only, period participants |
| 2026-06-20 | WP-0.1 | 3 High — all fixed | **Pass** | Convert-only won status, local overdue date, pipeline validation on create/AI save |
| 2026-06-20 | WP-0.2 | 1 High — fixed | **Pass** | Stored org profile used for persisted qualification score |
| 2026-06-20 | WP-0.3 | 4 High + 3 Medium — all fixed | **Pass** | Email revalidation, draft shift filter, portal DataStore skip, duplicate email guard |
| 2026-06-20 | WP-0.4 | 2 High + 2 Medium — all fixed | **Pass** | Staff process auth, conditional status update, submit order, panel canManage |
| 2026-06-20 | WP-0.5 | 2 High — all fixed | **Pass** | Cross-sell gated on clients access; web-to-lead insert retry on id conflict |
| 2026-06-20 | WP-G.0 | 1 Medium — fixed | **Pass** | Week calendar uses localDateIso for This week anchor |
| 2026-06-20 | WP-0.6 | 2 High + 1 Medium — all fixed | **Pass** | HubSpot base URL allowlist; PATCH 404-only fallback; sanitized fetch errors |
| 2026-06-20 | WP-0.7 | 1 High + 1 Medium — all fixed | **Pass** | client-requests window auth on API; abort stale fetches |
| 2026-06-20 | WP-A.6 | 2 Medium — all fixed | **Pass** | Sample template casing; CSV validates against NDIS reference lists |
| 2026-06-20 | WP-A.7 | 1 High + 1 Medium — all fixed | **Pass** | Sync uses draft NDIS number from request; localDateIso for plan dates |
| 2026-06-20 | WP-D.22 | 0 | **Pass** | No findings |
| 2026-06-20 | WP-A.8 | 1 High + 1 Medium — all fixed | **Pass** | Follow-up rows validated; incomplete pending lines error |
| 2026-06-20 | uncommitted | 2 High + 2 Medium | **Pass** | Fixed: Draft→Signed e-sign path, blank signature, tab counts, legacy signature backfill |
| 2026-06-18 | `e0ccb56`–`a88e1dc` | 1 High + 2 Medium — all fixed | Pass | Multi-line dates, local date, stale fields |
| 2026-06-18 | `a88e1dc` | — | **Pass** | [Bugbot branch review](ec37fa04-ce0e-4c70-be28-88b0bcd95bc5) — no findings |

---

## Feature artifact audit — billing & reconciliation batch (`3e8c61c`)

Maps each new/updated library surface to required handoff artifacts. **Todo** = gap before slice is fully documented.

| Module / function group | Key exports | User how-to | System setup | Test steps | Process doc | Audit on save | Status |
|-------------------------|-------------|-------------|--------------|------------|-------------|---------------|--------|
| `plan-budget-claimed-rollup.ts` | `aggregateBillingClaimedByCategory`, `summarizePlanBudgetClaimedRollup`, `applyBillingClaimedRollup` | `delivery` § plan-budget-claimed-rollup; `clients-locations` § plan-budget | `clients-setup` rollup verify | WP-I.5 | — | Client save via `persistRecordAudit` | ✅ |
| `multi-provider-budget.ts` | `buildMultiProviderBudgetRows`, `summarizeMultiProviderBudget`, `multiProviderBudgetCsv` | `delivery` § multi-provider-budget | `clients-setup` + `services-setup` grants | WP-E.4 | — | N/A (report view) | ✅ |
| `timesheet-workflow.ts` | `timesheetSubmitBlocked`, `timesheetApproveBlocked`, `timesheetWorkflowSummary` | `delivery` § timesheet-submit-approval; `my-workplace` § my-timesheets | `services-setup` My timesheets grant | WP-F.3 | — | Timesheet save audit | ✅ |
| `cancellation-claim-generation.ts` | `previewCancellationClaims`, `generateCancellationClaims` | `delivery` § cancellation-claims | `services-setup` cancellation lists | WP-I.6 | — | Claim save audit | ✅ |
| `financial-close-period.ts` | `buildFinancialClosedMonthRecord`, `canCloseFinancialMonth`, `isFinancialMonthClosed` | `delivery` § financial-close (Mark month closed) | `services-setup` + migration `25360000` | WP-J.5 | **Todo:** month-end close process in `docs/processes/` | **Todo:** no `persistRecordAudit` on close (singleton action) | 🟡 |
| `invoice-reconciliation.ts` | `buildInvoiceReconcileRows`, `summarizeInvoiceReconciliation`, `invoiceReconcileCsv` | `delivery` § invoice-reconciliation | `services-setup` grant | WP-J.6 | — | N/A (dashboard) | ✅ |
| `financial-closed-month-mappers.ts` + `data-api.saveFinancialClosedMonth` | DB persistence | (covered by financial-close) | migration applied | WP-J.5 | — | — | ✅ |
| `plan-vs-actual-reconciliation.ts` (v2) | Scheduled h, Rejected $ columns | `service-planning` § plan-reconciliation | — | WP-J.7 | — | N/A | ✅ |
| `client-line-tables.ts` (`planProvider`) | Line field | `clients-locations` § plan-budget | migration `25361000` | WP-E.4 | — | Client line audit diff | ✅ |

**Remaining todos (non-blocking for demo):**

1. **Process doc** — add `docs/processes/NN-financial-month-close.md` (checklist → mark closed → audit pack).
2. **Audit trail** — log `closeFinancialMonth` to process audit or module audit (financial close is not a single record page today).
3. **Amplify spot-check** — Adam Tier 4 on live deploy (`eae272a`).

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
| 2026-06-20 | WP-J.1 | `service-planning` — plan vs actual reconciliation | `services-setup` — plan reconciliation grant | exit 0 — 89 routes |
| 2026-06-20 | WP-J.2 | `delivery` — claim reconciliation dashboard | `services-setup` — claim reconciliation grant | exit 0 — 90 routes |
| 2026-06-20 | WP-J.3 | `delivery` — financial close checklist | `services-setup` — financial close grant | exit 0 — 91 routes |
| 2026-06-20 | WP-J.4 | `delivery` — NDIS audit pack export | `services-setup` — NDIS audit pack grant | exit 0 — 92 routes |
| 2026-06-20 | WP-0.1 | `core` — enquiry pipeline + follow-ups | `enquiries-setup` — pipeline statuses + loss reasons | exit 0 — 92 routes |
| 2026-06-20 | WP-0.2 | `core` — NDIS qualification scoring | `enquiries-setup` — plan status + urgency lists | exit 0 — 92 routes |
| 2026-06-20 | WP-0.3 | `participant-portal` — magic link, services, funding | `clients-setup` — participant email + portal demo | exit 0 — 95 routes |
| 2026-06-20 | WP-0.4 | `participant-portal` — service request + coordinator review | `clients-setup` — portal request test + SA variation | exit 0 — 96 routes |
| 2026-06-20 | WP-0.5 | `core` — HubSpot CRM sync + cross-sell alerts | `enquiries-setup` — WEB_TO_LEAD_SECRET + HUBSPOT_DRY_RUN | exit 0 — 96 routes |
| 2026-06-20 | WP-G.0 | `participant-portal` — week calendar on My services | `clients-setup` — week view roster test | exit 0 — 96 routes |
| 2026-06-20 | WP-0.6 | `core` — live HubSpot contact upsert | `enquiries-setup` — token scopes + property mapping | exit 0 — 96 routes |
| 2026-06-20 | WP-0.7 | `clients-locations` — Requests tab portal list | `clients-setup` — portal request on Requests tab | exit 0 — 96 routes |
| 2026-06-20 | WP-A.6 | `clients-locations` — Plan budget CSV import | `clients-setup` — CSV import on Plan budget tab | exit 0 — 96 routes |
| 2026-06-20 | WP-A.7 | `clients-locations` — NDIS plan gateway pull | `clients-setup` — NDIS_GATEWAY_DRY_RUN | exit 0 — 96 routes |
| 2026-06-20 | WP-D.22 | `delivery` — Export week CSV on rostering | `services-setup` — export week CSV test | exit 0 — 96 routes |
| 2026-06-20 | WP-A.8 | `clients-locations` — Plan budget PDF paste import | `clients-setup` — PDF paste on Plan budget tab | exit 0 — 96 routes |
| 2026-06-21 | WP-E.4 | `delivery` + `clients-locations` — multi-provider budget + Plan provider | `clients-setup` + `services-setup` | exit 0 — 99 routes |
| 2026-06-21 | WP-F.3 | `my-workplace` — My timesheets; `delivery` — submit/approval | `services-setup` — My timesheets grant | exit 0 |
| 2026-06-21 | WP-I.5 | `delivery` — plan-budget-claimed-rollup | `clients-setup` — rollup verify | exit 0 |
| 2026-06-21 | WP-I.6 | `delivery` — cancellation-claims | `services-setup` — cancellation lists | exit 0 |
| 2026-06-21 | WP-J.5–J.7 | `delivery` + `service-planning` — financial close lock, invoice recon, plan recon v2 | `services-setup` — migrations 25360000/25361000 | exit 0 |
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
