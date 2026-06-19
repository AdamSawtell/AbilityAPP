import type { ChatMessage, ChatThreadState } from "@/lib/ai/types";
import type { AuthSession } from "@/lib/access/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  activityNotesTableAttachment,
  clientIdFromPagePath,
  clientRecordCardAttachment,
  isActivityCoachIntent,
  isClientRecordConfirmMessage,
  type ActivityCoachClient,
} from "@/lib/ai/activity-coach-display";
import { runClientActivityRecent } from "@/lib/ai/tools/client-activity-recent";
import { resolveClient } from "@/lib/ai/tools/client-resolve";
import type { ChatDisplayAttachment } from "@/lib/ai/types";

export type ActivityCoachAdvance = {
  threadState: ChatThreadState;
  assistantText: string;
  attachments: ChatDisplayAttachment[];
};

function coachClientHref(client: ActivityCoachClient) {
  return `/clients/${client.id}?tab=Activity`;
}

/** Step 1: on a client page, propose the client and ask for confirmation before loading notes. */
export async function tryProposeActivityCoachClient(
  supabase: SupabaseClient,
  messages: ChatMessage[],
  threadState: ChatThreadState,
  pagePath?: string
): Promise<ActivityCoachAdvance | null> {
  if (threadState.activityCoachClient) return null;

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser || !isActivityCoachIntent(lastUser.content)) return null;

  const clientId = clientIdFromPagePath(pagePath);
  if (!clientId) return null;

  const client = await resolveClient(supabase, { clientId, pagePath });
  if (!client) return null;

  const coachClient: ActivityCoachClient = {
    id: client.id,
    name: client.name,
    searchKey: client.searchKey,
  };

  return {
    threadState: {
      ...threadState,
      activityCoachClient: coachClient,
      activityCoachClientConfirmed: false,
      activityCoachNotesReviewed: false,
    },
    assistantText: `I'll help you log an activity note for **${client.name}** (${client.searchKey}).\n\n**Step 1 — Confirm client:** Open their record below and check it's the right person. Reply **yes** when confirmed, and I'll show the last 5 activity notes before we capture today's visit.`,
    attachments: [
      clientRecordCardAttachment({
        ...coachClient,
        href: `/clients/${client.id}`,
        status: "Confirm this client",
      }),
    ],
  };
}

/** Step 2: after client confirmed, load and show last 5 notes. */
export async function tryConfirmActivityCoachClient(
  supabase: SupabaseClient,
  session: AuthSession,
  messages: ChatMessage[],
  threadState: ChatThreadState,
  pagePath?: string
): Promise<ActivityCoachAdvance | null> {
  const client = threadState.activityCoachClient;
  if (!client || threadState.activityCoachClientConfirmed) return null;

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser || !isClientRecordConfirmMessage(lastUser.content)) return null;

  const raw = await runClientActivityRecent(
    supabase,
    session,
    {
      clientId: client.id,
      limit: 5,
      purpose: "coach",
      pagePath,
    },
    {
      ...threadState,
      activityCoachClient: client,
      activityCoachClientConfirmed: true,
    }
  );

  const activities = Array.isArray((raw as { activities?: unknown }).activities)
    ? ((raw as { activities: Record<string, unknown>[] }).activities ?? [])
    : [];

  const attachments: ChatDisplayAttachment[] = [
    clientRecordCardAttachment({
      ...client,
      href: `/clients/${client.id}`,
      status: "Confirmed",
    }),
  ];

  if (activities.length) {
    attachments.push(activityNotesTableAttachment(client.name, activities));
  }

  const overview =
    activities.length === 0
      ? "There are no activity notes on file yet."
      : activities
          .map(
            (a, i) =>
              `${i + 1}. **${String(a.date ?? "—")}** (${String(a.type ?? "Note")}) — ${String(a.subject ?? "—")}`
          )
          .join("\n");

  return {
    threadState: {
      ...threadState,
      activityCoachClient: client,
      activityCoachClientConfirmed: true,
      activityCoachNotesReviewed: true,
    },
    assistantText:
      activities.length === 0
        ? `Thanks — **${client.name}** is confirmed. There are no previous activity notes on file.\n\n**Step 3:** What happened today? Tell me about the visit and I'll ask a follow-up if needed.`
        : `Thanks — **${client.name}** is confirmed.\n\n**Step 2 — Recent notes:**\n${overview}\n\n**Step 3:** What's new since the latest note? Tell me what happened today (one detail at a time is fine).`,
    attachments,
  };
}

export function coachClientReadyForPrepare(threadState: ChatThreadState): boolean {
  if (!threadState.activityCoachClient) return true;
  return Boolean(threadState.activityCoachClientConfirmed && threadState.activityCoachNotesReviewed);
}

export { coachClientHref };
