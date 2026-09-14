// For each route group, use the variable names returned by CLI --index ID --install.
// Keep these server-owned; visitors must never choose a credential/environment variable.
export const searchRuntimeVariables = {
  credential: "SITEOS_SEARCH_TOKEN",
  environment: "SITEOS_SEARCH_ENV",
  origin: "SITEOS_SEARCH_PUBLIC_URL",
};
export function readSiteOSSearchCredential() {
  return process.env[searchRuntimeVariables.credential]?.trim();
}

export function buildSiteOSSearchRuntimeUrl(requestUrl: URL, query: string): URL {
  const environmentSlug = process.env[searchRuntimeVariables.environment]?.trim();
  if (!environmentSlug) {
    throw new Error("SITEOS_SEARCH_ENV is required.");
  }
  const apiBaseUrl = process.env[searchRuntimeVariables.origin]?.trim();
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
