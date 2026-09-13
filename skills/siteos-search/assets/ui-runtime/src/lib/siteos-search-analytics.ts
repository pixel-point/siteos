// Optional visitor analytics. No persistent visitor identifier, storage or cookies.
type Consent = {
  categories?: string[];
  decision?: string;
  globalPrivacyControl?: boolean;
};
type CookieBridge = { getConsent(): Consent; ready: Promise<Consent> };
let consentOverride: boolean | null = null;
function cookie(): CookieBridge | undefined {
  return typeof window === "undefined"
    ? undefined
    : (window as unknown as { SiteOSCookie?: CookieBridge }).SiteOSCookie;
}
/** For another CMP, call on initial consent and every change. null restores SiteOS Cookie. */
export function setSiteOSSearchAnalyticsConsent(granted: boolean | null): void {
  consentOverride = granted;
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event("siteos-search:consent"));
}
export function canRecordSiteOSSearch(): boolean {
  if (
    typeof window === "undefined" ||
    navigator.doNotTrack === "1" ||
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl === true
  )
    return false;
  if (consentOverride !== null) return consentOverride;
  try {
    const state = cookie()?.getConsent();
    return Boolean(
      state &&
      !state.globalPrivacyControl &&
      ["accept_all", "custom"].includes(state.decision ?? "") &&
      state.categories?.includes("analytics"),
    );
  } catch {
    return false;
  }
}
export function subscribeSiteOSSearchConsent(listener: () => void): () => void {
  let active = true;
  const change = () => {
    if (active) listener();
  };
  const events = [
    "siteos-cookie:ready",
    "siteos-cookie:change",
    "siteos-search:consent",
  ];
  for (const event of events) window.addEventListener(event, change);
  void cookie()
    ?.ready.then(change)
    .catch(() => undefined);
  return () => {
    active = false;
    for (const event of events) window.removeEventListener(event, change);
  };
}
/** Receipts only come from real search results; click IDs must belong to those results. */
export function recordSiteOSSearch(
  receipt: string | undefined,
  clickedResultId?: string,
): void {
  if (!receipt || !canRecordSiteOSSearch()) return;
  void fetch("/api/search/query", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      receipt,
      ...(clickedResultId ? { clickedResultId } : {}),
    }),
  }).catch(() => undefined);
}
