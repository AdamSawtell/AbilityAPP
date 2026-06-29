import { MaintenanceRequestDetailView } from "@/components/maintenance-request-pages";

export default async function MaintenanceRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MaintenanceRequestDetailView id={id} />;
}
