import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { describeLeaveSelfServicePolicy, getLeaveSelfServiceMinimumHours } from "@/lib/leave-self-service-policy";
import { loadMyEmployee, requireMyWorkplace, submitMyLeave } from "@/lib/my-workplace/server";
import { recordProcessExecution } from "@/lib/process-audit/server";
import { ORGANIZATION_ID } from "@/lib/organization";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { serviceClient } from "@/lib/session-audit/server";

export async function GET() {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-leave");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const employee = await loadMyEmployee(ctx.employeeId);
  if (!employee) return NextResponse.json({ error: "No linked employee record" }, { status: 404 });

  const minimumHours = await getLeaveSelfServiceMinimumHours();
  let contactPhone = "";
  if (isSupabaseConfigured()) {
    const { data } = await serviceClient()
      .from("app_organization")
      .select("phone, primary_contact_phone")
      .eq("id", ORGANIZATION_ID)
      .maybeSingle();
    const row = data as { phone?: string; primary_contact_phone?: string } | null;
    contactPhone = String(row?.primary_contact_phone ?? row?.phone ?? "").trim();
  }

  return NextResponse.json({
    leaveRequests: employee.leaveRequests,
    entitlements: employee.leaveEntitlements,
    selfServiceMinimumHours: minimumHours,
    selfServicePolicyHint: describeLeaveSelfServicePolicy(minimumHours, contactPhone),
    contactPhone,
  });
}

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-leave");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { leaveType?: string; startDate?: string; endDate?: string; notes?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.leaveType?.trim() || !body.startDate?.trim() || !body.endDate?.trim()) {
    return NextResponse.json({ error: "Leave type, start date, and end date are required" }, { status: 400 });
  }

  try {
    const { request: requestRow, employee: updated } = await submitMyLeave(ctx, {
      leaveType: body.leaveType,
      startDate: body.startDate,
      endDate: body.endDate,
      notes: body.notes ?? "",
    });
    if (session) {
      await recordProcessExecution({
        session,
        processId: "submit-leave-request",
        outcome: "success",
        request,
        entityType: "employee",
        entityId: ctx.employeeId,
        entityLabel: updated.name,
        detail: `Leave request ${requestRow.id}`,
      });
    }
    return NextResponse.json({ request: requestRow, employee: updated });
  } catch (err) {
    if (session) {
      await recordProcessExecution({
        session,
        processId: "submit-leave-request",
        outcome: "failed",
        request,
        entityType: "employee",
        entityId: ctx.employeeId,
        failureReason: err instanceof Error ? err.message : "Could not submit leave",
      });
    }
    const message = err instanceof Error ? err.message : "Could not submit leave";
    const status = message.includes("must be requested by phone") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
