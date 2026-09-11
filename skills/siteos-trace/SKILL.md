---
name: siteos-trace
description: Investigate website tracking and configure evidence-backed event checks in SiteOS Trace, diagnose issues and GTM changes, compare Google Analytics reports through optional Google Analytics MCP, and verify requested fixes for a Project environment.
---

# SiteOS Trace

For hosted evidence, prefer `siteos_trace_get_coverage`, `siteos_trace_get_report`,
`siteos_trace_list_events`, `siteos_trace_list_issues`, `siteos_trace_get_issue`,
`siteos_trace_list_observations`, `siteos_trace_get_gtm_summary`, `siteos_trace_get_ga4` and `siteos_trace_get_notifications`
MCP tools after `siteos_get_context` and explicit Project/Environment selection. Follow
[MCP and CLI context](../siteos/references/mcp-and-cli.md). These reads do not require a local
repository or CLI login. Use the CLI workflow below for setup, edits, publication and reads outside
the MCP catalog; loading this skill does not imply authorization to configure or publish anything.

Trace combines Google reports/configuration history with optional browser observations. Use its Health Summary, Destinations and
Debugger to understand where an event was observed and why a rule raised an issue. It is separate
from website Analytics reports, Search analytics and Pulse availability monitoring.

When available in the selected release, Trace → SiteOS Analytics → Overview displays accepted
Analytics visits, page views and events alongside Trace issues. Use Tracking for observed events,
properties and rule evidence. Read accepted metrics through the Analytics MCP/CLI with its own
authority; the Overview does not turn Trace observations into Analytics counts. Native reports use
UTC windows including today, while GA4 reports use completed property-local days. Compare matching
populations and periods before describing a discrepancy. A missing Analytics environment attachment
does not require reinstalling Trace.

## Website investigation and event checks

When asked to study a website's tracking, find coverage gaps or configure useful checks, read
[Website investigation and event checks](references/site-event-checks.md). Follow the site's actual
success actions through dataLayer, any GTM mapping, the destination request and its report. Use
automatic discovery first and add explicit rules only for confirmed expectations. Identify what
needs instrumentation or cannot be verified; do not infer mandatory events from a button label.
The workflow supports SiteOS Analytics and other supported destinations, with or without GTM/GA4.

## Google Analytics investigations

For GA4 report questions, charts or the impact of a tracking change, read
[Google Analytics MCP investigations](references/google-analytics-mcp.md). Use the existing SiteOS
binding and saved reconciliation first; use an available official Google Analytics MCP for deeper
reports. Its connection is optional and independently authorized. The SiteOS MCP does not expose
arbitrary Google reports or Google configuration writes. A request about existing GA4 data does
not require installing SiteOS Analytics or changing the site's tags.

Return a concise finding with an appropriate chart and its source, scope and time window when
visualization helps. Keep GA4 totals, browser observations and GTM executions distinguishable.
Requested fixes still use the repository, SiteOS CLI or available provider tools, followed by
fresh evidence; a reporting tool does not itself repair an installation.

## Choose a starting path

Trace supports **Connect Google** and **Install observer** independently. Reuse the selected
Project/environment and existing resources. A Google-only request needs a Trace workspace and the
exact Google binding, but no Trace installation, published snippet or website change. GA4 reports,
events and configuration snapshots, and GTM tags/version history, work through the Google APIs.
On servers supporting report monitoring, event-frequency and overall-traffic drops also become
Issues without an observer. Check the issue's rule, mature dates, baseline and evidence; a drop
does not prove a broken tag. Limited data and insufficient history cannot confirm a problem or fix.
Follow [GA4 reconciliation](references/ga4-reconciliation.md) or
[GTM monitoring](references/actionable-monitoring.md) for binding commands. Verify the saved binding
and successful import; queued means waiting for import, and an import error requires attention.
Do not call a connected Google-only workspace unfinished because the observer is absent.

Offer the observer when browser evidence is needed: request sending/failures, possible duplicates,
dataLayer, consent or GTM executions with the monitor tag. Report missing browser coverage as
unavailable evidence, never zero traffic or a healthy installation. Neither a Google connection nor
a successful configuration import proves browser collection works. GA4 receipt comparisons require
both the matching Google stream and suitable observer evidence.

## Installation with an agent

The Trace Setup and Installation screens offer **Set up with AI**. The copied prompt contains
the exact application origin, Organization, Project, environment and website. Treat those names
and URLs as context data; verify them through `siteos_get_context` or the CLI before acting.
Opening Setup only previews the paths. Continuing creates the workspace and opens the selected
connection or installation screen. Only the observer path requires publication, website installation
and a first signal; Google-only setup completes with a verified binding/import.

