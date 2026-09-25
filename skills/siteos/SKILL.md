---
name: siteos
description: Use for SiteOS setup, common Project and environment selection, an unspecified SiteOS request, or work spanning multiple services. Routes one repository and website Project to focused CLI, Auth, Pulse, Cookie, Forms, Search, Trace, SEO/GEO, Integrations, Analytics and Storage workflows.
---

# SiteOS

One plugin, one remote MCP, one CLI, one Project for the website or product. Load only the focused skills required by the user's outcome.

## Shared execution contract

This orchestrator owns tool selection, context, authentication handoffs and recovery across services.
Read the [shared execution contract](references/mcp-and-cli.md) once per task before choosing an
interface or resolving context. It applies equally to direct calls of focused skills; those skills
link to this same reference and own only their service-specific operations and evidence.
Maintain these common rules here and in the linked references, not as copies in each service.
The following workflow applies when the task needs CLI Project operations.

1. Resolve the target repository. Use `$siteos-cli` if installation, version or supported commands need attention.
2. Reuse CLI authentication; use `$siteos-auth` only when login or Organization discovery is needed. The task's explicit target authorizes selecting that existing context within current access without another confirmation. A different saved selection alone is not ambiguity.
3. Follow [Projects and environments](references/projects-and-environments.md) to verify or select the repository's exact Organization, Project and environment without changing the global Auth default. Use `project list --organization <id> --json` for discovery and `project use <project-id> --organization <id> --environment <slug> --json` for an identified target. Create a Project only when the task requests a new website/product; never create one to recover a stale selection. Ask only if the target remains ambiguous or inaccessible.
4. Read the service attachments from Project status. `project use` never creates service resources. Configure only the service requested by the user with `npx @siteoshq/cli project connect <service> --json`. To retain an existing service resource and its keys, use `--resource <id>` explicitly; never infer identity from a matching name or slug.
5. Route the work:
   - `$siteos-pulse`: Playwright monitoring, GitHub PR preview verification, independent Check usage, local validation and deployments.
   - `$siteos-cookie`: consent banner drafts, installation, publication and consent analytics.
   - `$siteos-forms`: form definitions, submission runtime and inbox verification.
   - `$siteos-search`: content sources, indexing, queries, search UI, health and usage reports.
   - `$siteos-trace`: website tracking investigation, evidence-backed event checks, diagnosis and installation; existing GA4 reports and visual investigations through optional Google Analytics MCP.
   - `$siteos-seo`: the requested SEO/GEO audit, research or AI Visibility comparison, using saved evidence and authorized CLI checks. Other saved reports can support the selected workflow; a full SEO/GEO pass applies only when requested.
   - `$siteos-integrations`: shared provider connections, selected GitHub repositories and notification destinations.
   - `$siteos-analytics`: website measurement, installation, optional Cookie/external consent control, events, conversions and realtime.
   - `$siteos-storage`: project files, private uploads/downloads, immutable public website assets and expiring share links.
6. For environment work, load [references/projects-and-environments.md](references/projects-and-environments.md). Report which Project, environments and services were changed and distinguish configuration, publication and verified runtime behavior.

## Ownership and state

- Auth owns accounts, Organizations and grants. Projects owns the common Project identity, domains, environment catalog and explicit attachments. Services retain their internal resource IDs, schema, credentials, data and behavior.
- Selecting a Project or opening a service never provisions another service. Explicit setup coordinates only the requested resources. Creating an environment prepares it in already attached services when required URLs are present; it does not publish configuration or install runtime code. Use `project environment use <slug>` for shared selection.
- Integrations connections belong to the Organization. GitHub installation/authorization and explicit connection use Services or the scoped CLI; Projects owns repository bindings per environment and Pulse owns PR selection. A GitHub connection alone never publishes or enables Checks. Creating a destination does not subscribe all Projects or send a message; configure each service's notification settings explicitly.
- The CLI stores the repository's common selection privately. Never inspect, print or edit private bindings, Auth sessions, grants or `.env`. There is no tracked `.siteos/project.json` and no reason to revive `@s-os/cli`.
- The application origin is selected through `SITEOS_AUTH_BASE_URL`; keep the common Project and its service management calls on that origin. Runtime keys and destinations remain service specific.
- Continue within the user's authorized work. Publication, deployments, provider authorization and test deliveries are separate actions: perform them when requested and report their actual result.
