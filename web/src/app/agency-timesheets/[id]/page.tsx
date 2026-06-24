import { AgencyTimesheetDetailView } from "@/components/agency-timesheet-pages";

export default async function AgencyTimesheetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AgencyTimesheetDetailView id={id} />;
}
