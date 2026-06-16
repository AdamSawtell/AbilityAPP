"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import { AppShell } from "@/components/app-shell";
import type { AiAgentRecord, AiToolName } from "@/lib/ai/types";
import type { AiToolDefinition } from "@/lib/ai/catalog";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

type RoleSummary = { id: string; name: string; active: boolean };
type ModelOption = { id: string; label: string };

function newAgentId() {
  return `agent-${Date.now()}`;
}

export function AiAgentsAdminView() {
  const [agents, setAgents] = useState<AiAgentRecord[]>([]);
  const [roleAgents, setRoleAgents] = useState<Record<string, string[]>>({});
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [tools, setTools] = useState<AiToolDefinition[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [openAiConfigured, setOpenAiConfigured] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AiAgentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [tab, setTab] = useState<"agent" | "roles">("agent");

  const record = draft ?? agents.find((a) => a.id === activeId) ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/admin/ai-agents", { credentials: "include" });
      const data = (await res.json()) as {
        agents: AiAgentRecord[];
        roleAgents: Record<string, string[]>;
        roles: RoleSummary[];
        tools: AiToolDefinition[];
        models: ModelOption[];
        openAiConfigured: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not load");
      setAgents(data.agents);
      setRoleAgents(data.roleAgents);
      setRoles(data.roles.filter((r) => r.active));
      setTools(data.tools);
      setModels(data.models);
      setOpenAiConfigured(data.openAiConfigured);
      setActiveId((prev) => prev ?? data.agents[0]?.id ?? null);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  function openAgent(id: string) {
    const agent = agents.find((a) => a.id === id);
    if (!agent) return;
    setTab("agent");
    setActiveId(id);
    setDraft({
      ...agent,
      capabilities: agent.capabilities.map((c) => ({ ...c })),
    });
  }

  function addAgent() {
    const agent: AiAgentRecord = {
      id: newAgentId(),
      agentKey: "",
      name: "",
      description: "",
      systemPrompt: "You are an AbilityAPP assistant. Be concise and helpful.",
      model: "gpt-4o-mini",
      active: true,
      capabilities: [{ type: "tool", key: "help_search" }],
    };
    setTab("agent");
    setActiveId(agent.id);
    setDraft(agent);
  }

  function toggleTool(key: AiToolName) {
    if (!record) return;
    const has = record.capabilities.some((c) => c.type === "tool" && c.key === key);
    const capabilities = has
      ? record.capabilities.filter((c) => !(c.type === "tool" && c.key === key))
      : [...record.capabilities, { type: "tool", key }];
    setDraft({ ...record, capabilities });
  }

  async function saveAgent() {
    if (!record?.agentKey.trim() || !record.name.trim()) {
      setStatus("Agent key and name are required.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/admin/ai-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "save-agent", agent: record }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setDraft(null);
      setStatus("Assistant saved.");
      await load();
      setActiveId(record.id);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function seedDefaults() {
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/admin/ai-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "seed-defaults" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Seed failed");
      setStatus("Default assistants restored from seed.");
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Seed failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleRoleAgent(roleId: string, agentId: string) {
    const current = roleAgents[roleId] ?? [];
    const next = current.includes(agentId)
      ? current.filter((id) => id !== agentId)
      : [...current, agentId];
    setRoleAgents((prev) => ({ ...prev, [roleId]: next }));
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/admin/ai-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "save-role-agents", roleId, agentIds: next }),
      });
      const data = (await res.json()) as { error?: string; note?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setStatus(data.note ?? "Role access updated.");
    } catch (err) {
      setRoleAgents((prev) => ({ ...prev, [roleId]: current }));
      setStatus(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const activeAgents = useMemo(() => agents.filter((a) => a.active), [agents]);

  return (
    <AppShell
      title="AI assistants"
      subtitle="Define assistants, tools, prompts, and which roles can use them on Home."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Admin", href: "/admin/ai-agents" },
        { label: "AI assistants" },
      ]}
      audit={{ moduleLabel: "AI assistant administration" }}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void seedDefaults()}
            disabled={saving}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Restore defaults
          </button>
          <button
            type="button"
            onClick={addAgent}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
          >
            Add assistant
          </button>
        </div>
      }
    >
      {!openAiConfigured ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <code className="rounded bg-amber-100 px-1">OPENAI_API_KEY</code> is not set on the server. Add it to{" "}
          <code className="rounded bg-amber-100 px-1">web/.env.local</code> for localhost, then restart{" "}
          <code className="rounded bg-amber-100 px-1">npm run dev</code>.
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          OpenAI is configured. Edit prompts and tools here, save, then test on Home — use <strong>New chat</strong> to
          pick up changes.
        </div>
      )}

      {status ? (
        <p className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">{status}</p>
      ) : null}

      <div className="mb-4 flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("agent")}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${
            tab === "agent" ? "border-[#d4147a] text-[#b51266]" : "border-transparent text-slate-500"
          }`}
        >
          Assistants
        </button>
        <button
          type="button"
          onClick={() => setTab("roles")}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${
            tab === "roles" ? "border-[#d4147a] text-[#b51266]" : "border-transparent text-slate-500"
          }`}
        >
          Role access
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : tab === "roles" ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Which roles see which assistants</h2>
            <p className="text-xs text-slate-500">Users must sign out and back in after changes.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">Role</th>
                  {activeAgents.map((a) => (
                    <th key={a.id} className="px-3 py-3">
                      {a.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className="border-b border-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{role.name}</td>
                    {activeAgents.map((agent) => {
                      const checked = (roleAgents[role.id] ?? []).includes(agent.id);
                      return (
                        <td key={agent.id} className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={saving}
                            onChange={() => void toggleRoleAgent(role.id, agent.id)}
                            aria-label={`${role.name} — ${agent.name}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <aside className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Assistants
            </div>
            <ul className="divide-y divide-slate-100">
              {agents.map((agent) => (
                <li key={agent.id}>
                  <button
                    type="button"
                    onClick={() => openAgent(agent.id)}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                      activeId === agent.id ? "bg-[#fdf2f8] font-medium text-[#b51266]" : "text-slate-700"
                    }`}
                  >
                    {agent.name || agent.agentKey || "Untitled"}
                    {!agent.active ? <span className="ml-2 text-xs text-slate-400">(inactive)</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="space-y-4 lg:col-span-2">
            {record ? (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="mb-1.5 block text-xs font-medium text-slate-600">Name</span>
                    <input
                      className={inputClass}
                      value={record.name}
                      onChange={(e) => setDraft({ ...record, name: e.target.value })}
                    />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-xs font-medium text-slate-600">Key</span>
                    <input
                      className={inputClass}
                      value={record.agentKey}
                      onChange={(e) => setDraft({ ...record, agentKey: e.target.value })}
                      placeholder="training"
                    />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-xs font-medium text-slate-600">Model</span>
                    <select
                      className={inputClass}
                      value={record.model}
                      onChange={(e) => setDraft({ ...record, model: e.target.value })}
                    >
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="sm:col-span-2">
                    <span className="mb-1.5 block text-xs font-medium text-slate-600">Short description</span>
                    <input
                      className={inputClass}
                      value={record.description}
                      onChange={(e) => setDraft({ ...record, description: e.target.value })}
                    />
                  </label>
                  <label className="flex items-center gap-2 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={record.active}
                      onChange={(e) => setDraft({ ...record, active: e.target.checked })}
                    />
                    <span className="text-sm text-slate-700">Active</span>
                  </label>
                  <label className="sm:col-span-2">
                    <span className="mb-1.5 block text-xs font-medium text-slate-600">System prompt</span>
                    <textarea
                      className={`${inputClass} min-h-[200px] resize-y font-mono text-[13px]`}
                      value={record.systemPrompt}
                      onChange={(e) => setDraft({ ...record, systemPrompt: e.target.value })}
                    />
                  </label>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Tools</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {tools.map((tool) => {
                      const checked = record.capabilities.some((c) => c.type === "tool" && c.key === tool.key);
                      return (
                        <label
                          key={tool.key}
                          className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-2.5 ${
                            checked ? "border-[#f9a8d4] bg-[#fdf2f8]" : "border-slate-200 bg-white"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTool(tool.key)}
                            className="mt-0.5"
                          />
                          <span>
                            <span className="block text-sm font-medium text-slate-800">{tool.label}</span>
                            <span className="block text-xs text-slate-500">{tool.description}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void saveAgent()}
                    disabled={saving}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Save assistant
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft(null)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </section>
            ) : (
              <p className="text-sm text-slate-500">Select an assistant to edit, or add a new one.</p>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
