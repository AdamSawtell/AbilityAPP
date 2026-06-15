import { clientTabs } from "@/lib/client";
import { contractTabs } from "@/lib/contract-fields";
import { employeeTabGroups } from "@/lib/employee";
import type { AccessWindow, AccessWindowGroup } from "@/lib/access/catalog-types";

export const ENQUIRY_DETAIL_TABS = ["Enquiry details", "Participant", "Support needs", "Audit"] as const;
export const PRODUCT_DETAIL_TABS = ["Overview", "Pricing"] as const;
export const PRICE_LIST_DETAIL_TABS = ["Overview", "Lines"] as const;
export const SERVICE_AGREEMENT_DETAIL_TABS = ["Overview", "Lines"] as const;

export function tabToWindowSlug(tab: string): string {
  return tab
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildDetailWindows(
  parentKey: string,
  keyPrefix: string,
  tabs: readonly string[],
  group: AccessWindowGroup,
  abilityErpParent: string,
  keyOverrides: Record<string, string> = {}
): AccessWindow[] {
  return tabs.map((tab) => ({
    key: keyOverrides[tab] ?? `${keyPrefix}-${tabToWindowSlug(tab)}`,
    label: tab,
    group,
    parentWindowKey: parentKey,
    detailTab: tab,
    abilityErpName: `${abilityErpParent} — ${tab}`,
    showInSidebar: false,
  }));
}

const EMPLOYEE_TAB_KEY_OVERRIDES: Record<string, string> = {
  Address: "employee-locations",
  "Skills & languages": "employee-skills",
};

export const EMPLOYEE_DETAIL_TABS = employeeTabGroups.flatMap((g) => g.tabs);

export const CLIENT_DEPENDENT_WINDOWS = buildDetailWindows(
  "clients",
  "client",
  clientTabs,
  "Core",
  "Support Receiver (BP)"
);

export const ENQUIRY_DEPENDENT_WINDOWS = buildDetailWindows(
  "enquiries",
  "enquiry",
  ENQUIRY_DETAIL_TABS,
  "Core",
  "Enquiry"
);

export const CONTRACT_DEPENDENT_WINDOWS = buildDetailWindows(
  "contracts",
  "contract",
  contractTabs,
  "Services",
  "Contract"
);

export const PRODUCT_DEPENDENT_WINDOWS = buildDetailWindows(
  "products",
  "product",
  PRODUCT_DETAIL_TABS,
  "Services",
  "Product"
);

export const PRICE_LIST_DEPENDENT_WINDOWS = buildDetailWindows(
  "price-lists",
  "price-list",
  PRICE_LIST_DETAIL_TABS,
  "Services",
  "Price list"
);

export const SERVICE_AGREEMENT_DEPENDENT_WINDOWS = buildDetailWindows(
  "service-agreements",
  "service-agreement",
  SERVICE_AGREEMENT_DETAIL_TABS,
  "Services",
  "Service agreement"
);

export const EMPLOYEE_DEPENDENT_WINDOWS = buildDetailWindows(
  "employees",
  "employee",
  EMPLOYEE_DETAIL_TABS,
  "People",
  "Business Partner (Employee)",
  EMPLOYEE_TAB_KEY_OVERRIDES
);

/** Parent window keys plus all dependent tab windows beneath them. */
export function windowKeysWithDependents(...parentKeys: string[]): string[] {
  const keys = new Set<string>();
  for (const parent of parentKeys) {
    keys.add(parent);
    for (const child of buildDependentsForParent(parent)) {
      keys.add(child.key);
    }
  }
  return [...keys];
}

function buildDependentsForParent(parentKey: string): AccessWindow[] {
  switch (parentKey) {
    case "clients":
      return CLIENT_DEPENDENT_WINDOWS;
    case "enquiries":
      return ENQUIRY_DEPENDENT_WINDOWS;
    case "employees":
      return EMPLOYEE_DEPENDENT_WINDOWS;
    case "contracts":
      return CONTRACT_DEPENDENT_WINDOWS;
    case "products":
      return PRODUCT_DEPENDENT_WINDOWS;
    case "price-lists":
      return PRICE_LIST_DEPENDENT_WINDOWS;
    case "service-agreements":
      return SERVICE_AGREEMENT_DEPENDENT_WINDOWS;
    default:
      return [];
  }
}
