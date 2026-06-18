import type { AuthSession } from "@/lib/access/types";
import { sessionHasWindow } from "@/lib/auth/session.server";
import type {
  EmployeeAvailabilityRow,
  EmployeeDocumentAcknowledgement,
  EmployeeLeaveRequestRow,
  EmployeeRecord,
} from "@/lib/employee";
import { initialEmployees, normalizeEmployee } from "@/lib/employee";
import { newLineId } from "@/lib/client-line-tables";
import { SEED_USERS } from "@/lib/access/seed";
import { fetchUsers } from "@/lib/supabase/access-api";
import { saveEmployee } from "@/lib/supabase/data-api";
import {
  employeeAvailabilityFromRow,
  employeeDocumentAckFromRow,
  employeeFromRow,
  type EmployeeAvailabilityRowDb,
  type EmployeeDocumentAcknowledgementRowDb,
  type EmployeeDocumentRowDb,
  type EmployeeEmergencyContactRowDb,
  type EmployeeLeaveRequestRowDb,
  type EmployeeLocationRowDb,
  type EmployeeRow,
} from "@/lib/supabase/mappers";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  isStaffContractDocument,
  type MyLeaveSubmitPayload,
  type MyProfilePayload,
} from "@/lib/my-workplace/types";

export type { MyContractView, MyLeaveSubmitPayload, MyProfilePayload, MyWorkplaceSummary } from "@/lib/my-workplace/types";
export {
  buildMyContracts,
  buildMySummary,
  dayLabels,
  isStaffContractDocument,
} from "@/lib/my-workplace/types";

export type MyWorkplaceContext = {
  session: AuthSession;
  employeeId: string;
};

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

export async function requireMyWorkplace(
  session: AuthSession | null,
  windowKey: string
): Promise<MyWorkplaceContext | null> {
  if (!session) return null;
  if (!sessionHasWindow(session, windowKey)) return null;
  const employeeId = await resolveEmployeeId(session);
  if (!employeeId) return null;
  return { session, employeeId };
}

async function loadEmployeeRow(supabase: SupabaseClient, employeeId: string): Promise<EmployeeRecord | null> {
  const { data: row, error } = await supabase.from("employee").select("*").eq("id", employeeId).maybeSingle();
  if (error || !row) return null;
  const employeeRow = row as EmployeeRow;
  const [locationsRes, ecRes, docsRes, leaveRes] = await Promise.all([
    supabase.from("employee_location").select("*").eq("employee_id", employeeId).order("line_no"),
    supabase.from("employee_emergency_contact").select("*").eq("employee_id", employeeId).order("line_no"),
    supabase.from("employee_document").select("*").eq("employee_id", employeeId).order("line_no"),
    supabase.from("employee_leave_request").select("*").eq("employee_id", employeeId).order("line_no"),
  ]);
  return normalizeEmployee(
    employeeFromRow(employeeRow, {
      locations: (locationsRes.data ?? []) as EmployeeLocationRowDb[],
      emergencyContacts: (ecRes.data ?? []) as EmployeeEmergencyContactRowDb[],
      documents: (docsRes.data ?? []) as EmployeeDocumentRowDb[],
      leaveRequests: (leaveRes.data ?? []) as EmployeeLeaveRequestRowDb[],
    })
  );
}

function loadSeedEmployee(employeeId: string): EmployeeRecord | null {
  return initialEmployees.find((e) => e.id === employeeId) ?? null;
}

export async function loadMyEmployee(employeeId: string): Promise<EmployeeRecord | null> {
  if (isSupabaseConfigured()) {
    try {
      return await loadEmployeeRow(serviceClient(), employeeId);
    } catch {
      return loadSeedEmployee(employeeId);
    }
  }
  return loadSeedEmployee(employeeId);
}

export async function loadMyAvailability(employeeId: string): Promise<EmployeeAvailabilityRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await serviceClient()
    .from("employee_availability")
    .select("*")
    .eq("employee_id", employeeId)
    .order("line_no");
  if (error) return [];
  return ((data ?? []) as EmployeeAvailabilityRowDb[]).map(employeeAvailabilityFromRow);
}

export async function loadMyAcknowledgements(employeeId: string): Promise<EmployeeDocumentAcknowledgement[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await serviceClient()
    .from("employee_document_acknowledgement")
    .select("*")
    .eq("employee_id", employeeId);
  if (error) return [];
  return ((data ?? []) as EmployeeDocumentAcknowledgementRowDb[]).map(employeeDocumentAckFromRow);
}

