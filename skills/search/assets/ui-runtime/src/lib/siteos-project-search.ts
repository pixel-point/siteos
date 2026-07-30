export type SiteOSProjectSearchHighlightPart = {
  text: string;
  matched: boolean;
};

export type SiteOSProjectSearchHit = {
  id: string;
  sourceName: string;
  sourceType: string;
  title: string;
  url: string;
  snippet?: string;
  sourceLabel: string;
  sectionLabel?: string;
  highlights?: {
    title?: SiteOSProjectSearchHighlightPart[];
    snippet?: SiteOSProjectSearchHighlightPart[];
  };
};

export type SiteOSProjectSearchItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  kind: string;
  section: string;
  highlights?: {
    title?: SiteOSProjectSearchHighlightPart[];
    description?: SiteOSProjectSearchHighlightPart[];
    snippet?: SiteOSProjectSearchHighlightPart[];
  };
};

export type SiteOSProjectSearchQueryResponse = {
  success: true;
  query: string;
  hits: SiteOSProjectSearchHit[];
  items: SiteOSProjectSearchItem[];
  total: number;
  processingTimeMs: number;
  requestId: string;
  degraded: boolean;
  code?: string;
  message?: string;
};

export type SiteOSProjectSearchQueryErrorResponse = {
  success: false;
  code: string;
  message: string;
  requestId: string;
  degraded: true;
  query: string;
  hits: [];
  items: [];
  total: 0;
  processingTimeMs: number;
};

export async function searchSiteOSProject(
  query: string,
  options: {
    limit?: number;
    signal?: AbortSignal;
  } = {},
): Promise<
  SiteOSProjectSearchQueryResponse | SiteOSProjectSearchQueryErrorResponse
> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return createSearchErrorResponse({
      code: "SEARCH_INVALID_QUERY",
      message: "Search query is required.",
      query: "",
    });
  }

  const response = await fetch(
    buildSiteOSSearchQueryUrl(normalizedQuery, options.limit),
    {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
      headers: {
        Accept: "application/json",
      },
      ...(options.signal ? { signal: options.signal } : {}),
    },
  );

  return (await response.json()) as
    | SiteOSProjectSearchQueryResponse
    | SiteOSProjectSearchQueryErrorResponse;
}

function buildSiteOSSearchQueryUrl(query: string, limit?: number): string {
  const params = new URLSearchParams({
    q: query,
  });

  if (typeof limit === "number") {
    params.set("limit", String(limit));
  }

  return `/api/search/query?${params.toString()}`;
}

function createSearchErrorResponse(params: {
  code: string;
  message: string;
  query: string;
}): SiteOSProjectSearchQueryErrorResponse {
  return {
    success: false,
    code: params.code,
    message: params.message,
    requestId: "siteos-search-client",
    degraded: true,
    query: params.query,
    hits: [],
    items: [],
    total: 0,
    processingTimeMs: 0,
  };
}
