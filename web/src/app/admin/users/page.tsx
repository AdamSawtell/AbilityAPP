"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UsersAdminView } from "@/components/admin/users-page";
import { useAuth } from "@/lib/auth-store";

export default function AdminUsersPage() {
  const { canWindow } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!canWindow("admin-users")) router.replace("/");
  }, [canWindow, router]);

  if (!canWindow("admin-users")) return null;
  return <UsersAdminView />;
}
