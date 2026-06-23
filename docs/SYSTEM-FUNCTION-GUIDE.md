# AbilityAPP — system function guide

**Audience:** External reviewers, auditors, board members, implementation partners, and senior stakeholders evaluating what the platform does today.  
**Version:** 1.0  
**Last updated:** 23 June 2026  
**Demo environment:** `https://main.d3vim3geq5td01.amplifyapp.com` (staff password `welcome`; SuperUser `flamingo`)

---

## 1. What AbilityAPP is

AbilityAPP is an operational platform for **NDIS disability service providers**. It supports the full participant and workforce lifecycle: from first enquiry through service delivery, billing, reconciliation, and exit.

The product is organised around **records** (enquiries, clients, employees, agreements, bookings, shifts, timesheets, claims, invoices, and more). Staff work in a **workspace** with role-based access. System operators configure organisation profile, templates, roles, and reference data in a separate **System** area.

**Design principles reviewers should know:**

| Principle | What it means in practice |
|-----------|---------------------------|
| Role-based access | Every screen and action is gated by **windows** (read/write) and **processes** (print, send, convert, approve). |
| Audit by default | Record saves log who changed what. A footer on every record shows created/updated metadata; **Full audit trail** opens field-level history. |
| Line tables on records | Repeating data (activities, alerts, agreement lines, timesheet lines, etc.) lives in structured tables on the record, not free text only. |
| In-system document delivery | Print, PDF, and **Send via Email** save copies to a **document registry**. Email handoff opens the user’s device mail app with PDF attached (share sheet or download + draft) — not outbound SMTP from AbilityAPP. |
| No in-app payroll engine | Verified timesheets export for KeyPay, Employment Hero, or Xero; award interpretation stays in payroll software. |
| NDIS claims via gateway | Claim batches are built and validated in-app; live PRODA submission is a planned integration slice. |

---

## 2. End-to-end operational spine

AbilityAPP is built to support this flow (aligned with the master scope document, June 2026):

```
Enquiry → Client → Service agreement → Service booking → Service planning
    → Rostering → Service delivery → Timesheet → Claims → Invoices
    → Reconciliation → Financial close → Reporting / audit
```

Parallel workforce spine:

