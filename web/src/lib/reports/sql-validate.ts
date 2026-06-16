const FORBIDDEN = /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|call|do|merge|execute)\b/i;

/** Tables/columns that must not be queried via Reports Advance. */
const SENSITIVE_PATTERNS = [
  /\bapp_user\b/i,
  /\bpassword\b/i,
  /\bpg_catalog\b/i,
  /\binformation_schema\b/i,
  /\bauth\./i,
  /\bstorage\./i,
  /\bvault\./i,
  /\bextensions\./i,
];

export function validateReadonlySql(sql: string): { ok: true; query: string } | { ok: false; error: string } {
  const trimmed = sql.trim().replace(/;+\s*$/, "");
  if (!trimmed) {
    return { ok: false, error: "Enter a SQL query." };
  }
  if (trimmed.includes(";")) {
    return { ok: false, error: "Only one statement is allowed (no semicolons)." };
  }
  const lower = trimmed.toLowerCase();
  if (!lower.startsWith("select") && !lower.startsWith("with")) {
    return { ok: false, error: "Only SELECT queries are allowed (WITH … SELECT is OK)." };
  }
  if (FORBIDDEN.test(trimmed)) {
    return { ok: false, error: "Query contains forbidden keywords." };
  }
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { ok: false, error: "Query references restricted system or credential data." };
    }
  }
  return { ok: true, query: trimmed };
}
