# AbilityVua — windows and tabs reference

**Audience:** Developers, business analysts, access administrators, and reviewers who need to know *where* each function lives in the UI.  
**Pair with:** [SYSTEM-FUNCTION-GUIDE.md](./SYSTEM-FUNCTION-GUIDE.md) (outcomes), [PROCESSES-AND-WORKFLOWS.md](./PROCESSES-AND-WORKFLOWS.md) (actions), [ENTITY-AND-DATA-MODEL.md](./ENTITY-AND-DATA-MODEL.md) (record links), [ROLES-AND-ACCESS.md](./ROLES-AND-ACCESS.md) (grants).  
**Version:** 1.1  
**Last updated:** 25 June 2026 (Finance sidebar + vendor portal support guide)

---

## 1. How navigation works

### Surfaces

| Surface | Sign-in | Navigation | Access |
|---------|---------|------------|--------|
| **Workspace** | Workspace login | Left sidebar modules | `app_role_window` — Off / Read / Write per window |
| **System** | System login | System nav groups | Any signed-in System operator (no role grant) |
| **My workplace** | Workspace login | My workplace hub + sub-pages | Sub-windows under `my-workplace` |
| **Participant portal** | Magic link (`/portal/login`) | Top nav on `/portal/*` | No workspace roles — email must match `client.email`; demo exposes link when `PORTAL_DEMO_EXPOSE_LINK=true` |

### Participant portal routes

**There is no sidebar link from the staff app.** Share the sign-in URL with participants or bookmark it for testing.

| Environment | Sign-in URL |
|-------------|-------------|
| Amplify demo | `https://app.abilityvua.com/portal/login` |
| Local dev | `http://localhost:3000/portal/login` |

| Function | Route | Notes |
|----------|-------|-------|
| Sign in | `/portal/login` | Branded landing (org logo, name, address, contact strip) + magic-link card; email must match `client.email`; demo shows **Open portal** when `PORTAL_DEMO_EXPOSE_LINK=true` |
| Hub | `/portal` | Dashboard — next-step banner, summary tiles, badged cards; redirects to login if no session |
| My services | `/portal/services` | Week + list of rostered supports |
| My funding | `/portal/budget` | Read-only plan budget lines |
| Request a service | `/portal/requests` | Submit → staff see **Clients** → **Requests** tab |
| How to use your portal | `/portal/help` | Participant-only guide (`participant-portal-guide`) — services, funding, requests, escalation |

**Demo participant:** `Bernie@email` (client `bp-bern` / Bernadette Rose).

**Code:** `web/src/components/portal/*`, `web/src/lib/portal/*`, `web/src/app/portal/*`

### Agency vendor portal routes

| Surface | Sign-in | Notes |
|---------|---------|-------|
| Amplify demo | `https://app.abilityvua.com/agency-portal/login` | `roster@staffplus.example` (StaffPlus vendor BP) |
| Local dev | `http://localhost:3000/agency-portal/login` | Demo **Open agency portal** when `PORTAL_DEMO_EXPOSE_LINK` or `AGENCY_PORTAL_DEMO_EXPOSE_LINK` |

| Tab / page | Route | Purpose |
|------------|-------|---------|
| Sign in | `/agency-portal/login` | Branded landing (org logo, name, address, contact strip) + magic-link card; email must match agency vendor `business_partner.email` |
| Hub | `/agency-portal` | Dashboard — next-step banner, summary tiles, badged cards |
| Shift requests | `/agency-portal/requests`, `/agency-portal/requests/{id}` | Confirm **Sent** requests → **Worker proposed** |
| Timesheets | `/agency-portal/timesheets` | Approved agency timesheets |
| Invoices | `/agency-portal/invoices` | Submit invoice against approved timesheet (mandatory PDF/image attachment) |
| How to use this portal | `/agency-portal/help` | Vendor-only guide (`agency-vendor-portal`) — shifts, timesheets, invoices, escalation |

**Code:** `web/src/components/agency-portal/*`, `web/src/lib/agency-portal/*`, `web/src/app/agency-portal/*`

Staff counterpart: **Vendor invoices** (`/vendor-invoices`, `/vendor-invoices/{id}`) — finance approve/paid.

