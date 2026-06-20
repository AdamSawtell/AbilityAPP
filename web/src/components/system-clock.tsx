"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  formatSystemClockDate,
  formatSystemClockTime,
  formatSystemClockZone,
} from "@/lib/system-timezone";
import { useSystemTimezoneOptional } from "@/lib/system-timezone-store";

export function SystemClock({ className = "" }: { className?: string }) {
  const ctx = useSystemTimezoneOptional();
  const timezone = ctx?.timezone ?? "Australia/Sydney";
  const canConfigure = ctx?.canConfigure ?? false;
  const configureHref = ctx?.configureHref ?? "/system/settings/time-and-date";
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const dateLabel = formatSystemClockDate(now, timezone);
  const timeLabel = formatSystemClockTime(now, timezone);
  const zoneLabel = formatSystemClockZone(now, timezone);

  const content = (
    <>
      <span className="block truncate">{dateLabel}</span>
      <span className="block truncate tabular-nums">
        {timeLabel} {zoneLabel}
      </span>
    </>
  );

  return (
    <div className={`text-[10px] leading-snug text-slate-500 ${className}`} aria-live="polite">
      {canConfigure ? (
        <Link
          href={configureHref}
          className="block rounded-md transition hover:text-[#b51266]"
          title="Organisation timezone — open system settings to change"
        >
          {content}
        </Link>
      ) : (
        <div title={`Organisation time (${timezone})`}>{content}</div>
      )}
    </div>
  );
}
