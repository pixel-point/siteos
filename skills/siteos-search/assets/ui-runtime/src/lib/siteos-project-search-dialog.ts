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
  title?: string;
  items: SiteOSProjectSearchDialogItem[];
};

export type SiteOSProjectSearchDialogHighlightPart = {
  text: string;
  matched: boolean;
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

  // Keep engine order without exposing internal source names as visitor headings.
  return params.results.length > 0 ? [{ items: params.results }] : [];
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
