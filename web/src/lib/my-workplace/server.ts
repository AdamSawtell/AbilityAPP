import type { AuthSession } from "@/lib/access/types";
import { sessionHasWindow } from "@/lib/auth/session.server";
import type {
  EmployeeAvailabilityRow,
  EmployeeCredentialRow,
  EmployeeDocumentAcknowledgement,
  EmployeeLeaveRequestRow,
  EmployeeRecord,
} from "@/lib/employee";
import { initialEmployees, normalizeEmployee } from "@/lib/employee";
import { newLineId } from "@/lib/client-line-tables";
import { SEED_USERS } from "@/lib/access/seed";
import { fetchUsers } from "@/lib/supabase/access-api";
import {
  employeeAvailabilityFromRow,
  employeeDocumentAckFromRow,
  employeeFromRow,
  type EmployeeActivityRowDb,
  type EmployeeAlertRowDb,
  type EmployeeAvailabilityRowDb,
  type EmployeeCredentialRowDb,
  type EmployeeDocumentAcknowledgementRowDb,
  type EmployeeDocumentRowDb,
  type EmployeeEmergencyContactRowDb,
  type EmployeeLeaveEntitlementRowDb,
  type EmployeeLeaveRequestRowDb,
  type EmployeeLocationRowDb,
  type EmployeeSkillRowDb,
  type EmployeeRow,
} from "@/lib/supabase/mappers";
import { persistMyCredential, persistMyLeaveRequest, persistMyProfile } from "@/lib/my-workplace/persist";
import { buildCheckInUpdate, buildCheckOutUpdate } from "@/lib/roster-shift-checkin";
import { normalizeGeoInput, geoToDbNumber, type GeoCoordinates } from "@/lib/geolocation";
import { assertLeaveSelfServiceAllowed } from "@/lib/leave-self-service-policy";
import { normalizeRosterShift, type RosterShiftRecord } from "@/lib/roster-shift";
import {
  rosterShiftFromRow,
  siteOrientationFromRow,
  type RosterShiftRow,
  type SiteOrientationRow,
} from "@/lib/supabase/mappers";
import {
  locationFromRow,
  type SupportLocationRow,
  type SupportLocationEmployeeRowDb,
} from "@/lib/supabase/location-mappers";
import { normalizeLocation } from "@/lib/location";
import {
  rosterShiftClientLineFromRow,
  rosterShiftWorkerLineFromRow,
  rosterShiftWorkerLineToRow,
  type RosterShiftClientLineRow,
  type RosterShiftWorkerLineRow,
} from "@/lib/supabase/roster-session-mappers";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  myWorkplaceCredentialPendingEvent,
  myWorkplaceLeaveRequestedEvent,
} from "@/lib/task-automation/employee-triggers";
import { closeWorkforceAutomationTasks, runServerAutomationEvents } from "@/lib/task-automation/run-server";
import {
  buildMyWorkplaceServicesAdvisory,
  HIGH_DEMAND_LOOKAHEAD_DAYS,
  type MyWorkplaceServicesAdvisory,
} from "@/lib/my-workplace/services-advisory";
import { addDaysIso } from "@/lib/roster-shift";

import type {
  MyContractView,
  MyCredentialSubmitPayload,
  MyLeaveSubmitPayload,
  MyProfilePayload,
  MyWorkplaceSummary,
} from "@/lib/my-workplace/types";
import {
  buildMyContracts,
  buildMySummary,
  dayLabels,
  DEFAULT_AVAILABILITY_WEEKDAYS,
  isStaffContractDocument,
} from "@/lib/my-workplace/types";

export type { MyContractView, MyCredentialSubmitPayload, MyLeaveSubmitPayload, MyProfilePayload, MyWorkplaceSummary };
export type { MyActionItem, MyProfileGap } from "@/lib/my-workplace/compliance-dashboard";
export { buildMyWorkplaceDashboard } from "@/lib/my-workplace/compliance-dashboard";
export { buildMyContracts, buildMySummary, dayLabels, isStaffContractDocument };

