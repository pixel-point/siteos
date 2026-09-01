---
name: siteos-pulse
description: Use when creating, selecting, configuring, validating, testing, synchronizing, or deploying a SiteOS Pulse monitoring Project and its versioned Playwright Checks through the unified @siteoshq/cli.
---

# SiteOS Pulse

Operate Pulse only through `@siteoshq/cli` and the target repository. Pulse owns its Projects, Checks, schedules, deployment bundles, credentials, and runtime data.

## Workflow

1. From the repository root, run `npx @siteoshq/cli auth status --json`. Use `$siteos-auth` if sign-in or Organization selection is required.
2. Run `npx @siteoshq/cli pulse project status --json`.
3. If no Pulse Project is selected, list existing Pulse Projects with `npx @siteoshq/cli pulse project list --json`. Create one only when the intended slug and name are explicit:

   ```sh
   npx @siteoshq/cli pulse project create --slug <slug> --name <name> --json
   npx @siteoshq/cli pulse project use <slug> --json
   ```

   Use `--replace` only after explicit approval to replace this repository's existing Pulse binding.
4. Initialize missing monitoring files with `npx @siteoshq/cli pulse init --project <slug> --base-url <url>`.
5. Edit `siteos.config.json` and Playwright tests according to the requested monitoring behavior. Preserve versioned JSON configuration and project-local conventions.
6. Run the local gates in order:

   ```sh
   npx @siteoshq/cli pulse validate --json
   npx @siteoshq/cli pulse sync --check --json
   npx @siteoshq/cli pulse test
   npx @siteoshq/cli pulse deploy --dry-run --json
   ```

7. Run `npx @siteoshq/cli pulse deploy --json` only when the user requested deployment. A successful dry run proves bundle construction, not remote deployment.

Load [references/workflow.md](references/workflow.md) for configuration versions, file ownership, sync/deploy behavior, migration safeguards, and error handling.

## Boundaries

- A Pulse Project is independent from Forms and Search Projects even when slugs match.
- Never create or select sibling-service Projects as part of Pulse setup.
- `siteos.config.json` is tracked, but immutable Project IDs and Auth/service credentials stay in private CLI state.
- Do not inspect or print `~/.siteos`, legacy binding contents, `.env`, service grants, runtime credentials, or authorization headers.
- A legacy Pulse binding may be imported only by the CLI's guarded migration. Do not copy or translate it manually.
- Do not claim deployment success after `--dry-run`; distinguish local validation, local Playwright execution, bundle construction, upload, and remote scheduling.
