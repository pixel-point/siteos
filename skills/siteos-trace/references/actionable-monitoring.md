# Actionable monitoring

Use CLI 2.2.0+ and the corresponding server. Inspect installed help and returned capabilities;
source code alone is not proof that a release is installed.

## Automatic collection and GTM

Trace discovers names of supported events automatically. A tracking plan is optional. Provider
adapters recognize supported request formats; this does not mean arbitrary browser traffic, server
requests or traffic inside other-origin frames is visible. Cookie is optional. Trace observes the
consent state without granting consent, replaying requests or changing what vendor tags may send.

Read `trace installation show --environment <slug> --json`. Use the exact published `snippet`
and returned `gtmExecutionMonitor` metadata. For a GTM site, import its `templateUrl` as a private
Tag Template, create one monitor tag and a Custom Event trigger matching `.*` with regular
expressions enabled, All Custom Events and Once per event. The common monitor observes callback
metadata for fired tags; it does not load Trace or forward business events. Keep the normal Trace
script installed once. Preview before an authorized GTM publication and read back the live version.
A configured tag is not proof of an execution; a tag that never fired is absent from this callback.
Google API synchronization imports configuration and changes read-only. It does not execute tags.
GA4 Admin/Data report reconciliation is available with CLI 2.3.0+; follow [GA4 reconciliation](ga4-reconciliation.md).

Verify with:

```sh
npx @siteoshq/cli trace coverage --environment production --json
npx @siteoshq/cli trace gtm summary --environment production --json
npx @siteoshq/cli trace observations --environment production --kind tag_execution --container-id GTM-EXAMPLE --tag-id 5 --result failure --json
```

Replace example identities with the actual returned container/tag. Do not configure every event
or tag separately. Runtime 0.3.0 is required for execution callbacks and native anonymous pageviews.
An anonymous pageview does not imply a consent grant. One operation's attempt and result count once;
separate operations stay distinct and can contribute to duplicate-event findings.

## Incidents and diagnosis

`gtm_execution_failed` records failure, exception or timeout from GTM; `request_delivery_failed`
records supported 4xx/5xx responses or network errors. An initiated request, accepted beacon or
unreadable response does not prove failure. One failure opens a warning; at least three failures
across two page lifetimes escalate to critical. Duplicate batch delivery does not open another issue.

Read `trace issue show --id <returned-id> --environment <slug> --json`. Keep the exact ID, including
any `trc_incident_` prefix. Inspect `context`, `diagnostics`, `findings` and timestamps. Page activity,
consent and nearby GTM changes are context, not causal proof. GTM callback status does not contain
an underlying exception message; do not invent a root cause. Follow `pageViewId` using observations
without a provider filter so consent and other destinations remain visible.

Three successful terminal results after the latest failure, across at least two page lifetimes,
verify technical recovery. Silence and manual resolution do not verify a fix. Other rules require
a comparable completed analysis window. New findings remain grouped in the same incident.

## Learned schemas and coverage

Coverage reports expose published/observed runtime versions, page sampling, adapter evidence,
last signal, hourly analysis readiness and learned schema streams. Counts are sampled observations;
"not observed" does not establish an outage, successful installation or healthy tracking.

Schema learning needs 100 historical events across two days and five page lifetimes. Checks need
20 current events on two page lifetimes. Anonymous/detailed and raw/encoded streams remain separate;
sampling and parser changes cannot reuse an incompatible baseline. Full descriptor-budget records
cannot prove missing fields. Stored property values are never needed.

Baselines stay frozen. Repeated missing habitual properties or new types raise
`learned_property_missing` / `learned_property_type_drift`. Explicit property rules take precedence.
After reviewing an intentional schema change, restart only the selected baseline:

```sh
npx @siteoshq/cli trace schema restart --environment production --input baseline.json --json
```

Input: `{ "provider": "siteos_analytics", "eventName": "purchase", "mode": "detailed",
"expectedLearnedAt": "<timestamp from coverage>" }`. Use actual returned fields. Restarting closes
its schema issues as a user decision and learns only from future evidence; it is not recovery.
A conflict requires rereading the baseline, not removing the guard.

## Notifications

Read `trace notifications show` and `trace notifications destinations` with the selected
`--environment` and `--json`. MCP exposes notification reads only. Routes start disabled.
Configure only a destination authorized by the user, using a returned candidate ID:

```sh
npx @siteoshq/cli trace notifications save --environment production --input notifications.json --json
```

Input: `{ "enabled": true, "candidateId": "<returned candidate>", "minimumSeverity": "warning",
"includeRecovery": true, "expectedRevision": <current route revision> }`.
Severity is `warning` or `critical`. Disabling uses `enabled:false` and `candidateId:null`.
Read back the route. Repeated findings stay quiet; new incidents, escalation and verified recovery
are separate transitions. A 60-second dispatch delay suppresses brief incidents that recover before
sending. Snoozed issues do not generate new alerts; changed/disabled routes cancel stale work.
Integrations owns actual provider delivery. Inspect the notification history before claiming sent.
For `needs_attention`, `trace notifications retry --input retry.json` accepts
`{ "notificationId": "<returned id>" }` and rechecks the same idempotent delivery. A failed provider
receipt does not become sent by retrying the UI. Sending a real test notification requires the
user's authorization for that destination; do not fabricate a live failure to test delivery.
