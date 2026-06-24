import { agencyWorkerDisplayName, agencyWorkersForVendor, initialAgencyWorkers, isAgencyVendorPartner } from "@/lib/agency-worker";
import { initialAgencyShiftRequests, normalizeAgencyShiftRequest, type AgencyShiftRequestRecord } from "@/lib/agency-shift-request";
import { initialAgencyTimesheets, normalizeAgencyTimesheet, type AgencyTimesheetRecord } from "@/lib/agency-timesheet";
import { vendorConfirmAgencyCoverage } from "@/lib/agency-shift-workflow";
import { initialBusinessPartners } from "@/lib/business-partner";
import { initialClients } from "@/lib/client";
import { initialLocations } from "@/lib/location";
import type { AgencyPortalSession } from "@/lib/agency-portal/session.server";
import type {
  AgencyPortalInvoiceItem,
  AgencyPortalRequestItem,
  AgencyPortalTimesheetItem,
  AgencyPortalVendorSummary,
} from "@/lib/agency-portal/types";
import { formatDayHeading, formatShiftTimeRange, initialRosterShifts, normalizeRosterShift } from "@/lib/roster-shift";
import { createVendorInvoice, initialVendorInvoices, normalizeVendorInvoice, type VendorInvoiceRecord } from "@/lib/vendor-invoice";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  agencyShiftRequestFromRow,
  agencyTimesheetFromRow,
  agencyWorkerFromRow,
  clientFromRow,
  rosterShiftFromRow,
  vendorInvoiceFromRow,
  type AgencyShiftRequestRow,
  type AgencyTimesheetRow,
  type AgencyWorkerRow,
  type BusinessPartnerRow,
  type ClientRow,
  type RosterShiftRow,
  type VendorInvoiceRow,
} from "@/lib/supabase/mappers";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

const VENDOR_INVOICE_DOC_BUCKET = "org-documents";
const VENDOR_INVOICE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const VENDOR_INVOICE_ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sanitizeFileName(name: string): string {
  const base = name.trim().replace(/[/\\?%*:|"<>]/g, "_");
  return base.slice(0, 180) || "invoice.pdf";
}

function fileExtension(name: string): string {
  const parts = name.trim().toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() ?? "") : "";
}

function mimeFromExtension(ext: string): string | null {
  if (ext === "pdf") return "application/pdf";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return null;
}

export function validateVendorInvoiceDocument(file: File): string | null {
  if (!file || file.size <= 0) return "An invoice document (PDF or image) is required.";
  if (file.size > VENDOR_INVOICE_MAX_BYTES) return "Invoice document must be 10 MB or smaller.";

  const mime = file.type?.trim().toLowerCase() || "";
  const ext = fileExtension(file.name);
  const extMime = mimeFromExtension(ext);

  if (VENDOR_INVOICE_ALLOWED_MIME.has(mime)) return null;
  if (!mime || mime === "application/octet-stream") {
    if (extMime) return null;
  }
  if (extMime && (mime === "" || mime === "application/octet-stream")) return null;

  return "Invoice document must be a PDF or image (JPEG, PNG, or WebP).";
}

async function uploadVendorInvoiceDocument(input: {
  vendorBpId: string;
  invoiceId: string;
  file: File;
}): Promise<
  | { ok: true; storagePath: string; fileName: string; mimeType: string; byteSize: number }
  | { ok: false; error: string }
> {
  const validationError = validateVendorInvoiceDocument(input.file);
  if (validationError) return { ok: false, error: validationError };

  const fileName = sanitizeFileName(input.file.name);
  const mimeType =
    input.file.type?.trim() && VENDOR_INVOICE_ALLOWED_MIME.has(input.file.type.trim())
      ? input.file.type.trim()
      : mimeFromExtension(fileExtension(input.file.name)) ?? "application/octet-stream";
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const storagePath = `vendor-invoices/${input.vendorBpId}/${input.invoiceId}/${Date.now()}-${fileName}`;

  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      storagePath: `local://${storagePath}`,
      fileName,
      mimeType,
      byteSize: bytes.byteLength,
    };
  }

  const supabase = serviceClient();
  const { error } = await supabase.storage
    .from(VENDOR_INVOICE_DOC_BUCKET)
    .upload(storagePath, bytes, { contentType: mimeType, upsert: true });
  if (error) return { ok: false, error: error.message };

  return { ok: true, storagePath, fileName, mimeType, byteSize: bytes.byteLength };
}

