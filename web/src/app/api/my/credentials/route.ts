import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import {
  loadMyEmployee,
  requireMyWorkplace,
  submitMyCredential,
  type MyCredentialSubmitPayload,
} from "@/lib/my-workplace/server";
import { syncCredentialStatuses } from "@/lib/employee-compliance";

export async function GET() {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-credentials");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const employee = await loadMyEmployee(ctx.employeeId);
  if (!employee) return NextResponse.json({ error: "No linked employee record" }, { status: 404 });

  return NextResponse.json({
    credentials: syncCredentialStatuses(employee.credentials ?? []),
  });
}

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-credentials");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: MyCredentialSubmitPayload;
  try {
    body = (await request.json()) as MyCredentialSubmitPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await submitMyCredential(ctx, body);
    return NextResponse.json({
      credential: result.credential,
      employee: result.employee,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not submit credential";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
