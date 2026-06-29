import type { AuthSession } from "@/lib/access/types";
import type { AppUserRecord } from "@/lib/access/types";
import type { EmployeeRecord } from "@/lib/employee";
import { daysUntil } from "@/lib/employee-compliance";
import {
  filterTasksForView,
  taskAssignedToUser,
} from "@/lib/task-access";
import { taskUrgency, type TaskUrgency } from "@/lib/task-hub";
import type { TaskRecord } from "@/lib/task";
import type { IncidentRecord } from "@/lib/incident";
import { canAccessWindow } from "@/lib/access/catalog";
import { openIncidentDeadlines } from "@/lib/incident-queries";
import { formatDisplayDateTime } from "@/lib/incident";
import { formatShiftTimeRange, type RosterShiftRecord } from "@/lib/roster-shift";
import { shiftsAssignedToWorker } from "@/lib/roster-shift-checkin";
import {
  requestsForEmployee,
  shiftRequestResponseLabels,
  type RosterShiftRequestRecord,
} from "@/lib/roster-shift-request";
import { calendarEventsByDate, sortCalendarEvents } from "@/lib/calendar-sort";

export type CalendarViewMode = "month" | "week" | "day";

export type PersonalCalendarEventKind =
  | "task-user"
  | "task-role"
  | "roster-shift"
  | "shift-request"
  | "leave-request"
  | "credential-expiry"
  | "document-expiry"
  | "visa-expiry"
  | "licence-expiry"
  | "incident-deadline";

export type PersonalCalendarEvent = {
  id: string;
  date: string;
  kind: PersonalCalendarEventKind;
  title: string;
  subtitle?: string;
  /** HH:MM — used to order timed items earliest-first within a day. */
  startTime?: string;
  href: string;
  urgency?: TaskUrgency;
};

