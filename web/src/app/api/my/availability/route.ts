import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import {
  assertAvailabilitySaveAllowed,
  AvailabilityHoursValidationError,
  evaluateAvailabilityHours,
  type AvailabilitySaveOptions,
} from "@/lib/availability-hours-policy";
import {
  createOverMaxApprovalRequest,
  getAvailabilityHoursPolicy,
  loadLatestApprovedOverMaxRequest,
  loadLatestOverMaxRequest,
} from "@/lib/availability-hours-policy.server";
import {
  defaultAvailabilityRows,
  loadMyAvailability,
  loadMyEmployee,
  requireMyWorkplace,
  saveMyAvailability,
} from "@/lib/my-workplace/server";
import type { EmployeeAvailabilityRow } from "@/lib/employee";

async function buildHoursContext(employeeId: string, rows: EmployeeAvailabilityRow[]) {
  const employee = await loadMyEmployee(employeeId);
  if (!employee) throw new Error("Employee record not found");
  const policy = await getAvailabilityHoursPolicy();
  const [latest, latestApproved] = await Promise.all([
    loadLatestOverMaxRequest(employeeId),
    loadLatestApprovedOverMaxRequest(employeeId),
  ]);
  const approvalStatus = latest?.status ?? "none";
  const approvedWeeklyHours = latestApproved?.weeklyHours ?? 0;
  const summary = evaluateAvailabilityHours({
    employee,
    rows,
    policy,
    approvalStatus,
    approvedWeeklyHours,
  });
  return { employee, policy, latest, approvedWeeklyHours, summary };
}

export async function GET() {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-availability");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await loadMyAvailability(ctx.employeeId);
  const configured = rows.length > 0;
  const displayRows = configured ? rows : defaultAvailabilityRows();
  const { employee, policy, latest, summary } = await buildHoursContext(ctx.employeeId, displayRows);

  return NextResponse.json({
    rows: displayRows,
    configured,
    summary,
    employee,
    policy: {
      maxHoursPerPeriod: policy.maxHoursPerPeriod,
      maxHoursPeriod: policy.maxHoursPeriod,
      overnightHoursMode: policy.overnightHoursMode,
    },
    overMaxRequest: latest,
  });
}

export async function PUT(request: Request) {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-availability");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    rows?: EmployeeAvailabilityRow[];
    allowEmpty?: boolean;
    includeOvernightHours?: boolean;
    requestOverMaxApproval?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.rows)) {
    return NextResponse.json({ error: "rows array required" }, { status: 400 });
  }

  if (body.rows.length === 0 && body.allowEmpty !== true) {
    return NextResponse.json(
      { error: "No availability rows to save — reload the page and try again before saving." },
      { status: 400 }
    );
  }

  const saveOptions: AvailabilitySaveOptions = {
    includeOvernightHours: body.includeOvernightHours,
    requestOverMaxApproval: body.requestOverMaxApproval === true,
  };

  try {
    const { employee, policy, latest, approvedWeeklyHours } = await buildHoursContext(
      ctx.employeeId,
      body.rows
    );
    const summary = assertAvailabilitySaveAllowed({
      employee,
      rows: body.rows,
      policy,
      options: saveOptions,
      approvalStatus: latest?.status ?? "none",
      approvedWeeklyHours,
    });

    // Create the approval request before persisting so an over-maximum pattern is
    // never stored without a pending row for managers to review.
    let overMaxRequest = latest;
    if (summary.approvalRequired && saveOptions.requestOverMaxApproval) {
      overMaxRequest = await createOverMaxApprovalRequest({
        employeeId: ctx.employeeId,
        weeklyHours: summary.weeklyHours,
        maxWeeklyHours: summary.maxWeeklyHours,
        requestedByUserId: ctx.session.userId,
      });
    }

    const { employee: savedEmployee, rows } = await saveMyAvailability(ctx, body.rows, {
      allowEmpty: body.allowEmpty === true,
    });

    return NextResponse.json({
      employee: savedEmployee,
      rows,
      summary: evaluateAvailabilityHours({
        employee: savedEmployee,
        rows,
        policy,
        options: saveOptions,
        approvalStatus: overMaxRequest?.status ?? "none",
        approvedWeeklyHours,
      }),
      overMaxRequest,
    });
  } catch (err) {
    if (err instanceof AvailabilityHoursValidationError) {
      return NextResponse.json(
        { error: err.message, code: err.code, summary: err.summary },
        { status: err.code === "OVER_MAX_REQUIRES_APPROVAL" ? 409 : 400 }
      );
    }
    const message = err instanceof Error ? err.message : "Could not save availability";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
