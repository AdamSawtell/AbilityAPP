export type AccessWindowGroup = "Core" | "People" | "Services" | "Admin";

export type AccessWindow = {
  key: string;
  label: string;
  group: AccessWindowGroup;
  /** Sidebar route; omit for tab-only dependent windows */
  href?: string;
  abilityErpName?: string;
  /** Parent window required for access (AbilityERP dependent window) */
  parentWindowKey?: string;
  /** Detail tab label when this window maps to a tab on a parent record */
  detailTab?: string;
  /** False for dependent tab windows — they do not appear in the main sidebar */
  showInSidebar?: boolean;
};

export type AccessProcess = {
  id: string;
  label: string;
  description: string;
  /** Optional parent window for process visibility */
  parentWindowKey?: string;
};
