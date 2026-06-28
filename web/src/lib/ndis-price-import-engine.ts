import {
  detectNdisPriceImportFormat,
  normalizeNdisPriceImportRows,
  parseCsvRows,
  type NdisPriceImportAction,
  type NdisPriceImportBatch,
  type NdisPriceImportBatchStatus,
  type NdisPriceImportRow,
  type NdisPriceImportFormat,
  type NormalizedNdisPriceImportRow,
} from "@/lib/ndis-price-import";
import type { PriceListLine, PriceListRecord, ProductRecord } from "@/lib/product";
import { normalizePriceList } from "@/lib/product";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export type NdisPriceImportPreview = {
  batch: NdisPriceImportBatch;
  rows: NdisPriceImportRow[];
  headers: string[];
  format: NdisPriceImportFormat;
  canApply: boolean;
};

export type NdisPriceImportApplyResult = {
  batch: NdisPriceImportBatch;
  rows: NdisPriceImportRow[];
  products: ProductRecord[];
  priceLists: PriceListRecord[];
  changedProductIds: string[];
  changedPriceListIds: string[];
};

function newId(prefix: string): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function guideYearForFormat(format: NdisPriceImportFormat): string {
  switch (format) {
    case "ndis-2025-26-wide":
    case "ndis-2025-26-long":
      return "2025-26";
    case "ndis-2026-27-update":
    case "ndis-2026-27-long":
      return "2026-27";
    default:
      return "";
  }
}

export function computeNdisPriceRowHash(row: NormalizedNdisPriceImportRow): string {
  return [
    row.supportItemNumber,
    row.region,
    row.effectiveStart,
    row.effectiveEnd,
    row.priceType,
    row.price ?? "",
    row.quoteRequired ? "1" : "0",
    row.noSpecifiedPrice ? "1" : "0",
  ].join("|");
}

function isValidIsoDate(value: string): boolean {
  const key = value.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  return !Number.isNaN(Date.parse(key));
}

function normalizeUnit(unit: string): string {
  const key = unit.trim().toLowerCase();
  if (key.includes("hour")) return "Hour";
  if (key.includes("each") || key === "e") return "Each";
  if (key.includes("day")) return "Day";
  if (key.includes("week")) return "Week";
  if (key.includes("month")) return "Month";
  return unit.trim() || "Hour";
}

function priceListIdForGuideYear(guideYear: string): string {
  return `pl-ndis-${guideYear.replace(/\//g, "-")}`;
}

function findProductBySupportItem(products: ProductRecord[], supportItemNumber: string): ProductRecord | undefined {
  const key = supportItemNumber.trim();
  return products.find((p) => (p.ndisSupportItem ?? "").trim() === key);
}

function findPriceListForGuide(priceLists: PriceListRecord[], guideYear: string): PriceListRecord | undefined {
  return priceLists.find((list) => list.guideYear === guideYear && list.schema === "NDIS");
}

function findPriceLine(
  list: PriceListRecord | undefined,
  productId: string,
  normalized: NormalizedNdisPriceImportRow,
  rowHash: string
): PriceListLine | undefined {
  if (!list) return undefined;
  const lines = list.lines.filter((line) => line.productId === productId);
  const byHash = lines.find((line) => line.sourceRowHash === rowHash);
  if (byHash) return byHash;
  return lines.find(
    (line) =>
      (line.region || line.jurisdiction) === normalized.region &&
      (line.effectiveStart ?? "") === normalized.effectiveStart &&
      (line.effectiveEnd ?? "") === normalized.effectiveEnd
  );
}

function priceAmount(value: number | null): string {
  if (value == null) return "0.00";
  return value.toFixed(2);
}

function emptyBatch(
  fileName: string,
  format: NdisPriceImportFormat,
  actorName: string,
  status: NdisPriceImportBatchStatus = "draft"
): NdisPriceImportBatch {
  const guideYear = guideYearForFormat(format);
  return {
    id: newId("ndis-import"),
    sourceFileName: fileName,
    sourceDocument: fileName,
    guideYear,
    formatType: format,
    status,
    importedBy: actorName,
    importedAt: new Date().toISOString(),
    appliedAt: "",
    rowCount: 0,
    addCount: 0,
    updateCount: 0,
    unchangedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    warningCount: 0,
    warnings: [],
    notes: "",
  };
}

function rowKey(normalized: NormalizedNdisPriceImportRow): string {
  return [normalized.supportItemNumber, normalized.region, normalized.effectiveStart, normalized.effectiveEnd].join("|");
}

