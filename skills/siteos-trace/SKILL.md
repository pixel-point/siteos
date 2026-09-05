---
name: siteos-trace
description: Use when configuring or diagnosing SiteOS Trace analytics observation, installation, tracking plans, discovery and tracking health for a website Project environment.
---

# SiteOS Trace

Trace observes analytics delivery and reports evidence. It is separate from Search analytics and Pulse availability monitoring.

1. Run `npx @siteoshq/cli project status --json`. Use `$siteos` for missing common selection. When requested and not attached, run `npx @siteoshq/cli project connect trace --json`. This prepares the selected common environment without publishing or installing a script. Manage its name and website URL in Project settings; an address change marks an existing installation as requiring explicit republication.
2. Run `npx @siteoshq/cli project environment list --json` and `npx @siteoshq/cli trace environments --json`. Select it with `npx @siteoshq/cli project environment use <slug> --json`; Trace resolves its explicit binding. Existing environments require the [common environment connection workflow](../siteos/references/projects-and-environments.md), not a name match.
3. Run `npx @siteoshq/cli trace status --json` and `npx @siteoshq/cli trace report --environment <slug> --json`. Distinguish absent setup, a published installation waiting for data, current observations and open incidents. No recent data is not proof of an outage or a healthy site.
4. For requested setup, run `npx @siteoshq/cli trace installation ensure --environment <slug> --json`, then `npx @siteoshq/cli trace installation show --environment <slug> --json`. Ensure is idempotent and prepares a draft. Edit only documented draft fields, retain the current `expectedDraftVersion`, and save with `npx @siteoshq/cli trace installation save --environment <slug> --input <draft.json> --json`.
5. When publication is authorized, run `npx @siteoshq/cli trace installation publish --environment <slug> --json`. Read installation again and use its exact `snippet`; do not invent the runtime URL, integrity hash or public key. Install it once using the project's existing script/GTM convention, then verify actual delivery and the environment report. A missing snippet means the required installation is not published and ready.
6. For a requested tracking plan, use `npx @siteoshq/cli trace tracking-plan ensure --environment <slug> --json` and `npx @siteoshq/cli trace tracking-plan show --environment <slug> --json`. Prepare a complete reviewed plan using the application's actual event contract; save through `npx @siteoshq/cli trace tracking-plan save --environment <slug> --input <plan.json> --json`. Publish through `npx @siteoshq/cli trace tracking-plan publish --environment <slug> --json` when authorized. Read back the result and inspect new evidence before claiming validation.

Do not add observation of cookies, storage, DOM text, form values, payload values or persistent visitor IDs. Keep provider/event/property names separate from personal values. Do not infer business metrics, conversions or delivery success from script installation alone. Report exact observed status and the timestamp or absence of evidence.

## Draft input contracts

For `installation save`, write `{ "expectedDraftVersion": <current version>, "draft": <complete draft> }`.
Read the current installation first and preserve its draft fields: `providers` (a list containing
`ga4`, `google_ads`, `hubspot`, `meta` or `custom`), `sampleRate`, `maxBatchSize`, `consentMode`
(`disabled`, `explicit_adapter` or `google_consent_mode`) and nullable `releaseLabel`. Use the
existing defaults unless the task calls for a reviewed change. Do not disable consent handling as
an automatic workaround for missing observations.

For `tracking-plan save`, write `{ "expectedDraftVersion": <current version>, "expectations": [...] }`.
Each expectation contains `provider`, `eventName`, `required`, nullable `consentPurpose` (`analytics`
or `advertising`), nullable `maximumSilenceMinutes`, and `properties`. Each property contains
`name`, `type` (`string`, `number`, `boolean`, `null`, `array` or `object`) and `required`. Derive
expectations from reviewed application events or actual discoveries; do not invent required events.
A draft-version conflict requires rereading and reconciling the current draft.
