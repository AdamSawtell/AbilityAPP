"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EnquiryList } from "@/components/enquiry-list";
import { useData } from "@/lib/data-store";

export default function EnquiriesPage() {
  const { enquiries } = useData();

  return (
    <AppShell
      title="Enquiries"
      subtitle="Client and employee intake. Convert to a client when ready."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Enquiries" }]}
      actions={
        <Link
          href="/enquiries/new"
          className="inline-flex items-center rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#b51266]"
        >
          New enquiry
        </Link>
      }
    >
      <EnquiryList records={enquiries} />
    </AppShell>
  );
}
