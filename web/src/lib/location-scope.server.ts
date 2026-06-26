import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { initialLocations as seedLocations, normalizeLocation, type LocationRecord } from "@/lib/location";
import {
  LOCATIONS_SEE_ALL_WINDOW,
  applyLocationScopeToView,
  computeLocationScope,
  filterIncidentsByLocationScope,
  isClientInLocationScope,
  type LocationScope,
} from "@/lib/location-list-access";
import type { IncidentRecord } from "@/lib/incident";
import { fetchSupportLocationsForScope } from "@/lib/supabase/data-api";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export { LOCATIONS_SEE_ALL_WINDOW };

export function sessionCanSeeAllLocations(session: AuthSession): boolean {
  return canAccessWindow(session.windowKeys, LOCATIONS_SEE_ALL_WINDOW);
}

export function buildLocationScopeForSession(session: AuthSession, locations: LocationRecord[]): LocationScope {
  return computeLocationScope(
    locations,
    session.employeeBpId ?? "",
    sessionCanSeeAllLocations(session),
    true
  );
}

export async function loadLocationsForAccessScope(supabase: SupabaseClient | null): Promise<LocationRecord[]> {
  if (supabase && isSupabaseConfigured()) {
    try {
      return await fetchSupportLocationsForScope(supabase);
    } catch {
      // fall through to seed
    }
  }
  return seedLocations.map(normalizeLocation);
}

export async function resolveLocationScopeForSession(
  supabase: SupabaseClient | null,
  session: AuthSession
): Promise<LocationScope> {
  const locations = await loadLocationsForAccessScope(supabase);
  return buildLocationScopeForSession(session, locations);
}

export async function clientAccessibleInSession(
  supabase: SupabaseClient | null,
  session: AuthSession,
  clientId: string
): Promise<boolean> {
  const id = clientId.trim();
  if (!id) return false;
  const scope = await resolveLocationScopeForSession(supabase, session);
  return isClientInLocationScope(id, scope);
}

export async function assertClientAccessibleInSession(
  supabase: SupabaseClient | null,
  session: AuthSession,
  clientId: string
): Promise<{ ok: true } | { ok: false; status: 403 | 404; error: string }> {
  if (!canAccessWindow(session.windowKeys, "clients")) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  const accessible = await clientAccessibleInSession(supabase, session, clientId);
  if (!accessible) {
    return { ok: false, status: 404, error: "Client not found." };
  }
  return { ok: true };
}

export function filterIncidentsForSessionLocationScope(
  incidents: IncidentRecord[],
  scope: LocationScope
): IncidentRecord[] {
  return filterIncidentsByLocationScope(incidents, scope.visibleClientIds);
}

export function filterClientLinkedView<T extends Parameters<typeof applyLocationScopeToView>[1]>(
  scope: LocationScope,
  data: T
): T {
  return applyLocationScopeToView(scope, data);
}

export function filterRowsByClientScope<T extends { id: string }>(
  rows: T[],
  scope: LocationScope
): T[] {
  if (!scope.enabled || scope.seeAll || !scope.visibleClientIds) return rows;
  return rows.filter((row) => scope.visibleClientIds!.has(row.id));
}

export async function timesheetIdsAccessibleInSession(
  supabase: SupabaseClient | null,
  session: AuthSession,
  timesheets: { id: string; clientId?: string; lines?: { clientId?: string }[] }[]
): Promise<Set<string> | null> {
  const scope = await resolveLocationScopeForSession(supabase, session);
  if (!scope.enabled || scope.seeAll || !scope.visibleClientIds) return null;
  const blocked = new Set<string>();
  for (const sheet of timesheets) {
    const topLevel = sheet.clientId?.trim();
    if (topLevel && !scope.visibleClientIds.has(topLevel)) {
      blocked.add(sheet.id);
      continue;
    }
    const lineClients = (sheet.lines ?? []).map((line) => line.clientId?.trim()).filter(Boolean) as string[];
    if (lineClients.some((clientId) => !scope.visibleClientIds!.has(clientId))) {
      blocked.add(sheet.id);
    }
  }
  return blocked;
}
