import type { RosterOfCareLine } from "@/lib/roster-of-care";

function parseTimeMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function rosterOfCareLineHours(line: Pick<RosterOfCareLine, "startTime" | "endTime">): number {
  const start = parseTimeMinutes(line.startTime);
  let end = parseTimeMinutes(line.endTime);
  if (end <= start) end += 24 * 60;
  return Math.round(((end - start) / 60) * 100) / 100;
}

export function rosterOfCareWeeklyHours(lines: RosterOfCareLine[]): number {
  return Math.round(lines.reduce((sum, line) => sum + rosterOfCareLineHours(line), 0) * 100) / 100;
}

export type RosterOfCarePeriodHours = {
  weekly: number;
  fortnightly: number;
  monthly: number;
  lineCount: number;
};

export function rosterOfCarePeriodHours(lines: RosterOfCareLine[]): RosterOfCarePeriodHours {
  const weekly = rosterOfCareWeeklyHours(lines);
  return {
    weekly,
    fortnightly: Math.round(weekly * 2 * 100) / 100,
    monthly: Math.round(weekly * 4 * 100) / 100,
    lineCount: lines.length,
  };
}
