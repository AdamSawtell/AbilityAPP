import { NextResponse } from "next/server";
import { getAgencyPortalSessionFromRequest } from "@/lib/agency-portal/session.server";
import {
  loadAgencyPortalInvoices,
  resolveValidAgencyPortalSession,
  submitAgencyPortalInvoice,
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

  let body: { agencyTimesheetId?: string; invoiceNo?: string; invoiceDate?: string; amount?: number; notes?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const agencyTimesheetId = body.agencyTimesheetId?.trim() ?? "";
  const invoiceNo = body.invoiceNo?.trim() ?? "";
  const invoiceDate = body.invoiceDate?.trim() ?? "";
  const amount = Number(body.amount);
  if (!agencyTimesheetId || !invoiceNo || !invoiceDate || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Timesheet, invoice number, date, and a positive amount are required" }, { status: 400 });
  }

  const result = await submitAgencyPortalInvoice({
    vendorBpId: session.vendorBpId,
    agencyTimesheetId,
    invoiceNo,
    invoiceDate,
    amount,
    notes: body.notes,
    actor: `Agency portal (${session.email})`,
  });

  if (!result.ok) return NextResponse.json({ error: result.error ?? "Could not submit invoice" }, { status: 400 });
  return NextResponse.json({ invoice: result.invoice });
}
