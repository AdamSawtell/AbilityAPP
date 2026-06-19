export function parseUserAgent(ua: string): { browser: string; deviceInfo: string } {
  const raw = ua.trim() || "Unknown";
  let browser = "Unknown browser";
  if (/Edg\//i.test(raw)) browser = "Microsoft Edge";
  else if (/Chrome\//i.test(raw) && !/Chromium/i.test(raw)) browser = "Google Chrome";
  else if (/Firefox\//i.test(raw)) browser = "Mozilla Firefox";
  else if (/Safari\//i.test(raw) && !/Chrome/i.test(raw)) browser = "Apple Safari";
  else if (/MSIE|Trident/i.test(raw)) browser = "Internet Explorer";

  let deviceInfo = "Desktop";
  if (/Mobile|Android|iPhone|iPod/i.test(raw)) deviceInfo = "Mobile";
  else if (/iPad|Tablet/i.test(raw)) deviceInfo = "Tablet";
  else if (/Windows/i.test(raw)) deviceInfo = "Desktop — Windows";
  else if (/Macintosh|Mac OS/i.test(raw)) deviceInfo = "Desktop — macOS";
  else if (/Linux/i.test(raw)) deviceInfo = "Desktop — Linux";

  return { browser, deviceInfo };
}

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded?.trim()) return forwarded.split(",")[0]?.trim() ?? "";
  return request.headers.get("x-real-ip")?.trim() ?? "127.0.0.1";
}