export async function getVendorInvoiceDocumentSignedUrl(
  storagePath: string
): Promise<{ signedUrl: string | null; fileName: string; mimeType: string } | null> {
  if (!storagePath?.trim() || storagePath.startsWith("local://")) return null;
  if (!isSupabaseConfigured()) return null;

  const supabase = serviceClient();
  const { data, error } = await supabase.storage
    .from(VENDOR_INVOICE_DOC_BUCKET)
    .createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) return null;

  const fileName = storagePath.split("/").pop() ?? "invoice";
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const mimeType =
    ext === "pdf"
      ? "application/pdf"
      : ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";

  return { signedUrl: data.signedUrl, fileName, mimeType };
}

async function loadVendorInvoiceById(
  vendorBpId: string,
  invoiceId: string
): Promise<VendorInvoiceRecord | null> {
  const invoices = await loadVendorInvoices(vendorBpId);
  return invoices.find((i) => i.id === invoiceId) ?? null;
}

export async function loadAgencyPortalInvoiceDocument(
  vendorBpId: string,
  invoiceId: string
): Promise<{ signedUrl: string | null; fileName: string; mimeType: string } | null> {
  const invoice = await loadVendorInvoiceById(vendorBpId, invoiceId);
  if (!invoice?.documentStoragePath?.trim()) return null;
  return getVendorInvoiceDocumentSignedUrl(invoice.documentStoragePath);
}

export async function loadStaffVendorInvoiceDocument(
  invoiceId: string
): Promise<{ signedUrl: string | null; fileName: string; mimeType: string } | null> {
  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { data } = await supabase
      .from("vendor_invoice")
      .select("document_storage_path, document_file_name, document_mime_type")
      .eq("id", invoiceId)
      .maybeSingle();
    if (!data?.document_storage_path?.trim()) return null;
    const signed = await getVendorInvoiceDocumentSignedUrl(data.document_storage_path);
    if (!signed) return null;
    return {
      signedUrl: signed.signedUrl,
      fileName: data.document_file_name?.trim() || signed.fileName,
      mimeType: data.document_mime_type?.trim() || signed.mimeType,
    };
  }

  const local = initialVendorInvoices.find((i) => i.id === invoiceId);
  if (!local?.documentStoragePath?.trim()) return null;
  return getVendorInvoiceDocumentSignedUrl(local.documentStoragePath);
}

function participantLabel(name: string, preferredName: string): string {
  const label = preferredName?.trim() || name?.trim() || "Participant";
  return label.split(" ")[0] || "Participant";
}

export async function findAgencyPortalVendorByEmail(email: string): Promise<AgencyPortalVendorSummary | null> {
  const target = normalizeEmail(email);
  if (!target) return null;

  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { data: rows } = await supabase.from("business_partner").select("id, name, email, partner_type, status");
    const matches = (rows ?? []).filter(
      (r) =>
        isAgencyVendorPartner(String(r.partner_type ?? "")) &&
        String(r.status ?? "") === "Active" &&
        normalizeEmail(String(r.email ?? "")) === target
    );
    if (matches.length !== 1) return null;
    const match = matches[0]!;
    return { id: match.id, name: match.name, email: match.email ?? "" };
  }

  const localMatches = initialBusinessPartners.filter(
    (p) => isAgencyVendorPartner(p.partnerType) && p.status === "Active" && normalizeEmail(p.email) === target
  );
  if (localMatches.length !== 1) return null;
  const local = localMatches[0]!;
  return { id: local.id, name: local.name, email: local.email };
}

export async function loadAgencyPortalVendorSummary(vendorBpId: string): Promise<AgencyPortalVendorSummary | null> {
  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { data: row } = await supabase
      .from("business_partner")
      .select("id, name, email, partner_type, status")
      .eq("id", vendorBpId)
      .maybeSingle();
    if (!row || !isAgencyVendorPartner(String(row.partner_type ?? ""))) return null;
    if (String(row.status ?? "") !== "Active") return null;
    return { id: row.id, name: row.name, email: row.email ?? "" };
  }
  const local = initialBusinessPartners.find((p) => p.id === vendorBpId);
  if (!local || !isAgencyVendorPartner(local.partnerType) || local.status !== "Active") return null;
  return { id: local.id, name: local.name, email: local.email };
}

export function requireAgencyPortalSession(session: AgencyPortalSession | null): AgencyPortalSession | null {
  if (!session?.vendorBpId?.trim()) return null;
  return session;
}

async function emailsMatchVendor(vendorBpId: string, sessionEmail: string): Promise<boolean> {
  const vendor = await loadAgencyPortalVendorSummary(vendorBpId);
  if (!vendor?.email?.trim()) return false;
  return normalizeEmail(vendor.email) === normalizeEmail(sessionEmail);
}

