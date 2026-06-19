import type { ChatDisplayAttachment } from "@/lib/ai/types";

export type ActivityCoachClient = {
  id: string;
  name: string;
  searchKey: string;
};

const ACTIVITY_INTENT_RE =
  /\b(activity note|visit note|progress note|activity update|log (?:an? )?activity|create\b[\s\S]{0,48}\bactivity|write\b[\s\S]{0,32}\bactivity|home visit|meal prep|write (?:an? )?note|add (?:an? )?note)\b/i;

export function clientNameFromActivityMessage(text: string): string | null {
  const trimmed = text.trim();
  const patterns = [
    /\bfor\s+([A-Za-z][A-Za-z'\s-]{1,60}?)(?:\s*[.?!]|$)/i,
    /\bactivity(?:\s+note)?\s+for\s+([A-Za-z][A-Za-z'\s-]{1,60}?)(?:\s*[.?!]|$)/i,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    const name = match?.[1]?.trim();
    if (name && name.length >= 3) return name;
  }
  return null;
}

export function stripInventedRecordLinks(text: string): string {
  return text
    .replace(/\s*you can view it\s*\[[^\]]*\]\([^)]*\)\.?/gi, "")
    .replace(/\[[^\]]*\]\(#\/clients\/[^)]*\)/g, "")
    .replace(/\[[^\]]*\]\(\/clients\/[^)]*\)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function isActivityCoachIntent(text: string): boolean {
  return ACTIVITY_INTENT_RE.test(text);
}

export function isClientRecordConfirmMessage(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  if (/^(no|nope|cancel|wrong|different)\b/.test(t)) return false;
  return /^(yes|yep|yeah|y|correct|that'?s (?:right|correct)|right client|confirm|confirmed|ok|okay|sure|proceed|go ahead)\b/.test(
    t
  );
}

/** On a client record page, skip Step 1 unless the user names a different client. */
export function shouldAutoConfirmCoachOnPage(
  pagePath: string | undefined,
  userMessage: string,
  client: ActivityCoachClient
): boolean {
  if (!clientMatchesPageRoute(pagePath, client)) return false;
  const nameFromMessage = clientNameFromActivityMessage(userMessage);
  if (!nameFromMessage) return true;
  const query = nameFromMessage.toLowerCase().trim();
  const fullName = client.name.toLowerCase();
  const tokens = query.split(/\s+/).filter(Boolean);
  if (fullName.includes(query) || query.includes(fullName)) return true;
  return tokens.every(
    (token) =>
      fullName.includes(token) ||
      client.searchKey.toLowerCase().includes(token) ||
      token.length >= 3 && fullName.split(/\s+/).some((part) => part.startsWith(token.slice(0, 4)))
  );
}

export function clientIdFromPagePath(pagePath?: string): string | null {
  if (!pagePath) return null;
  const match = pagePath.match(/^\/clients\/([^/?#]+)/);
  if (!match || match[1] === "new") return null;
  return match[1];
}

export function clientMatchesPageRoute(
  pagePath: string | undefined,
  client: ActivityCoachClient
): boolean {
  const routeId = clientIdFromPagePath(pagePath);
  if (!routeId) return false;
  const route = routeId.toLowerCase();
  return client.id.toLowerCase() === route || client.searchKey.toLowerCase() === route;
}

export function clientRecordCardAttachment(
  client: ActivityCoachClient & { href?: string; status?: string },
  options?: { title?: string }
): ChatDisplayAttachment {
  return {
    type: "cards",
    title: options?.title ?? "Step 1 — Confirm client",
    cards: [
      {
        title: client.name,
        subtitle: client.searchKey,
        meta: client.status ? String(client.status) : "Check the name and search key, then reply yes",
        badge: "Client",
        href: client.href ?? `/clients/${client.id}`,
      },
    ],
  };
}

export function activityNotesTableAttachment(
  clientName: string,
  activities: Record<string, unknown>[]
): ChatDisplayAttachment {
  return {
    type: "table",
    title: `Step 2 — Last ${activities.length} activity notes — ${clientName}`,
    columns: ["Date", "Type", "Subject", "Notes"],
    rows: activities.map((a) => ({
      Date: String(a.date ?? "—"),
      Type: String(a.type ?? "—"),
      Subject: String(a.subject ?? "—"),
      Notes:
        String(a.description ?? "").length > 160
          ? `${String(a.description ?? "").slice(0, 157)}…`
          : String(a.description ?? "—"),
    })),
  };
}

export function coachStepPromptAttachment(title: string, body: string): ChatDisplayAttachment {
  return {
    type: "prompt",
    title,
    prompt: { body },
  };
}

export function savedActivityCardAttachment(input: {
  clientName: string;
  subject: string;
  href: string;
}): ChatDisplayAttachment {
  return {
    type: "cards",
    title: "Saved — view on client record",
    cards: [
      {
        title: input.subject,
        subtitle: input.clientName,
        meta: "Activity tab",
        badge: "Saved",
        href: input.href,
      },
    ],
  };
}
