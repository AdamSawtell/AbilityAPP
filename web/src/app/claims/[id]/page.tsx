import { ClaimDetailView } from "@/components/claim-pages";

export default async function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClaimDetailView id={id} />;
}
