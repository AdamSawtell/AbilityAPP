import { localDateIso } from "@/lib/booking-cancellation";

export function parseRecordMoney(value: string | undefined): number {
  const n = parseFloat(String(value ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function formatRecordMoneyCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `$${Math.round(value / 1000)}k`;
  return `$${value.toLocaleString("en-AU", { maximumFractionDigits: 0 })}`;
}

export function daysUntilIsoDate(isoDate: string): number | null {
  const trimmed = isoDate?.trim();
  if (!trimmed) return null;
  const today = localDateIso();
  return Math.floor(
    (new Date(`${trimmed}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function isWithinDays(isoDate: string, maxDays: number): boolean {
  const days = daysUntilIsoDate(isoDate);
  return days !== null && days >= 0 && days <= maxDays;
}

export function isOnOrBeforeToday(isoDate: string): boolean {
  const days = daysUntilIsoDate(isoDate);
  return days !== null && days <= 0;
}
