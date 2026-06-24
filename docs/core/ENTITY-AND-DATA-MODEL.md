# AbilityVua — entity and data model reference

**Audience:** Reviewers, BAs, and developers who need to understand how records connect across the operational spine.  
**Pair with:** [SYSTEM-FUNCTION-GUIDE.md](./SYSTEM-FUNCTION-GUIDE.md) (functions), [PROCESSES-AND-WORKFLOWS.md](./PROCESSES-AND-WORKFLOWS.md) (actions), [WINDOWS-AND-TABS.md](./WINDOWS-AND-TABS.md) (where to view/edit).  
**Version:** 1.1  
**Last updated:** 23 June 2026 (agency staffing WP-AG.1, portal entities)

---

## 1. Spine overview

```
Enquiry ──convert──► Client ◄────────────────────────────────────┐
                       │                                         │
                       ├──► Service agreement ──► Service booking │
                       │         │                      │         │
                       │         └──► Roster of care      │         │
                       │                                ▼         │
                       ├──► Plan budget / Support plan    Roster shift
                       │                                │         │
                       │                                ▼         │
                       │                            Timesheet     │
                       │                                │         │
                       │                                ▼         │
                       ├──► Incident ◄── parties ── Claim ──► Invoice
                       │
                       └──► Task (entityType + entityId)

Employee ──► Roster shift / Timesheet / Leave / Credential
Agency worker ──► vendor business partner; Roster shift (agency coverage)
Location ◄── assignments ── Client, Employee, Product
Business partner ◄── associations ── Client; plan manager on billing; staffing vendor for agency workers
```

**Principle:** Every operational record should link to the correct **client**, **employee**, **location**, or upstream document ([BUILD-EXPECTATIONS.md](../BUILD-EXPECTATIONS.md) §14).

**Code source of truth:** `web/src/lib/supabase/mappers.ts`, `data-api.ts`, entity modules in `web/src/lib/*.ts`.

---

## 2. Core entities

| Entity | Table (typical) | Primary key | List route | Detail pattern |
|--------|-----------------|-------------|------------|----------------|
| Enquiry | `enquiry` | `id` | `/enquiries` | Tabbed record |
| Client | `client` | `id` | `/clients` | Tabbed record |
| Employee | `employee` | `id` | `/employees` | Tabbed record |
| Agency worker | `agency_worker` | `id` | `/agency-workers` | Single page register |
| Location | `support_location` | `id` | `/locations` | Tabbed record |
| Business partner | `business_partner` | `id` | `/business-partners` | Single page |
| Service agreement | `service_agreement` | `id` | `/service-agreements` | Overview + Lines |
| Service booking | `service_booking` | `id` | `/service-bookings` | Overview + Lines |
| Roster shift | `roster_shift` | `id` | `/rostering` | Week grid (not tabbed) |
| Timesheet | `timesheet` | `id` | `/timesheets` | Single page + lines |
| Claim | `claim` | `id` | `/claims` | Single page + lines |
| Invoice | `invoice` | `id` | `/invoices` | Single page + lines |
| Incident | `incident` | `id` | `/incidents` | Tabbed record |
| Task | `app_task` | `id` | `/tasks` | Hub + detail |
| Complaint | `complaint` | `id` | `/complaints` | Register |
| Product | `product` | `id` | `/products` | Overview + Pricing |
| Price list | `price_list` | `id` | `/price-lists` | Overview + Lines |

---

## 3. Enquiry → client

| Link | Field | Direction |
|------|-------|-----------|
| Enquiry → Client | `client.enquiryId` | One client per converted enquiry |
| Activity carry-forward | `client.activity` | Copied on convert |
| Alerts | `client.alerts` | May seed from enquiry |

**Convert:** `enquiry-to-client` process — see [PROCESSES-AND-WORKFLOWS.md §2](./PROCESSES-AND-WORKFLOWS.md).

---

## 4. Client record — child data (line tables)

Stored on client or child tables; loaded via `data-api` + mappers.

| Collection | Tab | Purpose |
|------------|-----|---------|
| `alerts` | Alerts | Header warnings |
| `activity` | Activity | Case notes |
| `locations` | Locations | Participant addresses |
| `bpAssociations` | BP Associations | Guardians, plan managers, referrers |
| `consents` | Consents and Legal Orders | NDIS core consents |
| `risks` | Risks | Risk register |
| `restrictivePractices` | Restrictive Practices | Authorised RP |
| `needsAndRules` | Support Receiver Needs and Rules | Worker instructions |
| `planBudgets` | Plan budget | NDIS allocations + claimed rollup |
| `contactActivity` | Contact Activity | Contact outreach log |

**Support plan** is a separate record (`support_plan`) keyed by `clientId` — not embedded in client JSON.

