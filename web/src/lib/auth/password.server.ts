import bcrypt from "bcryptjs";

const BCRYPT_PREFIX = "$2";

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, stored: string): boolean {
  if (!stored?.trim()) return false;
  if (stored.startsWith(BCRYPT_PREFIX)) {
    return bcrypt.compareSync(plain, stored);
  }
  // Legacy plain-text (dev migration path)
  return stored === plain;
}

export function isPasswordHashed(stored: string): boolean {
  return stored.startsWith(BCRYPT_PREFIX);
}
