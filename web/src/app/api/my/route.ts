import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import {
  buildMyContracts,
  buildMyWorkplaceDashboard,
  loadMyAcknowledgements,
  loadMyAvailability,
  loadMyEmployee,
  loadMyServicesAdvisory,
  requireMyWorkplace,
} from "@/lib/my-workplace/server";

export async function GET() {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-workplace");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const employee = await loadMyEmployee(ctx.employeeId);
  if (!employee) return NextResponse.json({ error: "No linked employee record" }, { status: 404 });

  const [availability, acknowledgements, servicesAdvisory] = await Promise.all([
    loadMyAvailability(ctx.employeeId),
    loadMyAcknowledgements(ctx.employeeId),
    loadMyServicesAdvisory(ctx),
  ]);
  const contracts = buildMyContracts(employee.documents, acknowledgements);
  const dashboard = buildMyWorkplaceDashboard({ employee, availability, contracts });

  return NextResponse.json({
    employeeId: ctx.employeeId,
    employeeName: employee.name,
    summary: dashboard.summary,
    actionItems: dashboard.actionItems,
    profileGaps: dashboard.profileGaps,
    contracts,
    availability,
    leaveRequests: employee.leaveRequests,
    entitlements: employee.leaveEntitlements,
    credentials: employee.credentials,
    servicesAdvisory,
  });
}
