import { ClientDetailView } from "@/components/client-pages";

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientDetailView key={id} id={id} />;
}
