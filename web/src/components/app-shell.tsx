"use client";

import { WorkspaceChrome } from "@/components/workspace-chrome";
import type { AppShellAuditProps } from "@/lib/audit";

export type Breadcrumb = {
  label: string;
  href?: string;
};

export function AppShell({
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
  return (
    <WorkspaceChrome
      title={title}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs}
      actions={actions}
      audit={audit}
    >
      {children}
    </WorkspaceChrome>
  );
}
