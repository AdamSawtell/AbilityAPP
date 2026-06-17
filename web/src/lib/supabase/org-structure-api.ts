import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeOrgPosition,
  normalizePositionAssignment,
  type OrgPositionRecord,
  type PositionAssignmentRecord,
} from "@/lib/org-structure";

type OrgPositionRow = {
  id: string;
  title: string;
  department: string;
  parent_position_id: string | null;
  sort_order: number;
  status: string;
  site: string;
  cost_centre: string;
  primary_employee_id: string | null;
};

type PositionAssignmentRow = {
  id: string;
  position_id: string;
  employee_id: string;
  assignment_type: string;
  effective_from: string | null;
  effective_to: string | null;
  notes: string;
};

function positionFromRow(row: OrgPositionRow): OrgPositionRecord {
  return normalizeOrgPosition({
    id: row.id,
    title: row.title,
    department: row.department ?? "",
    parentPositionId: row.parent_position_id ?? "",
    sortOrder: row.sort_order ?? 0,
    status: row.status as OrgPositionRecord["status"],
    site: row.site ?? "",
    costCentre: row.cost_centre ?? "",
    primaryEmployeeId: row.primary_employee_id ?? "",
  });
}

function positionToRow(record: OrgPositionRecord): OrgPositionRow {
  const n = normalizeOrgPosition(record);
  return {
    id: n.id,
    title: n.title,
    department: n.department,
    parent_position_id: n.parentPositionId || null,
    sort_order: n.sortOrder,
    status: n.status,
    site: n.site,
    cost_centre: n.costCentre,
    primary_employee_id: n.primaryEmployeeId || null,
  };
}

function assignmentFromRow(row: PositionAssignmentRow): PositionAssignmentRecord {
  return normalizePositionAssignment({
    id: row.id,
    positionId: row.position_id,
    employeeId: row.employee_id,
    assignmentType: row.assignment_type as PositionAssignmentRecord["assignmentType"],
    effectiveFrom: row.effective_from ?? "",
    effectiveTo: row.effective_to ?? "",
    notes: row.notes ?? "",
  });
}

function assignmentToRow(record: PositionAssignmentRecord): PositionAssignmentRow {
  const n = normalizePositionAssignment(record);
  return {
    id: n.id,
    position_id: n.positionId,
    employee_id: n.employeeId,
    assignment_type: n.assignmentType,
    effective_from: n.effectiveFrom || null,
    effective_to: n.effectiveTo || null,
    notes: n.notes,
  };
}

export type OrgStructureData = {
  positions: OrgPositionRecord[];
  assignments: PositionAssignmentRecord[];
};

export async function fetchOrgStructure(supabase: SupabaseClient): Promise<OrgStructureData> {
  const [positionsRes, assignmentsRes] = await Promise.all([
    supabase.from("org_position").select("*").order("sort_order"),
    supabase.from("position_assignment").select("*").order("effective_from"),
  ]);
  if (positionsRes.error) throw positionsRes.error;
  if (assignmentsRes.error) throw assignmentsRes.error;
  return {
    positions: (positionsRes.data ?? []).map((r) => positionFromRow(r as OrgPositionRow)),
    assignments: (assignmentsRes.data ?? []).map((r) => assignmentFromRow(r as PositionAssignmentRow)),
  };
}

export async function saveOrgPosition(supabase: SupabaseClient, record: OrgPositionRecord) {
  const { error } = await supabase.from("org_position").upsert(positionToRow(record));
  if (error) throw error;
}

export async function deleteOrgPosition(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("org_position").delete().eq("id", id);
  if (error) throw error;
}

export async function savePositionAssignment(supabase: SupabaseClient, record: PositionAssignmentRecord) {
  const { error } = await supabase.from("position_assignment").upsert(assignmentToRow(record));
  if (error) throw error;
}

export async function deletePositionAssignment(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("position_assignment").delete().eq("id", id);
  if (error) throw error;
}
