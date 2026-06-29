/**
 * Login accepts either the stored username (JasonBrown) or the same name with
 * spaces (Jason Brown). SSO will replace password login later; until then this
 * keeps sign-in forgiving for staff who think in full names.
 */
export function normalizeLoginUsername(input: string): string {
  return input.trim().replace(/\s+/g, "");
}

export function loginUsernameMatches(input: string, storedUsername: string): boolean {
  return normalizeLoginUsername(input) === normalizeLoginUsername(storedUsername);
}
