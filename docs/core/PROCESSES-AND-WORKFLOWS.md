# AbilityVua — processes and workflows reference

**Audience:** Reviewers, BAs, developers, and access admins who need to know what happens when a user runs an action — not just where the button is.  
**Pair with:** [SYSTEM-FUNCTION-GUIDE.md](./SYSTEM-FUNCTION-GUIDE.md) (outcomes), [WINDOWS-AND-TABS.md](./WINDOWS-AND-TABS.md) (routes), [ENTITY-AND-DATA-MODEL.md](./ENTITY-AND-DATA-MODEL.md) (record links), [ROLES-AND-ACCESS.md](./ROLES-AND-ACCESS.md) (who can run).  
**Version:** 1.1  
**Last updated:** 23 June 2026 (portal flows, Amplify PDF)

---

## 1. How processes work

| Concept | Meaning |
|---------|---------|
| **Process** | A grantable action (`process_id` in `app_role_process`). User needs **Write** on the parent window/tab **and** the process grant. |
| **Numbered process** | Documented in `docs/processes/` with `processes.json` entry — convert, approve, assign. |
| **Document process** | Print, PDF, batch, or Send via Email — saves to document registry + process audit. |
| **Save workflow** | Validation on save (lifecycle, compliance) — not a separate process grant. |

**Code source of truth:** `web/src/lib/access/catalog.ts` (`ACCESS_PROCESSES`), `docs/processes/processes.json`, `web/src/lib/document-print-audit.ts`.

**Internal comms:** Workforce handoffs use **tasks**, not email (`docs/MY-WORKPLACE-DEV-NOTES.md`).

---

## 2. Enquiries and intake

**Aligns with:** SYSTEM-FUNCTION-GUIDE §4

| Process ID | Trigger | Preconditions | Steps / side effects | Outcome |
|------------|---------|---------------|----------------------|---------|
| `enquiry-to-client` | **Convert to client** on enquiry | Write on enquiries; process granted; enquiry not already converted | Creates client from enquiry fields; links `enquiryId`; sets enquiry status **Converted**; copies activity | New client record; enquiry closed in pipeline |
| `print-enquiry-acknowledgement` | **Print** / **PDF** on enquiry Documents | Process + write on enquiry tab | Renders template → print or PDF API → `registerDocumentWithAudit` | HTML/PDF in document registry |
| `ai-prepare-record` | AI assistant prepares draft | Write on target module | Draft fields only — user must **Save** | No persist until human save |

**Web-to-lead:** `POST /api/public/web-to-lead` creates enquiry (system); no process grant on public caller.

**HubSpot sync:** Optional panel push when configured — Partial (needs API token).

**Deep doc:** [docs/processes/01-enquiry-to-client.md](../processes/01-enquiry-to-client.md)

---

## 3. Clients and participants

**Aligns with:** SYSTEM-FUNCTION-GUIDE §5

| Process ID | Trigger | Preconditions | Side effects | Outcome |
|------------|---------|---------------|--------------|---------|
| `print-support-plan` | Print / PDF on Support Plan tab | Write on `client-support-plan` | Template render → registry | Plan document on file |
| `send-support-plan` | **Send via Email** on Support Plan tab | Same + process | API generates PDF → registry → device email handoff | Plan saved; email draft with PDF |
| `print-participant-statement` | Print statement on Overview | Write on `client-overview` | Period filter → registry | Statement on file |
| `print-consent-schedule` | Print consent on Overview | Write on `client-overview` | Consent lines → registry | Consent schedule on file |
| `assign-task` | Assign task on Requests tab | Write on `client-requests` | Creates `app_task` linked to client | Task in assignee queue |

**Participant portal (no workspace process grants):**

