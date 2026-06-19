"use client";

import { resolveDetailWindowKey } from "@/lib/access/catalog";
import { useAuth } from "@/lib/auth-store";

/** Resolve whether the signed-in role can edit a detail tab on a module record. */
export function useDetailTabWriteAccess(parentWindowKey: string, tab: string) {
  const { canWindow, canWriteWindow } = useAuth();
  const windowKey = resolveDetailWindowKey(parentWindowKey, tab);
  return {
    windowKey,
    canRead: windowKey ? canWindow(windowKey) : false,
    canWrite: windowKey ? canWriteWindow(windowKey) : false,
  };
}

export function useModuleSaveAccess(moduleKey: string, childKeyPrefix: string) {
  const { canSaveModule } = useAuth();
  return canSaveModule(moduleKey, childKeyPrefix);
}
