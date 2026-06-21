export type PortalServiceRequestStatus = "Submitted" | "Under review" | "Approved" | "Declined";

export type PortalServiceCatalogItem = {
  id: string;
  label: string;
  supportBudget: string;
};

export const PORTAL_SERVICE_CATALOG: PortalServiceCatalogItem[] = [
  { id: "daily-life", label: "Assistance with daily life", supportBudget: "Core" },
  { id: "community", label: "Community participation", supportBudget: "Core" },
  { id: "sil", label: "Supported independent living", supportBudget: "Core" },
  { id: "support-coord", label: "Support coordination", supportBudget: "Capacity building" },
  { id: "therapy", label: "Therapy or allied health", supportBudget: "Capacity building" },
  { id: "other", label: "Other — describe below", supportBudget: "Core" },
];

export type PortalServiceRequestRecord = {
  id: string;
  clientId: string;
  status: PortalServiceRequestStatus;
  serviceCategory: string;
  supportBudget: string;
  description: string;
  preferredSchedule: string;
  taskId: string;
  variationAgreementId: string;
  submittedByEmail: string;
  declineReason: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type PortalServiceRequestSubmit = {
  serviceCategory: string;
  supportBudget: string;
  description: string;
  preferredSchedule: string;
};

export function portalServiceRequestDedupeKey(requestId: string): string {
  return `portal-sr:${requestId}`;
}

export function parsePortalServiceRequestId(dedupeKey: string): string | null {
  if (!dedupeKey.startsWith("portal-sr:")) return null;
  const id = dedupeKey.slice("portal-sr:".length).trim();
  return id || null;
}

export function portalServiceRequestStatusLabel(status: PortalServiceRequestStatus): string {
  switch (status) {
    case "Submitted":
      return "Submitted";
    case "Under review":
      return "Under review";
    case "Approved":
      return "Approved";
    case "Declined":
      return "Declined";
    default:
      return status;
  }
}

export function portalServiceRequestStatusStyles(status: PortalServiceRequestStatus): string {
  switch (status) {
    case "Submitted":
      return "bg-sky-50 text-sky-800 ring-sky-200";
    case "Under review":
      return "bg-amber-50 text-amber-900 ring-amber-200";
    case "Approved":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "Declined":
      return "bg-rose-50 text-rose-800 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}