| Flow | Trigger | Preconditions | Side effects | Outcome |
|------|---------|---------------|--------------|---------|
| Magic-link sign-in | `/portal/login` → email | `client.email` matches | Cookie session 7 days; demo link when `PORTAL_DEMO_EXPOSE_LINK=true` | Participant hub |
| Service request | `/portal/requests` → Submit | Valid portal session | `portal_service_request` row; coordinator task on client **Requests** | Request **Submitted** |
| Coordinator approve | Staff task / API | Write on client requests | May create draft agreement variation | Request **Approved** |

**Code:** `web/src/app/api/portal/*`, `web/src/lib/portal/service-request.server.ts`

**Save workflows (no separate process):**

| Action | Validation | Blocks save when |
|--------|------------|------------------|
| Lifecycle → **exit** | `client-lifecycle.ts` | — (coordinator judgment) |
| Plan budget lines | `normalizeClient` | Invalid category rows |
| Support plan sections | Line table rules | — |

---

## 4. Locations

**Aligns with:** SYSTEM-FUNCTION-GUIDE §6

| Process ID | Trigger | Side effects |
|------------|---------|--------------|
| `assign-location-client` | Edit Clients tab lines on location | `support_location_client` rows |
| `assign-location-employee` | Edit Employees tab lines | `support_location_employee` rows |
| `assign-location-product` | Edit Products & services tab | `support_location_product` rows |

**Deep docs:** [docs/processes/03–05](../processes/README.md)

---

## 5. Service agreements and bookings

**Aligns with:** SYSTEM-FUNCTION-GUIDE §§7–8

| Process ID | Trigger | Side effects |
|------------|---------|--------------|
| `print-service-agreement` | Print / PDF on agreement | Registry row; schedule of supports in HTML |
| `print-agreement-variation` | Print variation template | Registry row |

**Agreement lifecycle save** (`service-agreement-lifecycle.ts`):

| From → To (examples) | Rule |
|----------------------|------|
| Draft → Sent → Signed → Active | Valid transitions only; signature can fast-path Draft → Signed |
| Active → Expiring → Expired / Terminated | Expiry dates drive warnings |
| → Cancelled | Allowed from most non-terminal states |

**E-sign:** Capture signature on agreement → reflected on print; `-signed` registry variant.

**Booking save** (`booking-compliance.ts`):

| Check | Effect |
|-------|--------|
| Client lifecycle intake/exit | Warning or block |
| Agreement active / dates | Compliance messages |
| Plan budget line | Optional link validation |

---

## 6. Service planning and rostering

**Aligns with:** SYSTEM-FUNCTION-GUIDE §9

| Workflow | Trigger | Side effects |
|----------|---------|--------------|
| Publish roster week | Publish on `/rostering` | Shifts visible in **My shifts**; may create notify tasks |
| Qualification gate | Publish | Blocks if worker missing WWCC / NDIS screening (configurable) |
| Open shift request | Worker requests on `/my/open-shifts`; coordinator approves on Rostering → Open shifts or fill board | Assigns one worker; rejects other pending requests; critical fill flag — Live |
| Add buddy shift | **Add buddy shift** on staffed shift card | Creates linked shift with `shiftPurpose` buddy/orientation; inherits client/location/time |
| Cancel primary shift | Cancel on roster grid | Linked buddy shifts auto-cancelled |
| Schedule training/meeting | Workforce planning → Training and meetings | Creates one roster row per attendee with shared `trainingSessionGroupId`, cost allocation, and attendance status |
| Sign training attendance | Training and meetings attendance selector | Stamps attendance status, sign-off user/time, and marks attended rows Completed |

| Process ID | Trigger | Workflow |
|------------|---------|----------|
| `request-agency-coverage` | **Request agency** on Gaps tab | Creates `agency_shift_request` for vacant shift + vendor |
| `send-agency-shift-pack` | Send in agency drawer | Mailto shift pack; request status Sent; document audit |
| `confirm-agency-shift` | Confirm in agency drawer | Assigns agency worker on shift; orientation gate |
| `complete-agency-shift` | Complete in agency drawer | Closes request; shift status Completed |

