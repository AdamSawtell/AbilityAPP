"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmployeeRecordLink } from "@/components/record-link";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import type { TimesheetRecord } from "@/lib/timesheet";
import {
  buildTimesheetApprovalQueue,
  canApproveTimesheet,
  seesAllTimesheetApprovals,
  type TimesheetApprovalBucket,
  type TimesheetApprovalQueue,
  type TimesheetApprovalScopeKind,
} from "@/lib/workforce/timesheet-approval-queue";

const bucketTone: Record<TimesheetApprovalBucket, string> = {
  ready: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  review: "bg-amber-50 text-amber-900 ring-amber-200",
  blocked: "bg-rose-50 text-rose-900 ring-rose-200",
};

const bucketLabel: Record<TimesheetApprovalBucket, string> = {
  ready: "Ready",
  review: "Review",
  blocked: "Blocked",
};

function defaultScope(scopes: TimesheetApprovalQueue["scopes"]): TimesheetApprovalScopeKind {
  return (
    scopes.find((s) => s.kind === "management-line")?.kind ??
    scopes.find((s) => s.kind === "direct-reports")?.kind ??
    scopes[0]?.kind ??
    "management-line"
  );
}

export function TimesheetApprovalView() {
  const { session, canWindow, canProcess } = useAuth();
  const { timesheets, employees, rosterShifts, locations, upsertTimesheet } = useData();
  const canView = canWindow("timesheet-approval");
  const canApprove = canProcess("approve-timesheet");

  const [scope, setScope] = useState<TimesheetApprovalScopeKind>("management-line");
  const [locationId, setLocationId] = useState("");
  const [activeBucket, setActiveBucket] = useState<TimesheetApprovalBucket | "all">("ready");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [remoteQueue, setRemoteQueue] = useState<TimesheetApprovalQueue | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const localQueue = useMemo(() => {
    if (!session || !canApprove) return null;
    return buildTimesheetApprovalQueue(
      {
        timesheets,
        employees,
        rosterShifts,
        locations,
        reviewerEmployeeId: session.employeeBpId?.trim() || null,
        seesAll: seesAllTimesheetApprovals(session),
      },
      scope,
      locationId
    );
  }, [timesheets, employees, rosterShifts, locations, session, canApprove, scope, locationId]);

  const queue = remoteQueue ?? localQueue;

  const loadRemote = useCallback(async () => {
    if (!canApprove) return;
    setLoadingRemote(true);
    setError("");
    try {
      const params = new URLSearchParams({ scope });
      if (scope === "location" && locationId) params.set("locationId", locationId);
      const res = await fetch(`/api/workforce/timesheet-approvals?${params}`, { credentials: "include" });
      const body = (await res.json()) as TimesheetApprovalQueue & { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Could not load approval queue");
      setRemoteQueue(body);
    } catch (err) {
      setRemoteQueue(null);
      setError(err instanceof Error ? err.message : "Could not load approval queue");
    } finally {
      setLoadingRemote(false);
    }
  }, [canApprove, scope, locationId]);

  useEffect(() => {
    if (!canApprove) return;
    void loadRemote();
  }, [canApprove, loadRemote]);

  useEffect(() => {
    if (!queue?.scopes.length) return;
    if (!queue.scopes.some((s) => s.kind === scope && (scope !== "location" || s.locationId === locationId))) {
      const next = defaultScope(queue.scopes);
      setScope(next);
      if (next === "location") {
        const locScope = queue.scopes.find((s) => s.kind === "location");
        setLocationId(locScope?.locationId ?? "");
      }
    }
  }, [queue?.scopes, scope, locationId]);

  const visibleItems = useMemo(() => {
    if (!queue) return [];
    if (activeBucket === "all") return queue.items;
    return queue.items.filter((item) => item.bucket === activeBucket);
  }, [queue, activeBucket]);

  const readySelectable = useMemo(
    () => visibleItems.filter((item) => item.bucket === "ready").map((item) => item.timesheetId),
    [visibleItems]
  );

  if (!canView) {
    return <p className="text-sm text-slate-500">Your role does not have access to Timesheet approval.</p>;
  }

  if (!canApprove) {
    return <p className="text-sm text-slate-500">Your role does not have permission to approve timesheets.</p>;
  }

  async function approveIds(ids: string[]) {
    if (!ids.length) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/workforce/timesheet-approvals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timesheetIds: ids, scope, locationId: scope === "location" ? locationId : undefined }),
      });
      const body = (await res.json()) as { error?: string; approved?: TimesheetRecord[] };
      if (!res.ok) throw new Error(body.error ?? "Approval failed");
      for (const sheet of body.approved ?? []) {
        upsertTimesheet(sheet);
      }
      setSelected(new Set());
      setMessage(`Approved ${body.approved?.length ?? ids.length} timesheet${ids.length === 1 ? "" : "s"}.`);
      await loadRemote();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setBusy(false);
    }
  }

  function toggleSelect(id: string, bucket: TimesheetApprovalBucket) {
    if (bucket !== "ready") return;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllReady() {
    setSelected(new Set(readySelectable));
  }

  const summary = queue?.summary ?? { ready: 0, review: 0, blocked: 0, total: 0 };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-600">
          Approve submitted timesheets in your scope. Ready rows can be bulk-approved; review and blocked rows need
          attention before approval.
        </p>
        <div className="flex flex-wrap gap-2">
          {summary.ready > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void approveIds(queue?.items.filter((i) => i.bucket === "ready").map((i) => i.timesheetId) ?? [])}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              Approve all ready ({summary.ready})
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <label className="text-sm text-slate-600">
          Scope{" "}
          <select
            value={scope === "location" ? `location:${locationId}` : scope}
            onChange={(e) => {
              const value = e.target.value;
              if (value.startsWith("location:")) {
                setScope("location");
                setLocationId(value.slice("location:".length));
              } else {
                setScope(value as TimesheetApprovalScopeKind);
                setLocationId("");
              }
              setSelected(new Set());
            }}
            className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            {(queue?.scopes ?? []).map((option) => (
              <option
                key={`${option.kind}-${option.locationId ?? ""}`}
                value={option.kind === "location" ? `location:${option.locationId}` : option.kind}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {loadingRemote ? <span className="text-xs text-slate-400">Refreshing…</span> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["ready", "review", "blocked", "all"] as const).map((key) => {
          const count = key === "all" ? summary.total : summary[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveBucket(key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                activeBucket === key ? "bg-[#fdf2f8] text-[#b51266] ring-1 ring-[#f9a8d4]" : "bg-slate-100 text-slate-600"
              }`}
            >
              {key === "all" ? "All" : bucketLabel[key]} ({count})
            </button>
          );
        })}
      </div>

      {message ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p> : null}
      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p> : null}

      {!visibleItems.length ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          No submitted timesheets in this scope{activeBucket !== "all" ? ` for ${activeBucket} approval` : ""}.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {activeBucket === "ready" && readySelectable.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
              <button type="button" onClick={selectAllReady} className="text-sm font-medium text-[#b51266] hover:underline">
                Select all ready
              </button>
              {selected.size > 0 ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void approveIds([...selected])}
                  className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  Approve selected ({selected.size})
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="divide-y divide-slate-100">
            {visibleItems.map((item) => (
              <article key={item.timesheetId} className="flex flex-wrap items-start gap-3 px-4 py-4">
                {item.bucket === "ready" ? (
                  <input
                    type="checkbox"
                    checked={selected.has(item.timesheetId)}
                    onChange={() => toggleSelect(item.timesheetId, item.bucket)}
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                    aria-label={`Select ${item.documentNo}`}
                  />
                ) : (
                  <span className="mt-1 inline-block h-4 w-4" aria-hidden />
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{item.documentNo}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${bucketTone[item.bucket]}`}>
                      {bucketLabel[item.bucket]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    <EmployeeRecordLink
                      id={item.employeeId}
                      searchKey={item.employeeSearchKey}
                      name={item.employeeName}
                      className="text-[#b51266] hover:underline"
                    />
                    {" · "}
                    {item.periodLabel}
                    {" · "}
                    {item.totalHours.toFixed(2)} h
                    {item.locationLabels.length ? ` · ${item.locationLabels.join(", ")}` : ""}
                  </p>
                  {item.blockReason ? <p className="text-sm text-rose-700">{item.blockReason}</p> : null}
                  {item.manualReviewCount > 0 && !item.blockReason ? (
                    <p className="text-sm text-amber-800">
                      {item.manualReviewCount} line{item.manualReviewCount === 1 ? "" : "s"} without roster link — verify before approving.
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={item.href}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Open
                  </Link>
                  {item.bucket === "ready" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void approveIds([item.timesheetId])}
                      className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
                    >
                      Approve
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
