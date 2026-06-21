import type { AuthSession } from "@/lib/access/types";
import { SEED_USERS } from "@/lib/access/seed";
import { initialEmployees, normalizeEmployee, type EmployeeRecord } from "@/lib/employee";
import { initialLocations, normalizeLocation, type LocationRecord } from "@/lib/location";
import { initialRosterShifts, normalizeRosterShift, type RosterShiftRecord } from "@/lib/roster-shift";
import { normalizeTimesheet, type TimesheetRecord } from "@/lib/timesheet";
import { fetchUsers } from "@/lib/supabase/access-api";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { saveTimesheet } from "@/lib/supabase/data-api";
import {
  rosterShiftFromRow,
  timesheetFromRow,
  type RosterShiftRow,
  type TimesheetLineRowDb,
  type TimesheetRow,
} from "@/lib/supabase/mappers";
import {
  locationFromRow,
  type SupportLocationEmployeeRowDb,
  type SupportLocationRow,
} from "@/lib/supabase/location-mappers";
import {
  assertTimesheetApprovalAllowed,
  buildTimesheetApprovalQueue,
  canApproveTimesheet,
  seesAllTimesheetApprovals,
  type TimesheetApprovalContext,
  type TimesheetApprovalQueue,
  type TimesheetApprovalScopeKind,
} from "@/lib/workforce/timesheet-approval-queue";
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

async function loadApprovalData(): Promise<{
  timesheets: TimesheetRecord[];
  employees: EmployeeRecord[];
  rosterShifts: RosterShiftRecord[];
  locations: LocationRecord[];
}> {
  if (!isSupabaseConfigured()) {
    return {
      timesheets: [],
      employees: initialEmployees.map(normalizeEmployee),
      rosterShifts: initialRosterShifts.map(normalizeRosterShift),
      locations: initialLocations.map(normalizeLocation),
    };
  }

  const supabase = serviceClient();
  const [timesheetsRes, linesRes, employeesRes, shiftsRes, locationsRes, locEmployeesRes] = await Promise.all([
    supabase.from("timesheet").select("*").eq("status", "Submitted").order("period_start", { ascending: false }),
    supabase.from("timesheet_line").select("*").order("line_no"),
    supabase.from("employee").select("id, search_key, name, reports_to_id"),
    supabase.from("roster_shift").select("*"),
    supabase.from("support_location").select("id, search_key, name"),
    supabase.from("support_location_employee").select("*").order("line_no"),
  ]);

  if (timesheetsRes.error) throw timesheetsRes.error;
  if (linesRes.error) throw linesRes.error;
  if (employeesRes.error) throw employeesRes.error;
  if (shiftsRes.error) throw shiftsRes.error;
  if (locationsRes.error) throw locationsRes.error;
  if (locEmployeesRes.error) throw locEmployeesRes.error;

  const linesByTimesheet = new Map<string, TimesheetLineRowDb[]>();
  for (const row of (linesRes.data ?? []) as TimesheetLineRowDb[]) {
    const list = linesByTimesheet.get(row.timesheet_id) ?? [];
    list.push(row);
    linesByTimesheet.set(row.timesheet_id, list);
  }

  const employeesByLocation = new Map<string, typeof locEmployeesRes.data>();
  for (const row of locEmployeesRes.data ?? []) {
    const list = employeesByLocation.get(row.location_id) ?? [];
    list.push(row);
    employeesByLocation.set(row.location_id, list);
  }

  const timesheets = ((timesheetsRes.data ?? []) as TimesheetRow[]).map((row) =>
    normalizeTimesheet(timesheetFromRow(row, linesByTimesheet.get(row.id) ?? []))
  );

  const employees = ((employeesRes.data ?? []) as { id: string; search_key?: string; name?: string; reports_to_id?: string }[]).map(
    (row) => {
      const seed = initialEmployees.find((e) => e.id === row.id);
      return normalizeEmployee({
        ...(seed ?? {
          id: row.id,
          searchKey: row.search_key ?? row.id,
          name: row.name ?? row.id,
          reportsToId: row.reports_to_id ?? "",
          credentials: [],
          locations: [],
          emergencyContacts: [],
          alerts: [],
          skills: [],
          documents: [],
          activities: [],
          leaveEntitlements: [],
          leaveRequests: [],
        }),
        id: row.id,
        searchKey: row.search_key ?? seed?.searchKey ?? row.id,
        name: row.name ?? seed?.name ?? row.id,
        reportsToId: row.reports_to_id ?? seed?.reportsToId ?? "",
      } as EmployeeRecord);
    }
  );

  const rosterShifts = ((shiftsRes.data ?? []) as RosterShiftRow[]).map((row) =>
    normalizeRosterShift(rosterShiftFromRow(row))
  );

  const locations = ((locationsRes.data ?? []) as SupportLocationRow[]).map((row) =>
    normalizeLocation(
      locationFromRow(row, {
        alerts: [],
        clientLinks: [],
        employeeLinks: (employeesByLocation.get(row.id) ?? []) as SupportLocationEmployeeRowDb[],
        productLinks: [],
        activities: [],
      })
    )
  );

  return { timesheets, employees, rosterShifts, locations };
}

async function buildContext(session: AuthSession): Promise<TimesheetApprovalContext> {
  const reviewerEmployeeId = await resolveEmployeeId(session);
  const data = await loadApprovalData();
  return {
    ...data,
    reviewerEmployeeId,
    seesAll: seesAllTimesheetApprovals(session),
  };
}

export async function loadTimesheetApprovalQueue(
  session: AuthSession,
  scope: TimesheetApprovalScopeKind,
  locationId = ""
): Promise<TimesheetApprovalQueue> {
  if (!canApproveTimesheet(session)) {
    return buildTimesheetApprovalQueue(
      {
        timesheets: [],
        employees: [],
        rosterShifts: [],
        locations: [],
        reviewerEmployeeId: null,
        seesAll: false,
      },
      scope,
      locationId
    );
  }
  const ctx = await buildContext(session);
  return buildTimesheetApprovalQueue(ctx, scope, locationId);
}

export type TimesheetApprovalAction = {
  timesheetIds: string[];
  scope: TimesheetApprovalScopeKind;
  locationId?: string;
};

export async function applyTimesheetApprovals(
  session: AuthSession,
  action: TimesheetApprovalAction,
  actorName: string
): Promise<TimesheetRecord[]> {
  if (!canApproveTimesheet(session)) throw new Error("Timesheet approval not permitted");
  if (!action.timesheetIds.length) throw new Error("No timesheets selected");

  const ctx = await buildContext(session);
  const locationId = action.locationId ?? "";
  const approved: TimesheetRecord[] = [];

  for (const timesheetId of action.timesheetIds) {
    const sheet = ctx.timesheets.find((t) => t.id === timesheetId);
    if (!sheet) throw new Error(`Timesheet not found: ${timesheetId}`);
    assertTimesheetApprovalAllowed(sheet, ctx, action.scope, locationId);
    const next = normalizeTimesheet({
      ...sheet,
      status: "Approved",
      updatedBy: actorName,
    });
    if (isSupabaseConfigured()) {
      await saveTimesheet(serviceClient(), next);
    }
    approved.push(next);
  }

  return approved;
}
