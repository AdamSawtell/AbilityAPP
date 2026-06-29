import type { IncidentRecord } from "@/lib/incident";
import type { ClientRecord } from "@/lib/client";
import type { LocationRecord } from "@/lib/location";

export const LOCATIONS_SEE_ALL_WINDOW = "locations-see-all";

export function canSeeAllLocations(canWindow: (key: string) => boolean): boolean {
  return canWindow(LOCATIONS_SEE_ALL_WINDOW);
}

/** Location ids where the employee appears in location.employeeLinks. */
export function assignedLocationIdsForEmployee(
  employeeId: string,
  locations: LocationRecord[]
): Set<string> {
  const id = employeeId.trim();
  if (!id) return new Set();
  const ids = new Set<string>();
  for (const location of locations) {
    if (location.employeeLinks.some((link) => link.employeeId === id)) {
      ids.add(location.id);
    }
  }
  return ids;
}

/** Client ids linked to the given location ids via location.clientLinks. */
export function clientIdsInLocations(locationIds: Set<string>, locations: LocationRecord[]): Set<string> {
  const ids = new Set<string>();
  for (const location of locations) {
    if (!locationIds.has(location.id)) continue;
    for (const link of location.clientLinks) {
      const clientId = link.clientId?.trim();
      if (clientId) ids.add(clientId);
    }
  }
  return ids;
}

/** null = unrestricted (see all). */
export function visibleLocationIdSet(
  locations: LocationRecord[],
  employeeId: string,
  seeAll: boolean
): Set<string> | null {
  if (seeAll) return null;
  return assignedLocationIdsForEmployee(employeeId, locations);
}

/** null = unrestricted (see all). */
export function visibleClientIdSet(
  locations: LocationRecord[],
  employeeId: string,
  seeAll: boolean
): Set<string> | null {
  if (seeAll) return null;
  const locationIds = assignedLocationIdsForEmployee(employeeId, locations);
  return clientIdsInLocations(locationIds, locations);
}

export function filterClientsByLocationScope(
  clients: ClientRecord[],
  visibleIds: Set<string> | null
): ClientRecord[] {
  if (!visibleIds) return clients;
  return clients.filter((client) => visibleIds.has(client.id));
}

export function filterLocationsByLocationScope(
  locations: LocationRecord[],
  visibleIds: Set<string> | null
): LocationRecord[] {
  if (!visibleIds) return locations;
  return locations.filter((location) => visibleIds.has(location.id));
}

export function canViewClientByLocationScope(clientId: string, visibleIds: Set<string> | null): boolean {
  if (!visibleIds) return true;
  return visibleIds.has(clientId);
}

export function canViewLocationByLocationScope(locationId: string, visibleIds: Set<string> | null): boolean {
  if (!visibleIds) return true;
  return visibleIds.has(locationId);
}

export function filterByClientIdField<T>(
  records: T[],
  visibleClientIds: Set<string> | null,
  getClientId: (row: T) => string | undefined | null
): T[] {
  if (!visibleClientIds) return records;
  return records.filter((row) => {
    const clientId = getClientId(row)?.trim();
    if (!clientId) return true;
    return visibleClientIds.has(clientId);
  });
}

export function filterByLocationIdField<T>(
  records: T[],
  visibleLocationIds: Set<string> | null,
  getLocationId: (row: T) => string | undefined | null
): T[] {
  if (!visibleLocationIds) return records;
  return records.filter((row) => {
    const locationId = getLocationId(row)?.trim();
    if (!locationId) return true;
    return visibleLocationIds.has(locationId);
  });
}

export function incidentLinkedClientIds(record: IncidentRecord): string[] {
  const ids = new Set<string>();
  const primary = record.primaryClientId?.trim();
  if (primary) ids.add(primary);
  for (const party of record.parties) {
    if (party.partyType !== "Client") continue;
    const clientId = party.entityId?.trim();
    if (clientId) ids.add(clientId);
  }
  return [...ids];
}

/** Hide client-linked incidents when the client is outside location scope. */
export function filterIncidentsByLocationScope(
  records: IncidentRecord[],
  visibleClientIds: Set<string> | null
): IncidentRecord[] {
  if (!visibleClientIds) return records;
  return records.filter((record) => {
    const clientIds = incidentLinkedClientIds(record);
    if (!clientIds.length) return true;
    return clientIds.some((clientId) => visibleClientIds.has(clientId));
  });
}

export function filterTasksByLocationScope<T extends { entityType: string; entityId: string }>(
  records: T[],
  visibleClientIds: Set<string> | null
): T[] {
  if (!visibleClientIds) return records;
  return records.filter((task) => {
    if (task.entityType !== "client") return true;
    const clientId = task.entityId?.trim();
    if (!clientId) return true;
    return visibleClientIds.has(clientId);
  });
}

export function filterTimesheetsByLocationScope<
  T extends { clientId?: string; lines?: { clientId?: string }[] },
>(records: T[], visibleClientIds: Set<string> | null): T[] {
  if (!visibleClientIds) return records;
  return records.filter((sheet) => {
    const topLevel = sheet.clientId?.trim();
    if (topLevel && !visibleClientIds.has(topLevel)) return false;
    const lineClients = (sheet.lines ?? []).map((line) => line.clientId?.trim()).filter(Boolean) as string[];
    return lineClients.every((clientId) => visibleClientIds.has(clientId));
  });
}

