import type { HelpArticle } from "@/lib/help/types";

export const ndisPriceImporterArticle: HelpArticle = {
  id: "article-ndis-price-importer",
  slug: "ndis-price-importer",
  title: "NDIS Price Guide Importer",
  summary: "Import NDIS support catalogue CSV files into master products and price lists with preview, audit history, and safe apply.",
  category: "System setup",
  keywords: ["NDIS", "price guide", "import", "support item", "price list", "catalogue", "2025-26", "2026-27"],
  relatedRoutes: ["/system/services/ndis-price-importer"],
  windowKeys: ["system-ndis-price-importer"],
  lastUpdated: "2026-06-28",
  sections: [
    {
      id: "overview",
      title: "What this importer does",
      body: "The NDIS Price Guide Importer is a System setup window for loading official NDIS support item and price limit data. It updates master products and price list lines only — service agreements, bookings, claims, and invoices are not changed here.",
      relatedRoutes: ["/system/services/ndis-price-importer"],
      windowKeys: ["system-ndis-price-importer"],
    },
    {
      id: "supported-files",
      title: "Supported CSV formats",
      body: "Upload CSV files from your NDIS Price Guides folder. The importer detects the format from column headers.",
      bullets: [
        "2025–26 wide catalogue — state and Remote / Very Remote columns",
        "2025–26 long format — one row per jurisdiction",
        "2026–27 system update list — National / Remote / Very Remote with action column",
        "2026–27 long schedule",
        "AbilityVua template for manual or test imports",
      ],
      relatedRoutes: ["/system/services/ndis-price-importer"],
    },
    {
      id: "import-workflow",
      title: "Import workflow",
      steps: [
        "Sign in to System setup and open Services → NDIS Price Guide Importer.",
        "Upload the CSV file (maximum 5 MB).",
        "Review validation preview counts — new, updated, unchanged, skipped, warnings, and errors.",
        "Filter the row review table for warnings or errors before applying.",
        "Tick the confirmation checkbox and click Apply import.",
        "Check Products and Price lists in the workspace to confirm imported items and effective-dated lines.",
      ],
      relatedRoutes: ["/system/services/ndis-price-importer", "/products", "/price-lists"],
    },
    {
      id: "baseline-order",
      title: "Baseline then annual update",
      body: "Import the 2025–26 support catalogue first to establish baseline historical price windows. Import the 2026–27 pricing schedule afterward. The importer preserves existing windows and appends new effective-dated regional rows rather than overwriting history.",
      relatedRoutes: ["/system/services/ndis-price-importer"],
    },
    {
      id: "revert",
      title: "Revert an import batch",
      body: "Applied batches can be reverted from Import history. Revert deactivates products created by that batch and removes price list lines sourced from it. Use revert only when the wrong file was applied — downstream agreements still need AB-0012 review when pricing changes affect participants.",
      relatedRoutes: ["/system/services/ndis-price-importer"],
    },
    {
      id: "guardrails",
      title: "Checks and balances",
      bullets: [
        "Support item number is the natural key — products are never matched by name alone.",
        "Quote and no-specified-price items are flagged; fixed limits are not invented.",
        "Apply is blocked when blocking row errors exist.",
        "Import batch history records source file, guide year, counts, status, and row-level results.",
        "Dependent record updates belong in AB-0012 Price Dependant Updater (planned).",
      ],
      relatedRoutes: ["/system/services/ndis-price-importer"],
    },
  ],
};
