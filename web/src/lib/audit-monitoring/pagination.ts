/** Cursor pagination for high-volume audit list queries (started_at + id descending). */

export type CursorPayload = {
  startedAt: string;
  id: string;
};

export function encodeAuditCursor(startedAt: string, id: string): string {
  return Buffer.from(`${startedAt}|${id}`, "utf8").toString("base64url");
}

export function decodeAuditCursor(cursor: string | null | undefined): CursorPayload | null {
  if (!cursor?.trim()) return null;
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const sep = raw.indexOf("|");
    if (sep <= 0) return null;
    const startedAt = raw.slice(0, sep);
    const id = raw.slice(sep + 1);
    if (!startedAt || !id) return null;
    return { startedAt, id };
  } catch {
    return null;
  }
}

export function defaultAuditDateFrom(days = 7): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

export function defaultAuditDateTo(): string {
  return new Date().toISOString();
}
