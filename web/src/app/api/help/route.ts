import { NextResponse } from "next/server";
import {
  HELP_ARTICLES,
  allHelpChunks,
  filterArticlesForSession,
  helpArticleBySlug,
  helpManifest,
  searchHelpChunks,
} from "@/lib/help";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";

export async function GET(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const query = searchParams.get("q") ?? "";
  const format = searchParams.get("format");

  const visible = filterArticlesForSession(HELP_ARTICLES, session.windowKeys);
  const chunks = allHelpChunks(visible);

  if (query.trim()) {
    const results = searchHelpChunks(chunks, query);
    if (format === "chunks") {
      return NextResponse.json({ query, count: results.length, chunks: results });
    }
    const slugs = [...new Set(results.map((c) => c.articleSlug))];
    return NextResponse.json({
      query,
      articles: visible.filter((a) => slugs.includes(a.slug)).map((a) => ({
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        category: a.category,
      })),
      chunks: results,
    });
  }

  if (slug) {
    const article = helpArticleBySlug(visible, slug);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json({ article, chunks: allHelpChunks([article]) });
  }

  return NextResponse.json({
    manifest: helpManifest(visible),
    chunkCount: chunks.length,
    version: "1",
  });
}
