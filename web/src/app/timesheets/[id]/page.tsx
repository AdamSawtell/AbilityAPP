import { TimesheetDetailView } from "@/components/timesheet-pages";

export default async function TimesheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TimesheetDetailView id={id} />;
}
