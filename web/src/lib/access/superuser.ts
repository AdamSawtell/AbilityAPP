import type { AppUserRecord } from "@/lib/access/types";

/**
 * Workspace login that always receives every active role for switching and testing.
 * Keyed on the seeded user id (not the mutable username) so renaming another account
 * to "SuperUser" cannot escalate it to full access.
 */
export const SUPERUSER_USER_ID = "user-superuser";
export const SUPERUSER_USERNAME = "SuperUser";

export function isSuperUser(user: Pick<AppUserRecord, "id"> | string): boolean {
  const id = typeof user === "string" ? user : user.id;
  return id === SUPERUSER_USER_ID;
}

/** SuperUser may switch to any active role — including roles added after the last seed. */
export function effectiveRoleIds(
  user: Pick<AppUserRecord, "id" | "roleIds">,
  allRoleIds: string[]
): string[] {
  if (!isSuperUser(user)) return user.roleIds;
  return [...allRoleIds];
}

export function userHasRole(
  user: Pick<AppUserRecord, "id" | "roleIds">,
  roleId: string,
  allRoleIds: string[]
): boolean {
  return effectiveRoleIds(user, allRoleIds).includes(roleId);
}
