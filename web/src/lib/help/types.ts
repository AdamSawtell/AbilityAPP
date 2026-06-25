export type HelpCategory =
  | "Foundation"
  | "Quick tasks"
  | "Core"
  | "People"
  | "Services"
  | "Finance"
  | "Reports"
  | "Admin"
  | "System setup"
  | "Reference";

export type HelpSection = {
  /** Stable id for anchors and AI chunk ids (e.g. `clients-consents`). */
  id: string;
  title: string;
  /** Plain text paragraphs. Separate paragraphs with a blank line. */
  body?: string;
  /** Optional numbered steps shown as an ordered list. */
  steps?: string[];
  /** Bullet points shown after the body. */
  bullets?: string[];
  relatedRoutes?: string[];
  windowKeys?: string[];
};

export type HelpArticle = {
  /** Stable id for AI retrieval (e.g. `article-clients`). */
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: HelpCategory;
  keywords: string[];
  relatedRoutes: string[];
  /** Empty means visible to every signed-in user. */
  windowKeys: string[];
  /** Portal-only articles are rendered by portal pages and hidden from staff help/search. */
  portalOnly?: boolean;
  lastUpdated: string;
  sections: HelpSection[];
};

export type HelpArticleManifest = Pick<
  HelpArticle,
  "id" | "slug" | "title" | "summary" | "category" | "keywords" | "relatedRoutes" | "windowKeys" | "lastUpdated"
>;

export type HelpChunk = {
  id: string;
  articleId: string;
  articleSlug: string;
  articleTitle: string;
  sectionId: string;
  sectionTitle: string;
  text: string;
  keywords: string[];
  relatedRoutes: string[];
  windowKeys: string[];
  category: HelpCategory;
};
