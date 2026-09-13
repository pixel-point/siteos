const SITEOS_SEARCH_ENVIRONMENT_ENV = "SITEOS_SEARCH_ENV";
const SITEOS_RUNTIME_QUERY_CREDENTIAL_HEADER =
  "x-siteos-project-search-credential";

type SiteOSProjectSearchRouteErrorResponse = {
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

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const queryCredential = process.env.SITEOS_SEARCH_TOKEN?.trim() ?? null;

  if (!query) {
    return createJsonResponse(
      createSearchErrorResponse({
        code: "SEARCH_INVALID_QUERY",
        message: "Search query is required.",
        query: "",
      }),
      400,
    );
  }

  if (!queryCredential) {
    return createJsonResponse(
      createSearchErrorResponse({
        code: "SEARCH_QUERY_CREDENTIAL_MISSING",
        message:
          "Managed search is configured but missing its server-side query credential.",
        query,
      }),
      503,
    );
  }

  try {
    const upstreamUrl = buildSiteOSSearchRuntimeUrl(url, query);
    const response = await fetch(upstreamUrl, {
      method: "GET",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]),
      headers: {
        Accept: "application/json",
        [SITEOS_RUNTIME_QUERY_CREDENTIAL_HEADER]: queryCredential,
      },
    });
    const payload = await readJsonResponse(response);

    if (response.ok) {
      return createJsonResponse(payload, 200);
    }

    return createJsonResponse(
      isSearchContractErrorPayload(payload)
        ? payload
        : createUpstreamErrorResponse(payload, query),
      normalizeUpstreamStatus(response.status),
    );
  } catch {
    return createJsonResponse(
      createSearchErrorResponse({
        code: "SEARCH_UPSTREAM_UNAVAILABLE",
        message: "Search is temporarily unavailable.",
        query,
      }),
      503,
    );
  }
}

function buildSiteOSSearchRuntimeUrl(requestUrl: URL, query: string): URL {
  const environmentSlug = process.env[SITEOS_SEARCH_ENVIRONMENT_ENV]?.trim();
  if (!environmentSlug) {
    throw new Error("SITEOS_SEARCH_ENV is required.");
  }
  const apiBaseUrl = process.env.SITEOS_SEARCH_PUBLIC_URL?.trim();
  if (!apiBaseUrl) {
    throw new Error("SITEOS_SEARCH_PUBLIC_URL is required.");
  }
  const origin = new URL(apiBaseUrl);
  if (
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    !(
      origin.protocol === "https:" ||
      (origin.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname))
    )
  )
    throw new Error("Invalid Search origin.");
  const upstreamUrl = new URL(
    `/api/search/environment/${encodeURIComponent(environmentSlug)}`,
    apiBaseUrl,
  );

  upstreamUrl.searchParams.set("q", query);
  for (const key of [
    "limit",
    "offset",
    "kind",
    "section",
    "interactionId",
    "installation",
  ]) {
    const value = requestUrl.searchParams.get(key);
    if (value) upstreamUrl.searchParams.set(key, value);
  }

  return upstreamUrl;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const responseText = await response.text();
  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return {
      success: false,
      code: "SEARCH_UPSTREAM_ERROR",
      message: "Managed search returned an invalid response.",
    };
  }
}

function createSearchErrorResponse(params: {
  code: string;
  message: string;
  query: string;
}): SiteOSProjectSearchRouteErrorResponse {
  return {
    success: false,
    code: params.code,
    message: params.message,
    requestId: "siteos-search-server",
    degraded: true,
    query: params.query,
    hits: [],
    items: [],
    total: 0,
    processingTimeMs: 0,
  };
}

function createUpstreamErrorResponse(
  payload: unknown,
  query: string,
): SiteOSProjectSearchRouteErrorResponse {
  const code = isRecord(payload) ? readString(payload.code) : null;
  const message = isRecord(payload) ? readString(payload.message) : null;

  return createSearchErrorResponse({
    code: code ?? "SEARCH_UPSTREAM_ERROR",
    message: message ?? "Managed search rejected this request.",
    query,
  });
}

function createJsonResponse(payload: unknown, status: number): Response {
  return Response.json(payload, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function normalizeUpstreamStatus(status: number): number {
  return status >= 400 && status < 600 ? status : 503;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSearchContractErrorPayload(
  value: unknown,
): value is SiteOSProjectSearchRouteErrorResponse {
  return (
    isRecord(value) &&
    value.success === false &&
    Array.isArray(value.hits) &&
    Array.isArray(value.items)
  );
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export async function POST(request: Request): Promise<Response> {
  // A same-origin endpoint keeps the server credential out of visitor code.
  if (!isSameOrigin(request))
    return createJsonResponse({ accepted: false }, 403);
  const credential = process.env.SITEOS_SEARCH_TOKEN?.trim();
  if (!credential) return createJsonResponse({ accepted: false }, 503);
  if (Number(request.headers.get("content-length") ?? 0) > 17_000)
    return createJsonResponse({ accepted: false }, 400);
  try {
    const source = await request.text();
    if (new TextEncoder().encode(source).length > 17_000)
      return createJsonResponse({ accepted: false }, 400);
    const value: unknown = JSON.parse(source);
    if (
      !isRecord(value) ||
      typeof value.receipt !== "string" ||
      value.receipt.length > 16_000 ||
      Object.keys(value).some(
        (key) => !["receipt", "clickedResultId"].includes(key),
      ) ||
      (value.clickedResultId !== undefined &&
        (typeof value.clickedResultId !== "string" ||
          value.clickedResultId.length > 255))
    )
      return createJsonResponse({ accepted: false }, 400);
    const upstream = buildSiteOSSearchRuntimeUrl(new URL(request.url), "");
    upstream.search = "";
    upstream.pathname += "/events";
    const result = await fetch(upstream, {
      method: "POST",
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(5000)]),
      headers: {
        "Content-Type": "application/json",
        [SITEOS_RUNTIME_QUERY_CREDENTIAL_HEADER]: credential,
      },
      body: JSON.stringify(value),
    });
    return createJsonResponse(
      { accepted: result.ok },
      result.ok ? 202 : normalizeUpstreamStatus(result.status),
    );
  } catch {
    return createJsonResponse({ accepted: false }, 503);
  }
}

function isSameOrigin(request: Request): boolean {
  try {
    const rawOrigin = request.headers.get("origin");
    if (!rawOrigin) return false;
    const origin = new URL(rawOrigin);
    const url = new URL(request.url);
    // Next.js can construct request.url with an internal hostname. Host describes
    // the incoming website request; arbitrary forwarded-host headers are ignored.
    const host = request.headers.get("host") ?? url.host;
    const site = request.headers.get("sec-fetch-site");
    return (
      rawOrigin === origin.origin &&
      ["http:", "https:"].includes(origin.protocol) &&
      origin.host === host &&
      (!site || site === "same-origin")
    );
  } catch {
    return false;
  }
}
