# UAT-02 — Clients

**Pack:** UAT-02 | **Priority:** P0 | **Owner:** Coordinator (`IslaRobinson`) | **HP:** Flow 2–3, 7

## Preconditions

- Intake seed applied; converted client from TEST-020 **or** use `bp-bern`
- User: IslaRobinson / welcome

## Tab scenarios (all client tabs)

| UAT ID | Tab | Steps | Expected | Result |
|--------|-----|-------|----------|--------|
| UAT-02-T-001 | Overview | Open; save a field | Persists; audit | |
| UAT-02-T-002 | Alerts | Add alert line | Line table + audit | |
| UAT-02-T-003 | Activity | Add case note | HP-061 pattern | |
| UAT-02-T-004 | Full profile | Lifecycle intake → active → exit (`bp-e2e-exit`) | Filter + exit reason | |
| UAT-02-T-005 | BP Associations | Link plan manager BP | Saves | |
| UAT-02-T-006 | Locations | Assign location line | Process 03 | |
| UAT-02-T-007 | Incidents | View linked incidents | List navigates | |
| UAT-02-T-008 | Requests | View / add task link | Tasks panel | |
| UAT-02-T-009 | Restrictive Practices | Add line | Persists | |
| UAT-02-T-010 | Consents and Legal Orders | Add consent | Persists | |
| UAT-02-T-011 | Plan budget | Lines + rollup panel | HP-041, HP-079 | |
| UAT-02-T-012 | Monthly service plan | Edit plan | Persists | |
| UAT-02-T-013 | Plan & Assessment | Edit section | Persists | |
| UAT-02-T-014 | Support Plan | Edit section | HP-033 | |
| UAT-02-T-015 | Goals | Add goal line | Persists | |
| UAT-02-T-016 | Progress Review | Add review | Persists | |
| UAT-02-T-017 | Contact Activity | Add contact row | Persists | |
| UAT-02-T-018 | Risks | Add risk with alert | Persists | |
| UAT-02-T-019 | Service agreements | Tab list → open SA | Links work | |
| UAT-02-T-020 | Service bookings | Tab list → open booking | Links work | |
| UAT-02-T-021 | Roster of care | View/edit RoC template | Persists | |
| UAT-02-T-022 | Needs and Rules | Add need line | Persists | |
| UAT-02-T-023 | Billing and communication | Plan manager + invoice prefs | HP-042 | |

## Integration scenarios

| UAT ID | Scenario | Expected | HP | Result |
|--------|----------|----------|-----|--------|
| UAT-02-S-001 | Convert from enquiry | Client + enquiry link | TEST-020 | |
| UAT-02-S-002 | Print participant statement | Document registry | process | |
| UAT-02-S-003 | Print consent schedule | Document registry | process | |
| UAT-02-S-004 | Participant exit | `bp-e2e-exit` lifecycle exit | TEST-095 | |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-02**.

## Outcomes

- [ ] All 22 tabs exercised  
- [ ] Exit lifecycle on disposable client  
- [ ] Sign-off in [UAT-SIGNOFF.md](../UAT-SIGNOFF.md)
