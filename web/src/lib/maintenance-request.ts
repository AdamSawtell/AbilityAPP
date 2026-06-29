import { defaultReferenceData } from "@/lib/reference-data";

export type MaintenanceRequestStatus =
  | "reported"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed"
  | "cancelled";

export type MaintenanceRequestPriority = "urgent" | "high" | "medium" | "low";

export type MaintenanceRequestCategory =
  | "plumbing"
  | "electrical"
  | "structural"
  | "equipment"
  | "general";

export type MaintenanceCostStatus = "pending" | "reviewed" | "approved" | "rejected";

export type MaintenancePhotoType = "issue" | "completion" | "invoice";

export type MaintenancePhotoRow = {
  id: string;
  lineNo: number;
  photoType: MaintenancePhotoType | string;
  fileUrl: string;
  caption: string;
  uploadedAt: string;
  uploadedBy: string;
};

export type MaintenanceRequestRecord = {
  id: string;
  documentNo: string;
  locationId: string;
  title: string;
  description: string;
  category: MaintenanceRequestCategory | string;
  priority: MaintenanceRequestPriority | string;
  status: MaintenanceRequestStatus | string;
  assignedEmployeeId: string;
  contractorName: string;
  contractorPhone: string;
  contractorEmail: string;
  estimatedCost: number | "";
  actualCost: number | "";
  costStatus: MaintenanceCostStatus | string;
  costApprovedBy: string;
  costApprovedAt: string;
  invoiceNumber: string;
  supplierName: string;
  xeroBillReference: string;
  gstTreatment: string;
  reportedBy: string;
  reportedAt: string;
  scheduledAt: string;
  resolvedAt: string;
  closedAt: string;
  requestorConfirmedAt: string;
  incidentId: string;
  slaBreached: boolean;
  createdBy: string;
  updatedBy: string;
  photos: MaintenancePhotoRow[];
};

export const maintenanceRequestTabs = ["Overview", "Assignment", "Costs", "Photos"] as const;
export type MaintenanceRequestTab = (typeof maintenanceRequestTabs)[number];

export const maintenanceRequestTabGroups = [
  { label: "Core", tabs: ["Overview", "Assignment"] as MaintenanceRequestTab[] },
  { label: "Records", tabs: ["Costs", "Photos"] as MaintenanceRequestTab[] },
];

export const maintenanceRequestStatusOptions: MaintenanceRequestStatus[] = [
  "reported",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
  "cancelled",
];

export const maintenanceRequestPriorityOptions: MaintenanceRequestPriority[] = [
  "urgent",
  "high",
  "medium",
  "low",
];

export const maintenanceRequestCategoryOptions: MaintenanceRequestCategory[] = [
  "plumbing",
  "electrical",
  "structural",
  "equipment",
  "general",
];

export const maintenanceCostStatusOptions: MaintenanceCostStatus[] = [
  "pending",
  "reviewed",
  "approved",
  "rejected",
];

export const maintenancePhotoTypeOptions: MaintenancePhotoType[] = ["issue", "completion", "invoice"];

export const maintenanceCategoryOptions = defaultReferenceData.maintenanceCategory;
export const maintenancePriorityOptions = defaultReferenceData.maintenancePriority;
export const maintenanceStatusOptions = defaultReferenceData.maintenanceStatus;
export const maintenanceCostStatusRefOptions = defaultReferenceData.maintenanceCostStatus;

export function newMaintenanceRequestId(): string {
  return `maint-${Date.now()}`;
}

export function emptyMaintenancePhoto(lineNo = 1): MaintenancePhotoRow {
  return {
    id: `maint-photo-${Date.now()}-${lineNo}`,
    lineNo,
    photoType: "issue",
    fileUrl: "",
    caption: "",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "",
  };
}