**Deep doc:** [15-agency-staffing.md](../processes/15-agency-staffing.md)

**No numbered process doc** — other roster actions are window-write operations with server validation (`roster-shift-compliance.ts`).

---

## 7. My workplace and timesheets

**Aligns with:** SYSTEM-FUNCTION-GUIDE §§10–11

| Process ID | Trigger | Workflow |
|------------|---------|----------|
| `submit-leave-request` | Submit on `/my/leave` | Leave row → entitlement check → **task** to manager/HR → `approve-leave-request` closes loop |
| `submit-employee-credential` | Submit on `/my/credentials` | Credential row pending → task → `review-employee-credential` |
| `submit-leave-on-behalf` | Workforce planning form | Same as leave submit for chosen employee |
| `approve-leave-request` | Workforce review queue | Approve/decline → balance update → task complete |
| `review-employee-credential` | Workforce review queue | Approve/reject → HR file updated |
| `approve-timesheet` | Timesheet approval page | Submitted → Approved/Rejected; blocks if workflow rules fail |

| Workflow | Trigger | Side effects |
|----------|---------|--------------|
| Generate timesheets | `/generate-timesheets` | Creates timesheet rows from published shifts |
| Worker submit | `/my/timesheets` | Status → Submitted |
| Check-in / out | `/my/shifts` | Attendance on shift row |

**Deep docs:** [docs/processes/08–12](../processes/README.md)

---

## 8. Claims and invoices

**Aligns with:** SYSTEM-FUNCTION-GUIDE §§12–13

| Workflow | Trigger | Side effects |
|----------|---------|--------------|
| Generate claims | `/generate-claims` | Claim batch from **approved** timesheets; PAPL validation; may **lock** timesheets |
| Cancellation claims | Panel on generate claims | Claims from cancelled bookings |
| Gateway dry-run | Claim workflow | Stub PRODA path — no live submit |
| `print-claim-batch` | Print / PDF on claim detail | Registry cover + lines summary |

| Process ID | Trigger | Side effects |
|------------|---------|--------------|
| `print-invoice` | Print / PDF / HTML on invoice | Registry |
| `batch-print-invoices` | Batch on invoice list | ZIP of HTML/PDF per selected invoice |
| `send-invoice` | **Send via Email** | PDF + registry → marks invoice **Sent** → email handoff |

**Generate invoices:** Plan-managed participants from verified lines → invoice records linked to client and timesheet lines.

**Remittance:** `print-remittance-cover` on invoice reconciliation dashboard.

---

## 9. Reconciliation and financial close

**Aligns with:** SYSTEM-FUNCTION-GUIDE §14

| Process / workflow | Trigger | Side effects |
|------------------|---------|--------------|
| Reconciliation dashboards | Read-only views | Plan / claim / invoice variance rows |
| `print-audit-pack` | NDIS audit pack month | Registry report |
| `print-board-report` | Board reporting pack | Registry export |
| `financial-month-close` | Mark month closed | Checklist gates → `financial_closed_month` row — Partial UI |

**Deep doc:** [docs/processes/13-financial-month-close.md](../processes/13-financial-month-close.md)

---

## 10. Workforce — employees

**Aligns with:** SYSTEM-FUNCTION-GUIDE §15

| Process ID | Trigger | Side effects |
|------------|---------|--------------|
| `assign-employee-credential` | HR edits Credentials Assigned | Credential rows on employee |
| `print-employee-offer` | Generate offer | HR file line + registry |
| `print-employee-contract` | Generate contract | HR file line + registry |
| `print-employee-separation` | Generate separation | HR file line + registry |

**Employee exit** (Employment tab): checklist evaluates roster clearance, separation letter, end date — not a single process ID.

---

## 11. Incidents and safeguarding

**Aligns with:** SYSTEM-FUNCTION-GUIDE §16