| Related record | Link | Tab |
|----------------|------|-----|
| Support plan | `supportPlan.clientId` | Support Plan, Goals, Progress Review |
| Service agreements | `serviceAgreement.clientId` | Service agreements (tab) + module list |
| Service bookings | `serviceBooking.clientId` | Service bookings (tab) + module list |
| Incidents | `incident.clientId` | Incidents tab + `/incidents` |
| Invoices | `invoice.clientId` | Billing / statements |
| Monthly service plan | `monthlyServicePlan.clientId` | Monthly service plan |
| Roster of care | `rosterOfCare.clientId` | Roster of care |

---

## 5. Service agreement and booking

| Record | Required links | Optional / derived |
|--------|----------------|-------------------|
| Service agreement | `clientId`, `priceListId` | Lines → `productId` |
| Service booking | `clientId` | `serviceAgreementId` when funded; `locationId` |

| Reverse UI | Path |
|------------|------|
| Client agreements | Client → Service agreements tab |
| Client bookings | Client → Service bookings tab |
| Agreement from list | `/service-agreements/{id}` |

**Compliance on save:** `booking-compliance.ts` — lifecycle, agreement status, dates.

**Agreement lifecycle states:** Draft → Sent → Signed → Active → Expiring → Expired / Terminated / Cancelled (`service-agreement-lifecycle.ts`).

---

## 6. Planning and rostering

| Record | Links | Notes |
|--------|-------|-------|
| Monthly service plan | `clientId` | Planned hours/spend by month |
| Roster of care | `clientId`, optional `serviceAgreementId` | Weekly template |
| Service planning instance | `clientId`, booking/plan refs | Demand board |
| Roster shift | `employeeId`, `clientId`, `locationId`, `serviceBookingId` (typical); agency: `coverageSource`, `agencyWorkerId`, `vendorBpId`, `agencyRequestId` | Week on `/rostering?week=` |
| Agency worker | `vendorBpId` → `business_partner` | `/agency-workers` register |
| Agency shift request | `rosterShiftId`, `vendorBpId`, optional `agencyWorkerId` | Drawer from Gaps; not standalone route |
| Agency timesheet | `vendorBpId`, `periodStart`/`periodEnd`, lines → `roster_shift_id` | `/agency-timesheets`; generate from Completed agency shifts |
| Site orientation | `workerType` (agency/employee), `workerId`, `locationId`, `orientedAt` | Location **Site orientation** tab; agency worker record; gate at confirm |

| Validation | Module |
|------------|--------|
| Double-book / conflicts | `roster-shift-compliance.ts` |
| Qualifications on publish | `roster-shift-qualification.ts` |
| Agency vacant gap exclusion | `roster-gap-analysis.ts` (`isVacantShift`) |
| Site orientation at confirm | `site-orientation.ts`, `agency-shift-workflow.ts` |
| Recurrence | `roster_shift` recurrence fields |

---

## 7. Timesheets

| Record | Links | Status flow (typical) |
|--------|-------|------------------------|
| Timesheet | `employeeId`, `clientId`, `locationId`, lines → booking/shift | Draft → Submitted → Approved / Rejected |

| Upstream | How created |
|----------|-------------|
| Roster shift | Generate timesheets from published shifts |
| Manual | Team lead entry (where permitted) |

| Downstream | Rule |
|------------|------|
| Claim generation | Uses **approved** timesheet lines |
| Lock | Timesheets may lock after claim batch generated |

---

## 8. Claims and invoices

| Record | Links | Notes |
|--------|-------|-------|
| Claim | `clientId` (batch may span clients), lines → timesheet lines | PAPL validation per line |
| Invoice | `clientId`, `planManagerPartnerId` / billing fields, lines → timesheet or manual | Plan-managed vs self-managed paths |

| Rollup | Target |
|--------|--------|
| Claimed amounts | `client.planBudgets` claimed columns (`plan-budget-claimed-rollup.ts`) |
| Reconciliation | Plan / claim / invoice dashboards compare periods |

**Business partner:** Plan manager on client billing tab → invoice recipient defaults.

---

## 9. Incidents, complaints, tasks

| Record | Links | Notes |
|--------|-------|-------|
| Incident | `clientId`, parties, evidence lines | NDIS reportable flags + deadlines |
| Complaint | Client/participant refs | Separate from incident register |
| Task | `entityType`, `entityId`, assignee user/role | Polymorphic — client, employee, etc. |

| Reverse UI | Path |
|------------|------|
| Client incidents | Client → Incidents tab |
| Client requests/tasks | Client → Requests tab |

---

## 10. Workforce — employee

| Collection / record | Tab | Notes |
|-------------------|-----|-------|
| Core employment | Employment | Position, dates, exit |
| `credentials` | Credentials Assigned | WWCC, NDIS screening, training |
| `documents` | Documents | HR file lines + generated docs |
| `activities` | Activity | HR notes |
| Leave requests | Leave / My leave | Linked to entitlements |
| Locations | Address tab | `employee-locations` window |

| Link to delivery | How |
|------------------|-----|
| Roster shift | `employeeId` on shift |
| Timesheet | `employeeId` on header |
| Location | Location → Employees assignment lines |

### Agency workers (not employees)

