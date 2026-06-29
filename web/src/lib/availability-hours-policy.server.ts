import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseAvailabilityHoursPolicy,
  type AvailabilityHoursPolicy,
  type AvailabilityOverMaxApprovalStatus,
} from "@/lib/availability-hours-policy";
import { getSystemSettings, serviceClient } from "@/lib/session-audit/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function getAvailabilityHoursPolicy(): Promise<AvailabilityHoursPolicy> {
  const settings = await getSystemSettings();
  return parseAvailabilityHoursPolicy(settings);
}

export type AvailabilityOverMaxRequestRow = {
  id: string;
  employee_id: string;
  weekly_hours: number;
  max_weekly_hours: number;
  status: string;
  requested_at: string;
  requested_by_user_id: string | null;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null;
  review_notes: string | null;
};

export type AvailabilityOverMaxRequest = {
  id: string;
  employeeId: string;
  weeklyHours: number;
  maxWeeklyHours: number;
  status: AvailabilityOverMaxApprovalStatus;
  requestedAt: string;
  requestedByUserId: string;
  reviewedAt: string;
  reviewedByUserId: string;
  reviewNotes: string;
};

function fromRow(row: AvailabilityOverMaxRequestRow): AvailabilityOverMaxRequest {
  const status = String(row.status ?? "").trim().toLowerCase();
  const normalized: AvailabilityOverMaxApprovalStatus =
    status === "pending" || status === "approved" || status === "declined" ? status : "none";
  return {
    id: row.id,
    employeeId: row.employee_id,
    weeklyHours: Number(row.weekly_hours) || 0,
    maxWeeklyHours: Number(row.max_weekly_hours) || 0,
    status: normalized,
    requestedAt: row.requested_at ?? "",
    requestedByUserId: row.requested_by_user_id ?? "",
    reviewedAt: row.reviewed_at ?? "",
    reviewedByUserId: row.reviewed_by_user_id ?? "",
    reviewNotes: row.review_notes ?? "",
  };
}

export async function loadLatestOverMaxRequest(
  employeeId: string,
  client?: SupabaseClient
): Promise<AvailabilityOverMaxRequest | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = client ?? serviceClient();
  const { data, error } = await supabase
    .from("employee_availability_over_max_request")
    .select("*")
    .eq("employee_id", employeeId.trim())
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as AvailabilityOverMaxRequestRow) : null;
}

export async function loadLatestApprovedOverMaxRequest(
  employeeId: string,
  client?: SupabaseClient
): Promise<AvailabilityOverMaxRequest | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = client ?? serviceClient();
  const { data, error } = await supabase
    .from("employee_availability_over_max_request")
    .select("*")
    .eq("employee_id", employeeId.trim())
    .eq("status", "approved")
    .order("reviewed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as AvailabilityOverMaxRequestRow) : null;
}

export async function createOverMaxApprovalRequest(input: {
  employeeId: string;
  weeklyHours: number;
  maxWeeklyHours: number;
  requestedByUserId: string;
  client?: SupabaseClient;
}): Promise<AvailabilityOverMaxRequest> {
  if (!isSupabaseConfigured()) {
    return {
      id: `local-${Date.now()}`,
      employeeId: input.employeeId,
      weeklyHours: input.weeklyHours,
      maxWeeklyHours: input.maxWeeklyHours,
      status: "pending",
      requestedAt: new Date().toISOString(),
      requestedByUserId: input.requestedByUserId,
      reviewedAt: "",
      reviewedByUserId: "",
      reviewNotes: "",
    };
  }
  const supabase = input.client ?? serviceClient();
  const id = `avail-overmax-${Date.now()}`;
  const { data, error } = await supabase
    .from("employee_availability_over_max_request")
    .insert({
      id,
      employee_id: input.employeeId.trim(),
      weekly_hours: input.weeklyHours,
      max_weekly_hours: input.maxWeeklyHours,
      status: "pending",
      requested_at: new Date().toISOString(),
      requested_by_user_id: input.requestedByUserId.trim() || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return fromRow(data as AvailabilityOverMaxRequestRow);
}

export async function listPendingOverMaxRequests(client?: SupabaseClient): Promise<AvailabilityOverMaxRequest[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = client ?? serviceClient();
  const { data, error } = await supabase
    .from("employee_availability_over_max_request")
    .select("*")
    .eq("status", "pending")
    .order("requested_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => fromRow(row as AvailabilityOverMaxRequestRow));
}

export async function reviewOverMaxRequest(input: {
  requestId: string;
  decision: "approved" | "declined";
  reviewedByUserId: string;
  reviewNotes?: string;
  client?: SupabaseClient;
}): Promise<AvailabilityOverMaxRequest> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }
  const supabase = input.client ?? serviceClient();
  const { data, error } = await supabase
    .from("employee_availability_over_max_request")
    .update({
      status: input.decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by_user_id: input.reviewedByUserId.trim() || null,
      review_notes: input.reviewNotes?.trim() || null,
    })
    .eq("id", input.requestId.trim())
    .eq("status", "pending")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error("This request has already been reviewed or no longer exists.");
  }
  return fromRow(data as AvailabilityOverMaxRequestRow);
}

export async function loadAppRolesForSettings(): Promise<{ id: string; name: string }[]> {
  if (!isSupabaseConfigured()) {
    return [
      { id: "role-rostering-manager", name: "Rostering Manager" },
      { id: "role-coordinator", name: "Support Coordinator" },
      { id: "role-team-leader", name: "Team Leader" },
    ];
  }
  const { data, error } = await serviceClient()
    .from("app_role")
    .select("id, name")
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String((row as { id: string }).id),
    name: String((row as { name: string }).name),
  }));
}
