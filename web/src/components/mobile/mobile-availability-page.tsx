"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileAuthGuard } from "@/components/mobile/mobile-auth-guard";
import { MobileEmployeeShell } from "@/components/mobile/mobile-employee-shell";
import { useData } from "@/lib/data-store";
import type { EmployeeRecord } from "@/lib/employee";
import { dayLabels } from "@/lib/my-workplace/types";
import type { EmployeeAvailabilityRow } from "@/lib/employee";
import {
  evaluateAvailabilityHours,
  type AvailabilityHoursSummary,
  type AvailabilityOverMaxApprovalStatus,
} from "@/lib/availability-hours-policy";
import type { AvailabilityOverMaxRequest } from "@/lib/availability-hours-policy.server";
import { SAVE_TOAST_MESSAGES, showSuccessToast } from "@/lib/toast";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const AVAILABILITY_OPTIONS = ["Available", "Preferred", "Unavailable"];

type LoadResponse = {
  rows: EmployeeAvailabilityRow[];
  employee?: EmployeeRecord;
  summary?: AvailabilityHoursSummary;
  policy?: { overnightHoursMode?: "include" | "exclude" };
  overMaxRequest?: AvailabilityOverMaxRequest | null;
};

export function MobileAvailabilityPage() {
  const { upsertEmployee } = useData();
  const [rows, setRows] = useState<EmployeeAvailabilityRow[]>([]);
  const [policy, setPolicy] = useState<{ overnightHoursMode: "include" | "exclude" }>({ overnightHoursMode: "include" });
  const [baselineSummary, setBaselineSummary] = useState<AvailabilityHoursSummary | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<AvailabilityOverMaxApprovalStatus>("none");
  const [approvedWeeklyHours, setApprovedWeeklyHours] = useState(0);
  const [employeeSnapshot, setEmployeeSnapshot] = useState<EmployeeRecord | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const labels = dayLabels();

  useEffect(() => {
    void fetch("/api/my/availability", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load availability");
        return res.json() as Promise<LoadResponse>;
      })
      .then((data) => {
        setRows(data.rows);
        if (data.employee) setEmployeeSnapshot(data.employee);
        if (data.summary) setBaselineSummary(data.summary);
        if (data.policy?.overnightHoursMode) setPolicy({ overnightHoursMode: data.policy.overnightHoursMode });
        const req = data.overMaxRequest;
        setApprovalStatus(req?.status ?? "none");
        setApprovedWeeklyHours(req?.status === "approved" ? req.weeklyHours : 0);
        setLoaded(true);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const liveSummary = useMemo(() => {
    if (!baselineSummary || !employeeSnapshot) return baselineSummary;
    return evaluateAvailabilityHours({
      employee: employeeSnapshot,
      rows,
      policy: {
        maxHoursPerPeriod: baselineSummary.maxHoursPerPeriod,
        maxHoursPeriod: baselineSummary.maxPeriod,
        overMaxApprovalRoleId: "",
        overnightHoursMode: policy.overnightHoursMode,
      },
      approvalStatus,
      approvedWeeklyHours,
    });
  }, [baselineSummary, employeeSnapshot, rows, policy.overnightHoursMode, approvalStatus, approvedWeeklyHours]);

  function updateRow(index: number, patch: Partial<EmployeeAvailabilityRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function persistAvailability(options: {
    includeOvernightHours?: boolean;
    requestOverMaxApproval?: boolean;
  } = {}) {
    if (!loaded || rows.length === 0) {
      setError("Availability is still loading — wait before saving.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/my/availability", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows,
          includeOvernightHours: options.includeOvernightHours,
          requestOverMaxApproval: options.requestOverMaxApproval,
        }),
      });
      const body = (await res.json()) as {
        error?: string;
        code?: string;
        summary?: AvailabilityHoursSummary;
        employee?: EmployeeRecord;
        rows?: EmployeeAvailabilityRow[];
        overMaxRequest?: AvailabilityOverMaxRequest;
      };

      if (res.status === 409 && body.code === "OVER_MAX_REQUIRES_APPROVAL") {
        const proceed = window.confirm(
          `${body.error ?? "Availability exceeds the organisation maximum."}\n\nSubmit for manager approval and save anyway?`
        );
        if (proceed) await persistAvailability({ ...options, requestOverMaxApproval: true });
        return;
      }

      if (res.status === 400 && body.code === "OVERNIGHT_CONFIRM_REQUIRED") {
        const include = window.confirm(
          "Some days span overnight (end time before start time). Include those hours in your weekly total?"
        );
        await persistAvailability({
          includeOvernightHours: include,
          requestOverMaxApproval: options.requestOverMaxApproval,
        });
        return;
      }

      if (!res.ok) throw new Error(body.error ?? "Save failed");

      if (body.employee) {
        upsertEmployee(body.employee);
        setEmployeeSnapshot(body.employee);
      }
      setRows(body.rows ?? rows);
      if (body.summary) setBaselineSummary(body.summary);
      if (body.overMaxRequest) {
        setApprovalStatus(body.overMaxRequest.status);
        setApprovedWeeklyHours(body.overMaxRequest.status === "approved" ? body.overMaxRequest.weeklyHours : 0);
      }
      setMessage(
        body.overMaxRequest?.status === "pending"
          ? "Saved — manager approval pending for hours above the maximum."
          : "Availability saved."
      );
      showSuccessToast(
        body.overMaxRequest?.status === "pending"
          ? "Availability saved — approval pending ✓"
          : SAVE_TOAST_MESSAGES.availability
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const summary = liveSummary ?? baselineSummary;

  return (
    <MobileAuthGuard windowKey="my-availability">
      <MobileEmployeeShell title="Availability" subtitle="When you can work">
        {summary ? (
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              !summary.meetsMinimum || (summary.exceedsMaximum && summary.approvalRequired)
                ? "border-amber-200 bg-amber-50 text-amber-950"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <p className="font-medium">Weekly hours: {summary.weeklyHours}h</p>
            <ul className="mt-2 space-y-1">
              {summary.messages.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void persistAvailability();
          }}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="font-semibold text-slate-900">Weekly pattern</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {!loaded && !error ? <p className="px-4 py-6 text-sm text-slate-500">Loading…</p> : null}
            {rows.map((row, index) => (
              <div key={row.id} className="space-y-2 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{labels[row.dayOfWeek] ?? `Day ${row.dayOfWeek}`}</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-xs text-slate-600">From</span>
                    <input
                      type="time"
                      className={inputClass}
                      value={row.startTime}
                      onChange={(e) => updateRow(index, { startTime: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-slate-600">To</span>
                    <input
                      type="time"
                      className={inputClass}
                      value={row.endTime}
                      onChange={(e) => updateRow(index, { endTime: e.target.value })}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-600">Preference</span>
                  <select
                    className={inputClass}
                    value={row.availability}
                    onChange={(e) => updateRow(index, { availability: e.target.value })}
                  >
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 px-4 py-4">
            <button
              type="submit"
              disabled={saving || !loaded || rows.length === 0}
              className="min-h-11 w-full rounded-xl bg-[#b51266] text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save availability"}
            </button>
            {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          </div>
        </form>
      </MobileEmployeeShell>
    </MobileAuthGuard>
  );
}
