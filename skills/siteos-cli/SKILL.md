---
name: siteos-cli
description: Use when installing, upgrading, diagnosing, or discovering commands for the unified @siteoshq/cli, or when another SiteOS skill needs the exact supported CLI surface, JSON behavior, exit codes, local state boundaries, or environment overrides.
---

# SiteOS CLI

Search supports independent indices per Project environment. Use `search index list/create` and pass `--index ID` to subsequent hosted Search operations. Named-index `--install` writes distinct credential variables and reports their names in safe installation metadata; do not overwrite another index's variables. See the Search skill's [index workflow](../siteos-search/references/named-indices.md).

Read the [shared execution contract](../siteos/references/mcp-and-cli.md) once per task before choosing tools or resolving context, including when this skill is invoked directly. Apply the service-specific workflow below after that shared contract.

Use the single public package and binary:

```sh
npx --yes @siteoshq/cli@latest --help
npm install --global @siteoshq/cli
siteos --version
```

Node.js 22 or newer is required. Confirm the executable version and the needed subcommand in the task's working directory. A newer installation elsewhere does not update a different `siteos` resolved by PATH.

If a command is missing, use `command -v siteos` (or `Get-Command siteos` on PowerShell) and `siteos --version`, then run `npx --yes @siteoshq/cli@latest --version` and the needed `--help`. Keep the working directory, origin and `SITEOS_HOME` unchanged and use that same verified invocation for subsequent commands. Bare `npx @siteoshq/cli` may resolve an older local installation. If npm reports cache `EACCES`, pass `--cache <new-user-owned-temporary-directory>` to npm/npx and keep it for this task; do not use sudo or change ownership of the shared cache as part of a file workflow.

Run `npx --yes @siteoshq/cli@latest health-check --json` for read-only local diagnostics. It reports CLI/repository/reference readiness without contacting product APIs or reading runtime credentials.

Load [references/command-reference.md](references/command-reference.md) whenever exact commands, flags, exit codes, state files, or environment overrides matter. That file is generated from the current CLI help and must not be edited manually.

## Hosted installation

CLI 1.1.1 and newer defaults to `https://app.siteos.sh`. Upgrade older versions before starting
production setup. Existing authentication and repository bindings preserve their selected origin;
do not overwrite or copy them to switch installations. Authenticate at the intended origin.

For explicitly requested SiteOS staging work, set `SITEOS_AUTH_BASE_URL`,
`SITEOS_FORMS_PUBLIC_URL`, and `SITEOS_SEARCH_PUBLIC_URL` to `https://siteosapp.xui.se` together
before authentication. This selects a separate SiteOS installation, not a Project Environment.

## Operating Rules

- Use `--json` for agent and automation workflows whenever the command supports it.
- Exit code `0` means success and `2` means invalid usage. Treat other nonzero codes as operational failures and preserve the command's safe error text.
- Authenticate once through `siteos auth`; product commands obtain audience-bound service grants without exposing the durable Auth session.
- Never print one-time tokens, sessions, service grants, runtime credentials, authorization headers, private binding files, or `.env` contents.
- Private state belongs under `${SITEOS_HOME:-~/.siteos}` and must not be committed.
- `siteos project use` selects one common Project privately for the repository. `siteos.config.json` remains the tracked Pulse monitoring configuration. There are no service-private Project references; do not create `.siteos/forms/project.json` or `.siteos/search/project.json`.
- Check `project --help` and `integrations --help` for `--organization` before the shared contract's exact-context handoff. Older CLIs need a release containing this capability or the explicitly requested local development build. Selection behavior belongs to the orchestrator's [Project workflow](../siteos/references/projects-and-environments.md).
- Use `siteos project` for common selection, service setup and environments. Use `siteos project environment use <slug>` to switch every service together; Project settings own the name and per-environment URL. Never create a tracked `.siteos/project.json`.
- Common Projects and the Cookie, Trace and Integrations commands require CLI 1.1.0 or newer and the matching SiteOS server. Check the installed help before using them; a source checkout does not prove the public package has been released.
- If a command is absent from the generated reference, run the appropriate `--help`; do not invent it or call a private API as a substitute.

## Storage files and website assets

Use `siteos storage --help` for private files, folders, verified transfers, versions, publication,
expiring shares and trash. After selecting the exact Project environment, start with
`siteos storage status --json` and `siteos storage list --json`. CLI 2.24.0 adds batch uploads,
`--dry-run` and explicit duplicate-name policies through `--on-conflict error|skip|replace`.
Upgrade older installations before using those flags. Follow the [Storage workflow](../siteos-storage/SKILL.md)
for conflict review, resumable upload receipts and separately authorized publication; a private
upload never becomes a public website asset automatically.

## Search crawler source review

CLI 2.11.0 adds `search crawl preview`, `--decisions` and `--review-token` for reviewing
existing index matches and guarded publication. Use it with the matching Search backend and
follow `$siteos-search` for source decisions. A ready crawl is not a published index; inspect the
preview and resolve required choices before publication. Upgrade older CLIs before using this flow.

## SEO repair workflow

CLI 2.1.0 adds `seo repair`, repeated `seo recheck --url` targets (up to 20), and the
`--resource` guard used by Copy for agent. Older CLI versions cannot run those copied commands.
Check the version and `seo --help`; upgrade with `npm install --global @siteoshq/cli@latest`
or use `npx @siteoshq/cli@latest`. Read the SEO technical-audit workflow and verify the selected
Organization, Project and environment before repair or recheck work. The 500-page full-audit
maximum is server policy; upgrading the CLI does not change a saved 100-page setting.

## Trace explorer

CLI 1.8.0 adds `trace destinations`, `events`, `properties`, `issues`, `observations`,
`issue show` and `observation show`, plus `tracking-plan publish --expected-draft-version`.
Use these only with the matching Trace server release. Read `$siteos-trace` for the investigation
workflow and the distinction between a data layer source and observed analytics destinations.
Lists return one page; preserve filters when using `nextCursor`. Commands do not poll or publish
implicitly. An older CLI remains usable for its existing commands; upgrading it does not deploy
the server or update a website's pinned Trace script.

## Forms releases

Use `forms deploy --manifest <path>` for non-interactive publication with an explicit Forms origin
and release-only `SITEOS_FORMS_DEPLOYMENT_KEY`. `forms deployment-key issue|list|revoke` manages that
separate Environment authority through normal Auth grants. Submission credentials cannot publish.
Read `../siteos-forms/references/form-deployment.md` for generation, version pinning and rollback.

## Cookie service discovery

Use `cookie services list` for the deployed catalog and custom-service schema and `cookie discover` for a bounded local browser/source/GTM-export inventory. Discovery never saves or publishes; the Cookie skill researches unknown providers and uses revision-checked draft save/publication. See [service discovery](../siteos-cookie/references/service-discovery.md). Verify these commands exist in the installed help before use.
