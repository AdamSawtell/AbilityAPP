/** System policy for My availability hours vs contracted minimum and org maximum. */
import type { EmployeeAvailabilityRow, EmployeeRecord } from "@/lib/employee";
import {
  defaultContractedHoursForEmployee,
  normalizeContractedHoursPeriod,
  type ContractedHoursPeriod,
} from "@/lib/contracted-hours";

export const AVAILABILITY_MAX_HOURS_KEY = "availability_max_hours_per_period";
export const AVAILABILITY_MAX_PERIOD_KEY = "availability_max_hours_period";
export const AVAILABILITY_OVER_MAX_APPROVAL_ROLE_KEY = "availability_over_max_approval_role_id";
export const AVAILABILITY_OVERNIGHT_HOURS_MODE_KEY = "availability_overnight_hours_mode";

// 80h/fortnight (40h/week) matches the standard full-week default availability
// template (Mon–Fri 09:00–17:00) so a first-time save sits at the cap, not above it.
export const DEFAULT_AVAILABILITY_MAX_HOURS = 80;
export const DEFAULT_AVAILABILITY_MAX_PERIOD: ContractedHoursPeriod = "fortnight";
export const DEFAULT_AVAILABILITY_OVER_MAX_APPROVAL_ROLE_ID = "role-rostering-manager";

export type OvernightHoursMode = "include" | "exclude" | "ask";

export type AvailabilityHoursPolicy = {
  maxHoursPerPeriod: number;
  maxHoursPeriod: ContractedHoursPeriod;
  overMaxApprovalRoleId: string;
  overnightHoursMode: OvernightHoursMode;
};

export type AvailabilityOverMaxApprovalStatus = "none" | "pending" | "approved" | "declined";

export type AvailabilityHoursSummary = {
  weeklyHours: number;
  minWeeklyHours: number;
  maxWeeklyHours: number;
  contractedHoursPerPeriod: number;
  contractedPeriod: ContractedHoursPeriod;
  maxHoursPerPeriod: number;
  maxPeriod: ContractedHoursPeriod;
  meetsMinimum: boolean;
  exceedsMaximum: boolean;
  overnightRowCount: number;
  overnightHoursIncluded: boolean;
  approvalRequired: boolean;
  approvalStatus: AvailabilityOverMaxApprovalStatus;
  messages: string[];
};

export type AvailabilitySaveOptions = {
  includeOvernightHours?: boolean;
  requestOverMaxApproval?: boolean;
};

const OVERNIGHT_MODES: OvernightHoursMode[] = ["include", "exclude", "ask"];

export function parseOvernightHoursMode(value: string | undefined | null): OvernightHoursMode {
  const v = String(value ?? "").trim().toLowerCase();
  return OVERNIGHT_MODES.includes(v as OvernightHoursMode) ? (v as OvernightHoursMode) : "include";
}

export function parseAvailabilityMaxHours(value: string | undefined | null): number {
  const parsed = Number.parseFloat(String(value ?? "").trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_AVAILABILITY_MAX_HOURS;
  return Math.min(Math.round(parsed * 100) / 100, 168 * 4);
}

export function normalizeAvailabilityMaxHours(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_AVAILABILITY_MAX_HOURS;
  return Math.min(Math.round(value * 100) / 100, 168 * 4);
}

export function parseAvailabilityHoursPolicy(
  settings: Record<string, string | undefined>
): AvailabilityHoursPolicy {
  return {
    maxHoursPerPeriod: parseAvailabilityMaxHours(settings[AVAILABILITY_MAX_HOURS_KEY]),
    maxHoursPeriod: normalizeContractedHoursPeriod(settings[AVAILABILITY_MAX_PERIOD_KEY]),
    overMaxApprovalRoleId:
      String(settings[AVAILABILITY_OVER_MAX_APPROVAL_ROLE_KEY] ?? "").trim() ||
      DEFAULT_AVAILABILITY_OVER_MAX_APPROVAL_ROLE_ID,
    overnightHoursMode: parseOvernightHoursMode(settings[AVAILABILITY_OVERNIGHT_HOURS_MODE_KEY]),
  };
}

/** Convert a pay-period hours figure to an equivalent weekly average. */
export function periodHoursToWeekly(hours: number, period: ContractedHoursPeriod): number {
  if (hours <= 0) return 0;
  if (period === "week") return hours;
  if (period === "fortnight") return Math.round((hours / 2) * 100) / 100;
  return Math.round(hours * (12 / 52) * 100) / 100;
}

function parseTimeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(time ?? "").trim());
  if (!match) return null;
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function rowIsUnavailable(row: EmployeeAvailabilityRow): boolean {
  return String(row.availability ?? "").trim().toLowerCase() === "unavailable";
}