function classifyRow(
  normalized: NormalizedNdisPriceImportRow,
  products: ProductRecord[],
  priceList: PriceListRecord | undefined,
  seenKeys: Set<string>,
  guideYear: string
): Pick<NdisPriceImportRow, "action" | "status" | "message" | "matchedProductId" | "matchedPriceLineId"> {
  const key = rowKey(normalized);
  if (seenKeys.has(key)) {
    return {
      action: "skip",
      status: "error",
      message: "Duplicate support item, region, and effective window in this file.",
      matchedProductId: "",
      matchedPriceLineId: "",
    };
  }
  seenKeys.add(key);

  if (!normalized.supportItemNumber.trim()) {
    return {
      action: "skip",
      status: "error",
      message: "Support item number is required.",
      matchedProductId: "",
      matchedPriceLineId: "",
    };
  }

  if (!normalized.supportItemName.trim()) {
    return {
      action: "skip",
      status: "error",
      message: "Support item name is required.",
      matchedProductId: "",
      matchedPriceLineId: "",
    };
  }

  if (!normalized.unit.trim()) {
    return {
      action: "skip",
      status: "error",
      message: "Unit is required.",
      matchedProductId: "",
      matchedPriceLineId: "",
    };
  }

  if (!isValidIsoDate(normalized.effectiveStart)) {
    return {
      action: "skip",
      status: "error",
      message: "Effective start date is missing or invalid.",
      matchedProductId: "",
      matchedPriceLineId: "",
    };
  }

  if (
    normalized.priceType === "priced" &&
    normalized.price == null &&
    !normalized.quoteRequired &&
    !normalized.noSpecifiedPrice
  ) {
    return {
      action: "mark_no_specified_price",
      status: "warning",
      message: "Priced item has no price — treated as no specified price.",
      matchedProductId: "",
      matchedPriceLineId: "",
    };
  }

  const product = findProductBySupportItem(products, normalized.supportItemNumber);
  const rowHash = computeNdisPriceRowHash(normalized);
  const matchedLine = product ? findPriceLine(priceList, product.id, normalized, rowHash) : undefined;

  if (normalized.action === "review_not_in_new_schedule" || normalized.action === "end_date_existing_item") {
    return {
      action: normalized.action,
      status: product ? "valid" : "warning",
      message: product
        ? "Item marked for end-date or review in the new schedule."
        : "Schedule action for an item that is not in the product catalogue.",
      matchedProductId: product?.id ?? "",
      matchedPriceLineId: matchedLine?.id ?? "",
    };
  }

  if (!product) {
    return {
      action: "add_new_item",
      status: "valid",
      message: `New support item for guide ${guideYear}.`,
      matchedProductId: "",
      matchedPriceLineId: "",
    };
  }

  if (matchedLine?.sourceRowHash === rowHash) {
    return {
      action: "unchanged",
      status: "valid",
      message: "Existing price row matches this import.",
      matchedProductId: product.id,
      matchedPriceLineId: matchedLine.id,
    };
  }

  if (matchedLine) {
    const existingPrice = matchedLine.listPrice?.replace(/,/g, "") ?? "";
    const incoming = normalized.price != null ? normalized.price.toFixed(2) : "";
    if (incoming && existingPrice && existingPrice !== incoming) {
      return {
        action: "update_existing_item",
        status: "warning",
        message: "Effective window already exists with a different price — a new price row will be appended.",
        matchedProductId: product.id,
        matchedPriceLineId: matchedLine.id,
      };
    }
    return {
      action: "unchanged",
      status: "valid",
      message: "Price row already exists for this window.",
      matchedProductId: product.id,
      matchedPriceLineId: matchedLine.id,
    };
  }

  if (
    product.name.trim() &&
    normalized.supportItemName.trim() &&
    product.name.trim().toLowerCase() !== normalized.supportItemName.trim().toLowerCase()
  ) {
    return {
      action: "update_existing_item",
      status: "warning",
      message: "Product name differs from import — metadata will refresh on apply.",
      matchedProductId: product.id,
      matchedPriceLineId: "",
    };
  }

  return {
    action: normalized.action === "add_new_item" ? "update_existing_item" : normalized.action,
    status: "valid",
    message: "Existing product will receive a new regional/effective-dated price row.",
    matchedProductId: product.id,
    matchedPriceLineId: "",
  };
}

