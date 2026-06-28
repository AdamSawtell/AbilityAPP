export type NdisPriceImportFormat =
  | "ndis-2025-26-wide"
  | "ndis-2025-26-long"
  | "ndis-2026-27-update"
  | "ndis-2026-27-long"
  | "abilityvua-template"
  | "unknown";

export type NdisPriceImportBatchStatus = "draft" | "validated" | "applied" | "reverted" | "error";

export type NdisPriceImportRowStatus = "valid" | "warning" | "error" | "applied" | "skipped";

export type NdisPriceImportAction =
  | "add_new_item"
  | "update_existing_item"
  | "unchanged"
  | "end_date_existing_item"
  | "mark_no_specified_price"
  | "mark_quotable_no_fixed_price"
  | "review_not_in_new_schedule"
  | "skip";

export type NdisPriceImportBatch = {
  id: string;
  sourceFileName: string;
  sourceDocument: string;
  guideYear: string;
  formatType: NdisPriceImportFormat;
  status: NdisPriceImportBatchStatus;
  importedBy: string;
  importedAt: string;
  appliedAt: string;
  rowCount: number;
  addCount: number;
  updateCount: number;
  unchangedCount: number;
  skippedCount: number;
  errorCount: number;
  warningCount: number;
  warnings: string[];
  notes: string;
};

export type NdisPriceImportRow = {
  id: string;
  batchId: string;
  rowNo: number;
  supportItemNumber: string;
  action: NdisPriceImportAction;
  status: NdisPriceImportRowStatus;
  message: string;
  raw: Record<string, string>;
  normalized: NormalizedNdisPriceImportRow | null;
  matchedProductId: string;
  matchedPriceLineId: string;
  rowHash: string;
};

export type NormalizedNdisPriceImportRow = {
  supportItemNumber: string;
  supportItemName: string;
  unit: string;
  region: string;
  jurisdiction: string;
  price: number | null;
  previousPrice: number | null;
  changeAmount: number | null;
  changePercent: number | null;
  effectiveStart: string;
  effectiveEnd: string;
  priceType: "priced" | "quotable" | "no_specified_price" | "not_present" | "unknown";
  quoteRequired: boolean;
  noSpecifiedPrice: boolean;
  action: NdisPriceImportAction;
  registrationGroupNumber: string;
  registrationGroupName: string;
  supportCategoryNumber: string;
  supportCategoryName: string;
  supportCategoryNamePace: string;
  claimingFlags: Record<string, boolean>;
  schedule: string;
  table: string;
};

export const NDIS_PRICE_REGIONS_2025_26 = [
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
  "Remote",
  "Very Remote",
] as const;

export const NDIS_PRICE_REGIONS_2026_27 = ["National", "Remote", "Very Remote"] as const;

const REQUIRED_2025_WIDE_HEADERS = [
  "support_item_number",
  "support_item_name",
  "unit",
  "quote",
  "start_date_iso",
  "end_date_iso",
  "ACT",
  "Remote",
  "Very Remote",
];

const REQUIRED_2025_LONG_HEADERS = [
  "support_item_number",
  "support_item_name",
  "jurisdiction",
  "price",
  "unit",
  "quote",
  "start_date_iso",
  "end_date_iso",
];

const REQUIRED_2026_UPDATE_HEADERS = [
  "action",
  "support_item_number",
  "support_item_name",
  "unit",
  "national_2026_27",
  "remote_2026_27",
  "very_remote_2026_27",
  "price_type_2026_27",
  "effective_start",
  "effective_end",
];

const REQUIRED_2026_LONG_HEADERS = [
  "support_item_number",
  "support_item_name",
  "jurisdiction",
  "price",
  "unit",
  "effective_start",
  "effective_end",
];

const REQUIRED_TEMPLATE_HEADERS = [
  "action",
  "support_item_number",
  "support_item_name",
  "unit",
  "national_price",
  "remote_price",
  "very_remote_price",
  "price_type",
  "effective_start",
  "effective_end",
];

const CLAIMING_FLAG_COLUMNS = [
  "Non-Face-to-Face Support Provision",
  "Provider Travel",
  "Short Notice Cancellations",
  "NDIA Requested Reports",
  "Irregular SIL Supports",
];

const NDIS_PRICE_IMPORT_ACTIONS: NdisPriceImportAction[] = [
  "add_new_item",
  "update_existing_item",
  "unchanged",
  "end_date_existing_item",
  "mark_no_specified_price",
  "mark_quotable_no_fixed_price",
  "review_not_in_new_schedule",
  "skip",
];

function hasHeaders(headers: Set<string>, required: string[]): boolean {
  return required.every((header) => headers.has(header));
}

export function detectNdisPriceImportFormat(headers: string[]): NdisPriceImportFormat {
  const set = new Set(headers.map((header) => header.trim()));
  if (hasHeaders(set, REQUIRED_2025_WIDE_HEADERS)) return "ndis-2025-26-wide";
  if (hasHeaders(set, REQUIRED_2025_LONG_HEADERS)) return "ndis-2025-26-long";
  if (hasHeaders(set, REQUIRED_2026_UPDATE_HEADERS)) return "ndis-2026-27-update";
  if (hasHeaders(set, REQUIRED_2026_LONG_HEADERS)) return "ndis-2026-27-long";
  if (hasHeaders(set, REQUIRED_TEMPLATE_HEADERS)) return "abilityvua-template";
  return "unknown";
}

export function parseCsvRows(csv: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      row.push(field);
      field = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      continue;
    }
    field += char;
  }
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  const [headers = [], ...dataRows] = rows;
  return dataRows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), (values[index] ?? "").trim()]))
  );
}

