import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { canWriteWindowSession } from "@/lib/access/window-access";

export function aiCanAccessWindow(session: AuthSession, windowKey: string): boolean {
  return canAccessWindow(session.windowKeys, windowKey);
}

export function aiCanWriteWindow(session: AuthSession, windowKey: string): boolean {
  return canWriteWindowSession(session, windowKey);
}

export function aiCanProcess(session: AuthSession, processId: string): boolean {
  if (!session.processIds.includes(processId)) return false;
  return true;
}
