import { buildSiteOSSearchRuntimeUrl, readSiteOSSearchCredential } from "../runtime-url";

/** Same private server credential and exact environment as query; no search analytics. */
export async function GET(request: Request): Promise<Response> {
  const credential = readSiteOSSearchCredential();
  const headers = { "Cache-Control": "no-store" };
  if (!credential) return Response.json({ configured: false, items: [] }, {status:503,headers});
  try {
    const upstream = buildSiteOSSearchRuntimeUrl(new URL(request.url), "");
    upstream.search = "";
    upstream.pathname += "/suggestions";
    const response = await fetch(upstream, {cache:"no-store",redirect:"error",
      signal:AbortSignal.any([request.signal,AbortSignal.timeout(5000)]),
      headers:{Accept:"application/json","x-siteos-project-search-credential":credential}});
    if (!response.ok) return Response.json({ configured: false, items: [] }, {status:response.status,headers});
    return Response.json(await response.json(), {headers});
  } catch { return Response.json({ configured:false,items:[] }, {status:503,headers}); }
}