export function isoFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dateFromIso(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

export function startOfWeekMonday(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(12, 0, 0, 0);
  const weekday = copy.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function monthGridDays(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12);
  const start = startOfWeekMonday(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function weekDays(anchor: Date): Date[] {
  const start = startOfWeekMonday(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Mon–Sun × 2 — standard NDIS roster cycle. */
export function fortnightDays(anchor: Date): Date[] {
  const start = startOfWeekMonday(anchor);
  return Array.from({ length: 14 }, (_, i) => addDays(start, i));
}

export function formatFortnightRange(anchor: Date): string {
  const days = fortnightDays(anchor);
  const start = days[0];
  const end = days[13];
  const sameMonth = start.getMonth() === end.getMonth();
  const startStr = start.toLocaleDateString("en-AU", { day: "numeric", month: sameMonth ? undefined : "short" });
  const endStr = end.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  return `${startStr} – ${endStr} (fortnight)`;
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function isSameDay(a: Date, b: Date): boolean {
  return isoFromDate(a) === isoFromDate(b);
}

export function formatMonthYear(d: Date): string {
  return d.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
}

export function formatDayHeading(d: Date): string {
  return d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatWeekRange(anchor: Date): string {
  const days = weekDays(anchor);
  const start = days[0];
  const end = days[6];
  const sameMonth = start.getMonth() === end.getMonth();
  const startStr = start.toLocaleDateString("en-AU", { day: "numeric", month: sameMonth ? undefined : "short" });
  const endStr = end.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  return `${startStr} – ${endStr}`;
}

/** Active tasks assigned to the signed-in user or their current role (deduped). */
export function personalTasksForSession(
  tasks: TaskRecord[],
  session: Pick<AuthSession, "userId" | "activeRoleId" | "windowKeys" | "taskTypePermissions">
): TaskRecord[] {
  const mine = filterTasksForView(tasks, "assigned-to-me", session);
  const role = filterTasksForView(tasks, "my-role", session);
  const byId = new Map<string, TaskRecord>();
  for (const task of [...mine, ...role]) byId.set(task.id, task);
  return [...byId.values()];
}

export function employeeForUser(
  users: AppUserRecord[],
  employees: EmployeeRecord[],
  userId: string
): EmployeeRecord | null {
  const user = users.find((u) => u.id === userId);
  if (!user?.employeeBpId?.trim()) return null;
  return employees.find((e) => e.id === user.employeeBpId) ?? null;
}

function taskEvent(task: TaskRecord, session: Pick<AuthSession, "userId">): PersonalCalendarEvent | null {
  if (!task.dueDate?.trim()) return null;
  return {
    id: `task-${task.id}`,
    date: task.dueDate,
    kind: taskAssignedToUser(task, session.userId) ? "task-user" : "task-role",
    title: task.title,
    subtitle: task.documentNo,
    href: `/tasks/${task.id}`,
    urgency: taskUrgency(task),
  };
}

function complianceEvents(employee: EmployeeRecord): PersonalCalendarEvent[] {
  const events: PersonalCalendarEvent[] = [];
  const empHref = `/employees/${employee.id}`;

  for (const cred of employee.credentials) {
    if (!cred.expiryDate?.trim()) continue;
    const days = daysUntil(cred.expiryDate);
    events.push({
      id: `cred-${cred.id}`,
      date: cred.expiryDate,
      kind: "credential-expiry",
      title: `${cred.credentialType} expires`,
      subtitle: cred.credentialNumber || cred.status,
      href: `${empHref}?tab=Credentials%20Assigned`,
      urgency: days !== null && days < 0 ? "overdue" : days !== null && days <= 30 ? "soon" : "later",
    });
  }

  for (const doc of employee.documents) {
    if (!doc.expiryDate?.trim()) continue;
    const days = daysUntil(doc.expiryDate);
    events.push({
      id: `doc-${doc.id}`,
      date: doc.expiryDate,
      kind: "document-expiry",
      title: `${doc.documentType} expires`,
      subtitle: doc.name,
      href: `${empHref}?tab=Documents`,
      urgency: days !== null && days < 0 ? "overdue" : days !== null && days <= 30 ? "soon" : "later",
    });
  }

  if (employee.visaExpiry?.trim()) {
    const days = daysUntil(employee.visaExpiry);
    events.push({
      id: `visa-${employee.id}`,
      date: employee.visaExpiry,
      kind: "visa-expiry",
      title: "Visa expires",
      subtitle: employee.visaSubclass ? `Subclass ${employee.visaSubclass}` : undefined,
      href: `${empHref}?tab=Full%20profile`,
      urgency: days !== null && days < 0 ? "overdue" : days !== null && days <= 30 ? "soon" : "later",
    });
  }

  if (employee.driverLicenceExpiry?.trim()) {
    const days = daysUntil(employee.driverLicenceExpiry);
    events.push({
      id: `licence-${employee.id}`,
      date: employee.driverLicenceExpiry,
      kind: "licence-expiry",
      title: "Driver licence expires",
      subtitle: employee.driverLicenceClass ? `Class ${employee.driverLicenceClass}` : undefined,
      href: `${empHref}?tab=Full%20profile`,
      urgency: days !== null && days < 0 ? "overdue" : days !== null && days <= 30 ? "soon" : "later",
    });
  }

  return events;
}

function leaveEvents(employee: EmployeeRecord): PersonalCalendarEvent[] {
  const events: PersonalCalendarEvent[] = [];
  const empHref = `/employees/${employee.id}?tab=Leave`;
  const includedStatuses = new Set(["Requested", "Approved", "Taken"]);

  for (const leave of employee.leaveRequests) {
    if (!leave.startDate?.trim() || !leave.endDate?.trim()) continue;
    if (!includedStatuses.has(leave.status)) continue;
    let cursor = dateFromIso(leave.startDate);
    const end = dateFromIso(leave.endDate);
    while (cursor <= end) {
      const iso = isoFromDate(cursor);
      events.push({
        id: `leave-${leave.id}-${iso}`,
        date: iso,
        kind: "leave-request",
        title: `${leave.leaveType || "Leave"} (${leave.status})`,
        subtitle: leave.notes || employee.name,
        href: empHref,
        urgency: leave.status === "Requested" ? "soon" : "later",
      });
      cursor = addDays(cursor, 1);
    }
  }
  return events;
}

/** Allocated (assigned) roster shifts for the worker, across all locations. */
function rosterShiftEvents(
  shifts: RosterShiftRecord[],
  employeeId: string
): PersonalCalendarEvent[] {
  if (!employeeId.trim()) return [];
  return shiftsAssignedToWorker(shifts, employeeId)
    .filter((shift) => shift.shiftDate?.trim())
    .map((shift) => {
      const timeRange = formatShiftTimeRange(shift.startTime, shift.endTime);
      return {
        id: `shift-${shift.id}`,
        date: shift.shiftDate.slice(0, 10),
        kind: "roster-shift" as const,
        title: `Shift ${timeRange}`,
        subtitle: shift.shiftRef || shift.status || "Allocated shift",
        startTime: shift.startTime,
        href: "/my/shifts",
        urgency: "later" as const,
      };
    });
}

/** Pending shift requests the worker has submitted (awaiting a rostering decision). */
function shiftRequestEvents(
  requests: RosterShiftRequestRecord[],
  shifts: RosterShiftRecord[],
  employeeId: string
): PersonalCalendarEvent[] {
  if (!employeeId.trim()) return [];
  const shiftById = new Map(shifts.map((shift) => [shift.id, shift]));
  const events: PersonalCalendarEvent[] = [];
  for (const request of requestsForEmployee(requests, employeeId)) {
    if (request.status !== "requested" || request.responseType === "decline") continue;
    const shift = shiftById.get(request.rosterShiftId);
    if (!shift?.shiftDate?.trim()) continue;
    // Skip if the shift is already allocated to this worker — it shows as an
    // allocated (teal) chip, so a duplicate request (cyan) chip is misleading
    // even when the request row is still in "requested" (e.g. filled directly
    // via the fill board without moving the request out of requested).
    if (shift.employeeId === employeeId) continue;
    const timeRange = formatShiftTimeRange(shift.startTime, shift.endTime);
    events.push({
      id: `shift-request-${request.id}`,
      date: shift.shiftDate.slice(0, 10),
      kind: "shift-request",
      title: `Requested ${timeRange}`,
      subtitle: shiftRequestResponseLabels[request.responseType],
      startTime: shift.startTime,
      href: "/my/open-shifts",
      urgency: "soon",
    });
  }
  return events;
}

function incidentDeadlineEvents(
  incidents: IncidentRecord[],
  session: Pick<AuthSession, "windowKeys">
): PersonalCalendarEvent[] {
  if (!canAccessWindow(session.windowKeys, "incidents")) return [];

  return openIncidentDeadlines(incidents).map((incident) => {
    const deadlineDate = incident.reportDeadlineAt.slice(0, 10);
    const overdue = new Date(incident.reportDeadlineAt).getTime() < Date.now();
    return {
      id: `incident-deadline-${incident.id}`,
      date: deadlineDate,
      kind: "incident-deadline" as const,
      title: `NDIS due: ${incident.documentNo}`,
      subtitle: incident.title || formatDisplayDateTime(incident.reportDeadlineAt),
      href: `/incidents/${incident.id}?tab=Notifications`,
      urgency: overdue ? "overdue" : "soon",
    };
  });
}

export function personalCalendarEvents(
  tasks: TaskRecord[],
  session: Pick<AuthSession, "userId" | "activeRoleId" | "windowKeys" | "taskTypePermissions">,
  employee: EmployeeRecord | null,
  incidents: IncidentRecord[] = [],
  rosterShifts: RosterShiftRecord[] = [],
  shiftRequests: RosterShiftRequestRecord[] = []
): PersonalCalendarEvent[] {
  const taskEvents = personalTasksForSession(tasks, session)
    .map((task) => taskEvent(task, session))
    .filter((e): e is PersonalCalendarEvent => Boolean(e));

  const compliance = employee ? complianceEvents(employee) : [];
  const leave = employee ? leaveEvents(employee) : [];
  const shifts = employee ? rosterShiftEvents(rosterShifts, employee.id) : [];
  const requests = employee ? shiftRequestEvents(shiftRequests, rosterShifts, employee.id) : [];
  const incidentDeadlines = incidentDeadlineEvents(incidents, session);
  return sortCalendarEvents([
    ...taskEvents,
    ...shifts,
    ...requests,
    ...compliance,
    ...leave,
    ...incidentDeadlines,
  ]);
}

export function eventsByDate(events: PersonalCalendarEvent[]): Map<string, PersonalCalendarEvent[]> {
  return calendarEventsByDate(events);
}

export function eventKindLabel(kind: PersonalCalendarEventKind): string {
  switch (kind) {
    case "task-user":
      return "Assigned to you";
    case "task-role":
      return "Role task";
    case "roster-shift":
      return "Allocated shift";
    case "shift-request":
      return "Shift request";
    case "credential-expiry":
      return "Credential";
    case "leave-request":
      return "Leave";
    case "document-expiry":
      return "Document";
    case "visa-expiry":
      return "Visa";
    case "licence-expiry":
      return "Licence";
    case "incident-deadline":
      return "NDIS deadline";
    default:
      return "Event";
  }
}
