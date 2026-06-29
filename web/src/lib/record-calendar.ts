import { canAccessWindow } from "@/lib/access/catalog";
import type { ClientActivityRow } from "@/lib/client-line-tables";
import type { EmployeeActivityRow } from "@/lib/employee";
import type { FleetBookingRow } from "@/lib/fleet-vehicle";
import type { MaintenanceRequestRecord } from "@/lib/maintenance-request";
import {
  maintenanceCalendarDate,
  maintenanceSlaBreached,
  maintenanceSlaEscalated,
} from "@/lib/maintenance-compliance";
import { isOpenMaintenanceRequest } from "@/lib/maintenance-request";
import { overdueMaintenanceWithoutSchedule } from "@/lib/maintenance-queries";
import type { LocationActivityRow } from "@/lib/location";
import { addDaysIso, formatShiftTimeRange, weekStartFromDate, type RosterShiftRecord } from "@/lib/roster-shift";
import { normalizeRosterShift } from "@/lib/roster-shift";
import type { RosterOfCareLine, RosterOfCareRecord } from "@/lib/roster-of-care";
import type { TaskRecord } from "@/lib/task";
import { taskUrgency, type TaskUrgency } from "@/lib/task-hub";
import { fortnightDays, isoFromDate, monthGridDays, weekDays } from "@/lib/personal-calendar";

export type RecordCalendarViewMode = "fortnight" | "month" | "week" | "day";

export type RecordCalendarEntityKind = "client" | "employee" | "location" | "vehicle";

export type RecordCalendarEventKind = "task" | "shift-actual" | "shift-template" | "activity" | "booking" | "maintenance";

export type RecordCalendarEvent = {
  id: string;
  date: string;
  kind: RecordCalendarEventKind;
  title: string;
  subtitle?: string;
  /** When null the chip renders without a link (user lacks access). */
  href: string | null;
  urgency?: TaskUrgency;
};

export type RecordCalendarInput = {
  entityKind: RecordCalendarEntityKind;
  entityId: string;
  rangeStart: string;
  rangeEnd: string;
  windowKeys: string[];
  tasks: TaskRecord[];
  rosterShifts: RosterShiftRecord[];
  rosterOfCares: RosterOfCareRecord[];
  fleetBookings?: FleetBookingRow[];
  maintenanceRequests?: MaintenanceRequestRecord[];
  includeMaintenance?: boolean;
  activities: ClientActivityRow[] | EmployeeActivityRow[] | LocationActivityRow[];
  /** When false, RoC master template lines are omitted (live shifts only). */
  includeRocTemplates?: boolean;
};

function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function isDateInRocRange(date: string, validFrom: string, validTo: string): boolean {
  if (validFrom?.trim() && date < validFrom.slice(0, 10)) return false;
  if (validTo?.trim() && date > validTo.slice(0, 10)) return false;
  return true;
}

function taskEvents(input: RecordCalendarInput): RecordCalendarEvent[] {
  const canTasks = canAccessWindow(input.windowKeys, "tasks");
  const entityType =
    input.entityKind === "client"
      ? "client"
      : input.entityKind === "employee"
        ? "employee"
        : input.entityKind === "vehicle"
          ? "fleet-vehicle"
          : "location";

  return input.tasks
    .filter(
      (task) =>
        task.entityType === entityType &&
        task.entityId === input.entityId &&
        task.status !== "Cancelled" &&
        task.status !== "Completed" &&
        task.dueDate?.trim() &&
        inRange(task.dueDate.slice(0, 10), input.rangeStart, input.rangeEnd)
    )
    .map((task) => ({
      id: `task-${task.id}`,
      date: task.dueDate.slice(0, 10),
      kind: "task" as const,
      title: task.title,
      subtitle: task.documentNo,
      href: canTasks ? `/tasks/${task.id}` : null,
      urgency: taskUrgency(task),
    }));
}

function shiftMatchesClient(shift: RosterShiftRecord, clientId: string): boolean {
  if (shift.clientId === clientId) return true;
  return (shift.clientLines ?? []).some((line) => line.clientId === clientId);
}

function shiftMatchesEmployee(shift: RosterShiftRecord, employeeId: string): boolean {
  if (shift.employeeId === employeeId) return true;
  return (shift.workerLines ?? []).some((line) => line.employeeId === employeeId);
}

