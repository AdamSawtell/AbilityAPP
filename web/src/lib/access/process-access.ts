import { ACCESS_PROCESSES, processById, windowByKey } from "@/lib/access/catalog";
import type { AccessProcess } from "@/lib/access/catalog-types";
import type { AuthSession } from "@/lib/access/types";
import { canAccessWindow } from "@/lib/access/catalog";
import { canWriteWindowSession } from "@/lib/access/window-access";

const DOCUMENT_PROCESS_PREFIXES = ["print-", "send-", "batch-print-"] as const;

export function isDocumentProcess(processId: string): boolean {
  return DOCUMENT_PROCESS_PREFIXES.some((prefix) => processId.startsWith(prefix));
}

export type DocumentActionKind = "print" | "send" | "batch" | "generate";

export function documentActionKind(processId: string): DocumentActionKind {
  if (processId.startsWith("send-")) return "send";
  if (processId.startsWith("batch-print-")) return "batch";
  if (processId.startsWith("print-employee-")) return "generate";
  return "print";
}

export function workflowProcesses(): AccessProcess[] {
  return ACCESS_PROCESSES.filter((p) => !isDocumentProcess(p.id));
}

export function documentProcesses(): AccessProcess[] {
  return ACCESS_PROCESSES.filter((p) => isDocumentProcess(p.id));
}

export function processesForWindowKey(windowKey: string): AccessProcess[] {
  return ACCESS_PROCESSES.filter((p) => p.parentWindowKey === windowKey && isDocumentProcess(p.id));
}

export function documentProcessesForModule(moduleKey: string): AccessProcess[] {
  return processesForWindowKey(moduleKey);
}

/** True when the role may run this process (process grant + write on parent window/tab). */
export function canRunProcess(
  session: Pick<AuthSession, "processIds" | "windowKeys" | "windowAccess"> | null,
  processId: string
): boolean {
  if (!session?.processIds.includes(processId)) return false;
  const proc = processById(processId);
  if (!proc?.parentWindowKey) return true;
  if (!canAccessWindow(session.windowKeys, proc.parentWindowKey)) return false;
  if (!canWriteWindowSession(session, proc.parentWindowKey)) return false;
  const parentWin = windowByKey(proc.parentWindowKey);
  if (parentWin?.parentWindowKey && !canAccessWindow(session.windowKeys, parentWin.parentWindowKey)) {
    return false;
  }
  return true;
}

/** Remove document process grants tied to windows that lost write access. */
export function stripDocumentProcessesForWindows(processIds: string[], windowKeys: string[]): string[] {
  const blocked = new Set(windowKeys);
  return processIds.filter((id) => {
    if (!isDocumentProcess(id)) return true;
    const parent = processById(id)?.parentWindowKey;
    return !parent || !blocked.has(parent);
  });
}

export function documentActionLabel(kind: DocumentActionKind): string {
  switch (kind) {
    case "send":
      return "Send";
    case "batch":
      return "Batch";
    case "generate":
      return "Generate";
    default:
      return "Print";
  }
}
