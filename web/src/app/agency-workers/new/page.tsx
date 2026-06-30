"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NewAgencyWorkerView } from "@/components/agency-worker-pages";
import { ClientDetailSkeleton } from "@/components/ui/page-skeletons";

function NewAgencyWorkerPageInner() {
  const vendorBpId = useSearchParams().get("vendorBpId") ?? undefined;
  return <NewAgencyWorkerView vendorBpId={vendorBpId} />;
}

export default function NewAgencyWorkerPage() {
  return (
    <Suspense fallback={<div className="p-8"><ClientDetailSkeleton /></div>}>
      <NewAgencyWorkerPageInner />
    </Suspense>
  );
}
