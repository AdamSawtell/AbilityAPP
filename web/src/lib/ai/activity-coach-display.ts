import type { ChatDisplayAttachment } from "@/lib/ai/types";

export type ActivityCoachClient = {
  id: string;
  name: string;
  searchKey: string;
};

const ACTIVITY_INTENT_RE =
  /\b(activity note|visit note|progress note|log (?:a |an )?activity|create (?:a |an )?activity|home visit|meal prep|write (?:a |an )?note|add (?:a |an )?note)\b/i;

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

export function clientIdFromPagePath(pagePath?: string): string | null {
  if (!pagePath) return null;
  const match = pagePath.match(/^\/clients\/([^/?#]+)/);
  if (!match || match[1] === "new") return null;
  return match[1];
}

export function clientRecordCardAttachment(
  client: ActivityCoachClient & { href?: string; status?: string }
): ChatDisplayAttachment {
  return {
    type: "cards",
    title: "Step 1 — Confirm client",
    cards: [
      {
        title: client.name,
        subtitle: client.searchKey,
        meta: client.status ? String(client.status) : "Open the client record to verify",
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