| Record | Fields | Notes |
|--------|--------|-------|
| `agency_worker` | `vendor_bp_id`, contact, qualifications, skills | Register at `/agency-workers`; vendor tab at `/business-partners/{id}?tab=Agency workers` |
| `agency_shift_request` | `roster_shift_id`, `vendor_bp_id`, `agency_worker_id` | Workflow from Gaps |
| `agency_timesheet` | `vendor_bp_id`, period | Lines link `roster_shift_id` + vendor cost |
| `agency_timesheet_line` | `agency_timesheet_id`, `roster_shift_id` | Hours + `vendor_hourly_rate` + `vendor_cost` |
| `site_orientation` | `worker_type`, `worker_id`, `location_id` | Checked at confirm |

| Link to delivery | How |
|------------------|-----|
| Roster shift (agency) | `coverageSource=agency`, `agencyWorkerId`, `vendorBpId`, `agencyRequestId`; `employeeId` empty |
| Business partner | Vendor staffing agency |

---

## 11. Locations and catalogue

| Assignment table | Parent | Child |
|------------------|--------|-------|
| Location ↔ Client | `support_location` | `client` |
| Location ↔ Employee | `support_location` | `employee` |
| Location ↔ Product | `support_location` | `product` |

| Catalogue | Used by |
|-----------|---------|
| Product | Agreement lines, booking lines, claims |
| Price list | Agreement pricing |
| Contract (vendor) | Non-participant contracts |

---

## 12. Documents and audit

| Record | Links | Storage |
|--------|-------|---------|
| Generated document | `entityType`, `entityId`, `templateId` | Supabase storage + `document_registry` |
| Record audit event | `entityType`, `entityId` | `app_audit_log` |
| Process audit | `processId`, user, outcome | Process audit tables |

**Not a relational FK:** Document registry references entities by type + id string.

---

## 13. Entity link matrix (required links)

| Record | Required links | Reverse UI (parent) | Save compliance |
|--------|----------------|---------------------|-----------------|
| Service agreement | client, price list | Client → Service agreements | lifecycle validation |
| Service booking | client; agreement when funded | Client → Service bookings | `booking-compliance.ts` |
| Incident | client | Client → Incidents | workflow rules |
| Task | entityType + entityId | Client → Requests | — |
| Timesheet / roster shift | employee **or** agency worker + vendor, client, location, booking (typical) | Roster week view | `roster-shift-compliance.ts` |
| Agency shift request | roster shift, vendor; worker when proposed | Gaps drawer | `agency-shift-workflow.ts` |
| Roster of care | client; agreement optional | Client → Roster of care | template + publish |
| Claim line | timesheet line / service context | Claim detail | PAPL validation |
| Invoice line | service line refs | Invoice detail | invoice line validation |

---

## 14. Client lifecycle (data impact)

| `lifecycleStatus` | Typical impact |
|-------------------|----------------|
| `intake` | Onboarding; booking warnings |
| `onboarding` | Transitional |
| `active` | Full delivery |
| `plan_review` | Planning focus |
| `exit` | Booking block / wind-down; billing review |

Source: `web/src/lib/client-lifecycle.ts`, reference data `clientLifecycleStatus`.

---

## 15. Participant portal (data)

| Record | Table | Links | Staff reverse UI |
|--------|-------|-------|------------------|
| Portal session | Cookie (`abilityvua_portal_session`) | `clientId`, email | — |
| Portal service request | `portal_service_request` | `clientId` | Client → **Requests** tab |
| Portal roster view | Read-only from `roster_shift` | `clientId` | Rostering module |
| Portal budget view | Read-only from `client.planBudgets` | `clientId` | Client → Plan budget tab |

**Auth:** Participant email must match `client.email`. Magic token via `web/src/lib/portal/session.server.ts`.

**Sign-in URLs (not in staff sidebar):** [Amplify demo](https://app.abilityvua.com/portal/login) · local `http://localhost:3000/portal/login` · demo email `Bernie@email`

---

## 16. Identifier conventions

| Field | Example | Use |
|-------|---------|-----|
| `id` | UUID | Internal FK |
| `searchKey` | `bp-bern`, `LIAN03` | URLs, human lookup |
| `documentNo` | `INV-JUN26-03`, `1000013` | Business document numbers |
| `entityType` + `entityId` | `client` + uuid | Tasks, documents, audit |

**Routes:** `/clients/{searchKey-or-id}` — `findClientByRouteId()` accepts either.

---

## 17. Maintenance checklist

Update this file when you:

- [ ] Add a parent/child table or FK in migrations
- [ ] Add a new line collection on a record
- [ ] Change required links or compliance rules
- [ ] Add reverse navigation (new tab linking to child records)
- [ ] Change spine flow (e.g. new billing entity)

Update `mappers.ts` / `data-api.ts` in the **same slice** as schema changes.

---

## 18. Document control

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2026-06-23 | Participant portal entities |
| 1.0 | 2026-06-23 | Initial entity and data model reference |
