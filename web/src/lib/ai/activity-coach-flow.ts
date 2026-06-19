import type { ChatMessage, ChatThreadState } from "@/lib/ai/types";
import type { AuthSession } from "@/lib/access/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ACTIVITY_COACH_PREFETCH_LIMIT,
  type CoachPrefetchedActivity,
} from "@/lib/ai/activity-coach-prefetch";
import {
  activityNotesTableAttachment,
  clientIdFromPagePath,
  clientNameFromActivityMessage,
  coachStepPromptAttachment,
  clientRecordCardAttachment,
  isActivityCoachIntent,
  isClientRecordConfirmMessage,
  shouldAutoConfirmCoachOnPage,
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

async function resolveCoachClient(
  supabase: SupabaseClient,
  pagePath: string | undefined,
  userMessage: string
): Promise<ResolvedClient | null> {
  const routeId = clientIdFromPagePath(pagePath);
  const nameFromMessage = clientNameFromActivityMessage(userMessage);

  if (routeId) {
    const fromRoute = await resolveClient(supabase, {
      clientId: routeId,
      searchKey: routeId,
      pagePath,
    });
    if (fromRoute) return fromRoute;
  }

  if (nameFromMessage) {
    const fromName = await resolveClient(supabase, { name: nameFromMessage, pagePath });
    if (fromName) return fromName;
  }

  return null;
}

type ResolvedClient = ActivityCoachClient;

function coachActivityRows(activities: CoachPrefetchedActivity[]): Record<string, unknown>[] {
  return activities.map((a) => ({
    date: a.date,
    type: a.type,
    subject: a.subject,
    description: a.description,
  }));
}

async function loadCoachActivities(
  supabase: SupabaseClient,
  session: AuthSession,
  client: ActivityCoachClient,
  pagePath: string | undefined,
  threadState: ChatThreadState
): Promise<CoachPrefetchedActivity[]> {
  const prefetched = threadState.activityCoachPrefetchedNotes;
  if (prefetched?.clientId === client.id && prefetched.activities.length > 0) {
    return prefetched.activities.slice(0, ACTIVITY_COACH_PREFETCH_LIMIT);
  }

  const raw = await runClientActivityRecent(
    supabase,
    session,
    {
      clientId: client.id,
      limit: ACTIVITY_COACH_PREFETCH_LIMIT,
      purpose: "coach",
      pagePath,
    },
    {
      ...threadState,
      activityCoachClient: client,
      activityCoachClientConfirmed: true,
    }
  );

  const rows = Array.isArray((raw as { activities?: unknown }).activities)
    ? ((raw as { activities: Record<string, unknown>[] }).activities ?? [])
    : [];

  return rows.map((a) => ({
    date: String(a.date ?? ""),
    type: String(a.type ?? "Note"),
    subject: String(a.subject ?? ""),
    description: String(a.description ?? ""),
    createdBy: a.createdBy ? String(a.createdBy) : undefined,
  }));
}

function buildNotesAndStep3Advance(
  threadState: ChatThreadState,
  client: ActivityCoachClient,
  activities: CoachPrefetchedActivity[],
  options?: { autoFromPage?: boolean }
): ActivityCoachAdvance {
  const activityRows = coachActivityRows(activities);

  const attachments: ChatDisplayAttachment[] = [
    clientRecordCardAttachment(
      {
        ...client,
        href: `/clients/${client.id}`,
        status: options?.autoFromPage ? "Viewing this record" : "Confirmed",
      },
      { title: options?.autoFromPage ? "Client" : "Step 1 — Confirm client" }
    ),
  ];

  if (activityRows.length) {
    attachments.push(activityNotesTableAttachment(client.name, activityRows));
  }

  const step3Prompt =
    activities.length === 0
      ? "What happened today? Tell me about the visit — time, what you did, and anything to watch. I'll ask a follow-up if needed."
      : "What's new since the latest note? Tell me what happened today — visit time, what you did, and anything to watch. One detail at a time is fine.";

  attachments.push(coachStepPromptAttachment("Step 3 — Your turn", step3Prompt));

  const assistantText = options?.autoFromPage
    ? activities.length === 0
      ? `You're on **${client.name}**'s record (${client.searchKey}). There are no previous activity notes on file.`
      : `You're on **${client.name}**'s record (${client.searchKey}). Here are the last ${activities.length} activity notes:`
    : activities.length === 0
      ? `Thanks — **${client.name}** is confirmed. There are no previous activity notes on file.`
      : `Thanks — **${client.name}** is confirmed. Here are the last ${activities.length} activity notes:`;

  return {
    threadState: {
      ...threadState,
      activityCoachClient: client,
      activityCoachClientConfirmed: true,
      activityCoachNotesReviewed: true,
    },
    assistantText,
    attachments,
  };
}

function step1Response(
  threadState: ChatThreadState,
  client: ActivityCoachClient
): ActivityCoachAdvance {
  return {
    threadState: {
      ...threadState,
      activityCoachClient: client,
      activityCoachClientConfirmed: false,
      activityCoachNotesReviewed: false,
    },
    assistantText: `I'll help you log an activity note for **${client.name}** (${client.searchKey}).\n\n**Step 1 — Confirm client:** Use the **Open record** card below to check this is the right person, then reply **yes** when confirmed. I'll show the last 5 activity notes next.`,
    attachments: [
      clientRecordCardAttachment({
        ...client,
        href: `/clients/${client.id}`,
        status: "Tap Open record to verify",
      }),
    ],
  };
}

/** Step 1: resolve client; on client page auto-load notes, otherwise ask to confirm. */
export async function tryProposeActivityCoachClient(
  supabase: SupabaseClient,
  session: AuthSession,
  messages: ChatMessage[],
  threadState: ChatThreadState,
  pagePath?: string
): Promise<ActivityCoachAdvance | null> {
  if (threadState.activityCoachClient) return null;

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser || !isActivityCoachIntent(lastUser.content)) return null;

  const client = await resolveCoachClient(supabase, pagePath, lastUser.content);
  if (!client) return null;

  if (shouldAutoConfirmCoachOnPage(pagePath, lastUser.content, client)) {
    const activities = await loadCoachActivities(supabase, session, client, pagePath, threadState);
    return buildNotesAndStep3Advance(threadState, client, activities, { autoFromPage: true });
  }

  return step1Response(threadState, client);
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

  const activities = await loadCoachActivities(supabase, session, client, pagePath, threadState);
  return buildNotesAndStep3Advance(threadState, client, activities);
}