function rowIsOvernight(row: EmployeeAvailabilityRow): boolean {
  const start = parseTimeToMinutes(row.startTime);
  const end = parseTimeToMinutes(row.endTime);
  if (start == null || end == null) return false;
  return end <= start;
}

/** Hours contributed by one availability row toward the weekly total. */
export function availabilityRowHours(
  row: EmployeeAvailabilityRow,
  policy: Pick<AvailabilityHoursPolicy, "overnightHoursMode">,
  options: Pick<AvailabilitySaveOptions, "includeOvernightHours"> = {}
): number {
  if (rowIsUnavailable(row)) return 0;
  const start = parseTimeToMinutes(row.startTime);
  const end = parseTimeToMinutes(row.endTime);
  if (start == null || end == null) return 0;

  const overnight = end <= start;
  if (overnight && policy.overnightHoursMode === "exclude") return 0;
  if (overnight && policy.overnightHoursMode === "ask" && options.includeOvernightHours === false) return 0;

  const durationMinutes = overnight ? 24 * 60 - start + end : end - start;
  return Math.round((durationMinutes / 60) * 100) / 100;
}

export function weeklyHoursFromAvailabilityRows(
  rows: EmployeeAvailabilityRow[],
  policy: Pick<AvailabilityHoursPolicy, "overnightHoursMode">,
  options: Pick<AvailabilitySaveOptions, "includeOvernightHours"> = {}
): { weeklyHours: number; overnightRowCount: number } {
  let weeklyHours = 0;
  let overnightRowCount = 0;
  for (const row of rows) {
    if (rowIsOvernight(row) && !rowIsUnavailable(row)) overnightRowCount += 1;
    weeklyHours += availabilityRowHours(row, policy, options);
  }
  return { weeklyHours: Math.round(weeklyHours * 100) / 100, overnightRowCount };
}

export function minWeeklyHoursForEmployee(employee: EmployeeRecord): {
  minWeeklyHours: number;
  contractedHoursPerPeriod: number;
  contractedPeriod: ContractedHoursPeriod;
} {
  const contractedPeriod = normalizeContractedHoursPeriod(employee.contractedHoursPeriod);
  const contractedHoursPerPeriod = defaultContractedHoursForEmployee(employee);
  const minWeeklyHours = periodHoursToWeekly(contractedHoursPerPeriod, contractedPeriod);
  return { minWeeklyHours, contractedHoursPerPeriod, contractedPeriod };
}

export function maxWeeklyHoursFromPolicy(policy: AvailabilityHoursPolicy): number {
  return periodHoursToWeekly(policy.maxHoursPerPeriod, policy.maxHoursPeriod);
}

export function evaluateAvailabilityHours(input: {
  employee: EmployeeRecord;
  rows: EmployeeAvailabilityRow[];
  policy: AvailabilityHoursPolicy;
  options?: AvailabilitySaveOptions;
  approvalStatus?: AvailabilityOverMaxApprovalStatus;
  approvedWeeklyHours?: number;
}): AvailabilityHoursSummary {
  const options = input.options ?? {};
  const { weeklyHours, overnightRowCount } = weeklyHoursFromAvailabilityRows(
    input.rows,
    input.policy,
    options
  );
  const { minWeeklyHours, contractedHoursPerPeriod, contractedPeriod } = minWeeklyHoursForEmployee(
    input.employee
  );
  const maxWeeklyHours = maxWeeklyHoursFromPolicy(input.policy);
  const meetsMinimum = minWeeklyHours <= 0 || weeklyHours + 0.001 >= minWeeklyHours;
  const exceedsMaximum = maxWeeklyHours > 0 && weeklyHours - 0.001 > maxWeeklyHours;
  const approvalStatus = input.approvalStatus ?? "none";

  const overnightHoursIncluded =
    input.policy.overnightHoursMode === "include" ||
    (input.policy.overnightHoursMode === "ask" && options.includeOvernightHours !== false) ||
    overnightRowCount === 0;

  // A prior approval covers the current pattern when the approved ceiling is at
  // least the current weekly hours — regardless of any newer pending/declined row.
  const coveredByApproval = (input.approvedWeeklyHours ?? 0) + 0.001 >= weeklyHours;
  let approvalRequired = false;
  if (exceedsMaximum) {
    if (coveredByApproval) {
      approvalRequired = false;
    } else if (approvalStatus === "pending" && options.requestOverMaxApproval) {
      approvalRequired = false;
    } else {
      approvalRequired = true;
    }
  }

  // Status only describes the over-max state; clear it once the pattern is within the cap.
  const effectiveApprovalStatus: AvailabilityOverMaxApprovalStatus = exceedsMaximum
    ? approvalStatus
    : "none";

  const messages: string[] = [];
  if (minWeeklyHours > 0) {
    messages.push(
      meetsMinimum
        ? `Weekly availability (${weeklyHours}h) meets your contracted minimum (${minWeeklyHours}h/week from ${contractedHoursPerPeriod}h ${contractedPeriod}).`
        : `Weekly availability (${weeklyHours}h) is below your contracted minimum (${minWeeklyHours}h/week from ${contractedHoursPerPeriod}h ${contractedPeriod}). Add hours or mark days unavailable only where you cannot work.`
    );
  }
  if (maxWeeklyHours > 0) {
    if (exceedsMaximum) {
      messages.push(
        approvalRequired
          ? `Weekly availability (${weeklyHours}h) exceeds the organisation maximum (${maxWeeklyHours}h/week from ${input.policy.maxHoursPerPeriod}h ${input.policy.maxHoursPeriod}). Manager approval is required.`
          : `Weekly availability (${weeklyHours}h) is above the organisation maximum (${maxWeeklyHours}h/week) — approved or pending review.`
      );
    } else {
      messages.push(
        `Within organisation maximum (${maxWeeklyHours}h/week from ${input.policy.maxHoursPerPeriod}h ${input.policy.maxHoursPeriod}).`
      );
    }
  }
  if (overnightRowCount > 0 && input.policy.overnightHoursMode === "exclude") {
    messages.push(`${overnightRowCount} overnight span(s) excluded from the hours total.`);
  }
  if (overnightRowCount > 0 && input.policy.overnightHoursMode === "ask" && options.includeOvernightHours === false) {
    messages.push(`${overnightRowCount} overnight span(s) excluded from this save.`);
  }

  return {
    weeklyHours,
    minWeeklyHours,
    maxWeeklyHours,
    contractedHoursPerPeriod,
    contractedPeriod,
    maxHoursPerPeriod: input.policy.maxHoursPerPeriod,
    maxPeriod: input.policy.maxHoursPeriod,
    meetsMinimum,
    exceedsMaximum,
    overnightRowCount,
    overnightHoursIncluded,
    approvalRequired,
    approvalStatus: effectiveApprovalStatus,
    messages,
  };
}

