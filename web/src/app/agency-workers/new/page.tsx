"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NewAgencyWorkerView } from "@/components/agency-worker-pages";

function NewAgencyWorkerPageInner() {
  const vendorBpId = useSearchParams().get("vendorBpId") ?? undefined;
  return <NewAgencyWorkerView vendorBpId={vendorBpId} />;
}

export default function NewAgencyWorkerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading…</div>}>
      <NewAgencyWorkerPageInner />
    </Suspense>
  );
}
