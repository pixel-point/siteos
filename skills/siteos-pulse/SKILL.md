---
name: siteos-pulse
description: "Use for SiteOS Pulse browser/code Checks, scheduled monitoring and GitHub PR verification: configure independent usage, validate and publish bundles, and inspect saved Check/run evidence through supported CLI and MCP tools."
---

# SiteOS Pulse

Read the [shared execution contract](../siteos/references/mcp-and-cli.md) once per task before choosing tools or resolving context, including when this skill is invoked directly. Apply the service-specific workflow below after that shared contract.

Projects owns the common Project and environment identity. Pulse owns its attached resource, Checks, schedules, PR policy, deployment bundles and run evidence. GitHub is a shared Organization connection owned by Integrations.

For GitHub setup, preview admission or a missing PR result, read [GitHub PR verification](references/github-pull-requests.md). It defines the CLI setup steps and read-only MCP diagnostics and distinguishes PR verification from a manual run.

Hosted reads: `siteos_pulse_list_checks` and `siteos_pulse_get_check` expose published settings, overrides, effective schedules, independent PR participation and eligibility, active package versions and open incident evidence. `siteos_pulse_list_runs` and `siteos_pulse_get_run` provide run history and failure details. Discover available tools first; older servers may not expose Check reads.

## Workflow

1. Resolve the target through the shared execution contract.
2. Inspect the Pulse attachment with `npx @siteoshq/cli project status --json`.
3. If Pulse is not attached, run `npx @siteoshq/cli project connect pulse --json` within the requested monitoring setup. Attach an existing resource with `--resource <id>` when preserving an existing deployment. Read the resource ID and environment bindings from `project status --json`; do not select a second Project.
4. Inspect existing package scripts and Playwright configuration, fixtures, helpers, and specs before creating monitoring files. Reuse suitable tests and conventions instead of creating a parallel suite.
5. Select the intended common environment with `npx @siteoshq/cli project environment use <slug> --json`. Initialize missing Pulse monitoring files with `npx @siteoshq/cli pulse init`. Do not replace an existing Playwright setup or Pulse configuration.
   The common Project supplies the name/slug and selected environment URL. Manage addresses in Project settings or `project environment update`; deployment and dry runs resolve that environment, and local tests use its URL unless explicitly overridden.
6. Edit `siteos.config.json` and the appropriate tests according to the requested behavior. For every Check, establish whether it belongs in scheduled monitoring, PR verification, both, or manual use only. Preserve project-local conventions.
   - For Vitest, lint, typechecking or secret scanning, read [PR code Checks](references/code-checks.md). Version 4 adds `type: "code"` with the same CLI workflow; code-only setup does not need Playwright or a preview. Use the built-in pinned scanner for secret checks; do not invent a repository script that prints matching keys.
   - Browser PR participation requires config version 3 or 4 and `checks[].pullRequests.enabled`. Set each Check’s schedule explicitly; `mode: "manual"` means no schedule and still permits selected PR runs. `active: false` disables both uses.
   - Read the workflow reference below before changing version or execution usage. Preserve existing PR selection and schedule choices during sync. Do not infer PR participation from filenames, folders, or a repository connection.
   - PR previews require a base-URL-relative Check and cannot receive environment variables/Secrets. Reuse a Check in both contexts when its assertions are the same; use separate Checks when their behavior differs.
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

8. Run `npx @siteoshq/cli pulse deploy --json` only when the user requested deployment. A successful dry run proves bundle construction, not remote deployment. Verify published state with `siteos_pulse_list_checks` / `siteos_pulse_get_check`, or `pulse checks list` / `pulse checks read --check <id>` when available. Compare published defaults, preserved overrides, effective scheduling, `pullRequests.repositoryEnabled/selected/selectionSource/automaticEnabled/eligible/inactiveReasons`, and active version/checksum; an upload response alone does not prove the effective schedule.
9. For browser Checks, when remote verification is requested or follows an authorized repair/deployment, run `npx @siteoshq/cli pulse run --check <check-id> --json` (CLI 2.13.0+ and the matching server). Use the exact Check ID from Check reads, deployment output or verified saved run evidence in the selected Project/environment. This starts one manual run of the deployed Check; it does not upload local changes.
10. Read the returned Run ID with `siteos_pulse_get_run` until terminal, then inspect every test outcome. Resolve the MCP connection once through the shared contract. Do not click **Run again** or use browser automation to re-read saved run status available through MCP/CLI. The GitHub CLI setup workflow is described in the PR reference. If neither the supported CLI nor MCP can complete a step, report that specific capability/access blocker. Browser exploration of the tested website remains available for reproducing defects.
11. Report local checks, deployment, remote Run ID and terminal result separately. A queued/running response is not a pass, and a manual pass does not establish scheduled recovery; confirm that from a subsequent eligible scheduled pass. If a write loses its response, reconcile current runs and reuse the original `--request-id` for the same request; never issue a fresh request as an automatic retry.

Load [references/workflow.md](references/workflow.md) for configuration versions, file ownership, sync/deploy behavior, migration safeguards, and error handling.

For costs or waiting Checks, read `npx @siteoshq/cli pulse usage --json` in the selected context,
or `siteos_billing_get_usage` for its Organization. `mode: "preview"` / `state: "preview"` means
an estimate with no deductions or budget blocking. Per-run and PR `usage.cost` can be null;
never interpret missing measurements as free. Technical concurrency, rolling 24-hour PR attempts
and monthly money estimates are independent. Read [usage and capacity](references/usage.md)
when explaining these values or diagnosing a queue.

## Boundaries

- The common Project selects Pulse through an explicit attachment. Pulse retains its resource IDs, checks, deployment state and runtime data.
- Pulse setup never provisions another service. Matching service slugs are not shared identity.
- `siteos.config.json` is tracked, but immutable Project IDs and Auth/service credentials stay in private CLI state.
- Do not inspect or print `~/.siteos`, legacy binding contents, `.env`, service grants, runtime credentials, or authorization headers.
- CLI 2 requires a common Project selection. Select it with `siteos project use`; service-private bindings are not imported.
- Do not claim deployment success after `--dry-run`; distinguish local validation, local Playwright execution, bundle construction, upload, and remote scheduling.
