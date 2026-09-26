---
name: siteos-analytics
description: Set up SiteOS website Analytics in a selected Project environment, configure optional Cookie or external consent control, install the browser script or GTM adapter, register custom events and conversions, and verify actual collection, countries and realtime. Use for website measurement; route managed Search health and usage reports to siteos-search.
---

# SiteOS Analytics

Read the [shared execution contract](../siteos/references/mcp-and-cli.md) once per task before choosing tools or resolving context, including when this skill is invoked directly. Apply the service-specific workflow below after that shared contract.

For an existing Google Analytics property, GA4 report charts or Google tracking investigation,
use `$siteos-trace` and its optional Google Analytics MCP workflow. Those requests do not require
installing SiteOS Analytics. Keep Google-reported metrics separate from SiteOS collection counts.

Hosted reads: `siteos_analytics_get_report` and `siteos_analytics_get_realtime`.

Complete the path from the site's business action to a saved Analytics report. Cookie and Trace are optional services; Analytics works independently without either service.

## Establish the target

1. Run `npx @siteoshq/cli analytics --help` and confirm that the installed CLI and selected server support these commands. Source documentation does not prove a public release. Delegate missing CLI support to `$siteos-cli` and missing authentication to `$siteos-auth`; do not substitute private APIs.
2. Resolve the target through the shared execution contract and inspect the Analytics attachment with `npx @siteoshq/cli project status --json`.
3. If Analytics is absent, use `npx @siteoshq/cli project connect analytics` within the user's requested setup. This explicitly attaches Analytics only. Use `$siteos` for common Project or environment repair. Never inspect private binding or credential files.
4. Read `npx @siteoshq/cli analytics status --json` and `npx @siteoshq/cli analytics installation --json`.
   When returned, `measurement` describes baseline report semantics: `visitor_days` is not unique
   people across days. Read `measurementStatus` separately for configured collector mode, enforced
   lifetimes, readiness and accepted-event evidence. It is also included in `settings show` and
   report reads, including MCP. Readiness is not visitor consent or installation proof. Historical
   recognition does not prove current-policy recognition or live activity. Unknown/missing evidence
   stays unknown; do not infer it from Cookie control or counts. Collector capabilities do not
   prove that the installed CLI/runtime supports mode changes or website identity. See the
   installation reference for field interpretation and release boundaries.
5. A newly attached Analytics workspace may have no native source enabled. For the requested SiteOS installation, read `analytics settings show --environment <slug> --json` and explicitly enable collection with `analytics settings set --revision <current-revision> --enabled true --environment <slug>`. Read it back before installing. Connecting GA4 through Analytics Setup is independent and does not enable the SiteOS collector; do not install a native script for a GA4-only request.

## Read connected Google Analytics

For GA4 reports, funnels, cohorts, saved selections or CSV, read [ga4-reports.md](references/ga4-reports.md).
Use the GA commands/tools for this source; native event registration, collection settings and native
funnels have different semantics. A cached response, queued refresh and live provider response are
different states. Preserve Google limitations and exact Project/environment/binding context.

## Choose collection behavior

Read [measurement-and-installation.md](references/measurement-and-installation.md) before changing consent behavior, using GTM or diagnosing missing traffic.

