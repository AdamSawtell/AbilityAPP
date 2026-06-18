"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MyWorkplaceGuard, myWorkplaceBreadcrumbs } from "@/components/my-workplace/my-workplace-guard";
import { MyWorkplaceSubnav } from "@/components/my-workplace/my-workplace-subnav";
import { useData } from "@/lib/data-store";
import type { EmployeeRecord } from "@/lib/employee";
import { dayLabels } from "@/lib/my-workplace/types";
import type { EmployeeAvailabilityRow } from "@/lib/employee";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const AVAILABILITY_OPTIONS = ["Available", "Preferred", "Unavailable"];

export function MyAvailabilityPage() {
  const { upsertEmployee } = useData();
  const [rows, setRows] = useState<EmployeeAvailabilityRow[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const labels = dayLabels();

  useEffect(() => {
    void fetch("/api/my/availability", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load availability");
        return res.json() as Promise<{ rows: EmployeeAvailabilityRow[] }>;
      })
      .then((data) => setRows(data.rows))
      .catch((err: Error) => setError(err.message));
  }, []);

  function updateRow(index: number, patch: Partial<EmployeeAvailabilityRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function saveAvailability(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/my/availability", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const body = (await res.json()) as { error?: string; employee?: EmployeeRecord; rows?: EmployeeAvailabilityRow[] };
      if (!res.ok) throw new Error(body.error ?? "Save failed");
      if (body.employee) upsertEmployee(body.employee);
      setRows(body.rows ?? rows);
      setMessage("Availability saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MyWorkplaceGuard windowKey="my-availability">
      <AppShell
        title="My availability"
        subtitle="Share when you are available or prefer to work."
        breadcrumbs={myWorkplaceBreadcrumbs("Availability")}
        audit={{ moduleLabel: "My availability" }}
      >
        <MyWorkplaceSubnav />
        <form onSubmit={saveAvailability} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Weekly pattern</h2>
            <p className="mt-1 text-sm text-slate-600">Rostering will use this as a guide when building shifts.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <div key={row.id} className="grid gap-3 px-5 py-4 sm:grid-cols-5 sm:items-end">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-slate-600">Day</p>
                  <p className="text-sm font-medium text-slate-900">{labels[row.dayOfWeek] ?? `Day ${row.dayOfWeek}`}</p>
                </div>
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-slate-600">From</span>
                  <input type="time" className={inputClass} value={row.startTime} onChange={(e) => updateRow(index, { startTime: e.target.value })} />
                </label>
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-slate-600">To</span>
                  <input type="time" className={inputClass} value={row.endTime} onChange={(e) => updateRow(index, { endTime: e.target.value })} />
                </label>
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-slate-600">Preference</span>
                  <select className={inputClass} value={row.availability} onChange={(e) => updateRow(index, { availability: e.target.value })}>
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-slate-600">Notes</span>
                  <input className={inputClass} value={row.notes} onChange={(e) => updateRow(index, { notes: e.target.value })} />
                </label>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 px-5 py-4">
            <button type="submit" disabled={saving} className="rounded-lg bg-[#d4147a] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60">
              {saving ? "Saving…" : "Save availability"}
            </button>
            {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          </div>
        </form>
      </AppShell>
    </MyWorkplaceGuard>
  );
}