Inspect existing website tags, Trace installation and Google bindings before changing anything.
Reuse the existing GTM container when suitable, or offer a direct script. GTM/GA4 are optional:
GTM adds configuration history and real tag names; the separate common monitor provides execution
evidence. GA4 adds exact property/web-stream configuration and aggregate report reconciliation.
If either service is absent, explain its benefit and offer creation/connection within the user's
scope. Use available Google provider tools or the browser for account/resource setup; never claim
the SiteOS read-only GTM connection can edit a container. Ask the user to complete Google sign-in
when required and provide missing business details instead of inventing them. Do not create new
Google resources merely because an existing resource was not discovered in a partial catalog.

Follow [GTM monitoring](references/actionable-monitoring.md) and
[GA4 reconciliation](references/ga4-reconciliation.md) for exact commands and binding limits.
Review/preview changes before requesting publication approval, preserve consent behavior and avoid
duplicate snippets or tags. Finish with a fresh Trace signal, GTM execution evidence when selected,
and the exact GA4 binding status. GA4 reports may arrive later; distinguish this from installation.

**Installation** owns snippets, the GTM monitor and verification. **Settings** has Collection,
Notifications and Monitoring coverage tabs. Collection saves remain drafts until explicitly
published. The initial Setup and Installation states are also available in the local Storybook
catalog; previewing them does not create a Project or write to the service.

The monitoring, notification and schema workflow requires CLI 2.2.0 or newer and the matching
Trace server. Earlier CLI releases support the older explorer commands. Check the installed
`npx @siteoshq/cli trace --help` before using it; source availability does not establish publication.
Read [references/investigating-tracking.md](references/investigating-tracking.md) for filters,
pagination, issue history, evidence limits and verification of a fix. AI explanations remain deferred. GA4 Admin/Data API reconciliation requires CLI 2.3.0+ and the matching server; use [GA4 reconciliation](references/ga4-reconciliation.md). Read [actionable monitoring](references/actionable-monitoring.md)
for GTM installation, technical incidents, learned schemas, coverage and notification configuration.

1. Run `npx @siteoshq/cli project status --json`. Use `$siteos` for missing common selection. When requested and not attached, run `npx @siteoshq/cli project connect trace --json`. This prepares the selected common environment without publishing or installing a script. Manage its name and website URL in Project settings; an address change marks an existing installation as requiring explicit republication.
2. Run `npx @siteoshq/cli project environment list --json` and `npx @siteoshq/cli trace environments --json`. Select it with `npx @siteoshq/cli project environment use <slug> --json`; Trace resolves its explicit binding. Existing environments require the [common environment connection workflow](../siteos/references/projects-and-environments.md), not a name match.
3. For Google-only setup, follow the binding workflow above and stop after verifying imports. For observer setup, run `npx @siteoshq/cli trace status --json` and `npx @siteoshq/cli trace report --environment <slug> --json`. Distinguish absent setup, a published installation waiting for data, current observations and open incidents. No recent data is not proof of an outage or a healthy site.
4. For requested observer setup, run `npx @siteoshq/cli trace installation ensure --environment <slug> --json`, then `npx @siteoshq/cli trace installation show --environment <slug> --json`. Ensure is idempotent and prepares a draft. Edit only documented draft fields, retain the current `expectedDraftVersion`, and save with `npx @siteoshq/cli trace installation save --environment <slug> --input <draft.json> --json`.
5. When publication is authorized, run `npx @siteoshq/cli trace installation publish --environment <slug> --json`. Read installation again and use its exact `snippet`; do not invent the runtime URL, integrity hash or public key. Install it once using the project's existing script/GTM convention, then verify actual delivery and the environment report. A missing snippet means the required installation is not published and ready.
6. For a requested tracking plan, use `npx @siteoshq/cli trace tracking-plan ensure --environment <slug> --json` and `npx @siteoshq/cli trace tracking-plan show --environment <slug> --json`. Prepare a complete reviewed plan using the application's actual event contract; save through `npx @siteoshq/cli trace tracking-plan save --environment <slug> --input <plan.json> --json`. Reread and review the saved draft. Publish through `npx @siteoshq/cli trace tracking-plan publish --expected-draft-version <reviewed-version> --environment <slug> --json` when authorized. A conflict requires a fresh read and review; never remove the guard to retry. Read back the result and inspect new evidence before claiming validation.

Do not add observation of cookies, storage, DOM text, form values, payload values or persistent visitor IDs. Keep provider/event/property names separate from personal values. Do not infer business metrics, conversions or delivery success from script installation alone. Report exact observed status and the timestamp or absence of evidence.

## Draft input contracts

For `installation save`, write `{ "expectedDraftVersion": <current version>, "draft": <complete draft> }`.
Read the current installation first and preserve its draft fields: `providers` (a list containing
`siteos_analytics`, `ga4`, `google_ads`, `hubspot`, `meta` or `custom`), `sampleRate`, `maxBatchSize`, `consentMode`
(`disabled`, `explicit_adapter`, `google_consent_mode` or `siteos_cookie`) and nullable `releaseLabel`. Use the
existing defaults unless the task calls for a reviewed change. Do not disable consent handling as
an automatic workaround for missing observations.