export function emptyMaintenanceRequest(): MaintenanceRequestRecord {
  const now = new Date().toISOString();
  return normalizeMaintenanceRequest({
    id: "",
    documentNo: "",
    locationId: "",
    title: "",
    description: "",
    category: "general",
    priority: "medium",
    status: "reported",
    assignedEmployeeId: "",
    contractorName: "",
    contractorPhone: "",
    contractorEmail: "",
    estimatedCost: "",
    actualCost: "",
    costStatus: "pending",
    costApprovedBy: "",
    costApprovedAt: "",
    invoiceNumber: "",
    supplierName: "",
    xeroBillReference: "",
    gstTreatment: "",
    reportedBy: "",
    reportedAt: now,
    scheduledAt: "",
    resolvedAt: "",
    closedAt: "",
    requestorConfirmedAt: "",
    incidentId: "",
    slaBreached: false,
    createdBy: "",
    updatedBy: "",
    photos: [],
  });
}

export function nextMaintenanceRequestId(existing: MaintenanceRequestRecord[]): {
  id: string;
  documentNo: string;
} {
  const max = existing.reduce((highest, row) => {
    const n = Number.parseInt(row.id.replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > highest ? n : highest;
  }, 0);
  const next = max + 1;
  return { id: `maint-${next}`, documentNo: `MR-${String(next).padStart(4, "0")}` };
}

export function createMaintenanceRequest(
  partial: Partial<MaintenanceRequestRecord>,
  existing: MaintenanceRequestRecord[]
): MaintenanceRequestRecord {
  const { id, documentNo } = nextMaintenanceRequestId(existing);
  const now = new Date().toISOString();
  return normalizeMaintenanceRequest({
    ...emptyMaintenanceRequest(),
    ...partial,
    id,
    documentNo,
    reportedAt: partial.reportedAt || now,
    createdBy: partial.createdBy || partial.reportedBy || "SuperUser",
    updatedBy: partial.updatedBy || partial.reportedBy || "SuperUser",
  });
}

function renumberPhotos(rows: MaintenancePhotoRow[]): MaintenancePhotoRow[] {
  return rows.map((row, index) => ({ ...row, lineNo: index + 1 }));
}

export function normalizeMaintenanceRequest(record: MaintenanceRequestRecord): MaintenanceRequestRecord {
  return {
    ...record,
    title: record.title?.trim() ?? "",
    description: record.description?.trim() ?? "",
    category: record.category || "general",
    priority: record.priority || "medium",
    status: record.status || "reported",
    assignedEmployeeId: record.assignedEmployeeId?.trim() ?? "",
    contractorName: record.contractorName?.trim() ?? "",
    contractorPhone: record.contractorPhone?.trim() ?? "",
    contractorEmail: record.contractorEmail?.trim() ?? "",
    estimatedCost: record.estimatedCost === "" || record.estimatedCost == null ? "" : Number(record.estimatedCost),
    actualCost: record.actualCost === "" || record.actualCost == null ? "" : Number(record.actualCost),
    costStatus: record.costStatus || "pending",
    costApprovedBy: record.costApprovedBy?.trim() ?? "",
    costApprovedAt: record.costApprovedAt?.trim() ?? "",
    invoiceNumber: record.invoiceNumber?.trim() ?? "",
    supplierName: record.supplierName?.trim() ?? "",
    xeroBillReference: record.xeroBillReference?.trim() ?? "",
    gstTreatment: record.gstTreatment?.trim() ?? "",
    reportedBy: record.reportedBy?.trim() ?? "",
    reportedAt: record.reportedAt?.trim() ?? "",
    scheduledAt: record.scheduledAt?.trim() ?? "",
    resolvedAt: record.resolvedAt?.trim() ?? "",
    closedAt: record.closedAt?.trim() ?? "",
    requestorConfirmedAt: record.requestorConfirmedAt?.trim() ?? "",
    incidentId: record.incidentId?.trim() ?? "",
    slaBreached: Boolean(record.slaBreached),
    photos: renumberPhotos(record.photos ?? []),
  };
}

export function isOpenMaintenanceRequest(record: MaintenanceRequestRecord): boolean {
  return record.status !== "closed" && record.status !== "cancelled";
}

export function maintenanceStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export function maintenancePriorityLabel(priority: string): string {
  return priority.replace(/_/g, " ");
}

export function findMaintenanceRequestByRouteId(
  records: MaintenanceRequestRecord[],
  routeId: string
): MaintenanceRequestRecord | undefined {
  return records.find((row) => row.id === routeId || row.documentNo === routeId);
}
