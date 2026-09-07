# Measurement and installation

Use the common Project context and the selected environment's resource. Start with safe output:

```sh
npx @siteoshq/cli analytics settings show --environment <slug> --json
npx @siteoshq/cli analytics installation --environment <slug> --json
```

Analytics starts independently. There is no Analytics consent-mode setting. Native blocking belongs to the published Cookie banner in the same Project environment. Use `$siteos-cookie` to preserve the current draft, set `integrations.siteosAnalytics` and save it with the current draft version. Review and publish only within the user's authorization, then read back active publication and Analytics configuration. The interface is **Cookie → Installation → Integrations → SiteOS Analytics**. A draft save or service attachment alone has no effect.

| Published integration and visitor state | Detailed collection |
| --- | --- |
| No Cookie, or integration off | Starts on load; no consent adapter needed |
| Integration on, Cookie missing/delayed/incompatible | Waits for the matching runtime |
| Integration on, strict opt-in | Waits for an explicit Analytics grant; refusal/withdrawal stops it |
| Integration on, reviewed opt-out/notice regional policy | Follows the resolved category permission; never labels a regional default as consent |
| External CMP gate explicitly enabled before initialization | Waits for actual `setConsent(true)`; `false` clears pending events |
| Any configuration, GPC/DNT or full opt-out | Stops both detailed and minimal measurement |

Cookie interaction details are collected only with an explicit Analytics grant in that banner, even when site measurement is independent. Aggregate banner metrics remain owned by Cookie. Optional minimal realtime is independent of this consent gate. The runtime's capabilities do not establish a legal exemption.

Analytics settings remain partial, revision-checked updates for `--enabled`, `--cookie-events` and `--minimal-realtime`. Changing settings requires owner/admin authority. Reload the website after publication/configuration changes. The collector rejects stale Cookie bindings once the integration is enabled or republished.

Install the exact snippet from `analytics installation`, once in the site's shared layout, preserving its public key and selected origin. The public key permits bounded writes, never report reads. The loader fetches configuration before collecting. Pageviews include initial navigation and SPA route changes; it sanitizes paths and ignores hashes. Consent and configuration changes must not add a second copy of the loader. The runtime does not use cookies or local/session storage for visitor identity.

For an external CMP, add `data-siteos-consent="required"` to the direct script before it loads. This closes the initial gate before any pageview. From the runtime's load/ready callback, call `window.SiteOSAnalytics?.setConsent(true|false)` using the CMP's real initial choice, then on every update. Never use a delay as consent, or wait until after independent initialization to install a gate. An external grant cannot override a native Cookie refusal. The independent installation needs none of these consent calls.

Use the full opt-out API for a publisher preference that must stop both detailed and minimal measurement:

```js
// Set before loading the snippet when a visitor has opted out.
window.SiteOSAnalyticsOptOut = true;
// Update a loaded runtime from the website's preference control.
window.SiteOSAnalytics?.setTrackingOptOut(true);
```

## GTM

Use the SiteOS Analytics template supplied by the Analytics Setup interface when GTM is the site's chosen installation method. It is a private template, not a claimed Community Gallery listing. Set the resource key and SiteOS origin from the installation output. Choose one loader; remove duplicate direct-script installation when migrating with the user's authorization.

For an external CMP, enable **Use external consent manager** and map the real Analytics consent state to the template's external consent input on initialization and subsequent updates. Leave this option off for independent collection or native Cookie control. Do not infer consent from tag execution. An additional GTM consent check or CMP script blocker can prevent the loader itself from running; inspect both layers. Native Cookie requires no GTM consent mapping and supplies its own matching regional/visitor state.

Map only named, registered categorical values to custom events. For example, a site's `signup_completed` dataLayer event may trigger the corresponding Analytics event after signup actually succeeds. Never forward the whole dataLayer payload. Verify `business success → dataLayer → GTM trigger/tag → request → saved report` when this adapter is used.

## Realtime and countries

`analytics realtime` returns two separate populations:

- Detailed reports use accepted events: active visitor estimates over five minutes and a thirty-minute activity chart. They obey the published Cookie integration and any explicitly configured external gate.
- Optional `--minimal-realtime true` enables page-activity signals independent of Analytics consent, with no URL, campaign, country or custom properties. Active pages use a short visibility lease; they are not unique people. In-memory counters reset on server restart. GPC/DNT and full opt-out apply to both paths.

Countries come only from a configured trusted server resolver. `unknown` does not mean there were no visits. Do not derive country from Cookie decisions, browser language, timezone or arbitrary HTTP headers. Country/campaign filters apply to detailed reports and do not narrow the site-wide minimal counter.
