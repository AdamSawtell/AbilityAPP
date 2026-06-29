import type {
  MaintenancePhotoRow,
  MaintenanceRequestRecord,
} from "@/lib/maintenance-request";
import { normalizeMaintenanceRequest } from "@/lib/maintenance-request";

export type MaintenanceRequestRowDb = {
  id: string;
  document_no: string;
  location_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_employee_id: string | null;
  contractor_name: string;
  contractor_phone: string;
  contractor_email: string;
  estimated_cost: number | null;
  actual_cost: number | null;
  cost_status: string;
  cost_approved_by: string;
  cost_approved_at: string | null;
  invoice_number: string;
  supplier_name: string;
  xero_bill_reference: string;
  gst_treatment: string;
  reported_by: string;
  reported_at: string;
  scheduled_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  requestor_confirmed_at: string | null;
  incident_id: string | null;
  sla_breached: boolean;
  created_by: string;
  updated_by: string;
};

export type MaintenancePhotoRowDb = {
  id: string;
  request_id: string;
  line_no: number;
  photo_type: string;
  file_url: string;
  caption: string;
  uploaded_at: string;
  uploaded_by: string;
};

export function maintenancePhotoFromRow(row: MaintenancePhotoRowDb): MaintenancePhotoRow {
  return {
    id: row.id,
    lineNo: row.line_no,
    photoType: row.photo_type,
    fileUrl: row.file_url,
    caption: row.caption,
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploaded_by,
  };
}

export function maintenancePhotoToRow(
  requestId: string,
  row: MaintenancePhotoRow
): MaintenancePhotoRowDb {
  return {
    id: row.id,
    request_id: requestId,
    line_no: row.lineNo,
    photo_type: row.photoType,
    file_url: row.fileUrl,
    caption: row.caption,
    uploaded_at: row.uploadedAt || new Date().toISOString(),
    uploaded_by: row.uploadedBy,
  };
}

export function maintenanceRequestFromRow(
  row: MaintenanceRequestRowDb,
  children?: { photos?: MaintenancePhotoRow[] }
): MaintenanceRequestRecord {
  return normalizeMaintenanceRequest({
    id: row.id,
    documentNo: row.document_no,
    locationId: row.location_id,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status,
    assignedEmployeeId: row.assigned_employee_id ?? "",
    contractorName: row.contractor_name,
    contractorPhone: row.contractor_phone,
    contractorEmail: row.contractor_email,
    estimatedCost: row.estimated_cost ?? "",
    actualCost: row.actual_cost ?? "",
    costStatus: row.cost_status,
    costApprovedBy: row.cost_approved_by,
    costApprovedAt: row.cost_approved_at ?? "",
    invoiceNumber: row.invoice_number,
    supplierName: row.supplier_name,
    xeroBillReference: row.xero_bill_reference,
    gstTreatment: row.gst_treatment,
    reportedBy: row.reported_by,
    reportedAt: row.reported_at,
    scheduledAt: row.scheduled_at ?? "",
    resolvedAt: row.resolved_at ?? "",
    closedAt: row.closed_at ?? "",
    requestorConfirmedAt: row.requestor_confirmed_at ?? "",
    incidentId: row.incident_id ?? "",
    slaBreached: row.sla_breached,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    photos: children?.photos ?? [],
  });
}

export function maintenanceRequestToRow(record: MaintenanceRequestRecord): MaintenanceRequestRowDb {
  const normalized = normalizeMaintenanceRequest(record);
  return {
    id: normalized.id,
    document_no: normalized.documentNo,
    location_id: normalized.locationId,
    title: normalized.title,
    description: normalized.description,
    category: normalized.category,
    priority: normalized.priority,
    status: normalized.status,
    assigned_employee_id: normalized.assignedEmployeeId || null,
    contractor_name: normalized.contractorName,
    contractor_phone: normalized.contractorPhone,
    contractor_email: normalized.contractorEmail,
    estimated_cost: normalized.estimatedCost === "" ? null : normalized.estimatedCost,
    actual_cost: normalized.actualCost === "" ? null : normalized.actualCost,
    cost_status: normalized.costStatus,
    cost_approved_by: normalized.costApprovedBy,
    cost_approved_at: normalized.costApprovedAt || null,
    invoice_number: normalized.invoiceNumber,
    supplier_name: normalized.supplierName,
    xero_bill_reference: normalized.xeroBillReference,
    gst_treatment: normalized.gstTreatment,
    reported_by: normalized.reportedBy,
    reported_at: normalized.reportedAt || new Date().toISOString(),
    scheduled_at: normalized.scheduledAt || null,
    resolved_at: normalized.resolvedAt || null,
    closed_at: normalized.closedAt || null,
    requestor_confirmed_at: normalized.requestorConfirmedAt || null,
    incident_id: normalized.incidentId || null,
    sla_breached: normalized.slaBreached,
    created_by: normalized.createdBy,
    updated_by: normalized.updatedBy,
  };
}
