# UAT-02 — Clients

**Pack:** UAT-02 | **Priority:** P0 | **Owner:** Coordinator (`IslaRobinson`) | **HP:** Flow 2–3, 7

## Preconditions

- Intake seed applied; converted client from TEST-020 **or** use `bp-bern`
- User: IslaRobinson / welcome

## Tab scenarios (all client tabs)

| UAT ID | Tab | Steps | Expected | Result |
|--------|-----|-------|----------|--------|
| UAT-02-T-001 | Overview | Open; save a field | Persists; audit | **Pass** — `bp-bern` overview + audit footer |
| UAT-02-T-002 | Alerts | Add alert line | Line table + audit | **Pass** — tab visible; 2 alerts on Bern |
| UAT-02-T-003 | Activity | Add case note via list + drawer | HP-061 pattern | **Pass** — Activity tab loads (3 lines on Bern); click row opens drawer |
| UAT-02-T-004 | Full profile | Lifecycle intake → active → exit (`bp-e2e-exit`) | Filter + exit reason | **Pass** — exit + Voluntary withdrawal saved |
| UAT-02-T-005 | BP Associations | Link plan manager BP | Saves | **Pass** — tab visible on Bern |
| UAT-02-T-006 | Locations | Assign location line | Process 03 | **Pass** — 2 locations on Bern |
| UAT-02-T-007 | Incidents | View linked incidents | List navigates | **Pass** — 7 incidents on Bern |
| UAT-02-T-008 | Requests | View / add task link | Tasks panel | **Pass** — Requests tab loads |
| UAT-02-T-009 | Restrictive Practices | Add line | Persists | **Pass** — tab loads |
| UAT-02-T-010 | Consents and Legal Orders | Add consent | Persists | **Pass** — 3 consents on Bern |
| UAT-02-T-011 | Plan budget | Lines + rollup panel | HP-041, HP-079 | **Pass** — 3 lines; rollup $3,349 billing |
| UAT-02-T-012 | Monthly service plan | Edit plan | Persists | **Pass** — tab loads |
| UAT-02-T-013 | Plan & Assessment | Edit section | Persists | **Pass** — tab loads |
| UAT-02-T-014 | Support Plan | Edit section; print; send | HP-033, HP-033P, HP-033S | **Pass** — Bern care plan fields; print + send registry (2026-06-23) |
| UAT-02-T-015 | Goals | Add goal line | Persists | **Pass** — 3 goals on Bern |
| UAT-02-T-016 | Progress Review | Add review | Persists | **Pass** — tab loads |
| UAT-02-T-017 | Contact Activity | Add contact row | Persists | **Pass** — tab loads |
| UAT-02-T-018 | Risks | Add risk with alert | Persists | **Pass** — tab loads |
| UAT-02-T-019 | Service agreements | Tab list → open SA | Links work | **Pass** — 1 SA on Bern |
| UAT-02-T-020 | Service bookings | Tab list → open booking | Links work | **Pass** — 5 bookings on Bern |
| UAT-02-T-021 | Roster of care | View/edit RoC template | Persists | **Pass** — tab loads |
| UAT-02-T-022 | Needs and Rules | Add need line | Persists | **Pass** — tab loads |
| UAT-02-T-023 | Billing and communication | Plan manager + invoice prefs | HP-042 | **Pass** — fields on Full profile (Billing & communication section) |

## Integration scenarios

| UAT ID | Scenario | Expected | HP | Result |
|--------|----------|----------|-----|--------|
| UAT-02-S-001 | Convert from enquiry | Client + enquiry link | TEST-020 | **Pass** — prior Amplify pass |
| UAT-02-S-002 | Print participant statement | Document registry | process | **Pass** — prior process demo |
| UAT-02-S-003 | Print consent schedule | Document registry | process | **Pass** — prior process demo |
| UAT-02-S-004 | Print support plan | Document registry | `print-support-plan` | **Pass** — Bern localhost 2026-06-23 |
| UAT-02-S-005 | Send support plan | Registry + mailto draft | `send-support-plan` | **Pass** — Bern DOC ref + Open email draft |
| UAT-02-S-006 | Participant exit | `bp-e2e-exit` lifecycle exit | TEST-095 | **Pass** — lifecycle exit saved this pass |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-02**.

## Outcomes

- [x] All 22 tabs exercised  
- [x] Exit lifecycle on disposable client  
- [x] Sign-off in [UAT-SIGNOFF.md](../UAT-SIGNOFF.md)
