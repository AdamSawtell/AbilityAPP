"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { canAccessWindow } from "@/lib/access/catalog";
import { useMyEmployee } from "@/components/my-workplace/my-workplace-guard";

export function MobileAuthGuard({
  windowKey = "my-workplace",
  children,
}: {
  windowKey?: string;
  children: React.ReactNode;
}) {
  const { session } = useAuth();
  const { linked } = useMyEmployee();

  if (!session) {
    return (
      <MobileErrorScreen
        title="Sign in required"
        message="Open AbilityVua in your browser and sign in to use the worker app."
        action={{ label: "Sign in", href: "/login?next=/m/today" }}
      />
    );
  }

  if (!canAccessWindow(session.windowKeys, windowKey)) {
    return (
      <MobileErrorScreen
        title="Access not included"
        message="Your role does not include this self-service area. Ask your administrator to add My workplace access."
        action={{ label: "Back to home", href: "/" }}
      />
    );
  }

  if (!linked && !session.employeeBpId) {
    return (
      <MobileErrorScreen
        title="Employee link missing"
        message="Your user account is not linked to an employee record. Ask HR to connect your login on Employee → System access."
        action={{ label: "Back to home", href: "/" }}
      />
    );
  }

  return <>{children}</>;
}

function MobileErrorScreen({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action: { label: string; href: string };
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-[#fdf2f8]/50 px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#b51266]">AbilityVua Worker</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{message}</p>
        <Link
          href={action.href}
          className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#b51266] px-4 text-base font-semibold text-white hover:bg-[#9e1058]"
        >
          {action.label}
        </Link>
      </div>
    </div>
  );
}
