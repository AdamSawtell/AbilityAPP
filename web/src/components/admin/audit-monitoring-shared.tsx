export const auditInputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function AuditMetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

export function maskSensitive<T extends { ipAddress?: string; userAgent?: string; deviceInfo?: string; userMessage?: string }>(
  row: T,
  showSensitive: boolean
): T {
  if (showSensitive) return row;
  return {
    ...row,
    ipAddress: row.ipAddress ? "***.***.***.***" : "",
    userAgent: row.userAgent ? "[Restricted]" : "",
    deviceInfo: row.deviceInfo ? "[Restricted]" : "",
    userMessage: row.userMessage && row.userMessage.length > 80 ? `${row.userMessage.slice(0, 80)}… [Restricted]` : row.userMessage,
  };
}
