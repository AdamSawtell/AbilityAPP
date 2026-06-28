import { FleetVehicleDetailView } from "@/components/fleet-vehicle-pages";

export default async function FleetVehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FleetVehicleDetailView id={id} />;
}
