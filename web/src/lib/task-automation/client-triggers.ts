import type { ClientRecord } from "@/lib/client";

export type ClientAutomationEvent =
  | { type: "client.created"; client: ClientRecord }
  | { type: "client.updated"; client: ClientRecord; before?: ClientRecord }
  | { type: "client.alert_added"; client: ClientRecord; alertTitle: string };

export function clientEventsFromSave(
  client: ClientRecord,
  before?: ClientRecord
): ClientAutomationEvent[] {
  if (!before) {
    return [{ type: "client.created", client }];
  }

  const events: ClientAutomationEvent[] = [{ type: "client.updated", client, before }];

  const beforeIds = new Set((before.alerts ?? []).map((a) => a.id));
  for (const alert of client.alerts ?? []) {
    if (!beforeIds.has(alert.id)) {
      events.push({
        type: "client.alert_added",
        client,
        alertTitle: alert.name?.trim() || alert.alertType || "Client alert",
      });
    }
  }

  return events;
}
