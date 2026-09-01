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

## Operating Rules

- Use `--json` for agent and automation workflows whenever the command supports it.
- Exit code `0` means success and `2` means invalid usage. Treat other nonzero codes as operational failures and preserve the command's safe error text.
- Authenticate once through `siteos auth`; product commands obtain audience-bound service grants without exposing the durable Auth session.
- Never print one-time tokens, sessions, service grants, runtime credentials, authorization headers, private binding files, or `.env` contents.
- Private state belongs under `${SITEOS_HOME:-~/.siteos}` and must not be committed.
- The tracked references are product-specific: `siteos.config.json`, `.siteos/forms/project.json`, and `.siteos/search/project.json`.
- There is no root `siteos project` command and no global `.siteos/project.json`.
- If a command is absent from the generated reference, run the appropriate `--help`; do not invent it or call a private API as a substitute.
