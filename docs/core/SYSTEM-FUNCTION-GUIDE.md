# AbilityVua ÔÇö system function guide

**Audience:** External reviewers, auditors, board members, implementation partners, and senior stakeholders evaluating what the platform does today.  
**Pair with:** [WINDOWS-AND-TABS.md](./WINDOWS-AND-TABS.md) (where), [PROCESSES-AND-WORKFLOWS.md](./PROCESSES-AND-WORKFLOWS.md) (how), [ENTITY-AND-DATA-MODEL.md](./ENTITY-AND-DATA-MODEL.md) (data links), [ROLES-AND-ACCESS.md](./ROLES-AND-ACCESS.md) (who).  
**Version:** 1.1  
**Last updated:** 23 June 2026 (portal MVP, Amplify PDF)  
**Demo environment:** `https://app.abilityvua.com` (staff password `welcome`; SuperUser `flamingo`)

**Participant portal (separate from staff login):** [https://app.abilityvua.com/portal/login](https://app.abilityvua.com/portal/login) — demo email `Bernie@email`, then **Open portal** on the demo sign-in link.

---

## 1. What AbilityVua is

AbilityVua is an operational platform for **NDIS disability service providers**. It supports the full participant and workforce lifecycle: from first enquiry through service delivery, billing, reconciliation, and exit.

The product is organised around **records** (enquiries, clients, employees, agreements, bookings, shifts, timesheets, claims, invoices, and more). Staff work in a **workspace** with role-based access. System operators configure organisation profile, templates, roles, and reference data in a separate **System** area.

**Design principles reviewers should know:**

| Principle | What it means in practice |
|-----------|---------------------------|
| Role-based access | Every screen and action is gated by **windows** (read/write) and **processes** (print, send, convert, approve). |
| Audit by default | Record saves log who changed what. A footer on every record shows created/updated metadata; **Full audit trail** opens field-level history. |
| Line tables on records | Repeating data (activities, alerts, agreement lines, timesheet lines, etc.) lives in structured tables on the record, not free text only. |
| In-system document delivery | Print, PDF, and **Send via Email** save copies to a **document registry**. Email handoff opens the userÔÇÖs device mail app with PDF attached (share sheet or download + draft) ÔÇö not outbound SMTP from AbilityVua. |
| No in-app payroll engine | Verified timesheets export for KeyPay, Employment Hero, or Xero; award interpretation stays in payroll software. |
| NDIS claims via gateway | Claim batches are built and validated in-app; live PRODA submission is a planned integration slice. |

---

## 2. End-to-end operational spine

AbilityVua is built to support this flow (aligned with the master scope document, June 2026):

```
Enquiry ÔåÆ Client ÔåÆ Service agreement ÔåÆ Service booking ÔåÆ Service planning
    ÔåÆ Rostering ÔåÆ Service delivery ÔåÆ Timesheet ÔåÆ Claims ÔåÆ Invoices
    ÔåÆ Reconciliation ÔåÆ Financial close ÔåÆ Reporting / audit
```

Parallel workforce spine:

```
Employee hire ÔåÆ Credentials & compliance ÔåÆ Roster eligibility ÔåÆ My workplace
    ÔåÆ Leave ÔåÆ Timesheets ÔåÆ Exit checklist
```

Governance runs across both: **tasks**, **incidents**, **complaints**, and **audit packs**.

---

## 3. How to read this guide

Each function entry uses the same structure:

| Field | Meaning |
|-------|---------|
| **Function** | What the user does |
| **Who** | Typical roles |
| **Outcome** | What the organisation gets when it succeeds |
| **Status** | **Live** = available in demo; **Partial** = UI exists but thin vs full scope; **Planned** = on roadmap only |

For hands-on verification, see [testing/HAPPY-PATH-E2E-MATRIX.md](../testing/HAPPY-PATH-E2E-MATRIX.md) and [testing/UAT-INDEX.md](../testing/UAT-INDEX.md).

Pair with [WINDOWS-AND-TABS.md](./WINDOWS-AND-TABS.md) for routes, window keys, and record tabs.

---

## 4. Enquiries and intake

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Enquiry register** ÔÇö list, search, filter by pipeline stage | Intake, coordinators | Single view of all leads and their stage | Live |
| **Create enquiry** ÔÇö capture contact, referral source, disability, services sought | Intake | New lead record with audit trail | Live |
| **Pipeline stages** ÔÇö move enquiry through received ÔåÆ qualified ÔåÆ proposal ÔåÆ won/lost | Intake | Funnel visibility; loss reasons captured on lost deals | Live |
| **Qualification scoring** ÔÇö NDIS readiness fields and auto-score | Intake | Prioritise viable referrals | Live |
| **Activity log** ÔÇö calls, visits, notes on the enquiry | Intake | Handover history when converting to client | Live |
| **Print acknowledgement** ÔÇö letter from document template | Intake | Branded acknowledgement saved to document registry | Live |
| **Convert enquiry ÔåÆ client** ÔÇö one-click conversion with linked records | Coordinator+ | Client record created; enquiry marked converted; activity carried forward | Live |
| **Web-to-lead** ÔÇö public API creates enquiries from web forms | System | Automated intake without manual entry | Live |
| **HubSpot / CRM sync** ÔÇö push enquiry contact to HubSpot | Intake (when configured) | CRM stays aligned with AbilityVua | Partial ÔÇö needs live API token |

---

## 5. Clients and participant management

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Client register** ÔÇö list, search, lifecycle filters (intake, active, exit) | Coordinators+ | Operational caseload view | Live |
| **Core profile** ÔÇö identity, NDIS number, funding, disability, contacts | Coordinators+ | Single participant record | Live |
| **Full profile** ÔÇö extended clinical, cultural, communication, billing fields | Coordinators+ | Rich record for care and compliance | Live |
| **Lifecycle status** ÔÇö intake ÔåÆ active ÔåÆ exit with reason and dates | Coordinators+ | Filters, badges, booking compliance checks | Live |
| **Alerts** ÔÇö flag risks; optional header roll-up | Coordinators+ | Workers see warnings before delivering support | Live |
| **Activity** — case notes, calls, visits; admin-only removal; staff request deletion | All staff (role-gated) | Chronological participant history; admin removes lines or actions request task | Live |
| **Locations** ÔÇö service and postal addresses linked to client | Coordinators+ | Rostering and correspondence addresses | Live |
| **BP associations** ÔÇö guardians, family, referrers, plan managers | Coordinators+ | Linked business partners on the record | Live |
| **Consents and legal orders** ÔÇö NDIS core consents + orders | Coordinators+ | Consent compliance; summary on Overview | Live |
| **Risks and restrictive practices** ÔÇö formal register with alert flags | Coordinators+ | Risk-aware service delivery | Live |
| **Support receiver needs and rules** ÔÇö daily living instructions | Coordinators+ | Worker-readable support rules | Live |
| **Plan budget** ÔÇö allocations by support category; claimed rollup | Coordinators+ | Plan utilisation vs claimed spend | Live |
| **Plan import** ÔÇö manual wizard, CSV, text paste, gateway stub | Coordinators+ | Faster plan setup without re-keying | Live |
| **Support plan** ÔÇö goals, health, medications, support requirements | Coordinators+ | Person-centred plan for workers and audits | Live |
| **Print support plan** ÔÇö template render + registry | Coordinators+ | Printable/PDF plan on file | Live |
| **Send via Email (support plan)** ÔÇö PDF + email handoff | Coordinators+ | Plan saved to registry; device email opens with attachment | Live |
| **Goals and progress review** ÔÇö linked to support plan | Coordinators+ | Outcome tracking over time | Live |
| **Monthly service plan** ÔÇö hours/spend by month vs plan | Planners+ | Pre-roster planning | Live |
| **Roster of care** ÔÇö weekly care requirement template | Planners+ | Required hours vs rostered comparison | Live |
| **Service agreements (client tab)** ÔÇö agreements for this participant | Coordinators+ | Jump to agreement records | Live |
| **Service bookings (client tab)** ÔÇö bookings for this participant | Coordinators+ | Jump to booking records | Live |
| **Incidents (client tab)** ÔÇö incidents involving participant | Managers+ | Safeguarding context on client | Live |
| **Requests / tasks** — portal requests and linked tasks | Coordinators+ | Intake of participant-initiated requests | Live |
| **Documents (Overview)** — participant statement + consent schedule print/PDF | Coordinators+ | One Documents section at bottom of Overview | Live |
| **Participant portal (MVP)** — magic link; services, budget, service requests | Participant (email on file) | Self-service read + request intake; UAT-14 pass | Live (MVP) |
| **Participant exit** ÔÇö lifecycle exit, wind-down bookings, final activity | Coordinators+ | Participant closed operationally | Live (field-based; no guided wizard like employee exit) |

---

## 6. Locations and business partners

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Location register** — sites, addresses, capacity | Admin+ | Master site list for rostering and bookings, with large record banner for quick recognition | Live |
| **Location-based security** — employees see assigned locations and linked clients only; roles with **Unrestricted location access** bypass | All staff | Caseload scoped by `location.employeeLinks` / `location.clientLinks`; workspace data layer + server API + AI tools | Live |
| **Assign clients to location** | Admin+ | Caseload by site | Live |
| **Assign employees to location** | Admin+ | Workforce by site | Live |
| **Assign products to location** ÔÇö services offered at site | Admin+ | Catalogue scoped to delivery location | Live |
| **Fleet register** — provider-owned vehicles, registration, service state, odometer | Admin / Rostering | Vehicles managed as operational assets for participant transport | Live |
| **Maintenance requests** — log repairs and upkeep against a location, assign staff or contractors, track SLA, costs, and photos | All staff (create); Admin / Rostering (assign and close) | Central register plus location Maintenance tab and calendar chips | Live (foundation — reporting dashboard, duplicate merge, and budget caps deferred) |
| **Vehicle bookings** — reserve a vehicle for a driver, client, location, and time window | Admin / Rostering | Prevents double-booking and checks vehicle/driver compliance | Live |
| **Pre-start inspections** — pass/fail inspection lines on a vehicle | Drivers / Admin | Failed inspections mark a vehicle off road | Live |
| **Business partner register** ÔÇö plan managers, referrers, vendors | Admin+ | Shared directory for invoices and associations, with provider-style record banner and contact summary | Live |
| **Plan manager on client billing** ÔÇö default invoice recipient | Coordinators+ | Correct plan-managed billing routing | Live |

---

## 7. Service agreements and bookings

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Service agreement list and search** | Coordinators+ | Active and draft agreements visible | Live |
| **Create agreement** ÔÇö link client, price list, schedule of supports | Coordinators+ | Contractual basis for NDIS delivery | Live |
| **Agreement lines** ÔÇö products, quantities, rates | Coordinators+ | Billable schedule of supports | Live |
| **Lifecycle** ÔÇö draft ÔåÆ active ÔåÆ expired/terminated | Coordinators+ | Only active agreements drive bookings | Live |
| **Print agreement / variation** ÔÇö document template | Coordinators+ | Signed pack on file in registry | Live |
| **Participant e-sign capture** ÔÇö signature on agreement print | Coordinators+ | Signed document variant in registry | Live |
| **Service booking list** ÔÇö filter by client, status, period | Coordinators+ | Operational booking register | Live |
| **Create booking** ÔÇö link agreement, client, location, lines | Coordinators+ | Authorised service period for delivery | Live |
| **Compliance engine** ÔÇö blocks save when intake/exit/plan rules fail | Coordinators+ | NDIS-aligned booking validation | Live |
| **Cancellation rules** ÔÇö policy hints and claim linkage | Coordinators+ | Correct handling of cancelled supports | Live |

---

## 8. Products, price lists, and contracts

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Product catalogue** ÔÇö NDIS support items and internal products | Admin | Standard items for agreements and claims | Live |
| **Price lists** ÔÇö rate tables by product, guide year, region and effective window | Admin | Consistent pricing on agreements while preserving historical NDIS price limits | Live |
| **NDIS price import foundation** — batch and row history, source row hash, regional/effective-dated price metadata | System operators | Safe base for AB-0011 importer and AB-0012 dependant updater; no dependant records mutated | Foundation |
| **NDIS Price Guide Importer** — CSV upload, preview counts, apply master products/price lists, import history, revert | System operators | Controlled annual NDIS catalogue load; agreements/bookings/claims/invoices unchanged | Live |
| **Price Dependant Updater** — analyse AB-0011 import impacts, classify risk, approve/task, apply safe updates from effective date | System operators / finance / agreement managers | Controlled downstream price propagation; active/signed agreements require consent evidence | Live |
| **Contracts (vendor)** ÔÇö third-party contract register | Admin | Non-participant contract tracking | Live |

---

## 9. Service planning and rostering

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Service planning board** ÔÇö demand vs capacity view | Planners+ | Visibility before roster build | Live |
| **Edit planned service instances** | Planners+ | Planned hours aligned to bookings | Live |
| **Multi-provider budget** ÔÇö split view across providers | Planners+ | Consortium / multi-provider reporting | Live |
| **Roster grid** ÔÇö weekly view by location and worker | Roster admin | Shift planning surface | Live |
| **Create shift from plan/booking** | Roster admin | Shifts tied to authorised service | Live |
| **Assign worker to shift** | Roster admin | Named deliverer on each shift | Live |
| **Qualification checks** ÔÇö WWCC, NDIS screening on publish | Roster admin | Block publish when non-compliant | Live |
| **Publish roster** ÔÇö notify workers via tasks | Roster admin | Workers see shifts in My workplace | Live |
| **RoC rollover to live roster** — bulk create future shifts from master care templates | Roster admin | Maintains live roster weeks ahead using Organisation defaults; session keys group multi-client blocks; scope by all / client / location | Live |
| **Fortnight roster review** — compare RoC template vs actual roster | Roster admin | Highlights missing actuals, draft shifts, vacant sessions, worker changes, and extra actual shifts for the selected pay period | Live |
| **Open shifts marketplace** — workers request vacant shifts; rostering reviews and assigns | Support workers + roster admin | Request → review → assign; critical fill — Live |
| **Agency worker register** ÔÇö relief staff linked to staffing vendor | Roster admin, coordinators | Named agency pool per vendor; not payroll employees | Live |
| **Request agency coverage** ÔÇö vacant shift to vendor workflow | Roster admin, coordinators | Agency shift request + shift pack email | Live |
| **Confirm agency shift** ÔÇö assign agency worker with site orientation check | Roster admin, coordinators | Shift shows Agency badge; vendor + worker on roster | Live |
| **Buddy shift management** ÔÇö shadow/orientation shifts linked to primary | Roster admin, team leaders, coordinators | Separate pay and billing axes; org pay policy; primary cancel cascades | Live |

---

## 10. My workplace (frontline staff)

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **My shifts** ÔÇö view published roster | Support workers | Know when and where to work | Live |
| **Check-in / check-out** on shift | Support workers | Attendance captured for timesheets | Live |
| **My timesheets** ÔÇö view and submit hours | Support workers | Hours ready for approval | Live |
| **My leave** — request leave | All staff | Request enters approval queue; blocked inside minimum notice window (phone HR instead) | Live |
| **My credentials** ÔÇö submit WWCC, NDIS screening, training evidence | All staff | Compliance docs for HR review | Live |
| **My contracts** ÔÇö view generated HR documents | All staff | Access to offer/contract copies | Live |
| **My availability** ÔÇö set availability patterns | Support workers | Input to roster planning | Live |
| **Contact Rostering** — task-backed roster communication | All staff | Message assigned to Rostering Officer, visible in employee history | Live |
| **Services I can work at** — qualified sites + high-demand advisory | Support workers | See assignable sites; high-demand prompt to contact rostering | Live |
| **Home My calendar** — allocated shifts, pending shift requests, leave, credential/document expiry, tasks | All staff (linked employee) | One personal view of what is on for them, by month/week/day | Live |

---

## 11. Timesheets and approval

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Timesheet register** ÔÇö list by period, client, worker | Team leads+ | Organisation-wide hours view | Live |
| **Generate timesheets from roster** — preview then create | Team leads+ | Timesheets pre-filled from shifts for the selected pay period | Live |
| **Timesheet approval** ÔÇö approve or reject submitted sheets | Team leads+ | Verified hours for billing; blocks when actual-vs-rostered hours exceed the configured variance (System ÔåÆ Shift check-in monitoring, default 0.25h) | Live |
| **Shift check-in escalation** ÔÇö late/missed check-in and missed check-out | Rostering / coordinators | Missed check-in and check-out raise a manager task + Home alert; timing and timesheet hours variance centrally configured | Live |
| **Lock after claim generation** | Billing | Prevents change after claims built | Live |

---

## 12. Claims and NDIS billing

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Claim register** ÔÇö list and detail | Billing+ | Batch view of NDIS claims | Live |
| **Generate claims from timesheets** ÔÇö preview and create | Billing+ | Claim lines from verified delivery | Live |
| **PAPL validation** ÔÇö line-level pass/warn/error before submit | Billing+ | Reduces rejected claims | Live |
| **Cancellation claims** ÔÇö generate from cancelled bookings | Billing+ | Correct NDIS cancellation handling | Live |
| **Gateway dry-run** ÔÇö stub PRODA path | Billing+ | Ready for live gateway when credentialed | Partial |
| **Remittance import and match** | Finance+ | Match payer remittance to claims | Live |
| **Print claim batch summary** ÔÇö cover sheet to registry | Billing+ | Audit artefact for batch | Live |
| **Plan budget claimed rollup** ÔÇö updates client plan utilisation | Billing+ | Remaining budget visible to coordinators | Live |

---

## 13. Invoices and participant billing

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Invoice register** ÔÇö plan-managed and self-managed participants | Billing+ | Participant invoice list | Live |
| **Generate invoices from timesheets** ÔÇö plan-managed path | Billing+ | Invoices from verified lines | Live |
| **Invoice lines** ÔÇö service, date, quantity, rate, validation | Billing+ | Line-level NDIS invoice detail | Live |
| **Print invoice / PDF / HTML** | Billing+ | Document saved to registry | Live |
| **Batch print invoices** ÔÇö multi-select ZIP on list | Billing+ | Bulk document generation | Live |
| **Send via Email (invoice)** ÔÇö PDF + email handoff; marks Sent | Billing+ | Plan manager receives handoff from staff device | Live |
| **Invoice reconciliation dashboard** ÔÇö unpaid, overdue, follow-up | Finance+ | Cash collection visibility | Live |
| **Print remittance cover** ÔÇö reconciliation print to registry | Finance+ | Remittance advice document | Live |
| **Vendor invoice AP-lite** ÔÇö review agency portal invoices with mandatory document | Finance+ | Agency invoices approved and marked paid from Finance menu | Live |

---

## 14. Reconciliation and financial close

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Plan reconciliation** ÔÇö planned vs delivered vs claimed | Finance+ | Plan integrity check | Live |
| **Claim reconciliation** ÔÇö submitted vs accepted vs paid | Finance+ | Payer alignment | Live |
| **Invoice reconciliation** ÔÇö issued vs paid | Finance+ | Debtor follow-up | Live |
| **Financial month close** ÔÇö checklist by calendar month | Finance+ | Month-end discipline; may block until variances resolved | Partial |
| **NDIS audit pack** ÔÇö readiness report for selected month | Quality+ | Audit preparation export | Partial |
| **Board reporting** ÔÇö KPI pack with operational sections | Executives+ | Governance reporting | Partial |

---

## 15. Workforce ÔÇö employees and HR

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Employee register** ÔÇö HR file per staff member | HR+ | Central workforce record | Live |
| **Employment details** ÔÇö position, manager, status | HR+ | Org structure linkage | Live |
| **Credentials assigned** ÔÇö WWCC, NDIS screening, qualifications | HR+ | Compliance register per worker | Live |
| **Credential review workflow** ÔÇö HR approves or rejects submissions | HR+ | Only current credentials on roster | Live |
| **Leave calendar and approval** ÔÇö workforce planning view | HR+ | Approved leave blocks rostering | Live |
| **Submit leave on behalf** ÔÇö manager enters for employee | HR+ | Back-office leave entry | Live |
| **HR documents** ÔÇö generate offer, contract, separation letter | HR+ | Document + HR file line + registry | Live |
| **Employee exit checklist** ÔÇö separation letter, roster clearance, end date | HR+ | Structured offboarding | Live |
| **Workforce planning queue** ÔÇö credentials and leave pending review | HR+ | Single operations inbox | Live |
| **Training and meetings** — roster-visible individual/group sessions with cost allocation and attendance sign-off | HR, team leaders, rostering | Staff sessions appear on the roster; cost centre summaries show estimated training/meeting cost | Live |
| **Agency workers** ÔÇö vendor-linked relief register (not employee HR file) | Roster admin, coordinators | Pool for agency shift proposals | Live |

---

## 16. Incidents, complaints, and safeguarding

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Incident register** ÔÇö create and list | All staff (see-all for full register) | Formal incident record; Submit incident here on list | Live |
| **Incident detail** ÔÇö parties, evidence, actions, notifications | Managers+ | NDIS incident workflow | Live |
| **NDIS reportable tracking** ÔÇö commission notification deadlines | Quality+ | Regulatory timeframe visibility | Live |
| **Incident dashboard** ÔÇö stats and trends | Roles with Can see all incidents | Oversight view | Live |
| **Can see all incidents** ÔÇö role feature for register visibility | Administrators | Frontline see own open only; managers see all | Live |
| **Print incident notification** ÔÇö formal letter to registry | Managers+ | Documented notification | Live |
| **Complaints register** ÔÇö feedback and complaints hub | Managers+ | Separate from incidents | Live |
| **Manager override** ÔÇö senior access on restricted incidents | Senior managers | Escalation path | Live |

---

## 17. Tasks and workflow

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Task hub** ÔÇö assigned to me, my role, all, past | All staff | Work queue across modules | Live |
| **Assign task** ÔÇö on any record, to user or role | Coordinators+ | Work routed without email | Live |
| **Action task** ÔÇö start, complete, cancel | Assignees | Task lifecycle tracked | Live |
| **Task automations** ÔÇö System-configured rules | System admin | Repeatable task creation | Live |
| **Roster publish tasks** ÔÇö auto task when roster published | Roster admin | Workers notified in-app | Live |
| **Rostering communication** — employee-to-roster task thread | Staff + Rostering Officer | Governed conversation with status, priority, assignment, and audit | Live |

Workforce communications intentionally use **tasks, not email** for internal workflow (see [MY-WORKPLACE-DEV-NOTES.md](./MY-WORKPLACE-DEV-NOTES.md)).

---

## 18. Documents, print, and email

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Document templates (System)** ÔÇö layouts for all print types | System admin | Branded HTML/PDF source | Live |
| **Email content (System)** ÔÇö subject/body for Send via Email | System admin | Consistent participant/plan manager messages | Live |
| **Document registry (System)** ÔÇö all generated files | System admin | Audit trail of what was produced | Live |
| **Record Documents section** ÔÇö bottom of record pages: Print, PDF, Send via Email | Role-gated | Consistent UX; saved files + print log on record | Live |

**Document types available today:**

| Document | Typical record | Actions |
|----------|----------------|---------|
| Enquiry acknowledgement | Enquiry | Print, PDF |
| Service agreement / variation | Service agreement | Print, PDF, e-sign |
| Support plan | Client ÔåÆ Support plan | Print, PDF, **Send via Email** |
| Participant statement | Client ÔåÆ Overview | Print statement, PDF statement |
| Consent schedule | Client ÔåÆ Overview | Print consent, PDF consent |
| Invoice | Invoice | Print, PDF, HTML, **Send via Email** |
| Invoice batch | Invoice list | Batch PDF, Batch HTML |
| Claim batch summary | Claim | Print, PDF |
| Remittance cover | Invoice reconciliation | Print, PDF |
| Incident notification | Incident | Print, PDF |
| NDIS audit pack | Audit pack month | Print, PDF |
| Board report pack | Board report | Print, PDF |
| Employee offer / contract / separation | Employee ÔåÆ Documents | Generate, Print, PDF, HTML |

**Send via Email outcome:** Server generates PDF, saves HTML and PDF to registry, opens the staff memberÔÇÖs email app with subject/body from System templates and PDF attached via device share sheet (or downloaded for manual attach on desktop).

---

## 19. AI assistants

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Workspace assistant** ÔÇö chat on any page | All staff (read) | Answers questions; prepares draft records | Live |
| **Module assistants** ÔÇö client, enquiry, incident, task, training | Role-gated | Context-aware help on that module | Live |
| **AI prepare record** ÔÇö draft fields for human review and save | Write roles | Faster data entry; human always saves | Live |
| **AI query audit (System)** ÔÇö log and investigate AI usage | System admin | Governance over AI interactions | Live |

AI does **not** auto-save records. Staff review drafts and click Save.

---

## 20. Administration and System setup

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Roles and access** ÔÇö windows, processes, reports per role | Admin | Least-privilege security model | Live |
| **Security settings**; idle workspace timeout and inactivity warning | Admin | Unattended sessions expire after the organisation timeout and log as timed out | Live |
| **Admin communications hub** — broadcast messages with acknowledgment register | Admin | Staff see in-app notices; compliance audit trail | Live |
| **Organisation profile** — legal entity, logo, app theme colours, document branding, bank, GST | System admin | Branded sign-in and app shell; organisation banner; headers/footers on all documents | Live |
| **Reference data** ÔÇö dropdowns and lookups | System admin | Consistent coding across modules | Live |
| **User session audit** ÔÇö login sessions, risk flags | System admin | Security investigation | Live |
| **Process audit** ÔÇö who ran which business process | System admin | Operational compliance | Live |
| **Record retention settings** | System admin | Policy configuration | Live |
| **Reports hub** ÔÇö enquiry register and exports | Role-gated | Management information | Live |
| **Page guides** ÔÇö in-app help drawer per route | All staff | Contextual how-to | Live |

---

## 21. Integrations and explicit non-goals

| Capability | Status | Notes |
|------------|--------|-------|
| Live PRODA claim submission | Planned | Validation and batch build are Live; submission is stub until gateway credentials |
| Outbound SMTP / server email | Not in scope | Send via Email uses device handoff |
| SCHADS payroll calculation | Not in scope | Export verified timesheets to payroll system |
| Participant self-service portal | **Live (MVP)** | Magic link, services, budget, service requests — UAT-14 pass; outbound email not wired |
| Server PDF on Amplify | **Live** | `NODE_OPTIONS` / start script heap; cold start ~15–25s — see [AMPLIFY-PDF.md](../AMPLIFY-PDF.md) |
| Live NDIS plan API pull | Planned | Manual import and gateway stub are Live |
| HubSpot live sync | Partial | Dry-run and UI Live; needs production token |

---

## 22. Suggested review path (half day)

A structured walkthrough for an external reviewer:

| Block | Route / action | What to confirm |
|-------|----------------|-----------------|
| 1 ÔÇö Intake | `/enquiries` ÔåÆ open enquiry ÔåÆ Print acknowledgement ÔåÆ Convert to client | Pipeline, documents, conversion |
| 2 ÔÇö Participant | `/clients/bp-bern` ÔåÆ Overview, Plan budget, Support plan ÔåÆ Send via Email | Lifecycle, utilisation, documents at bottom |
| 3 ÔÇö Service setup | Service agreement ÔåÆ Service booking | Lines, compliance hints |
| 4 ÔÇö Delivery | `/rostering?week=2026-06-09` ÔåÆ publish ÔåÆ `/my/shifts` as worker | Shift ÔåÆ timesheet path |
| 5 ÔÇö Billing | `/generate-timesheets` ÔåÆ `/timesheet-approval` ÔåÆ `/generate-claims` ÔåÆ `/generate-invoices` | Verified hours ÔåÆ claim ÔåÆ invoice |
| 6 ÔÇö Invoice send | Invoice detail ÔåÆ **Send via Email** | PDF, registry, email handoff |
| 7 ÔÇö Reconciliation | Plan / claim / invoice reconciliation dashboards | Finance visibility |
| 8 ÔÇö Governance | `/incidents/dashboard`, `/complaints` | Safeguarding registers |
| 9 ÔÇö Audit | `/ndis-audit-pack`, `/board-reporting` | Reporting depth |
| 10 ÔÇö System | Document templates, Email content, Document registry, Roles | Configuration and audit |

**Test users:** See [testing/HAPPY-PATH-E2E-MATRIX.md section 2](../testing/HAPPY-PATH-E2E-MATRIX.md).

---

## 23. Related documentation

| Document | Use |
|----------|-----|
| [WINDOWS-AND-TABS.md](./WINDOWS-AND-TABS.md) | Routes, window keys, and record tabs (by function) |
| [SCOPE-ROADMAP.md](../SCOPE-ROADMAP.md) | Phased backlog and chunk status |
| [BUILD-PROGRESS.md](../BUILD-PROGRESS.md) | What shipped and how to test each slice |
| [processes/README.md](../processes/README.md) | Numbered business processes (convert, approve, assign) |
| [testing/HAPPY-PATH-E2E-MATRIX.md](../testing/HAPPY-PATH-E2E-MATRIX.md) | End-to-end test flows and FUNC matrix |
| [testing/UAT-INDEX.md](../testing/UAT-INDEX.md) | Full UAT catalogue |
| [scope/README.md](../scope/README.md) | Master scope authority and architecture decisions |

---

## 24. Document control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-06-23 | AbilityVua build team | Initial reviewer function guide |
| 1.1 | 2026-06-23 | AbilityVua build team | Moved to `docs/core/`; linked windows guide |

For corrections after a review session, log gaps in [testing/ISSUE-LOG-TEMPLATE.md](../testing/ISSUE-LOG-TEMPLATE.md) and update this guide when functions ship or labels change.