### Windows vs tabs

| Term | Meaning |
|------|---------|
| **Window** | A grantable unit in Admin → Roles. Parent windows appear in the sidebar; child windows are record tabs or sub-routes. |
| **Tab** | A section inside a record detail view (`?tab=…`). Each tab maps to a **window key** for Read/Write control. |
| **Process** | A button action (print, send, convert, approve) granted separately on the parent tab window. |

Tab window keys follow `{parent}-{slug}` (e.g. `client-support-plan`). Slugs come from `tabToWindowSlug()` in `detail-windows.ts`.

### Access levels

| Level | User can |
|-------|----------|
| Off | Not see the tab or route |
| Read | View; no save on editable fields |
| Write | View and save; processes on that tab if also granted |

---

## 2. Core and home

| Function area | Window key | Route | Sidebar | Notes |
|---------------|------------|-------|---------|-------|
| Home | `home` | `/` | Yes | Dashboard |
| Assistant & briefing | `home-prompt` | `/` (panel) | — | Home panel grant |
| Needs attention | `home-needs-attention` | `/` (panel) | — | Home panel grant |
| Today | `home-today` | `/` (panel) | — | Home panel grant; **My calendar** shows allocated shifts, pending open-shift requests, leave, credential/document expiry, and tasks for linked employees |
| Module counts / recent lists | `home-module-*`, `home-recent-*` | `/` (panels) | — | Per-panel grants |
| Quick actions | `home-quick-new-enquiry`, `home-quick-report-incident` | `/` | — | Home panel grants |

### Tasks hub

| Function area | Window key | Route | Notes |
|---------------|------------|-------|-------|
| Tasks (parent) | `tasks` | `/tasks` | Not in sidebar; linked from Home |
| Assigned to me | `tasks-assigned-to-me` | `/tasks?scope=assigned-to-me` | Default staff view |
| To my role | `tasks-for-my-role` | `/tasks?scope=my-role` | Role queue |
| All tasks | `tasks-all` | `/tasks?scope=all` | Supervisors |
| Past | `tasks-past` | `/tasks?scope=past` | Completed / cancelled |

---

## 3. Enquiries and intake

**Aligns with:** SYSTEM-FUNCTION-GUIDE §4

| Function area | Window key | Route | Sidebar |
|---------------|------------|-------|---------|
| Enquiry register | `enquiries` | `/enquiries` | Yes |
| New enquiry | `enquiries` (write) | `/enquiries/new` | — |

### Enquiry record tabs

| Tab | Window key | URL param |
|-----|------------|-----------|
| Enquiry details | `enquiry-enquiry-details` | `?tab=Enquiry%20details` |
| Qualification | `enquiry-qualification` | `?tab=Qualification` |
| Activity | `enquiry-activity` | `?tab=Activity` |
| Participant | `enquiry-participant` | `?tab=Participant` |
| Support needs | `enquiry-support-needs` | `?tab=Support%20needs` |

**Documents (bottom):** Print acknowledgement, PDF — `print-enquiry-acknowledgement` process.

**Processes:** `enquiry-to-client` (convert), print acknowledgement.

---

## 4. Clients and participants

**Aligns with:** SYSTEM-FUNCTION-GUIDE §5

| Function area | Window key | Route | Sidebar |
|---------------|------------|-------|---------|
| Client register | `clients` | `/clients` | Yes |
| Client detail | `clients` + tab windows | `/clients/{id}` | — |
| All service agreements (shortcut) | `service-agreements` | `/service-agreements` | Under Clients menu |

### Client record tabs (by nav group)

**Core**

| Tab | Window key |
|-----|------------|
| Overview | `client-overview` |
| Activity | `client-activity` |
| Calendar | `client-calendar` |
| Support Plan | `client-support-plan` |
| Alerts | `client-alerts` |
| Service agreements | `client-service-agreements` |
| Service bookings | `client-service-bookings` |
| Full profile | `client-full-profile` |

**Relationships**

| Tab | Window key |
|-----|------------|
| BP Associations | `client-bp-associations` |
| Locations | `client-locations` |
| Incidents | `client-incidents` |
| Contact Activity | `client-contact-activity` |

