"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileAuthGuard } from "@/components/mobile/mobile-auth-guard";
import { MobileEmployeeShell } from "@/components/mobile/mobile-employee-shell";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { useReferenceData } from "@/lib/config-store";
import type { EmployeeLeaveRequestRow, EmployeeRecord } from "@/lib/employee";
import { SAVE_TOAST_MESSAGES, showSuccessToast } from "@/lib/toast";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function MobileLeavePage() {
  const { canWindow } = useAuth();
  const { upsertEmployee } = useData();
  const { getOptions } = useReferenceData();
  const leaveTypes = getOptions("leaveType");

  const [leaveRequests, setLeaveRequests] = useState<EmployeeLeaveRequestRow[]>([]);
  const [entitlements, setEntitlements] = useState<EmployeeRecord["leaveEntitlements"]>([]);
  const [policyHint, setPolicyHint] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = canWindow("my-leave");

  useEffect(() => {
    void fetch("/api/my/leave", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load leave");
        return res.json() as Promise<{
          leaveRequests: EmployeeLeaveRequestRow[];
          entitlements: EmployeeRecord["leaveEntitlements"];
          selfServicePolicyHint?: string;
        }>;
      })
      .then((data) => {
        setLeaveRequests(data.leaveRequests);
        setEntitlements(data.entitlements);
        setPolicyHint(data.selfServicePolicyHint ?? "");
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
      showSuccessToast(SAVE_TOAST_MESSAGES.leaveSubmit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MobileAuthGuard windowKey="my-leave">
      <MobileEmployeeShell title="Leave" subtitle="Submit and track requests">
        {entitlements.length > 0 ? (
          <div className="mb-4 grid gap-2">
            {entitlements.map((ent) => (
              <div key={ent.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-sm font-medium text-slate-900">{ent.leaveType}</p>
                <p className="text-xl font-semibold text-slate-900">{ent.balanceDays} days</p>
                <p className="text-xs text-slate-500">{ent.entitlementDays} entitled</p>
              </div>
            ))}
          </div>
        ) : null}

        {canSubmit ? (
          <form onSubmit={submitLeave} className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-slate-900">Submit leave</h2>
            {policyHint ? <p className="mt-2 text-sm text-slate-600">{policyHint}</p> : null}
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Leave type</span>
                <select className={inputClass} value={leaveType} onChange={(e) => setLeaveType(e.target.value)} required>
                  <option value="">Select type</option>
                  {leaveTypes.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Start date</span>
                <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">End date</span>
                <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Notes (optional)</span>
                <textarea className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-4 min-h-11 w-full rounded-xl bg-[#b51266] text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Submitting…" : "Submit request"}
            </button>
            {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          </form>
        ) : (
          <p className="mb-4 text-sm text-slate-600">Your role cannot submit leave from My Workplace.</p>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold text-slate-900">My requests</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {!sortedRequests.length ? (
              <p className="px-4 py-6 text-sm text-slate-600">No leave requests yet.</p>
            ) : (
              sortedRequests.map((row) => (
                <div key={row.id} className="space-y-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-900">
                      {row.leaveType} · {row.startDate} to {row.endDate}
                    </p>
                    <StatusBadge status={row.status} />
                  </div>
                  <p className="text-sm text-slate-600">
                    {row.daysRequested} day(s)
                    {row.notes ? ` · ${row.notes}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </MobileEmployeeShell>
    </MobileAuthGuard>
  );
}
