import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { readSystemSessionFromCookies, buildSystemSession } from "@/lib/system/session.server";
import {
  sessionAuditAccessFromSystem,
  type SessionAuditAccessLevel,
} from "@/lib/session-audit/access";

export async function resolveSessionAuditAccess(): Promise<{
  level: SessionAuditAccessLevel;
  actorUserId: string;
  actorName: string;
}> {
  const workspace = await getAuthSessionFromRequest();
  const systemToken = await readSystemSessionFromCookies();
  const systemSession = systemToken ? await buildSystemSession(systemToken.userId) : null;
  const level = sessionAuditAccessFromSystem(systemSession, workspace);
  const actorUserId = systemSession?.userId ?? workspace?.userId ?? "";
  const actorName = systemSession?.displayName ?? workspace?.displayName ?? "Unknown";
  return { level, actorUserId, actorName };
}
