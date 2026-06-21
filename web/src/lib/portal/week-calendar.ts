import { addDaysIso } from "@/lib/roster-shift";
import type { PortalServiceItem } from "@/lib/portal/types";

export function portalWeekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDaysIso(weekStart, index));
}

export function groupPortalServicesByWeek(
  services: PortalServiceItem[],
  weekStart: string
): Map<string, PortalServiceItem[]> {
  const end = addDaysIso(weekStart, 6);
  const map = new Map<string, PortalServiceItem[]>();

  for (const day of portalWeekDays(weekStart)) {
    map.set(day, []);
  }

  for (const item of services) {
    if (item.shiftDate < weekStart || item.shiftDate > end) continue;
    map.get(item.shiftDate)?.push(item);
  }

  for (const [day, items] of map) {
    items.sort((a, b) => `${a.startTime}`.localeCompare(`${b.startTime}`));
    map.set(day, items);
  }

  return map;
}

export function countPortalServicesInWeek(services: PortalServiceItem[], weekStart: string): number {
  const end = addDaysIso(weekStart, 6);
  return services.filter((item) => item.shiftDate >= weekStart && item.shiftDate <= end).length;
}
