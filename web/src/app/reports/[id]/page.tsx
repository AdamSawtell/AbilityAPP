import { ReportRunnerView } from "@/components/report-runner";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;
  return <ReportRunnerView reportId={id} />;
}
