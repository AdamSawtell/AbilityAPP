import { SystemGuideArticlePage } from "@/components/system/system-guide-article-page";

export default async function SystemGuideArticleRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SystemGuideArticlePage slug={slug} />;
}