For developer visits, monitoring or missing traffic, check its [traffic exclusions](references/measurement-and-installation.md#traffic-exclusions) before changing collection or consent. Browser exclusion is a local preference confirmed on the measured website; ordinary automated checks must disable Analytics before navigation.

For a requested mode change, retention change, returning-browser report or optional account/contact
identification, read [measurement-modes-and-identity.md](references/measurement-modes-and-identity.md).
Check installed command/runtime support first. Preparing a plan, publishing Cookie, activating a
mode and deploying the website are separate effects with separate authorization boundaries.

- Analytics collects independently by default. Attaching Cookie does not change this behavior.
- For native consent control, use `$siteos-cookie` to set `draft.integrations.siteosAnalytics: true` in the same Project environment, then explicitly publish the reviewed banner when authorized. The UI equivalent is Cookie → Services → SiteOS Analytics → Control with Cookie. Disabling it also requires publication. Never create a second Analytics consent policy or invent a `--consent-mode` flag.
- Check the published integration's scopes. Website-details control waits for the matching Cookie runtime and follows regional rules, choices and withdrawal. Strict opt-in waits for a grant; a reviewed opt-out/notice profile can permit website details without claiming consent. Recognition-only control must not block an independently permitted cookieless base; recognition always needs affirmative permission and separate owner activation. A draft save has no public effect. Do not replace an existing scoped integration with an unreviewed policy.
- External CMPs use the scoped installation and evidence contract in the installation reference: configure the expected binding/purpose/material policy before initialization, then forward the original choice and expiry. Do not use a boolean grant or renew timestamps on load. Check `SiteOSAnalyticsLoader.scopedConsentVersion === 1` before claiming this source contract is deployed. No adapter or artificial grant is needed for independent collection.
- GPC, DNT and full opt-out stop measurement. Detailed Cookie interaction events always require that banner's explicit Analytics grant. Optional minimal realtime remains a separate counter independent of consent.
- Read current Analytics settings, then change only intended fields with `analytics settings set --revision <number>`. Refetch after a revision conflict; do not overwrite concurrent edits. Read back the published Cookie integration and reload the website after changes.

For a requested journey across related domains or subdomains, read
[linked-websites.md](references/linked-websites.md). It uses explicit per-environment membership and
independent local permission; never infer shared consent or merge separate Projects.

## Instrument useful events

Read [events-and-reports.md](references/events-and-reports.md). Prefer a small catalog tied to meaningful outcomes: completed signup, successful form submission, plan selection. Register event/property names before instrumentation. Choose List for a fixed set or Text (`public_text`) for explicit public content without enumerating values, after checking deployed capability. Text is general-purpose, not specific to FAQ or products. Never send visitor-entered text, email, account IDs, complete URLs or arbitrary dataLayer objects through events. Widen an existing List only after explicit review of its current catalog revision. Optional identity uses the separately authorized backend assertion contract, not event properties.

Use `analytics events create --file <event.json>`, then `analytics events snippet <name>` for the installed API. Instrument the actual success callback; a click is not a completed signup or submission. Use one installation and one event adapter per action to avoid duplicates. Declare page/event goals and ordered funnels only after their underlying events exist.

## Verify the outcome

1. Inspect the real website integration and run its applicable checks. Review private route shapes
   and registered event categories: built-in path minimisation cannot recognize every personal
   slug. Use the pre-load path transformation described in the installation reference when needed,
   and verify that private values do not leave in initial or SPA measurement requests.
2. In the browser, verify configuration loading, the published integration and any external CMP gate, opt-out behavior and a successful measurement request. Exercise the real business action; don't send synthetic production conversions to prove setup.
3. Read `analytics realtime --json` and `analytics report --days 1 --event <name> --json` to confirm accepted data in the exact environment. Inspect registered categories, page/source/country breakdowns and last-received time as relevant. A saved definition or snippet alone is not collection proof.
4. If native control is enabled, test unknown, grant, refusal, revoke and delayed Cookie loading. With control off or Cookie absent, verify independent collection without a Cookie global. Diagnose browser blocking, origin mismatch and stale configuration before changing settings.
5. If Trace is attached and monitoring setup is requested, `analytics monitoring prepare` prepares its collection draft with the `siteos_analytics` provider. It does not create event expectations or publish/install Trace. Use `$siteos-trace` and [website event checks](../siteos-trace/references/site-event-checks.md) to derive any requested rules from the actual action/event contract, then publish within the user's authorization and verify fresh evidence. Trace observes Analytics delivery; it never produces visits or sends duplicate events.

Analytics is Unlimited during early access. Keep billing policy distinct from bounded admission and retention. Distinguish minimal realtime (active pages in memory) from detailed visitor estimates and accepted events; never add these populations together.

Finish with the selected Project/environment, integration state, files changed, definitions registered and actual browser/report evidence. State any unverified step or required publication. Keep grants, sessions and private state out of outputs. For Search diagnostics and sidecar reports, use `$siteos-search`.
