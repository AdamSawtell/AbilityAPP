"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AdminMessageBody } from "@/components/communications/admin-message-body";
import { useAdminPageAccess } from "@/lib/access/window-surface";
import { useAuth } from "@/lib/auth-store";
import type {
  AdminMessageComposePayload,
  AdminMessageRecipientRow,
  AdminMessageSummary,
} from "@/lib/admin-communications/types";
import { defaultRecurrence } from "@/lib/admin-communications/types";

type RoleOption = { id: string; name: string };

const emptyCompose = (): AdminMessageComposePayload => ({
  title: "",
  body: "",
  audienceType: "all",
  audienceRoleIds: [],
  requiresAcknowledgment: true,
  displayMethod: "modal",
  publishAt: null,
  expiresAt: null,
  recurrence: defaultRecurrence(),
});

function statusBadge(status: string) {
  const tones: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    scheduled: "bg-sky-100 text-sky-800",
    closed: "bg-slate-100 text-slate-700",
    expired: "bg-amber-100 text-amber-800",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${tones[status] ?? tones.closed}`}>
      {status}
    </span>
  );
}

export function CommunicationsHubAdminView() {
  const { hasAccess } = useAdminPageAccess("workspace");
  const { users, roles, session } = useAuth();
  const [messages, setMessages] = useState<AdminMessageSummary[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [register, setRegister] = useState<AdminMessageRecipientRow[]>([]);
  const [tab, setTab] = useState<"compose" | "history">("compose");
  const [compose, setCompose] = useState<AdminMessageComposePayload>(emptyCompose);
  const [preview, setPreview] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const res = await fetch("/api/admin/communications");
      if (!res.ok) throw new Error("Could not load messages.");
      const data = (await res.json()) as { messages: AdminMessageSummary[]; roles: RoleOption[] };
      setMessages(data.messages ?? []);
      setRoleOptions(data.roles ?? roles.map((r) => ({ id: r.id, name: r.name })));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load messages.");
    }
  }, [roles]);

  const loadDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/communications/${id}`);
    if (!res.ok) return;
    const data = (await res.json()) as { message: AdminMessageSummary; register: AdminMessageRecipientRow[] };
    setRegister(data.register ?? []);
    setMessages((prev) => prev.map((m) => (m.id === id ? data.message : m)));
  }, []);

  useEffect(() => {
    if (hasAccess("admin-communications")) void load();
  }, [hasAccess, load]);

  const recipientEstimate = useMemo(() => {
    const activeUsers = users.filter((u) => u.active && u.id !== session?.userId);
    if (compose.audienceType === "all") return activeUsers.length;
    const roleSet = new Set(compose.audienceRoleIds);
    return activeUsers.filter((u) => u.roleIds.some((id) => roleSet.has(id))).length;
  }, [compose.audienceType, compose.audienceRoleIds, users, session?.userId]);

  const selected = messages.find((m) => m.id === activeId) ?? null;

  async function publish() {
    setSaveState("saving");
    setSaveError("");
    try {
      const res = await fetch("/api/admin/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", payload: compose }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not publish message.");
      setSaveState("saved");
      setCompose(emptyCompose());
      setPreview(false);
      setTab("history");
      await load();
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "Could not publish message.");
    }
  }

  async function messageAction(action: "close" | "reopen" | "remind", messageId: string) {
    const res = await fetch("/api/admin/communications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, messageId }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setSaveError(data.error ?? "Action failed.");
      return;
    }
    await load();
    await loadDetail(messageId);
  }

  if (!hasAccess("admin-communications")) {
    return (
      <AppShell title="Communications" audit={{ moduleLabel: "Communications" }}>
        <p className="text-sm text-slate-600">You do not have access to the Communications hub.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Communications hub"
      subtitle="Send in-app messages to staff with acknowledgment tracking for compliance."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Admin", href: "/admin/roles" },
        { label: "Communications" },
      ]}
      audit={{ moduleLabel: "Communications hub" }}
    >
      {loadError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{loadError}</p>
      ) : null}

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("compose")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "compose" ? "bg-[#d4147a] text-white" : "border border-slate-200 bg-white text-slate-700"}`}
        >
          Compose
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "history" ? "bg-[#d4147a] text-white" : "border border-slate-200 bg-white text-slate-700"}`}
        >
          Sent messages ({messages.length})
        </button>
      </div>

      {tab === "compose" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">New message</h2>
            <div className="space-y-4">
              <Field label="Title" value={compose.title} onChange={(v) => setCompose({ ...compose, title: v })} />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Body</label>
                <textarea
                  className="min-h-[160px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Use **bold**, - bullets, and https:// links"
                  value={compose.body}
                  onChange={(e) => setCompose({ ...compose, body: e.target.value })}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Audience</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={compose.audienceType === "all"}
                      onChange={() => setCompose({ ...compose, audienceType: "all", audienceRoleIds: [] })}
                    />
                    All active users
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={compose.audienceType === "roles"}
                      onChange={() => setCompose({ ...compose, audienceType: "roles" })}
                    />
                    Selected roles
                  </label>
                </div>
                {compose.audienceType === "roles" ? (
                  <div className="mt-3 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-3">
                    {roleOptions.map((role) => (
                      <label key={role.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={compose.audienceRoleIds.includes(role.id)}
                          onChange={() => {
                            const has = compose.audienceRoleIds.includes(role.id);
                            setCompose({
                              ...compose,
                              audienceRoleIds: has
                                ? compose.audienceRoleIds.filter((id) => id !== role.id)
                                : [...compose.audienceRoleIds, role.id],
                            });
                          }}
                        />
                        {role.name}
                      </label>
                    ))}
                  </div>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">
                  Estimated recipients: {recipientEstimate} · you (the sender) are excluded automatically
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={compose.requiresAcknowledgment}
                    onChange={(e) => setCompose({ ...compose, requiresAcknowledgment: e.target.checked })}
                  />
                  Require acknowledgment
                </label>
                <label className="text-sm">
                  Display
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    value={compose.displayMethod}
                    disabled={!compose.requiresAcknowledgment}
                    onChange={(e) =>
                      setCompose({
                        ...compose,
                        displayMethod: e.target.value === "banner" ? "banner" : "modal",
                      })
                    }
                  >
                    <option value="modal">Modal on login (forced)</option>
                    <option value="banner">Home page banner</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  Publish at (optional)
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    value={compose.publishAt?.slice(0, 16) ?? ""}
                    onChange={(e) =>
                      setCompose({ ...compose, publishAt: e.target.value ? new Date(e.target.value).toISOString() : null })
                    }
                  />
                </label>
                <label className="text-sm">
                  Expires at (optional)
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    value={compose.expiresAt?.slice(0, 16) ?? ""}
                    onChange={(e) =>
                      setCompose({ ...compose, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null })
                    }
                  />
                </label>
              </div>

              <label className="text-sm">
                Recurrence
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  value={compose.recurrence.type}
                  onChange={(e) =>
                    setCompose({
                      ...compose,
                      recurrence: {
                        type: e.target.value as "none" | "keep_open" | "weekly",
                        weekday: 1,
                        time: "09:00",
                      },
                    })
                  }
                >
                  <option value="none">One-off</option>
                  <option value="keep_open">Keep open until manually closed</option>
                  <option value="weekly">Weekly (re-acknowledge each week)</option>
                </select>
              </label>

              {saveState === "error" && saveError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{saveError}</p>
              ) : null}
              {saveState === "saved" ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  Message published.
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPreview((p) => !p)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {preview ? "Hide preview" : "Preview"}
                </button>
                <button
                  type="button"
                  disabled={saveState === "saving"}
                  onClick={() => void publish()}
                  className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
                >
                  {saveState === "saving" ? "Publishing…" : "Publish message"}
                </button>
              </div>
            </div>
          </section>

          {preview ? (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Recipient preview</p>
              <h3 className="text-lg font-semibold text-slate-900">{compose.title || "Untitled message"}</h3>
              <AdminMessageBody body={compose.body || "Message body will appear here."} className="mt-3" />
            </section>
          ) : (
            <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-5 text-sm text-slate-500">
              Use Preview to see how recipients will read this message. Published messages cannot be edited — only closed
              or re-opened.
            </section>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-1">
            {messages.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setActiveId(m.id);
                  void loadDetail(m.id);
                }}
                className={`flex w-full flex-col rounded-xl border px-4 py-3 text-left ${
                  activeId === m.id ? "border-[#f9a8d4] bg-[#fdf2f8]" : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span className="font-medium text-slate-900">{m.title}</span>
                <span className="mt-1 text-xs text-slate-500">
                  {new Date(m.publishAt).toLocaleString()} · {m.recipientCount} recipients
                </span>
                <span className="mt-2 flex items-center gap-2">{statusBadge(m.status)}</span>
              </button>
            ))}
            {!messages.length ? <p className="text-sm text-slate-500">No messages sent yet.</p> : null}
          </div>

          <div className="lg:col-span-2">
            {selected ? (
              <div className="space-y-4">
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{selected.title}</h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Sent by {selected.senderName} · {statusBadge(selected.status)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selected.status === "active" || selected.status === "scheduled" ? (
                        <button
                          type="button"
                          onClick={() => void messageAction("close", selected.id)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Close early
                        </button>
                      ) : null}
                      {selected.status === "closed" ? (
                        <button
                          type="button"
                          onClick={() => void messageAction("reopen", selected.id)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Re-open
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void messageAction("remind", selected.id)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Remind pending
                      </button>
                      <a
                        href={`/api/admin/communications/${selected.id}?format=csv`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-[#b51266] hover:bg-[#fdf2f8]"
                      >
                        Export CSV
                      </a>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <Stat label="Recipients" value={selected.recipientCount} />
                    <Stat label="Seen" value={selected.seenCount} />
                    <Stat label="Acknowledged" value={selected.acknowledgedCount} />
                    <Stat label="Pending" value={selected.pendingCount} />
                  </div>

                  <div className="mt-4 rounded-lg bg-slate-50 p-4">
                    <AdminMessageBody body={selected.body} />
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">Acknowledgment register</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                          <th className="px-2 py-2">User</th>
                          <th className="px-2 py-2">Roles</th>
                          <th className="px-2 py-2">Status</th>
                          <th className="px-2 py-2">Acknowledged</th>
                        </tr>
                      </thead>
                      <tbody>
                        {register.map((row) => (
                          <tr key={row.userId} className="border-b border-slate-100">
                            <td className="px-2 py-2">
                              <span className="font-medium text-slate-900">{row.displayName}</span>
                              <span className="block text-xs text-slate-500">{row.username}</span>
                            </td>
                            <td className="px-2 py-2 text-xs text-slate-600">{row.roleNames.join(", ") || "—"}</td>
                            <td className="px-2 py-2 capitalize text-slate-700">{row.status.replace("_", " ")}</td>
                            <td className="px-2 py-2 text-xs text-slate-600">
                              {row.acknowledgedAt ? new Date(row.acknowledgedAt).toLocaleString() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select a sent message to view acknowledgment details.</p>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#d4147a]"
      />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
