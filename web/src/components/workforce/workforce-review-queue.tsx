"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import type { EmployeeRecord } from "@/lib/employee";
import type { WorkforceReviewQueue } from "@/lib/workforce/review-queue";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function WorkforceReviewQueuePanel() {
  const { canProcess } = useAuth();
  const { upsertEmployee } = useData();
  const canReviewCredentials = canProcess("review-employee-credential");
  const canApproveLeave = canProcess("approve-leave-request");
  const [queue, setQueue] = useState<WorkforceReviewQueue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function fetchQueue(): Promise<WorkforceReviewQueue> {
    const res = await fetch("/api/workforce/reviews", { credentials: "include" });
    const body = (await res.json()) as WorkforceReviewQueue & { error?: string };
    if (!res.ok) throw new Error(body.error ?? "Could not load review queue");
    return body;
  }

  async function loadQueue() {
    setLoading(true);
    setError("");
    try {
      setQueue(await fetchQueue());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load review queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canReviewCredentials && !canApproveLeave) return;
    let cancelled = false;
    void fetchQueue()
      .then((data) => {
        if (!cancelled) setQueue(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load review queue");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canReviewCredentials, canApproveLeave]);

  if (!canReviewCredentials && !canApproveLeave) return null;

  async function submitReview(payload: Record<string, unknown>, busyKey: string) {
    setBusyId(busyKey);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/workforce/reviews", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { error?: string; employee?: EmployeeRecord };
      if (!res.ok) throw new Error(body.error ?? "Review action failed");
      if (body.employee) upsertEmployee(body.employee);
      setMessage("Review saved.");
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review action failed");
    } finally {
      setBusyId("");
    }
  }

  const summary = queue?.summary;

  return (
    <section id="reviews" className="mb-10 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Review queue</h2>
            <p className="mt-1 text-sm text-slate-600">
              Pending credential reviews and leave requests waiting for a decision.
            </p>
          </div>
          {summary && summary.total > 0 ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900 ring-1 ring-amber-200">
              {summary.total} pending
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-8 px-5 py-5">
        {loading ? <p className="text-sm text-slate-500">Loading review queue…</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {canReviewCredentials ? (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Credentials pending review</h3>
            {!loading && (queue?.credentials.length ?? 0) === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No credentials waiting for HR sign-off.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {queue?.credentials.map((item) => {
                  const key = `cred-${item.credential.id}`;
                  return (
                    <article key={key} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">
                            {item.credential.credentialType}
                            {item.credential.credentialNumber ? ` · ${item.credential.credentialNumber}` : ""}
                          </p>
                          <p className="text-sm text-slate-600">
                            <Link href={`/employees/${item.employeeId}`} className="text-[#b51266] hover:underline">
                              {item.employeeName}
                            </Link>
                            {item.credential.evidenceRef ? ` · Evidence: ${item.credential.evidenceRef}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busyId === `${key}-approve`}
                            onClick={() =>
                              void submitReview(
                                {
                                  type: "credential",
                                  employeeId: item.employeeId,
                                  credentialId: item.credential.id,
                                  decision: "approve",
                                  reviewNotes: notes[key] ?? "",
                                },
                                `${key}-approve`
                              )
                            }
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busyId === `${key}-reject`}
                            onClick={() =>
                              void submitReview(
                                {
                                  type: "credential",
                                  employeeId: item.employeeId,
                                  credentialId: item.credential.id,
                                  decision: "reject",
                                  reviewNotes: notes[key] ?? "",
                                },
                                `${key}-reject`
                              )
                            }
                            className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                      <label className="mt-3 block">
                        <span className="mb-1 block text-xs font-medium text-slate-600">Review notes (optional)</span>
                        <input
                          className={inputClass}
                          value={notes[key] ?? ""}
                          onChange={(e) => setNotes((current) => ({ ...current, [key]: e.target.value }))}
                          placeholder="Feedback for the employee"
                        />
                      </label>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {canApproveLeave ? (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Leave requests pending approval</h3>
            {!loading && (queue?.leaveRequests.length ?? 0) === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No leave requests waiting for approval.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {queue?.leaveRequests.map((item) => {
                  const key = `leave-${item.request.id}`;
                  return (
                    <article key={key} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">
                            {item.request.leaveType} · {item.request.startDate} to {item.request.endDate}
                          </p>
                          <p className="text-sm text-slate-600">
                            <Link href={`/employees/${item.employeeId}`} className="text-[#b51266] hover:underline">
                              {item.employeeName}
                            </Link>
                            {" · "}
                            {item.request.daysRequested} day(s)
                            {item.request.notes ? ` · ${item.request.notes}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busyId === `${key}-approve`}
                            onClick={() =>
                              void submitReview(
                                {
                                  type: "leave",
                                  employeeId: item.employeeId,
                                  requestId: item.request.id,
                                  decision: "approve",
                                },
                                `${key}-approve`
                              )
                            }
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busyId === `${key}-decline`}
                            onClick={() =>
                              void submitReview(
                                {
                                  type: "leave",
                                  employeeId: item.employeeId,
                                  requestId: item.request.id,
                                  decision: "decline",
                                  declineReason: notes[key] ?? "Declined",
                                },
                                `${key}-decline`
                              )
                            }
                            className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 disabled:opacity-60"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                      <label className="mt-3 block">
                        <span className="mb-1 block text-xs font-medium text-slate-600">Decline reason (if declining)</span>
                        <input
                          className={inputClass}
                          value={notes[key] ?? ""}
                          onChange={(e) => setNotes((current) => ({ ...current, [key]: e.target.value }))}
                          placeholder="Optional reason shown to the employee"
                        />
                      </label>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
