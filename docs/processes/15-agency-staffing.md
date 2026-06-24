# Process 15: Agency staffing coverage

| | |
|---|---|
| **IDs** | `request-agency-coverage`, `send-agency-shift-pack`, `confirm-agency-shift`, `complete-agency-shift` |
| **Status** | Live (WP-AG.1) |
| **Module** | People + Rostering |

## Purpose

Fill **vacant roster shifts** using workers employed by **staffing vendor** business partners. Agency workers are registered separately from internal employees and linked to who they work for. The workflow moves from gap identification → vendor request → shift pack email → confirm on roster (with site orientation check) → complete after delivery.

## Preconditions

| Check | Detail |
|-------|--------|
| Vendor | Business partner exists with email for shift packs |
| Agency worker | Active row in `agency_worker` with `vendor_bp_id` matching request |
| Vacant shift | `roster_shift` with no employee and not already agency-covered |
| Access | Window `agency-workers` (write) and relevant process grants |
| Orientation | `site_orientation` current for agency worker + location (or recent prior shift at site) |

## Triggers

| Process ID | Trigger |
|------------|---------|
| `request-agency-coverage` | **Request agency** on vacant shift in Rostering → Gaps |
| `send-agency-shift-pack` | **Send shift pack** in agency shift request drawer |
| `confirm-agency-shift` | **Confirm agency shift** after vendor agrees worker |
| `complete-agency-shift` | **Complete agency shift** after service delivered |

## Outcomes

| Step | `agency_shift_request` | `roster_shift` |
|------|------------------------|----------------|
| Request | New row; status Open; linked to shift + vendor | Unchanged (still vacant) |
| Propose worker | status Worker proposed; `agency_worker_id` set | Unchanged |
| Send pack | status Sent; `sent_at` | Unchanged |
| Confirm | status Confirmed; `confirmed_at` | `coverage_source=agency`, `agency_worker_id`, `vendor_bp_id`, `agency_request_id`; `employee_id` cleared |
| Complete | status Completed; `completed_at` | status Completed |

## Workflow steps

1. **Gap** — Coordinator opens Rostering → Gaps for the roster week; vacant shift listed.
2. **Request** — Select vendor, optional skills/notes; `requestAgencyCoverage()` creates or reopens request.
3. **Propose** — Pick registered agency worker from vendor pool; status Worker proposed.
4. **Send** — `buildAgencyShiftPack()` + mailto handoff; `sendAgencyShiftPack()` marks Sent; document audit via `send-agency-shift-pack`.
5. **Confirm** — `confirmAgencyShift()` validates vendor match, runs `checkSiteOrientation()`; on success updates shift for agency coverage.
6. **Complete** — `completeAgencyShift()` closes request and marks shift Completed.

## Rules and constraints

- One open agency request per roster shift (deduped in drawer).
- Proposed worker `vendor_bp_id` must match request vendor.
- Orientation error blocks confirm by default (`blockOnOrientation` true).
- Agency-covered shifts excluded from vacant gap analysis (`isVacantShift`).
- Agency workers do not receive My workplace publish tasks.

## Demo data

| Record | ID |
|--------|-----|
| Vendor StaffPlus | `bp-staffplus` |
| Jane Agency | `aw-sp-jane` |
| Mike Relief | `aw-sp-mike` |
| Vacant shift | `rs-bern-tue-vac` (week `2025-10-06`) |
| Site orientation | Jane at Glenelg SIL |

## Code locations

| Role | File |
|------|------|
| Workflow | `web/src/lib/agency-shift-workflow.ts` |
| Request entity | `web/src/lib/agency-shift-request.ts` |
| Worker entity | `web/src/lib/agency-worker.ts` |
| Orientation | `web/src/lib/site-orientation.ts` |
| UI drawer | `web/src/components/agency-shift-request-drawer.tsx` |
| Gaps entry | `web/src/components/roster-gaps-panel.tsx` |
| Process catalog | `web/src/lib/access/catalog.ts` |
| Migrations | `20260625600000_agency_staffing.sql`, `20260625610000_agency_staffing_access.sql` |
