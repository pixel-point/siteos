---
name: siteos-integrations
description: Use for shared SiteOS Organization provider connections, including selected GitHub repositories, Slack channel discovery and notification destinations used by Project services.
---

# SiteOS Integrations

Read the [shared execution contract](../siteos/references/mcp-and-cli.md) once per task before choosing tools or resolving context, including when this skill is invoked directly. Apply the service-specific workflow below after that shared contract.

Hosted reads: `siteos_integrations_get_connection` for the requested Organization.

Integrations manages Organization provider connections and destinations. The first supported provider is Slack. The common plugin includes this workflow; do not install a separate SiteOS provider plugin.

For Google Analytics connection, exact property/web-stream selection and reconciliation, use
`$siteos-trace`. For optional Google Analytics MCP access from the agent, read its
[Google MCP workflow](../siteos-trace/references/google-analytics-mcp.md). The Organization's
Google connection inside SiteOS does not authorize a separate MCP server in the agent's host.

1. Resolve Organization context through the shared contract. Check `integrations --help` for `--organization`, using `$siteos-cli` if unavailable.
2. Run `npx @siteoshq/cli integrations status --organization <id> --json`. Inspect safe connection and destination metadata. Do not treat a configured connection as proof of a successfully delivered notification.
3. If connecting Slack is requested, run `npx @siteoshq/cli integrations connect --organization <id> --json`. Open its SiteOS URL and let the user select that Organization and complete provider authorization. Returning a URL does not switch browser Organization or prove authorization. Never fabricate a grant, extract browser credentials or request a Slack token in chat. Continue independent service configuration while authorization is pending.
4. Run `npx @siteoshq/cli integrations channels --organization <id> --query <name> --json`. Follow `--cursor <cursor>` when the result is paginated. Select the intended provider channel by its returned ID; resolve ambiguous names before creating a destination.
5. Create the requested destination with `npx @siteoshq/cli integrations destination create --organization <id> --channel <provider-channel-id> --json`, then read Integrations status again. The destination makes the channel available for service configuration; it does not send a message or subscribe every Project.
6. Configure notifications in the requested service's settings, using the selected Project context. Load only that service's skill and available CLI help. If no command supports its notification settings, use the SiteOS service UI; do not invent an API or direct database operation. Send a test notification only when the user requested or authorized that message, then verify its actual delivery state.

Keep provider credentials, OAuth state, encrypted values, internal delivery tokens and raw SDK responses out of tool output and reports. Report the Organization, provider, safe destination name and actual delivery outcome. Disconnecting a shared provider can affect multiple Projects; identify that scope before performing a user-requested disconnect.

## GitHub repositories

GitHub is a shared Organization connection in **Services → GitHub** when the deployment includes the GitHub integration and its App configuration. If the card is missing or says it is not configured, report that release/configuration boundary; do not claim the connection is live.

Resolve the exact Organization, open **Services → GitHub → Connect GitHub**, and continue with GitHub to confirm the account. Choose the verified installation. If no installation is available, install the App on the user's selected repositories and use **Check installation** before connecting. GitHub account ownership or organization administrator access is required in addition to SiteOS Integrations management access. App installation alone does not connect the SiteOS Organization. Read back the connected account and open **Manage resources** for its repository catalog. Loading has a progress toast; a ready empty catalog means no repositories are selected. For a failed or stalled refresh, inspect GitHub access and use **Reload repositories**. Resource selection is managed by the GitHub App installation, not by a second SiteOS checkbox list.

The current `integrations connect` CLI command is the Slack flow. Do not invent a GitHub CLI command or treat `siteos_integrations_get_connection` as GitHub installation evidence. GitHub setup and management use the authenticated SiteOS browser flow; do not request OAuth tokens, client secrets or private keys in chat.

Projects owns repository bindings per environment, so Production and Staging may use different repositories. Services controls the shared provider; Pulse controls its own PR policy and Check selection. From Pulse configuration, **Manage GitHub in Services** retains the Project/environment return destination. Connecting GitHub does not attach Pulse, publish a Check bundle or enable automatic checks. Other services can consume this shared connection only when their own supported workflow exists.

For PR execution and preview requirements after connection, load [Pulse GitHub verification](../siteos-pulse/references/github-pull-requests.md). A connected repository is not a general source-code indexing or arbitrary CI execution capability.
