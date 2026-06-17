/** Usernames allowed to sign in to System setup (separate from workspace). */
export const SYSTEM_OPERATOR_USERNAMES = new Set(["SuperUser"]);

export function isSystemOperatorUsername(username: string): boolean {
  return SYSTEM_OPERATOR_USERNAMES.has(username.trim());
}
