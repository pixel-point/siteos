const DEFAULT_SITEOS_SEARCH_API_BASE_URL = "https://siteos.xui.se";
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
  const apiBaseUrl =
    process.env.SITEOS_API_BASE_URL?.trim() || DEFAULT_SITEOS_SEARCH_API_BASE_URL;
  const upstreamUrl = new URL(
    `/api/search/environment/${encodeURIComponent(environmentSlug)}`,
    apiBaseUrl,
  );

  for (const [key, value] of requestUrl.searchParams.entries()) {
    upstreamUrl.searchParams.append(key, value);
  }
  upstreamUrl.searchParams.set("q", query);

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
