import { Suspense } from "react";
import { IncidentDetailView } from "@/components/incident-pages";

function IncidentDetailFallback() {
  return <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading incident…</div>;
}

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<IncidentDetailFallback />}>
      <IncidentDetailView key={id} id={id} />
    </Suspense>
  );
}
