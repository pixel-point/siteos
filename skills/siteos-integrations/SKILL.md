---
name: siteos-integrations
description: Use when inspecting or connecting SiteOS Organization providers, discovering Slack channels or configuring notification destinations shared by Project services.
---

# SiteOS Integrations

For supported hosted reads, prefer the available `siteos_integrations_get_connection` MCP tools after checking `siteos_get_context` and the exact Organization. Follow [MCP and CLI context](../siteos/references/mcp-and-cli.md). These reads do not require repository setup or CLI login. Use the existing CLI workflow for local work, mutations and operations outside the MCP catalog.

Integrations manages Organization provider connections and destinations. The first supported provider is Slack. The common plugin includes this workflow; do not install a separate SiteOS provider plugin.

For Google Analytics connection, exact property/web-stream selection and reconciliation, use
`$siteos-trace`. For optional Google Analytics MCP access from the agent, read its
[Google MCP workflow](../siteos-trace/references/google-analytics-mcp.md). The Organization's
Google connection inside SiteOS does not authorize a separate MCP server in the agent's host.

1. Run `npx @siteoshq/cli auth status --json` and use `$siteos-auth` when the intended Organization is not selected. A connection belongs to that Organization, not to an individual Project.
2. Run `npx @siteoshq/cli integrations status --json`. Inspect safe connection and destination metadata. Do not treat a configured connection as proof of a successfully delivered notification.
3. If connecting Slack is requested, run `npx @siteoshq/cli integrations connect --json`. Open its SiteOS URL and let the user complete provider authorization. Browser OAuth is a required user interaction; never fabricate a grant, extract browser credentials or request the user to paste a Slack token into chat. Continue independent service configuration while authorization is pending.
4. Run `npx @siteoshq/cli integrations channels --query <name> --json`. Follow `--cursor <cursor>` when the result is paginated. Select the intended provider channel by its returned ID; resolve ambiguous names before creating a destination.
5. Create the requested destination with `npx @siteoshq/cli integrations destination create --channel <provider-channel-id> --json`, then read Integrations status again. The destination makes the channel available for service configuration; it does not send a message or subscribe every Project.
6. Configure notifications in the requested service's settings, using the selected Project context. Load only that service's skill and available CLI help. If no command supports its notification settings, use the SiteOS service UI; do not invent an API or direct database operation. Send a test notification only when the user requested or authorized that message, then verify its actual delivery state.

Keep provider credentials, OAuth state, encrypted values, internal delivery tokens and raw SDK responses out of tool output and reports. Report the Organization, provider, safe destination name and actual delivery outcome. Disconnecting a shared provider can affect multiple Projects; identify that scope before performing a user-requested disconnect.