function actualShiftEvents(input: RecordCalendarInput): RecordCalendarEvent[] {
  const canRoster = canAccessWindow(input.windowKeys, "rostering");
  const events: RecordCalendarEvent[] = [];

  for (const raw of input.rosterShifts) {
    const shift = normalizeRosterShift(raw);
    if (shift.status === "Cancelled" || !shift.shiftDate?.trim()) continue;
    if (shift.status === "Completed") continue;
    if (!inRange(shift.shiftDate.slice(0, 10), input.rangeStart, input.rangeEnd)) continue;

    const matches =
      input.entityKind === "client"
        ? shiftMatchesClient(shift, input.entityId)
        : input.entityKind === "employee"
          ? shiftMatchesEmployee(shift, input.entityId)
          : input.entityKind === "vehicle"
            ? shift.vehicleId === input.entityId
            : shift.locationId === input.entityId;

    if (!matches) continue;

    const timeRange = formatShiftTimeRange(shift.startTime, shift.endTime);
    const published = shift.status === "Published";
    events.push({
      id: `shift-${shift.id}`,
      date: shift.shiftDate.slice(0, 10),
      kind: "shift-actual",
      title: published ? `Shift ${timeRange}` : `Draft shift ${timeRange}`,
      subtitle: [shift.shiftRef, shift.status].filter(Boolean).join(" · "),
      href: canRoster ? `/rostering?week=${weekStartFromDate(shift.shiftDate)}` : null,
      urgency: published ? "later" : "soon",
    });
  }

  return events;
}

function rocLineMatches(
  entityKind: RecordCalendarEntityKind,
  entityId: string,
  roc: RosterOfCareRecord,
  line: RosterOfCareLine
): boolean {
  if (entityKind === "client") return roc.clientId === entityId;
  if (entityKind === "employee") return line.defaultEmployeeId?.trim() === entityId;
  if (entityKind === "vehicle") return false;
  return line.locationId?.trim() === entityId;
}

function templateShiftEvents(input: RecordCalendarInput): RecordCalendarEvent[] {
  const canRoc =
    input.entityKind === "client"
      ? canAccessWindow(input.windowKeys, "client-roster-of-care")
      : canAccessWindow(input.windowKeys, "rostering");
  const events: RecordCalendarEvent[] = [];

  const rangeStart = input.rangeStart;
  const rangeEnd = input.rangeEnd;
  let weekStart = weekStartFromDate(rangeStart);
  const endWeek = weekStartFromDate(rangeEnd);

  while (weekStart <= endWeek) {
    for (const roc of input.rosterOfCares) {
      if (roc.status !== "Active") continue;
      for (const line of roc.lines) {
        if (!rocLineMatches(input.entityKind, input.entityId, roc, line)) continue;
        if (!line.locationId?.trim()) continue;

        const shiftDate = addDaysIso(weekStart, line.weekday);
        if (!inRange(shiftDate, rangeStart, rangeEnd)) continue;
        if (!isDateInRocRange(shiftDate, roc.validFrom, roc.validTo)) continue;

        const timeRange = formatShiftTimeRange(line.startTime, line.endTime);
        const href =
          input.entityKind === "client" && canRoc
            ? `/clients/${roc.clientId}?tab=Roster%20of%20care`
            : canRoc
              ? "/rostering?view=roc"
              : null;

        events.push({
          id: `roc-${roc.id}-${line.id}-${shiftDate}`,
          date: shiftDate,
          kind: "shift-template",
          title: `RoC ${timeRange}`,
          subtitle: roc.name,
          href,
          urgency: "later",
        });
      }
    }
    weekStart = addDaysIso(weekStart, 7);
  }

  return events;
}

function bookingTimeLabel(datetime: string | undefined): string {
  if (!datetime?.includes("T")) return "";
  return datetime.slice(11, 16);
}

function bookingMatchesEntity(
  entityKind: RecordCalendarEntityKind,
  entityId: string,
  booking: FleetBookingRow
): boolean {
  switch (entityKind) {
    case "vehicle":
      return booking.vehicleId === entityId;
    case "location":
      return booking.locationId === entityId;
    case "employee":
      return booking.employeeId === entityId;
    case "client":
      return booking.clientId === entityId;
    default:
      return false;
  }
}

function bookingEvents(input: RecordCalendarInput): RecordCalendarEvent[] {
  const bookings = input.fleetBookings ?? [];
  if (!bookings.length) return [];
  const canFleet = canAccessWindow(input.windowKeys, "fleet");
  const events: RecordCalendarEvent[] = [];

  for (const booking of bookings) {
    if (booking.status === "cancelled") continue;
    if (!booking.startDatetime?.trim()) continue;
    if (!bookingMatchesEntity(input.entityKind, input.entityId, booking)) continue;

    const startDate = booking.startDatetime.slice(0, 10);
    const endDate = (booking.endDatetime?.trim() ? booking.endDatetime : booking.startDatetime).slice(0, 10);
    const startTime = bookingTimeLabel(booking.startDatetime);
    const endTime = bookingTimeLabel(booking.endDatetime);
    const timeRange = startTime && endTime ? `${startTime}–${endTime}` : startTime;

    // A booking may span multiple days; surface a chip on each covered day that
    // falls inside the visible range.
    let day = startDate < input.rangeStart ? input.rangeStart : startDate;
    const lastDay = endDate > input.rangeEnd ? input.rangeEnd : endDate;
    while (day <= lastDay) {
      events.push({
        id: `booking-${booking.id}-${day}`,
        date: day,
        kind: "booking",
        title: timeRange ? `Booking ${timeRange}` : "Vehicle booking",
        subtitle: [booking.purpose, booking.status].filter(Boolean).join(" · ") || undefined,
        href: canFleet ? `/fleet/${booking.vehicleId}?tab=Bookings` : null,
        urgency: "later",
      });
      day = addDaysIso(day, 1);
    }
  }

  return events;
}

