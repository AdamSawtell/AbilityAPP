"use client";

import { lifecycleLabel, normalizeLifecycleStatus, CLIENT_LIFECYCLE_BADGE_CLASS } from "@/lib/client-lifecycle";

export function ClientLifecycleBadge({ lifecycleStatus }: { lifecycleStatus: string }) {
  const key = normalizeLifecycleStatus(lifecycleStatus);
  const label = lifecycleLabel(lifecycleStatus);
  const tone = CLIENT_LIFECYCLE_BADGE_CLASS[key];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}
    >
      {label}
    </span>
  );
}
