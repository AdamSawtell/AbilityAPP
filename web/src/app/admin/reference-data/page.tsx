"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ReferenceDataAdminView } from "@/components/admin/reference-data-page";
import { useAuth } from "@/lib/auth-store";

export default function AdminReferenceDataPage() {
  const { canWindow } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!canWindow("admin-reference-data")) router.replace("/");
  }, [canWindow, router]);

  if (!canWindow("admin-reference-data")) return null;
  return <ReferenceDataAdminView />;
}
