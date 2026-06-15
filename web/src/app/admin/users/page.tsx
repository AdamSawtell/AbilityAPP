"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UsersAdminView } from "@/components/admin/users-page";
import { useAuth } from "@/lib/auth-store";

function UsersAdminPageContent() {
  const searchParams = useSearchParams();
  const focusUserId = searchParams.get("user");
  const prefillEmployeeId = searchParams.get("employee");

  return (
    <UsersAdminView
      key={`${focusUserId ?? ""}-${prefillEmployeeId ?? ""}`}
      focusUserId={focusUserId}
      prefillEmployeeId={prefillEmployeeId}
    />
  );
}

export default function AdminUsersPage() {
  const { canWindow } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!canWindow("admin-users")) router.replace("/");
  }, [canWindow, router]);

  if (!canWindow("admin-users")) return null;
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading…</div>}>
      <UsersAdminPageContent />
    </Suspense>
  );
}
