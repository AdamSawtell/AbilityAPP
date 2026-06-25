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
import { OrgLogo } from "@/components/organization-landing";
import { SystemClock } from "@/components/system-clock";
import { organizationDisplayName } from "@/lib/organization";
import { useOrganization } from "@/lib/organization-store";
import { useCallback, useEffect, useRef } from "react";
import { HOME_AI_PANEL_WIDTH } from "@/lib/ai/chat-shell-store";

function ChatResizeHandle({ onResize }: { onResize: (deltaX: number) => void }) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = lastX.current - e.clientX;
      lastX.current = e.clientX;
      if (delta !== 0) onResize(delta);
    },
    [onResize]
  );

  const onMouseUp = useCallback(() => {
    dragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize AI chat panel"
      className="absolute inset-y-0 left-0 z-10 w-1.5 cursor-col-resize hover:bg-brand-primary/20 active:bg-brand-primary/30"
      onMouseDown={(e) => {
        dragging.current = true;
        lastX.current = e.clientX;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      }}
    />
  );
}

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
  const { collapsed, panelWidth, toggleCollapsed, setPanelWidth, setCollapsed } = useAiChatShell();
  const showChat = Boolean(session) && pathname !== "/login";
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const enteredHome = pathname === "/" && prevPathRef.current !== "/";
    prevPathRef.current = pathname;
    if (!enteredHome || !showChat) return;
    setCollapsed(false);
    setPanelWidth((width) => Math.max(width, HOME_AI_PANEL_WIDTH));
  }, [pathname, showChat, setCollapsed, setPanelWidth]);

  const handleResize = useCallback(
    (deltaX: number) => {
      setPanelWidth((width) => width + deltaX);
    },
    [setPanelWidth]
  );

  return (
    <div className="flex h-screen overflow-hidden bg-brand-background text-brand-text">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="shrink-0 border-b border-slate-100 px-5 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" title={orgName}>
            <OrgLogo organization={organization} size="sm" />
            <span className="truncate text-base font-semibold tracking-tight text-slate-900">{orgName}</span>
          </Link>
          <SystemClock className="mt-1.5 pl-[3.375rem]" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col py-4">
          <SidebarNav />
        </div>
        <SessionFooter />
      </aside>

      <div className="flex h-full min-h-0 flex-1 overflow-hidden pl-64">
        <div className="flex h-full min-h-0 w-full overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <WorkspaceTabs />
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
              <main className="px-6 py-8 pb-24 lg:px-10">
              {breadcrumbs?.length ? (
                <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
                  {breadcrumbs.map((crumb, index) => (
                    <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1.5">
                      {index > 0 ? <span className="text-slate-300">/</span> : null}
                      {crumb.href ? (
                        <Link href={crumb.href} className="hover:text-brand-link">
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
          </div>

          {showChat ? (
            collapsed ? (
              <div className="flex h-full w-10 shrink-0 flex-col items-center border-l border-slate-200 bg-white pt-3">
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  className="rounded-md px-1 py-2 text-[10px] font-semibold uppercase tracking-wide text-brand-link hover:bg-brand-muted-surface"
                  title="Expand AI chat (Ctrl+\)"
                >
                  AI
                </button>
              </div>
            ) : (
              <div
                className="relative flex h-full shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white"
                style={{ width: panelWidth }}
              >
                <ChatResizeHandle onResize={handleResize} />
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-2 py-1">
                  <span className="text-[10px] text-slate-400">Drag edge to resize · Ctrl+\ to hide</span>
                  <button
                    type="button"
                    onClick={toggleCollapsed}
                    className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    title="Collapse AI chat"
                  >
                    Hide
                  </button>
                </div>
                <AiWorkspaceChat className="h-full min-h-0 flex-1" />
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
