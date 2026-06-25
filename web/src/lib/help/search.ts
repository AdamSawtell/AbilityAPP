import type { HelpArticle, HelpArticleManifest, HelpChunk } from "@/lib/help/types";

function sectionText(section: HelpArticle["sections"][number]): string {
  const parts = [section.title, section.body ?? ""];
  if (section.steps?.length) {
    parts.push(section.steps.map((step, i) => `${i + 1}. ${step}`).join("\n"));
  }
  if (section.bullets?.length) {
    parts.push(section.bullets.map((b) => `- ${b}`).join("\n"));
  }
  return parts.filter(Boolean).join("\n\n");
}

export function articleToChunks(article: HelpArticle): HelpChunk[] {
  return article.sections.map((section) => ({
    id: `${article.id}__${section.id}`,
    articleId: article.id,
    articleSlug: article.slug,
    articleTitle: article.title,
    sectionId: section.id,
    sectionTitle: section.title,
    text: `${article.title}\n\n${sectionText(section)}`,
    keywords: [...article.keywords, section.title.toLowerCase()],
    relatedRoutes: [...new Set([...article.relatedRoutes, ...(section.relatedRoutes ?? [])])],
    windowKeys: [...new Set([...article.windowKeys, ...(section.windowKeys ?? [])])],
    category: article.category,
  }));
}

export function helpManifest(articles: HelpArticle[]): HelpArticleManifest[] {
  return articles.map(({ id, slug, title, summary, category, keywords, relatedRoutes, windowKeys, lastUpdated }) => ({
    id,
    slug,
    title,
    summary,
    category,
    keywords,
    relatedRoutes,
    windowKeys,
    lastUpdated,
  }));
}

export function helpArticleBySlug(articles: HelpArticle[], slug: string): HelpArticle | undefined {
  return articles.find((a) => a.slug === slug);
}

export function filterArticlesForSession(
  articles: HelpArticle[],
  windowKeys: string[]
): HelpArticle[] {
  return articles.filter(
    (article) =>
      !article.portalOnly &&
      (article.windowKeys.length === 0 ||
        article.windowKeys.some((key) => windowKeys.includes(key)))
  );
}

function scoreChunk(chunk: HelpChunk, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const terms = q.split(/\s+/).filter(Boolean);
  let score = 0;
  const haystack = [
    chunk.articleTitle,
    chunk.sectionTitle,
    chunk.text,
    chunk.keywords.join(" "),
    chunk.category,
  ]
    .join(" ")
    .toLowerCase();

  if (q.startsWith("how do") || q.startsWith("how to")) {
    if (chunk.articleTitle.toLowerCase().startsWith("how do")) score += 10;
    if (chunk.category === "Quick tasks") score += 4;
  }

  for (const term of terms) {
    if (chunk.articleTitle.toLowerCase().includes(term)) score += 8;
    if (chunk.sectionTitle.toLowerCase().includes(term)) score += 6;
    if (chunk.keywords.some((k) => k.includes(term))) score += 4;
    if (haystack.includes(term)) score += 2;
  }
  return score;
}

export function searchHelpChunks(chunks: HelpChunk[], query: string, limit = 12): HelpChunk[] {
  const scored = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, query) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((row) => row.chunk);
}

export function allHelpChunks(articles: HelpArticle[]): HelpChunk[] {
  return articles.flatMap(articleToChunks);
}