**Care & compliance**

| Tab | Window key |
|-----|------------|
| Requests | `client-requests` |
| Restrictive Practices | `client-restrictive-practices` |
| Consents and Legal Orders | `client-consents-and-legal-orders` |
| Risks | `client-risks` |
| Animal and Pet | `client-animal-and-pet` |

**Planning**

| Tab | Window key |
|-----|------------|
| Plan budget | `client-plan-budget` |
| Monthly service plan | `client-monthly-service-plan` |
| Roster of care | `client-roster-of-care` |
| Plan & Assessment | `client-plan-and-assessment` |
| Goals | `client-goals` |
| Progress Review | `client-progress-review` |
| Support Receiver Needs and Rules | `client-support-receiver-needs-and-rules` |

**Documents (Overview tab, bottom):** Print/PDF statement and consent — `print-participant-statement`, `print-consent-schedule`.

**Documents (Support Plan tab, bottom):** Print, PDF, **Send via Email** — `print-support-plan`, `send-support-plan`.

---

## 5. Locations and business partners

**Aligns with:** SYSTEM-FUNCTION-GUIDE §6

| Function area | Window key | Route | Sidebar |
|---------------|------------|-------|---------|
| Locations | `locations` | `/locations` | Yes |
| Maintenance | `maintenance` | `/maintenance` | Yes |
| Fleet | `fleet` | `/fleet` | Yes |
| Business partners | `business-partners` | `/business-partners` | Yes |

### Location record tabs

| Tab | Window key |
|-----|------------|
| Overview | `location-overview` |
| Activity | `location-activity` |
| Calendar | `location-calendar` |
| Maintenance | `location-maintenance` |
| Alerts | `location-alerts` |
| Contact & address | `location-contact-and-address` |
| Clients | `location-clients` |
| Employees | `location-employees` |
| Incidents | `location-incidents` |
| Site orientation | `location-site-orientation` |
| Products & services | `location-products-and-services` |

**Processes:** `assign-location-client`, `assign-location-employee`, `assign-location-product`.

### Maintenance request record tabs

| Tab | Window key |
|-----|------------|
| Overview | `maintenance-overview` |
| Assignment | `maintenance-assignment` |
| Costs | `maintenance-costs` |
| Photos | `maintenance-photos` |

Maintenance routes: `/maintenance`, `/maintenance/new`, `/maintenance/[id]`.

### Fleet vehicle record tabs

| Tab | Window key |
|-----|------------|
| Overview | `fleet-overview` |
| Calendar | `fleet-calendar` |
| Registration & insurance | `fleet-registration-and-insurance` |
| Servicing | `fleet-servicing` |
| Inspections | `fleet-inspections` |
| Bookings | `fleet-bookings` |
| Fuel & mileage | `fleet-fuel-and-mileage` |
| Accessibility & compliance | `fleet-accessibility-and-compliance` |
| Incidents | `fleet-incidents` |

Fleet routes: `/fleet`, `/fleet/new`, `/fleet/[id]`.

Business partners: Overview tab plus **Agency workers** tab when partner type is Vendor or NDIS agency (`?tab=Agency workers`). No separate window keys — uses `business-partners` + `agency-workers` for add worker.

| Tab | Route query | Notes |
|-----|-------------|-------|
| Overview | (default) | Contact, communication, payment |
| Agency workers | `?tab=Agency workers` | Vendor-linked worker pool; links to `/agency-workers` |

---

## 6. Service agreements, bookings, catalogue

**Aligns with:** SYSTEM-FUNCTION-GUIDE §§7–8

| Function area | Window key | Route | Sidebar |
|---------------|------------|-------|---------|
| Products | `products` | `/products` | Yes |
| Price lists | `price-lists` | `/price-lists` | Yes |
| Service agreements | `service-agreements` | `/service-agreements` | Yes |
| Contracts | `contracts` | `/contracts` | Yes |
| Service bookings | `service-bookings` | `/service-bookings` | Under Service delivery |

### Product tabs

| Tab | Window key |
|-----|------------|
| Overview | `product-overview` |
| Pricing | `product-pricing` |

### Price list tabs

