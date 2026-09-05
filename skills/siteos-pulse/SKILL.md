---
name: siteos-pulse
description: Use when creating, selecting, configuring, validating, testing, synchronizing, or deploying a SiteOS Pulse monitoring Project and its versioned Playwright Checks through the unified @siteoshq/cli.
---

# SiteOS Pulse

Operate Pulse only through `@siteoshq/cli` and the target repository. Pulse owns its Projects, Checks, schedules, deployment bundles, credentials, and runtime data.

## Workflow

1. From the repository root, run `npx @siteoshq/cli auth status --json`. Use `$siteos-auth` if sign-in or Organization selection is required.
2. Run `npx @siteoshq/cli project status --json`. Use `$siteos` to select the intended common website Project when missing.
3. If Pulse is not attached, run `npx @siteoshq/cli project connect pulse --json` within the requested monitoring setup. Attach an existing resource with `--resource <id>` when preserving an existing deployment. Run `npx @siteoshq/cli pulse project list --json` only to inspect legacy resource IDs and the attached Pulse resource's slug; do not select a second Project.
4. Inspect the repository's existing Playwright configuration, fixtures, helpers, and specs before creating monitoring files. Reuse suitable tests and conventions instead of creating a parallel suite.
5. Select the intended common environment with `npx @siteoshq/cli project environment use <slug> --json`. Initialize missing Pulse monitoring files with `npx @siteoshq/cli pulse init`. Do not replace an existing Playwright setup or Pulse configuration.
   The common Project supplies the name/slug and selected environment URL. Manage addresses in Project settings or `project environment update`; deployment and dry runs resolve that environment, and local tests use its URL unless explicitly overridden.
6. Edit `siteos.config.json` and Playwright tests according to the requested monitoring behavior. Preserve versioned JSON configuration and project-local conventions.
   - Load [references/playwright-authoring.md](references/playwright-authoring.md) before creating, extending, or repairing Playwright tests.
   - When `$playwright-cli` is available in the current agent environment, use it as the optional browser exploration, test-authoring, and debugging companion. Do not assume or require that another skill is installed.
   - When it is unavailable, continue with the project's local Playwright executable and its help. Never install a global browser tool as a hidden prerequisite.
7. Run the local gates in order:

   ```sh
   npx @siteoshq/cli pulse validate --json
   npx @siteoshq/cli pulse sync --check --json
   npx @siteoshq/cli pulse test
   npx @siteoshq/cli pulse deploy --dry-run --json
   ```

8. Run `npx @siteoshq/cli pulse deploy --json` only when the user requested deployment. A successful dry run proves bundle construction, not remote deployment.

Load [references/workflow.md](references/workflow.md) for configuration versions, file ownership, sync/deploy behavior, migration safeguards, and error handling.

## Boundaries

- The common Project selects Pulse through an explicit attachment. Pulse retains its resource IDs, checks, deployment state and runtime data.
- Pulse setup never provisions another service. Matching service slugs are not shared identity.
- `siteos.config.json` is tracked, but immutable Project IDs and Auth/service credentials stay in private CLI state.
- Do not inspect or print `~/.siteos`, legacy binding contents, `.env`, service grants, runtime credentials, or authorization headers.
- A legacy Pulse binding may be imported only by the CLI's guarded migration. Do not copy or translate it manually.
- Do not claim deployment success after `--dry-run`; distinguish local validation, local Playwright execution, bundle construction, upload, and remote scheduling.
