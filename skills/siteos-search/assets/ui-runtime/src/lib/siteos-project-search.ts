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
  analyticsReceipt?: string;
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

export type SiteOSSearchClientConfig = {
  /** A host-owned proxy, or an explicitly published Search Edge query URL. */
  endpoint: string;
  publicKey?: string;
  canRecordAnalytics?: () => boolean;
};
export type SiteOSSearchQueryOptions = {
  limit?: number;
  signal?: AbortSignal;
  interactionId?: string;
  offset?: number;
  source?: string;
  section?: string;
};
/** Editable, framework-neutral client. It does not render UI or load a hosted widget. */
export function createSiteOSSearchClient(config: SiteOSSearchClientConfig) {
  const endpoint = new URL(config.endpoint, "https://siteos-client.invalid");
  const localHttp = endpoint.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname);
  if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash ||
      (!safeSearchPath(config.endpoint) && !((config.endpoint.startsWith("https://") && endpoint.protocol === "https:") || localHttp)) ||
      (config.publicKey !== undefined && !/^spk_[A-Za-z0-9_-]{20,100}$/u.test(config.publicKey)))
    throw new Error("Use a query endpoint and a publishable Search key; private credentials stay on the server.");
  const consent = () => {
    try {
      return typeof navigator !== "undefined" && navigator.doNotTrack !== "1" &&
        (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl !== true &&
        config.canRecordAnalytics?.() === true;
    } catch { return false; }
  };
  const headers = (): Record<string, string> => config.publicKey ? { "X-SiteOS-Search-Key": config.publicKey } : {};
  return {
    search(query: string, options: SiteOSSearchQueryOptions = {}) {
      return querySiteOSProject(query, { ...options, interactionId: consent() ? options.interactionId : undefined }, config);
    },
    async record(receipt: string | undefined, clickedResultId?: string): Promise<boolean> {
      if (!receipt || !consent()) return false;
      try {
        const response = await fetch(config.endpoint, {
          method: "POST", credentials: "omit", cache: "no-store", keepalive: true, redirect: "error", referrerPolicy: "no-referrer",
          headers: { "Content-Type": "application/json", ...headers() },
          body: JSON.stringify({ receipt, ...(config.publicKey ? { consent: true } : {}), ...(clickedResultId ? { clickedResultId } : {}) }),
        });
        return response.ok;
      } catch { return false; }
    },
  };
}
export function searchSiteOSProject(query: string, options: SiteOSSearchQueryOptions = {}) {
  return querySiteOSProject(query, options, { endpoint: "/api/search/query" });
}
async function querySiteOSProject(
  query: string,
  options: SiteOSSearchQueryOptions,
  config: SiteOSSearchClientConfig,
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
    `${config.endpoint}${buildSiteOSSearchQueryUrl(normalizedQuery, options)}`,
    {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
      headers: {
        Accept: "application/json",
        ...(config.publicKey ? { "X-SiteOS-Search-Key": config.publicKey } : {}),
      },
      ...(options.signal ? { signal: options.signal } : {}),
    },
  );

  const value: unknown = await readSearchResponse(response);
  if (
    !response.ok ||
    !isRecord(value) ||
    value.success !== true ||
    !Array.isArray(value.hits) ||
    value.hits.length > 100 ||
    !Number.isFinite(value.total) ||
    Number(value.total) < 0 ||
    !Number.isFinite(value.processingTimeMs)
  )
    return createSearchErrorResponse({
      code: "SEARCH_UNAVAILABLE",
      message: "Search is temporarily unavailable. Please try again.",
      query: normalizedQuery,
    });
  const hits = value.hits
    .filter(
      (hit): hit is Record<string, unknown> =>
        isRecord(hit) &&
        typeof hit.id === "string" &&
        typeof hit.title === "string" &&
        typeof hit.sourceName === "string" &&
        typeof hit.url === "string" &&
        safeSearchPath(hit.url),
    )
    .map((hit): SiteOSProjectSearchHit => ({
      id: String(hit.id),
      title: String(hit.title),
      url: String(hit.url),
      sourceName: String(hit.sourceName),
      sourceType:
        typeof hit.sourceType === "string"
          ? hit.sourceType
          : String(hit.sourceName),
      sourceLabel:
        typeof hit.sourceLabel === "string"
          ? hit.sourceLabel
          : String(hit.sourceName),
      ...(typeof hit.snippet === "string" ? { snippet: hit.snippet } : {}),
      ...(isRecord(hit.highlights) ? { highlights: {
        title: highlightParts(hit.highlights.title), snippet: highlightParts(hit.highlights.snippet),
      } } : {}),
      ...(typeof hit.sectionLabel === "string"
        ? { sectionLabel: hit.sectionLabel }
        : {}),
    }));
  return {
    success: true,
    query: normalizedQuery,
    hits,
    items: hits.map((hit) => ({
      id: hit.id,
      title: hit.title,
      href: hit.url,
      description: hit.snippet ?? "",
      kind: hit.sourceName,
      section: hit.sectionLabel ?? "",
      ...(hit.highlights ? { highlights: { title: hit.highlights.title, description: hit.highlights.snippet } } : {}),
    })),
    total: Number(value.total),
    processingTimeMs: Number(value.processingTimeMs),
    requestId:
      typeof value.requestId === "string"
        ? value.requestId
        : "siteos-search-client",
    degraded: false,
    ...(typeof value.analyticsReceipt === "string" &&
    value.analyticsReceipt.length <= 16_000
      ? { analyticsReceipt: value.analyticsReceipt }
      : {}),
  };
}

function buildSiteOSSearchQueryUrl(
  query: string,
  options: {
    limit?: number;
    offset?: number;
    source?: string;
    section?: string;
    interactionId?: string;
  },
): string {
  const params = new URLSearchParams({
    q: query,
  });

  if (typeof options.limit === "number") {
    params.set("limit", String(options.limit));
  }

  if (options.offset !== undefined)
    params.set("offset", String(options.offset));
  if (options.source) params.set("kind", options.source);
  if (options.section) params.set("section", options.section);
  if (options.interactionId) params.set("interactionId", options.interactionId);
  return `?${params.toString()}`;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function safeSearchPath(value: string): boolean {
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !Array.from(value).some(character => character === "\\" || character.charCodeAt(0) <= 32)
  );
}

function highlightParts(value: unknown): SiteOSProjectSearchHighlightPart[] | undefined {
  if (!Array.isArray(value) || value.length > 200 || value.some(part => !isRecord(part) || typeof part.text !== "string" || typeof part.matched !== "boolean")) return undefined;
  return value.map(part => ({ text: String(part.text), matched: Boolean(part.matched) }));
}

async function readSearchResponse(response: Response): Promise<unknown> {
  if (!response.body) return null;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0, text = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 1_000_000) { await reader.cancel(); return null; }
      text += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode()) as unknown;
  } catch { return null; }
  finally { reader.releaseLock(); }
}