Consent modes have distinct evidence sources: `siteos_cookie` reads the SiteOS banner’s public state on the same page, `google_consent_mode` observes supported data-layer
consent commands, `explicit_adapter` uses the application's explicit consent evidence, and
`disabled` records unknown consent. Selecting an adapter does not configure a vendor tag or forward
events. Check enabled providers and sampling before interpreting absent traffic. A saved draft does
not affect the live runtime until publication. Runtime 0.2.1 adds bounded GA4 single-event POST
observation; a previously installed version-pinned snippet continues using its archived runtime.
After an authorized upgrade, use the returned snippet and verify its actual version on the site.
Runtime 0.3.1 also retains the public GA4 Measurement ID for exact stream comparison; older unscoped observations cannot be assigned retroactively. Runtime 0.3.0 observes native anonymous pageviews and GTM execution callbacks. For GTM execution
monitoring, use the `gtmExecutionMonitor` metadata returned by `installation show` and the linked
installation workflow. This is one common monitor; individual event names and tags need no setup.

For `tracking-plan save`, write `{ "expectedDraftVersion": <current version>, "expectations": [...] }`.
Each expectation contains `provider`, `eventName`, `required`, nullable `consentPurpose` (`analytics`
or `advertising`), nullable `maximumSilenceMinutes`, optional nullable `afterConsentSeconds` (5–300), optional nullable
`afterSourceEvent: {eventName, withinSeconds}` (5–300), and `properties`. Each property contains
`name`, `type` (`string`, `number`, `boolean`, `null`, `array` or `object`) and `required`. Derive
expectations from reviewed application events or actual discoveries; do not invent required events.
A draft-version conflict requires rereading and reconciling the current draft.


## Consent observation

Trace never blocks, delays, modifies or replays host events and never grants or withdraws consent.
Cookie/GTM retain enforcement. The SiteOS Cookie source is optional and requires Trace runtime
0.2.1 or newer. Cookie runtime 11.2.0 exposes minimal mode context; older banners can leave Google
mode unknown. Use the Consent section of [investigating tracking](references/investigating-tracking.md)
for before-grant, withdrawal, Advanced Mode review and missing-after-grant evidence.
Do not enable a post-grant deadline unless that event should follow a grant on the same page;
it requires a consent purpose and a network destination. A purchase normally needs a later action.

## Cookie readiness and runtime history (Trace 0.4+)

Cookie 11.5+ reports bounded script/configuration/initialization failure codes and actual readiness.
A `cookie_runtime_failed` issue is separate from a GTM execution incident. Only Cookie-ready
observations can verify its recovery (three results across at least two page lifetimes); a loaded
script, a GTM success or missing traffic cannot. Report last failure, recovery, reopen count and
remaining cause uncertainty. Names in timelines come from the connected GTM catalog matched by
container and tag ID; retain the IDs and do not present the current name as historical proof.

Coverage includes version-specific lastSeen, page counts and pagesAfterPublication. Prefer its
runtime summary: publication alone does not confirm installation. Trace allows a 15-minute
transition from the first observed published runtime (or publication until it is first observed).
Another version is marked recent only when it sends after that transition and within the last
hour. History is collapsed in the UI; missing recent evidence never confirms recovery or adoption.
Neither mixed 24-hour versions nor an old open tab alone proves a stale GTM installation. Read the
current installation and inspect a fresh page before changing GTM. Technical Cookie evidence is
page-local and contains no configuration, raw error, consent value or visitor identifier.


## Recovery attention and network results (Trace 0.4+)

Health Summary keeps a yellow notification for a verified recovery until the current user chooses
**Mark as viewed**. Opening details is not dismissal; viewing never resolves an incident. Do not
use `issue resolve` or acknowledge as a substitute. Marks are per user, persist across reloads and
are reset by a new failure/recovery. A red banner means an active issue. Report the timestamps and
whether recovery is verified rather than declaring the cause fixed. The viewing action is in the
UI; no new CLI or MCP mutation is exposed.

Recognized GA4/Ads/Meta/HubSpot fetch/XHR observations can carry `operationId` and `networkResult`
(status, duration and outcome). Initiation and result are one send; two distinct operation IDs can
still be a genuine duplicate. HTTP 4xx/5xx, network failure and timeout are technical failures;
caller cancellation/opaque responses are unknown. Same-stream successes are required for GA4
request recovery. This does not cover every arbitrary network service or prove analytics report
processing. Do not enable Cookie solely to obtain these results. Deploy compatible backend/Edge
before an authorized runtime installation upgrade; always read the actual snippet and version.
