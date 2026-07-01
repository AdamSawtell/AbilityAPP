/** Staff mobile login URL that returns workers to the PWA after sign-in. */
export function mobileLoginHref(options?: { expired?: boolean; next?: string }): string {
  const next = options?.next?.trim() || "/m/today";
  const params = new URLSearchParams({ next: next.startsWith("/m") ? next : "/m/today" });
  if (options?.expired) params.set("expired", "inactivity");
  return `/m/login?${params.toString()}`;
}

/** Safe internal redirect target from ?next= (blocks open redirects). */
export function safePostLoginPath(next: string | null | undefined): string {
  if (!next?.trim()) return "/";
  const path = next.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}

/** Mobile login only returns to /m/* routes. */
export function safeMobilePostLoginPath(next: string | null | undefined): string {
  const path = safePostLoginPath(next);
  if (path.startsWith("/m") && path !== "/m/login") return path;
  return "/m/today";
}

export const MOBILE_SW_SCOPE = "/m/";

/** Map desktop My workplace links to mobile PWA routes. */
export function mobileHrefFromDesktop(href: string): string {
  if (href === "/my/profile") return "/m/profile";
  if (href === "/my/availability") return "/m/availability";
  if (href === "/my/credentials") return "/m/credentials";
  if (href === "/my/leave") return "/m/leave";
  if (href === "/my/open-shifts") return "/m/open-shifts";
  return href;
}
