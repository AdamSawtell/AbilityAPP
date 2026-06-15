"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RolesAdminView } from "@/components/admin/roles-page";
import { useAuth } from "@/lib/auth-store";

export default function AdminRolesPage() {
  const { canWindow } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!canWindow("admin-roles")) router.replace("/");
  }, [canWindow, router]);

  if (!canWindow("admin-roles")) return null;
  return <RolesAdminView />;
}
