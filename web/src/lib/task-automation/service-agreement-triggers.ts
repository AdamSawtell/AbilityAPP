import type { ClientRecord } from "@/lib/client";
import type { ServiceAgreementRecord } from "@/lib/service-agreement";

export const AGREEMENT_EXPIRY_WARNING_DAYS = 60;

export type ServiceAgreementAutomationEvent = {
  type: "service-agreement.expiring";
  agreement: ServiceAgreementRecord;
  client: ClientRecord | null;
  daysUntilFinish: number;
};

function daysUntil(dateIso: string, now = new Date()): number | null {
  if (!dateIso?.trim()) return null;
  const day = dateIso.slice(0, 10);
  const target = new Date(`${day}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date(`${now.toISOString().slice(0, 10)}T12:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const EXPIRY_SCAN_STATUSES = new Set(["Active", "Signed"]);

export function scheduledServiceAgreementExpiryCandidates(
  agreements: ServiceAgreementRecord[],
  clients: ClientRecord[],
  withinDays = AGREEMENT_EXPIRY_WARNING_DAYS,
  now = new Date()
): ServiceAgreementAutomationEvent[] {
  const events: ServiceAgreementAutomationEvent[] = [];

  for (const agreement of agreements) {
    if (!EXPIRY_SCAN_STATUSES.has(agreement.status)) continue;
    if (!agreement.finishDate?.trim()) continue;
    const remaining = daysUntil(agreement.finishDate, now);
    if (remaining === null || remaining < 0 || remaining > withinDays) continue;
    const client = clients.find((c) => c.id === agreement.clientId) ?? null;
    events.push({
      type: "service-agreement.expiring",
      agreement,
      client,
      daysUntilFinish: remaining,
    });
  }

  return events;
}