function countWeekdaysInclusive(startIso: string, endIso: string): number {
  if (!startIso || !endIso) return 0;
  const cursor = new Date(`${startIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);
  if (cursor > end) return 0;
  let days = 0;
  while (cursor <= end) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) days += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export async function submitMyLeave(
  ctx: MyWorkplaceContext,
  payload: MyLeaveSubmitPayload
): Promise<{ request: EmployeeLeaveRequestRow; employee: EmployeeRecord }> {
  const employee = await loadMyEmployee(ctx.employeeId);
  if (!employee) throw new Error("Employee record not found");

  const now = new Date().toISOString();
  const lineNo = employee.leaveRequests.length + 1;
  const request: EmployeeLeaveRequestRow = {
    id: newLineId("leave-req"),
    lineNo,
    leaveType: payload.leaveType.trim(),
    startDate: payload.startDate,
    endDate: payload.endDate,
    daysRequested: countWeekdaysInclusive(payload.startDate, payload.endDate),
    status: "Requested",
    notes: payload.notes.trim(),
    submittedAt: now,
    reviewedBy: "",
    declineReason: "",
  };

  const next = normalizeEmployee({
    ...employee,
    leaveRequests: [...employee.leaveRequests, request],
    activities: [
      {
        id: newLineId("emp-act"),
        lineNo: employee.activities.length + 1,
        date: now.slice(0, 10),
        activityType: "Leave",
        subject: "Leave request submitted",
        description: `${request.leaveType}: ${request.startDate} to ${request.endDate}`,
        createdBy: ctx.session.displayName,
      },
      ...employee.activities,
    ],
    updatedBy: ctx.session.displayName,
  });

  if (isSupabaseConfigured()) {
    await saveEmployee(serviceClient(), next);
  }

  return { request, employee: next };
}

export async function saveMyProfile(ctx: MyWorkplaceContext, payload: MyProfilePayload): Promise<EmployeeRecord> {
  const employee = await loadMyEmployee(ctx.employeeId);
  if (!employee) throw new Error("Employee record not found");

  const next = normalizeEmployee({
    ...employee,
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    preferredName: payload.preferredName.trim(),
    email: payload.email.trim(),
    phone: payload.phone.trim(),
    mobile: payload.mobile.trim(),
    name: `${payload.firstName} ${payload.lastName}`.trim() || employee.name,
    emergencyContacts: payload.emergencyContacts,
    locations: payload.locations,
    updatedBy: ctx.session.displayName,
  });

  if (isSupabaseConfigured()) {
    await saveEmployee(serviceClient(), next);
  }

  return next;
}

export async function saveMyAvailability(
  ctx: MyWorkplaceContext,
  rows: EmployeeAvailabilityRow[]
): Promise<EmployeeAvailabilityRow[]> {
  const supabase = isSupabaseConfigured() ? serviceClient() : null;
  const normalized = rows.map((row, index) => ({
    ...row,
    lineNo: index + 1,
  }));

  if (supabase) {
    await supabase.from("employee_availability").delete().eq("employee_id", ctx.employeeId);
    if (normalized.length) {
      const { error } = await supabase.from("employee_availability").insert(
        normalized.map((row) => ({
          id: row.id,
          employee_id: ctx.employeeId,
          line_no: row.lineNo,
          day_of_week: row.dayOfWeek,
          start_time: row.startTime,
          end_time: row.endTime,
          availability: row.availability,
          notes: row.notes,
        }))
      );
      if (error) throw error;
    }
  }

  return normalized;
}

export async function acknowledgeMyContract(
  ctx: MyWorkplaceContext,
  documentId: string
): Promise<EmployeeDocumentAcknowledgement> {
  const employee = await loadMyEmployee(ctx.employeeId);
  if (!employee) throw new Error("Employee record not found");
  const doc = employee.documents.find((d) => d.id === documentId);
  if (!doc || !isStaffContractDocument(doc)) throw new Error("Document not found");

  const ack: EmployeeDocumentAcknowledgement = {
    id: newLineId("doc-ack"),
    documentId,
    acknowledgedAt: new Date().toISOString(),
    acknowledgedByUserId: ctx.session.userId,
  };

  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { error } = await supabase.from("employee_document_acknowledgement").upsert({
      id: ack.id,
      employee_id: ctx.employeeId,
      document_id: documentId,
      acknowledged_at: ack.acknowledgedAt,
      acknowledged_by_user_id: ack.acknowledgedByUserId,
    });
    if (error) throw error;
  }

  return ack;
}

export function defaultAvailabilityRows(): EmployeeAvailabilityRow[] {
  return [1, 2, 3, 4, 5].map((dayOfWeek, index) => ({
    id: newLineId("avail"),
    lineNo: index + 1,
    dayOfWeek,
    startTime: "09:00",
    endTime: "17:00",
    availability: "Available",
    notes: "",
  }));
}
