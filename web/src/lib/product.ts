export type ProductRecord = {
  id: string;
  searchKey: string;
  name: string;
  description: string;
  productCategory: string;
  uom: string;
  productType: string;
  active: boolean;
  sold: boolean;
  priceListId: string;
  ndisSupportItem?: string;
  registrationGroupNumber?: string;
  registrationGroupName?: string;
  supportCategoryNumber?: string;
  supportCategoryName?: string;
  supportCategoryNamePace?: string;
  priceType?: string;
  claimingFlags?: Record<string, boolean>;
  sourceImportBatchId?: string;
  endDatedAt?: string;
  createdBy: string;
  updatedBy: string;
};

export type PriceListLine = {
  id: string;
  lineNo: number;
  productId: string;
  listPrice: string;
  standardPrice: string;
  limitPrice: string;
  supportItemNumber?: string;
  region?: string;
  jurisdiction?: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  priceType?: string;
  quoteRequired?: boolean;
  noSpecifiedPrice?: boolean;
  sourceImportBatchId?: string;
  sourceRowHash?: string;
};

export type PriceListRecord = {
  id: string;
  name: string;
  schema: string;
  basePriceListId: string;
  validFrom: string;
  validTo?: string;
  currency: string;
  source?: string;
  sourceImportBatchId?: string;
  guideYear?: string;
  status?: string;
  lines: PriceListLine[];
  createdBy: string;
  updatedBy: string;
};

export const productDropdowns = {
  productCategory: [
    "NDIS Support",
    "SIL",
    "Community Participation",
    "Therapy",
    "Transport",
    "Administration",
  ],
  uom: ["Hour", "Each", "Day", "Week", "Month"],
  productType: ["Service", "Item", "Resource"],
};

export const initialPriceLists: PriceListRecord[] = [
  {
    id: "pl-ndis-2024",
    name: "NDIS Price List 2024-25",
    schema: "NDIS",
    basePriceListId: "",
    validFrom: "2024-07-01",
    validTo: "2025-06-30",
    currency: "AUD",
    source: "Seed data",
    guideYear: "2024-25",
    status: "active",
    createdBy: "Isla Robinson",
    updatedBy: "SuperUser",
    lines: [
      {
        id: "pll-1",
        lineNo: 1,
        productId: "prod-sil-wd",
        listPrice: "98.50",
        standardPrice: "95.00",
        limitPrice: "110.00",
        supportItemNumber: "01_011_0107_1_1",
        region: "National",
        jurisdiction: "National",
        effectiveStart: "2024-07-01",
        effectiveEnd: "2025-06-30",
        priceType: "priced",
      },
      {
        id: "pll-2",
        lineNo: 2,
        productId: "prod-cp",
        listPrice: "68.00",
        standardPrice: "65.00",
        limitPrice: "75.00",
        supportItemNumber: "04_104_0125_6_1",
        region: "National",
        jurisdiction: "National",
        effectiveStart: "2024-07-01",
        effectiveEnd: "2025-06-30",
        priceType: "priced",
      },
      {
        id: "pll-3",
        lineNo: 3,
        productId: "prod-transport",
        listPrice: "1.00",
        standardPrice: "0.97",
        limitPrice: "1.10",
        supportItemNumber: "04_590_0125_6_1",
        region: "National",
        jurisdiction: "National",
        effectiveStart: "2024-07-01",
        effectiveEnd: "2025-06-30",
        priceType: "priced",
      },
    ],
  },
];

export const initialProducts: ProductRecord[] = [
  {
    id: "prod-sil-wd",
    searchKey: "SIL_WD",
    name: "SIL Weekday",
    description: "Supported independent living — weekday",
    productCategory: "SIL",
    uom: "Hour",
    productType: "Service",
    active: true,
    sold: true,
    priceListId: "pl-ndis-2024",
    ndisSupportItem: "01_011_0107_1_1",
    createdBy: "Isla Robinson",
    updatedBy: "SuperUser",
  },
  {
    id: "prod-cp",
    searchKey: "COMM_PART",
    name: "Community Participation",
    description: "Assistance with social and community participation",
    productCategory: "Community Participation",
    uom: "Hour",
    productType: "Service",
    active: true,
    sold: true,
    priceListId: "pl-ndis-2024",
    ndisSupportItem: "04_104_0125_6_1",
    createdBy: "Isla Robinson",
    updatedBy: "SuperUser",
  },
  {
    id: "prod-transport",
    searchKey: "TRANS_KM",
    name: "Transport per km",
    description: "Provider travel — per kilometre",
    productCategory: "Transport",
    uom: "Each",
    productType: "Service",
    active: true,
    sold: true,
    priceListId: "pl-ndis-2024",
    ndisSupportItem: "04_590_0125_6_1",
    createdBy: "Isla Robinson",
    updatedBy: "SuperUser",
  },
];

export function normalizePriceList(list: PriceListRecord): PriceListRecord {
  return {
    ...list,
    validTo: list.validTo ?? "",
    source: list.source ?? "",
    sourceImportBatchId: list.sourceImportBatchId ?? "",
    guideYear: list.guideYear ?? "",
    status: list.status ?? "active",
    lines: list.lines.map((line, index) => ({
      ...line,
      lineNo: line.lineNo ?? index + 1,
      supportItemNumber: line.supportItemNumber ?? "",
      region: line.region ?? "",
      jurisdiction: line.jurisdiction ?? "",
      effectiveStart: line.effectiveStart ?? list.validFrom ?? "",
      effectiveEnd: line.effectiveEnd ?? list.validTo ?? "",
      priceType: line.priceType ?? "",
      quoteRequired: Boolean(line.quoteRequired),
      noSpecifiedPrice: Boolean(line.noSpecifiedPrice),
      sourceImportBatchId: line.sourceImportBatchId ?? list.sourceImportBatchId ?? "",
      sourceRowHash: line.sourceRowHash ?? "",
    })),
  };
}

function isoInRange(iso: string, start?: string, end?: string): boolean {
  if (!iso?.trim()) return true;
  const key = iso.slice(0, 10);
  const from = start?.slice(0, 10);
  const to = end?.slice(0, 10);
  if (from && key < from) return false;
  if (to && to !== "9999-12-31" && key > to) return false;
  return true;
}

function regionMatches(line: PriceListLine, region?: string): boolean {
  if (!region?.trim()) return true;
  const target = region.trim().toLowerCase();
  return [line.region, line.jurisdiction].some((value) => value?.trim().toLowerCase() === target);
}

function defaultRegionalLine(lines: PriceListLine[]): PriceListLine | undefined {
  return lines.find((line) => {
    const region = (line.region || line.jurisdiction || "").trim().toLowerCase();
    return !region || region === "national";
  });
}

export function getProductPrice(
  list: PriceListRecord | undefined,
  productId: string,
  options: { serviceDate?: string; region?: string } = {}
) {
  const lines = list?.lines.filter((l) => l.productId === productId) ?? [];
  const requestedRegion = Boolean(options.region?.trim());
  const requestedDate = Boolean(options.serviceDate?.trim());
  const dated = lines.filter(
    (line) => isoInRange(options.serviceDate ?? "", line.effectiveStart, line.effectiveEnd) && regionMatches(line, options.region)
  );
  if (requestedRegion) return dated[0];
  if (requestedDate) return defaultRegionalLine(dated);
  return defaultRegionalLine(lines);
}
