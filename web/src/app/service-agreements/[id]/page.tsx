import { ServiceAgreementDetailView } from "@/components/service-agreement-pages";

export default async function ServiceAgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ServiceAgreementDetailView key={id} id={id} />;
}
