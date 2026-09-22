# Events and reports

Keep definitions in small JSON files when they are useful reviewed project artifacts; never include credentials or user data. The CLI accepts files up to 16 KiB. Read existing definitions first to avoid duplicate names.

```sh
npx @siteoshq/cli analytics events list --json
npx @siteoshq/cli analytics events create --file <event.json> --json
npx @siteoshq/cli analytics events snippet <name> --json
```

Event definition example:

```json
{
  "name": "signup_completed",
  "label": "Signup completed",
  "properties": { "plan": ["free", "pro"], "placement": ["hero", "footer"] }
}
```

Names start with a lowercase letter and contain lowercase letters, digits or underscores (up to 64 characters). `pageview` and the `cookie_` namespace are reserved. Register up to eight property names; each selects a List or Text type. List uses one to twenty declared ASCII values, up to 80 characters each. Omit unused properties with `{}`. Unknown events/property names and values outside a List are rejected, not automatically cataloged.

## Text without a predefined list

Check the installed CLI's `analytics --help` and the deployed server/runtime capability before using this newer contract. Text is general-purpose public content, not limited to any kind of website. Product labels, article categories, plans and website sections are examples, not a list of allowed use cases.

```json
{
  "name": "product_opened",
  "label": "Product opened",
  "properties": {
    "title": { "type": "public_text" },
    "placement": ["catalog", "related"]
  }
}
```

Register this definition once. New title values do not require another catalog update:

```js
window.SiteOSAnalytics?.track("product_opened", {
  title: "Team workspace — 新品",
  placement: "catalog",
});
```

Text accepts 1–256 Unicode code points after NFC normalization and trimming. It rejects control characters, obvious email-shaped values and full URLs; this validation is **not a personal-data detector**. Publishers must choose public, non-personal sources. Never pass visitor input, search queries, messages, form answers, emails, account IDs, tokens or entire DOM/dataLayer objects. People uses its separate backend and consent contract. The runtime never automatically reads page text. No cookies or consent changes are introduced by selecting Text.

Reload the website after registration. The current runtime advertises `eventPropertiesVersion: 1` and requests configuration with `?eventProperties=1`. An older runtime requesting a text-enabled catalog receives `RUNTIME_UPGRADE_REQUIRED` rather than a configuration it cannot interpret. Upgrade the server, Edge (when used) and hosted runtime before opting catalogs into Text; test direct script/GTM delivery before changing a client's integration. The current GTM event tag already accepts explicitly mapped string values and loads the shared runtime; no additional Gallery field is needed.

In **Events → select an event → Property values**, search received values and move through pages of 50. Selecting a value applies the report filter. Dates, countries, campaigns and visit filters define the report population; counts here are events, not pageviews or people. Filters and goal/funnel conditions can use an exact text value without registering that value first.

To widen an existing List, open that property and choose **Allow text values**, then review and confirm. Existing facts stay intact. Renaming, deleting or narrowing a property is not part of this operation. From the CLI, first read `events list --json`, review the named property's current definition and `revision`, then create a small change file:

```json
{ "operation": "widen_property", "name": "product_opened", "property": "title", "revision": 1 }
```

```sh
npx @siteoshq/cli analytics events widen --file <reviewed-change.json> --json
```

Use the actual returned revision, never a guessed value. This writes immediately; a stale revision fails without overwriting another edit. Read and review again after a conflict; do not blindly retry with an incremented revision. Only owner/admin event-management authority can widen a property. No customer catalog is widened automatically and measurement-policy revisions are not changed.

To remove an obsolete custom event or property, use **Events → select the event → Delete event**
or **Property values → select the property → Delete property**. Review the warning and type its
exact name. Historical statistics and property values remain until their normal retention expires;
new collection stops. Deletion is permanent and the old name remains reserved. Automatic pageview
and Cookie events are not deletable through the custom catalog.

For CLI deletion, first read `events list --json` in the explicit Project/environment. Obtain the
user's authorization for the named event/property deletion and pass the exact reviewed revision:

```sh
npx @siteoshq/cli analytics events delete <event> --revision <reviewed-revision> --confirm <event> --environment <slug> --json
npx @siteoshq/cli analytics events delete <event> --property <property> --revision <reviewed-revision> --confirm <property> --environment <slug> --json
```

