import { localDateIso } from "@/lib/booking-cancellation";
import { initialClients, normalizeClient, type ClientRecord } from "@/lib/client";
import {
  formatPlanBudgetCurrency,
  planBudgetUtilisationPct,
  summarizePlanBudgets,
} from "@/lib/client-plan-budget";
import { initialEmployees } from "@/lib/employee";
import { initialLocations } from "@/lib/location";
import type { PortalSession } from "@/lib/portal/session.server";
import type { PortalBudgetView, PortalClientSummary, PortalServiceItem } from "@/lib/portal/types";
import { initialRosterShifts, normalizeRosterShift } from "@/lib/roster-shift";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  clientFromRow,
  planBudgetFromRow,
  rosterShiftFromRow,
  type ClientPlanBudgetRowDb,
  type ClientRow,
  type RosterShiftRow,
} from "@/lib/supabase/mappers";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function loadClientFromDb(clientId: string): Promise<ClientRecord | null> {
  if (!isSupabaseConfigured()) {
    return initialClients.find((c) => c.id === clientId) ?? null;
  }
  const supabase = serviceClient();
  const { data: row } = await supabase.from("client").select("*").eq("id", clientId).maybeSingle();
  if (!row) return null;

  const { data: budgetRows } = await supabase
    .from("client_plan_budget")
    .select("*")
    .eq("client_id", clientId)
    .order("line_no");
  return normalizeClient({
    ...clientFromRow(
      row as ClientRow,
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      []
    ),
    planBudgets: (budgetRows ?? []).map((b) => planBudgetFromRow(b as ClientPlanBudgetRowDb)),
  });
}

export async function findPortalClientByEmail(email: string): Promise<PortalClientSummary | null> {
  const target = normalizeEmail(email);
  if (!target) return null;

  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { data: rows } = await supabase.from("client").select("id, name, preferred_name, email, plan_review_due_date");
    const matches = (rows ?? []).filter((r) => normalizeEmail(String(r.email ?? "")) === target);
    if (matches.length !== 1) return null;
    const match = matches[0]!;
    return {
      id: match.id,
      name: match.name,
      preferredName: match.preferred_name ?? "",
      email: match.email,
      planReviewDueDate: match.plan_review_due_date ?? "",
    };
  }

  const localMatches = initialClients.filter((c) => normalizeEmail(c.email) === target);
  if (localMatches.length !== 1) return null;
  const local = localMatches[0]!;
  return {
    id: local.id,
    name: local.name,
    preferredName: local.preferredName,
    email: local.email,
    planReviewDueDate: local.planReviewDueDate,
  };
}

export async function loadPortalClientSummary(clientId: string): Promise<PortalClientSummary | null> {
  const client = await loadClientFromDb(clientId);
  if (!client) return null;
  return {
    id: client.id,
    name: client.name,
    preferredName: client.preferredName,
    email: client.email,
    planReviewDueDate: client.planReviewDueDate,
  };
}

export function requirePortalSession(session: PortalSession | null): PortalSession | null {
  if (!session?.clientId?.trim()) return null;
  return session;
}

function emailsMatch(storedEmail: string, sessionEmail: string): boolean {
  return normalizeEmail(storedEmail) === normalizeEmail(sessionEmail);
}

/** Re-validates portal cookie against current client email on every API call. */
export async function resolveValidPortalSession(
  session: PortalSession | null
): Promise<PortalSession | null> {
  const base = requirePortalSession(session);
  if (!base) return null;

  const client = await loadPortalClientSummary(base.clientId);
  if (!client || !client.email.trim()) return null;
  if (!emailsMatch(client.email, base.email)) return null;

  return {
    clientId: client.id,
    email: normalizeEmail(client.email),
    displayName: client.preferredName || client.name,
  };
}

function employeeName(employeeId: string, employees: Map<string, string>): string {
  return employees.get(employeeId) ?? "Support worker";
}

