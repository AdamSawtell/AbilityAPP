import { EmployeeDetailView } from "@/components/employee-pages";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmployeeDetailView id={id} />;
}
