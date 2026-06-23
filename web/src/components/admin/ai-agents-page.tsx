"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import { AppShell } from "@/components/app-shell";
import { SystemShell } from "@/components/system/system-shell";
import type { AiAgentRecord, AiToolName } from "@/lib/ai/types";
import type { AiToolDefinition, AiToolModule } from "@/lib/ai/catalog";
import {
  AI_TOOL_KIND_LABELS,
  toolsGroupedByModuleAndKind,
} from "@/lib/ai/catalog";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

type RoleSummary = { id: string; name: string; active: boolean };
type ModelOption = { id: string; label: string };

function newAgentId() {
  return `agent-${Date.now()}`;
}

function kindBadgeClass(kind: AiToolDefinition["kind"]) {
  if (kind === "prepare") return "bg-sky-100 text-sky-800";
  if (kind === "write") return "bg-amber-100 text-amber-900";
  if (kind === "workflow") return "bg-violet-100 text-violet-800";
  return "bg-slate-100 text-slate-600";
}

function AiSkillPicker({
  tools,
  record,
  onToggle,
  onToggleModule,
}: {
  tools: AiToolDefinition[];
  record: AiAgentRecord;
  onToggle: (key: AiToolName) => void;
  onToggleModule: (module: AiToolModule, enable: boolean) => void;
}) {
  const [showLegacy, setShowLegacy] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const visibleTools = useMemo(
    () => (showLegacy ? tools : tools.filter((t) => !t.deprecated)),
    [tools, showLegacy]
  );
  const groups = useMemo(() => toolsGroupedByModuleAndKind(visibleTools), [visibleTools]);
  const legacyCount = tools.filter((t) => t.deprecated).length;

  function isChecked(key: AiToolName) {
    return record.capabilities.some((c) => c.type === "tool" && c.key === key);
  }

  function moduleCheckedCount(moduleTools: AiToolDefinition[]) {
    return moduleTools.filter((t) => isChecked(t.key)).length;
  }

  function toggleCollapsed(module: AiToolModule) {
    setCollapsed((prev) => ({ ...prev, [module]: !prev[module] }));
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Skills</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Pick individual skills for this assistant. Prepare skills use a guided flow — the assistant asks questions
            until it has enough detail, opens a review form, and the user clicks Save. Skills are role-agnostic.
          </p>
        </div>
        {legacyCount > 0 ? (
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={showLegacy} onChange={(e) => setShowLegacy(e.target.checked)} />
            Show legacy write skills ({legacyCount})
          </label>
        ) : null}
      </div>

      <div className="space-y-3">
        {groups.map((group) => {
          const isCollapsed = collapsed[group.module] ?? false;
          const moduleTools = group.kinds.flatMap((k) => k.tools);
          const checked = moduleCheckedCount(moduleTools);
          const allChecked = checked === moduleTools.length && moduleTools.length > 0;
          return (
            <section key={group.module} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2">
                <button
                  type="button"
                  onClick={() => toggleCollapsed(group.module)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium text-slate-800"
                >
                  <span className="text-slate-400">{isCollapsed ? "▸" : "▾"}</span>
                  <span>{group.label}</span>
                  <span className="text-xs font-normal text-slate-500">
                    {checked}/{moduleTools.length} enabled
                  </span>
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleModule(group.module, !allChecked)}
                    className="rounded px-2 py-1 text-xs font-medium text-[#b51266] hover:bg-[#fdf2f8]"
                  >
                    {allChecked ? "Clear all" : "Select all"}
                  </button>
                </div>
              </div>
              {!isCollapsed ? (
                <div className="space-y-3 p-3">
                  {group.kinds.map((kindGroup) => (
                    <div key={kindGroup.kind}>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {kindGroup.label}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {kindGroup.tools.map((tool) => {
                          const checkedTool = isChecked(tool.key);
                          return (
                            <label
                              key={tool.key}
                              className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-2.5 ${
                                checkedTool ? "border-[#f9a8d4] bg-[#fdf2f8]" : "border-slate-200 bg-white"
                              } ${tool.deprecated ? "opacity-80" : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={checkedTool}
                                onChange={() => onToggle(tool.key)}
                                className="mt-0.5"
                              />
                              <span className="min-w-0">
                                <span className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-sm font-medium text-slate-800">{tool.label}</span>
                                  <span
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${kindBadgeClass(tool.kind)}`}
                                  >
                                    {AI_TOOL_KIND_LABELS[tool.kind]}
                                  </span>
                                  {tool.deprecated ? (
                                    <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                      Legacy
                                    </span>
                                  ) : null}
                                </span>
                                <span className="mt-0.5 block text-xs text-slate-500">{tool.description}</span>
                                {tool.skillHint ? (
                                  <span className="mt-1 block text-[10px] italic leading-relaxed text-slate-500">
                                    {tool.skillHint}
                                  </span>
                                ) : null}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function AiAgentsAdminView({ variant = "workspace" }: { variant?: "workspace" | "system" }) {
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
      systemPrompt: "You are an AbilityVua assistant. Be concise and helpful.",
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

  function toggleModuleTools(module: AiToolModule, enable: boolean) {
    if (!record) return;
    const moduleKeys = new Set(tools.filter((t) => t.module === module).map((t) => t.key));
    const withoutModule = record.capabilities.filter((c) => !(c.type === "tool" && moduleKeys.has(c.key as AiToolName)));
    if (!enable) {
      setDraft({ ...record, capabilities: withoutModule });
      return;
    }
    const existing = new Set(
      withoutModule.filter((c) => c.type === "tool").map((c) => c.key as AiToolName)
    );
    const added = tools
      .filter((t) => t.module === module && !t.deprecated && !existing.has(t.key))
      .map((t) => ({ type: "tool" as const, key: t.key }));
    setDraft({ ...record, capabilities: [...withoutModule, ...added] });
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

  const Shell = variant === "system" ? SystemShell : AppShell;

  return (
    <Shell
      title="AI assistants"
      subtitle="Define assistants, skills, prompts, and which roles can use them in the workspace."
      breadcrumbs={
        variant === "system"
          ? [
              { label: "System", href: "/system" },
              { label: "AI", href: "/system/ai/assistants" },
              { label: "AI assistants" },
            ]
          : [
              { label: "Home", href: "/" },
              { label: "Admin", href: "/system/admin/roles" },
              { label: "AI assistants" },
            ]
      }
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
          OpenAI is configured. Edit prompts and skills here, save, then test in the workspace chat — use{" "}
          <strong>New chat</strong> to pick up changes.
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

                <AiSkillPicker
                  tools={tools}
                  record={record}
                  onToggle={toggleTool}
                  onToggleModule={toggleModuleTools}
                />

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
    </Shell>
  );
}
