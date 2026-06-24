import { NextResponse } from "next/server";
import { getAuthSessionFromRequest, sessionHasWindow } from "@/lib/auth/session.server";
import { loadStaffVendorInvoiceDocument } from "@/lib/agency-portal/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sessionHasWindow(session, "vendor-invoices")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const doc = await loadStaffVendorInvoiceDocument(id);
  if (!doc) return NextResponse.json({ error: "Invoice document not found" }, { status: 404 });

  return NextResponse.json(doc);
}
