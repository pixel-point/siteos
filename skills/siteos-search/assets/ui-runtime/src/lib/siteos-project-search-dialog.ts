export type SiteOSProjectSearchDialogCategory =
  | "documentation"
  | "api"
  | "guide"
  | "component"
  | "tutorial";

export type SiteOSProjectSearchDialogItem = {
  id: number;
  title: string;
  icon?: "book-open" | "file-text";
  description?: string;
  category: SiteOSProjectSearchDialogCategory;
  url: string;
  sourceLabel?: string;
  sectionLabel?: string;
  highlights?: {
    title?: SiteOSProjectSearchDialogHighlightPart[];
    snippet?: SiteOSProjectSearchDialogHighlightPart[];
  };
};

export type SiteOSProjectSearchDialogSection = {
  title: string;
  items: SiteOSProjectSearchDialogItem[];
};

export type SiteOSProjectSearchDialogHighlightPart = {
  text: string;
  matched: boolean;
};

const CATEGORY_LABELS: Record<SiteOSProjectSearchDialogCategory, string> = {
  documentation: "Documentation",
  api: "API Reference",
  guide: "Guides",
  component: "Components",
  tutorial: "Tutorials",
};

export function isSiteOSProjectSuggestionsState(query: string): boolean {
  return query.trim().length === 0;
}

export function buildSiteOSProjectSearchDialogSections(params: {
  query: string;
  recentSearches: SiteOSProjectSearchDialogItem[];
  suggestions: SiteOSProjectSearchDialogItem[];
  results: SiteOSProjectSearchDialogItem[];
}): SiteOSProjectSearchDialogSection[] {
  if (isSiteOSProjectSuggestionsState(params.query)) {
    return [
      ...(params.recentSearches.length > 0
        ? [{ title: "Recent", items: params.recentSearches }]
        : []),
      ...(params.suggestions.length > 0
        ? [{ title: "Suggestions", items: params.suggestions }]
        : []),
    ];
  }

  const groupedResults = params.results.reduce(
    (acc, item) => {
      const bucket = acc[item.category] ?? [];
      bucket.push(item);
      acc[item.category] = bucket;
      return acc;
    },
    {} as Partial<
      Record<SiteOSProjectSearchDialogCategory, SiteOSProjectSearchDialogItem[]>
    >,
  );

  return (Object.keys(CATEGORY_LABELS) as SiteOSProjectSearchDialogCategory[])
    .map((category) => ({
      title: CATEGORY_LABELS[category],
      items: groupedResults[category] ?? [],
    }))
    .filter((section) => section.items.length > 0);
}

export function resolveSiteOSProjectSearchTextParts(params: {
  text?: string;
  highlights?: SiteOSProjectSearchDialogHighlightPart[];
}): SiteOSProjectSearchDialogHighlightPart[] {
  const text = params.text ?? "";
  const highlights = params.highlights ?? [];

  if (highlights.length > 0 && highlights.some((part) => part.matched)) {
    return highlights;
  }

  return text.length > 0 ? [{ text, matched: false }] : [];
}
