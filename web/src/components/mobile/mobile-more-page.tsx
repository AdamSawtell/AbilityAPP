"use client";

import Link from "next/link";
import { MobileAuthGuard } from "@/components/mobile/mobile-auth-guard";
import { MobileEmployeeShell } from "@/components/mobile/mobile-employee-shell";
import { MobilePasskeySettings } from "@/components/mobile/mobile-passkey-settings";
import { MobilePushSettings } from "@/components/mobile/mobile-push-settings";
import { useAuth } from "@/lib/auth-store";

const LINKS = [
  { href: "/m/id", label: "Digital Worker ID", desc: "Show your photo and role" },
  { href: "/m/messages", label: "Messages", desc: "Contact rostering about shifts" },
  { href: "/m/services", label: "Services I can work at", desc: "Qualified sites and high-demand advisory" },
  { href: "/m/open-shifts", label: "Open shifts", desc: "Browse and apply for vacant shifts" },
  { href: "/m/leave", label: "Leave", desc: "Submit and track leave requests" },
  { href: "/m/availability", label: "Availability", desc: "Set when you can work" },
  { href: "/m/notifications", label: "Notifications", desc: "Shift and credential reminders" },
  { href: "/m/credentials", label: "Credentials", desc: "Upload compliance documents" },
  { href: "/m/profile", label: "Personal info", desc: "Update contact details" },
  { href: "/m/install", label: "Install on iPhone", desc: "Add to home screen" },
  { href: "/help/employee-mobile", label: "How-to guide", desc: "My Workplace help" },
] as const;

export function MobileMorePage() {
  const { logout } = useAuth();

  return (
    <MobileAuthGuard>
      <MobileEmployeeShell title="More" subtitle="Profile, leave, and settings">
        <MobilePushSettings />
        <div className="mt-4">
          <MobilePasskeySettings />
        </div>

        <ul className="mt-6 space-y-2">
          {LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex min-h-[3.25rem] flex-col justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm active:bg-slate-50"
              >
                <span className="font-semibold text-slate-900">{item.label}</span>
                <span className="text-xs text-slate-500">{item.desc}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-2">
          <Link
            href="/my"
            className="flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700"
          >
            Desktop My workplace
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="min-h-11 w-full rounded-xl border border-slate-200 text-sm font-medium text-slate-600"
          >
            Sign out
          </button>
        </div>
      </MobileEmployeeShell>
    </MobileAuthGuard>
  );
}
