---
name: siteos
description: Use for SiteOS setup, common Project and environment selection, an unspecified SiteOS request, or work spanning multiple services. Routes one repository and website Project to focused CLI, Auth, Pulse, Cookie, Forms, Search, Trace, Integrations and analytics workflows.
---

# SiteOS

One plugin, one CLI, one Project for the website or product. Load only the focused skills required by the user's outcome.

1. Resolve the target repository. Use `$siteos-cli` if installation, version or supported commands need attention.
2. Authenticate once with `$siteos-auth` and select the intended Organization.
3. Run `npx @siteoshq/cli project status --json`. If no Project is selected, run `npx @siteoshq/cli project list --json`, then `npx @siteoshq/cli project use <id-or-slug> --json` for the intended Project. When the task requires a new website/product, create it with `npx @siteoshq/cli project create --name <name> --slug <slug> --domain <domain> --json`, then select it. Resolve ambiguity from the task and repository context; ask only when the intended Project is still unclear.
4. Read the service attachments from Project status. `project use` never creates service resources. Configure only the service requested by the user with `npx @siteoshq/cli project connect <service> --json`. To retain an existing service resource and its keys, use `--resource <id>` explicitly; never infer identity from a matching name or slug.
5. Route the work:
   - `$siteos-pulse`: Playwright monitoring, checks, local validation and deployments.
   - `$siteos-cookie`: consent banner drafts, installation, publication and consent analytics.
   - `$siteos-forms`: form definitions, submission runtime and inbox verification.
   - `$siteos-search`: content sources, indexing, queries and search UI.
   - `$siteos-trace`: analytics observation, installation and tracking plans.
   - `$siteos-integrations`: shared provider connections and notification destinations.
   - `$siteos-analytics`: Search analytics, diagnostics and reports.
6. For environment work, load [references/projects-and-environments.md](references/projects-and-environments.md). Report which Project, environments and services were changed and distinguish configuration, publication and verified runtime behavior.

## Ownership and state

- Auth owns accounts, Organizations and grants. Projects owns the common Project identity, domains, environment catalog and explicit attachments. Services retain their internal resource IDs, schema, credentials, data and behavior.
- Selecting a Project or opening a service never provisions another service. Explicit setup coordinates only the requested resources. Creating an environment prepares it in already attached services when required URLs are present; it does not publish configuration or install runtime code. Use `project environment use <slug>` for shared selection.
- Integrations connections belong to the Organization. Creating a destination does not subscribe all Projects or send a message; configure each service's notification settings explicitly.
- The CLI stores the repository's common selection privately. Never inspect, print or edit private bindings, Auth sessions, grants or `.env`. There is no tracked `.siteos/project.json` and no reason to revive `@s-os/cli`.
- The application origin is selected through `SITEOS_AUTH_BASE_URL`; keep the common Project and its service management calls on that origin. Runtime keys and destinations remain service specific.
- Continue within the user's authorized work. Publication, deployments, provider authorization and test deliveries are separate actions: perform them when requested and report their actual result.
