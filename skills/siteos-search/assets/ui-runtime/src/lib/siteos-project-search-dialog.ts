export type SiteOSProjectSearchDialogCategory =
  "documentation" | "api" | "guide" | "component" | "tutorial";

export type SiteOSProjectSearchDialogItem = {
  id: number;
  documentId?: string;
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

  // Preserve the engine's ranking. Group only adjacent results with the same label.
  const sections: SiteOSProjectSearchDialogSection[] = [];
  for (const item of params.results) {
    const title = item.sourceLabel || CATEGORY_LABELS[item.category];
    const last = sections[sections.length - 1];
    if (last?.title === title) last.items.push(item);
    else sections.push({ title, items: [item] });
  }
  return sections;
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
