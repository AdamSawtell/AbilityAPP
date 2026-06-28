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
| `npx tsc --noEmit` | PASS (exit 0) |
| page-guides:check | PASS (131 routes) |
| Migration push | PASS (`20260728120000`) |
| Localhost smoke | PASS (see below) |
| Amplify smoke | PASS (2026-06-28 — 108 scanned / 81 impacts; consent gate; help links) |
| Bugbot | PASS (2 HIGH fixed — batch status + apply re-check) |

## Localhost smoke result (2026-06-28)

End-to-end run against the remote Supabase project:

1. Applied the 2026–27 sample CSV in the NDIS Price Guide Importer → 3 new, 6 updated, 0 errors.
2. Price Dependant Updater → selected the applied batch → **Run impact analysis** →
   **108 scanned, 82 impacts** (Consent required 46, Protected 34, Review required 2, Safe 0).
3. Active/signed agreements correctly classified **Consent required** (apply blocked, 0 ready to apply).
4. Recorded `evidenceRef`, **Approve for apply** → row moved to **1 ready to apply** (consent guard works).
5. **Apply approved updates** → `Applied 1 update(s)`; `price_update_run` persisted with
   `status=applied, applied_count=1, impact_count=82, scanned_count=108`; one `price_update_impact`
   row `apply_status=applied`. No FK errors.

## Bugs found and fixed during smoke (same slice)

1. **AB-0011 apply wrote children before parents** — products/price lists were upserted before the
   import batch existed, and `ndis_price_import_row.matched_product_id` / `price_list_line.product_id`
   violated their FKs. Fixed by persisting in FK order: batch → price list header → product →
   price list (with lines) → import rows. Added `savePriceListHeader` to break the
   `product` ↔ `price_list_line` cycle. (`ndis-price-importer-page.tsx`, `data-api.ts`)
2. **Supabase errors hidden behind generic copy** — Supabase/PostgREST errors are not `Error`
   instances, so failures showed a bare "Apply failed." Added `describeError` to surface the real
   message/details. (`ndis-price-importer-page.tsx`)
3. **AB-0012 analysis scanned 0 records** — the page read location-scoped `useData` collections,
   which are empty in the System context (no workspace session). Now loads the unscoped dataset via
   `fetchAllData` and writes changed records straight to Supabase
   (`saveServiceAgreement/Booking/MonthlyServicePlan/Claim/Invoice`). (`price-update-review-page.tsx`)
4. **Batch marked applied before children persisted** — the first batch save wrote terminal
   `applied` status and cleared import rows; a mid-sequence failure left an orphan applied batch.
   Fixed by writing the batch with `validated` status first, then committing `applied` + rows only
   after all child writes succeed. (`ndis-price-importer-page.tsx`)
5. **Apply skipped live status re-check** — apply used analysis-time classifications even though
   records were reloaded at apply time. A draft agreement signed after analysis could still be
   price-mutated. Fixed by re-running `classifyAgreement/Booking/Claim/Invoice/MonthlyPlan` on the
   live record before each mutation; status changes since analysis skip with a re-review message.
   (`price-update-engine.ts`)

## Test scenario (repeatable)

1. Apply AB-0011 import (2026–27 sample or production CSV).
2. Open Price Dependant Updater → select batch → Run impact analysis.
3. Confirm an Active/Signed service agreement shows **Consent required** with **0 ready to apply**.
4. Record an evidence reference → **Approve for apply** → row becomes ready; or **Create variation task**.
5. Tick the confirmation → **Apply approved updates**.
6. Verify the agreement/booking line rate updated and `price_update_run` shows `applied_count`.

## Amplify smoke result (2026-06-28)

Live `https://app.abilityvua.com` after push `51a0057`:

1. `/system/services/ndis-price-importer` — page loads; import history shows multiple applied batches; link to Price Dependant Updater resolves.
2. `/system/services/price-update-review` — select applied batch → **Run impact analysis** → **108 scanned, 81 impacts** (Consent required 45, Protected 34, Review required 2).
3. Active service agreement (e.g. AMHA16) shows **Consent required** with **0 ready to apply**; apply button disabled without evidence.
4. Run history shows prior applied run (82 impacts) and new analysed run; help guide link present.
