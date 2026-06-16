import { LocationDetailView } from "@/components/location-pages";

export default async function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LocationDetailView id={id} />;
}
