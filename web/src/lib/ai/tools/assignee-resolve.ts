import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRoleRecord, AppUserRecord } from "@/lib/access/types";
import { displayName } from "@/lib/access/types";
import { SEED_ROLES, SEED_USERS } from "@/lib/access/seed";
import { fetchRoles, fetchUsers } from "@/lib/supabase/access-api";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export async function loadAssigneeDirectory(
  supabase: SupabaseClient | null
): Promise<{ users: AppUserRecord[]; roles: AppRoleRecord[] }> {
  if (supabase) {
    try {
      const [users, roles] = await Promise.all([fetchUsers(supabase), fetchRoles(supabase)]);
      if (users.length) return { users, roles };
    } catch {
      // fall through
    }
  }
  return { users: SEED_USERS, roles: SEED_ROLES };
}

export function resolveUserId(users: AppUserRecord[], hint: string): string {
  const q = normalize(hint);
  if (!q) return "";
  const exact = users.find((u) => normalize(u.username) === q || normalize(u.id) === q);
  if (exact) return exact.id;
  const byName = users.find((u) => normalize(displayName(u)) === q);
  if (byName) return byName.id;
  const partial = users.find((u) => {
    const blob = [u.username, displayName(u), u.firstName, u.lastName].map(normalize).join(" ");
    return blob.includes(q);
  });
  return partial?.id ?? "";
}

export function resolveRoleId(roles: AppRoleRecord[], hint: string): string {
  let q = normalize(hint).replace(/\s+role$/, "").trim();
  if (!q) return "";

  if (q === "admin" || q === "superuser" || q === "abilityapp admin") {
    const admin =
      roles.find((r) => r.id === "role-admin") ??
      roles.find((r) => normalize(r.roleKey).includes("admin"));
    if (admin) return admin.id;
  }

  const exact = roles.find(
    (r) => normalize(r.id) === q || normalize(r.roleKey) === q || normalize(r.name) === q
  );
  if (exact) return exact.id;
  const partial = roles.find((r) => {
    const blob = [r.name, r.roleKey, r.id].map(normalize).join(" ");
    return blob.includes(q);
  });
  return partial?.id ?? "";
}

export function assigneeLabel(
  users: AppUserRecord[],
  roles: AppRoleRecord[],
  assignmentType: "user" | "role",
  userId: string,
  roleId: string
): string {
  if (assignmentType === "user") {
    const user = users.find((u) => u.id === userId);
    return user ? displayName(user) : userId;
  }
  const role = roles.find((r) => r.id === roleId);
  return role?.name ?? roleId;
}
