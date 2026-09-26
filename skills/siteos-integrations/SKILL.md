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

Use CLI 2.32.0+ and a matching server. Read saved metadata through
`siteos_integrations_get_connection` with `provider: "github"` or
`siteos integrations github status --organization <id> --json`. An unavailable integration is a
release/configuration boundary. A ready empty catalog differs from loading or a failed refresh.

For an authorized connection, run `siteos integrations github authorize --organization <id> --json`
and give its URL to the user for GitHub consent. If no App installation exists, use the `installUrl`
from status to install on the selected repositories, then authorize again. The callback verifies
repository access for the initiating SiteOS user and Organization;
it does not connect automatically and does not depend on the browser's selected SiteOS Organization.
Read `github candidates`, select explicit repository IDs from the current user's candidates, then run
`github connect --installation <id> --repositories <id,id> --organization <id> --json`. Read status until the selected
installation's catalog is ready. Do not treat queued refresh as success. `github refresh` queues
catalog refresh; it never shares newly discovered repositories automatically. To add repositories,
repeat authorize → candidates → connect with the new selection. One GitHub installation can serve
several SiteOS Organizations. Each has independent selected repositories; different managers can
contribute from their own GitHub accounts. Candidates are the intersection of human and App access,
private to that user and Organization. Adding preserves existing shared repositories.
Use `github remove --installation <id> --repositories <id,id> --organization <id> --confirm` for
explicit Organization-only removal. Stale consent or changed selection requires new authorization;
do not retry by broadening access or copying another user's candidates.
`github disconnect --installation <id> --organization <id> --confirm` requires the user's requested
scope because other services in this Organization may use the connection. It does not uninstall the App or disconnect another SiteOS Organization. OAuth/management use the dedicated
`integrations:github:write` grant; never request secrets or extract browser credentials.

The Services **Manage resources** flow remains available for users who prefer the web interface.
MCP only reads connected installations and repository metadata; it does not start authorization,
show pending candidates, refresh catalogs or mutate connections.

Projects owns repository bindings per environment, so Production and Staging may use different repositories. Services controls the shared provider; Pulse controls its own PR policy and Check selection. From Pulse configuration, **Manage GitHub in Services** retains the Project/environment return destination. Connecting GitHub does not attach Pulse, publish a Check bundle or enable automatic checks. Other services can consume this shared connection only when their own supported workflow exists.

For PR execution and preview requirements after connection, load [Pulse GitHub verification](../siteos-pulse/references/github-pull-requests.md). A connected repository is not a general source-code indexing or arbitrary CI execution capability.
