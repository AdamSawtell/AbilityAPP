"use client";

import { useLayoutEffect, useState } from "react";
import type { OrgPositionReportingLineRecord } from "@/lib/org-structure";

export function OrgChartDottedLines({
  containerRef,
  lines,
  revision,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  lines: OrgPositionReportingLineRecord[];
  revision: string;
}) {
  const [paths, setPaths] = useState<{ id: string; d: string }[]>([]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !lines.length) {
      setPaths([]);
      return;
    }

    function measure() {
      const root = containerRef.current;
      if (!root) return;
      const rootRect = root.getBoundingClientRect();
      const next: { id: string; d: string }[] = [];

      for (const line of lines) {
        const fromEl = root.querySelector(`[data-org-position-id="${line.positionId}"]`);
        const toEl = root.querySelector(`[data-org-position-id="${line.reportsToPositionId}"]`);
        if (!fromEl || !toEl) continue;

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const fromCenterX = fromRect.left + fromRect.width / 2 - rootRect.left;
        const toCenterX = toRect.left + toRect.width / 2 - rootRect.left;
        const fromTop = fromRect.top - rootRect.top;
        const toBottom = toRect.bottom - rootRect.top;
        const fromBottom = fromRect.bottom - rootRect.top;
        const toTop = toRect.top - rootRect.top;

        const sameRow = Math.abs(fromTop - toTop) < 48;
        let d: string;
        if (sameRow) {
          const y = fromTop + fromRect.height / 2;
          const midX = (fromCenterX + toCenterX) / 2;
          d = `M ${fromCenterX} ${y} Q ${midX} ${y - 28}, ${toCenterX} ${y}`;
        } else if (fromTop > toTop) {
          const midY = (fromTop + toBottom) / 2;
          d = `M ${fromCenterX} ${fromTop} C ${fromCenterX} ${midY}, ${toCenterX} ${midY}, ${toCenterX} ${toBottom}`;
        } else {
          const midY = (fromBottom + toTop) / 2;
          d = `M ${fromCenterX} ${fromBottom} C ${fromCenterX} ${midY}, ${toCenterX} ${midY}, ${toCenterX} ${toTop}`;
        }

        next.push({ id: line.id, d });
      }

      setPaths(next);
    }

    measure();
    const observer = new ResizeObserver(() => measure());
    observer.observe(container);
    window.addEventListener("scroll", measure, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", measure, true);
    };
  }, [containerRef, lines, revision]);

  if (!paths.length) return null;

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
      {paths.map((path) => (
        <path
          key={path.id}
          d={path.d}
          fill="none"
          stroke="rgb(124 58 237)"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          opacity={0.75}
        />
      ))}
    </svg>
  );
}
