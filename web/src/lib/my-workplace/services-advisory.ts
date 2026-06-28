/** AB-0030 — Services the employee can work at + high-demand advisory for My Workplace. */
import type { EmployeeRecord } from "@/lib/employee";
import { syncCredentialStatuses } from "@/lib/employee-compliance";
import type { LocationRecord } from "@/lib/location";
import { locationAddressLine } from "@/lib/location";
import { isVacantShift } from "@/lib/roster-gap-analysis";
import { addDaysIso, normalizeRosterShift, type RosterShiftRecord } from "@/lib/roster-shift";
import { checkSiteOrientation, type SiteOrientationRecord } from "@/lib/site-orientation";

export const HIGH_DEMAND_VACANT_SHIFT_THRESHOLD = 2;
export const HIGH_DEMAND_LOOKAHEAD_DAYS = 14;

const MANDATORY_CREDENTIAL_TYPES = ["Working with Children Check", "NDIS Worker Screening"] as const;

export type MyWorkplaceServiceSite = {
  locationId: string;
  name: string;
  locationType: string;
  addressLine: string;
  assignmentRole: string;
  highDemand: boolean;
  highDemandReason: "vacant_shifts" | "manual_flag" | "both" | null;
  vacantShiftCount: number;
};

export type MyWorkplaceServicesAdvisory = {
  sites: MyWorkplaceServiceSite[];
  highDemandCount: number;
  advisoryMessage: string | null;
};

function isDateInRange(iso: string, from: string, to: string): boolean {
  const day = iso.slice(0, 10);
  if (from?.trim() && day < from.slice(0, 10)) return false;
  if (to?.trim() && day > to.slice(0, 10)) return false;
  return true;
}

// A credential within its expiry window is still valid for working. syncCredentialStatuses
// downgrades soon-to-expire credentials to "Expiring soon" — those are not yet expired, so
// they should not hide an otherwise-qualified site.
const VALID_CREDENTIAL_STATUSES = new Set(["Current", "Expiring soon"]);

function mandatoryCredentialsCurrent(employee: EmployeeRecord): boolean {
  const credentials = syncCredentialStatuses(employee.credentials ?? []);
  return MANDATORY_CREDENTIAL_TYPES.every((type) => {
    const cred = credentials.find((row) => row.credentialType === type);
    return Boolean(cred && VALID_CREDENTIAL_STATUSES.has(cred.status));
  });
}

function vacantShiftCountByLocation(
  rosterShifts: RosterShiftRecord[],
  locationId: string,
  rangeStart: string,
  rangeEnd: string
): number {
  let count = 0;
  for (const shift of rosterShifts.map(normalizeRosterShift)) {
    if (shift.locationId !== locationId) continue;
    if (shift.shiftDate < rangeStart || shift.shiftDate > rangeEnd) continue;
    if (shift.status !== "Published" && shift.status !== "Draft") continue;
    if (!isVacantShift(shift)) continue;
    count += 1;
  }
  return count;
}

function resolveHighDemand(
  location: LocationRecord,
  vacantCount: number
): { highDemand: boolean; reason: MyWorkplaceServiceSite["highDemandReason"] } {
  const manual = Boolean(location.highDemandAdvisory);
  const vacant = vacantCount >= HIGH_DEMAND_VACANT_SHIFT_THRESHOLD;
  if (manual && vacant) return { highDemand: true, reason: "both" };
  if (manual) return { highDemand: true, reason: "manual_flag" };
  if (vacant) return { highDemand: true, reason: "vacant_shifts" };
  return { highDemand: false, reason: null };
}

export function buildMyWorkplaceServicesAdvisory(input: {
  employee: EmployeeRecord;
  locations: LocationRecord[];
  siteOrientations: SiteOrientationRecord[];
  rosterShifts: RosterShiftRecord[];
  today?: string;
}): MyWorkplaceServicesAdvisory {
  const today = (input.today ?? new Date().toISOString()).slice(0, 10);
  const rangeEnd = addDaysIso(today, HIGH_DEMAND_LOOKAHEAD_DAYS);
  const employeeId = input.employee.id.trim();

  if (!employeeId || !mandatoryCredentialsCurrent(input.employee)) {
    return { sites: [], highDemandCount: 0, advisoryMessage: null };
  }

  const sites: MyWorkplaceServiceSite[] = [];

  for (const location of input.locations) {
    if (location.status !== "Active") continue;
    const link = location.employeeLinks.find(
      (row) =>
        row.employeeId === employeeId &&
        isDateInRange(today, row.validFrom, row.validTo)
    );
    if (!link) continue;

    const orientation = checkSiteOrientation(
      input.siteOrientations,
      "employee",
      employeeId,
      location.id,
      today
    );
    if (!orientation.ok) continue;

    const vacantShiftCount = vacantShiftCountByLocation(
      input.rosterShifts,
      location.id,
      today,
      rangeEnd
    );
    const demand = resolveHighDemand(location, vacantShiftCount);

    sites.push({
      locationId: location.id,
      name: location.name,
      locationType: location.locationType,
      addressLine: locationAddressLine(location),
      assignmentRole: link.assignmentRole,
      highDemand: demand.highDemand,
      highDemandReason: demand.reason,
      vacantShiftCount,
    });
  }

  sites.sort((a, b) => {
    if (a.highDemand !== b.highDemand) return a.highDemand ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const highDemandCount = sites.filter((site) => site.highDemand).length;
  const advisoryMessage =
    highDemandCount > 0
      ? "Some of your services have high demand for shifts. Contact rostering to discuss extra opportunities — use Contact Rostering below."
      : null;

  return { sites, highDemandCount, advisoryMessage };
}