export async function resolveValidAgencyPortalSession(
  session: AgencyPortalSession | null
): Promise<AgencyPortalSession | null> {
  const base = requireAgencyPortalSession(session);
  if (!base) return null;
  if (!(await emailsMatchVendor(base.vendorBpId, base.email))) return null;
  const vendor = await loadAgencyPortalVendorSummary(base.vendorBpId);
  if (!vendor) return null;
  return {
    vendorBpId: vendor.id,
    email: normalizeEmail(vendor.email),
    displayName: vendor.name,
  };
}

async function loadVendorRequests(vendorBpId: string): Promise<AgencyShiftRequestRecord[]> {
  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { data } = await supabase
      .from("agency_shift_request")
      .select("*")
      .eq("vendor_bp_id", vendorBpId)
      .order("document_no", { ascending: false });
    return ((data ?? []) as AgencyShiftRequestRow[]).map((row) => agencyShiftRequestFromRow(row));
  }
  return initialAgencyShiftRequests
    .map(normalizeAgencyShiftRequest)
    .filter((r) => r.vendorBpId === vendorBpId);
}

async function loadShiftMap(shiftIds: string[]): Promise<Map<string, ReturnType<typeof normalizeRosterShift>>> {
  const map = new Map<string, ReturnType<typeof normalizeRosterShift>>();
  if (!shiftIds.length) return map;

  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { data } = await supabase.from("roster_shift").select("*").in("id", shiftIds);
    for (const row of data ?? []) {
      map.set(row.id, normalizeRosterShift(rosterShiftFromRow(row as RosterShiftRow)));
    }
    return map;
  }

  for (const shift of initialRosterShifts) {
    if (shiftIds.includes(shift.id)) map.set(shift.id, normalizeRosterShift(shift));
  }
  return map;
}

async function loadClientMap(clientIds: string[]): Promise<Map<string, { name: string; preferredName: string }>> {
  const map = new Map<string, { name: string; preferredName: string }>();
  if (!clientIds.length) return map;

  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { data } = await supabase.from("client").select("id, name, preferred_name").in("id", clientIds);
    for (const row of data ?? []) {
      const client = clientFromRow(row as ClientRow, [], [], [], [], [], [], [], [], []);
      map.set(client.id, { name: client.name, preferredName: client.preferredName });
    }
    return map;
  }

  for (const client of initialClients) {
    if (clientIds.includes(client.id)) map.set(client.id, { name: client.name, preferredName: client.preferredName });
  }
  return map;
}

async function loadLocationMap(locationIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!locationIds.length) return map;

  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { data } = await supabase.from("location").select("id, name").in("id", locationIds);
    for (const row of data ?? []) {
      map.set(row.id, String(row.name ?? row.id));
    }
    return map;
  }

  for (const loc of initialLocations) {
    if (locationIds.includes(loc.id)) map.set(loc.id, loc.name);
  }
  return map;
}

async function loadWorkerNameMap(vendorBpId: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { data } = await supabase.from("agency_worker").select("*").eq("vendor_bp_id", vendorBpId);
    for (const row of data ?? []) {
      const worker = agencyWorkerFromRow(row as AgencyWorkerRow);
      map.set(worker.id, agencyWorkerDisplayName(worker));
    }
    return map;
  }

  for (const worker of agencyWorkersForVendor(initialAgencyWorkers, vendorBpId)) {
    map.set(worker.id, agencyWorkerDisplayName(worker));
  }
  return map;
}

export async function loadAgencyPortalRequests(vendorBpId: string): Promise<AgencyPortalRequestItem[]> {
  const requests = await loadVendorRequests(vendorBpId);
  const shiftIds = [...new Set(requests.map((r) => r.rosterShiftId).filter(Boolean))];
  const shifts = await loadShiftMap(shiftIds);
  const clientIds = [...new Set([...shifts.values()].map((s) => s.clientId).filter(Boolean))];
  const locationIds = [...new Set([...shifts.values()].map((s) => s.locationId).filter(Boolean))];
  const clients = await loadClientMap(clientIds);
  const locations = await loadLocationMap(locationIds);
  const workers = await loadWorkerNameMap(vendorBpId);

  return requests.map((request) => {
    const shift = shifts.get(request.rosterShiftId);
    const client = shift ? clients.get(shift.clientId) : undefined;
    const locationName = shift ? locations.get(shift.locationId) ?? "Site" : "Site";
    return {
      id: request.id,
      documentNo: request.documentNo,
      status: request.status,
      rosterShiftId: request.rosterShiftId,
      shiftDate: shift?.shiftDate ?? "",
      startTime: shift?.startTime ?? "",
      endTime: shift?.endTime ?? "",
      shiftRef: shift?.shiftRef ?? "",
      locationName,
      clientLabel: client ? participantLabel(client.name, client.preferredName) : "Participant",
      skillsRequired: request.skillsRequired,
      agencyWorkerId: request.agencyWorkerId,
      agencyWorkerName: request.agencyWorkerId ? workers.get(request.agencyWorkerId) ?? "" : "",
      sentAt: request.sentAt,
      vendorConfirmedAt: request.vendorConfirmedAt,
      continuityNotes: request.continuityNotes,
      canConfirm: request.status === "Sent",
    };
  });
}

