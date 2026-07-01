/** Staff login URL that returns workers to the mobile app after sign-in. */
export function mobileLoginHref(options?: { expired?: boolean }): string {
  const params = new URLSearchParams({ next: "/m/today" });
  if (options?.expired) params.set("expired", "inactivity");
  return `/login?${params.toString()}`;
}

/** Safe internal redirect target from ?next= (blocks open redirects). */
export function safePostLoginPath(next: string | null | undefined): string {
  if (!next?.trim()) return "/";
  const path = next.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
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
