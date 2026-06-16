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

export type CalendarViewMode = "month" | "week" | "day";

export type PersonalCalendarEventKind =
  | "task-user"
  | "task-role"
  | "leave-request"
  | "credential-expiry"
  | "document-expiry"
  | "visa-expiry"
  | "licence-expiry";

export type PersonalCalendarEvent = {
  id: string;
  date: string;
  kind: PersonalCalendarEventKind;
  title: string;
  subtitle?: string;
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

export function personalCalendarEvents(
  tasks: TaskRecord[],
  session: Pick<AuthSession, "userId" | "activeRoleId" | "windowKeys" | "taskTypePermissions">,
  employee: EmployeeRecord | null
): PersonalCalendarEvent[] {
  const taskEvents = personalTasksForSession(tasks, session)
    .map((task) => taskEvent(task, session))
    .filter((e): e is PersonalCalendarEvent => Boolean(e));

  const compliance = employee ? complianceEvents(employee) : [];

  const leave = employee ? leaveEvents(employee) : [];
  return [...taskEvents, ...compliance, ...leave].sort(
    (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)
  );
}

export function eventsByDate(events: PersonalCalendarEvent[]): Map<string, PersonalCalendarEvent[]> {
  const map = new Map<string, PersonalCalendarEvent[]>();
  for (const event of events) {
    const list = map.get(event.date) ?? [];
    list.push(event);
    map.set(event.date, list);
  }
  return map;
}

export function eventKindLabel(kind: PersonalCalendarEventKind): string {
  switch (kind) {
    case "task-user":
      return "Assigned to you";
    case "task-role":
      return "Role task";
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
    default:
      return "Event";
  }
}
