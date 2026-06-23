/** Public site origin for magic links and absolute URLs on Amplify / custom domains. */
export function requestPublicOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;

  return new URL(request.url).origin;
}
