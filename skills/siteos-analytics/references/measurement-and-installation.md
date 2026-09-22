# Measurement and installation

The browser's explicit **Set up SiteOS Analytics** action enables first-time basic collection.
Generic Project attachment and Google setup do not. The waiting/connected guide persists across
navigation and reloads until a real accepted event and **Explore Analytics** acknowledgement.
That button only completes onboarding; it never gates collection or grants consent. A paused
configured resource stays paused when its guide is reopened. CLI callers use the existing
revision-checked `settings set --enabled true` only when authorized; never call browser-only
installation acknowledgement endpoints or generate synthetic traffic to clear onboarding.

Use the common Project context and the selected environment's resource. Start with safe output:

```sh
npx @siteoshq/cli analytics settings show --environment <slug> --json
npx @siteoshq/cli analytics installation --environment <slug> --json
```

## Interpret mode and collection evidence

The existing `analytics status`, `installation`, `report` and `settings show` reads pass through
`measurement` and `measurementStatus` when the selected server supplies them. `settings show`
keeps resource fields, including the update `revision`, at the top level. The hosted
`siteos_analytics_get_report` read returns the same server status; do not repeat reads through
both interfaces just to obtain it.

| Field | Meaning and limits |
| --- | --- |
| `measurement` | Baseline visitor-day report semantics, not an activated recognition mode. Minimal pageviews and detailed visit estimates remain separate populations. |
| `measurementStatus.capabilities` | Implemented collector capabilities, not installation, permission, account identification or released cross-day reports. |
| `configured` | Owner mode, enabled state, current activation, separate website controls/recognition provider and enforced retention. A draft is not activation. |
| `readiness` | Whether the configured recognition policy is off, paused, needs review, lacks its provider, or is ready **for permitted visitors**. Never a global consent grant. |
| `observation` | Accepted events within `from`–`checkedAt`, independent of report period and filters. A receipt is historical evidence, not current visitor consent or live activity. |

`recognitionAt` can refer to an older policy. Only `currentPolicyRecognition` describes evidence
under the current owner revision and matching provider configuration; even `observed` is not a
current consent claim. `externalWebsiteConsent: "unknown"` does not establish that an external
CMP is absent or functioning. No events can reflect no traffic, retention or erasure, not only a
missing script. A token issued without an accepted event is not collection evidence.

If either metadata field is absent, report that evidence as unavailable; never reconstruct a mode
from `consentSource`, a banner, a browser cookie or report counts. Read actual retention values
instead of a prepared draft. Active browser recognition is bounded to the selected 1–90 days from
the original grant, without activity renewal; detailed history is independently 30–730 days.
Both default to 30. Longer draft values are not active retention and cannot restore expired history.

These reads do not activate recognition. Read [measurement-modes-and-identity.md](measurement-modes-and-identity.md)
for the separate supported prepare/review/activate workflow and optional customer identity. `settings set` supports only the flags
listed below; do not invent a mode/retention flag, call private activation endpoints, or treat
`--enabled true` as enabling recognition. Check the installed CLI, server and browser runtime;
source documentation and successful local tests do not prove a public release. Identified
accounts/email and People reports are not implied by the recognition capability.

## Traffic exclusions

Open **Analytics → Settings → Traffic exclusions** in the selected Project environment. Verify the
installed runtime supports these controls before claiming an exclusion is active.

- **Your browser:** use **Check my browser** (or **Check or change**) to open the measured website
  and confirm, exclude or include that browser. The card shows **Not checked**, **Excluded** or
  **Not excluded**, with the last website-confirmed time. Opening Settings does not contact the
  website or poll it. A click alone is not confirmation; a blocked tab, missing script or storage
  failure must not be reported as success. A saved status can become stale after website data is
  cleared; recheck explicitly. The preference belongs to that browser, website origin and Analytics
  resource. It leaves past statistics and consent choices intact. An agent's browser does not
  establish the user's browser preference, and no CLI/report read can prove it.
- **Allowed website:** one exact origin, including scheme and port, comes from Project settings.
  Other subdomains, preview, staging and localhost cannot use this environment's key. Use a
  separate environment for another website address. There is no hostname wildcard/alias list or
  IP exclusion setting; do not loosen this binding to diagnose missing data.
- **Known bots → How filtering works:** the server and Edge use a manually maintained list of
  recognized crawler/monitoring User-Agent names. The UI links provider documentation; it does not
  download a live provider database. This is not sender authentication or complete bot detection.
  IP addresses, VPN use, behavior and headless mode alone do not trigger this filter. Excluded
  collection responses expose `X-SiteOS-Analytics-Excluded: known_bot` and `excluded: "known_bot"`;
  these expected exclusions do not indicate a delivery failure. There is no exclusion history or
  counter in this Settings card.

For ordinary Playwright checks, install this flag in the shared context fixture **before the first
navigation**, including pages opened later in that context:

```js
await context.addInitScript(() => {
  window.SiteOSAnalyticsDisabled = true;
});
await page.goto(websiteUrl);
```

This prevents Analytics initialization, configuration and measurement requests for the installed
runtime. Do not rely on bot recognition or a remembered browser exclusion in fresh test contexts.
Keep consent UI checks working normally. Tests intended to verify Analytics collection omit this
flag and use an isolated test environment, never synthetic production conversions. For Pulse,
follow its [shared fixture and publication workflow](../../siteos-pulse/references/playwright-authoring.md#keep-monitoring-out-of-analytics).

When traffic is missing, check this flag, the browser preference, exact origin and `known_bot`
diagnostics alongside script loading and consent. Do not disable privacy controls or widen the
accepted website to manufacture successful collection.

## Website collection and consent

Analytics starts independently. There is no Analytics consent-mode CLI flag. Native control belongs to the published Cookie banner in the same Project environment. Use `$siteos-cookie` to preserve the current draft, including any scoped `siteosAnalyticsConsent`, set `integrations.siteosAnalytics` and save it with the current draft version. Review and publish only within the user's authorization, then read back active publication and Analytics configuration. Find **Cookie → Services → SiteOS Analytics**; the control label reflects the configured scope. A draft save or service attachment alone has no effect, and enabling this integration does not activate recognition.

The following table concerns website details when the publication controls the **website** scope.
A recognition-only policy leaves independently permitted base statistics running on refusal or
unavailable consent. Recognition is an additional, separately activated layer requiring a current
affirmative grant; regional defaults never authorize it. Stronger website restrictions and global
privacy stops still apply to the base.

| Published website integration and visitor state | Detailed website collection |
| --- | --- |
| No Cookie, or integration off | Starts on load; no consent adapter needed |
| Integration on, Cookie missing/delayed/incompatible | Waits for the matching runtime |
| Integration on, strict opt-in | Waits for an explicit Analytics grant; refusal/withdrawal stops it |
| Integration on, reviewed opt-out/notice regional policy | Follows the resolved category permission; never labels a regional default as consent |
| External CMP gate explicitly configured before initialization | Waits for a fresh scoped `setConsent(snapshot)`; denial, missing, mismatched or expired evidence clears pending details |
| Any configuration, GPC/DNT or full opt-out | Stops both detailed and minimal measurement |

Cookie interaction details are collected only with an explicit Analytics grant in that banner, even when site measurement is independent. Aggregate banner metrics remain owned by Cookie. Optional minimal realtime is independent of this consent gate. The runtime's capabilities do not establish a legal exemption.

Analytics settings remain partial, revision-checked updates for `--enabled`, `--cookie-events` and `--minimal-realtime`. Changing settings requires owner/admin authority. Reload the website after publication/configuration changes. The collector rejects stale Cookie bindings once the integration is enabled or republished.

Install the exact snippet from `analytics installation`, once in the site's shared layout, preserving its public key and selected origin. The public key permits bounded writes, never report reads. The loader fetches configuration before collecting. Pageviews include initial navigation and SPA route changes; it sanitizes paths and ignores hashes. Consent and configuration changes must not add a second copy of the loader. Cookieless measurement has no persistent visitor identity. The separately activated recognition pilot uses a resource-scoped first-party cookie only with matching installation and affirmative permission. A remembered full opt-out is a separate privacy preference, not a visitor identifier. Neither storage nor a banner alone proves accepted recognition events.

For an external CMP, set these attributes on the direct script **before** it loads. Replace the
placeholders with the expected published policy, independently of a visitor's current record:

```html
data-siteos-consent="required"
data-siteos-consent-binding="REPLACE_WITH_CMP_BINDING"
data-siteos-consent-purpose="REPLACE_WITH_WEBSITE_PURPOSE"
data-siteos-consent-policy="REPLACE_WITH_PUBLISHED_POLICY_VERSION"
```

Binding identifies this site's CMP configuration, never a person or receipt. Purpose identifies
website measurement; policy version identifies the material disclosure, not a page load. Each key
is 1–160 characters from letters, digits, `_`, `:`, `.`, `/`, `-`. Missing/invalid installation
metadata fails initialization. Do not present placeholders as a completed installation.

From `siteos-analytics:ready` (or immediately if already ready), read the CMP's original purpose
record and forward the following snapshot; repeat on every choice change, including withdrawal:

```js
window.SiteOSAnalytics?.setConsent({
  schemaVersion: 1,
  resourceKey: "REPLACE_WITH_ANALYTICS_PUBLIC_KEY",
  scope: "website",
  bindingKey: record.bindingKey,
  purposeKey: record.purposeKey,
  policyVersion: record.policyVersion,
  status: record.status, // granted, denied or unknown
  grantedAt: record.grantedAt, // Original UTC epoch milliseconds, granted only
  expiresAt: record.expiresAt,
});
// No trustworthy current record, including after a reset:
window.SiteOSAnalytics?.setConsent(null);
```

`record` comes from a site-specific CMP adapter, not a supplied SiteOS global. Read stored policy
and original timestamps; never substitute the latest policy version or `Date.now()` on reload.
If the CMP exposes only a boolean/category, it cannot supply this evidence without an adapter
that preserves the original explicit purpose choice, material version and expiry. Do not invent
them. Fresh affirmative `granted` evidence must match every configured key and resource/scope.
Regionally `permitted` is not a grant for this required external gate. Evidence is copied into
memory and rechecked at actions/flush. A pending batch schedules a bounded two-second flush;
an empty queue does not keep a repeating flush timer. An activated
layered policy also sends its bounded scope evidence to the collector for server validation; no
permission payload or identity claims go to Trace. An in-flight committed event cannot be undone
by browser abort.

The configured basic pageview-only fallback can still run. An external grant cannot override a
native Cookie refusal, GPC/DNT or full opt-out. This website scope does **not** enable recognition
or identity storage. Never install the gate after independent initialization. Conflicting loader
policies stop that page's collector and require reload. Replace the old boolean-based direct/GTM
adapter and runtime together; there is no compatibility branch. Independent installation needs
none of these calls. Use full opt-out below when no measurement may be sent.

Use the full opt-out API for a publisher preference that must stop both detailed and minimal measurement:

```js
// Set before loading the snippet when a visitor has opted out.
window.SiteOSAnalyticsOptOut = true;
// Update a loaded runtime from the website's preference control.
window.SiteOSAnalytics?.setTrackingOptOut(true);
```

## Private page paths

Inspect the website's route shapes before installing. Built-in minimisation removes URL queries,
fragments and obvious identifier-like segments, but cannot recognize every name or private slug.
For example, `/members/alex-river` can still identify someone. Prefer public page templates for
private routes using the existing publisher hook, defined **before** the script or GTM initializes:

```js
window.SiteOSAnalyticsTransformPath = (pathname) =>
  pathname.replace(/^\/members\/[^/]+/, "/members/:id");
```

Adapt this example to the site's complete route model, including nested private routes. Return
only an absolute path template, never a complete URL, query, account ID or email. The result still
passes through built-in minimisation. This does not redact custom event categories, which must
be reviewed separately. If safe templates cannot be guaranteed, exclude the affected pages from
installation or use the pre-load full opt-out; do not assume a banner makes private paths safe.

Verify the actual browser request after initial load and SPA navigation, then the saved report.
Two different private routes may share one report template but still represent two pageviews.
GTM uses the same hook on the website; importing the template does not configure route redaction.
Check installed runtime support before claiming this source capability is available publicly.

## GTM

Use the SiteOS Analytics template supplied by the Analytics Setup interface when GTM is the site's chosen installation method. It is a private template, not a claimed Community Gallery listing. Set the resource key and SiteOS origin from the installation output. Choose one loader; remove duplicate direct-script installation when migrating with the user's authorization.

For a separate external website-details gate, enable **Require external consent for website details**, set **CMP binding key**, **Website
measurement purpose key**, and **Material policy version** independently of the visitor record.
Map a CMP adapter variable returning the object above into **Scoped consent snapshot**. Do not
use a stringified object or a boolean. Initialize and update on every change, including denial;
keep withdrawal runnable without an additional GTM consent gate. Leave external control off for
independent collection or native Cookie control. Do not infer consent from tag execution. A GTM
consent check or CMP script blocker can prevent initialization; inspect both layers. Native Cookie
requires no GTM consent mapping and supplies its own matching regional/visitor state.

Map only registered property names to custom events: a declared List value or explicit public content for a Text property. Check deployed Text capability and its privacy/size limits in [events-and-reports.md](events-and-reports.md). For example, a site's `signup_completed` dataLayer event may trigger the corresponding Analytics event after signup actually succeeds. Never forward the whole dataLayer payload or visitor input. Verify `business success → dataLayer → GTM trigger/tag → request → saved report` when this adapter is used.

## Realtime and countries

`analytics realtime` returns two separate populations:

- Detailed reports use accepted events: active visitor estimates over five minutes and a thirty-minute activity chart. They obey the published Cookie integration and any explicitly configured external gate.
- Optional `--minimal-realtime true` enables page-activity signals independent of Analytics consent, with no URL, campaign, country or custom properties. Active pages use a short visibility lease; they are not unique people. In-memory counters reset on server restart. GPC/DNT and full opt-out apply to both paths.

Countries come only from a configured trusted server resolver. `unknown` does not mean there were no visits. Do not derive country from Cookie decisions, browser language, timezone or arbitrary HTTP headers. Country/campaign filters apply to detailed reports and do not narrow the site-wide minimal counter.