```
Employee hire → Credentials & compliance → Roster eligibility → My workplace
    → Leave → Timesheets → Exit checklist
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

For hands-on verification, see [testing/HAPPY-PATH-E2E-MATRIX.md](./testing/HAPPY-PATH-E2E-MATRIX.md) and [testing/UAT-INDEX.md](./testing/UAT-INDEX.md).

---

## 4. Enquiries and intake

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Enquiry register** — list, search, filter by pipeline stage | Intake, coordinators | Single view of all leads and their stage | Live |
| **Create enquiry** — capture contact, referral source, disability, services sought | Intake | New lead record with audit trail | Live |
| **Pipeline stages** — move enquiry through received → qualified → proposal → won/lost | Intake | Funnel visibility; loss reasons captured on lost deals | Live |
| **Qualification scoring** — NDIS readiness fields and auto-score | Intake | Prioritise viable referrals | Live |
| **Activity log** — calls, visits, notes on the enquiry | Intake | Handover history when converting to client | Live |
| **Print acknowledgement** — letter from document template | Intake | Branded acknowledgement saved to document registry | Live |
| **Convert enquiry → client** — one-click conversion with linked records | Coordinator+ | Client record created; enquiry marked converted; activity carried forward | Live |
| **Web-to-lead** — public API creates enquiries from web forms | System | Automated intake without manual entry | Live |
| **HubSpot / CRM sync** — push enquiry contact to HubSpot | Intake (when configured) | CRM stays aligned with AbilityAPP | Partial — needs live API token |

---

## 5. Clients and participant management

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Client register** — list, search, lifecycle filters (intake, active, exit) | Coordinators+ | Operational caseload view | Live |
| **Core profile** — identity, NDIS number, funding, disability, contacts | Coordinators+ | Single participant record | Live |
| **Full profile** — extended clinical, cultural, communication, billing fields | Coordinators+ | Rich record for care and compliance | Live |
| **Lifecycle status** — intake → active → exit with reason and dates | Coordinators+ | Filters, badges, booking compliance checks | Live |
| **Alerts** — flag risks; optional header roll-up | Coordinators+ | Workers see warnings before delivering support | Live |
| **Activity** — case notes, calls, visits | All staff (role-gated) | Chronological participant history | Live |
| **Locations** — service and postal addresses linked to client | Coordinators+ | Rostering and correspondence addresses | Live |
| **BP associations** — guardians, family, referrers, plan managers | Coordinators+ | Linked business partners on the record | Live |
| **Consents and legal orders** — NDIS core consents + orders | Coordinators+ | Consent compliance; summary on Overview | Live |
| **Risks and restrictive practices** — formal register with alert flags | Coordinators+ | Risk-aware service delivery | Live |
| **Support receiver needs and rules** — daily living instructions | Coordinators+ | Worker-readable support rules | Live |
| **Plan budget** — allocations by support category; claimed rollup | Coordinators+ | Plan utilisation vs claimed spend | Live |
| **Plan import** — manual wizard, CSV, text paste, gateway stub | Coordinators+ | Faster plan setup without re-keying | Live |
| **Support plan** — goals, health, medications, support requirements | Coordinators+ | Person-centred plan for workers and audits | Live |
| **Print support plan** — template render + registry | Coordinators+ | Printable/PDF plan on file | Live |
| **Send via Email (support plan)** — PDF + email handoff | Coordinators+ | Plan saved to registry; device email opens with attachment | Live |
| **Goals and progress review** — linked to support plan | Coordinators+ | Outcome tracking over time | Live |
| **Monthly service plan** — hours/spend by month vs plan | Planners+ | Pre-roster planning | Live |
| **Roster of care** — weekly care requirement template | Planners+ | Required hours vs rostered comparison | Live |
| **Service agreements (client tab)** — agreements for this participant | Coordinators+ | Jump to agreement records | Live |
| **Service bookings (client tab)** — bookings for this participant | Coordinators+ | Jump to booking records | Live |
| **Incidents (client tab)** — incidents involving participant | Managers+ | Safeguarding context on client | Live |
| **Requests / tasks** — portal requests and linked tasks | Coordinators+ | Intake of participant-initiated requests | Live |
| **Documents (Overview)** — participant statement + consent schedule print/PDF | Coordinators+ | One Documents section at bottom of Overview | Live |
| **Participant exit** — lifecycle exit, wind-down bookings, final activity | Coordinators+ | Participant closed operationally | Live (field-based; no guided wizard like employee exit) |

---

## 6. Locations and business partners

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Location register** — sites, addresses, capacity | Admin+ | Master site list for rostering and bookings | Live |
| **Assign clients to location** | Admin+ | Caseload by site | Live |
| **Assign employees to location** | Admin+ | Workforce by site | Live |
| **Assign products to location** — services offered at site | Admin+ | Catalogue scoped to delivery location | Live |
| **Business partner register** — plan managers, referrers, vendors | Admin+ | Shared directory for invoices and associations | Live |
| **Plan manager on client billing** — default invoice recipient | Coordinators+ | Correct plan-managed billing routing | Live |

---

## 7. Service agreements and bookings

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Service agreement list and search** | Coordinators+ | Active and draft agreements visible | Live |
| **Create agreement** — link client, price list, schedule of supports | Coordinators+ | Contractual basis for NDIS delivery | Live |
| **Agreement lines** — products, quantities, rates | Coordinators+ | Billable schedule of supports | Live |
| **Lifecycle** — draft → active → expired/terminated | Coordinators+ | Only active agreements drive bookings | Live |
| **Print agreement / variation** — document template | Coordinators+ | Signed pack on file in registry | Live |
| **Participant e-sign capture** — signature on agreement print | Coordinators+ | Signed document variant in registry | Live |
| **Service booking list** — filter by client, status, period | Coordinators+ | Operational booking register | Live |
| **Create booking** — link agreement, client, location, lines | Coordinators+ | Authorised service period for delivery | Live |
| **Compliance engine** — blocks save when intake/exit/plan rules fail | Coordinators+ | NDIS-aligned booking validation | Live |
| **Cancellation rules** — policy hints and claim linkage | Coordinators+ | Correct handling of cancelled supports | Live |

---

## 8. Products, price lists, and contracts

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Product catalogue** — NDIS support items and internal products | Admin | Standard items for agreements and claims | Live |
| **Price lists** — rate tables by product | Admin | Consistent pricing on agreements | Live |
| **Contracts (vendor)** — third-party contract register | Admin | Non-participant contract tracking | Live |

---

## 9. Service planning and rostering

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Service planning board** — demand vs capacity view | Planners+ | Visibility before roster build | Live |
| **Edit planned service instances** | Planners+ | Planned hours aligned to bookings | Live |
| **Multi-provider budget** — split view across providers | Planners+ | Consortium / multi-provider reporting | Live |
| **Roster grid** — weekly view by location and worker | Roster admin | Shift planning surface | Live |
| **Create shift from plan/booking** | Roster admin | Shifts tied to authorised service | Live |
| **Assign worker to shift** | Roster admin | Named deliverer on each shift | Live |
| **Qualification checks** — WWCC, NDIS screening on publish | Roster admin | Block publish when non-compliant | Live |
| **Publish roster** — notify workers via tasks | Roster admin | Workers see shifts in My workplace | Live |
| **Open shifts marketplace** — workers claim vacant shifts | Support workers | Fill gaps from pool | Partial |

---

## 10. My workplace (frontline staff)

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **My shifts** — view published roster | Support workers | Know when and where to work | Live |
| **Check-in / check-out** on shift | Support workers | Attendance captured for timesheets | Live |
| **My timesheets** — view and submit hours | Support workers | Hours ready for approval | Live |
| **My leave** — request leave | All staff | Request enters approval queue | Live |
| **My credentials** — submit WWCC, NDIS screening, training evidence | All staff | Compliance docs for HR review | Live |
| **My contracts** — view generated HR documents | All staff | Access to offer/contract copies | Live |
| **My availability** — set availability patterns | Support workers | Input to roster planning | Live |

---

## 11. Timesheets and approval

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Timesheet register** — list by period, client, worker | Team leads+ | Organisation-wide hours view | Live |
| **Generate timesheets from roster** — preview then create | Team leads+ | Timesheets pre-filled from shifts | Live |
| **Timesheet approval** — approve or reject submitted sheets | Team leads+ | Verified hours for billing | Live |
| **Lock after claim generation** | Billing | Prevents change after claims built | Live |

---

## 12. Claims and NDIS billing

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Claim register** — list and detail | Billing+ | Batch view of NDIS claims | Live |
| **Generate claims from timesheets** — preview and create | Billing+ | Claim lines from verified delivery | Live |
| **PAPL validation** — line-level pass/warn/error before submit | Billing+ | Reduces rejected claims | Live |
| **Cancellation claims** — generate from cancelled bookings | Billing+ | Correct NDIS cancellation handling | Live |
| **Gateway dry-run** — stub PRODA path | Billing+ | Ready for live gateway when credentialed | Partial |
| **Remittance import and match** | Finance+ | Match payer remittance to claims | Live |
| **Print claim batch summary** — cover sheet to registry | Billing+ | Audit artefact for batch | Live |
| **Plan budget claimed rollup** — updates client plan utilisation | Billing+ | Remaining budget visible to coordinators | Live |

---

## 13. Invoices and participant billing

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Invoice register** — plan-managed and self-managed participants | Billing+ | Participant invoice list | Live |
| **Generate invoices from timesheets** — plan-managed path | Billing+ | Invoices from verified lines | Live |
| **Invoice lines** — service, date, quantity, rate, validation | Billing+ | Line-level NDIS invoice detail | Live |
| **Print invoice / PDF / HTML** | Billing+ | Document saved to registry | Live |
| **Batch print invoices** — multi-select ZIP on list | Billing+ | Bulk document generation | Live |
| **Send via Email (invoice)** — PDF + email handoff; marks Sent | Billing+ | Plan manager receives handoff from staff device | Live |
| **Invoice reconciliation dashboard** — unpaid, overdue, follow-up | Finance+ | Cash collection visibility | Live |
| **Print remittance cover** — reconciliation print to registry | Finance+ | Remittance advice document | Live |

---

## 14. Reconciliation and financial close

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Plan reconciliation** — planned vs delivered vs claimed | Finance+ | Plan integrity check | Live |
| **Claim reconciliation** — submitted vs accepted vs paid | Finance+ | Payer alignment | Live |
| **Invoice reconciliation** — issued vs paid | Finance+ | Debtor follow-up | Live |
| **Financial month close** — checklist by calendar month | Finance+ | Month-end discipline; may block until variances resolved | Partial |
| **NDIS audit pack** — readiness report for selected month | Quality+ | Audit preparation export | Partial |
| **Board reporting** — KPI pack with operational sections | Executives+ | Governance reporting | Partial |

---

## 15. Workforce — employees and HR

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Employee register** — HR file per staff member | HR+ | Central workforce record | Live |
| **Employment details** — position, manager, status | HR+ | Org structure linkage | Live |
| **Credentials assigned** — WWCC, NDIS screening, qualifications | HR+ | Compliance register per worker | Live |
| **Credential review workflow** — HR approves or rejects submissions | HR+ | Only current credentials on roster | Live |
| **Leave calendar and approval** — workforce planning view | HR+ | Approved leave blocks rostering | Live |
| **Submit leave on behalf** — manager enters for employee | HR+ | Back-office leave entry | Live |
| **HR documents** — generate offer, contract, separation letter | HR+ | Document + HR file line + registry | Live |
| **Employee exit checklist** — separation letter, roster clearance, end date | HR+ | Structured offboarding | Live |
| **Workforce planning queue** — credentials and leave pending review | HR+ | Single operations inbox | Live |

---

## 16. Incidents, complaints, and safeguarding

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Incident register** — create and list | All staff | Formal incident record | Live |
| **Incident detail** — parties, evidence, actions, notifications | Managers+ | NDIS incident workflow | Live |
| **NDIS reportable tracking** — commission notification deadlines | Quality+ | Regulatory timeframe visibility | Live |
| **Incident dashboard** — stats and trends | Managers+ | Oversight view | Live |
| **Compliance queue** — incidents needing NDIS action | Quality+ | Nothing missed on reportables | Live |
| **Print incident notification** — formal letter to registry | Managers+ | Documented notification | Live |
| **Complaints register** — feedback and complaints hub | Managers+ | Separate from incidents | Live |
| **Manager override** — senior access on restricted incidents | Senior managers | Escalation path | Live |

---

## 17. Tasks and workflow

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Task hub** — assigned to me, my role, all, past | All staff | Work queue across modules | Live |
| **Assign task** — on any record, to user or role | Coordinators+ | Work routed without email | Live |
| **Action task** — start, complete, cancel | Assignees | Task lifecycle tracked | Live |
| **Task automations** — System-configured rules | System admin | Repeatable task creation | Live |
| **Roster publish tasks** — auto task when roster published | Roster admin | Workers notified in-app | Live |

Workforce communications intentionally use **tasks, not email** for internal workflow (see [MY-WORKPLACE-DEV-NOTES.md](./MY-WORKPLACE-DEV-NOTES.md)).

---

## 18. Documents, print, and email

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Document templates (System)** — layouts for all print types | System admin | Branded HTML/PDF source | Live |
| **Email content (System)** — subject/body for Send via Email | System admin | Consistent participant/plan manager messages | Live |
| **Document registry (System)** — all generated files | System admin | Audit trail of what was produced | Live |
| **Record Documents section** — bottom of record pages: Print, PDF, Send via Email | Role-gated | Consistent UX; saved files + print log on record | Live |

**Document types available today:**

| Document | Typical record | Actions |
|----------|----------------|---------|
| Enquiry acknowledgement | Enquiry | Print, PDF |
| Service agreement / variation | Service agreement | Print, PDF, e-sign |
| Support plan | Client → Support plan | Print, PDF, **Send via Email** |
| Participant statement | Client → Overview | Print statement, PDF statement |
| Consent schedule | Client → Overview | Print consent, PDF consent |
| Invoice | Invoice | Print, PDF, HTML, **Send via Email** |
| Invoice batch | Invoice list | Batch PDF, Batch HTML |
| Claim batch summary | Claim | Print, PDF |
| Remittance cover | Invoice reconciliation | Print, PDF |
| Incident notification | Incident | Print, PDF |
| NDIS audit pack | Audit pack month | Print, PDF |
| Board report pack | Board report | Print, PDF |
| Employee offer / contract / separation | Employee → Documents | Generate, Print, PDF, HTML |

**Send via Email outcome:** Server generates PDF, saves HTML and PDF to registry, opens the staff member’s email app with subject/body from System templates and PDF attached via device share sheet (or downloaded for manual attach on desktop).

---

## 19. AI assistants

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Workspace assistant** — chat on any page | All staff (read) | Answers questions; prepares draft records | Live |
| **Module assistants** — client, enquiry, incident, task, training | Role-gated | Context-aware help on that module | Live |
| **AI prepare record** — draft fields for human review and save | Write roles | Faster data entry; human always saves | Live |
| **AI query audit (System)** — log and investigate AI usage | System admin | Governance over AI interactions | Live |

AI does **not** auto-save records. Staff review drafts and click Save.

---

## 20. Administration and System setup

| Function | Who | Outcome | Status |
|----------|-----|---------|--------|
| **Roles and access** — windows, processes, reports per role | Admin | Least-privilege security model | Live |
| **Organisation profile** — legal entity, branding, bank, GST | System admin | Headers/footers on all documents | Live |
| **Reference data** — dropdowns and lookups | System admin | Consistent coding across modules | Live |
| **User session audit** — login sessions, risk flags | System admin | Security investigation | Live |
| **Process audit** — who ran which business process | System admin | Operational compliance | Live |
| **Record retention settings** | System admin | Policy configuration | Live |
| **Reports hub** — enquiry register and exports | Role-gated | Management information | Live |
| **Page guides** — in-app help drawer per route | All staff | Contextual how-to | Live |

---

## 21. Integrations and explicit non-goals

| Capability | Status | Notes |
|------------|--------|-------|
| Live PRODA claim submission | Planned | Validation and batch build are Live; submission is stub until gateway credentials |
| Outbound SMTP / server email | Not in scope | Send via Email uses device handoff |
| SCHADS payroll calculation | Not in scope | Export verified timesheets to payroll system |
| Participant self-service portal | Planned | Chunk 0; read-only portal MVP on roadmap |
| Live NDIS plan API pull | Planned | Manual import and gateway stub are Live |
| HubSpot live sync | Partial | Dry-run and UI Live; needs production token |

---

## 22. Suggested review path (half day)

A structured walkthrough for an external reviewer:

| Block | Route / action | What to confirm |
|-------|----------------|-----------------|
| 1 — Intake | `/enquiries` → open enquiry → Print acknowledgement → Convert to client | Pipeline, documents, conversion |
| 2 — Participant | `/clients/bp-bern` → Overview, Plan budget, Support plan → Send via Email | Lifecycle, utilisation, documents at bottom |
| 3 — Service setup | Service agreement → Service booking | Lines, compliance hints |
| 4 — Delivery | `/rostering?week=2026-06-09` → publish → `/my/shifts` as worker | Shift → timesheet path |
| 5 — Billing | `/generate-timesheets` → `/timesheet-approval` → `/generate-claims` → `/generate-invoices` | Verified hours → claim → invoice |
| 6 — Invoice send | Invoice detail → **Send via Email** | PDF, registry, email handoff |
| 7 — Reconciliation | Plan / claim / invoice reconciliation dashboards | Finance visibility |
| 8 — Governance | `/incidents/dashboard`, `/complaints` | Safeguarding registers |
| 9 — Audit | `/ndis-audit-pack`, `/board-reporting` | Reporting depth |
| 10 — System | Document templates, Email content, Document registry, Roles | Configuration and audit |

**Test users:** See [testing/HAPPY-PATH-E2E-MATRIX.md §2](./testing/HAPPY-PATH-E2E-MATRIX.md).

---

## 23. Related documentation

| Document | Use |
|----------|-----|
| [SCOPE-ROADMAP.md](./SCOPE-ROADMAP.md) | Phased backlog and chunk status |
| [BUILD-PROGRESS.md](./BUILD-PROGRESS.md) | What shipped and how to test each slice |
| [processes/README.md](./processes/README.md) | Numbered business processes (convert, approve, assign) |
| [testing/HAPPY-PATH-E2E-MATRIX.md](./testing/HAPPY-PATH-E2E-MATRIX.md) | End-to-end test flows and FUNC matrix |
| [testing/UAT-INDEX.md](./testing/UAT-INDEX.md) | Full UAT catalogue |
| [scope/README.md](./scope/README.md) | Master scope authority and architecture decisions |

---

## 24. Document control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-06-23 | AbilityAPP build team | Initial reviewer function guide |

For corrections after a review session, log gaps in [testing/ISSUE-LOG-TEMPLATE.md](./testing/ISSUE-LOG-TEMPLATE.md) and update this guide when functions ship or labels change.
