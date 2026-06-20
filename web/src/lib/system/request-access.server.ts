import { readSystemSessionFromCookies, buildSystemSession } from "@/lib/system/session.server";

/** Any user signed in to System setup (not workspace-only). */
export async function resolveSystemOperatorAccess(): Promise<{
  allowed: boolean;
  actorUserId: string;
  actorName: string;
}> {
  const systemToken = await readSystemSessionFromCookies();
  const systemSession = systemToken ? await buildSystemSession(systemToken.userId) : null;
  if (!systemSession) {
    return { allowed: false, actorUserId: "", actorName: "" };
  }
  return {
    allowed: true,
    actorUserId: systemSession.userId,
    actorName: systemSession.displayName,
  };
}
