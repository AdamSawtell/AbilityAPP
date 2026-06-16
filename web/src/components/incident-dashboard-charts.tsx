"use client";

import type { CountRow, TrendPoint } from "@/lib/incident-analytics";
import type { IncidentSeverity } from "@/lib/incident";

const BAR_COLORS = ["#d4147a", "#ec4899", "#f472b6", "#fb7185", "#fda4af", "#94a3b8"];

function maxCount(rows: { count: number }[]): number {
  return Math.max(1, ...rows.map((r) => r.count));
}

export function DashboardCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function HorizontalBarChart({ rows, emptyLabel = "No data" }: { rows: CountRow[]; emptyLabel?: string }) {
  if (!rows.length) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }
  const max = maxCount(rows);
  return (
    <div className="space-y-2">
      {rows.slice(0, 10).map((row, i) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-slate-700">{row.label}</span>
            <span className="shrink-0 font-semibold text-slate-900">{row.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(row.count / max) * 100}%`,
                backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ rows, emptyLabel = "No data" }: { rows: CountRow[]; emptyLabel?: string }) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  if (!total) return <p className="text-sm text-slate-500">{emptyLabel}</p>;

  const segments = rows.reduce<
    { label: string; count: number; pct: number; start: number; color: string }[]
  >((acc, row, i) => {
    const pct = row.count / total;
    const start = acc.length ? acc[acc.length - 1].start + acc[acc.length - 1].pct : 0;
    acc.push({ ...row, pct, start, color: BAR_COLORS[i % BAR_COLORS.length] });
    return acc;
  }, []);

  const gradient = segments
    .map((s) => `${s.color} ${s.start * 100}% ${(s.start + s.pct) * 100}%`)
    .join(", ");

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div
        className="relative h-36 w-36 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
        aria-hidden
      >
        <div className="absolute inset-5 rounded-full bg-white" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-slate-900">{total}</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="truncate text-slate-700">{s.label}</span>
            <span className="ml-auto shrink-0 text-slate-500">
              {s.count} ({Math.round(s.pct * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LineTrendChart({ points, emptyLabel = "No data" }: { points: TrendPoint[]; emptyLabel?: string }) {
  if (!points.length) return <p className="text-sm text-slate-500">{emptyLabel}</p>;

  const max = maxCount(points);
  const width = 480;
  const height = 160;
  const padX = 8;
  const padY = 12;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const coords = points.map((p, i) => {
    const x = padX + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = padY + innerH - (p.count / max) * innerH;
    return { x, y, ...p };
  });

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" role="img" aria-label="Incident trend">
        <polyline
          fill="none"
          stroke="#d4147a"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={polyline}
        />
        {coords.map((c) => (
          <circle key={c.label} cx={c.x} cy={c.y} r="3.5" fill="#d4147a" />
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
        {coords.map((c) => (
          <span key={c.label}>
            {c.label}: {c.count}
          </span>
        ))}
      </div>
    </div>
  );
}

const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  Low: "#dbeafe",
  Medium: "#fef3c7",
  High: "#fed7aa",
  Critical: "#fecaca",
};

const SEVERITY_INTENSE: Record<IncidentSeverity, string> = {
  Low: "#3b82f6",
  Medium: "#d97706",
  High: "#ea580c",
  Critical: "#dc2626",
};

export function SeverityHeatMap({
  categories,
  severities,
  matrix,
}: {
  categories: string[];
  severities: IncidentSeverity[];
  matrix: number[][];
}) {
  if (!categories.length) {
    return <p className="text-sm text-slate-500">No data in this date range.</p>;
  }
  const max = Math.max(1, ...matrix.flat());

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] border-collapse text-xs">
        <thead>
          <tr>
            <th className="pb-2 pr-2 text-left font-medium text-slate-500">Category</th>
            {severities.map((s) => (
              <th key={s} className="px-1 pb-2 text-center font-medium text-slate-500">
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat, row) => (
            <tr key={cat}>
              <td className="max-w-[120px] truncate py-1 pr-2 text-slate-700">{cat}</td>
              {severities.map((sev, col) => {
                const value = matrix[row][col];
                const intensity = value / max;
                return (
                  <td key={sev} className="p-0.5">
                    <div
                      className="flex h-9 min-w-[2.5rem] items-center justify-center rounded-md text-[11px] font-semibold"
                      style={{
                        backgroundColor: value ? SEVERITY_INTENSE[sev] : SEVERITY_COLORS[sev],
                        color: value && intensity > 0.35 ? "#fff" : "#334155",
                        opacity: value ? 0.35 + intensity * 0.65 : 0.45,
                      }}
                      title={`${cat} · ${sev}: ${value}`}
                    >
                      {value || "—"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RankedEntityList({ rows, emptyLabel = "No data" }: { rows: CountRow[]; emptyLabel?: string }) {
  if (!rows.length) return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  return (
    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
      {rows.slice(0, 8).map((row) => (
        <li key={row.label} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
          {row.href ? (
            <a href={row.href} className="truncate font-medium text-[#b51266] hover:underline">
              {row.label}
            </a>
          ) : (
            <span className="truncate text-slate-800">{row.label}</span>
          )}
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {row.count}
          </span>
        </li>
      ))}
    </ul>
  );
}
