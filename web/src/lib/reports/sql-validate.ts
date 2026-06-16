const FORBIDDEN = /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|call|do|merge|execute)\b/i;

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
  return { ok: true, query: trimmed };
}
