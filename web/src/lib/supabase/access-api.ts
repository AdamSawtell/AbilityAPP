import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRoleRecord, AppUserRecord } from "@/lib/access/types";

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

function roleFromRow(row: RoleRow, windowKeys: string[], processIds: string[]): AppRoleRecord {
  return {
    id: row.id,
    roleKey: row.role_key,
    name: row.name,
    description: row.description,
    active: row.active,
    windowKeys,
    processIds,
  };
}

export async function fetchUsers(supabase: SupabaseClient): Promise<AppUserRecord[]> {
  const [usersRes, userRolesRes] = await Promise.all([
    supabase.from("app_user").select("*").order("username"),
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
  const [rolesRes, windowsRes, processesRes] = await Promise.all([
    supabase.from("app_role").select("*").order("name"),
    supabase.from("app_role_window").select("role_id, window_key"),
    supabase.from("app_role_process").select("role_id, process_id"),
  ]);
  if (rolesRes.error) throw rolesRes.error;
  if (windowsRes.error) throw windowsRes.error;
  if (processesRes.error) throw processesRes.error;

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

  return ((rolesRes.data ?? []) as RoleRow[]).map((row) =>
    roleFromRow(row, windowsByRole.get(row.id) ?? [], processesByRole.get(row.id) ?? [])
  );
}

export async function saveUser(supabase: SupabaseClient, user: AppUserRecord) {
  const { error } = await supabase.from("app_user").upsert({
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    phone: user.phone,
    active: user.active,
    employee_bp_id: user.employeeBpId?.trim() ? user.employeeBpId : null,
    notes: user.notes,
  });
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
}

export async function resolveRoleAccess(
  supabase: SupabaseClient,
  roleId: string
): Promise<{ windowKeys: string[]; processIds: string[] }> {
  const [windowsRes, processesRes] = await Promise.all([
    supabase.from("app_role_window").select("window_key").eq("role_id", roleId),
    supabase.from("app_role_process").select("process_id").eq("role_id", roleId),
  ]);
  if (windowsRes.error) throw windowsRes.error;
  if (processesRes.error) throw processesRes.error;
  return {
    windowKeys: (windowsRes.data ?? []).map((r) => r.window_key),
    processIds: (processesRes.data ?? []).map((r) => r.process_id),
  };
}