| Tab | Window key |
|-----|------------|
| Overview | `price-list-overview` |
| Lines | `price-list-lines` |

### Service agreement tabs

| Tab | Window key |
|-----|------------|
| Overview | `service-agreement-overview` |
| Lines | `service-agreement-lines` |

**Documents (bottom):** Print agreement / variation — `print-service-agreement`, `print-agreement-variation`.

### Service booking tabs

| Tab | Window key |
|-----|------------|
| Overview | `service-booking-overview` |
| Lines | `service-booking-lines` |

### Contract tabs

| Tab | Window key |
|-----|------------|
| Overview | `contract-overview` |
| Audit | `contract-audit` |

---

## 7. Service planning and rostering

**Aligns with:** SYSTEM-FUNCTION-GUIDE §9

| Function area | Window key | Route | Sidebar |
|---------------|------------|-------|---------|
| Service planning | `service-planning` | `/service-planning` | Service delivery |
| Multi-provider budget | `multi-provider-budget` | `/multi-provider-budget` | Child of service planning |
| Rostering | `rostering` | `/rostering` | Service delivery |

Rostering uses `?week=` query for the roster week. Tabs: **Week**, **Forward plan**, **Fortnight review**, **Capacity**, **Gaps**, **Open shifts**, **RoC**. No record tabs — grid/calendar UI.

**Open shifts (request workflow):** Vacant shifts appear on **Open shifts** and **My workplace → Open shifts**. Workers **Request shift** (or **Available if critical** / **Decline** on urgent shifts). Coordinators **Review requests**, **Approve & assign**, **Reject**, **Assign worker**, or **Mark critical fill**. **Workforce planning → Fill board** triages the focus week with the same review panel and filters (open / requested / critical fill).

**Agency staffing (WP-AG.1):** **Gaps** tab lists vacant shifts; **Request agency** opens the agency shift request drawer (process `request-agency-coverage`). Confirmed agency cover shows an **Agency** badge on the week calendar.

**Buddy shifts (AB-0022):** On staffed shift cards, **Add buddy shift** creates a linked shadow/orientation shift. Calendar badges: **Buddy**, **Non-payable**, **Non-billable**. Org pay default: System → Organisation → **Buddy shifts** (`/system/settings/buddy-shifts`). Participant portal does not show buddy shifts (v1).

**RoC tab:** Import RoC CSV, generate a draft from a service agreement, per-RoC **Publish to roster**, and **Bulk rollover** (scope **All active RoCs** / **By client** / **By location**) — all gated on `rostering` write. Bulk rollover de-duplicates shared session-key shifts and honours the Organisation rollover defaults.

**Capacity tab:** Pay period selector and **Contracted hours** shortfall table — rostered vs contracted minimum per employee for the selected pay period. Changing the pay period aligns the capacity grid to that fortnight (two weeks from period start). Find-and-fill (Fill board, open shift request ranking) prioritises workers below contracted hours.

**Fortnight review tab:** Pay-period-aligned command-centre view comparing active RoC templates with live roster shifts for the selected pay period. It highlights missing actuals, draft shifts, vacant sessions, worker changes, and extra actual shifts before the roster is published.

**Processes:** `request-agency-coverage`, `send-agency-shift-pack`, `confirm-agency-shift`, `complete-agency-shift` (rostering + agency-workers grants).

---

## 8. My workplace

**Aligns with:** SYSTEM-FUNCTION-GUIDE §10

| Function area | Window key | Route |
|---------------|------------|-------|
| My workplace hub | `my-workplace` | `/my` |
| My leave | `my-leave` | `/my/leave` |
| About me | `my-profile` | `/my/profile` |
| My availability | `my-availability` | `/my/availability` |
| My contracts | `my-contracts` | `/my/contracts` |
| Open shifts | `my-open-shifts` | `/my/open-shifts` |
| My shifts | `my-shifts` | `/my/shifts` — **Scheduled shifts** tab + **Shift requests** tab |
| My timesheets | `my-timesheets` | `/my/timesheets` |
| My credentials | `my-credentials` | `/my/credentials` |

**Open shift requests:** Worker submits from Open shifts; tracks on My shifts → Shift requests. Coordinator review on Rostering → Open shifts and Workforce planning fill board.

