/** Scope-aligned client lifecycle (Stage 1 — separate from AbilityERP `status`). */

export const CLIENT_LIFECYCLE_STATUSES = [
  "intake",
  "onboarding",
  "active",
  "plan_review",
  "exit",
] as const;

export type ClientLifecycleStatus = (typeof CLIENT_LIFECYCLE_STATUSES)[number];

export const CLIENT_LIFECYCLE_LABELS: Record<ClientLifecycleStatus, string> = {
  intake: "Intake",
  onboarding: "Onboarding",
  active: "Active",
  plan_review: "Plan review",
  exit: "Exit",
};

export const CLIENT_LIFECYCLE_BADGE_CLASS: Record<ClientLifecycleStatus, string> = {
  intake: "bg-slate-100 text-slate-800 ring-slate-200",
  onboarding: "bg-sky-50 text-sky-900 ring-sky-200",
  active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  plan_review: "bg-amber-50 text-amber-900 ring-amber-200",
  exit: "bg-rose-50 text-rose-900 ring-rose-200",
};

export function isClientLifecycleStatus(value: string): value is ClientLifecycleStatus {
  return (CLIENT_LIFECYCLE_STATUSES as readonly string[]).includes(value);
}

export function normalizeLifecycleStatus(value: string | undefined | null): ClientLifecycleStatus {
  const trimmed = (value ?? "").trim();
  if (isClientLifecycleStatus(trimmed)) return trimmed;
  return "intake";
}

export function lifecycleLabel(status: string): string {
  const key = normalizeLifecycleStatus(status);
  return CLIENT_LIFECYCLE_LABELS[key];
}

/** Infer lifecycle from legacy AbilityERP client status when missing. */
export function inferLifecycleFromLegacyStatus(legacyStatus: string): ClientLifecycleStatus {
  const s = legacyStatus.toLowerCase();
  if (s.includes("deceased") || s.includes("inactive") || s.includes("exiting")) return "exit";
  if (s.includes("active")) return "active";
  if (s.includes("prospect")) return "intake";
  return "intake";
}

export function isActiveLifecycle(status: string): boolean {
  const key = normalizeLifecycleStatus(status);
  return key === "active" || key === "onboarding" || key === "plan_review";
}
