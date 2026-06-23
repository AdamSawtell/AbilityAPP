# Process 13 — Financial month close

**Status:** Live  
**Trigger:** Finance user opens Financial close and marks a month closed after checklist passes.

## Purpose

Confirm plan delivery, NDIS remittance, participant invoices, and payroll reconciliation before signing off a calendar month. Aligns with the Financial close screen checklist in AbilityVua.

## Preconditions

- User has **Financial close** window (write) and **send-invoice** / billing processes as required by your org.
- Close month selected matches claim, invoice, and plan activity you are closing.

## Steps

| Step | Action | System | Pass if |
|------|--------|--------|---------|
| 1 | Open **Delivery → Financial close** | `/financial-close` | Checklist loads for selected month |
| 2 | Resolve **Plan vs actual** blocks | `/plan-reconciliation` | No block status on plan variance rows |
| 3 | Resolve **Claim remittance** gaps | `/claim-reconciliation` | Claims imported and matched or explained |
| 4 | Clear **Draft invoices** for the month | `/invoices` | No draft invoices overlapping close month |
| 5 | Complete **Payroll period close** | Payroll close records | No payroll block checks on timesheets |
| 6 | Run **Invoice reconciliation** | `/invoice-reconciliation` | Plan-managed invoices reconciled |
| 7 | Review **NDIS audit pack** (optional) | `/ndis-audit-pack` | No blocked sections for the month |
| 8 | Export CSV evidence | Financial close → Export CSV | File downloads with checklist snapshot |
| 9 | Mark month closed | Financial close → Mark month closed | Month appears in closed months; audit logged |

## Checklist mapping (AbilityVua codes)

| Process step | `evaluateFinancialClose` code |
|--------------|-------------------------------|
| Plan delivery | `plan` |
| Claim remittance | `claims` |
| Draft invoices | `invoices` |
| Payroll | `payroll` |
| Invoice reconciliation | `invoice-reconcile` |

## Related processes

- Plan reconciliation, claim reconciliation, invoice reconciliation (in-app)
- NDIS audit pack export for compliance evidence
- Board reporting uses financial close readiness in executive summary

## Entry points

- `web/src/components/financial-close-pages.tsx`
- `web/src/components/financial-close-month-panel.tsx`
- `web/src/lib/financial-close.ts`

## Tables

- `financial_closed_month`
- Reads: `monthly_service_plan`, `timesheet`, `claim`, `invoice`, `payroll_period_close`
