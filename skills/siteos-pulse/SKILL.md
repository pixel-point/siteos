---
name: siteos-pulse
description: Use when creating, selecting, configuring, validating, testing, synchronizing, or deploying a SiteOS Pulse monitoring Project and its versioned Playwright Checks through the unified @siteoshq/cli.
---

# SiteOS Pulse

Read the [shared execution contract](../siteos/references/mcp-and-cli.md) once per task before choosing tools or resolving context, including when this skill is invoked directly. Apply the service-specific workflow below after that shared contract.

Pulse owns its Projects, Checks, schedules, deployment bundles, credentials, and runtime data.

Hosted reads: `siteos_pulse_list_runs` and `siteos_pulse_get_run` for run history and failure details.

## Workflow

1. Resolve the target through the shared execution contract.
2. Inspect the Pulse attachment with `npx @siteoshq/cli project status --json`.
3. If Pulse is not attached, run `npx @siteoshq/cli project connect pulse --json` within the requested monitoring setup. Attach an existing resource with `--resource <id>` when preserving an existing deployment. Read the resource ID and environment bindings from `project status --json`; do not select a second Project.
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
- CLI 2 requires a common Project selection. Select it with `siteos project use`; service-private bindings are not imported.
- Do not claim deployment success after `--dry-run`; distinguish local validation, local Playwright execution, bundle construction, upload, and remote scheduling.
