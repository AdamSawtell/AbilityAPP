# AB-0012 — Price Dependant Updater — implementation handoff

**Date:** 2026-06-28  
**Status:** Shipped  
**Depends on:** AB-0011 applied import batch

## Summary

Controlled price-change impact workflow: select an applied AB-0011 batch, dry-run analysis, classify dependent records, preview old/new rates, approve or create variation tasks, apply only safe/approved rows from the effective date.

## Routes and files

| Item | Path |
|------|------|
| System route | `/system/services/price-update-review` |
| UI | `web/src/components/system/price-update-review-page.tsx` |
| Engine | `web/src/lib/price-update-engine.ts` |
| Types | `web/src/lib/price-update.ts` |
| Migration | `supabase/migrations/20260728120000_price_update_run_foundation.sql` |
| Help | `web/src/lib/help/articles/price-update-review.ts` |

## Assumptions

1. **Region:** Defaults to National — no client Remote/Very Remote flag yet; review when multi-region prices differ.
2. **Plan budgets:** Impacts flagged for review; funding totals (`allocatedAmount`) are never auto-updated.
3. **Active/Signed agreements:** `consent_required` — apply blocked until `evidenceRef` recorded and decision approved.
4. **Protected billing:** Submitted/accepted claims; Sent/Paid/Void invoices — no mutation.
5. **Historical dates:** Booking/claim lines before effective start classified protected or no action.
6. **Tasks:** Variation tasks use `tt-review` assigned to `role-coordinator`.

## Done evidence matrix

| Check | Result |
|-------|--------|
| Dev build | PASS |
| page-guides:check | PASS (131 routes) |
| Migration push | PASS (`20260728120000`) |
| Localhost smoke | NOT RUN |
| Amplify smoke | NOT RUN (after deploy) |
| Bugbot | NOT RUN |

## Test scenario

1. Apply AB-0011 import (2026–27 sample or production CSV).
2. Open Price Dependant Updater → select batch → Run impact analysis.
3. Confirm Active service agreement (`sa-rose-ni`) shows **Consent required**.
4. Create variation task — verify task appears in Tasks.
5. Approve safe draft booking row → Apply approved updates.
6. Verify booking line rate updated; agreement unchanged without evidence.
