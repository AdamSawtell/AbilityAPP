import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import {
  acknowledgeMyContract,
  buildMyContracts,
  loadMyAcknowledgements,
  loadMyEmployee,
  requireMyWorkplace,
} from "@/lib/my-workplace/server";

export async function GET() {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-contracts");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const employee = await loadMyEmployee(ctx.employeeId);
  if (!employee) return NextResponse.json({ error: "No linked employee record" }, { status: 404 });

  const acknowledgements = await loadMyAcknowledgements(ctx.employeeId);
  const contracts = buildMyContracts(employee.documents, acknowledgements);
  return NextResponse.json({ contracts });
}

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-contracts");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { documentId?: string };
  try {
    body = (await request.json()) as { documentId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.documentId?.trim()) {
    return NextResponse.json({ error: "documentId required" }, { status: 400 });
  }

  try {
    const acknowledgement = await acknowledgeMyContract(ctx, body.documentId.trim());
    const employee = await loadMyEmployee(ctx.employeeId);
    const acknowledgements = await loadMyAcknowledgements(ctx.employeeId);
    const contracts = buildMyContracts(employee?.documents ?? [], acknowledgements);
    return NextResponse.json({ acknowledgement, contracts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not acknowledge document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
