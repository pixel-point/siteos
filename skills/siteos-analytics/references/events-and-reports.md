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

Names start with a lowercase letter and contain lowercase letters, digits or underscores (up to 64 characters). `pageview` and the `cookie_` namespace are reserved. Up to eight categorical properties are supported, each with one to twenty declared values. Omit unused properties with `{}`. Unknown events/properties/values are rejected, not automatically cataloged.

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