function countActions(rows: NdisPriceImportRow[]) {
  const count = (action: NdisPriceImportAction) => rows.filter((row) => row.action === action).length;
  return {
    addCount: count("add_new_item"),
    updateCount: count("update_existing_item") + count("end_date_existing_item") + count("mark_no_specified_price") + count("mark_quotable_no_fixed_price"),
    unchangedCount: count("unchanged"),
    skippedCount: count("skip") + count("review_not_in_new_schedule"),
    errorCount: rows.filter((row) => row.status === "error").length,
    warningCount: rows.filter((row) => row.status === "warning").length,
  };
}

export function previewNdisPriceImport(input: {
  csvText: string;
  fileName: string;
  actorName: string;
  products: ProductRecord[];
  priceLists: PriceListRecord[];
}): NdisPriceImportPreview {
  if (input.csvText.length > MAX_IMPORT_BYTES) {
    const batch = emptyBatch(input.fileName, "unknown", input.actorName, "error");
    batch.warnings = ["File exceeds the 5 MB import limit."];
    batch.errorCount = 1;
    return { batch, rows: [], headers: [], format: "unknown", canApply: false };
  }

  const rawRows = parseCsvRows(input.csvText);
  const headers = rawRows.length ? Object.keys(rawRows[0] ?? {}) : [];
  const format = headers.length ? detectNdisPriceImportFormat(headers) : "unknown";

  if (format === "unknown") {
    const batch = emptyBatch(input.fileName, format, input.actorName, "error");
    batch.warnings = ["Unrecognised CSV format. Check required column headers for 2025–26, 2026–27, or AbilityVua template files."];
    batch.errorCount = 1;
    return { batch, rows: [], headers, format, canApply: false };
  }

  const guideYear = guideYearForFormat(format);
  const priceList = findPriceListForGuide(input.priceLists, guideYear);
  const normalizedRows = normalizeNdisPriceImportRows(rawRows, format);
  const seenKeys = new Set<string>();
  const warnings: string[] = [];

  if (guideYear === "2026-27" && !input.priceLists.some((list) => list.guideYear === "2025-26")) {
    warnings.push("No 2025–26 baseline price list found. Import 2025–26 first for a complete historical window.");
  }

  const rawBySupportItem = new Map(
    rawRows.map((raw) => [(raw.support_item_number ?? "").trim(), raw] as const)
  );

  const rows: NdisPriceImportRow[] = normalizedRows.map((normalized, index) => {
    const classified = classifyRow(normalized, input.products, priceList, seenKeys, guideYear);
    return {
      id: newId("ndis-import-row"),
      batchId: "",
      rowNo: index + 1,
      supportItemNumber: normalized.supportItemNumber,
      action: classified.action,
      status: classified.status,
      message: classified.message,
      raw: rawBySupportItem.get(normalized.supportItemNumber.trim()) ?? {},
      normalized,
      matchedProductId: classified.matchedProductId,
      matchedPriceLineId: classified.matchedPriceLineId,
      rowHash: computeNdisPriceRowHash(normalized),
    };
  });

  const counts = countActions(rows);
  const batch = emptyBatch(input.fileName, format, input.actorName, "validated");
  batch.guideYear = guideYear;
  batch.rowCount = rows.length;
  batch.warnings = warnings;
  Object.assign(batch, counts);

  rows.forEach((row) => {
    row.batchId = batch.id;
  });

  return {
    batch,
    rows,
    headers,
    format,
    canApply: batch.errorCount === 0 && rows.length > 0,
  };
}

function ensurePriceList(
  priceLists: PriceListRecord[],
  guideYear: string,
  batch: NdisPriceImportBatch,
  actorName: string
): { lists: PriceListRecord[]; list: PriceListRecord } {
  const existing = findPriceListForGuide(priceLists, guideYear);
  if (existing) return { lists: priceLists, list: existing };

  const validFrom =
    guideYear === "2025-26" ? "2025-07-01" : guideYear === "2026-27" ? "2026-07-01" : `${guideYear.slice(0, 4)}-07-01`;
  const validTo = guideYear === "2025-26" ? "2026-06-30" : guideYear === "2026-27" ? "2027-06-30" : "";

  const list: PriceListRecord = normalizePriceList({
    id: priceListIdForGuideYear(guideYear),
    name: `NDIS Price List ${guideYear}`,
    schema: "NDIS",
    basePriceListId: "",
    validFrom,
    validTo,
    currency: "AUD",
    source: batch.sourceFileName,
    sourceImportBatchId: batch.id,
    guideYear,
    status: "active",
    lines: [],
    createdBy: actorName,
    updatedBy: actorName,
  });

  return { lists: [...priceLists, list], list };
}

