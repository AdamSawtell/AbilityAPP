import { AgencyWorkerDetailView } from "@/components/agency-worker-pages";

export default async function AgencyWorkerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AgencyWorkerDetailView id={id} />;
}