/** If the model called client_get during activity coach, replace its reply with Step 1 UI. */
export async function tryActivityCoachFromClientGet(
  supabase: SupabaseClient,
  session: AuthSession,
  messages: ChatMessage[],
  threadState: ChatThreadState,
  pagePath: string | undefined,
  clientGetResult: unknown
): Promise<ActivityCoachAdvance | null> {
  if (threadState.activityCoachClient) return null;

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser || !isActivityCoachIntent(lastUser.content)) return null;

  const row = clientGetResult as { found?: boolean; client?: { id?: string; name?: string; searchKey?: string } };
  if (!row?.found || !row.client?.id) return null;

  const client: ActivityCoachClient = {
    id: String(row.client.id),
    name: String(row.client.name ?? ""),
    searchKey: String(row.client.searchKey ?? ""),
  };

  if (shouldAutoConfirmCoachOnPage(pagePath, lastUser.content, client)) {
    const activities = await loadCoachActivities(supabase, session, client, pagePath, threadState);
    return buildNotesAndStep3Advance(threadState, client, activities, { autoFromPage: true });
  }

  return step1Response(threadState, client);
}

export function coachClientReadyForPrepare(threadState: ChatThreadState): boolean {
  if (!threadState.activityCoachClient) return true;
  return Boolean(threadState.activityCoachClientConfirmed && threadState.activityCoachNotesReviewed);
}

export { coachClientHref };
