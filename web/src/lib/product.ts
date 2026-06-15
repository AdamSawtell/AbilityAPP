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
};

export type PriceListRecord = {
  id: string;
  name: string;
  schema: string;
  basePriceListId: string;
  validFrom: string;
  currency: string;
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
    currency: "AUD",
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
      },
      {
        id: "pll-2",
        lineNo: 2,
        productId: "prod-cp",
        listPrice: "68.00",
        standardPrice: "65.00",
        limitPrice: "75.00",
      },
      {
        id: "pll-3",
        lineNo: 3,
        productId: "prod-transport",
        listPrice: "1.00",
        standardPrice: "0.97",
        limitPrice: "1.10",
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
    lines: list.lines.map((line, index) => ({ ...line, lineNo: line.lineNo ?? index + 1 })),
  };
}

export function getProductPrice(list: PriceListRecord | undefined, productId: string) {
  return list?.lines.find((l) => l.productId === productId);
}
