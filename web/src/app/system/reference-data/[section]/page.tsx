import { ReferenceDataAdminView } from "@/components/admin/reference-data-page";
import { SYSTEM_NAV_SECTIONS } from "@/lib/system/nav";
import { isSystemReferenceSectionKey } from "@/lib/system/reference-data-sections";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ section: string }> };

export default async function SystemReferenceDataSectionPage({ params }: Props) {
  const { section } = await params;
  const known = isSystemReferenceSectionKey(section) && SYSTEM_NAV_SECTIONS.some((s) => s.key === section);
  if (!known) notFound();
  return <ReferenceDataAdminView variant="system" sectionKey={section} />;
}
