import { clientTabs } from "@/lib/client";
import { contractTabs } from "@/lib/contract-fields";
import { employeeTabGroups } from "@/lib/employee";
import { locationTabs } from "@/lib/location";
import type { AccessWindow, AccessWindowGroup } from "@/lib/access/catalog-types";

import { enquiryTabs } from "@/lib/enquiry";
import { incidentTabs } from "@/lib/incident";

export const ENQUIRY_DETAIL_TABS = enquiryTabs;
export const INCIDENT_DETAIL_TABS = incidentTabs;
export const PRODUCT_DETAIL_TABS = ["Overview", "Pricing"] as const;
export const PRICE_LIST_DETAIL_TABS = ["Overview", "Lines"] as const;
export const SERVICE_AGREEMENT_DETAIL_TABS = ["Overview", "Lines"] as const;
export const SERVICE_BOOKING_DETAIL_TABS = ["Overview", "Lines"] as const;

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

export const INCIDENT_DEPENDENT_WINDOWS = buildDetailWindows(
  "incidents",
  "incident",
  INCIDENT_DETAIL_TABS,
  "People",
  "Incident Report"
);

/** Optional incident role features — granted explicitly per role, not via windowKeysWithDependents. */
export const INCIDENT_FEATURE_WINDOWS: AccessWindow[] = [
  {
    key: "incidents-see-all",
    label: "Can see all incidents",
    group: "People",
    href: "/incidents",
    parentWindowKey: "incidents",
    abilityErpName: "Incident Report — see all incidents",
    showInSidebar: false,
  },
  {
    key: "incident-manager-override",
    label: "Override manager review",
    group: "People",
    href: "/incidents",
    parentWindowKey: "incidents",
    abilityErpName: "Incident Report — manager review override",
    showInSidebar: false,
  },
  {
    key: "incidents-dashboard",
    label: "Dashboard & analytics",
    group: "People",
    href: "/incidents/dashboard",
    parentWindowKey: "incidents",
    abilityErpName: "Incident Report — Dashboard & analytics",
    showInSidebar: false,
  },
  {
    key: "incidents-compliance",
    label: "NDIS compliance",
    group: "People",
    href: "/incidents/compliance",
    parentWindowKey: "incidents",
    abilityErpName: "Incident Report — NDIS compliance",
    showInSidebar: false,
  },
];

/** @deprecated Use INCIDENT_FEATURE_WINDOWS — kept for catalog import compatibility. */
export const INCIDENT_EXTRA_WINDOWS = INCIDENT_FEATURE_WINDOWS;

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

export const SERVICE_BOOKING_DEPENDENT_WINDOWS = buildDetailWindows(
  "service-bookings",
  "service-booking",
  SERVICE_BOOKING_DETAIL_TABS,
  "Delivery",
  "Service Booking"
);

export const EMPLOYEE_DEPENDENT_WINDOWS = buildDetailWindows(
  "employees",
  "employee",
  EMPLOYEE_DETAIL_TABS,
  "People",
  "Business Partner (Employee)",
  EMPLOYEE_TAB_KEY_OVERRIDES
);

const LOCATION_TAB_KEY_OVERRIDES: Record<string, string> = {
  "Contact & address": "location-contact-and-address",
  "Products & services": "location-products-and-services",
};

export const LOCATION_DETAIL_TABS = [...locationTabs];

export const LOCATION_DEPENDENT_WINDOWS = buildDetailWindows(
  "locations",
  "location",
  LOCATION_DETAIL_TABS,
  "Locations",
  "Support Location",
  LOCATION_TAB_KEY_OVERRIDES
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
    case "incidents":
      return INCIDENT_DEPENDENT_WINDOWS;
    case "employees":
      return EMPLOYEE_DEPENDENT_WINDOWS;
    case "locations":
      return LOCATION_DEPENDENT_WINDOWS;
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
