# Integration monitoring

Use this workflow for consent readiness, SDK/pixel activity, missing service launches or repeated
tracking. It applies to every Project using supported adapters. It does not promise coverage of
every vendor, endpoint, iframe, proxy or server-side integration.

## Read coverage before judging absence

Use `siteos_trace_get_coverage` or `siteos trace coverage --environment <slug> --json`, then inspect
current observations and the published installation. Destination coverage distinguishes excluded,
unsupported, historical, resources-only and current request evidence. Use the returned capabilities
and actual runtime version; no recent signal can mean late, blocked or absent observation.
Importing a GTM tag is configuration evidence, not proof of execution or network activity.

Trace 0.6 observes supported Google tag, Meta pixel and HubSpot loader signatures, plus recognized
destination pixels. Native SiteOS Analytics has its own event evidence. Trace 0.7 added selected
ZoomInfo, LinkedIn Insight and Microsoft Clarity request and loader signatures; filters use
`zoominfo`, `linkedin` and `clarity`. Runtime 0.8 recognizes them, and any other third-party
service, through vendor discovery (always on; the website needs the 0.8 snippet): the shared
vendor registry names a cross-site request or script, image or frame load from its hostname, and Trace stores only the vendor id and registrable
domain. Discovered services show activity without event names, rules, SDK checks or coverage-matrix
capabilities; analytics and marketing vendors observed while that purpose was denied raise generic
consent issues. An unrecognized domain is shown as such. Warmly, Clay and Zaraz have no deep
adapter. A custom service or GTM name does not add an adapter. Resource Timing describes a load/request attempt, not SDK initialization or receipt.
Only known start-time consent/route context supports resource consent conclusions; buffered or
unknown-context entries remain inconclusive. Fetch/XHR/Beacon copies are excluded from resource
counts, and a request plus its terminal result is one operation.

## Service map

`siteos_trace_get_services` or `siteos trace services --environment <slug> [--period 24h|7d] --json`
returns one row per service: mapped live GTM tags, real traffic for the period (events, page views,
last seen, consent), the latest Cookie scan items and the Cookie banner declaration. Each fact
keeps its own source and date; a GTM tag does not prove the service runs, traffic does not prove
it is declared, and a missing Cookie column (`null`) means Cookie is not attached or the
connection lacks Cookie read. A tag or domain is attributed first to a Cookie service whose
owner-declared sources match it (`identity.source: "cookie"`), then by GTM template type or a
registry vendor of the hosts its Custom HTML loads, never by name; read `identity` before
explaining why a row is a service and `tagManager.unmappedTags` before claiming a tag has no
service. Hosting and CDN files (S3, CloudFront, jsDelivr and similar) never name a service: a tag
that loads only them is `kind: "unidentified_tag"` (its name is not a service), and observed
hosting domains are listed in `infrastructure`. An `unrecognized` row is a registrable domain only:
research it before describing it. `state` and `action` give the one next step (add, publish or
identify in Cookie; paused tags need none and are never attention); `cookieReference` is what
Cookie Services resolves for it. Use the row's `reference` as the Browser activity filter. To
identify a tag through the CLI, add a `gtm` discovery source such as
`{ "source": "gtm", "reference": "GTM-XXXX tag 21 · <tag name>", "url": "<script URL without query>" }`
to the matching Cookie custom service.

Read resource evidence through `siteos_trace_list_observations` with `kind: "resource"`, or
`siteos trace observations --kind resource --environment <slug> --json`. Read findings through
`siteos_trace_get_issue` or `siteos trace issue show --id <id> --environment <slug> --json`.
Use its retained page timeline to inspect adjacent stages without assuming causality.

## Independent CMP state

Runtime 0.5+ supports a provider-neutral public adapter under `explicit_adapter`. SiteOS Cookie
uses its existing `siteos_cookie` mode. No bundled iubenda or other vendor adapter is implied.
Read the CMP's public API independently of Google/GTM consent commands. Never infer a user's
choice solely from the integration signal being investigated, cookies, storage or DOM text.

