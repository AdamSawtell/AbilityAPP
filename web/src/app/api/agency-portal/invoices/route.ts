import { NextResponse } from "next/server";
import { getAgencyPortalSessionFromRequest } from "@/lib/agency-portal/session.server";
import {
  loadAgencyPortalInvoiceDocument,
  loadAgencyPortalInvoices,
  resolveValidAgencyPortalSession,
  submitAgencyPortalInvoice,
  validateVendorInvoiceDocument,
} from "@/lib/agency-portal/server";

export async function GET(request: Request) {
  const raw = await getAgencyPortalSessionFromRequest(request);
  const session = await resolveValidAgencyPortalSession(raw);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoices = await loadAgencyPortalInvoices(session.vendorBpId);
  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  const raw = await getAgencyPortalSessionFromRequest(request);
  const session = await resolveValidAgencyPortalSession(raw);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const agencyTimesheetId = String(formData.get("agencyTimesheetId") ?? "").trim();
  const invoiceNo = String(formData.get("invoiceNo") ?? "").trim();
  const invoiceDate = String(formData.get("invoiceDate") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const notes = String(formData.get("notes") ?? "").trim();
  const file = formData.get("file");

  if (!agencyTimesheetId || !invoiceNo || !invoiceDate || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Timesheet, invoice number, date, and a positive amount are required" },
      { status: 400 }
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "An invoice document (PDF or image) is required." }, { status: 400 });
  }

  const docError = validateVendorInvoiceDocument(file);
  if (docError) return NextResponse.json({ error: docError }, { status: 400 });

  const result = await submitAgencyPortalInvoice({
    vendorBpId: session.vendorBpId,
    agencyTimesheetId,
    invoiceNo,
    invoiceDate,
    amount,
    notes,
    file,
    actor: `Agency portal (${session.email})`,
  });

  if (!result.ok) return NextResponse.json({ error: result.error ?? "Could not submit invoice" }, { status: 400 });
  return NextResponse.json({ invoice: result.invoice });
}