function buildProductFromRow(
  normalized: NormalizedNdisPriceImportRow,
  batch: NdisPriceImportBatch,
  priceListId: string,
  actorName: string
): ProductRecord {
  const searchKey = normalized.supportItemNumber.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase();
  return {
    id: newId("prod"),
    searchKey,
    name: normalized.supportItemName,
    description: normalized.supportItemName,
    productCategory: "NDIS Support",
    uom: normalizeUnit(normalized.unit),
    productType: "Service",
    active: true,
    sold: false,
    priceListId,
    ndisSupportItem: normalized.supportItemNumber,
    registrationGroupNumber: normalized.registrationGroupNumber,
    registrationGroupName: normalized.registrationGroupName,
    supportCategoryNumber: normalized.supportCategoryNumber,
    supportCategoryName: normalized.supportCategoryName,
    supportCategoryNamePace: normalized.supportCategoryNamePace,
    priceType: normalized.priceType,
    claimingFlags: normalized.claimingFlags,
    sourceImportBatchId: batch.id,
    createdBy: actorName,
    updatedBy: actorName,
  };
}

function refreshProductMetadata(product: ProductRecord, normalized: NormalizedNdisPriceImportRow, actorName: string): ProductRecord {
  return {
    ...product,
    name: normalized.supportItemName || product.name,
    description: normalized.supportItemName || product.description,
    uom: normalizeUnit(normalized.unit) || product.uom,
    registrationGroupNumber: normalized.registrationGroupNumber || product.registrationGroupNumber,
    registrationGroupName: normalized.registrationGroupName || product.registrationGroupName,
    supportCategoryNumber: normalized.supportCategoryNumber || product.supportCategoryNumber,
    supportCategoryName: normalized.supportCategoryName || product.supportCategoryName,
    supportCategoryNamePace: normalized.supportCategoryNamePace || product.supportCategoryNamePace,
    priceType: normalized.priceType || product.priceType,
    claimingFlags: normalized.claimingFlags ?? product.claimingFlags,
    updatedBy: actorName,
  };
}

function buildPriceLine(
  normalized: NormalizedNdisPriceImportRow,
  productId: string,
  lineNo: number,
  batch: NdisPriceImportBatch,
  rowHash: string
): PriceListLine {
  const amount = priceAmount(normalized.price);
  return {
    id: newId("pll"),
    lineNo,
    productId,
    listPrice: amount,
    standardPrice: amount,
    limitPrice: normalized.price != null ? (normalized.price * 1.1).toFixed(2) : amount,
    supportItemNumber: normalized.supportItemNumber,
    region: normalized.region,
    jurisdiction: normalized.jurisdiction || normalized.region,
    effectiveStart: normalized.effectiveStart,
    effectiveEnd: normalized.effectiveEnd,
    priceType: normalized.priceType,
    quoteRequired: normalized.quoteRequired,
    noSpecifiedPrice: normalized.noSpecifiedPrice || normalized.priceType === "no_specified_price",
    sourceImportBatchId: batch.id,
    sourceRowHash: rowHash,
  };
}

