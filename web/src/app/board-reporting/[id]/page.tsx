import { BoardReportingDetailView } from "@/components/board-reporting-pages";

export default async function BoardReportingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BoardReportingDetailView id={id} />;
}