When implementing an authorized external adapter, expose this synchronous getter before Trace
starts, backed by the CMP's actual public state:

```js
window.SiteOSTraceConsent = {
  getSnapshot() {
    return {
      schemaVersion: 1,
      adapter: "example_cmp",
      ready: false,
      choice: "unknown", // initial | restored | interaction | unknown
      analytics: "unknown", // granted | denied | unknown
      advertising: "unknown",
      advertisingOptOut: false,
      googleConsentMode: "unknown", // off | basic | advanced | unknown
    };
  },
};
```

Replace the example with a fresh projection; unknown values are not permissions. Extra fields
invalidate it. After applying actual CMP state, synchronously dispatch `siteos-trace:consent-ready`
for readiness and `siteos-trace:consent-change` for later changes. Trace reads the getter, not event
detail. Keep initial, restored and interaction choices distinct. Trace observes GPC/advertising
opt-out without changing consent or forwarding it to tags. An initial snapshot does not prove an
observed readiness transition; readiness before Trace begins may be missed.

## Published rule choices

The existing version-guarded CLI tracking-plan save/publish commands accept these optional fields
with the matching server. Preserve the full draft and unrelated expectations; MCP remains read-only.

- `afterConsentReadySeconds` (5–300) expects a named destination event after observed CMP readiness
  while the required purpose is already granted. This includes initial permission and restored
  consent; it differs from `afterConsentSeconds`, which follows a new grant. Requires a consent
  purpose; `custom` and `google_ads` are ineligible. Missing/hidden/gapped page evidence prevents a
  verdict. Use only when readiness itself should trigger that event, not a later business action.
- `checkSdkConsent: true` explicitly applies this rule's consent purpose to recognized SDK loads
  for `ga4`, `google_ads`, `meta` or `hubspot`. It requires independent CMP evidence and runtime
  0.6+. Google Advanced/unknown Consent Mode under denial remains informational review.
- `allowRepeatedEvents: true` excludes the selected provider/event from future automatic duplicate
  checks when repetition is intentional. It does not prove recovery of an existing warning.

Saved drafts do not change analysis until published. Do not enable a policy or suppress an issue
merely to clear a dashboard; derive it from the actual service and consent contract.

## Repeat findings and verification

`duplicate_event` identifies close repeat candidates within 100 ms above 2% of at least 100 eligible
observations in a completed hour. Scope includes the page, destination and known GA4 Measurement ID.
Known operation retries/results count once. A complete healthy current window can verify recovery;
silence, another GA4 stream or policy exclusion cannot.

`repeated_sdk_load` and `repeated_tag_execution` are informational after close repeats on at least
two page lifetimes. The former compares loader families; the latter compares exact container/tag
callbacks. Neither proves repeated SDK initialization or duplicate destination events. Multiple
accounts with one loader family and duplicated monitor callbacks can remain indistinguishable.
These notices require review; silence does not automatically resolve them.

Verify fresh runtime version, published revision, retained evidence and the rendered finding after
an authorized upgrade. Installing a newer plugin or deploying the server does not replace a pinned
website snippet. Use the exact returned snippet/SRI and preserve intentional provider exclusions.
Publish customer/GTM configurations only within the requested Project/environment scope. Exercise
faulty consent or repeat scenarios in controlled fixtures, not on production visitor journeys.

### iubenda

Use `consentMode: "iubenda"` with runtime 0.10+. The current installation snippet reads iubenda's
public Measurement/Marketing permissions on the same page; no provider credentials or custom
getter are required. Save and publish explicitly, then replace an older snippet. Keep strict
collection and Immediate/After analytics consent as separate choices. Late attachment provides
permission snapshots but cannot invent missed ready/grant/withdrawal callbacks. Verify runtime,
published revision and real before-choice/grant/withdrawal requests on the selected environment;
local synthetic adapter tests are not hosted acceptance.
