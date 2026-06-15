"use client";

import Link from "next/link";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { EnquiryList } from "@/components/enquiry-list";
import { useData } from "@/lib/data-store";

function EnquiryListFallback() {
  return <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading enquiries…</div>;
}

export default function EnquiriesPage() {
  const { enquiries } = useData();

  return (
    <AppShell
      title="Enquiries"
      subtitle="Active intake records. Convert to a client when ready."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Enquiries" }]}
      audit={{ moduleLabel: "Enquiries" }}
      actions={
        <Link
          href="/enquiries/new"
          className="inline-flex items-center rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#b51266]"
        >
          New enquiry
        </Link>
      }
    >
      <Suspense fallback={<EnquiryListFallback />}>
        <EnquiryList records={enquiries} />
      </Suspense>
    </AppShell>
  );
}
