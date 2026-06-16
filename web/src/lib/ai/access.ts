import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";

export function aiCanAccessWindow(session: AuthSession, windowKey: string): boolean {
  return canAccessWindow(session.windowKeys, windowKey);
}

export function aiCanProcess(session: AuthSession, processId: string): boolean {
  return session.processIds.includes(processId);
}
