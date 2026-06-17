"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { OrgLogo } from "@/components/organization-landing";
import { SystemNavIcon } from "@/components/system/system-nav-icons";
import { SYSTEM_NAV_SECTIONS, type SystemNavSection } from "@/lib/system/nav";
import { organizationDisplayName } from "@/lib/organization";
import { useOrganization } from "@/lib/organization-store";
import { useSystemAuth } from "@/lib/system-auth-store";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function subLinkClass(active: boolean) {
  return `block rounded-md px-2 py-1.5 text-xs font-medium ${
    active ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
  }`;
}

function sectionActive(section: SystemNavSection, pathname: string) {
  return section.links.some((link) => link.href && link.match?.(pathname));
}

function SystemSectionHeader({
  section,
  open,
  onToggle,
  active,
}: {
  section: SystemNavSection;
  open: boolean;
  onToggle: () => void;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <span
        className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
          active ? "text-slate-900" : "text-slate-600"
        }`}
      >
        <span className={active ? "text-[#d4147a]" : "text-slate-400"}>
          <SystemNavIcon name={section.icon} />
        </span>
        {section.label}
      </span>
      <button
        type="button"
        onClick={onToggle}
        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label={`Toggle ${section.label} menu`}
        aria-expanded={open}
      >
        <Chevron open={open} />
      </button>
    </div>
  );
}

function SystemSectionSubmenu({
  section,
  pathname,
}: {
  section: SystemNavSection;
  pathname: string;
}) {
  if (section.links.length === 0) {
    return (
      <p className="px-2 py-1.5 text-xs text-slate-500">{section.emptyMessage ?? "Nothing to configure yet."}</p>
    );
  }

  return (
    <>
      {section.links.map((link) => {
        if (link.comingSoon) {
          return (
            <span
              key={link.label}
              className="block cursor-default rounded-md px-2 py-1.5 text-xs font-medium text-slate-400"
              title="Coming soon"
            >
              {link.label}
              <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wide text-slate-400">Soon</span>
            </span>
          );
        }
        if (!link.href) return null;
        return (
          <Link key={link.href} href={link.href} className={subLinkClass(Boolean(link.match?.(pathname)))}>
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

export function SystemNav() {
  const pathname = usePathname();
  const { session, logout } = useSystemAuth();
  const { organization } = useOrganization();
  const orgName = organizationDisplayName(organization);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function isOpen(key: string) {
    return expanded[key] === true;
  }

  function toggleSection(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3">
      <Link
        href="/system"
        className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          pathname === "/system"
            ? "bg-[#fdf2f8] text-[#b51266] ring-1 ring-[#f9a8d4]/60"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <span className={pathname === "/system" ? "text-[#d4147a]" : "text-slate-400"}>
          <SystemNavIcon name="home" />
        </span>
        <span>Home</span>
      </Link>

      {SYSTEM_NAV_SECTIONS.map((section) => {
        const open = isOpen(section.key);
        const active = sectionActive(section, pathname);
        return (
          <div key={section.key} className="pt-1">
            <SystemSectionHeader
              section={section}
              open={open}
              active={active}
              onToggle={() => toggleSection(section.key)}
            />
            {open ? (
              <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
                <SystemSectionSubmenu section={section} pathname={pathname} />
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="mt-auto border-t border-slate-200 pt-4">
        <p className="truncate px-3 text-xs text-slate-500" title={orgName}>
          {orgName}
        </p>
        <p className="truncate px-3 text-xs text-slate-400">{session?.displayName}</p>
        <button
          type="button"
          onClick={() => void logout().then(() => window.location.assign("/login"))}
          className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800"
        >
          Sign out of System
        </button>
        <Link
          href="/login"
          className="mt-1 block rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          Workspace sign in
        </Link>
      </div>
    </nav>
  );
}

export function SystemHeaderBrand() {
  const { organization } = useOrganization();
  const orgName = organizationDisplayName(organization);

  return (
    <Link href="/system" className="flex min-w-0 items-center gap-2.5" title={`${orgName} — System setup`}>
      <OrgLogo organization={organization} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{orgName}</p>
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-500">System setup</p>
      </div>
    </Link>
  );
}
