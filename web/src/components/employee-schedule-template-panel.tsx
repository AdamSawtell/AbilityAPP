"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import type { EmployeeAvailabilityRow } from "@/lib/employee";
import { dayLabels } from "@/lib/my-workplace/types";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const AVAILABILITY_OPTIONS = ["Available", "Preferred", "Unavailable"];

export function EmployeeScheduleTemplatePanel({
  employeeId,
  readOnly = false,
}: {
  employeeId: string;
  readOnly?: boolean;
}) {
  const { canWriteWindow } = useAuth();
  const canEdit = !readOnly && canWriteWindow("workforce-planning");
  const [rows, setRows] = useState<EmployeeAvailabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const labels = dayLabels();

  useEffect(() => {
    setLoading(true);
    void fetch(`/api/workforce/availability?employeeId=${encodeURIComponent(employeeId)}`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load availability");
        return res.json() as Promise<{ rows: EmployeeAvailabilityRow[] }>;
      })
      .then((data) => setRows(data.rows))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [employeeId]);

  function updateRow(index: number, patch: Partial<EmployeeAvailabilityRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/workforce/availability", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, rows }),
      });
      const body = (await res.json()) as { error?: string; employee?: { id: string } };
      if (!res.ok) throw new Error(body.error ?? "Save failed");
      setMessage("Schedule template saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-600">Loading schedule template…</p>;

  return (
    <form onSubmit={save} className="space-y-4">
      <p className="text-sm text-slate-600">
        Weekly working pattern for rostering — workers can also update this from My workplace → Availability.
      </p>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
        {rows.map((row, index) => (
          <div key={row.id} className="grid gap-3 px-4 py-4 sm:grid-cols-5 sm:items-end">
            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-600">Day</p>
              <p className="text-sm font-medium text-slate-900">{labels[row.dayOfWeek] ?? `Day ${row.dayOfWeek}`}</p>
            </div>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">From</span>
              <input
                type="time"
                className={inputClass}
                value={row.startTime}
                disabled={!canEdit}
                onChange={(e) => updateRow(index, { startTime: e.target.value })}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">To</span>
              <input
                type="time"
                className={inputClass}
                value={row.endTime}
                disabled={!canEdit}
                onChange={(e) => updateRow(index, { endTime: e.target.value })}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Preference</span>
              <select
                className={inputClass}
                value={row.availability}
                disabled={!canEdit}
                onChange={(e) => updateRow(index, { availability: e.target.value })}
              >
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Notes</span>
              <input
                type="text"
                className={inputClass}
                value={row.notes}
                disabled={!canEdit}
                onChange={(e) => updateRow(index, { notes: e.target.value })}
              />
            </label>
          </div>
        ))}
      </div>
      {canEdit ? (
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save schedule template"}
        </button>
      ) : null}
      {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
      {error ? <p className="text-sm text-rose-800">{error}</p> : null}
    </form>
  );
}
