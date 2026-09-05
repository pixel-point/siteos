---
name: siteos-cli
description: Use when installing, upgrading, diagnosing, or discovering commands for the unified @siteoshq/cli, or when another SiteOS skill needs the exact supported CLI surface, JSON behavior, exit codes, local state boundaries, or environment overrides.
---

# SiteOS CLI

Use the single public package and binary:

```sh
npx @siteoshq/cli --help
npm install --global @siteoshq/cli
siteos --version
```

Node.js 22 or newer is required. Prefer the `npx` package form in portable skill instructions and the `siteos` binary after a confirmed global installation.

Run `npx @siteoshq/cli health-check --json` for read-only local diagnostics. It reports CLI/repository/reference readiness without contacting product APIs or reading runtime credentials.

Load [references/command-reference.md](references/command-reference.md) whenever exact commands, flags, exit codes, state files, or environment overrides matter. That file is generated from the current CLI help and must not be edited manually.

## Hosted installation

CLI 1.1.1 and newer defaults to `https://app.siteos.sh`. Upgrade older versions before starting
production setup. Existing authentication and repository bindings preserve their selected origin;
do not overwrite or copy them to switch installations. Authenticate at the intended origin.

For explicitly requested SiteOS staging work, set `SITEOS_AUTH_BASE_URL`, `SITEOS_PULSE_API_URL`,
`SITEOS_FORMS_PUBLIC_URL`, and `SITEOS_SEARCH_PUBLIC_URL` to `https://siteosapp.xui.se` together
before authentication. This selects a separate SiteOS installation, not a Project Environment.

## Operating Rules

- Use `--json` for agent and automation workflows whenever the command supports it.
- Exit code `0` means success and `2` means invalid usage. Treat other nonzero codes as operational failures and preserve the command's safe error text.
- Authenticate once through `siteos auth`; product commands obtain audience-bound service grants without exposing the durable Auth session.
- Never print one-time tokens, sessions, service grants, runtime credentials, authorization headers, private binding files, or `.env` contents.
- Private state belongs under `${SITEOS_HOME:-~/.siteos}` and must not be committed.
- `siteos project use` selects one common Project privately for the repository. `siteos.config.json` remains the tracked Pulse monitoring configuration. Existing `.siteos/forms/project.json` and `.siteos/search/project.json` are legacy service references, not prerequisites for a common Project.
- Use `siteos project` for common selection, service setup and environments. Use `siteos project environment use <slug>` to switch every service together; Project settings own the name and per-environment URL. Never create a tracked `.siteos/project.json`.
- Common Projects and the Cookie, Trace and Integrations commands require CLI 1.1.0 or newer and the matching SiteOS server. Check the installed help before using them; a source checkout does not prove the public package has been released.
- If a command is absent from the generated reference, run the appropriate `--help`; do not invent it or call a private API as a substitute.
