import type { LocationRecord } from "@/lib/location";

export type LocationAutomationEvent =
  | { type: "location.created"; location: LocationRecord }
  | { type: "location.alert_added"; location: LocationRecord; alertTitle: string };

export function locationEventsFromSave(
  location: LocationRecord,
  before?: LocationRecord
): LocationAutomationEvent[] {
  if (!before) {
    return [{ type: "location.created", location }];
  }

  const events: LocationAutomationEvent[] = [];
  const beforeIds = new Set((before.alerts ?? []).map((a) => a.id));
  for (const alert of location.alerts ?? []) {
    if (!beforeIds.has(alert.id)) {
      events.push({
        type: "location.alert_added",
        location,
        alertTitle: alert.name?.trim() || alert.alertType || "Location alert",
      });
    }
  }

  return events;
}
