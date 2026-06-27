import type { AuthSession } from "@/lib/access/types";
import { SEED_USERS } from "@/lib/access/seed";
import { newLineId } from "@/lib/client-line-tables";
import type { EmployeeCredentialRow, EmployeeLeaveRequestRow, EmployeeRecord } from "@/lib/employee";
import { initialEmployees } from "@/lib/employee";
import { loadMyEmployee } from "@/lib/my-workplace/server";
import { persistCredentialReview, persistLeaveEntitlementBalance, persistLeaveReview } from "@/lib/my-workplace/persist";
import { releaseRosterShiftsForApprovedLeave } from "@/lib/roster-leave-server";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import { closeWorkforceAutomationTasks } from "@/lib/task-automation/run-server";
import { fetchUsers } from "@/lib/supabase/access-api";
import {
  employeeCredentialFromRow,
  employeeLeaveRequestFromRow,
  type EmployeeCredentialRowDb,
  type EmployeeLeaveRequestRowDb,
} from "@/lib/supabase/mappers";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  buildWorkforceReviewSummary,
  type CredentialReviewItem,
  type LeaveReviewItem,
  type WorkforceReviewQueue,
} from "@/lib/workforce/review-queue";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

async function resolveEmployeeId(session: AuthSession): Promise<string | null> {
  if (session.employeeBpId?.trim()) return session.employeeBpId.trim();
  if (isSupabaseConfigured()) {
    const users = await fetchUsers(serviceClient());
    const user = users.find((u) => u.id === session.userId);
    return user?.employeeBpId?.trim() ? user.employeeBpId : null;
  }
  const user = SEED_USERS.find((u) => u.id === session.userId);
  return user?.employeeBpId?.trim() ? user.employeeBpId : null;
}

export function canReviewCredentials(session: AuthSession): boolean {
  return (
    session.processIds.includes("review-employee-credential") ||
    session.windowKeys.includes("employee-credentials-assigned")
  );
}

export function canApproveLeave(session: AuthSession): boolean {
  return session.processIds.includes("approve-leave-request");
}

function seesAllPendingLeave(session: AuthSession): boolean {
  return canReviewCredentials(session);
}

function buildQueueFromEmployees(
  employees: EmployeeRecord[],
  session: AuthSession,
  reviewerEmployeeId: string | null
): WorkforceReviewQueue {
  const credentials: CredentialReviewItem[] = [];
  const leaveRequests: LeaveReviewItem[] = [];
  const seeAllLeave = seesAllPendingLeave(session);

  for (const employee of employees) {
    if (canReviewCredentials(session)) {
      for (const credential of employee.credentials) {
        if (credential.status !== "Pending review") continue;
        credentials.push({ employeeId: employee.id, employeeName: employee.name, credential });
      }
    }

    if (canApproveLeave(session)) {
      for (const request of employee.leaveRequests) {
        if (request.status !== "Requested") continue;
        if (!seeAllLeave && employee.reportsToId !== reviewerEmployeeId) continue;
        leaveRequests.push({ employeeId: employee.id, employeeName: employee.name, request });
      }
    }
  }

  credentials.sort((a, b) => (a.credential.submittedAt ?? "").localeCompare(b.credential.submittedAt ?? ""));
  leaveRequests.sort((a, b) => (a.request.submittedAt ?? "").localeCompare(b.request.submittedAt ?? ""));

  return {
    summary: buildWorkforceReviewSummary({ credentials, leaveRequests }),
    credentials,
    leaveRequests,
  };
}

async function loadEmployeesForReview(): Promise<EmployeeRecord[]> {
  if (!isSupabaseConfigured()) return initialEmployees;

  const supabase = serviceClient();
  const [empRes, credRes, leaveRes] = await Promise.all([
    supabase.from("employee").select("id, name, reports_to_id"),
    supabase.from("employee_credential").select("*").order("line_no"),
    supabase.from("employee_leave_request").select("*").order("line_no"),
  ]);
  if (empRes.error) throw empRes.error;
  if (credRes.error) throw credRes.error;
  if (leaveRes.error) throw leaveRes.error;

  const credsByEmp = new Map<string, EmployeeCredentialRow[]>();
  for (const row of (credRes.data ?? []) as EmployeeCredentialRowDb[]) {
    const list = credsByEmp.get(row.employee_id) ?? [];
    list.push(employeeCredentialFromRow(row));
    credsByEmp.set(row.employee_id, list);
  }

  const leaveByEmp = new Map<string, EmployeeLeaveRequestRow[]>();
  for (const row of (leaveRes.data ?? []) as EmployeeLeaveRequestRowDb[]) {
    const list = leaveByEmp.get(row.employee_id) ?? [];
    list.push(employeeLeaveRequestFromRow(row));
    leaveByEmp.set(row.employee_id, list);
  }

  return (empRes.data ?? []).map((row) => {
    const seed = initialEmployees.find((e) => e.id === row.id);
    return {
      ...(seed ?? {
        id: row.id,
        name: row.name ?? row.id,
        reportsToId: row.reports_to_id ?? "",
        credentials: [],
        leaveRequests: [],
      }),
      id: row.id,
      name: row.name ?? seed?.name ?? row.id,
      reportsToId: row.reports_to_id ?? seed?.reportsToId ?? "",
      credentials: credsByEmp.get(row.id) ?? seed?.credentials ?? [],
      leaveRequests: leaveByEmp.get(row.id) ?? seed?.leaveRequests ?? [],
    } as EmployeeRecord;
  });
}