| Process ID | Trigger | Side effects |
|------------|---------|--------------|
| `report-incident` | Create / submit incident | Incident record + parties |
| `notify-ndis-reportable` | Record Commission notification | `ndisNotifiedAt`; compliance queue |
| `print-incident-notification` | Print on incident Documents | Registry letter |

**NDIS deadline:** Computed from awareness time (`incident.ts`); compliance dashboard surfaces overdue.

---

## 12. Tasks

**Aligns with:** SYSTEM-FUNCTION-GUIDE §17

| Process ID | Trigger | Side effects |
|------------|---------|--------------|
| `assign-task` | Record tasks panel or hub | New `app_task` with entity link |
| `request-activity-deletion` | Request deletion on activity line | `app_task` type `tt-activity-delete` assigned to Admin role |
| `action-task` | Assignee opens task | Status In progress / Complete / Cancelled |

**Task automations:** System rules create tasks on leave submit, credential submit, roster publish, etc. (`/system/admin/task-automations`).

---

## 13. Documents — shared behaviour

All document processes follow the same pattern:

1. User clicks Print, PDF, HTML, Generate, or **Send via Email**
2. Server or client renders HTML from **document template**
3. `registerDocumentWithAudit` or PDF API saves to **document registry**
4. `auditDocumentProcess` logs who ran the process
5. Send via Email: `launchEmailWithPdfAttachment` — share sheet or download + mailto

**Server PDF (Amplify):** `POST /api/documents/render-pdf` uses Chromium on compute. Node heap via `package.json` `start` (`--max-old-space-size=768`) and `NODE_OPTIONS` in `amplify.yml`. First request after cold start may take 15–25s — see [AMPLIFY-PDF.md](../AMPLIFY-PDF.md).

**Email subject/body:** From System → Email content (`send-invoice`, `send-support-plan` templates).

---

## 14. Governance and audit processes

| Process ID | Purpose |
|------------|---------|
| `manage-session-audit-risk` | Investigate flagged login sessions |
| `manage-process-audit-risk` | Investigate flagged process executions |
| `manage-ai-query-audit-risk` | Investigate flagged AI queries |
| `view-session-sensitive-session-data` | See IP / device on session audit |
| `view-process-audit-sensitive` | Sensitive fields on process audit |
| `view-ai-query-audit-sensitive` | Full AI query text |
| `manage-retention-settings` | Record retention policies |

---

## 15. Process index by status

| Status | Meaning |
|--------|---------|
| **Live** | In `ACCESS_PROCESSES` + seed grants + (for numbered) `processes.json` |
| **Planned** | Documented only — e.g. full financial close automation extensions |

### Numbered processes (live)

| # | ID | Name |
|---|-----|------|
| 1 | `enquiry-to-client` | Enquiry → Client |
| 2 | `assign-employee-credential` | Assign employee credential |
| 3–5 | `assign-location-*` | Location assignments |
| 6–7 | `assign-task`, `action-task` | Tasks |
| 14 | `request-activity-deletion` | Activity deletion request → admin task |
| 8–12 | leave + credential workflows | My workplace + workforce planning |
| 13 | `financial-month-close` | Financial month close |

Full machine index: `docs/processes/processes.json`.

### Document / send processes (live)

See [WINDOWS-AND-TABS.md §16](./WINDOWS-AND-TABS.md) for the full list.

---

## 16. Maintenance checklist

Update this file when you:

- [ ] Add or change a process in `catalog.ts`
- [ ] Add numbered process doc or change workflow side effects
- [ ] Change save validation that blocks user workflow (compliance, lifecycle)
- [ ] Change Send via Email or registry behaviour
- [ ] Update `seed-access.sql` process grants

Also update [ROLES-AND-ACCESS.md](./ROLES-AND-ACCESS.md) if default role grants change.

---

## 17. Document control

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-06-23 | Initial processes and workflows reference |
