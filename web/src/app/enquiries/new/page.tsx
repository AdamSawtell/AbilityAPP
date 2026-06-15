"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EnquiryForm } from "@/components/enquiry-form";
import { useData } from "@/lib/data-store";
import { emptyEnquiry, formSections, type EnquiryRecord } from "@/lib/enquiry";

export default function NewEnquiryPage() {
  const router = useRouter();
  const { addEnquiry } = useData();
  const [record, setRecord] = useState<EnquiryRecord>(emptyEnquiry());
  const [error, setError] = useState("");

  function onChange(key: keyof EnquiryRecord, value: string) {
    setRecord((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  function onCreate() {
    if (!record.firstName.trim() || !record.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    const created = addEnquiry(record);
    router.push(`/enquiries/${created.id}`);
  }

  return (
    <AppShell
      title="New enquiry"
      subtitle="Capture intake details. A document number is assigned when you create the record."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Enquiries", href: "/enquiries" },
        { label: "New" },
      ]}
      actions={
        <>
          <Link
            href="/enquiries"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={onCreate}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
          >
            Create enquiry
          </button>
        </>
      }
    >
      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}
      <EnquiryForm record={record} sections={formSections} onChange={onChange} />
    </AppShell>
  );
}
