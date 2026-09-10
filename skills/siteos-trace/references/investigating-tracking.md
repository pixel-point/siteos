# Investigating tracking

Start from the selected common Project and environment. These reads never attach a service,
publish configuration, modify a tracking rule or resolve an incident.

## Find the destination and event

```sh
npx @siteoshq/cli trace destinations --environment production --period 24h --json
npx @siteoshq/cli trace events --environment production --provider ga4 --period 24h --json
npx @siteoshq/cli trace properties --environment production --provider ga4 --event purchase --json
npx @siteoshq/cli trace issues --environment production --provider ga4 --state active --json
```

Replace the environment, provider and event with the task's actual selection. Supported providers
are `siteos_analytics`, `ga4`, `google_ads`, `hubspot`, `meta` and `custom`. The UI lists `custom`
under Sources as Data layer. It does not establish that any vendor received that event.
Destinations identify provider families, not individual accounts, properties or pixel IDs.
An enabled collection adapter alone does not make a destination observed. A published expectation
can keep an expected but unobserved destination visible; inspect `expected`, counts and `lastSeen`.

Use `--search <text>` for literal name search, `--event <name>` and `--property <name>` for exact
filters, and `--period 24h|7d` for the traffic window. Event states are `all`, `new`, `issues`,
`tracked` and `ignored`; issue states include `all`, `active`, `snoozed`, `resolved` and `new`.
`--rule <rule>` uses the rule identifier returned by an issue. `--rule consent` groups the consent checks.

Every list returns `{items, total, nextCursor, from, to}`. Read further pages only as needed using
`--cursor <nextCursor>` and exactly the same environment, view and filters. Cursors preserve a
fixed window. Changing a filter requires starting without a cursor; invalid or expired scope
must not be retried as an unfiltered read. Issue lists show current lifecycle, including older
active issues; the traffic period does not mean that an older problem disappeared.

New events and properties are discoveries, not failures. Counts are retained observations, not
visitors, conversions, or sample-adjusted traffic. No recent data alone proves neither an outage
nor healthy tracking. Check installation, last signal, published rules and analysis completion.

## Inspect the issue and evidence

```sh
npx @siteoshq/cli trace issue show --id <issue-id> --environment production --json
npx @siteoshq/cli trace observations --environment production --provider ga4 --event purchase --json
npx @siteoshq/cli trace observations --environment production --page-view <page-view-uuid> --json
npx @siteoshq/cli trace observation show --batch-id <batch-uuid> --event-id <event-uuid> --environment production --json
```

Use IDs returned by these reads. An issue includes severity, confidence, lifecycle and retained
findings. Each finding identifies its analysis window and published plan version. Compare the
observed event/property against the expectation used at detection. The issue's `nextCursor`
paginates finding history and is valid only for `issue show --id <same-id> --cursor <cursor>`.

Debugger observations expose safe names/types, consent, evidence kind, technical stage, route
template and runtime/release context. `--kind` accepts `data_layer`, `fetch`, `xhr`, `beacon`,
`resource`, `consent`, `heartbeat`, `runtime_diagnostic` and `tag_execution`. A page-view ID groups activity for that
page; it does not identify a visitor or prove a causal link between two observations.

Fetch/XHR initiation and a browser accepting a beacon are not vendor receipt. Script loading is
not event delivery. Encoded network parameter types describe the wire representation, which can
differ from an application's original value types. GA4 POST observation reads only bounded,
already available single-event encoded bodies; arbitrary streams and multiline batches are not
parsed. Missing evidence for an unsupported path is not evidence of failed delivery.

## Verify a fix

1. Explain the concrete rule, expected name/type or consent purpose, observed evidence, its time
   window and uncertainty. Use the recorded facts; there is no AI explanation service to invoke.
2. Make the requested application/tag or reviewed tracking-rule change. Draft saving and
   publication are separate. Publish rules with the reviewed `expectedDraftVersion`.
3. Reproduce the relevant business action with the intended consent. Read fresh observations
   without an old cursor and inspect the next completed analysis window under the intended plan.
4. Check the destination's own report when the task requires a conversion/reporting outcome.
   Marking an issue resolved in the UI is a workflow action, not proof that the tracking is fixed.

Do not add payload values, full request URLs, account IDs, DOM text, cookies, persistent visitor
IDs or other private values to Trace to simplify diagnosis. AI explanations remain deferred.
Use [actionable monitoring](actionable-monitoring.md) for the implemented notification lifecycle.


## Consent checks

```sh
npx @siteoshq/cli trace issues --environment production --rule consent --state all --json
npx @siteoshq/cli trace observations --environment production --kind consent --json
```

Consent verification is a read-only optional part of Trace. It does not control banner decisions,
GTM consent settings or destination requests. A site without Cookie still supports the other Trace
workflows. Select `siteos_cookie` in the collection draft only when using the banner on that page;
publication and replacement of an old pinned Trace snippet remain explicit.

- `consent_before_grant`: a named destination request was observed while its expected purpose was denied.
- `consent_after_withdrawal`: the same page has an observed withdrawal before that request.
- `consent_advanced_review`: Google activity under denial with Advanced or unknown Google mode.
  Cookieless requests can be expected here; this informational finding does not prove a violation.
- `consent_expected_event_missing`: a reviewed event with `afterConsentSeconds` was not observed
  within 5–300 seconds of a new grant. It requires an enabled destination, continuous visible-page
  evidence, consecutive observation sequence and a completed analysis window after plan publication.

Unknown consent, restored initial consent, missing observations, a hidden/closed page or disabled
collection cannot establish a missing post-grant event. Matching data-layer events and resource
loads do not prove named network delivery. Counts represent observed analysis findings, not people
or legal compliance. The legacy report field `consentViolations24h` counts retained before-grant
and after-withdrawal findings, excluding Advanced Mode reviews.

Inspect the finding's `pageViewId` with `trace observations --page-view <id>` without a provider
or event filter to retain the consent markers in the timeline. The minimized `consent` object adds
source, Google mode and grant/withdrawal transitions; `observationSequence` detects evidence gaps
within this page only. It is not a visitor identifier. Reproduce a fresh grant and inspect the next
completed analysis window after changing a tag; do not equate manual resolution with verification.
