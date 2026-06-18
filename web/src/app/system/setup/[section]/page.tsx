import { notFound } from "next/navigation";
import { resolveSystemSetupSection, SystemModuleSetupView } from "@/components/system/system-module-setup";

export default async function SystemModuleSetupPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const sectionKey = resolveSystemSetupSection(section);
  if (!sectionKey) notFound();
  return <SystemModuleSetupView sectionKey={sectionKey} />;
}
