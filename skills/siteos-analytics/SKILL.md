---
name: siteos-analytics
description: Set up SiteOS website Analytics in a selected Project environment, configure optional Cookie or external consent control, install the browser script or GTM adapter, register custom events and conversions, and verify actual collection, countries and realtime. Use for website measurement; route managed Search health and usage reports to siteos-search.
---

# SiteOS Analytics

For an existing Google Analytics property, GA4 report charts or Google tracking investigation,
use `$siteos-trace` and its optional Google Analytics MCP workflow. Those requests do not require
installing SiteOS Analytics. Keep Google-reported metrics separate from SiteOS collection counts.

For supported hosted reads, prefer the available `siteos_analytics_get_report` and `siteos_analytics_get_realtime` MCP tools after checking `siteos_get_context` and the exact Organization, Project and Environment. Follow [MCP and CLI context](../siteos/references/mcp-and-cli.md). These reads do not require repository setup or CLI login. Use the existing CLI workflow for local work, mutations and operations outside the MCP catalog.

Complete the path from the site's business action to a saved Analytics report. Cookie and Trace are optional services; Analytics works independently without either service.

## Establish the target

1. Run `npx @siteoshq/cli analytics --help` and confirm that the installed CLI and selected server support these commands. Source documentation does not prove a public release. Delegate missing CLI support to `$siteos-cli` and missing authentication to `$siteos-auth`; do not substitute private APIs.
2. Use `npx @siteoshq/cli auth status --json` and `npx @siteoshq/cli project status --json` to confirm Organization, Project and environment. Use an explicit `--environment <slug>` on Analytics commands when needed. Never fall back to Production or infer a binding from a matching name/domain.
3. If Analytics is absent, use `npx @siteoshq/cli project connect analytics` within the user's requested setup. This explicitly attaches Analytics only. Use `$siteos` for common Project or environment repair. Never inspect private binding or credential files.
4. Read `npx @siteoshq/cli analytics status --json` and `npx @siteoshq/cli analytics installation --json`.
5. A newly attached Analytics workspace may have no native source enabled. For the requested SiteOS installation, read `analytics settings show --environment <slug> --json` and explicitly enable collection with `analytics settings set --revision <current-revision> --enabled true --environment <slug>`. Read it back before installing. Connecting GA4 through Analytics Setup is independent and does not enable the SiteOS collector; do not install a native script for a GA4-only request.

## Choose collection behavior

Read [measurement-and-installation.md](references/measurement-and-installation.md) before changing consent behavior, using GTM or diagnosing missing traffic.

- Analytics collects independently by default. Attaching Cookie does not change this behavior.
- For native consent control, use `$siteos-cookie` to set `draft.integrations.siteosAnalytics: true` in the same Project environment, then explicitly publish the reviewed banner when authorized. The UI equivalent is Cookie → Services → SiteOS Analytics → Control with Cookie. Disabling it also requires publication. Never create a second Analytics consent policy or invent a `--consent-mode` flag.
- With the published integration enabled, Analytics waits for the matching Cookie runtime and follows regional rules, choices and withdrawal. Strict opt-in waits for a grant; a reviewed opt-out/notice profile can permit collection without claiming consent. A draft save has no public effect.
- External CMPs can opt into a gate before script initialization using `data-siteos-consent="required"`, or GTM's **Use external consent manager** option, then supply the actual consent state. No adapter or artificial grant is needed for independent collection.
- GPC, DNT and full opt-out stop measurement. Detailed Cookie interaction events always require that banner's explicit Analytics grant. Optional minimal realtime remains a separate counter independent of consent.
- Read current Analytics settings, then change only intended fields with `analytics settings set --revision <number>`. Refetch after a revision conflict; do not overwrite concurrent edits. Read back the published Cookie integration and reload the website after changes.

## Instrument useful events

Read [events-and-reports.md](references/events-and-reports.md). Prefer a small catalog tied to meaningful outcomes: completed signup, successful form submission, plan selection. Register allowed categorical properties before writing instrumentation. Never collect email, account IDs, free text, complete URLs or arbitrary dataLayer objects.

Use `analytics events create --file <event.json>`, then `analytics events snippet <name>` for the installed API. Instrument the actual success callback; a click is not a completed signup or submission. Use one installation and one event adapter per action to avoid duplicates. Declare page/event goals and ordered funnels only after their underlying events exist.

## Verify the outcome

1. Inspect the real website integration and run its applicable checks.
2. In the browser, verify configuration loading, the published integration and any external CMP gate, opt-out behavior and a successful measurement request. Exercise the real business action; don't send synthetic production conversions to prove setup.
3. Read `analytics realtime --json` and `analytics report --days 1 --event <name> --json` to confirm accepted data in the exact environment. Inspect registered categories, page/source/country breakdowns and last-received time as relevant. A saved definition or snippet alone is not collection proof.
4. If native control is enabled, test unknown, grant, refusal, revoke and delayed Cookie loading. With control off or Cookie absent, verify independent collection without a Cookie global. Diagnose browser blocking, origin mismatch and stale configuration before changing settings.
5. If Trace is attached and monitoring setup is requested, `analytics monitoring prepare` prepares its collection draft with the `siteos_analytics` provider. It does not create event expectations or publish/install Trace. Use `$siteos-trace` and [website event checks](../siteos-trace/references/site-event-checks.md) to derive any requested rules from the actual action/event contract, then publish within the user's authorization and verify fresh evidence. Trace observes Analytics delivery; it never produces visits or sends duplicate events.

Analytics is Unlimited during early access. Keep billing policy distinct from bounded admission and retention. Distinguish minimal realtime (active pages in memory) from detailed visitor estimates and accepted events; never add these populations together.

Finish with the selected Project/environment, integration state, files changed, definitions registered and actual browser/report evidence. State any unverified step or required publication. Keep grants, sessions and private state out of outputs. For Search diagnostics and sidecar reports, use `$siteos-search`.
