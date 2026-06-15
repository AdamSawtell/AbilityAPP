import { ContractDetailView } from "@/components/contract-pages";

export default async function ContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ContractDetailView key={id} id={id} />;
}