export class AvailabilityHoursValidationError extends Error {
  code: "BELOW_MINIMUM" | "OVER_MAX_REQUIRES_APPROVAL" | "OVERNIGHT_CONFIRM_REQUIRED";
  summary: AvailabilityHoursSummary;

  constructor(
    code: AvailabilityHoursValidationError["code"],
    message: string,
    summary: AvailabilityHoursSummary
  ) {
    super(message);
    this.name = "AvailabilityHoursValidationError";
    this.code = code;
    this.summary = summary;
  }
}

export function assertAvailabilitySaveAllowed(input: {
  employee: EmployeeRecord;
  rows: EmployeeAvailabilityRow[];
  policy: AvailabilityHoursPolicy;
  options?: AvailabilitySaveOptions;
  approvalStatus?: AvailabilityOverMaxApprovalStatus;
  approvedWeeklyHours?: number;
}): AvailabilityHoursSummary {
  const options = input.options ?? {};
  const summary = evaluateAvailabilityHours({ ...input, options });

  if (input.policy.overnightHoursMode === "ask" && summary.overnightRowCount > 0 && options.includeOvernightHours == null) {
    throw new AvailabilityHoursValidationError(
      "OVERNIGHT_CONFIRM_REQUIRED",
      "Confirm whether overnight hours should count toward your weekly total.",
      summary
    );
  }

  if (!summary.meetsMinimum) {
    throw new AvailabilityHoursValidationError(
      "BELOW_MINIMUM",
      `Availability must meet or exceed your contracted minimum (${summary.minWeeklyHours} hours per week).`,
      summary
    );
  }

  if (summary.approvalRequired && !options.requestOverMaxApproval) {
    throw new AvailabilityHoursValidationError(
      "OVER_MAX_REQUIRES_APPROVAL",
      `Availability exceeds the organisation maximum (${summary.maxWeeklyHours} hours per week). Submit for manager approval to continue.`,
      summary
    );
  }

  return summary;
}

export const AVAILABILITY_HOURS_POLICY_FIELDS = {
  maxHoursPerPeriod: {
    label: "Maximum hours per period",
    hint: "Organisation cap for weekly availability. Staff above this need manager approval.",
  },
  maxHoursPeriod: {
    label: "Maximum hours period",
    hint: "Pay period the maximum applies to (week, fortnight, or month).",
  },
  overMaxApprovalRoleId: {
    label: "Over-maximum approval role",
    hint: "Role that reviews availability above the maximum (e.g. Rostering Manager).",
  },
  overnightHoursMode: {
    label: "Overnight hours in availability total",
    hint: "When a day spans midnight (e.g. 22:00–06:00), include those hours, exclude them, or ask the worker each save.",
  },
} as const;