**Contact Rostering:** Open shifts and My shifts show a prominent **Contact Rostering** panel. Submissions create `tt-rostering-communication` tasks assigned to the Rostering Officer role; the employee sees the communication history on the same My Workplace pages and can open the task conversation.

**Services I can work at:** The `/my` hub shows a read-only list of sites where the employee has an active assignment, current mandatory credentials, and valid site orientation. High demand is signalled when a location has `high_demand_advisory` set on Overview, or when two or more vacant Published/Draft shifts exist in the next 14 days. Rostering managers set the manual flag on **Locations → Overview → Staff demand signal**.

**Processes:** `submit-leave-request`, `submit-employee-credential`.

---

## 9. Timesheets

**Aligns with:** SYSTEM-FUNCTION-GUIDE §11

| Function area | Window key | Route | Sidebar |
|---------------|------------|-------|---------|
| Timesheets register | `timesheets` | `/timesheets` | Service delivery |
| Generate timesheets | `generate-timesheets` | `/generate-timesheets` | Service delivery |
| Timesheet approval | `timesheet-approval` | `/timesheet-approval` | Service delivery |

Timesheet detail: single page (no tab windows). **Process:** `approve-timesheet`.

---

## 10. Claims and billing

**Aligns with:** SYSTEM-FUNCTION-GUIDE §§12–13

| Function area | Window key | Route | Sidebar |
|---------------|------------|-------|---------|
| Claims | `claims` | `/claims` | Finance |
| Generate claims | `generate-claims` | `/generate-claims` | Finance |
| Invoices | `invoices` | `/invoices` | Finance |
| Generate invoices | `generate-invoices` | `/generate-invoices` | Finance |
| Vendor invoices | `vendor-invoices` | `/vendor-invoices` | Finance |

Claim and invoice detail: single page with lines panel. No tab windows.

| Documents | Record | Processes |
|-----------|--------|-----------|
| Print / PDF batch summary | Claim detail | `print-claim-batch` |
| Print / PDF / HTML / Send via Email | Invoice detail | `print-invoice`, `send-invoice` |
| Batch PDF / HTML | Invoice list (bottom) | `batch-print-invoices` |

---

## 11. Reconciliation and reporting

**Aligns with:** SYSTEM-FUNCTION-GUIDE §14

| Function area | Window key | Route | Sidebar |
|---------------|------------|-------|---------|
| Plan reconciliation | `plan-reconciliation` | `/plan-reconciliation` | Finance |
| Claim reconciliation | `claim-reconciliation` | `/claim-reconciliation` | Finance |
| Invoice reconciliation | `invoice-reconciliation` | `/invoice-reconciliation` | Finance |
| Financial close | `financial-close` | `/financial-close` | Finance |
| NDIS audit pack | `ndis-audit-pack` | `/ndis-audit-pack` | Service delivery |
| Board reporting | `board-reporting` | `/board-reporting` | Service delivery |
| Reports hub | `reports` | `/reports` | Core |

**Documents:** Remittance cover (`print-remittance-cover`), audit pack (`print-audit-pack`), board report (`print-board-report`).

---

## 12. Workforce — employees and HR

**Aligns with:** SYSTEM-FUNCTION-GUIDE §15

| Function area | Window key | Route | Sidebar |
|---------------|------------|-------|---------|
| Employees | `employees` | `/employees` | People |
| Agency workers | `agency-workers` | `/agency-workers` | People |
| Agency timesheets | `agency-timesheets` | `/agency-timesheets` | People |
| Generate agency timesheets | `generate-agency-timesheets` | `/generate-agency-timesheets` | People |
| Workforce planning | `workforce-planning` | `/workforce-planning` | Workforce planning |
| Organisation structure | `workforce-organisation` | `/workforce-planning/organisation` | Workforce planning |
| Training and meetings | `training-meetings` | `/workforce-planning/training` | Workforce planning |
| Edit org structure | `workforce-org-edit` | (action grant) | — |
| Edit org chart tiers | `workforce-org-chart-tier` | `/system/org-chart-tiers` | — |

