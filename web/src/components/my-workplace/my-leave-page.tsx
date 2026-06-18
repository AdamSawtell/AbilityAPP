"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MyWorkplaceGuard, myWorkplaceBreadcrumbs, useMyEmployee } from "@/components/my-workplace/my-workplace-guard";
import { MyWorkplaceSubnav } from "@/components/my-workplace/my-workplace-subnav";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { useReferenceData } from "@/lib/config-store";
import type { EmployeeLeaveRequestRow, EmployeeRecord } from "@/lib/employee";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function MyLeavePage() {
  const { canProcess } = useAuth();
  const { upsertEmployee } = useData();
  const { employee: localEmployee } = useMyEmployee();
  const { getOptions } = useReferenceData();
  const leaveTypes = getOptions("leaveType");

  const [leaveRequests, setLeaveRequests] = useState<EmployeeLeaveRequestRow[]>([]);
  const [entitlements, setEntitlements] = useState(localEmployee?.leaveEntitlements ?? []);
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = canProcess("submit-leave-request");

  useEffect(() => {
    void fetch("/api/my/leave", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load leave");
        return res.json() as Promise<{ leaveRequests: EmployeeLeaveRequestRow[]; entitlements: typeof entitlements }>;
      })
      .then((data) => {
        setLeaveRequests(data.leaveRequests);
        setEntitlements(data.entitlements);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const sortedRequests = useMemo(
    () => [...leaveRequests].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [leaveRequests]
  );

  async function submitLeave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/my/leave", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveType, startDate, endDate, notes }),
      });
      const body = (await res.json()) as { error?: string; employee?: EmployeeRecord };
      if (!res.ok) throw new Error(body.error ?? "Submit failed");
      if (body.employee) upsertEmployee(body.employee);
      setLeaveRequests(body.employee?.leaveRequests ?? []);
      setLeaveType("");
      setStartDate("");
      setEndDate("");
      setNotes("");
      setMessage("Leave request submitted for manager approval.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MyWorkplaceGuard windowKey="my-leave">
      <AppShell
        title="My leave"
        subtitle="Submit requests and track approval outcomes."
        breadcrumbs={myWorkplaceBreadcrumbs("Leave")}
        audit={{ moduleLabel: "My leave" }}
      >
        <MyWorkplaceSubnav />

        {entitlements.length > 0 ? (
          <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {entitlements.map((ent) => (
              <div key={ent.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-900">{ent.leaveType}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{ent.balanceDays} days</p>
                <p className="text-xs text-slate-500">Balance · {ent.entitlementDays} entitled</p>
              </div>
            ))}
          </section>
        ) : null}

        {canSubmit ? (
          <form onSubmit={submitLeave} className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Submit leave</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Leave type</span>
                <select className={inputClass} value={leaveType} onChange={(e) => setLeaveType(e.target.value)} required>
                  <option value="">Select type</option>
                  {leaveTypes.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Start date</span>
                <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">End date</span>
                <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Notes (optional)</span>
                <textarea className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-4 rounded-lg bg-[#d4147a] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
            >
              {saving ? "Submitting…" : "Submit request"}
            </button>
            {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          </form>
        ) : (
          <p className="mb-6 text-sm text-slate-600">Your role cannot submit leave from My workplace.</p>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">My requests</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {sortedRequests.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-500">No leave requests yet.</p>
            ) : (
              sortedRequests.map((row) => (
                <div key={row.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {row.leaveType} · {row.startDate} to {row.endDate}
                    </p>
                    <p className="text-sm text-slate-600">
                      {row.daysRequested} day(s)
                      {row.notes ? ` · ${row.notes}` : ""}
                    </p>
                    {row.status === "Declined" && row.declineReason ? (
                      <p className="mt-1 text-sm text-red-600">Reason: {row.declineReason}</p>
                    ) : null}
                    {row.reviewedBy && row.status !== "Requested" ? (
                      <p className="mt-1 text-xs text-slate-500">Reviewed by {row.reviewedBy}</p>
                    ) : null}
                  </div>
                  <StatusBadge status={row.status} />
                </div>
              ))
            )}
          </div>
        </section>
      </AppShell>
    </MyWorkplaceGuard>
  );
}
