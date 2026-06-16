"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AiAgentsAdminView } from "@/components/admin/ai-agents-page";
import { useAuth } from "@/lib/auth-store";

export default function AdminAiAgentsPage() {
  const { canWindow } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!canWindow("admin-ai-agents") && !canWindow("admin-roles")) router.replace("/");
  }, [canWindow, router]);

  if (!canWindow("admin-ai-agents") && !canWindow("admin-roles")) return null;
  return <AiAgentsAdminView />;
}
