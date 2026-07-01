import type { ChatDisplayAttachment } from "@/lib/ai/types";

export type ActivityCoachClient = {
  id: string;
  name: string;
  searchKey: string;
};

const ACTIVITY_INTENT_RE =
  /\b(activity note|visit note|progress note|activity update|(?:log|add|create|write|record|enter|make|new|start)\b[\s\S]{0,48}\bactivit(?:y|ies)\b|home visit|meal prep|write (?:an? )?note|add (?:an? )?note)\b/i;

// Words that signal the captured phrase is not a person's name (pronouns, time
// words, and common activity vocabulary). Used to reject false matches like
// "her visit tomorrow" so the assistant never grounds on the wrong client.
const NON_NAME_TOKENS = new Set([
  "a",
  "an",
  "the",
  "her",
  "his",
  "their",
  "them",
  "they",
  "she",
  "he",
  "me",
  "my",
  "mine",
  "you",
  "your",
  "this",
  "that",
  "today",
  "tonight",
  "tomorrow",
  "yesterday",
  "now",
  "later",
  "morning",
  "afternoon",
  "evening",
  "week",
  "day",
  "visit",
  "phone",
  "call",
  "note",
  "notes",
  "activity",
  "client",
  "participant",
  "shift",
  "report",
]);

/** True when the captured phrase plausibly looks like a 1-3 word person name. */
function looksLikePersonName(candidate: string): boolean {
  const tokens = candidate.split(/\s+/).filter(Boolean);
  if (tokens.length === 0 || tokens.length > 3) return false;
  return tokens.every((token) => {
    const lower = token.replace(/[^a-z'-]/gi, "").toLowerCase();
    if (lower.length < 2) return false;
    return !NON_NAME_TOKENS.has(lower);
  });
}

// One to three name tokens (letters, with optional hyphen/apostrophe inside a
// token, e.g. "Smith-Jones", "O'Brien"). Stops cleanly at digits, dashes used
// as separators, and punctuation.
const NAME_TOKEN = "[A-Za-z][A-Za-z']*(?:-[A-Za-z']+)?";
const NAME_CAPTURE = `(${NAME_TOKEN}(?:\\s+${NAME_TOKEN}){0,2})`;

/** True when any user message in the thread started the activity-note coach. */
export function isActivityCoachThread(
  messages: { role: string; content: string }[],
  threadState: { activityCoachStarted?: boolean }
): boolean {
  if (threadState.activityCoachStarted) return true;
  return messages.some((m) => m.role === "user" && isActivityCoachIntent(m.content));
}

/** Standalone name reply during coach (e.g. "bernedette", "Bern") — not a confirm/cancel. */
export function clientNameFromFollowUpMessage(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 3) return null;
  if (isClientRecordConfirmMessage(trimmed)) return null;
  if (/^(no|nope|cancel|wrong|different)\b/i.test(trimmed)) return null;

  const fromPattern = clientNameFromActivityMessage(trimmed);
  if (fromPattern) return fromPattern;

  if (looksLikePersonName(trimmed) && trimmed.split(/\s+/).length <= 3) {
    return trimmed;
  }
  return null;
}

export function clientNameFromActivityMessage(text: string): string | null {
  const trimmed = text.trim();
  const patterns = [
    new RegExp(`\\bactivity(?:\\s+note)?\\s+for\\s+${NAME_CAPTURE}`, "i"),
    new RegExp(`\\bfor\\s+${NAME_CAPTURE}`, "i"),
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    const name = match?.[1]?.trim();
    // Require a plausible person name so phrases like "her visit tomorrow" are
    // not mistaken for a client (KAREN-BUG-0003).
    if (name && name.length >= 3 && looksLikePersonName(name)) return name;
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
        href: clientActivityCoachSaveHrefFromHref(input.href),
      },
    ],
  };
}

/** Normalise save/navigation links to land on Activity after coach save. */
export function clientActivityCoachSaveHref(clientId: string) {
  return `/clients/${clientId}?tab=Activity&coachSave=1`;
}

export function clientActivityCoachSaveHrefFromHref(href: string): string {
  try {
    const url = new URL(href, "http://local");
    if (!url.pathname.startsWith("/clients/")) return href;
    url.searchParams.set("tab", "Activity");
    url.searchParams.set("coachSave", "1");
    return `${url.pathname}${url.search}`;
  } catch {
    return href.includes("?") ? `${href}&coachSave=1` : `${href}?coachSave=1`;
  }
}
