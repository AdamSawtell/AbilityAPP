"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applyOrgThemeToElement, resolveOrgTheme, type ResolvedOrgTheme } from "@/lib/org-theme";
import type { OrganizationRecord } from "@/lib/organization";
import { useOrganizationOptional } from "@/lib/organization-store";

type OrgThemePreviewState = {
  preview: ResolvedOrgTheme | null;
  setPreview: (theme: ResolvedOrgTheme | null) => void;
};

const OrgThemePreviewContext = createContext<OrgThemePreviewState | null>(null);

export function OrgThemePreviewStateProvider({ children }: { children: React.ReactNode }) {
  const [preview, setPreview] = useState<ResolvedOrgTheme | null>(null);
  const value = useMemo(() => ({ preview, setPreview }), [preview]);
  return <OrgThemePreviewContext.Provider value={value}>{children}</OrgThemePreviewContext.Provider>;
}

export function useOrgThemePreviewState() {
  const ctx = useContext(OrgThemePreviewContext);
  if (!ctx) {
    throw new Error("useOrgThemePreviewState must be used within OrgThemePreviewStateProvider");
  }
  return ctx;
}

/** Applies organisation theme CSS variables to documentElement on every route. */
export function OrgThemeProvider({ children }: { children: React.ReactNode }) {
  const orgCtx = useOrganizationOptional();
  const previewCtx = useContext(OrgThemePreviewContext);

  const theme = useMemo(() => {
    if (previewCtx?.preview) return previewCtx.preview;
    if (!orgCtx) return resolveOrgTheme(emptyThemeFields());
    return resolveOrgTheme(orgCtx.organization);
  }, [previewCtx?.preview, orgCtx?.organization]);

  useEffect(() => {
    applyOrgThemeToElement(document.documentElement, theme);
  }, [theme]);

  return <>{children}</>;
}

export function resolveOrgThemeFromRecord(record: Pick<OrganizationRecord, "themePrimaryColour" | "themeAccentColour" | "themeBackgroundColour" | "themeTextColour">) {
  return resolveOrgTheme(record);
}

function emptyThemeFields() {
  return {
    themePrimaryColour: "",
    themeAccentColour: "",
    themeBackgroundColour: "",
    themeTextColour: "",
  };
}