export async function loadAgencyPortalRequest(
  vendorBpId: string,
  requestId: string
): Promise<AgencyPortalRequestItem | null> {
  const items = await loadAgencyPortalRequests(vendorBpId);
  return items.find((r) => r.id === requestId) ?? null;
}

export async function confirmAgencyPortalRequest(input: {
  vendorBpId: string;
  requestId: string;
  agencyWorkerId: string;
  continuityNotes?: string;
  actor: string;
}): Promise<{ ok: boolean; error?: string; item?: AgencyPortalRequestItem }> {
  const requests = await loadVendorRequests(input.vendorBpId);
  const request = requests.find((r) => r.id === input.requestId);
  if (!request) return { ok: false, error: "Shift request not found." };

  const workers = await loadWorkerNameMap(input.vendorBpId);
  if (!workers.has(input.agencyWorkerId)) {
    return { ok: false, error: "Selected worker is not registered for your agency." };
  }

  const result = vendorConfirmAgencyCoverage({
    request,
    agencyWorkerId: input.agencyWorkerId,
    continuityNotes: input.continuityNotes,
    actor: input.actor,
  });
  if (!result.ok || !result.request) return { ok: false, error: result.error ?? "Could not confirm coverage." };

  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { agencyShiftRequestToRow } = await import("@/lib/supabase/mappers");
    const { error } = await supabase.from("agency_shift_request").upsert(agencyShiftRequestToRow(result.request));
    if (error) return { ok: false, error: error.message };
  } else {
    const idx = initialAgencyShiftRequests.findIndex((r) => r.id === result.request!.id);
    if (idx >= 0) initialAgencyShiftRequests[idx] = result.request;
    else initialAgencyShiftRequests.push(result.request);
  }

  const item = await loadAgencyPortalRequest(input.vendorBpId, input.requestId);
  return item ? { ok: true, item } : { ok: true };
}

async function loadVendorTimesheets(vendorBpId: string): Promise<AgencyTimesheetRecord[]> {
  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { data: sheets } = await supabase
      .from("agency_timesheet")
      .select("*")
      .eq("vendor_bp_id", vendorBpId)
      .order("period_start", { ascending: false });
    const ids = (sheets ?? []).map((s) => s.id);
    const linesBySheet = new Map<string, import("@/lib/supabase/mappers").AgencyTimesheetLineRowDb[]>();
    if (ids.length) {
      const { data: lines } = await supabase.from("agency_timesheet_line").select("*").in("agency_timesheet_id", ids);
      for (const line of lines ?? []) {
        const list = linesBySheet.get(line.agency_timesheet_id) ?? [];
        list.push(line);
        linesBySheet.set(line.agency_timesheet_id, list);
      }
    }
    return ((sheets ?? []) as AgencyTimesheetRow[]).map((row) =>
      agencyTimesheetFromRow(row, linesBySheet.get(row.id) ?? [])
    );
  }
  return initialAgencyTimesheets.map(normalizeAgencyTimesheet).filter((s) => s.vendorBpId === vendorBpId);
}

async function loadVendorInvoices(vendorBpId: string): Promise<VendorInvoiceRecord[]> {
  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { data } = await supabase
      .from("vendor_invoice")
      .select("*")
      .eq("vendor_bp_id", vendorBpId)
      .order("document_no", { ascending: false });
    return ((data ?? []) as VendorInvoiceRow[]).map((row) => vendorInvoiceFromRow(row));
  }
  return initialVendorInvoices.map(normalizeVendorInvoice).filter((v) => v.vendorBpId === vendorBpId);
}

