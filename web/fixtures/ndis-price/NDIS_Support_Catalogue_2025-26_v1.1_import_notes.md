# NDIS Support Catalogue 2025-26 v1.1 import notes

Source: official NDIS Support Catalogue XLSX, media 8038, effective v1.1. Retrieved via Jina reader from https://www.ndis.gov.au/media/8038/download?attachment because direct ndis.gov.au access was Cloudflare-gated in this environment.

Source page verified: https://www.ndis.gov.au/providers/pricing-and-payments/pricing/what-support-catalogue lists “Download the NDIS Support Catalogue 2025-26 xlsx file” at media/8038, XLSX 106.8 KB.

Rows parsed: 355 (Counter({'Current Support Items': 350, 'Legacy Support Items': 5}))
Unique support item numbers: 351

Best-practice import notes:
- Use `support_item_number` as the natural/external key; do not use item name as key.
- Store prices by jurisdiction/region in a child table if your system supports it; use `*_prices_long.csv` for that.
- Keep `start_date_iso` and `end_date_iso` for versioning/validity; do not overwrite old prices without date windows.
- Treat `quote = Yes` / `type = Quotable Supports` as requiring quote workflow, not fixed-price billing.
- Preserve Y/N flags for non-face-to-face, travel, short-notice cancellation, NDIA reports and irregular SIL billing-rule validation.
- Remote and Very Remote are separate NDIS price limits; do not infer them from state columns at import time.
