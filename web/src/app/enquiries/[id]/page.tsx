import { EnquiryDetailView } from "@/components/enquiry-pages";

export default async function EnquiryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EnquiryDetailView key={id} id={id} />;
}
