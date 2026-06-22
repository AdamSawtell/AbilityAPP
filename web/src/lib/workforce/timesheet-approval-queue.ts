import type { AuthSession } from "@/lib/access/types";
import type { EmployeeRecord } from "@/lib/employee";
import type { LocationRecord } from "@/lib/location";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import { formatTimesheetPeriod, type TimesheetRecord } from "@/lib/timesheet";
import { verifyTimesheet } from "@/lib/timesheet-verification";
import { timesheetApproveBlocked } from "@/lib/timesheet-workflow";
import { isInManagementLine } from "@/lib/workforce/management-line";

export type TimesheetApprovalScopeKind =
  | "management-line"
  | "direct-reports"
  | "my-locations"
  | "location"
  | "organisation";

export type TimesheetApprovalBucket = "ready" | "review" | "blocked";

export type TimesheetApprovalScopeOption = {
  kind: TimesheetApprovalScopeKind;
  label: string;
  locationId?: string;
};

export type TimesheetApprovalItem = {
  timesheetId: string;
  documentNo: string;
  employeeId: string;
  employeeName: string;
  employeeSearchKey: string;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  totalHours: number;
  bucket: TimesheetApprovalBucket;
  blockReason: string | null;
  manualReviewCount: number;
  href: string;
  locationLabels: string[];
};

export type TimesheetApprovalCounts = {
  ready: number;
  review: number;
  blocked: number;
  total: number;
};

export type TimesheetApprovalSummary = TimesheetApprovalCounts & {
  href: string;
};

export type TimesheetApprovalQueue = {
  summary: TimesheetApprovalCounts;
  items: TimesheetApprovalItem[];
  scopes: TimesheetApprovalScopeOption[];
  locations: { id: string; label: string }[];
  activeScope: TimesheetApprovalScopeKind;
  locationId: string;
};

export type TimesheetApprovalContext = {
  timesheets: TimesheetRecord[];
  employees: EmployeeRecord[];
  rosterShifts: RosterShiftRecord[];
  locations: LocationRecord[];
  reviewerEmployeeId: string | null;
  seesAll: boolean;
};

export function canApproveTimesheet(session: Pick<AuthSession, "processIds">): boolean {
  return session.processIds.includes("approve-timesheet");
}

export function seesAllTimesheetApprovals(session: Pick<AuthSession, "windowKeys">): boolean {
  return session.windowKeys.includes("timesheets");
}

export function defaultTimesheetApprovalScope(
  session: Pick<AuthSession, "windowKeys">,
  reviewerEmployeeId: string | null
): TimesheetApprovalScopeKind {
  if (seesAllTimesheetApprovals(session)) return "organisation";
  if (reviewerEmployeeId) return "management-line";
  return "direct-reports";
}

export function timesheetApprovalHref(
  session: Pick<AuthSession, "windowKeys">,
  reviewerEmployeeId: string | null
): string {
  const scope = defaultTimesheetApprovalScope(session, reviewerEmployeeId);
  return `/timesheet-approval?scope=${encodeURIComponent(scope)}`;
}

export function reviewerLocationIds(
  reviewerEmployeeId: string | null,
  locations: LocationRecord[]
): Set<string> {
  const ids = new Set<string>();
  if (!reviewerEmployeeId) return ids;
  for (const location of locations) {
    if (location.employeeLinks.some((link) => link.employeeId === reviewerEmployeeId)) {
      ids.add(location.id);
    }
  }
  return ids;
}

function employeeLabel(employees: EmployeeRecord[], employeeId: string): { name: string; searchKey: string } {
  const match = employees.find((e) => e.id === employeeId);
  return { name: match?.name ?? employeeId, searchKey: match?.searchKey ?? "" };
}

function timesheetLocationIds(sheet: TimesheetRecord, rosterShifts: RosterShiftRecord[]): Set<string> {
  const ids = new Set<string>();
  const shiftById = new Map(rosterShifts.map((s) => [s.id, s]));
  for (const line of sheet.lines) {
    if (line.locationId?.trim()) ids.add(line.locationId.trim());
    const shift = shiftById.get(line.rosterShiftId?.trim() ?? "");
    if (shift?.locationId?.trim()) ids.add(shift.locationId.trim());
  }
  return ids;
}

function employeeAssignedToLocation(employeeId: string, locationId: string, locations: LocationRecord[]): boolean {
  const location = locations.find((l) => l.id === locationId);
  return Boolean(location?.employeeLinks.some((link) => link.employeeId === employeeId));
}

export function employeeInApprovalScope(
  employeeId: string,
  sheet: TimesheetRecord,
  scope: TimesheetApprovalScopeKind,
  ctx: TimesheetApprovalContext,
  locationId = ""
): boolean {
  if (ctx.seesAll && scope === "organisation") return true;

  const employee = ctx.employees.find((e) => e.id === employeeId);
  if (!employee) return false;

  const reviewerId = ctx.reviewerEmployeeId;
  const sheetLocations = timesheetLocationIds(sheet, ctx.rosterShifts);
  const reviewerLocations = reviewerLocationIds(reviewerId, ctx.locations);

  if (scope === "management-line") {
    return Boolean(reviewerId && isInManagementLine(employeeId, reviewerId, ctx.employees));
  }

  if (scope === "direct-reports") {
    return Boolean(reviewerId && employee.reportsToId === reviewerId);
  }

  if (scope === "location") {
    if (!locationId.trim()) return false;
    if (employeeAssignedToLocation(employeeId, locationId, ctx.locations)) return true;
    return sheetLocations.has(locationId);
  }

  if (scope === "my-locations") {
    if (reviewerId && employee.reportsToId === reviewerId) return true;
    for (const id of reviewerLocations) {
      if (employeeAssignedToLocation(employeeId, id, ctx.locations)) return true;
      if (sheetLocations.has(id)) return true;
    }
    return false;
  }

  return false;
}