Agency workers routes: `/agency-workers/new`, `/agency-workers/{id}`. Agency timesheets: `/agency-timesheets`, `/agency-timesheets/{id}`, `/generate-agency-timesheets`. Coverage workflow runs from Rostering → Gaps; timesheet generation from completed agency shifts. Vendor invoice review is in Finance.

### Employee record tabs

**Employee**

| Tab | Window key |
|-----|------------|
| Overview | `employee-overview` |
| Activity | `employee-activity` |
| Calendar | `employee-calendar` |
| Contact | `employee-contact` |
| Address | `employee-locations` |
| Emergency contacts | `employee-emergency-contacts` |
| Employment | `employee-employment` |
| Work rights | `employee-work-rights` |
| Payroll | `employee-payroll` |
| Leave | `employee-leave` |
| Incidents | `employee-incidents` |
| Schedule | `employee-schedule` |
| Schedule template | `employee-schedule-template` |

**Compliance**

| Tab | Window key |
|-----|------------|
| Credentials Assigned | `employee-credentials-assigned` |
| Alerts | `employee-alerts` |

**HR file**

| Tab | Window key |
|-----|------------|
| Documents | `employee-documents` |
| Skills & languages | `employee-skills` |

**Organisation**

| Tab | Window key |
|-----|------------|
| System access | `employee-system-access` |

**Documents (Documents tab, bottom):** Generate / Print / PDF / HTML — offer, contract, separation (`print-employee-offer`, `print-employee-contract`, `print-employee-separation`).

**Line editor pattern:** Employee child collections (Leave entitlements/requests, Credentials Assigned, Alerts, Documents, Skills & languages, Activity) use the shared summary list + side drawer pattern. Rows open into `RecordLineDrawer`; parent employee save persists changes and writes the record audit.

**Processes:** `assign-employee-credential`, `submit-leave-on-behalf`, `review-employee-credential`, `approve-leave-request`.

---

## 13. Incidents, complaints, safeguarding

**Aligns with:** SYSTEM-FUNCTION-GUIDE §16

| Function area | Window key | Route | Sidebar |
|---------------|------------|-------|---------|
| Incidents | `incidents` | `/incidents` | People |
| Complaints and feedback | `complaints` | `/complaints` | People |
| Can see all incidents | `incidents-see-all` | (role feature on Incidents) | — |
| Incident dashboard | `incidents-dashboard` | `/incidents/dashboard` | — (legacy; dashboard gated by `incidents-see-all`) |
| Manager override | `incident-manager-override` | (process grant) | — |

### Incident record tabs

| Tab | Window key |
|-----|------------|
| Overview | `incident-overview` |
| Parties & links | `incident-parties-and-links` |
| Investigation | `incident-investigation` |
| Notifications | `incident-notifications` |

**Documents (bottom):** Print notification — `print-incident-notification`.

**Line editor pattern:** Incident child collections (Parties & links, Investigation actions, Evidence, Notifications) use the shared summary list + side drawer pattern. Rows open into `RecordLineDrawer`; parent incident save persists changes and writes the record audit.

**Processes:** `report-incident`, `notify-ndis-reportable`.

---

## 14. Workspace administration

**Aligns with:** SYSTEM-FUNCTION-GUIDE §20 (workspace slice)

| Function area | Window key | Route | Surface |
|---------------|------------|-------|---------|
| Organisation (workspace) | `admin-organization` | `/admin/organization` | Workspace |
| Reference data | `admin-reference-data` | `/admin/reference-data` | Workspace |
| Pay periods | `admin-pay-periods` | `/admin/pay-periods` | Workspace |
| Roles | `admin-roles` | `/admin/roles` | Workspace |
| Communications hub | `admin-communications` | `/admin/communications` | Workspace |
| AI assistants | `admin-ai-agents` | `/admin/ai-agents` | Workspace |

Roles admin is where **windows** and **processes** are granted per security role.

---

## 15. System setup

**Aligns with:** SYSTEM-FUNCTION-GUIDE §§18–20

System routes use **System** sign-in (`/system/...`). Navigation: `web/src/lib/system/nav.ts`.

