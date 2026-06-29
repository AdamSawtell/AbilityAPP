"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MyWorkplaceGuard, myWorkplaceBreadcrumbs } from "@/components/my-workplace/my-workplace-guard";
import { MyWorkplaceSubnav } from "@/components/my-workplace/my-workplace-subnav";
import { useData } from "@/lib/data-store";
import type { EmployeeRecord } from "@/lib/employee";
import { dayLabels } from "@/lib/my-workplace/types";
import type { EmployeeAvailabilityRow } from "@/lib/employee";
import {
  evaluateAvailabilityHours,
  type AvailabilityHoursPolicy,
  type AvailabilityHoursSummary,
  type AvailabilityOverMaxApprovalStatus,
} from "@/lib/availability-hours-policy";
import type { AvailabilityOverMaxRequest } from "@/lib/availability-hours-policy.server";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const AVAILABILITY_OPTIONS = ["Available", "Preferred", "Unavailable"];

type LoadResponse = {
  rows: EmployeeAvailabilityRow[];
  employee?: EmployeeRecord;
  summary?: AvailabilityHoursSummary;
  policy?: Pick<AvailabilityHoursPolicy, "maxHoursPerPeriod" | "maxHoursPeriod" | "overnightHoursMode">;
  overMaxRequest?: AvailabilityOverMaxRequest | null;
};

export function MyAvailabilityPage() {
  const { upsertEmployee } = useData();
  const [rows, setRows] = useState<EmployeeAvailabilityRow[]>([]);
  const [policy, setPolicy] = useState<Pick<AvailabilityHoursPolicy, "overnightHoursMode">>({
    overnightHoursMode: "include",
  });
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
        if (data.policy) setPolicy({ overnightHoursMode: data.policy.overnightHoursMode });
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

  useEffect(() => {
    if (employeeSnapshot) return;
    void fetch("/api/my", { credentials: "include" })
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.employee) setEmployeeSnapshot(data.employee as EmployeeRecord);
      })
      .catch(() => undefined);
  }, [employeeSnapshot]);

  function updateRow(index: number, patch: Partial<EmployeeAvailabilityRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function persistAvailability(options: {
    includeOvernightHours?: boolean;
    requestOverMaxApproval?: boolean;
  } = {}) {
    if (!loaded || rows.length === 0) {
      setError("Availability is still loading — wait for your weekly pattern to appear before saving.");
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
        if (proceed) {
          await persistAvailability({ ...options, requestOverMaxApproval: true });
        }
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
          ? "Availability saved — manager approval is pending for hours above the maximum."
          : "Availability saved."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveAvailability(e: React.FormEvent) {
    e.preventDefault();
    await persistAvailability();
  }

  const summary = liveSummary ?? baselineSummary;

  return (
    <MyWorkplaceGuard windowKey="my-availability">
      <AppShell
        title="My availability"
        subtitle="Share when you are available or prefer to work."
        breadcrumbs={myWorkplaceBreadcrumbs("Availability")}
        audit={{ moduleLabel: "My availability" }}
      >
        <MyWorkplaceSubnav />

        {summary ? (
          <div
            className={`mb-4 rounded-2xl border px-5 py-4 text-sm ${
              !summary.meetsMinimum || (summary.exceedsMaximum && summary.approvalRequired)
                ? "border-amber-200 bg-amber-50 text-amber-950"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <p className="font-medium text-slate-900">Weekly hours: {summary.weeklyHours}h</p>
            <ul className="mt-2 space-y-1">
              {summary.messages.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {summary.approvalStatus === "pending" ? (
              <p className="mt-2 font-medium text-amber-900">Over-maximum approval: pending review.</p>
            ) : null}
            {summary.approvalStatus === "approved" ? (
              <p className="mt-2 font-medium text-emerald-800">Over-maximum hours: approved.</p>
            ) : null}
            {summary.approvalStatus === "declined" ? (
              <p className="mt-2 font-medium text-red-700">Over-maximum request was declined — reduce hours and save again.</p>
            ) : null}
          </div>
        ) : null}

        <form onSubmit={(e) => void saveAvailability(e)} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Weekly pattern</h2>
            <p className="mt-1 text-sm text-slate-600">
              Rostering uses this as a guide. Your pattern must meet your contracted minimum and stay within the
              organisation maximum unless a manager approves extra hours.
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {!loaded && !error ? (
              <p className="px-5 py-6 text-sm text-slate-600">Loading your weekly pattern…</p>
            ) : null}
            {loaded && rows.length === 0 ? (
              <p className="px-5 py-6 text-sm text-amber-800">
                No weekly pattern rows are available. Reload the page before saving so you don&apos;t clear your
                availability.
              </p>
            ) : null}
            {rows.map((row, index) => (
              <div key={row.id} className="grid gap-3 px-5 py-4 sm:grid-cols-5 sm:items-end">
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
                    onChange={(e) => updateRow(index, { startTime: e.target.value })}
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-slate-600">To</span>
                  <input
                    type="time"
                    className={inputClass}
                    value={row.endTime}
                    onChange={(e) => updateRow(index, { endTime: e.target.value })}
                  />
                </label>
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-slate-600">Preference</span>
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
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-slate-600">Notes</span>
                  <input
                    className={inputClass}
                    value={row.notes}
                    onChange={(e) => updateRow(index, { notes: e.target.value })}
                  />
                </label>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 px-5 py-4">
            <button
              type="submit"
              disabled={saving || !loaded || rows.length === 0}
              className="rounded-lg bg-[#d4147a] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
            >
              {saving ? "Saving…" : loaded ? "Save availability" : error ? "Couldn’t load — reload" : "Loading…"}
            </button>
            {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          </div>
        </form>
      </AppShell>
    </MyWorkplaceGuard>
  );
}