export function applyNdisPriceImport(input: {
  batch: NdisPriceImportBatch;
  rows: NdisPriceImportRow[];
  products: ProductRecord[];
  priceLists: PriceListRecord[];
  actorName: string;
}): NdisPriceImportApplyResult {
  if (input.batch.errorCount > 0) {
    throw new Error("Import batch has blocking errors and cannot be applied.");
  }

  let products = [...input.products];
  let priceLists = [...input.priceLists];
  const changedProductIds = new Set<string>();
  const changedPriceListIds = new Set<string>();
  const { lists: withList, list: priceList } = ensurePriceList(priceLists, input.batch.guideYear, input.batch, input.actorName);
  priceLists = withList;
  changedPriceListIds.add(priceList.id);

  const appliedRows = input.rows.map((row) => ({ ...row }));
  const listIndex = priceLists.findIndex((entry) => entry.id === priceList.id);
  let workingList = normalizePriceList({ ...priceLists[listIndex]! });

  for (const row of appliedRows) {
    if (row.status === "error" || row.action === "unchanged" || row.action === "skip") {
      row.status = row.action === "unchanged" ? "applied" : row.status;
      continue;
    }

    const normalized = row.normalized;
    if (!normalized) {
      row.status = "error";
      row.message = "Missing normalised row payload.";
      continue;
    }

    let product = findProductBySupportItem(products, normalized.supportItemNumber);
    if (!product && row.action === "add_new_item") {
      product = buildProductFromRow(normalized, input.batch, workingList.id, input.actorName);
      products.push(product);
      changedProductIds.add(product.id);
      row.matchedProductId = product.id;
    } else if (product) {
      const refreshed = refreshProductMetadata(product, normalized, input.actorName);
      if (JSON.stringify(refreshed) !== JSON.stringify(product)) {
        product = refreshed;
        products = products.map((entry) => (entry.id === product!.id ? product! : entry));
        changedProductIds.add(product.id);
      }
      row.matchedProductId = product.id;
    } else if (row.action === "end_date_existing_item" || row.action === "review_not_in_new_schedule") {
      row.status = "skipped";
      row.message = `${row.message} No product match — skipped.`;
      continue;
    } else {
      row.status = "error";
      row.message = "Could not match or create product for this row.";
      continue;
    }

    if (row.action === "end_date_existing_item") {
      product = {
        ...product,
        endDatedAt: normalized.effectiveEnd || normalized.effectiveStart,
        updatedBy: input.actorName,
      };
      products = products.map((entry) => (entry.id === product!.id ? product! : entry));
      changedProductIds.add(product.id);
      row.status = "applied";
      continue;
    }

    if (row.action === "review_not_in_new_schedule") {
      row.status = "skipped";
      continue;
    }

    const existingLine = findPriceLine(workingList, product.id, normalized, row.rowHash);
    if (existingLine?.sourceRowHash === row.rowHash) {
      row.status = "applied";
      row.matchedPriceLineId = existingLine.id;
      continue;
    }

    const nextLineNo = workingList.lines.length + 1;
    const line = buildPriceLine(normalized, product.id, nextLineNo, input.batch, row.rowHash);
    workingList = {
      ...workingList,
      source: input.batch.sourceFileName,
      sourceImportBatchId: input.batch.id,
      lines: [...workingList.lines, line],
      updatedBy: input.actorName,
    };
    changedPriceListIds.add(workingList.id);
    row.status = "applied";
    row.matchedPriceLineId = line.id;
  }

  priceLists = priceLists.map((entry) => (entry.id === workingList.id ? workingList : entry));

  const postApplyErrors = appliedRows.filter((row) => row.status === "error").length;
  const counts = countActions(appliedRows);
  const batch: NdisPriceImportBatch = {
    ...input.batch,
    status: postApplyErrors > 0 ? "error" : "applied",
    appliedAt: new Date().toISOString(),
    rowCount: appliedRows.length,
    ...counts,
    errorCount: postApplyErrors,
    warningCount: appliedRows.filter((row) => row.status === "warning").length,
    skippedCount: appliedRows.filter((row) => row.status === "skipped").length,
    notes: postApplyErrors > 0 ? `${input.batch.notes}\nApply completed with ${postApplyErrors} row error(s).`.trim() : input.batch.notes,
  };

  return {
    batch,
    rows: appliedRows,
    products,
    priceLists,
    changedProductIds: [...changedProductIds],
    changedPriceListIds: [...changedPriceListIds],
  };
}

export function revertNdisPriceImport(input: {
  batch: NdisPriceImportBatch;
  products: ProductRecord[];
  priceLists: PriceListRecord[];
  actorName: string;
}): { batch: NdisPriceImportBatch; products: ProductRecord[]; priceLists: PriceListRecord[] } {
  const batch: NdisPriceImportBatch = {
    ...input.batch,
    status: "reverted",
    notes: input.batch.notes
      ? `${input.batch.notes}\nReverted ${new Date().toISOString()}`
      : `Reverted ${new Date().toISOString()}`,
  };

  const products = input.products.map((product) => {
    if (product.sourceImportBatchId !== input.batch.id) return product;
    return {
      ...product,
      active: false,
      endDatedAt: new Date().toISOString().slice(0, 10),
      updatedBy: input.actorName,
    };
  });

  const priceLists = input.priceLists.map((list) => {
    const filteredLines = list.lines.filter((line) => line.sourceImportBatchId !== input.batch.id);
    if (filteredLines.length === list.lines.length && list.sourceImportBatchId !== input.batch.id) return list;
    return normalizePriceList({
      ...list,
      lines: filteredLines,
      status: list.sourceImportBatchId === input.batch.id ? "reverted" : list.status,
      updatedBy: input.actorName,
    });
  });

  return { batch, products, priceLists };
}

/** Rows AB-0012 can consume: new, updated, or end-dated support items from an applied batch. */
export function ndisImportHandoffRows(rows: NdisPriceImportRow[]) {
  return rows.filter((row) =>
    ["add_new_item", "update_existing_item", "end_date_existing_item", "mark_no_specified_price", "mark_quotable_no_fixed_price"].includes(
      row.action
    ) && row.status === "applied"
  );
}
