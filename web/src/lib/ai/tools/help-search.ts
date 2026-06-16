import type { AuthSession } from "@/lib/access/types";
import { HELP_ARTICLES, allHelpChunks, filterArticlesForSession, searchHelpChunks } from "@/lib/help";

export function runHelpSearch(session: AuthSession, query: string, limit = 8) {
  const visible = filterArticlesForSession(HELP_ARTICLES, session.windowKeys);
  const chunks = allHelpChunks(visible);
  const results = searchHelpChunks(chunks, query, limit);
  return {
    query,
    count: results.length,
    results: results.map((c) => ({
      articleTitle: c.articleTitle,
      sectionTitle: c.sectionTitle,
      excerpt: c.text.slice(0, 400),
      slug: c.articleSlug,
      relatedRoutes: c.relatedRoutes,
    })),
  };
}