| Function area | Route | System nav group |
|---------------|-------|------------------|
| Organisation profile | `/system/organization` | Organisation |
| Time & date | `/system/settings/time-and-date` | Organisation |
| Incident management | `/system/settings/incident-management` | Incident reports |
| Buddy shifts | `/system/settings/buddy-shifts` | Organisation |
| Org chart tiers | `/system/org-chart-tiers` | Organisation |
| Reference data | `/system/reference-data` | Reference data |
| Task management | `/system/admin/task-management` | Tasks |
| Task automations | `/system/admin/task-automations` | Tasks |
| Document templates | `/system/admin/document-templates` | Tasks |
| Email content | `/system/admin/document-email` | Tasks |
| Document registry | `/system/admin/document-registry` | Tasks |
| Reports Advance | `/system/admin/reports-advance` | Reports |
| NDIS Price Guide Importer | `/system/services/ndis-price-importer` | Services |
| Price Dependant Updater | `/system/services/price-update-review` | Services |
| AI assistants | `/system/ai/assistants` | AI |
| User Session Audit | `/system/admin/user-session-audit` | Admin |
| Process Audit | `/system/admin/process-audit` | Admin |
| AI Query Audit | `/system/admin/ai-query-audit` | Admin |
| Record retention | `/system/settings/record-retention` | System Settings |
| How-to guides | `/system/guides` | — |

Catalog window keys for System pages use `admin-*` or `system-*` prefixes (see `catalog.ts`).

---

## 16. Document and email processes (quick reference)

All use **Documents** section at the bottom of the record (see `.cursor/rules/record-documents.mdc`).

| Process ID | Label (Roles admin) | Parent window |
|------------|---------------------|---------------|
| `print-enquiry-acknowledgement` | Print enquiry acknowledgement | `enquiry-*` |
| `print-support-plan` | Print support plan | `client-support-plan` |
| `send-support-plan` | Send support plan via email | `client-support-plan` |
| `print-participant-statement` | Print participant statement | `client-overview` |
| `print-consent-schedule` | Print consent schedule | `client-overview` |
| `print-service-agreement` | Print service agreement | `service-agreement-*` |
| `print-agreement-variation` | Print agreement variation | `service-agreement-*` |
| `print-claim-batch` | Print claim batch summary | `claims` |
| `print-invoice` | Print invoice | `invoices` |
| `batch-print-invoices` | Batch print invoices | `invoices` |
| `send-invoice` | Send invoice via email | `invoices` |
| `print-remittance-cover` | Print remittance cover | `invoice-reconciliation` |
| `print-board-report` | Print board report | `board-reporting` |
| `print-audit-pack` | Print audit pack report | `ndis-audit-pack` |
| `print-incident-notification` | Print incident notification | `incident-*` |
| `print-employee-offer` | Generate offer of employment | `employee-documents` |
| `print-employee-contract` | Generate employee contract | `employee-documents` |
| `print-employee-separation` | Generate separation letter | `employee-documents` |

**Send via Email** button label (workspace UI): `DOCUMENT_SEND_VIA_EMAIL_LABEL` in `document-email-template.ts`.

---

## 17. Cross-cutting processes

| Process ID | Function |
|------------|----------|
| `ai-prepare-record` | AI drafts fields; human saves |
| `assign-task` | Create task on a record |
| `action-task` | Start / complete / cancel tasks |
| `manage-session-audit-risk` | Investigate flagged logins |
| `manage-process-audit-risk` | Investigate flagged processes |
| `manage-ai-query-audit-risk` | Investigate flagged AI queries |

---

## 18. Maintenance checklist

Update this file when you change:

- [ ] A sidebar module or route (`catalog.ts`, `href`)
- [ ] A record tab name or group (`clientTabGroups`, `employeeTabGroups`, etc.)
- [ ] A window key or `parentWindowKey`
- [ ] A new print/send process
- [ ] System nav entry (`system/nav.ts`)
- [ ] A function described in [SYSTEM-FUNCTION-GUIDE.md](./SYSTEM-FUNCTION-GUIDE.md)

After access changes, run `npm run uat:inventory` and update UAT packs if needed.

---

## 19. Document control

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-06-23 | Initial windows and tabs reference aligned to SYSTEM-FUNCTION-GUIDE |
