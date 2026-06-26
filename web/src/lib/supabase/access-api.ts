import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRoleRecord, AppUserRecord, TaskTypePermission } from "@/lib/access/types";
import { ensureAdminRoleAccess, isAdminRole } from "@/lib/access/role-access-templates";
import { effectiveRoleIds, isSuperUser } from "@/lib/access/superuser";
import { INITIAL_TASK_TYPES } from "@/lib/task-type";
import {
  normalizeRoleWindowAccess,
  windowAccessFromKeys,
  windowKeysFromAccess,
  type WindowAccessMap,
} from "@/lib/access/window-access";

type UserRow = {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  active: boolean;
  employee_bp_id: string | null;
  notes: string;
};

type RoleRow = {
  id: string;
  role_key: string;
  name: string;
  description: string;
  active: boolean;
};

function userFromRow(row: UserRow, roleIds: string[]): AppUserRecord {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    active: row.active,
    employeeBpId: row.employee_bp_id ?? "",
    notes: row.notes,
    roleIds,
  };
}

function roleFromRow(
  row: RoleRow,
  windowAccess: WindowAccessMap,
  processIds: string[],
  reportIds: string[],
  taskTypePermissions: TaskTypePermission[]
): AppRoleRecord {
  return normalizeRoleWindowAccess({
    id: row.id,
    roleKey: row.role_key,
    name: row.name,
    description: row.description,
    active: row.active,
    windowKeys: windowKeysFromAccess(windowAccess),
    windowAccess,
    processIds,
    reportIds,
    taskTypePermissions,
  });
}

const USER_COLUMNS =
  "id, username, email, first_name, last_name, phone, active, employee_bp_id, notes";

export async function fetchUsers(supabase: SupabaseClient): Promise<AppUserRecord[]> {
  const [usersRes, userRolesRes, rolesRes] = await Promise.all([
    supabase.from("app_user").select(USER_COLUMNS).order("username"),
    supabase.from("app_user_role").select("user_id, role_id"),
    supabase.from("app_role").select("id").eq("active", true),
  ]);
  if (usersRes.error) throw usersRes.error;
  if (userRolesRes.error) throw userRolesRes.error;
  if (rolesRes.error) throw rolesRes.error;

  const allRoleIds = ((rolesRes.data ?? []) as { id: string }[]).map((row) => row.id);

  const rolesByUser = new Map<string, string[]>();
  for (const row of userRolesRes.data ?? []) {
    const list = rolesByUser.get(row.user_id) ?? [];
    list.push(row.role_id);
    rolesByUser.set(row.user_id, list);
  }

  return ((usersRes.data ?? []) as UserRow[]).map((row) => {
    const user = userFromRow(row, rolesByUser.get(row.id) ?? []);
    if (!isSuperUser(user)) return user;
    return { ...user, roleIds: effectiveRoleIds(user, allRoleIds) };
  });
}

