import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRoleRecord, AppUserRecord, TaskTypePermission } from "@/lib/access/types";

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
  windowKeys: string[],
  processIds: string[],
  reportIds: string[],
  taskTypePermissions: TaskTypePermission[]
): AppRoleRecord {
  return {
    id: row.id,
    roleKey: row.role_key,
    name: row.name,
    description: row.description,
    active: row.active,
    windowKeys,
    processIds,
    reportIds,
    taskTypePermissions,
  };
}

const USER_COLUMNS =
  "id, username, email, first_name, last_name, phone, active, employee_bp_id, notes";

export async function fetchUsers(supabase: SupabaseClient): Promise<AppUserRecord[]> {
  const [usersRes, userRolesRes] = await Promise.all([
    supabase.from("app_user").select(USER_COLUMNS).order("username"),
    supabase.from("app_user_role").select("user_id, role_id"),
  ]);
  if (usersRes.error) throw usersRes.error;
  if (userRolesRes.error) throw userRolesRes.error;

  const rolesByUser = new Map<string, string[]>();
  for (const row of userRolesRes.data ?? []) {
    const list = rolesByUser.get(row.user_id) ?? [];
    list.push(row.role_id);
    rolesByUser.set(row.user_id, list);
  }

  return ((usersRes.data ?? []) as UserRow[]).map((row) =>
    userFromRow(row, rolesByUser.get(row.id) ?? [])
  );
}

export async function fetchRoles(supabase: SupabaseClient): Promise<AppRoleRecord[]> {
  const [rolesRes, windowsRes, processesRes, reportsRes, taskTypesRes] = await Promise.all([
    supabase.from("app_role").select("*").order("name"),
    supabase.from("app_role_window").select("role_id, window_key"),
    supabase.from("app_role_process").select("role_id, process_id"),
    supabase.from("app_role_report").select("role_id, report_id"),
    supabase.from("app_role_task_type").select("role_id, task_type_id, can_see, can_select, can_create"),
  ]);
  if (rolesRes.error) throw rolesRes.error;
  if (windowsRes.error) throw windowsRes.error;
  if (processesRes.error) throw processesRes.error;
  if (reportsRes.error && reportsRes.error.code !== "42P01") throw reportsRes.error;
  if (taskTypesRes.error && taskTypesRes.error.code !== "42P01") throw taskTypesRes.error;

  const windowsByRole = new Map<string, string[]>();
  for (const row of windowsRes.data ?? []) {
    const list = windowsByRole.get(row.role_id) ?? [];
    list.push(row.window_key);
    windowsByRole.set(row.role_id, list);
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

  return ((rolesRes.data ?? []) as RoleRow[]).map((row) =>
    roleFromRow(
      row,
      windowsByRole.get(row.id) ?? [],
      processesByRole.get(row.id) ?? [],
      reportsByRole.get(row.id) ?? [],
      taskTypesByRole.get(row.id) ?? []
    )
  );
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

  await supabase.from("app_user_role").delete().eq("user_id", user.id);
  if (user.roleIds.length) {
    const { error: linkError } = await supabase.from("app_user_role").insert(
      user.roleIds.map((role_id) => ({ user_id: user.id, role_id }))
    );
    if (linkError) throw linkError;
  }
}

export async function saveRole(supabase: SupabaseClient, role: AppRoleRecord) {
  const { error } = await supabase.from("app_role").upsert({
    id: role.id,
    role_key: role.roleKey,
    name: role.name,
    description: role.description,
    active: role.active,
  });
  if (error) throw error;

  await supabase.from("app_role_window").delete().eq("role_id", role.id);
  if (role.windowKeys.length) {
    const { error: wErr } = await supabase.from("app_role_window").insert(
      role.windowKeys.map((window_key) => ({ role_id: role.id, window_key }))
    );
    if (wErr) throw wErr;
  }

  await supabase.from("app_role_process").delete().eq("role_id", role.id);
  if (role.processIds.length) {
    const { error: pErr } = await supabase.from("app_role_process").insert(
      role.processIds.map((process_id) => ({ role_id: role.id, process_id }))
    );
    if (pErr) throw pErr;
  }

  await supabase.from("app_role_report").delete().eq("role_id", role.id);
  if (role.reportIds.length) {
    const { error: rErr } = await supabase.from("app_role_report").insert(
      role.reportIds.map((report_id) => ({ role_id: role.id, report_id }))
    );
    if (rErr && rErr.code !== "42P01") throw rErr;
  }

  await supabase.from("app_role_task_type").delete().eq("role_id", role.id);
  if (role.taskTypePermissions.length) {
    const { error: ttErr } = await supabase.from("app_role_task_type").insert(
      role.taskTypePermissions.map((p) => ({
        role_id: role.id,
        task_type_id: p.taskTypeId,
        can_see: p.canSee,
        can_select: p.canSelect,
        can_create: p.canCreate,
      }))
    );
    if (ttErr && ttErr.code !== "42P01") throw ttErr;
  }
}

export async function resolveRoleAccess(
  supabase: SupabaseClient,
  roleId: string
): Promise<{ windowKeys: string[]; processIds: string[]; reportIds: string[]; taskTypePermissions: TaskTypePermission[] }> {
  const [windowsRes, processesRes, reportsRes, taskTypesRes] = await Promise.all([
    supabase.from("app_role_window").select("window_key").eq("role_id", roleId),
    supabase.from("app_role_process").select("process_id").eq("role_id", roleId),
    supabase.from("app_role_report").select("report_id").eq("role_id", roleId),
    supabase.from("app_role_task_type").select("task_type_id, can_see, can_select, can_create").eq("role_id", roleId),
  ]);
  if (windowsRes.error) throw windowsRes.error;
  if (processesRes.error) throw processesRes.error;
  if (reportsRes.error && reportsRes.error.code !== "42P01") throw reportsRes.error;
  if (taskTypesRes.error && taskTypesRes.error.code !== "42P01") throw taskTypesRes.error;
  return {
    windowKeys: (windowsRes.data ?? []).map((r) => r.window_key),
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