export async function loadWorkforceReviewQueue(session: AuthSession): Promise<WorkforceReviewQueue> {
  if (!canReviewCredentials(session) && !canApproveLeave(session)) {
    return { summary: buildWorkforceReviewSummary({ credentials: [], leaveRequests: [] }), credentials: [], leaveRequests: [] };
  }

  const reviewerEmployeeId = await resolveEmployeeId(session);
  const employees = await loadEmployeesForReview();
  return buildQueueFromEmployees(employees, session, reviewerEmployeeId);
}

export type CredentialReviewDecision = {
  type: "credential";
  employeeId: string;
  credentialId: string;
  decision: "approve" | "reject";
  reviewNotes?: string;
};

export type LeaveReviewDecision = {
  type: "leave";
  employeeId: string;
  requestId: string;
  decision: "approve" | "decline";
  declineReason?: string;
};

export type WorkforceReviewAction = CredentialReviewDecision | LeaveReviewDecision;

export type WorkforceReviewResult = {
  employee: EmployeeRecord;
  leaveRosterRelease?: {
    releasedCount: number;
    skippedAttendance: number;
    updatedShifts: RosterShiftRecord[];
  };
};

export async function applyWorkforceReview(
  session: AuthSession,
  action: WorkforceReviewAction
): Promise<WorkforceReviewResult> {
  const employee = await loadMyEmployee(action.employeeId);
  if (!employee) throw new Error("Employee record not found");

  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  if (action.type === "credential") {
    if (!canReviewCredentials(session)) throw new Error("Credential review not permitted");
    const credential = employee.credentials.find((c) => c.id === action.credentialId);
    if (!credential) throw new Error("Credential not found");
    if (credential.status !== "Pending review") throw new Error("Credential is not pending review");

    const status = action.decision === "approve" ? "Current" : "Rejected";
    const reviewNotes = action.reviewNotes?.trim() ?? "";
    const activity = {
      id: newLineId("emp-act"),
      lineNo: employee.activities.length + 1,
      date: today,
      activityType: "Compliance",
      subject: action.decision === "approve" ? "Credential approved" : "Credential rejected",
      description: `${credential.credentialType} — ${status}${reviewNotes ? `: ${reviewNotes}` : ""}`,
      createdBy: session.displayName,
    };

    if (isSupabaseConfigured()) {
      await persistCredentialReview(serviceClient(), action.employeeId, action.credentialId, {
        status,
        reviewNotes,
        reviewedBy: session.displayName,
        reviewedAt: now,
      }, activity);
      await closeWorkforceAutomationTasks(serviceClient(), {
        type: "credential",
        employeeId: action.employeeId,
        credentialId: action.credentialId,
        reviewerName: session.displayName,
        summary: `${credential.credentialType} — ${status}`,
      });
    }

    const reloaded = await loadMyEmployee(action.employeeId);
    if (!reloaded) throw new Error("Employee record not found");
    return { employee: reloaded };
  }

  if (!canApproveLeave(session)) throw new Error("Leave approval not permitted");

  const reviewerEmployeeId = await resolveEmployeeId(session);
  if (!seesAllPendingLeave(session) && employee.reportsToId !== reviewerEmployeeId) {
    throw new Error("You can only approve leave for your direct reports");
  }

  const request = employee.leaveRequests.find((r) => r.id === action.requestId);
  if (!request) throw new Error("Leave request not found");
  if (request.status !== "Requested") throw new Error("Leave request is not pending approval");

  const status = action.decision === "approve" ? "Approved" : "Declined";
  const declineReason = action.decision === "decline" ? action.declineReason?.trim() ?? "Declined" : "";
  const activity = {
    id: newLineId("emp-act"),
    lineNo: employee.activities.length + 1,
    date: today,
    activityType: "Leave",
    subject: action.decision === "approve" ? "Leave request approved" : "Leave request declined",
    description: `${request.leaveType}: ${request.startDate} to ${request.endDate} — ${status}`,
    createdBy: session.displayName,
  };

  if (isSupabaseConfigured()) {
    await persistLeaveReview(serviceClient(), action.employeeId, action.requestId, {
      status,
      reviewedBy: session.displayName,
      reviewedAt: now,
      declineReason,
    }, activity);

    let leaveRosterRelease: WorkforceReviewResult["leaveRosterRelease"];

    if (action.decision === "approve") {
      const entitlement = employee.leaveEntitlements.find(
        (row) => row.leaveType.trim().toLowerCase() === request.leaveType.trim().toLowerCase()
      );
      if (entitlement) {
        const newBalance = Math.max(0, entitlement.balanceDays - request.daysRequested);
        await persistLeaveEntitlementBalance(
          serviceClient(),
          action.employeeId,
          entitlement.id,
          newBalance
        );
      }

      const approvedRequest = { ...request, status: "Approved" as const };
      leaveRosterRelease = await releaseRosterShiftsForApprovedLeave(
        serviceClient(),
        employee,
        approvedRequest,
        session.displayName
      );
    }

    await closeWorkforceAutomationTasks(serviceClient(), {
      type: "leave",
      employeeId: action.employeeId,
      requestId: action.requestId,
      reviewerName: session.displayName,
      summary: `${request.leaveType}: ${request.startDate} to ${request.endDate} — ${status}`,
    });

    const reloaded = await loadMyEmployee(action.employeeId);
    if (!reloaded) throw new Error("Employee record not found");
    return { employee: reloaded, leaveRosterRelease };
  }

  const reloaded = await loadMyEmployee(action.employeeId);
  if (!reloaded) throw new Error("Employee record not found");
  return { employee: reloaded };
}