function maintenanceEvents(input: RecordCalendarInput): RecordCalendarEvent[] {
  if (input.includeMaintenance === false) return [];
  const rows = input.maintenanceRequests ?? [];
  if (!rows.length || input.entityKind !== "location") return [];
  const canMaintenance = canAccessWindow(input.windowKeys, "maintenance");
  const events: RecordCalendarEvent[] = [];

  for (const row of rows) {
    if (row.locationId !== input.entityId) continue;
    if (row.status === "cancelled") continue;
    const date = maintenanceCalendarDate(row);
    if (!date || !inRange(date, input.rangeStart, input.rangeEnd)) continue;
    const breached = maintenanceSlaBreached(row);
    const escalated = maintenanceSlaEscalated(row);
    events.push({
      id: `maintenance-${row.id}-${date}`,
      date,
      kind: "maintenance",
      title: row.title || row.documentNo,
      subtitle: [row.priority, row.status.replace(/_/g, " ")].filter(Boolean).join(" · "),
      href: canMaintenance ? `/maintenance/${row.id}` : null,
      urgency: breached || escalated ? "overdue" : row.priority === "urgent" || row.priority === "high" ? "soon" : "later",
    });
  }

  return events;
}

function activityEvents(input: RecordCalendarInput): RecordCalendarEvent[] {
  const tab = encodeURIComponent("Activity");
  const baseHref =
    input.entityKind === "client"
      ? `/clients/${input.entityId}?tab=${tab}`
      : input.entityKind === "employee"
        ? `/employees/${input.entityId}?tab=${tab}`
        : `/locations/${input.entityId}?tab=${tab}`;

  return input.activities
    .filter((row) => row.date?.trim() && inRange(row.date.slice(0, 10), input.rangeStart, input.rangeEnd))
    .map((row) => ({
      id: `activity-${row.id}`,
      date: row.date.slice(0, 10),
      kind: "activity" as const,
      title: row.subject?.trim() || row.activityType || "Activity",
      subtitle: row.activityType,
      href: baseHref,
      urgency: "later" as const,
    }));
}

/** Calendar events for a client, employee, or location record within a visible date range. */
export function recordCalendarEvents(input: RecordCalendarInput): RecordCalendarEvent[] {
  const events = [
    ...taskEvents(input),
    ...actualShiftEvents(input),
    ...(input.includeRocTemplates ? templateShiftEvents(input) : []),
    ...bookingEvents(input),
    ...maintenanceEvents(input),
    ...activityEvents(input),
  ];
  return events.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

export function recordCalendarEventsByDate(events: RecordCalendarEvent[]): Map<string, RecordCalendarEvent[]> {
  const map = new Map<string, RecordCalendarEvent[]>();
  for (const event of events) {
    const list = map.get(event.date) ?? [];
    list.push(event);
    map.set(event.date, list);
  }
  return map;
}

export function recordCalendarKindLabel(kind: RecordCalendarEventKind): string {
  switch (kind) {
    case "task":
      return "Task";
    case "shift-actual":
      return "Live shift";
    case "shift-template":
      return "RoC template";
    case "booking":
      return "Vehicle booking";
    case "maintenance":
      return "Maintenance";
    case "activity":
      return "Activity";
    default:
      return kind;
  }
}

export function recordCalendarRangeForView(
  view: RecordCalendarViewMode,
  anchor: Date
): { rangeStart: string; rangeEnd: string } {
  if (view === "fortnight") {
    const days = fortnightDays(anchor);
    return { rangeStart: isoFromDate(days[0]), rangeEnd: isoFromDate(days[days.length - 1]) };
  }
  if (view === "month") {
    const days = monthGridDays(anchor);
    return { rangeStart: isoFromDate(days[0]), rangeEnd: isoFromDate(days[days.length - 1]) };
  }
  if (view === "week") {
    const days = weekDays(anchor);
    return { rangeStart: isoFromDate(days[0]), rangeEnd: isoFromDate(days[days.length - 1]) };
  }
  const iso = isoFromDate(anchor);
  return { rangeStart: iso, rangeEnd: iso };
}
