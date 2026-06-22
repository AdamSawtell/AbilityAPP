# UAT-01 — Enquiries & CRM

**Pack:** UAT-01 | **Priority:** P0 | **Owner:** Intake (`GabrielaWilson`) | **HP:** Flow 1–2

## Preconditions

- `npm run supabase:seed-e2e-intake`
- User: GabrielaWilson / welcome (Intake Coordinator)

## Scenarios

| UAT ID | Scenario | Steps | Expected | HP | Result |
|--------|----------|-------|----------|-----|--------|
| UAT-01-S-001 | List + audit | Open `/enquiries` | List loads; audit module label; cross-sell if client access | HP-001 | **Pass** — 27 enquiries; Enquiries sidebar |
| UAT-01-S-002 | New enquiry | `/enquiries/new` — fill required fields; save | Record opens; audit footer | HP-002 | **Pass** — New enquiry link; TEST-010 prior |
| UAT-01-S-003 | Pipeline progression | `1000013`: Received → Qualification → Proposal | Transitions enforced; loss path separate | HP-003–005 | **Pass** — `1000025` at Proposal |
| UAT-01-S-004 | Qualification tab | NDIS fields; save | Score + tier + summary update | HP-004 | **Pass** — TEST-010 prior |
| UAT-01-S-005 | Activity lines | Add phone call line | Persists; audit diff | HP-006 | **Pass** — TEST-010 prior |
| UAT-01-S-006 | Print acknowledgement | Print from enquiry | Preview + document registry row | HP-007 | **Pass** — TEST-011 prior |
| UAT-01-S-007 | External CRM panel | HubSpot sync (dry-run OK) | Message or stored contact id | HP-008 | **Pass** — HubSpot panel; sync disabled without token |
| UAT-01-S-008 | Task on enquiry | Assign task from record | Task linked to enquiry entity | HP-009 | **Pass** — TEST-011 prior |
| UAT-01-S-009 | Lost enquiry | `1000014` → Lost + reason | Status `5_Lost`; reason saved | HP-010 | **Pass** — Lost + No response from enquirer saved |
| UAT-01-S-010 | Convert guard | Unsaved edits | Convert disabled until save | HP-028 | **Pass** — Convert disabled on unsaved Lost edit |
| UAT-01-S-011 | Enquiry tabs | All tabs: Details, Qualification, Activity, Participant, Support needs | Each saves; audit | FUNC-100–109 | **Pass** — tabs on `1000025`; audit footer |

## Window checklist

Complete every row in [UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-01**.

## Outcomes

- [x] All P0 scenarios Pass  
- [x] Window checklist ≥ 95% Pass (remainder documented)  
- [x] Defects logged with UAT-01 prefix  
- [x] Sign-off row updated in [UAT-SIGNOFF.md](../UAT-SIGNOFF.md)
