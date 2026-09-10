# Google Analytics reconciliation

Requires CLI 2.3.0+ and the matching Trace server. Verify installed help and live deployment before
using these commands. This feature does not use AI and does not install a GA4 collection tag.

Select the explicit common Project and environment first. In Trace → Google Analytics, connect
Google with Analytics read access and select one property/web stream. The existing Organization
Google identity and Search Console/GTM permissions are preserved. OAuth approval is a browser
step; do not ask for access tokens or copy browser credentials into CLI configuration. Google
Analytics Admin API and Google Analytics Data API must be enabled for the OAuth project's client.
A missing resource requires reviewing access, not inventing a property ID or choosing Production.

Read `npx @siteoshq/cli trace ga4 show --environment <slug> --json` or
`siteos_trace_get_ga4` with explicit Organization, Project and Environment. Inspect binding,
revision, latest sync time, configuration snapshots and comparison statuses. CLI mutations use
`trace:workspace:write` and require an Organization owner/admin:

- `trace ga4 bind --input <binding.json> --environment <slug> --json` accepts
  `{ "expectedRevision": 0, "connectionId": "<Google connection>", "propertyId": "<property>", "streamId": "<stream>" }`.
  Use 0 only without a previous binding; otherwise preserve the returned revision. The server
  verifies the stream against the current ready Organization catalog.
- `trace ga4 sync --input <revision.json> --environment <slug> --json` enqueues a check.
- `trace ga4 disconnect --input <revision.json> --environment <slug> --json` stops this binding.
  Both accept `{ "expectedRevision": <returned revision> }`. Read back after mutations. A conflict
  requires rereading and reconciling; do not silently substitute a fresh revision and retry.

The trusted worker checks every six hours, imports recent completed days and compares dates at
least 72 hours after local day end. Configuration changes use detection time, not a claimed Google
edit time. A removed key event can still be collected; only its key-event designation changed.

Runtime 0.3.1 records a validated public Measurement ID (`G-…`) for supported GA4 requests. Publish
and install the returned snippet to upgrade an older runtime. Old observations without that ID are
excluded; do not assign them to the currently selected stream. Direct fetch/XHR/beacon observations
with known analytics consent are compared. Resource Timing evidence is excluded from these counts
because it can describe an already observed request. Actual repeated sends remain separate.
Supported single-event requests do not establish complete coverage of custom proxies, server-side
sending, opaque/batched bodies or browser-blocked activity.

`processing`, `limited_report`, `mixed_policy`, `insufficient_evidence` and `reported_only` do not
prove loss or recovery. Missing reported events need at least 20 observed requests on five pages.
Ratio warnings require three mature comparable baseline days. Sampling, thresholding, truncation
and other Google report limits suppress discrepancy conclusions. Compare aggregate ratios and
source counts; never state an exact percentage of lost events or an individual receipt from GA4.

Use common Issues for `ga4_report_discrepancy`, `ga4_key_event_removed` and `ga4_sync_failed`.
Notifications use the configured Trace route and existing delivery history. Manual resolution does
not verify a fix; a subsequent supported Google check does. Saved results remain historical when
Google access or synchronization is unavailable. AI explanations remain outside this workflow.
