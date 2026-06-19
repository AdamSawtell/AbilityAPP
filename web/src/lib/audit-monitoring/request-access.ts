import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { readSystemSessionFromCookies, buildSystemSession } from "@/lib/system/session.server";
import type { MonitoringAccessLevel } from "@/lib/audit-monitoring/access";
import {
  processAuditAccessFromSystem,
  aiQueryAuditAccessFromSystem,
} from "@/lib/audit-monitoring/access";

async function resolveActor() {
  const workspace = await getAuthSessionFromRequest();
  const systemToken = await readSystemSessionFromCookies();
  const systemSession = systemToken ? await buildSystemSession(systemToken.userId) : null;
  const actorUserId = systemSession?.userId ?? workspace?.userId ?? "";
  const actorName = systemSession?.displayName ?? workspace?.displayName ?? "Unknown";
  return { workspace, systemSession, actorUserId, actorName };
}

export async function resolveProcessAuditAccess() {
  const { workspace, systemSession, actorUserId, actorName } = await resolveActor();
  const level = processAuditAccessFromSystem(systemSession, workspace);
  return { level, actorUserId, actorName };
}

export async function resolveAiQueryAuditAccess() {
  const { workspace, systemSession, actorUserId, actorName } = await resolveActor();
  const level = aiQueryAuditAccessFromSystem(systemSession, workspace);
  return { level, actorUserId, actorName };
}

export type { MonitoringAccessLevel };
