/** Keys on forms that were set by an AI prepare draft (for visual highlight). */

const META_KEYS = new Set([
  "prepareKind",
  "clientId",
  "clientName",
  "clientSearchKey",
  "fields",
  "primaryClientId",
  "primaryEmployeeId",
  "primaryLocationId",
  "clientName",
]);

export function draftHighlightKeys(
  payload: Record<string, unknown> | null | undefined,
  entityType: string
): Set<string> {
  if (!payload) return new Set();

  if (entityType === "client_patch") {
    const fields = (payload.fields ?? payload) as Record<string, unknown>;
    return new Set(
      Object.entries(fields)
        .filter(([key, value]) => !META_KEYS.has(key) && String(value ?? "").trim())
        .map(([key]) => key)
    );
  }

  if (entityType === "client_activity") {
    const keys: string[] = [];
    if (String(payload.subject ?? "").trim()) keys.push("subject");
    if (String(payload.description ?? payload.notes ?? "").trim()) keys.push("description");
    if (String(payload.activityType ?? "").trim()) keys.push("activityType");
    return new Set(keys);
  }

  if (entityType === "client" || entityType === "enquiry") {
    const keys = Object.entries(payload)
      .filter(([key, value]) => !META_KEYS.has(key) && String(value ?? "").trim())
      .map(([key]) => key);
    if (payload.firstName || payload.lastName) keys.push("name");
    return new Set(keys);
  }

  if (entityType === "task") {
    return new Set(
      Object.entries(payload)
        .filter(([key, value]) => !META_KEYS.has(key) && String(value ?? "").trim())
        .map(([key]) => key)
    );
  }

  if (entityType === "incident") {
    const keys: string[] = [];
    if (String(payload.title ?? "").trim()) keys.push("title");
    if (String(payload.description ?? "").trim()) keys.push("description");
    if (String(payload.severity ?? "").trim()) keys.push("severity");
    if (String(payload.category ?? "").trim()) keys.push("category");
    return new Set(keys);
  }

  return new Set(
    Object.entries(payload)
      .filter(([key, value]) => !META_KEYS.has(key) && String(value ?? "").trim())
      .map(([key]) => key)
  );
}

export function withDraftHighlight(baseClass: string, fieldKey: string, highlight: Set<string> | undefined): string {
  if (!highlight?.has(fieldKey)) return baseClass;
  return `${baseClass} border-sky-300 bg-sky-50 ring-2 ring-sky-200/80`;
}
