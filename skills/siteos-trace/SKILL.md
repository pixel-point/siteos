---
name: siteos-trace
description: Use when investigating SiteOS Trace destinations, events, properties, issues, Consent checks and Debugger evidence, or configuring installation and tracking rules for a website Project environment.
---

# SiteOS Trace

For hosted evidence, prefer the available `siteos_trace_get_report` and `siteos_trace_list_issues`
MCP tools after `siteos_get_context` and explicit Project/Environment selection. Follow
[MCP and CLI context](../siteos/references/mcp-and-cli.md). These reads do not require a local
repository or CLI login. Use the CLI workflow below for setup, edits, publication and reads outside
the MCP catalog; loading this skill does not imply authorization to configure or publish anything.

Trace observes analytics requests and reports evidence. Use its Health Summary, Destinations and
Debugger to understand where an event was observed and why a rule raised an issue. It is separate
from website Analytics reports, Search analytics and Pulse availability monitoring.

The explorer workflow requires CLI 1.8.0 or newer and the matching Trace server. Check the installed
`npx @siteoshq/cli trace --help` before using it; source availability does not establish publication.
Read [references/investigating-tracking.md](references/investigating-tracking.md) for filters,
pagination, issue history, evidence limits and verification of a fix. AI explanations and
notifications are outside the current Trace workflow.

1. Run `npx @siteoshq/cli project status --json`. Use `$siteos` for missing common selection. When requested and not attached, run `npx @siteoshq/cli project connect trace --json`. This prepares the selected common environment without publishing or installing a script. Manage its name and website URL in Project settings; an address change marks an existing installation as requiring explicit republication.
2. Run `npx @siteoshq/cli project environment list --json` and `npx @siteoshq/cli trace environments --json`. Select it with `npx @siteoshq/cli project environment use <slug> --json`; Trace resolves its explicit binding. Existing environments require the [common environment connection workflow](../siteos/references/projects-and-environments.md), not a name match.
3. Run `npx @siteoshq/cli trace status --json` and `npx @siteoshq/cli trace report --environment <slug> --json`. Distinguish absent setup, a published installation waiting for data, current observations and open incidents. No recent data is not proof of an outage or a healthy site.
4. For requested setup, run `npx @siteoshq/cli trace installation ensure --environment <slug> --json`, then `npx @siteoshq/cli trace installation show --environment <slug> --json`. Ensure is idempotent and prepares a draft. Edit only documented draft fields, retain the current `expectedDraftVersion`, and save with `npx @siteoshq/cli trace installation save --environment <slug> --input <draft.json> --json`.
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

For `tracking-plan save`, write `{ "expectedDraftVersion": <current version>, "expectations": [...] }`.
Each expectation contains `provider`, `eventName`, `required`, nullable `consentPurpose` (`analytics`
or `advertising`), nullable `maximumSilenceMinutes`, optional nullable `afterConsentSeconds` (5–300), and `properties`. Each property contains
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
