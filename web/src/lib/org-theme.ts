import type { OrganizationRecord } from "@/lib/organization";

/** System default brand palette (AbilityVua pink). */
export const SYSTEM_BRAND = {
  primary: "#d4147a",
  accent: "#5b215c",
  background: "#f4f6f8",
  text: "#0f172a",
} as const;

export type OrgThemeFields = {
  themePrimaryColour: string;
  themeAccentColour: string;
  themeBackgroundColour: string;
  themeTextColour: string;
};

export type ResolvedOrgTheme = {
  primary: string;
  accent: string;
  background: string;
  text: string;
  /** True when any field was explicitly set on the org record. */
  customized: boolean;
};

const HEX_RE = /^#([0-9a-fA-F]{6})$/;

export function normalizeHexColour(value: string | undefined | null): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!HEX_RE.test(withHash)) return "";
  return withHash.toLowerCase();
}

export function resolveOrgTheme(org: Pick<OrganizationRecord, keyof OrgThemeFields>): ResolvedOrgTheme {
  const primary = normalizeHexColour(org.themePrimaryColour) || SYSTEM_BRAND.primary;
  const accent = normalizeHexColour(org.themeAccentColour) || SYSTEM_BRAND.accent;
  const background = normalizeHexColour(org.themeBackgroundColour) || SYSTEM_BRAND.background;
  const text = normalizeHexColour(org.themeTextColour) || SYSTEM_BRAND.text;
  const customized = Boolean(
    normalizeHexColour(org.themePrimaryColour) ||
      normalizeHexColour(org.themeAccentColour) ||
      normalizeHexColour(org.themeBackgroundColour) ||
      normalizeHexColour(org.themeTextColour)
  );
  return { primary, accent, background, text, customized };
}

/** CSS custom properties written to :root for app-wide theming. */
export function orgThemeCssProperties(theme: ResolvedOrgTheme): Record<string, string> {
  return {
    "--brand-primary": theme.primary,
    "--brand-accent": theme.accent,
    "--brand-background": theme.background,
    "--brand-text": theme.text,
    "--background": theme.background,
    "--foreground": theme.text,
  };
}

export function applyOrgThemeToElement(el: HTMLElement, theme: ResolvedOrgTheme) {
  const props = orgThemeCssProperties(theme);
  for (const [key, value] of Object.entries(props)) {
    el.style.setProperty(key, value);
  }
}

export function clearOrgThemeFromElement(el: HTMLElement) {
  for (const key of ["--brand-primary", "--brand-accent", "--brand-background", "--brand-text"]) {
    el.style.removeProperty(key);
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHexColour(hex);
  if (!normalized) return null;
  const n = parseInt(normalized.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ThemeContrastWarning = {
  id: string;
  message: string;
  severity: "warning" | "error";
};

/** WCAG AA checks for common theme pairings. Warn only — do not block save. */
export function orgThemeContrastWarnings(theme: ResolvedOrgTheme): ThemeContrastWarning[] {
  const warnings: ThemeContrastWarning[] = [];
  const white = "#ffffff";
  const primaryOnWhite = contrastRatio(theme.primary, white);
  const textOnBg = contrastRatio(theme.text, theme.background);
  const primaryOnBg = contrastRatio(theme.primary, theme.background);

  if (primaryOnWhite < 4.5) {
    warnings.push({
      id: "primary-on-white",
      severity: primaryOnWhite < 3 ? "error" : "warning",
      message: `Primary colour on white buttons may be hard to read (contrast ${primaryOnWhite.toFixed(1)}:1; WCAG AA needs 4.5:1).`,
    });
  }
  if (textOnBg < 4.5) {
    warnings.push({
      id: "text-on-background",
      severity: textOnBg < 3 ? "error" : "warning",
      message: `Text on background may be hard to read (contrast ${textOnBg.toFixed(1)}:1).`,
    });
  }
  if (primaryOnBg < 3 && primaryOnBg >= 0) {
    warnings.push({
      id: "primary-on-background",
      severity: "warning",
      message: `Primary links on the workspace background may be low contrast (${primaryOnBg.toFixed(1)}:1).`,
    });
  }
  return warnings;
}

export const THEME_PRESET_SWATCHES = [
  { label: "AbilityVua default", primary: "#d4147a", accent: "#5b215c" },
  { label: "Teal care", primary: "#0d9488", accent: "#134e4a" },
  { label: "Blue health", primary: "#2563eb", accent: "#1e3a8a" },
  { label: "Purple community", primary: "#7c3aed", accent: "#4c1d95" },
  { label: "Green growth", primary: "#16a34a", accent: "#14532d" },
] as const;

export function emptyOrgThemeFields(): OrgThemeFields {
  return {
    themePrimaryColour: "",
    themeAccentColour: "",
    themeBackgroundColour: "",
    themeTextColour: "",
  };
}