function locationName(locationId: string, locations: Map<string, string>): string {
  return locations.get(locationId) ?? "Service location";
}

export async function loadPortalServices(clientId: string): Promise<PortalServiceItem[]> {
  const today = localDateIso();
  const horizon = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 56);
    return localDateIso(d);
  })();

  if (isSupabaseConfigured()) {
    const supabase = serviceClient();
    const { data: shiftRows } = await supabase
      .from("roster_shift")
      .select("*")
      .eq("client_id", clientId)
      .gte("shift_date", today)
      .lte("shift_date", horizon)
      .neq("status", "Cancelled")
      .neq("status", "Draft")
      .order("shift_date")
      .order("start_time");

    const employeeIds = [...new Set((shiftRows ?? []).map((r) => r.employee_id).filter(Boolean))];
    const locationIds = [...new Set((shiftRows ?? []).map((r) => r.location_id).filter(Boolean))];

    const employees = new Map<string, string>();
    if (employeeIds.length) {
      const { data: empRows } = await supabase.from("employee").select("id, first_name, last_name, preferred_name").in("id", employeeIds);
      for (const row of empRows ?? []) {
        const label = [row.preferred_name || row.first_name, row.last_name].filter(Boolean).join(" ").trim();
        employees.set(row.id, label || row.id);
      }
    }

    const locations = new Map<string, string>();
    if (locationIds.length) {
      const { data: locRows } = await supabase.from("location").select("id, name").in("id", locationIds);
      for (const row of locRows ?? []) {
        locations.set(row.id, row.name || row.id);
      }
    }

    return (shiftRows ?? []).map((row) => {
      const shift = normalizeRosterShift(rosterShiftFromRow(row as RosterShiftRow));
      return {
        id: shift.id,
        shiftDate: shift.shiftDate,
        startTime: shift.startTime,
        endTime: shift.endTime,
        shiftType: shift.shiftType,
        status: shift.status,
        workerName: employeeName(shift.employeeId, employees),
        locationName: locationName(shift.locationId, locations),
      };
    });
  }

  const employees = new Map(initialEmployees.map((e) => [e.id, e.name]));
  const locations = new Map(initialLocations.map((l) => [l.id, l.name]));

  return initialRosterShifts
    .filter(
      (s) =>
        s.clientId === clientId &&
        s.status !== "Cancelled" &&
        s.status !== "Draft" &&
        s.shiftDate >= today &&
        s.shiftDate <= horizon
    )
    .map((s) => {
      const shift = normalizeRosterShift(s);
      return {
        id: shift.id,
        shiftDate: shift.shiftDate,
        startTime: shift.startTime,
        endTime: shift.endTime,
        shiftType: shift.shiftType,
        status: shift.status,
        workerName: employeeName(shift.employeeId, employees),
        locationName: locationName(shift.locationId, locations),
      };
    })
    .sort((a, b) => `${a.shiftDate}${a.startTime}`.localeCompare(`${b.shiftDate}${b.startTime}`));
}

export async function loadPortalBudget(clientId: string): Promise<PortalBudgetView | null> {
  const client = await loadClientFromDb(clientId);
  if (!client) return null;

  const rows = client.planBudgets ?? [];
  if (!rows.length) {
    return {
      overall: { allocated: 0, claimed: 0, remaining: 0 },
      lines: [],
      utilisationPct: null,
    };
  }

  const { overall } = summarizePlanBudgets(rows);
  return {
    overall,
    lines: rows.map((row) => ({
      supportBudget: row.supportBudget,
      supportCategory: row.supportCategory,
      allocated: Number(row.allocatedAmount) || 0,
      claimed: Number(row.claimedAmount) || 0,
      remaining: Math.max(0, (Number(row.allocatedAmount) || 0) - (Number(row.claimedAmount) || 0)),
    })),
    utilisationPct: planBudgetUtilisationPct(overall),
  };
}

export { formatPlanBudgetCurrency };
