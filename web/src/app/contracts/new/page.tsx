import { NewContractView } from "@/components/contract-pages";

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  return <NewContractView key={clientId ?? "new"} clientId={clientId} />;
}
