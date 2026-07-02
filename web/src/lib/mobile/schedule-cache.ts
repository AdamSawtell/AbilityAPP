export function formatScheduleCacheAge(iso: string | null | undefined): string {
  if (!iso?.trim()) return "unknown time";
  try {
    return new Date(iso).toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
