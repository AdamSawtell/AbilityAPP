import { ServicePlanningDetailView } from "@/components/service-planning-pages";

export default async function ServicePlanningDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ServicePlanningDetailView id={id} />;
}