async function loadRosterShiftWithSessionLines(
  supabase: SupabaseClient | null,
  row: RosterShiftRow
): Promise<RosterShiftRecord> {
  if (!supabase) return normalizeRosterShift(rosterShiftFromRow(row));

  const [clientLinesRes, workerLinesRes] = await Promise.all([
    supabase.from("roster_shift_client_line").select("*").eq("roster_shift_id", row.id).order("line_no"),
    supabase.from("roster_shift_worker_line").select("*").eq("roster_shift_id", row.id).order("line_no"),
  ]);
  if (clientLinesRes.error) throw clientLinesRes.error;
  if (workerLinesRes.error) throw workerLinesRes.error;

  return normalizeRosterShift({
    ...rosterShiftFromRow(row),
    clientLines: ((clientLinesRes.data ?? []) as RosterShiftClientLineRow[]).map(rosterShiftClientLineFromRow),
    workerLines: ((workerLinesRes.data ?? []) as RosterShiftWorkerLineRow[]).map(rosterShiftWorkerLineFromRow),
  });
}

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
  const [
    locationsRes,
    ecRes,
    docsRes,
    leaveRes,
    credRes,
    alertsRes,
    skillsRes,
    actsRes,
    entRes,
  ] = await Promise.all([
    supabase.from("employee_location").select("*").eq("employee_id", employeeId).order("line_no"),
    supabase.from("employee_emergency_contact").select("*").eq("employee_id", employeeId).order("line_no"),
    supabase.from("employee_document").select("*").eq("employee_id", employeeId).order("line_no"),
    supabase.from("employee_leave_request").select("*").eq("employee_id", employeeId).order("line_no"),
    supabase.from("employee_credential").select("*").eq("employee_id", employeeId).order("line_no"),
    supabase.from("employee_alert").select("*").eq("employee_id", employeeId).order("line_no"),
    supabase.from("employee_skill").select("*").eq("employee_id", employeeId).order("line_no"),
    supabase.from("employee_activity").select("*").eq("employee_id", employeeId).order("line_no"),
    supabase.from("employee_leave_entitlement").select("*").eq("employee_id", employeeId).order("line_no"),
  ]);
  return normalizeEmployee(
    employeeFromRow(employeeRow, {
      locations: (locationsRes.data ?? []) as EmployeeLocationRowDb[],
      emergencyContacts: (ecRes.data ?? []) as EmployeeEmergencyContactRowDb[],
      documents: (docsRes.data ?? []) as EmployeeDocumentRowDb[],
      leaveRequests: (leaveRes.data ?? []) as EmployeeLeaveRequestRowDb[],
      credentials: (credRes.data ?? []) as EmployeeCredentialRowDb[],
      alerts: (alertsRes.data ?? []) as EmployeeAlertRowDb[],
      skills: (skillsRes.data ?? []) as EmployeeSkillRowDb[],
      activities: (actsRes.data ?? []) as EmployeeActivityRowDb[],
      leaveEntitlements: (entRes.data ?? []) as EmployeeLeaveEntitlementRowDb[],
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

function assertLeaveBalance(employee: EmployeeRecord, leaveType: string, daysRequested: number): void {
  if (daysRequested <= 0) {
    throw new Error("Select valid dates with at least one weekday in the range");
  }
  const entitlement = employee.leaveEntitlements.find(
    (row) => row.leaveType.trim().toLowerCase() === leaveType.trim().toLowerCase()
  );
  if (entitlement && daysRequested > entitlement.balanceDays) {
    throw new Error(
      `Insufficient ${entitlement.leaveType} balance: ${entitlement.balanceDays} day(s) available, ${daysRequested} requested`
    );
  }
}

export async function submitMyLeave(
  ctx: MyWorkplaceContext,
  payload: MyLeaveSubmitPayload
): Promise<{ request: EmployeeLeaveRequestRow; employee: EmployeeRecord }> {
  const employee = await loadMyEmployee(ctx.employeeId);
  if (!employee) throw new Error("Employee record not found");

  const leaveType = payload.leaveType.trim();
  const daysRequested = countWeekdaysInclusive(payload.startDate, payload.endDate);
  assertLeaveBalance(employee, leaveType, daysRequested);
  await assertLeaveSelfServiceAllowed(ctx.employeeId, payload.startDate, payload.endDate);

  const now = new Date().toISOString();
  const lineNo = employee.leaveRequests.length + 1;
  const request: EmployeeLeaveRequestRow = {
    id: newLineId("leave-req"),
    lineNo,
    leaveType,
    startDate: payload.startDate,
    endDate: payload.endDate,
    daysRequested,
    status: "Requested",
    notes: payload.notes.trim(),
    submittedAt: now,
    reviewedBy: "",
    declineReason: "",
  };

  const activity = {
    id: newLineId("emp-act"),
    lineNo: employee.activities.length + 1,
    date: now.slice(0, 10),
    activityType: "Leave",
    subject: "Leave request submitted",
    description: `${request.leaveType}: ${request.startDate} to ${request.endDate}`,
    createdBy: ctx.session.displayName,
  };

  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    await persistMyLeaveRequest(supabase, ctx.employeeId, request, activity);
    await runServerAutomationEvents(supabase, [
      myWorkplaceLeaveRequestedEvent(
        normalizeEmployee({ ...employee, leaveRequests: [...employee.leaveRequests, request] }),
        request
      ),
    ]);
  }

  const next = normalizeEmployee({
    ...employee,
    leaveRequests: [...employee.leaveRequests, request],
    activities: [activity, ...employee.activities],
    updatedBy: ctx.session.displayName,
  });

  return { request, employee: next };
}

export async function saveMyProfile(ctx: MyWorkplaceContext, payload: MyProfilePayload): Promise<EmployeeRecord> {
  const employee = await loadMyEmployee(ctx.employeeId);
  if (!employee) throw new Error("Employee record not found");

  if (isSupabaseConfigured()) {
    await persistMyProfile(serviceClient(), ctx.employeeId, ctx.session, payload);
    const reloaded = await loadMyEmployee(ctx.employeeId);
    if (!reloaded) throw new Error("Employee record not found");
    return reloaded;
  }

  return normalizeEmployee({
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
}

export async function saveMyAvailability(
  ctx: MyWorkplaceContext,
  rows: EmployeeAvailabilityRow[],
  options: { allowEmpty?: boolean } = {}
): Promise<{ employee: EmployeeRecord; rows: EmployeeAvailabilityRow[] }> {
  // Guard against silently clearing availability when the editor saved before its
  // rows finished loading (KAREN-BUG-0002). Clearing is only allowed when the
  // caller explicitly opts in.
  if (rows.length === 0 && !options.allowEmpty) {
    throw new Error("No availability rows to save — reload the page and try again before saving.");
  }
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
    const reloaded = await loadMyEmployee(ctx.employeeId);
    if (!reloaded) throw new Error("Employee record not found");
    return { employee: reloaded, rows: normalized };
  }

  const employee = await loadMyEmployee(ctx.employeeId);
  if (!employee) throw new Error("Employee record not found");
  return {
    employee: normalizeEmployee({
      ...employee,
      updatedBy: ctx.session.displayName,
    }),
    rows: normalized,
  };
}

export async function acknowledgeMyContract(
  ctx: MyWorkplaceContext,
  documentId: string
): Promise<{ acknowledgement: EmployeeDocumentAcknowledgement; employee: EmployeeRecord }> {
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

  const reloaded = await loadMyEmployee(ctx.employeeId);
  if (!reloaded) throw new Error("Employee record not found");
  return { acknowledgement: ack, employee: reloaded };
}

export async function submitMyCredential(
  ctx: MyWorkplaceContext,
  payload: MyCredentialSubmitPayload
): Promise<{ credential: EmployeeCredentialRow; employee: EmployeeRecord }> {
  const employee = await loadMyEmployee(ctx.employeeId);
  if (!employee) throw new Error("Employee record not found");

  const credentialType = payload.credentialType.trim();
  if (!credentialType) throw new Error("Credential type is required");
  if (!payload.evidenceRef.trim()) throw new Error("Evidence reference is required — add a link or document reference");

  const now = new Date().toISOString();
  const credential: EmployeeCredentialRow = {
    id: newLineId("cred"),
    lineNo: employee.credentials.length + 1,
    credentialType,
    credentialNumber: payload.credentialNumber.trim(),
    issuingBody: payload.issuingBody.trim(),
    issueDate: payload.issueDate,
    expiryDate: payload.expiryDate,
    status: "Pending review",
    documentRef: "",
    evidenceRef: payload.evidenceRef.trim(),
    notes: payload.notes.trim(),
    staffSubmitted: true,
    submittedAt: now,
    submittedByUserId: ctx.session.userId,
    reviewedBy: "",
    reviewNotes: "",
    createdBy: ctx.session.displayName,
    updatedBy: ctx.session.displayName,
  };

  const activity = {
    id: newLineId("emp-act"),
    lineNo: employee.activities.length + 1,
    date: now.slice(0, 10),
    activityType: "Compliance",
    subject: "Credential submitted for review",
    description: `${credential.credentialType}${credential.credentialNumber ? ` (${credential.credentialNumber})` : ""}`,
    createdBy: ctx.session.displayName,
  };

  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    await persistMyCredential(supabase, ctx.employeeId, credential, activity);
    await runServerAutomationEvents(supabase, [
      myWorkplaceCredentialPendingEvent(
        normalizeEmployee({ ...employee, credentials: [...employee.credentials, credential] }),
        credential
      ),
    ]);
  }

  const next = normalizeEmployee({
    ...employee,
    credentials: [...employee.credentials, credential],
    activities: [activity, ...employee.activities],
    updatedBy: ctx.session.displayName,
  });

  return { credential, employee: next };
}

export async function performMyShiftCheckIn(
  ctx: MyWorkplaceContext,
  shiftId: string,
  geo: GeoCoordinates | null = null,
  at?: Date
): Promise<RosterShiftRecord> {
  const supabase = isSupabaseConfigured() ? serviceClient() : null;
  const { data: row, error } = supabase
    ? await supabase.from("roster_shift").select("*").eq("id", shiftId).maybeSingle()
    : { data: null, error: null };

  if (supabase && (error || !row)) throw new Error("Shift not found.");
  const shift = row
    ? await loadRosterShiftWithSessionLines(supabase, row as RosterShiftRow)
    : null;
  if (!shift) throw new Error("Shift not found.");

  const built = buildCheckInUpdate(shift, ctx.employeeId, ctx.session.displayName, at ?? new Date(), geo);
  if (!built.ok) throw new Error(built.message);

  if (supabase) {
    const workerLine = (built.shift.workerLines ?? []).find((line) => line.employeeId.trim() === ctx.employeeId);
    if (!workerLine && shift.employeeId !== ctx.employeeId) throw new Error("This shift is not assigned to you.");
    if (!workerLine) {
      const { data, error: headerOnlyError } = await supabase
        .from("roster_shift")
        .update({
          checked_in_at: built.shift.checkedInAt,
          check_in_latitude: geoToDbNumber(built.shift.checkInLatitude),
          check_in_longitude: geoToDbNumber(built.shift.checkInLongitude),
          updated_by: built.shift.updatedBy,
        })
        .eq("id", shiftId)
        .eq("employee_id", ctx.employeeId)
        .is("checked_in_at", null)
        .select("*");
      if (headerOnlyError) throw headerOnlyError;
      if (!data?.length) throw new Error("Check-in is no longer available for this shift.");
      return loadRosterShiftWithSessionLines(supabase, data[0] as RosterShiftRow);
    }
    const workerRow = rosterShiftWorkerLineToRow(shiftId, workerLine);
    const { data: updatedLines, error: workerUpdateError } = await supabase
      .from("roster_shift_worker_line")
      .update({
        checked_in_at: workerRow.checked_in_at,
        status: workerRow.status,
        notes: workerRow.notes,
      })
      .eq("id", workerRow.id)
      .eq("employee_id", ctx.employeeId)
      .is("checked_in_at", null)
      .select("*");
    if (workerUpdateError) throw workerUpdateError;
    if (!updatedLines?.length) throw new Error("Check-in is no longer available for this shift.");

    if (shift.employeeId === ctx.employeeId) {
      const { error: headerError } = await supabase
        .from("roster_shift")
        .update({
          checked_in_at: built.shift.checkedInAt,
          check_in_latitude: geoToDbNumber(built.shift.checkInLatitude),
          check_in_longitude: geoToDbNumber(built.shift.checkInLongitude),
          updated_by: built.shift.updatedBy,
        })
        .eq("id", shiftId)
        .is("checked_in_at", null);
      if (headerError) throw headerError;
    }

    const { data: nextRow, error: reloadError } = await supabase
      .from("roster_shift")
      .select("*")
      .eq("id", shiftId)
      .maybeSingle();
    if (reloadError || !nextRow) throw reloadError ?? new Error("Shift not found.");
    return loadRosterShiftWithSessionLines(supabase, nextRow as RosterShiftRow);
  }

  return built.shift;
}

export async function performMyShiftCheckOut(
  ctx: MyWorkplaceContext,
  shiftId: string,
  notes: string,
  geo: GeoCoordinates | null = null,
  at?: Date
): Promise<RosterShiftRecord> {
  const supabase = isSupabaseConfigured() ? serviceClient() : null;
  const { data: row, error } = supabase
    ? await supabase.from("roster_shift").select("*").eq("id", shiftId).maybeSingle()
    : { data: null, error: null };

  if (supabase && (error || !row)) throw new Error("Shift not found.");
  const shift = row
    ? await loadRosterShiftWithSessionLines(supabase, row as RosterShiftRow)
    : null;
  if (!shift) throw new Error("Shift not found.");

  const built = buildCheckOutUpdate(shift, ctx.employeeId, ctx.session.displayName, notes, at ?? new Date(), geo);
  if (!built.ok) throw new Error(built.message);

  if (supabase) {
    const workerLine = (built.shift.workerLines ?? []).find((line) => line.employeeId.trim() === ctx.employeeId);
    if (!workerLine && shift.employeeId !== ctx.employeeId) throw new Error("This shift is not assigned to you.");
    if (!workerLine) {
      const { data, error: headerOnlyError } = await supabase
        .from("roster_shift")
        .update({
          checked_out_at: built.shift.checkedOutAt,
          check_in_notes: built.shift.checkInNotes ?? "",
          check_out_latitude: geoToDbNumber(built.shift.checkOutLatitude),
          check_out_longitude: geoToDbNumber(built.shift.checkOutLongitude),
          status: built.shift.status,
          updated_by: built.shift.updatedBy,
        })
        .eq("id", shiftId)
        .eq("employee_id", ctx.employeeId)
        .not("checked_in_at", "is", null)
        .is("checked_out_at", null)
        .select("*");
      if (headerOnlyError) throw headerOnlyError;
      if (!data?.length) throw new Error("Check-out is no longer available for this shift.");
      return loadRosterShiftWithSessionLines(supabase, data[0] as RosterShiftRow);
    }
    const workerRow = rosterShiftWorkerLineToRow(shiftId, workerLine);
    const { data: updatedLines, error: workerUpdateError } = await supabase
      .from("roster_shift_worker_line")
      .update({
        checked_out_at: workerRow.checked_out_at,
        notes: workerRow.notes,
      })
      .eq("id", workerRow.id)
      .eq("employee_id", ctx.employeeId)
      .not("checked_in_at", "is", null)
      .is("checked_out_at", null)
      .select("*");
    if (workerUpdateError) throw workerUpdateError;
    if (!updatedLines?.length) throw new Error("Check-out is no longer available for this shift.");

    const { data: allWorkerRows, error: workerReloadError } = await supabase
      .from("roster_shift_worker_line")
      .select("*")
      .eq("roster_shift_id", shiftId);
    if (workerReloadError) throw workerReloadError;
    const workerRows = (allWorkerRows ?? []) as RosterShiftWorkerLineRow[];
    const headerWorkerHasNoWorkerLine =
      Boolean(shift.employeeId?.trim()) &&
      !workerRows.some((line) => line.employee_id?.trim() === shift.employeeId.trim());
    const allCheckedInWorkersCheckedOut =
      workerRows.every((line) => !line.employee_id?.trim() || !line.checked_in_at || Boolean(line.checked_out_at)) &&
      (!headerWorkerHasNoWorkerLine ||
        !shift.checkedInAt?.trim() ||
        Boolean((shift.employeeId === ctx.employeeId ? built.shift.checkedOutAt : shift.checkedOutAt)?.trim()));
    const headerUpdate: Partial<RosterShiftRow> = {
      status: shift.status === "Published" && allCheckedInWorkersCheckedOut ? "Completed" : shift.status,
      updated_by: built.shift.updatedBy,
    };
    if (shift.employeeId === ctx.employeeId) {
      headerUpdate.checked_out_at = built.shift.checkedOutAt;
      headerUpdate.check_in_notes = built.shift.checkInNotes ?? "";
      headerUpdate.check_out_latitude = geoToDbNumber(built.shift.checkOutLatitude);
      headerUpdate.check_out_longitude = geoToDbNumber(built.shift.checkOutLongitude);
    }
    const { error: headerError } = await supabase.from("roster_shift").update(headerUpdate).eq("id", shiftId);
    if (headerError) throw headerError;

    const { data: nextRow, error: reloadError } = await supabase
      .from("roster_shift")
      .select("*")
      .eq("id", shiftId)
      .maybeSingle();
    if (reloadError || !nextRow) throw reloadError ?? new Error("Shift not found.");
    return loadRosterShiftWithSessionLines(supabase, nextRow as RosterShiftRow);
  }

  return built.shift;
}

/** Coordinator void — clears check-in so the worker can check in again (CFO C-01). */
export async function performVoidShiftCheckIn(
  shiftId: string,
  employeeId: string,
  voidedBy: string
): Promise<RosterShiftRecord> {
  const supabase = isSupabaseConfigured() ? serviceClient() : null;
  if (!supabase) throw new Error("Supabase not configured");

  const { data: row, error } = await supabase.from("roster_shift").select("*").eq("id", shiftId).maybeSingle();
  if (error || !row) throw new Error("Shift not found.");
  const shift = await loadRosterShiftWithSessionLines(supabase, row as RosterShiftRow);
  const now = new Date().toISOString();
  const workerLine = (shift.workerLines ?? []).find((line) => line.employeeId.trim() === employeeId.trim());

  if (workerLine) {
    if (!workerLine.checkedInAt?.trim()) throw new Error("This worker has not checked in.");
    if (workerLine.checkedOutAt?.trim()) throw new Error("Cannot void after check-out.");
    const { data: updated, error: lineError } = await supabase
      .from("roster_shift_worker_line")
      .update({
        checked_in_at: null,
        check_in_voided_at: now,
        check_in_voided_by: voidedBy,
      })
      .eq("id", workerLine.id)
      .select("*");
    if (lineError) throw lineError;
    if (!updated?.length) throw new Error("Could not void check-in.");
  } else if (shift.employeeId?.trim() === employeeId.trim()) {
    if (!shift.checkedInAt?.trim()) throw new Error("This worker has not checked in.");
    if (shift.checkedOutAt?.trim()) throw new Error("Cannot void after check-out.");
    const { data: updated, error: headerError } = await supabase
      .from("roster_shift")
      .update({
        checked_in_at: null,
        check_in_latitude: null,
        check_in_longitude: null,
        check_in_voided_at: now,
        check_in_voided_by: voidedBy,
        updated_by: voidedBy,
      })
      .eq("id", shiftId)
      .select("*");
    if (headerError) throw headerError;
    if (!updated?.length) throw new Error("Could not void check-in.");
  } else {
    throw new Error("Employee is not assigned to this shift.");
  }

  const { data: nextRow, error: reloadError } = await supabase
    .from("roster_shift")
    .select("*")
    .eq("id", shiftId)
    .maybeSingle();
  if (reloadError || !nextRow) throw reloadError ?? new Error("Shift not found.");
  return loadRosterShiftWithSessionLines(supabase, nextRow as RosterShiftRow);
}

export async function submitLeaveOnBehalf(
  session: AuthSession,
  employeeId: string,
  payload: MyLeaveSubmitPayload
): Promise<{ request: EmployeeLeaveRequestRow; employee: EmployeeRecord }> {
  const employee = await loadMyEmployee(employeeId);
  if (!employee) throw new Error("Employee record not found");

  const leaveType = payload.leaveType.trim();
  const daysRequested = countWeekdaysInclusive(payload.startDate, payload.endDate);
  assertLeaveBalance(employee, leaveType, daysRequested);

  const now = new Date().toISOString();
  const lineNo = employee.leaveRequests.length + 1;
  const request: EmployeeLeaveRequestRow = {
    id: newLineId("leave-req"),
    lineNo,
    leaveType,
    startDate: payload.startDate,
    endDate: payload.endDate,
    daysRequested,
    status: "Requested",
    notes: payload.notes.trim(),
    submittedAt: now,
    reviewedBy: "",
    declineReason: "",
  };

  const activity = {
    id: newLineId("emp-act"),
    lineNo: employee.activities.length + 1,
    date: now.slice(0, 10),
    activityType: "Leave",
    subject: "Leave request submitted on behalf",
    description: `${request.leaveType}: ${request.startDate} to ${request.endDate} (by ${session.displayName})`,
    createdBy: session.displayName,
  };

  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    await persistMyLeaveRequest(supabase, employeeId, request, activity);
    const updatedEmployee = normalizeEmployee({
      ...employee,
      leaveRequests: [...employee.leaveRequests, request],
    });
    await runServerAutomationEvents(supabase, [
      myWorkplaceLeaveRequestedEvent(updatedEmployee, request),
    ]);
  }

  const next = normalizeEmployee({
    ...employee,
    leaveRequests: [...employee.leaveRequests, request],
    activities: [activity, ...employee.activities],
    updatedBy: session.displayName,
  });

  return { request, employee: next };
}

export function defaultAvailabilityRows(): EmployeeAvailabilityRow[] {
  // dayOfWeek is 0-indexed Monday..Sunday (see dayLabels()), so Monday-Friday is [0,1,2,3,4].
  return [...DEFAULT_AVAILABILITY_WEEKDAYS].map((dayOfWeek, index) => ({
    id: newLineId("avail"),
    lineNo: index + 1,
    dayOfWeek,
    startTime: "09:00",
    endTime: "17:00",
    availability: "Available",
    notes: "",
  }));
}

const EMPTY_ADVISORY: MyWorkplaceServicesAdvisory = {
  sites: [],
  highDemandCount: 0,
  advisoryMessage: null,
};

function isAssignmentActiveOnDate(validFrom: string, validTo: string, day: string): boolean {
  if (validFrom?.trim() && day < validFrom.slice(0, 10)) return false;
  if (validTo?.trim() && day > validTo.slice(0, 10)) return false;
  return true;
}

/**
 * Loads only the employee's assigned locations, orientations, and upcoming
 * roster shifts (high-demand lookahead window) — not the whole organisation.
 */
async function loadServicesAdvisorySupportData(supabase: SupabaseClient, employeeId: string, today: string) {
  const rangeEnd = addDaysIso(today, HIGH_DEMAND_LOOKAHEAD_DAYS);

  const { data: employeeLinkRows, error: linksError } = await supabase
    .from("support_location_employee")
    .select("*")
    .eq("employee_id", employeeId)
    .order("line_no");
  if (linksError) throw linksError;

  const activeLinks = ((employeeLinkRows ?? []) as SupportLocationEmployeeRowDb[]).filter((row) =>
    isAssignmentActiveOnDate(row.valid_from ?? "", row.valid_to ?? "", today)
  );
  const locationIds = [...new Set(activeLinks.map((row) => row.location_id).filter(Boolean))];
  if (!locationIds.length) {
    return { locations: [], siteOrientations: [], rosterShifts: [] };
  }

  const linksByLocation = new Map<string, SupportLocationEmployeeRowDb[]>();
  for (const row of activeLinks) {
    const list = linksByLocation.get(row.location_id) ?? [];
    list.push(row);
    linksByLocation.set(row.location_id, list);
  }

  const [locationsRes, siteOrientationsRes, rosterShiftsRes] = await Promise.all([
    supabase.from("support_location").select("*").in("id", locationIds).order("search_key"),
    supabase.from("site_orientation").select("*").in("location_id", locationIds),
    supabase
      .from("roster_shift")
      .select("*")
      .in("location_id", locationIds)
      .gte("shift_date", today)
      .lte("shift_date", rangeEnd),
  ]);

  const firstError = locationsRes.error ?? siteOrientationsRes.error ?? rosterShiftsRes.error;
  if (firstError) throw firstError;

  const locations = ((locationsRes.data ?? []) as SupportLocationRow[]).map((row) =>
    normalizeLocation(
      locationFromRow(row, {
        alerts: [],
        clientLinks: [],
        employeeLinks: linksByLocation.get(row.id) ?? [],
        productLinks: [],
        activities: [],
      })
    )
  );
  const siteOrientations = ((siteOrientationsRes.data ?? []) as SiteOrientationRow[]).map(siteOrientationFromRow);
  const rosterShifts = ((rosterShiftsRes.data ?? []) as RosterShiftRow[]).map((row) =>
    normalizeRosterShift(rosterShiftFromRow(row))
  );

  return { locations, siteOrientations, rosterShifts };
}

export async function loadMyServicesAdvisory(
  ctx: MyWorkplaceContext,
  employee?: EmployeeRecord | null
): Promise<MyWorkplaceServicesAdvisory> {
  const resolvedEmployee = employee ?? (await loadMyEmployee(ctx.employeeId));
  if (!resolvedEmployee) return EMPTY_ADVISORY;

  if (isSupabaseConfigured()) {
    // Live employee data must pair with live support data — never mix the live
    // employee record with bundled demo seeds. On query failure, degrade to an
    // empty advisory rather than showing stale/seed sites.
    try {
      const today = new Date().toISOString().slice(0, 10);
      const data = await loadServicesAdvisorySupportData(serviceClient(), ctx.employeeId, today);
      return buildMyWorkplaceServicesAdvisory({
        employee: resolvedEmployee,
        locations: data.locations,
        siteOrientations: data.siteOrientations,
        rosterShifts: data.rosterShifts,
        today,
      });
    } catch {
      return EMPTY_ADVISORY;
    }
  }

  const { initialLocations } = await import("@/lib/location");
  const { initialSiteOrientations } = await import("@/lib/site-orientation");
  const { initialRosterShifts } = await import("@/lib/roster-shift");

  return buildMyWorkplaceServicesAdvisory({
    employee: resolvedEmployee,
    locations: initialLocations,
    siteOrientations: initialSiteOrientations,
    rosterShifts: initialRosterShifts,
  });
}