export async function loadAgencyPortalTimesheets(vendorBpId: string): Promise<AgencyPortalTimesheetItem[]> {
  const [timesheets, invoices] = await Promise.all([
    loadVendorTimesheets(vendorBpId),
    loadVendorInvoices(vendorBpId),
  ]);
  const invoicedTimesheetIds = new Set(invoices.map((i) => i.agencyTimesheetId));

  return timesheets
    .filter((s) => s.status === "Approved")
    .map((sheet) => ({
      id: sheet.id,
      documentNo: sheet.documentNo,
      periodStart: sheet.periodStart,
      periodEnd: sheet.periodEnd,
      totalHours: sheet.totalHours,
      totalVendorCost: sheet.totalVendorCost,
      status: sheet.status,
      hasInvoice: invoicedTimesheetIds.has(sheet.id),
    }));
}

export async function loadAgencyPortalInvoices(vendorBpId: string): Promise<AgencyPortalInvoiceItem[]> {
  const [invoices, timesheets] = await Promise.all([
    loadVendorInvoices(vendorBpId),
    loadVendorTimesheets(vendorBpId),
  ]);
  const timesheetDocById = new Map(timesheets.map((t) => [t.id, t.documentNo]));

  return invoices.map((invoice) => ({
    id: invoice.id,
    documentNo: invoice.documentNo,
    agencyTimesheetDocumentNo: timesheetDocById.get(invoice.agencyTimesheetId) ?? "",
    invoiceNo: invoice.invoiceNo,
    invoiceDate: invoice.invoiceDate,
    amount: invoice.amount,
    status: invoice.status,
    submittedAt: invoice.submittedAt,
    documentFileName: invoice.documentFileName,
    hasDocument: Boolean(invoice.documentStoragePath?.trim()),
  }));
}

export async function submitAgencyPortalInvoice(input: {
  vendorBpId: string;
  agencyTimesheetId: string;
  invoiceNo: string;
  invoiceDate: string;
  amount: number;
  notes?: string;
  file: File;
  actor: string;
}): Promise<{ ok: boolean; error?: string; invoice?: AgencyPortalInvoiceItem }> {
  const timesheets = await loadVendorTimesheets(input.vendorBpId);
  const timesheet = timesheets.find((t) => t.id === input.agencyTimesheetId);
  if (!timesheet) return { ok: false, error: "Timesheet not found." };
  if (timesheet.status !== "Approved") {
    return { ok: false, error: "Only approved timesheets can be invoiced." };
  }
  if (Math.abs(input.amount - timesheet.totalVendorCost) > 0.01) {
    return {
      ok: false,
      error: `Invoice amount must match the approved timesheet total (${timesheet.totalVendorCost.toFixed(2)}).`,
    };
  }

  const existing = await loadVendorInvoices(input.vendorBpId);
  if (existing.some((i) => i.agencyTimesheetId === input.agencyTimesheetId)) {
    return { ok: false, error: "An invoice has already been submitted for this timesheet." };
  }

  const draftId = `vi-${Date.now()}`;
  const upload = await uploadVendorInvoiceDocument({
    vendorBpId: input.vendorBpId,
    invoiceId: draftId,
    file: input.file,
  });
  if (!upload.ok) return { ok: false, error: upload.error };

  const invoice = createVendorInvoice(
    {
      id: draftId,
      vendorBpId: input.vendorBpId,
      agencyTimesheetId: input.agencyTimesheetId,
      invoiceNo: input.invoiceNo,
      invoiceDate: input.invoiceDate,
      amount: input.amount,
      notes: input.notes ?? "",
      documentStoragePath: upload.storagePath,
      documentFileName: upload.fileName,
      documentMimeType: upload.mimeType,
      documentByteSize: upload.byteSize,
      createdBy: input.actor,
      updatedBy: input.actor,
    },
    existing
  );

  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { vendorInvoiceToRow } = await import("@/lib/supabase/mappers");
    const { error } = await supabase.from("vendor_invoice").upsert(vendorInvoiceToRow(invoice));
    if (error) {
      if (upload.storagePath && !upload.storagePath.startsWith("local://")) {
        await supabase.storage.from(VENDOR_INVOICE_DOC_BUCKET).remove([upload.storagePath]);
      }
      return { ok: false, error: error.message };
    }
  } else {
    initialVendorInvoices.push(invoice);
  }

  const items = await loadAgencyPortalInvoices(input.vendorBpId);
  const item = items.find((i) => i.id === invoice.id);
  return item ? { ok: true, invoice: item } : { ok: true };
}

export async function loadAgencyPortalWorkers(vendorBpId: string): Promise<{ id: string; name: string }[]> {
  const names = await loadWorkerNameMap(vendorBpId);
  return [...names.entries()].map(([id, name]) => ({ id, name }));
}
