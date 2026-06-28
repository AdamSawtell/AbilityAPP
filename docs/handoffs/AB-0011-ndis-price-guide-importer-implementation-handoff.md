# AB-0011 — NDIS Price Guide Importer — implementation handoff

**Date:** 2026-06-28  
**Status:** Shipped (foundation + importer UI/apply)  
**Next:** AB-0012 Price Dependant Updater (not started)

## Summary

AB-0011 delivers a System-surface NDIS price guide importer: CSV upload, format detection, validation preview, explicit apply to master products and price lists, import batch history, and revert. Service agreements, bookings, claims, and invoices are intentionally unchanged.

## Routes and files

| Item | Path |
|------|------|
| System route | `/system/services/ndis-price-importer` |
| UI | `web/src/components/system/ndis-price-importer-page.tsx` |
| Parser/types | `web/src/lib/ndis-price-import.ts` |
| Preview/apply engine | `web/src/lib/ndis-price-import-engine.ts` |
| Help article | `web/src/lib/help/articles/ndis-price-importer.ts` |
| Sample CSV | `web/fixtures/ndis-price/sample-2026-27-update.csv` |
| Migrations (Stage 0) | `20260727160000_ndis_price_import_foundation.sql`, `20260727161000_ndis_price_import_foundation_safety.sql` |

## Assumptions

1. **Natural key:** `support_item_number` only — never match products by name.
2. **Historical prices:** New imports append effective-dated regional rows; existing windows are not overwritten.
3. **New products:** `active=true`, `sold=false` until enabled in Products.
4. **Baseline order:** 2026–27 import before 2025–26 baseline shows a warning, not a hard block.
5. **Revert:** Removes price lines and deactivates products tied to the batch `sourceImportBatchId`.
6. **AB-0012 handoff:** `ndisImportHandoffRows()` filters applied rows with add/update/end-date actions for future dependant updater.

## Supported CSV formats

- `ndis-2025-26-wide` / `ndis-2025-26-long`
- `ndis-2026-27-update` / `ndis-2026-27-long`
- `abilityvua-template`

Full production files live outside the repo under the NDIS Price Guides folder (Obsidian path in scope pack).

## Verification checklist

- [ ] System login → Services → NDIS Price Guide Importer loads with audit footer
- [ ] Upload sample or production CSV — preview counts render
- [ ] Apply blocked until confirmation checked and no blocking errors
- [ ] After apply: Products and Price lists show new/updated NDIS items
- [ ] Import history lists batch; revert works on applied batch
- [ ] `npm run build` pass
- [ ] `npm run page-guides:check` pass

## Out of scope (AB-0012+)

- Price Dependant Updater analyse/apply
- Service agreement variation tasks
- Live NDIA API
