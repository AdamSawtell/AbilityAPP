import { addDaysIso, formatShiftTimeRange, normalizeRosterShift, weekStartFromDate, type RosterShiftRecord } from "@/lib/roster-shift";
import { ROC_WEEKDAY_LABELS, type RosterOfCareRecord } from "@/lib/roster-of-care";

export type FortnightReviewIssueType =
  | "missing-actual"
  | "extra-actual"
  | "vacant"
  | "worker-changed"
  | "draft";

export type FortnightReviewIssue = {
  id: string;
  type: FortnightReviewIssueType;
  date: string;
  title: string;
  detail: string;
  rosterShiftId?: string;
  clientId?: string;
  locationId?: string;
};

export type FortnightReviewSummary = {
  rangeStart: string;
  rangeEnd: string;
  templateCount: number;
  actualCount: number;
  matchedCount: number;
  issues: FortnightReviewIssue[];
};

type TemplateOccurrence = {
  id: string;
  rocId: string;
  rocName: string;
  clientId: string;
  date: string;
  startTime: string;
  endTime: string;
  locationId: string;
  defaultEmployeeId: string;
  sessionKey: string;
};

function fortnightRange(anchorWeekStart: string): { start: string; end: string } {
  const start = weekStartFromDate(anchorWeekStart);
  return { start, end: addDaysIso(start, 13) };
}

function clientMatchesShift(shift: RosterShiftRecord, clientId: string): boolean {
  if (shift.clientId === clientId) return true;
  return (shift.clientLines ?? []).some((line) => line.clientId === clientId);
}

function workerMatchesShift(shift: RosterShiftRecord, employeeId: string): boolean {
  if (!employeeId.trim()) return true;
  if (shift.employeeId === employeeId) return true;
  return (shift.workerLines ?? []).some((line) => line.employeeId === employeeId);
}

function shiftMatchesTemplate(shift: RosterShiftRecord, template: TemplateOccurrence): boolean {
  return (
    shift.shiftDate === template.date &&
    shift.locationId === template.locationId &&
    shift.startTime.slice(0, 5) === template.startTime.slice(0, 5) &&
    shift.endTime.slice(0, 5) === template.endTime.slice(0, 5) &&
    clientMatchesShift(shift, template.clientId)
  );
}

function buildTemplateOccurrences(rocs: RosterOfCareRecord[], rangeStart: string, rangeEnd: string): TemplateOccurrence[] {
  const occurrences: TemplateOccurrence[] = [];
  for (let weekStart = rangeStart; weekStart <= rangeEnd; weekStart = addDaysIso(weekStart, 7)) {
    for (const roc of rocs) {
      if (roc.status !== "Active") continue;
      for (const line of roc.lines) {
        if (!line.locationId?.trim()) continue;
        const date = addDaysIso(weekStart, line.weekday);
        if (date < rangeStart || date > rangeEnd) continue;
        if (roc.validFrom?.trim() && date < roc.validFrom.slice(0, 10)) continue;
        if (roc.validTo?.trim() && date > roc.validTo.slice(0, 10)) continue;
        occurrences.push({
          id: `${roc.id}-${line.id}-${date}`,
          rocId: roc.id,
          rocName: roc.name,
          clientId: roc.clientId,
          date,
          startTime: line.startTime,
          endTime: line.endTime,
          locationId: line.locationId,
          defaultEmployeeId: line.defaultEmployeeId,
          sessionKey: line.sessionKey,
        });
      }
    }
  }
  return occurrences;
}

export function buildFortnightRosterReview(
  rocs: RosterOfCareRecord[],
  shifts: RosterShiftRecord[],
  anchorWeekStart: string
): FortnightReviewSummary {
  const { start, end } = fortnightRange(anchorWeekStart);
  const templates = buildTemplateOccurrences(rocs, start, end);
  const actuals = shifts
    .map(normalizeRosterShift)
    .filter((shift) => shift.status !== "Cancelled" && shift.shiftDate >= start && shift.shiftDate <= end);

  const matchedShiftIds = new Set<string>();
  const issues: FortnightReviewIssue[] = [];
  let matchedCount = 0;

  for (const template of templates) {
    const match = actuals.find((shift) => shiftMatchesTemplate(shift, template));
    const dayLabel = ROC_WEEKDAY_LABELS[new Date(`${template.date}T12:00:00`).getDay() === 0 ? 6 : new Date(`${template.date}T12:00:00`).getDay() - 1] ?? "Day";
    const time = formatShiftTimeRange(template.startTime, template.endTime);
    if (!match) {
      issues.push({
        id: `missing-${template.id}`,
        type: "missing-actual",
        date: template.date,
        title: `Missing ${time}`,
        detail: `${template.rocName} (${dayLabel}) has no live shift at this time/location.`,
        clientId: template.clientId,
        locationId: template.locationId,
      });
      continue;
    }
    matchedCount += 1;
    matchedShiftIds.add(match.id);
    if (match.status === "Draft") {
      issues.push({
        id: `draft-${template.id}`,
        type: "draft",
        date: template.date,
        title: `Draft ${time}`,
        detail: `${template.rocName} is rolled over but not published.`,
        rosterShiftId: match.id,
        clientId: template.clientId,
        locationId: template.locationId,
      });
    }
    if (!(match.workerLines ?? []).some((line) => line.employeeId.trim()) && !match.employeeId?.trim()) {
      issues.push({
        id: `vacant-${template.id}`,
        type: "vacant",
        date: template.date,
        title: `Vacant ${time}`,
        detail: `${template.rocName} has no assigned worker on the live shift.`,
        rosterShiftId: match.id,
        clientId: template.clientId,
        locationId: template.locationId,
      });
    }
    if (template.defaultEmployeeId && !workerMatchesShift(match, template.defaultEmployeeId)) {
      issues.push({
        id: `worker-${template.id}`,
        type: "worker-changed",
        date: template.date,
        title: `Worker changed ${time}`,
        detail: `${template.rocName} template worker differs from the live roster assignment.`,
        rosterShiftId: match.id,
        clientId: template.clientId,
        locationId: template.locationId,
      });
    }
  }

  for (const shift of actuals) {
    if (matchedShiftIds.has(shift.id)) continue;
    issues.push({
      id: `extra-${shift.id}`,
      type: "extra-actual",
      date: shift.shiftDate,
      title: `Extra ${formatShiftTimeRange(shift.startTime, shift.endTime)}`,
      detail: shift.shiftRef || "Live shift has no matching active RoC template line in this fortnight.",
      rosterShiftId: shift.id,
      clientId: shift.clientId,
      locationId: shift.locationId,
    });
  }

  return {
    rangeStart: start,
    rangeEnd: end,
    templateCount: templates.length,
    actualCount: actuals.length,
    matchedCount,
    issues: issues.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)),
  };
}
