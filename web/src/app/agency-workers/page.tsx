"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AgencyWorkerListView } from "@/components/agency-worker-pages";
import { useAuth } from "@/lib/auth-store";

export default function AgencyWorkersPage() {
  const { canWriteWindow } = useAuth();
  const canCreate = canWriteWindow("agency-workers");

  return (
    <AppShell
      title="Agency workers"
      subtitle="Workers employed by agency vendors — flagged separately from internal employees and linked to who they work for."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Agency workers" }]}
      audit={{ moduleLabel: "Agency workers" }}
      actions={
        canCreate ? (
          <Link
            href="/agency-workers/new"
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
          >
            Add agency worker
          </Link>
        ) : null
      }
    >
      <AgencyWorkerListView />
    </AppShell>
  );
}
