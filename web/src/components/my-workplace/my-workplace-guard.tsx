"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { canAccessWindow } from "@/lib/access/catalog";
import { useData } from "@/lib/data-store";
import { employeeForUser } from "@/lib/personal-calendar";
import { AppShell } from "@/components/app-shell";

export function useMyEmployee() {
  const { session, users } = useAuth();
  const { employees } = useData();
  if (!session) return { employee: null, linked: false };
  const employee = employeeForUser(users, employees, session.userId);
  return { employee, linked: Boolean(employee) };
}

export function MyWorkplaceGuard({
  windowKey,
  children,
}: {
  windowKey: string;
  children: React.ReactNode;
}) {
  const { session, canWindow } = useAuth();
  const { linked } = useMyEmployee();

  if (!session) {
    return (
      <AppShell title="My workplace" audit={{ moduleLabel: "My workplace" }}>
        <p className="text-sm text-slate-600">Sign in to use My workplace.</p>
      </AppShell>
    );
  }

  if (!canWindow(windowKey)) {
    return (
      <AppShell title="My workplace" audit={{ moduleLabel: "My workplace" }}>
        <p className="text-sm text-slate-600">Your role does not include this self-service area.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-[#b51266] hover:underline">
          Back to home
        </Link>
      </AppShell>
    );
  }

  if (!linked && !session.employeeBpId) {
    return (
      <AppShell title="My workplace" audit={{ moduleLabel: "My workplace" }}>
        <p className="text-sm text-slate-600">
          Your user account is not linked to an employee record. Ask HR to connect your login on Employee → System
          access.
        </p>
      </AppShell>
    );
  }

  return <>{children}</>;
}

export function myWorkplaceBreadcrumbs(current: string) {
  return [{ label: "Home", href: "/" }, { label: "My workplace", href: "/my" }, { label: current }];
}

export function canSeeMyWorkplace(windowKeys: string[]) {
  return canAccessWindow(windowKeys, "my-workplace");
}
