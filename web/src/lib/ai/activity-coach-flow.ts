import type { ChatMessage, ChatPageClientContext, ChatThreadState } from "@/lib/ai/types";
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
  clientNameFromFollowUpMessage,
  coachStepPromptAttachment,
  clientRecordCardAttachment,
  isActivityCoachIntent,
  isActivityCoachThread,
  isClientRecordConfirmMessage,
  type ActivityCoachClient,
} from "@/lib/ai/activity-coach-display";
import { runClientActivityRecent } from "@/lib/ai/tools/client-activity-recent";
import { resolveClient } from "@/lib/ai/tools/client-resolve";
import { aiAllowedClientIds } from "@/lib/ai/tools/client-location-access";
import type { ChatDisplayAttachment } from "@/lib/ai/types";

export type ActivityCoachAdvance = {
  threadState: ChatThreadState;
  assistantText: string;
  attachments: ChatDisplayAttachment[];
};

function coachClientHref(client: ActivityCoachClient) {
  return `/clients/${client.id}?tab=Activity&coachSave=1`;
}

async function resolveCoachClient(
  supabase: SupabaseClient,
  session: AuthSession,
  pagePath: string | undefined,
  userMessage: string,
  pageClient?: ChatPageClientContext | null,
  options?: { allowFollowUpName?: boolean }
): Promise<ResolvedClient | null> {
  const routeId = clientIdFromPagePath(pagePath);
  const nameFromMessage = clientNameFromActivityMessage(userMessage);
  const followUpName =
    options?.allowFollowUpName ? clientNameFromFollowUpMessage(userMessage) : null;
  const explicitName = nameFromMessage ?? followUpName;
  const allowedClientIds = await aiAllowedClientIds(supabase, session);

  // When the user explicitly names a client, that name is the source of truth.
  // Never silently fall back to whatever client page is open — that is how the
  // assistant grounded on the wrong person (KAREN-BUG-0003). A null result asks
  // the user to confirm instead of guessing.
  if (explicitName) {
    return resolveClient(
      supabase,
      { name: explicitName, pagePath },
      {
        allowedClientIds,
        minMatchScore: options?.allowFollowUpName ? 12 : undefined,
      }
    );
  }

  // Visible client on a record page — pageClient is sent because the user is viewing it.
  if (pageClient?.id && routeId) {
    const fromPage = await resolveClient(
      supabase,
      { clientId: pageClient.id, searchKey: pageClient.searchKey, pagePath },
      { allowedClientIds }
    );
    if (fromPage) return fromPage;
  }

  if (routeId) {
    const fromRoute = await resolveClient(
      supabase,
      {
        clientId: routeId,
        searchKey: routeId,
        pagePath,
      },
      { allowedClientIds }
    );
    if (fromRoute) return fromRoute;
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
      activityCoachStarted: true,
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
      activityCoachStarted: true,
      activityCoachClient: client,
      activityCoachClientConfirmed: false,
      activityCoachNotesReviewed: false,
    },
    assistantText: `I'll help you log an activity note for **${client.name}** (${client.searchKey}).\n\n**Step 1 — Confirm client:** Check the record card below, then click **Confirm this client** or reply **yes**. I'll show the last 5 activity notes next.`,
    attachments: [
      clientRecordCardAttachment({
        ...client,
        href: `/clients/${client.id}`,
        status: "Confirm this client",
      }),
    ],
  };
}

/** Recover staged client from visible record context when the model found the person but thread state was not updated. */
export async function ensureActivityCoachClient(
  supabase: SupabaseClient,
  session: AuthSession,
  threadState: ChatThreadState,
  messages: ChatMessage[],
  pagePath?: string,
  pageClient?: ChatPageClientContext | null
): Promise<ChatThreadState> {
  if (threadState.activityCoachClient) return threadState;
  if (!isActivityCoachThread(messages, threadState)) return threadState;

  const allowedClientIds = await aiAllowedClientIds(supabase, session);

  const routeId = clientIdFromPagePath(pagePath);
  const prefetchedId = threadState.activityCoachPrefetchedNotes?.clientId;
  if (prefetchedId && routeId && pageClient?.id === prefetchedId) {
    const fromPrefetch = await resolveClient(
      supabase,
      { clientId: prefetchedId, pagePath },
      { allowedClientIds }
    );
    if (fromPrefetch) {
      return {
        ...threadState,
        activityCoachStarted: true,
        activityCoachClient: fromPrefetch,
        activityCoachClientConfirmed: false,
        activityCoachNotesReviewed: false,
      };
    }
  }

  return threadState;
}