An obsolete property mentioned in an audit does not itself authorize deleting it. Never infer
confirmation, delete a whole event when asked only to remove a property, or retry a conflict with
a guessed revision. Remove the obsolete website call/property too. New occurrences cannot match
goals/funnels using the deleted entry; their historical reports stay intact. `events list` exposes
tombstones for inspection, and generated snippets omit deleted entries.

Call the generated `window.SiteOSAnalytics?.track(name, properties)` snippet in the actual success callback. HTML attributes (`data-siteos-event` and `data-siteos-property-<key>`) are for explicit click events on a control; they do not prove successful completion of its underlying action. Inspect existing instrumentation to avoid firing both an attribute event and a callback event for the same action. Trace observes the same request, not an extra event source.

## Campaigns, goals and funnels

Use `analytics campaigns|goals|funnels list` before creating entries. Creation uses `--file`; only goals and funnels support archive. The API returns saved IDs for subsequent filters/archive operations.

Campaign definition:

```json
{ "label": "Autumn launch", "source": "newsletter", "medium": "email", "campaign": "autumn-launch" }
```

These are registered `utm_source`, `utm_medium`, `utm_campaign` triples. The runtime resolves them to a catalog ID; raw query strings do not leave the browser. Attribution is fixed at visit entry. Unregistered triples do not create campaign categories automatically.

Goal definition:

```json
{ "label": "Signup", "match": { "kind": "event", "name": "signup_completed", "property": { "key": "plan", "value": "pro" } } }
```

A page goal uses `"match": { "kind": "page", "path": "/thank-you" }`. Use normalized paths without query/hash. Goal rates count converting visits once; occurrence counts remain distinct.

Funnel definition:

```json
{
  "label": "Pricing to signup",
  "steps": [
    { "kind": "page", "path": "/pricing" },
    { "kind": "event", "name": "signup_completed" }
  ]
}
```

Funnels contain two to five steps in strict order within one visit. Register referenced events and allowed properties first. Do not imply cross-device identity, persistent user journeys or historical ordering where no ordered facts exist.

```sh
npx @siteoshq/cli analytics campaigns create --file <campaign.json> --json
npx @siteoshq/cli analytics goals create --file <goal.json> --json
npx @siteoshq/cli analytics funnels create --file <funnel.json> --json
npx @siteoshq/cli analytics report --days 7 --json
npx @siteoshq/cli analytics report --days 1 --event signup_completed --country US --campaign <id> --json
npx @siteoshq/cli analytics realtime --json
```

Reads use a separate read scope; event definitions, report definitions, settings and monitoring preparation each use their own write scope. These are management operations, not event-ingestion credentials. Report against the same Project/environment and explain active filters. Distinguish accepted measurements from configuration readiness and distinguish synthetic test-environment events from real customer conversions.

## AI sources and report segments

If `analytics --help` lists `--filters`, reports and realtime accept a bounded JSON array:

```sh
npx @siteoshq/cli analytics report --days 7 --filters '[{"dimension":"channel","operator":"is","values":["AI Assistants"]},{"dimension":"page","operator":"is","values":["/pricing"]}]' --json
```

Dimensions are channel, source, page (visited page), entryPage, exitPage, country, campaign, event,
goal, funnel (completed) and property (include its `property` key). Use exact catalog IDs for campaign,
goal and funnel values, exact event names, and canonical source labels such as ChatGPT. Up to 10
filters and 10 values per filter; values within a filter use OR, filters use AND. `is_not` excludes
matching visits. The same measured visit population supplies all reports; page/event filters select
visits containing that activity. Legacy `--country`, `--campaign` and event inspection remain usable.

Recognizable AI referrers are grouped under AI Assistants. Known UTM aliases such as
`utm_source=chatgpt.com` are converted locally to categorical AI source IDs; arbitrary UTM data is
not collected. Registered campaigns take precedence. Source is fixed at visit entry; unknown Direct
traffic cannot be reconstructed. Anonymous facts and minimal realtime have no source and are
excluded from filtered reports. Referral counts do not measure mentions or citations without a click.