export async function fetchRoles(supabase: SupabaseClient): Promise<AppRoleRecord[]> {
  const [rolesRes, windowsRes, processesRes, reportsRes, taskTypesRes] = await Promise.all([
    supabase.from("app_role").select("*").order("name"),
    supabase.from("app_role_window").select("role_id, window_key, access_level"),
    supabase.from("app_role_process").select("role_id, process_id"),
    supabase.from("app_role_report").select("role_id, report_id"),
    supabase.from("app_role_task_type").select("role_id, task_type_id, can_see, can_select, can_create"),
  ]);
  if (rolesRes.error) throw rolesRes.error;
  if (windowsRes.error) throw windowsRes.error;
  if (processesRes.error) throw processesRes.error;
  if (reportsRes.error && reportsRes.error.code !== "42P01") throw reportsRes.error;
  if (taskTypesRes.error && taskTypesRes.error.code !== "42P01") throw taskTypesRes.error;

  const windowsByRole = new Map<string, WindowAccessMap>();
  for (const row of windowsRes.data ?? []) {
    const map = windowsByRole.get(row.role_id) ?? {};
    const level = row.access_level === "read" ? "read" : "write";
    map[row.window_key] = level;
    windowsByRole.set(row.role_id, map);
  }

  const processesByRole = new Map<string, string[]>();
  for (const row of processesRes.data ?? []) {
    const list = processesByRole.get(row.role_id) ?? [];
    list.push(row.process_id);
    processesByRole.set(row.role_id, list);
  }

  const reportsByRole = new Map<string, string[]>();
  for (const row of reportsRes.data ?? []) {
    const list = reportsByRole.get(row.role_id) ?? [];
    list.push(row.report_id);
    reportsByRole.set(row.role_id, list);
  }

  const taskTypesByRole = new Map<string, TaskTypePermission[]>();
  for (const row of taskTypesRes.data ?? []) {
    const list = taskTypesByRole.get(row.role_id) ?? [];
    list.push({
      taskTypeId: row.task_type_id,
      canSee: row.can_see,
      canSelect: row.can_select,
      canCreate: row.can_create,
    });
    taskTypesByRole.set(row.role_id, list);
  }

  return ((rolesRes.data ?? []) as RoleRow[]).map((row) => {
    const role = roleFromRow(
      row,
      windowsByRole.get(row.id) ?? {},
      processesByRole.get(row.id) ?? [],
      reportsByRole.get(row.id) ?? [],
      taskTypesByRole.get(row.id) ?? []
    );
    if (isAdminRole(role)) {
      return ensureAdminRoleAccess(role, INITIAL_TASK_TYPES.map((t) => t.id));
    }
    return role;
  });
}

export async function saveUser(supabase: SupabaseClient, user: AppUserRecord, password?: string) {
  const row: Record<string, unknown> = {
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    phone: user.phone,
    active: user.active,
    employee_bp_id: user.employeeBpId?.trim() ? user.employeeBpId : null,
    notes: user.notes,
  };
  if (password?.trim()) {
    row.password = password;
  }

  const { error } = await supabase.from("app_user").upsert(row);
  if (error) throw error;

  let roleIds = user.roleIds;
  if (isSuperUser(user)) {
    const { data, error: rolesError } = await supabase.from("app_role").select("id").eq("active", true);
    if (rolesError) throw rolesError;
    roleIds = (data ?? []).map((r) => r.id);
  }

  await supabase.from("app_user_role").delete().eq("user_id", user.id);
  if (roleIds.length) {
    const { error: linkError } = await supabase.from("app_user_role").insert(
      roleIds.map((role_id) => ({ user_id: user.id, role_id }))
    );
    if (linkError) throw linkError;
  }
}

/**
 * PostgREST `in` value list for text keys. Keys are slugs ([a-z0-9-]) but we
 * still quote each value defensively so the filter parses correctly.
 */
function inList(values: string[]): string {
  return `(${values.map((v) => `"${v}"`).join(",")})`;
}

/**
 * Replace a role's child rows safely: write the desired rows FIRST (upsert), and
 * only then delete the rows that are no longer wanted. If a write fails it throws
 * before any delete runs, so a partial/failed save can never wipe existing grants.
 * (The old delete-then-insert order wiped all grants if any insert failed.)
 */
async function replaceRoleChildRows(
  supabase: SupabaseClient,
  table: string,
  roleId: string,
  keyColumn: string,
  rows: Record<string, unknown>[],
  options: { tolerateMissingTable?: boolean } = {}
) {
  if (rows.length) {
    const { error: writeErr } = await supabase.from(table).upsert(rows as never);
    if (writeErr && !(options.tolerateMissingTable && writeErr.code === "42P01")) throw writeErr;
  }

  let pruneQuery = supabase.from(table).delete().eq("role_id", roleId);
  const keepKeys = rows.map((row) => String(row[keyColumn]));
  if (keepKeys.length) {
    pruneQuery = pruneQuery.not(keyColumn, "in", inList(keepKeys));
  }
  const { error: pruneErr } = await pruneQuery;
  if (pruneErr && !(options.tolerateMissingTable && pruneErr.code === "42P01")) throw pruneErr;
}

