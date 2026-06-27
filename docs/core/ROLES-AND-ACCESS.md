# AbilityVua — roles and access reference

**Audience:** Access administrators, reviewers, and BAs configuring who can use which functions — without reading every window key in seed SQL.  
**Pair with:** [WINDOWS-AND-TABS.md](./WINDOWS-AND-TABS.md) (full window key list), [PROCESSES-AND-WORKFLOWS.md](./PROCESSES-AND-WORKFLOWS.md) (what processes do), [SYSTEM-FUNCTION-GUIDE.md](./SYSTEM-FUNCTION-GUIDE.md) (function outcomes).  
**Version:** 1.1  
**Last updated:** 23 June 2026 (participant portal access)

**Demo environment:** Staff password `welcome`; SuperUser `flamingo` on [Amplify demo](https://app.abilityvua.com).

---

## 1. How access works

| Layer | Grant | Effect |
|-------|-------|--------|
| **Role** | User assigned one or more roles (`app_user_role`) | Union of all role grants |
| **Window** | Off / Read / Write per `window_key` (`app_role_window`) | Sidebar, tabs, save buttons |
| **Process** | On/Off per `process_id` (`app_role_process`) | Print, send, convert, approve — requires **Write** on parent tab |
| **System** | System sign-in | System routes — not role-granted in workspace |

**Admin UI:** Workspace → **Admin → Roles** (`/admin/roles`).

**Code source of truth:** `web/src/lib/access/catalog.ts`, `supabase/seed-access.sql`, `web/src/lib/access/use-detail-write-access.ts`.

**Rules:**

- Child tab windows require parent module window (e.g. `client-support-plan` needs `clients`).
- **Read** = view only; **Write** = save + eligible for processes on that tab.
- Hiding a sidebar module hides entry; direct URL still blocked without window grant.

---

## 2. Demo roles (personas)

| Role key | Label | Primary persona | Spine flows |
|----------|-------|-----------------|-------------|
| `role-admin` | AbilityVua Admin | SuperUser default — full catalog access | All |
| `role-intake` | Intake Coordinator | GabrielaWilson | 1–2 Enquiry → convert |
| `role-coordinator` | Support Coordinator | IslaRobinson | 2–5 Client, plan, agreements, bookings |
| `role-rostering-manager` | Rostering Manager | RileyShaw | 4 Delivery, roster, timesheets |
| `role-support-worker` | Support Worker | OliverWilliams | 4–5 My shifts, timesheets, activity |
| `role-team-leader` | Team Leader | PiperCollins | Timesheet approval |
| `role-finance-officer` | Finance Officer | JessicaHancock | 5 Claims, invoices, generate |
| `role-finance-manager` | Finance Manager | TessaNguyen | 5, 9 Reconciliation, financial close |
| `role-hr-manager` | HR Manager | HR demo user | 6, 8 Employees, workforce |
| `role-quality-manager` | Quality Manager | Quality demo user | 10–11 Incidents, audit pack |

Additional seeded roles: `role-board`, `role-ceo`, exec roles, `role-rostering-officer`, `role-hr-officer`, `role-quality-officer`, `role-security-admin`, `role-audit-viewer` — see `seed-access.sql`.

---

## 3. Access by function area

Aligned with [SYSTEM-FUNCTION-GUIDE.md](./SYSTEM-FUNCTION-GUIDE.md) sections.

### §4 Enquiries and intake

| Function | Typical roles | Windows (minimum) | Processes |
|----------|---------------|-------------------|-----------|
| Enquiry register + edit | Intake, Admin | `enquiries` + enquiry tabs (write) | — |
| Convert to client | Intake, Coordinator, Admin | `enquiries` (write) | `enquiry-to-client` |
| Print acknowledgement | Intake, Admin | enquiry tabs (write) | `print-enquiry-acknowledgement` |

### §5 Clients and participants

| Function | Typical roles | Windows | Processes |
|----------|---------------|---------|-----------|
| Client register + core tabs | Coordinator, Admin | `clients` + tab keys (write) | — |
| Support plan edit | Coordinator, Admin | `client-support-plan` (write) | — |
| Print / Send support plan | Coordinator, Intake, Quality, Team leader, Admin | `client-support-plan` (write) | `print-support-plan`, `send-support-plan` |
| Plan budget | Coordinator, Admin | `client-plan-budget` (write) | — |
| Overview documents | Coordinator, Admin | `client-overview` (write) | `print-participant-statement`, `print-consent-schedule` |
| Lifecycle exit | Coordinator, Admin | `client-full-profile` (write) | — |

### §6 Locations and business partners

| Function | Typical roles | Windows | Processes |
|----------|---------------|---------|-----------|
| Location CRUD | Admin, Coordinator (read) | `locations` + tabs | `assign-location-*` |
| Location-scoped visibility | Support Worker, Coordinator, Team Leader, Officers | `locations` (no `locations-see-all`) | Employees see only assigned locations and linked clients |
| Unrestricted location access | Admin, Executives, Managers | `locations-see-all` | Org-wide locations and clients (same pattern as `incidents-see-all`) |
| Business partners | Admin, Finance | `business-partners` | — |

### §7–8 Agreements and bookings

| Function | Typical roles | Windows | Processes |
|----------|---------------|---------|-----------|
| Service agreements | Coordinator, Admin | `service-agreements` + tabs | `print-service-agreement` |
| Service bookings | Coordinator, Rostering, Admin | `service-bookings` + tabs | — |
| Products / price lists | Admin | `products`, `price-lists` | — |

### §9 Planning and rostering

| Function | Typical roles | Windows | Processes |
|----------|---------------|---------|-----------|
| Service planning | Rostering, Admin | `service-planning`, `multi-provider-budget` | — |
| Rostering publish | Rostering Manager, Admin | `rostering` (write) | — |
| Agency coverage workflow | Rostering Manager, Rostering Officer, Coordinator, Exec Ops, Admin | `rostering` (write), `agency-workers` (write) | `request-agency-coverage`, `send-agency-shift-pack`, `confirm-agency-shift`, `complete-agency-shift` |
| Buddy shifts | Rostering Manager, Team Leader, Coordinator (Support Coordinator), Admin | `rostering` (write), `admin-organization` (system settings) | — (window-write; no numbered process) |
| Open shifts | Support Worker | `my-open-shifts` | — |
| Contact Rostering | All staff; assigned to Rostering Officer | `my-open-shifts`, `my-shifts`, task views | `tt-rostering-communication` task type |

### §10–11 My workplace and timesheets

| Function | Typical roles | Windows | Processes |
|----------|---------------|---------|-----------|
| My shifts / check-in | Support Worker | `my-shifts` (write) | — |
| My timesheets | Support Worker | `my-timesheets` (write) | — |
| Submit leave | All staff | `my-leave` (write) | `submit-leave-request` |
| Submit credentials | All staff | `my-credentials` (write) | `submit-employee-credential` |
| Rostering communication history | All staff creator; Rostering Officer assignee | `my-open-shifts`, `my-shifts`, `tasks-for-my-role` | `tt-rostering-communication` see/create/action |
| Generate timesheets | Rostering, Team leader, Admin | `generate-timesheets` (write) | — |
| Approve timesheets | Team leader, Rostering, Admin | `timesheet-approval` (write) | `approve-timesheet` |

### §12–13 Claims and invoices

| Function | Typical roles | Windows | Processes |
|----------|---------------|---------|-----------|
| Generate claims | Finance Officer+, Admin | `generate-claims` (write) | — |
| Claims register | Finance Officer+, Admin | `claims` | `print-claim-batch` |
| Generate invoices | Finance Officer+, Admin | `generate-invoices` (write) | — |
| Invoices + Send via Email | Finance Officer+, Admin | `invoices` (write) | `print-invoice`, `batch-print-invoices`, `send-invoice` |
| Vendor invoices AP-lite | Finance Manager+, Admin | `vendor-invoices` (write) | `approve-vendor-invoice`, `mark-vendor-invoice-paid` |

### §14 Reconciliation and reporting

| Function | Typical roles | Windows | Processes |
|----------|---------------|---------|-----------|
| Plan / claim / invoice reconciliation | Finance Manager+, Admin | `plan-reconciliation`, `claim-reconciliation`, `invoice-reconciliation` | `print-remittance-cover` |
| Financial close | Finance Manager, Admin | `financial-close` | `financial-month-close` |
| NDIS audit pack / board report | Quality, Exec, Admin | `ndis-audit-pack`, `board-reporting` | `print-audit-pack`, `print-board-report` |
| Reports hub | Most roles (varies) | `reports` | — |

### §15 Workforce / HR

| Function | Typical roles | Windows | Processes |
|----------|---------------|---------|-----------|
| Employee HR file | HR Manager, Admin | `employees` + tabs | `assign-employee-credential` |
| Generate HR documents | HR Manager, Admin | `employee-documents` (write) | `print-employee-offer`, `print-employee-contract`, `print-employee-separation` |
| Workforce planning / leave on behalf | HR Manager, Admin | `workforce-planning` | `submit-leave-on-behalf`, `approve-leave-request`, `review-employee-credential` |
| Training and meeting scheduling | HR Manager, Team Leader, Admin | `training-meetings` (write), `rostering` (read/write for roster view) | — (window-write; attendance sign-off is in-module) |
| Agency worker register | Rostering Manager, Coordinator, Admin | `agency-workers` (write) | — (coverage processes on rostering) |

### §16 Incidents and complaints

| Function | Typical roles | Windows | Processes |
|----------|---------------|---------|-----------|
| Report incident | All staff (varies) | `incidents` + tabs | `report-incident` |
| NDIS notification | Quality, Admin | incident tabs (write) | `notify-ndis-reportable` |
| List / submit | Support Worker | `incidents` (write) | `report-incident` — sees **My incidents** (own open reports only) |
| See all / dashboard | Manager, Quality, Coordinator | `incidents-see-all` | Full register + summary cards + `/incidents/dashboard` |
| Complaints | Manager, Quality | `complaints` | — |
| Manager override | Senior manager | `incident-manager-override` | — |

### §17 Tasks

| Function | Typical roles | Windows | Processes |
|----------|---------------|---------|-----------|
| Task hub | All | `tasks`, `tasks-assigned-to-me`, etc. | `action-task` |
| Assign on record | Coordinators, managers | Parent record tab (write) | `assign-task` |
| Request activity line removal | Staff with activity write (non-admin) | Activity tab on client, enquiry, employee, or location | `request-activity-deletion` |
| Remove activity line | **AbilityVua Admin only** | Same Activity tabs | — (direct Remove in line drawer) |

### §18–20 Documents, AI, admin

| Function | Typical roles | Access path |
|----------|---------------|-------------|
| Document templates / email content | System operator | System sign-in → Tasks |
| Document registry | System operator | System → Document registry |
| AI prepare record | Write on target module | Process `ai-prepare-record` |
| Workspace roles admin | Admin | `admin-roles` |
| Session / process / AI audit | Security, Admin | System → Admin |

---

## 4. Windows vs processes (examples)

| User goal | Need window | Need process |
|-----------|-------------|--------------|
| View client Support Plan | `clients` + `client-support-plan` (read) | — |
| Edit support plan goals | `client-support-plan` (write) | — |
| Send plan via email | `client-support-plan` (write) | `send-support-plan` |
| View invoices | `invoices` (read) | — |
| Issue invoice to plan manager | `invoices` (write) | `send-invoice` |
| Convert enquiry | `enquiries` (write) | `enquiry-to-client` |

A user with **Write** on invoices but **without** `send-invoice` can edit records but will not see **Send via Email**.

---

## 5. Multi-role users (demo)

| User | Roles | Why |
|------|-------|-----|
| SuperUser | All active roles (always, including new roles) | Full regression and role-switch testing |
| IslaRobinson | `role-intake` + `role-coordinator` | Intake through service delivery |
| GabrielaWilson | `role-intake` | Enquiry-focused testing |

Sign out and back in after `seed-access.sql` changes so session reloads window keys.

**SuperUser:** The `SuperUser` login always receives every active workspace role for sign-in and role switching — including roles added after the last seed. Runtime logic in `web/src/lib/access/superuser.ts` grants this; re-running `npm run supabase:seed-access` also writes all current roles to `app_user_role` for that user.

---

## 6. Participant portal (not workspace roles)

| Function | Who | Access model |
|----------|-----|--------------|
| Portal sign-in | Participant | Email on `client` record — magic link |
| My services / funding | Participant | Portal session cookie only |
| Submit service request | Participant | Portal session |
| Review portal request | Coordinator+ | Workspace `clients` + **Requests** tab (write) |
| Approve → variation draft | Coordinator+ | Task panel + `approve` API |

Portal routes (`/portal/*`) are **not** in `app_role_window`. Staff never use portal for their own work — they use workspace.

**Demo:** [Amplify portal login](https://app.abilityvua.com/portal/login) — `Bernie@email` → **Email me a sign-in link** → **Open portal** (demo link). Not linked from staff sidebar.

---

## 7. System access (not workspace roles)

| Area | Who |
|------|-----|
| Organisation profile, reference data | Any System sign-in |
| Task management, automations, document templates | System operator |
| User / process / AI audit | System operator with audit windows |
| Reports Advance (SQL) | System — restricted operators |

Workspace **Admin → Roles** does not grant System routes.

---

## 8. Configuring a new function (checklist)

When shipping a new user-facing function:

1. Register **window** (and tab windows) in `catalog.ts`
2. Register **process** if there is a button action
3. Add grants to `supabase/seed-access.sql` (or org-specific SQL)
4. Update **this doc** — §3 row for the function area
5. Update [WINDOWS-AND-TABS.md](./WINDOWS-AND-TABS.md)
6. Run `npm run uat:inventory` and refresh UAT packs

---

## 9. Maintenance checklist

Update this file when you:

- [ ] Add roles or change persona purpose in seed
- [ ] Change default grants for a function area
- [ ] Add process that should be limited to specific roles
- [ ] Split or merge roles for a module

Full grant matrix: `supabase/seed-access.sql` (authoritative detail).

---

## 10. Document control

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-06-23 | Initial roles and access reference |