export function cleanPrice(value: string | undefined): number | null {
  const normalized = (value ?? "").replace(/\$/g, "").replace(/,/g, "").trim();
  if (!normalized || normalized.toUpperCase() === "NA" || normalized === "-") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function cleanPercent(value: string | undefined): number | null {
  const normalized = (value ?? "").replace(/%/g, "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizePriceType(value: string | undefined): NormalizedNdisPriceImportRow["priceType"] {
  const key = (value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  if (key.includes("quotable")) return "quotable";
  if (key.includes("no_specified") || key.includes("no-specified")) return "no_specified_price";
  if (key.includes("not_present")) return "not_present";
  if (key === "priced" || key.includes("price_limited")) return "priced";
  return "unknown";
}

function yn(value: string | undefined): boolean {
  return ["y", "yes", "true", "1"].includes((value ?? "").trim().toLowerCase());
}

function actionForPriceType(priceType: NormalizedNdisPriceImportRow["priceType"], fallback: string): NdisPriceImportAction {
  const raw = fallback.trim();
  if (NDIS_PRICE_IMPORT_ACTIONS.includes(raw as NdisPriceImportAction)) return raw as NdisPriceImportAction;
  if (priceType === "quotable") return "mark_quotable_no_fixed_price";
  if (priceType === "no_specified_price") return "mark_no_specified_price";
  if (priceType === "not_present") return "review_not_in_new_schedule";
  return "update_existing_item";
}

function baseRow(raw: Record<string, string>, overrides: Partial<NormalizedNdisPriceImportRow>): NormalizedNdisPriceImportRow {
  const priceType = normalizePriceType(raw.type || raw.price_type || raw.price_type_2026_27);
  return {
    supportItemNumber: raw.support_item_number ?? "",
    supportItemName: raw.support_item_name ?? "",
    unit: raw.unit ?? "",
    region: "",
    jurisdiction: "",
    price: null,
    previousPrice: null,
    changeAmount: null,
    changePercent: null,
    effectiveStart: raw.start_date_iso || raw.effective_start || "",
    effectiveEnd: raw.end_date_iso || raw.effective_end || "",
    priceType,
    quoteRequired: yn(raw.quote) || priceType === "quotable",
    noSpecifiedPrice: priceType === "no_specified_price",
    action: actionForPriceType(priceType, raw.action ?? ""),
    registrationGroupNumber: raw.registration_group_number ?? "",
    registrationGroupName: raw.registration_group_name ?? "",
    supportCategoryNumber: raw.support_category_number ?? "",
    supportCategoryName: raw.support_category_name ?? "",
    supportCategoryNamePace: raw.support_category_name_pace ?? "",
    claimingFlags: Object.fromEntries(CLAIMING_FLAG_COLUMNS.map((column) => [column, yn(raw[column])])),
    schedule: raw.schedule ?? "",
    table: raw.table ?? "",
    ...overrides,
  };
}

export function normalizeNdisPriceImportRows(
  rawRows: Record<string, string>[],
  format: NdisPriceImportFormat
): NormalizedNdisPriceImportRow[] {
  if (format === "ndis-2025-26-wide") {
    return rawRows.flatMap((raw) =>
      NDIS_PRICE_REGIONS_2025_26.map((region) =>
        baseRow(raw, {
          region,
          jurisdiction: region,
          price: cleanPrice(raw[region]),
          action: "add_new_item",
        })
      )
    );
  }

  if (format === "ndis-2025-26-long") {
    return rawRows.map((raw) =>
      baseRow(raw, {
        region: raw.jurisdiction ?? "",
        jurisdiction: raw.jurisdiction ?? "",
        price: cleanPrice(raw.price),
        action: "add_new_item",
      })
    );
  }

  if (format === "ndis-2026-27-update") {
    const regions = [
      ["National", "national_2026_27", "previous_national_2025_26", "national_change_amount", "national_change_percent"],
      ["Remote", "remote_2026_27", "previous_remote_2025_26", "", ""],
      ["Very Remote", "very_remote_2026_27", "previous_very_remote_2025_26", "", ""],
    ] as const;
    return rawRows.flatMap((raw) =>
      regions.map(([region, priceKey, previousKey, changeKey, percentKey]) =>
        baseRow(raw, {
          region,
          jurisdiction: region,
          price: cleanPrice(raw[priceKey]),
          previousPrice: cleanPrice(raw[previousKey]),
          changeAmount: cleanPrice(raw[changeKey]),
          changePercent: cleanPercent(raw[percentKey]),
        })
      )
    );
  }

  if (format === "ndis-2026-27-long") {
    return rawRows.map((raw) =>
      baseRow(raw, {
        region: raw.jurisdiction ?? "",
        jurisdiction: raw.jurisdiction ?? "",
        price: cleanPrice(raw.price),
      })
    );
  }

  if (format === "abilityvua-template") {
    const regions = [
      ["National", "national_price", "previous_national_price"],
      ["Remote", "remote_price", "previous_remote_price"],
      ["Very Remote", "very_remote_price", "previous_very_remote_price"],
    ] as const;
    return rawRows.flatMap((raw) =>
      regions.map(([region, priceKey, previousKey]) =>
        baseRow(raw, {
          region,
          jurisdiction: region,
          price: cleanPrice(raw[priceKey]),
          previousPrice: cleanPrice(raw[previousKey]),
          changeAmount: cleanPrice(raw.change_amount),
          changePercent: cleanPercent(raw.change_percent),
        })
      )
    );
  }

  return [];
}