export async function saveRole(supabase: SupabaseClient, role: AppRoleRecord) {
  let normalized = normalizeRoleWindowAccess(role);
  if (isAdminRole(normalized)) {
    normalized = ensureAdminRoleAccess(
      normalized,
      INITIAL_TASK_TYPES.map((t) => t.id)
    );
  }
  const { error } = await supabase.from("app_role").upsert({
    id: normalized.id,
    role_key: normalized.roleKey,
    name: normalized.name,
    description: normalized.description,
    active: normalized.active,
  });
  if (error) throw error;

  await replaceRoleChildRows(
    supabase,
    "app_role_window",
    normalized.id,
    "window_key",
    Object.entries(normalized.windowAccess).map(([window_key, access_level]) => ({
      role_id: normalized.id,
      window_key,
      access_level,
    }))
  );

  await replaceRoleChildRows(
    supabase,
    "app_role_process",
    normalized.id,
    "process_id",
    normalized.processIds.map((process_id) => ({ role_id: normalized.id, process_id }))
  );

  await replaceRoleChildRows(
    supabase,
    "app_role_report",
    normalized.id,
    "report_id",
    normalized.reportIds.map((report_id) => ({ role_id: normalized.id, report_id })),
    { tolerateMissingTable: true }
  );

  await replaceRoleChildRows(
    supabase,
    "app_role_task_type",
    normalized.id,
    "task_type_id",
    normalized.taskTypePermissions.map((p) => ({
      role_id: normalized.id,
      task_type_id: p.taskTypeId,
      can_see: p.canSee,
      can_select: p.canSelect,
      can_create: p.canCreate,
    })),
    { tolerateMissingTable: true }
  );
}

export async function resolveRoleAccess(
  supabase: SupabaseClient,
  roleId: string
): Promise<{
  windowKeys: string[];
  windowAccess: WindowAccessMap;
  processIds: string[];
  reportIds: string[];
  taskTypePermissions: TaskTypePermission[];
}> {
  const [windowsRes, processesRes, reportsRes, taskTypesRes] = await Promise.all([
    supabase.from("app_role_window").select("window_key, access_level").eq("role_id", roleId),
    supabase.from("app_role_process").select("process_id").eq("role_id", roleId),
    supabase.from("app_role_report").select("report_id").eq("role_id", roleId),
    supabase.from("app_role_task_type").select("task_type_id, can_see, can_select, can_create").eq("role_id", roleId),
  ]);
  if (windowsRes.error) throw windowsRes.error;
  if (processesRes.error) throw processesRes.error;
  if (reportsRes.error && reportsRes.error.code !== "42P01") throw reportsRes.error;
  if (taskTypesRes.error && taskTypesRes.error.code !== "42P01") throw taskTypesRes.error;
  const windowAccess: WindowAccessMap = {};
  for (const row of windowsRes.data ?? []) {
    windowAccess[row.window_key] = row.access_level === "read" ? "read" : "write";
  }
  const normalized = normalizeRoleWindowAccess({
    id: roleId,
    roleKey: "",
    name: "",
    description: "",
    active: true,
    windowKeys: windowKeysFromAccess(windowAccess),
    windowAccess,
    processIds: [],
    reportIds: [],
    taskTypePermissions: [],
  });
  return {
    windowKeys: normalized.windowKeys,
    windowAccess: normalized.windowAccess,
    processIds: (processesRes.data ?? []).map((r) => r.process_id),
    reportIds: (reportsRes.data ?? []).map((r) => r.report_id),
    taskTypePermissions: (taskTypesRes.data ?? []).map((r) => ({
      taskTypeId: r.task_type_id,
      canSee: r.can_see,
      canSelect: r.can_select,
      canCreate: r.can_create,
    })),
  };
}