export function filterRosterShiftsByLocationScope<
  T extends { clientId?: string; locationId?: string },
>(records: T[], visibleClientIds: Set<string> | null, visibleLocationIds: Set<string> | null): T[] {
  return records.filter((shift) => {
    const clientId = shift.clientId?.trim();
    if (clientId && visibleClientIds && !visibleClientIds.has(clientId)) return false;
    const locationId = shift.locationId?.trim();
    if (locationId && visibleLocationIds && !visibleLocationIds.has(locationId)) return false;
    return true;
  });
}

export type LocationScope = {
  enabled: boolean;
  seeAll: boolean;
  visibleLocationIds: Set<string> | null;
  visibleClientIds: Set<string> | null;
};

export function computeLocationScope(
  locations: LocationRecord[],
  employeeId: string,
  seeAll: boolean,
  enabled: boolean
): LocationScope {
  if (!enabled || seeAll) {
    return { enabled, seeAll, visibleLocationIds: null, visibleClientIds: null };
  }
  const visibleLocationIds = assignedLocationIdsForEmployee(employeeId, locations);
  const visibleClientIds = clientIdsInLocations(visibleLocationIds, locations);
  return { enabled, seeAll, visibleLocationIds, visibleClientIds };
}

export function isClientInLocationScope(clientId: string, scope: LocationScope): boolean {
  if (!scope.enabled || scope.seeAll || !scope.visibleClientIds) return true;
  return scope.visibleClientIds.has(clientId);
}

export function isLocationInLocationScope(locationId: string, scope: LocationScope): boolean {
  if (!scope.enabled || scope.seeAll || !scope.visibleLocationIds) return true;
  return scope.visibleLocationIds.has(locationId);
}

/** Mirrors roster shift filtering — a shift is in scope when its client and location are visible. */
export function isRosterShiftInLocationScope(
  shift: { clientId?: string; locationId?: string },
  scope: LocationScope
): boolean {
  if (!scope.enabled || scope.seeAll) return true;
  const clientId = shift.clientId?.trim();
  if (clientId && scope.visibleClientIds && !scope.visibleClientIds.has(clientId)) return false;
  const locationId = shift.locationId?.trim();
  if (locationId && scope.visibleLocationIds && !scope.visibleLocationIds.has(locationId)) return false;
  return true;
}

export type LocationScopedViewCollections = {
  locations: LocationRecord[];
  clients: ClientRecord[];
  incidents: IncidentRecord[];
  contracts: { clientId: string }[];
  serviceAgreements: { clientId: string }[];
  serviceBookings: { clientId: string }[];
  supportPlans: { clientId: string }[];
  planDocuments: { clientId: string }[];
  rosterOfCares: { clientId: string }[];
  monthlyServicePlans: { clientId: string }[];
  timesheets: { clientId?: string; lines?: { clientId?: string }[] }[];
  rosterShifts: { clientId?: string; locationId?: string }[];
  claims: { clientId: string }[];
  invoices: { clientId: string }[];
  tasks: { entityType: string; entityId: string }[];
  maintenanceRequests: { locationId: string }[];
};

export function applyLocationScopeToView<T extends LocationScopedViewCollections>(
  scope: LocationScope,
  data: T
): T {
  if (!scope.enabled || scope.seeAll) return data;
  const { visibleClientIds, visibleLocationIds } = scope;
  return {
    ...data,
    locations: filterLocationsByLocationScope(data.locations, visibleLocationIds),
    clients: filterClientsByLocationScope(data.clients, visibleClientIds),
    incidents: filterIncidentsByLocationScope(data.incidents, visibleClientIds),
    contracts: filterByClientIdField(data.contracts, visibleClientIds, (row) => row.clientId),
    serviceAgreements: filterByClientIdField(data.serviceAgreements, visibleClientIds, (row) => row.clientId),
    serviceBookings: filterByClientIdField(data.serviceBookings, visibleClientIds, (row) => row.clientId),
    supportPlans: filterByClientIdField(data.supportPlans, visibleClientIds, (row) => row.clientId),
    planDocuments: filterByClientIdField(data.planDocuments, visibleClientIds, (row) => row.clientId),
    rosterOfCares: filterByClientIdField(data.rosterOfCares, visibleClientIds, (row) => row.clientId),
    monthlyServicePlans: filterByClientIdField(data.monthlyServicePlans, visibleClientIds, (row) => row.clientId),
    timesheets: filterTimesheetsByLocationScope(data.timesheets, visibleClientIds),
    rosterShifts: filterRosterShiftsByLocationScope(data.rosterShifts, visibleClientIds, visibleLocationIds),
    claims: filterByClientIdField(data.claims, visibleClientIds, (row) => row.clientId),
    invoices: filterByClientIdField(data.invoices, visibleClientIds, (row) => row.clientId),
    tasks: filterTasksByLocationScope(data.tasks, visibleClientIds),
    maintenanceRequests: filterByLocationIdField(
      data.maintenanceRequests,
      visibleLocationIds,
      (row) => row.locationId
    ),
  };
}