function classifyBucket(sheet: TimesheetRecord, rosterShifts: RosterShiftRecord[], locations: LocationRecord[]): {
  bucket: TimesheetApprovalBucket;
  blockReason: string | null;
  manualReviewCount: number;
} {
  const verification = verifyTimesheet(sheet, rosterShifts, locations);
  const approveBlock = timesheetApproveBlocked(sheet, rosterShifts, "Approved", sheet.status, locations);
  const manualReviewCount = verification.lines.filter((line) => line.status === "no-roster-link").length;

  if (approveBlock) {
    return { bucket: "blocked", blockReason: approveBlock, manualReviewCount };
  }
  if (manualReviewCount > 0) {
    return { bucket: "review", blockReason: null, manualReviewCount };
  }
  return { bucket: "ready", blockReason: null, manualReviewCount: 0 };
}

export function buildTimesheetApprovalScopes(
  ctx: TimesheetApprovalContext
): { scopes: TimesheetApprovalScopeOption[]; locations: { id: string; label: string }[] } {
  const locations = ctx.locations
    .map((l) => ({ id: l.id, label: l.searchKey || l.name || l.id }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const scopes: TimesheetApprovalScopeOption[] = [];
  if (ctx.reviewerEmployeeId) {
    scopes.push({ kind: "management-line", label: "My management line" });
    scopes.push({ kind: "direct-reports", label: "My direct reports" });
    const mine = reviewerLocationIds(ctx.reviewerEmployeeId, ctx.locations);
    if (mine.size) scopes.push({ kind: "my-locations", label: "My site(s)" });
  }
  for (const location of locations) {
    scopes.push({ kind: "location", label: location.label, locationId: location.id });
  }
  if (ctx.seesAll) {
    scopes.push({ kind: "organisation", label: "All submitted" });
  }

  return { scopes, locations };
}

export function buildTimesheetApprovalQueue(
  ctx: TimesheetApprovalContext,
  scope: TimesheetApprovalScopeKind,
  locationId = ""
): TimesheetApprovalQueue {
  const { scopes, locations: locationOptions } = buildTimesheetApprovalScopes(ctx);
  const locationLabelById = new Map(ctx.locations.map((l) => [l.id, l.searchKey || l.name || l.id]));

  const items: TimesheetApprovalItem[] = [];
  for (const sheet of ctx.timesheets) {
    if (sheet.status !== "Submitted") continue;
    if (!employeeInApprovalScope(sheet.employeeId, sheet, scope, ctx, locationId)) continue;

    const { bucket, blockReason, manualReviewCount } = classifyBucket(sheet, ctx.rosterShifts, ctx.locations);
    const { name, searchKey } = employeeLabel(ctx.employees, sheet.employeeId);
    const locIds = timesheetLocationIds(sheet, ctx.rosterShifts);
    const locationLabels = [...locIds].map((id) => locationLabelById.get(id) ?? id).sort();

    items.push({
      timesheetId: sheet.id,
      documentNo: sheet.documentNo,
      employeeId: sheet.employeeId,
      employeeName: name,
      employeeSearchKey: searchKey,
      periodStart: sheet.periodStart,
      periodEnd: sheet.periodEnd,
      periodLabel: formatTimesheetPeriod(sheet.periodStart, sheet.periodEnd),
      totalHours: sheet.totalHours,
      bucket,
      blockReason,
      manualReviewCount,
      href: `/timesheets/${sheet.id}`,
      locationLabels,
    });
  }

  items.sort((a, b) => {
    const bucketOrder = { ready: 0, review: 1, blocked: 2 };
    const diff = bucketOrder[a.bucket] - bucketOrder[b.bucket];
    if (diff !== 0) return diff;
    return (b.periodStart || "").localeCompare(a.periodStart || "");
  });

  const summary: TimesheetApprovalCounts = {
    ready: items.filter((i) => i.bucket === "ready").length,
    review: items.filter((i) => i.bucket === "review").length,
    blocked: items.filter((i) => i.bucket === "blocked").length,
    total: items.length,
  };

  return {
    summary,
    items,
    scopes,
    locations: locationOptions,
    activeScope: scope,
    locationId,
  };
}

export function buildTimesheetApprovalSummary(
  ctx: TimesheetApprovalContext,
  scope: TimesheetApprovalScopeKind,
  locationId = ""
): TimesheetApprovalCounts {
  return buildTimesheetApprovalQueue(ctx, scope, locationId).summary;
}

export function assertTimesheetApprovalAllowed(
  sheet: TimesheetRecord,
  ctx: TimesheetApprovalContext,
  scope: TimesheetApprovalScopeKind,
  locationId = ""
): void {
  if (sheet.status !== "Submitted") {
    throw new Error("Only submitted timesheets can be approved.");
  }
  if (!employeeInApprovalScope(sheet.employeeId, sheet, scope, ctx, locationId)) {
    throw new Error("This timesheet is outside your approval scope.");
  }
  const approveBlock = timesheetApproveBlocked(sheet, ctx.rosterShifts, "Approved", sheet.status, ctx.locations);
  if (approveBlock) {
    throw new Error(approveBlock);
  }
}
