"use client";

import { isSystemSurfaceWindow } from "@/lib/access/catalog";
import { useAuth } from "@/lib/auth-store";
import { useSystemAuthOptional } from "@/lib/system-auth-store";

export type AdminPageVariant = "workspace" | "system";

/** Client access check for pages that may render under System or workspace. */
export function useAdminPageAccess(variant: AdminPageVariant = "workspace") {
  const { canWindow } = useAuth();
  const systemAuth = useSystemAuthOptional();
  const isSystemOperator = Boolean(systemAuth?.session);

  function hasAccess(windowKey: string): boolean {
    if (isSystemSurfaceWindow(windowKey)) {
      return variant === "system" && isSystemOperator;
    }
    return canWindow(windowKey);
  }

  function hasAnyAccess(windowKeys: string[]): boolean {
    return windowKeys.some(hasAccess);
  }

  return { hasAccess, hasAnyAccess, isSystemOperator };
}
