"use client";

import { AiWorkspaceChat } from "@/components/ai-workspace-chat";
import { useAuth } from "@/lib/auth-store";
import { useAiChatShell } from "@/lib/ai/chat-shell-store";
import { usePathname } from "next/navigation";
import { SidebarNav } from "@/components/sidebar-nav";
import { SessionFooter } from "@/components/session-footer";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { HowToGuideFooter } from "@/components/how-to-guide-footer";
import { RecordAuditFooter } from "@/components/record-audit-footer";
import type { AppShellAuditProps } from "@/lib/audit";
import type { Breadcrumb } from "@/components/app-shell";
import Link from "next/link";
import { organizationDisplayName } from "@/lib/organization";
import { useOrganization } from "@/lib/organization-store";

/** Workspace layout with persistent right AI chat (used by AppShell). */
export function WorkspaceChrome({
  title,
  subtitle,
  breadcrumbs,
  actions,
  audit,
  children,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  audit?: AppShellAuditProps;
  children: React.ReactNode;
}) {
  const { organization } = useOrganization();
  const orgName = organizationDisplayName(organization);
  const pathname = usePathname();
  const { session } = useAuth();
  const { collapsed, toggleCollapsed } = useAiChatShell();
  const showChat = Boolean(session) && pathname !== "/login";

  return (
    <div className="flex min-h-screen bg-[#f4f6f8] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-100 px-5">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" title={orgName}>
            {organization.logoUrl?.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={organization.logoUrl}
                alt=""
                className="h-9 w-9 shrink-0 rounded-xl object-contain ring-1 ring-slate-200"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4147a] to-[#b51266] text-sm font-bold text-white shadow-sm">
                a
              </span>
            )}
            <span className="truncate text-lg font-semibold tracking-tight">
              Ability<span className="text-[#d4147a]">APP</span>
            </span>
          </Link>
        </div>
        <div className="flex min-h-0 flex-1 flex-col py-4">
          <SidebarNav />
        </div>
        <SessionFooter />
      </aside>

      <div className="flex min-h-screen flex-1 pl-64">
        <div className="flex min-h-0 w-full flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <WorkspaceTabs />
            <main className="flex-1 px-6 py-8 pb-24 lg:px-10">
              {breadcrumbs?.length ? (
                <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
                  {breadcrumbs.map((crumb, index) => (
                    <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1.5">
                      {index > 0 ? <span className="text-slate-300">/</span> : null}
                      {crumb.href ? (
                        <Link href={crumb.href} className="hover:text-[#b51266]">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="text-slate-700">{crumb.label}</span>
                      )}
                    </span>
                  ))}
                </nav>
              ) : null}

              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
                  {subtitle ? <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p> : null}
                </div>
                {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
              </div>
              {children}
              <HowToGuideFooter />
              {audit ? <RecordAuditFooter {...audit} /> : null}
            </main>
          </div>

          {showChat ? (
            collapsed ? (
              <div className="flex w-10 shrink-0 flex-col items-center border-l border-slate-200 bg-white pt-3">
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  className="rounded-md px-1 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#b51266] hover:bg-[#fdf2f8]"
                  title="Expand AI chat"
                >
                  AI
                </button>
              </div>
            ) : (
              <div className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
                <div className="flex shrink-0 items-center justify-start border-b border-slate-100 px-2 py-1">
                  <button
                    type="button"
                    onClick={toggleCollapsed}
                    className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    title="Collapse AI chat"
                  >
                    Hide
                  </button>
                </div>
                <AiWorkspaceChat className="min-h-0 flex-1" />
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