export function coachClientFromToolResult(result: unknown): ActivityCoachClient | null {
  const row = result as { found?: boolean; client?: { id?: string; name?: string; searchKey?: string } };
  if (!row?.found || !row.client?.id) return null;
  return {
    id: String(row.client.id),
    name: String(row.client.name ?? ""),
    searchKey: String(row.client.searchKey ?? ""),
  };
}

/** Step 1: resolve client and ask the user to confirm before loading notes. */
export async function tryProposeActivityCoachClient(
  supabase: SupabaseClient,
  session: AuthSession,
  messages: ChatMessage[],
  threadState: ChatThreadState,
  pagePath?: string,
  pageClient?: ChatPageClientContext | null
): Promise<ActivityCoachAdvance | null> {
  if (threadState.activityCoachClient) return null;

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return null;

  const coachThread = isActivityCoachThread(messages, threadState);
  const activityIntent = isActivityCoachIntent(lastUser.content);
  const followUpName = clientNameFromFollowUpMessage(lastUser.content);

  if (!activityIntent && !(coachThread && followUpName)) return null;

  const client = await resolveCoachClient(
    supabase,
    session,
    pagePath,
    lastUser.content,
    pageClient,
    { allowFollowUpName: coachThread }
  );

  if (client) {
    return step1Response(threadState, client);
  }

  if (activityIntent && !threadState.activityCoachStarted) {
    return {
      threadState: { ...threadState, activityCoachStarted: true },
      assistantText:
        "I'll help you log an activity note.\n\n**Which client** is this for? Reply with their name or search key — I'll confirm the record, show their last 5 activity notes, then ask a few questions before preparing the note.",
      attachments: [],
    };
  }

  if (coachThread && followUpName) {
    return {
      threadState: { ...threadState, activityCoachStarted: true },
      assistantText: `I couldn't find a client matching **${followUpName}**. Check the spelling or try their search key, then send the name again.`,
      attachments: [],
    };
  }

  return null;
}

/** Step 2: after client confirmed, load and show last 5 notes. */
export async function tryConfirmActivityCoachClient(
  supabase: SupabaseClient,
  session: AuthSession,
  messages: ChatMessage[],
  threadState: ChatThreadState,
  pagePath?: string,
  pageClient?: ChatPageClientContext | null
): Promise<ActivityCoachAdvance | null> {
  let state = threadState;
  if (!state.activityCoachClient) {
    state = await ensureActivityCoachClient(supabase, session, state, messages, pagePath, pageClient);
  }

  const client = state.activityCoachClient;
  if (!client || state.activityCoachClientConfirmed) return null;

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser || !isClientRecordConfirmMessage(lastUser.content)) return null;

  const activities = await loadCoachActivities(supabase, session, client, pagePath, state);
  return buildNotesAndStep3Advance(state, client, activities);
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
  if (threadState.activityCoachClientConfirmed) return null;

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser || !isActivityCoachThread(messages, threadState)) return null;
  if (isClientRecordConfirmMessage(lastUser.content)) return null;

  const nameFromMessage =
    clientNameFromActivityMessage(lastUser.content) ??
    clientNameFromFollowUpMessage(lastUser.content);
  if (nameFromMessage) {
    const allowedClientIds = await aiAllowedClientIds(supabase, session);
    const byName = await resolveClient(
      supabase,
      { name: nameFromMessage, pagePath },
      { allowedClientIds, minMatchScore: 12 }
    );
    if (!byName) return null;
    return step1Response(threadState, byName);
  }

  const fromTool = coachClientFromToolResult(clientGetResult);
  if (fromTool) {
    return step1Response({ ...threadState, activityCoachStarted: true }, fromTool);
  }

  return null;
}

export function coachClientReadyForPrepare(threadState: ChatThreadState): boolean {
  if (!threadState.activityCoachClient) return true;
  return Boolean(threadState.activityCoachClientConfirmed && threadState.activityCoachNotesReviewed);
}

export { coachClientHref };
