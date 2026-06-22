# UAT-15 — Business processes

**Pack:** UAT-15 | **Priority:** P1 | **Owner:** Mixed personas

Maps to `docs/processes/processes.json` and `ACCESS_PROCESSES` in catalog.

## Process scenarios

| UAT ID | Process ID | Actor | Trigger | Pass if | Doc | Result |
|--------|------------|-------|---------|---------|-----|--------|
| UAT-15-P-001 | `enquiry-to-client` | Coordinator | Convert button | Client + Converted enquiry | [01](../processes/01-enquiry-to-client.md) | |
| UAT-15-P-002 | `assign-employee-credential` | HR | Credentials tab | Line + audit | [02](../processes/02-assign-employee-credential.md) | |
| UAT-15-P-003 | `assign-location-client` | Coordinator | Location clients tab | Assignment line | [03](../processes/03-assign-location-client.md) | |
| UAT-15-P-004 | `assign-location-employee` | HR | Location employees tab | Assignment line | [04](../processes/04-assign-location-employee.md) | |
| UAT-15-P-005 | `assign-location-product` | Admin | Location products tab | Product line | [05](../processes/05-assign-location-product.md) | |
| UAT-15-P-006 | `assign-task` | Any | Record tasks panel | Task created | [06](../processes/06-assign-task.md) | |
| UAT-15-P-007 | `action-task` | Assignee | Task detail | Status updated | [07](../processes/07-action-task.md) | |
| UAT-15-P-008 | `submit-leave-request` | Worker | `/my/leave` | Approval task | [08](../processes/08-submit-leave-request.md) | |
| UAT-15-P-009 | `submit-employee-credential` | Worker | `/my/credentials` | HR review task | [09](../processes/09-submit-employee-credential.md) | |
| UAT-15-P-010 | `submit-leave-on-behalf` | Manager | Workforce planning | Leave row | [10](../processes/10-submit-leave-on-behalf.md) | |
| UAT-15-P-011 | `review-employee-credential` | HR | Review queue | Approved/rejected | [11](../processes/11-review-employee-credential.md) | |
| UAT-15-P-012 | `approve-leave-request` | Manager | Review queue | Balance updated | [12](../processes/12-approve-leave-request.md) | |
| UAT-15-P-013 | `financial-month-close` | Finance | Financial close | Month close or blockers | [13](../processes/13-financial-month-close.md) | |

## Document / print processes

Spot-check from `ACCESS_PROCESSES` (print invoice, enquiry ack, separation letter, audit pack, etc.) — one print per module during UAT-07, UAT-01, UAT-10, UAT-08.

## Full process inventory

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **Processes (UAT-15)**.
