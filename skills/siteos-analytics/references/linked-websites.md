# Multiple websites in one Analytics environment

Use only when the user asks to combine explicitly related website origins in one Project
environment. First check installed `analytics --help` and server support; source documentation does
not prove a hosted release. Independent Projects and their historical data cannot be merged.

1. Read `analytics domains list --environment <slug> --json`. The first origin is the Project's
   primary address; up to ten exact origins can be active, with no wildcard or implicit subdomains.
2. Add the reviewed address with `analytics domains add https://app.example.com --revision <n>`.
   This separately registers a Project environment address, then saves Analytics membership. Both
   authorities are required. Partial registration does not enable collection and is safe to retry
   after inspecting current settings. Never change an unrelated environment or add preview hosts
   to production automatically.
3. Install the same Analytics key/script/catalog on each address. Other SiteOS services remain
   separately configured. Read `analytics installation`; domain membership does not publish Cookie.
4. Linking is separate: `analytics domains linking --enabled true --revision <n>`. It requires
   reviewed recognition activation and independent affirmative local permission on each website.
   Both sites can instead use anonymous collection without a banner, with linking off. With one
   native Cookie banner its published hostname scope must contain both sites. Preserve existing
   optional shared consent across subdomains; a valid shared choice needs no additional prompt.
   Analytics does not turn sharing on. External CMP integrations must supply their existing scoped snapshots
   in loader options `permissions` before the first page (`initialPermissionsVersion === 1`).
   Keep the original grant/expiry timestamps and forward changes through `setPermissions`.
5. Observe actual source → destination delivery in an isolated environment. `observations` separates
   last received event from last linked visit. `readiness` is configuration only. Denial must leave
   destination collection unlinked; opt-out/GPC/DNT must still stop measurement.

If a related website uses a different banner, select its exact existing Cookie Project/environment
in Domains, or use `domains consent-review --file <json>` with `origin` and
`binding: { projectId, environmentId, resourceId }`. Do not infer a binding from a name or hostname.
Publish the destination hostname and matching Analytics resource/scopes/retention through Cookie
first. A ready review returns `domainsRevision`, `cookiePublication`, and `activation`; pass those
unchanged with the selection to `domains consent-set --file <json>` after the authorized review.
Use `binding: null` to return to the already reviewed Project banner. These commands do not edit or
publish Cookie. Changed or detached bindings close required permissions, never fall back silently.
The primary banner stays managed through the ordinary Project and measurement workflow. Sites
using different banners retain independent choices. Domains labels a banner-free anonymous setup
separately from unavailable consent or missing recognition permission.

The runtime supports prepared ordinary links, new tabs and GET forms without delaying navigation.
Custom redirects can await `SiteOSAnalytics.prepareNavigation(url)`, which returns the original URL
on failure. Source events must already be durable at origin: an Edge `202` is not enough. Pending
imports mean an ordinary unlinked transition, with no later retroactive merge. A short-lived opaque
`_siteos_visit` token is cleaned on arrival. It carries no consent or identity. An unrelated active
destination visit cannot be merged. The visit still expires after 30 minutes of inactivity or UTC
midnight; there is no attribution of later-day purchases or cross-device identification.

Remove only a secondary origin with `analytics domains remove <origin> --revision <n> --confirm
<origin>`. New and queued collection from it stops; retained history remains. Refetch after revision
conflicts. Primary changes use Project settings. Stopping linking affects new handoffs; accepted
links finish with their existing visit. Cleanup of explicitly linked contexts remains available.

Reports accept Domain event filters and optional exact `origin` on existing page/event funnel or
goal steps. Use All domains for the full cross-site journey. Do not sum per-domain distinct visits.
Historical unknown origins stay unknown; anonymous pageviews never acquire domain metadata. GA4
report semantics remain independent. Browser exclusions must be confirmed separately on each site.

Rollout requires matching origin, Edge and loader config capability `domains=1`. The updated
Edge Worker must be installed before the new browser loader is served; the previous Worker rejects
the extra query parameter even for the primary site. Refresh and read back the signed Edge lease
after membership changes before claiming collection readiness. The updated
canonical GTM template forwards existing permission snapshots before initialization and needs a new
Gallery release. CLI/plugin publication, customer deployment and actual acceptance remain distinct.
