---
name: siteos-pulse
description: "Use for SiteOS Pulse runtime Errors, browser/code Checks, scheduled monitoring and GitHub PR verification: connect error capture, inspect issues and releases, configure Checks, and manage saved evidence through supported CLI and MCP tools."
---

# SiteOS Pulse

Read the [shared execution contract](../siteos/references/mcp-and-cli.md) once per task before choosing tools or resolving context, including when this skill is invoked directly. Apply the service-specific workflow below after that shared contract.

Projects owns the common Project and environment identity. Pulse owns its attached resource, Checks, schedules, PR policy, deployment bundles and run evidence. GitHub is a shared Organization connection owned by Integrations.

For GitHub setup, preview admission or a missing PR result, read [GitHub PR verification](references/github-pull-requests.md). It defines the CLI setup steps and read-only MCP diagnostics and distinguishes PR verification from a manual run.

Hosted reads: `siteos_pulse_list_checks` and `siteos_pulse_get_check` expose published settings, overrides, effective schedules, independent PR participation and eligibility, active package versions and open incident evidence. `siteos_pulse_list_runs` and `siteos_pulse_get_run` provide run history and failure details. Discover available tools first; older servers may not expose Check reads.

For runtime exceptions, error groups, releases or Sentry migration, read [Pulse Errors](references/errors.md) first. That workflow does not require Checks, Playwright or a runner.

When `$playwright-cli` is available, it can help author and inspect a journey. Do not assume or require that another skill is installed; the project's local Playwright command remains sufficient.

## Checks workflow

1. Resolve the target through the shared execution contract, inspect `siteos project status --json`, and select the requested common environment. Connect Pulse explicitly with `siteos project connect pulse --json` if needed. Preserve existing resource IDs and environment bindings.
2. Choose the smallest useful check:
   - Availability or visible page content: use a native page check in Pulse or `siteos pulse native save`. No repository config, package or Playwright installation is needed.
   - Customer journeys: reuse ordinary Playwright tests/config. Inspect existing fixtures and scripts before adding tests. Read [Playwright authoring](references/playwright-authoring.md); never send real leads or perform purchases just to test monitoring.
   - Vitest, lint, typechecking or secret scanning: retain [PR code Checks](references/code-checks.md). The new page/Playwright setup does not replace their v4 manifest.
3. For page checks, choose the path, HTTP/content check and schedule explicitly. Use `pulse native list` for IDs and revisions before edits; edits preserve scheduling overrides. Read back with MCP Check diagnostics.
4. For Playwright, read [saved setup and migration](references/checks-setup.md). Use `pulse playwright attach` or the Pulse editor to save config path, files and optional projects/tags/fixtures. No Checks SDK and no `siteos.config.json` are required for this path. Run the project's normal Playwright command locally.
5. Automatic refresh uses `--auto-refresh` and the Project environment's repository/deployment connection. For Vercel, connect the hosting account once in Services and select its project in environment settings; no client build command, workflow or SDK is needed. Otherwise GitHub deployment events must identify the exact website. Use the deployed commit on the trusted branch, including a verified rollback; do not assume current branch head is deployed. SiteOS prepares source without importing customer config, verifies on the runner and rechecks deployment authority before activation. Missing evidence is not success. Read `setup.refresh` and `setup.candidate` through Check diagnostics. See [setup](references/checks-setup.md).
6. For deliberate local or test-only publication, `pulse playwright publish --check <id> --dry-run` prepares an immutable snapshot without uploads. Authorized publication uses the same command without `--dry-run`; it queues verification and activates only after a nonempty successful run. Read the returned Run ID through MCP. Failed preparation/verification keeps the active version. Reconcile the same upload after a lost response; use `--retry` only for an intentional repeat of a finished failed candidate.
7. Existing browser Checks use `pulse playwright list`, then `migrate --check <id> --revision <n> --dry-run` before applying the reviewed migration. Preserve Check IDs, schedules, overrides, Secrets, PR choices, incidents and runs. Wait for the automatic candidate to activate (or publish explicitly when automatic evidence is unavailable) before removing obsolete repository config; retain config needed by code or unmigrated checks.
8. Existing manifest-managed Checks remain supported. Follow [legacy workflow](references/workflow.md) for `init`, `validate`, `sync`, `test` and `deploy`; do not create legacy config for a new page or attached Playwright Check. Establish scheduled/manual/PR use explicitly. A repository connection never implies PR participation, and PR runs never receive variables or Secrets.
9. Report setup, preparation, queued verification, active version and scheduled monitoring separately. A manual pass is not scheduled incident recovery. Do not modify another project as part of this setup.

For costs or waiting Checks, read `npx @siteoshq/cli pulse usage --json` in the selected context,
or `siteos_billing_get_usage` for its Organization. `mode: "preview"` / `state: "preview"` means
an estimate with no deductions or budget blocking. Per-run and PR `usage.cost` can be null;
never interpret missing measurements as free. `mode: "enforced"` reserves and settles the shared monthly execution budget. There is no daily PR count quota. Concurrency and available runner capacity remain separate from money. Read [usage and capacity](references/usage.md)
when explaining these values or diagnosing a queue.

## Boundaries

- The common Project selects Pulse through an explicit attachment. Pulse retains its resource IDs, checks, deployment state and runtime data.
- Pulse setup never provisions another service. Matching service slugs are not shared identity.
- Saved page/Playwright setup belongs to SiteOS. Legacy/code manifests remain tracked; Project selection and credentials stay in private CLI state.
- Do not inspect or print `~/.siteos`, legacy binding contents, `.env`, service grants, runtime credentials, or authorization headers.
- CLI 2 requires a common Project selection. Select it with `siteos project use`; service-private bindings are not imported.
- Do not claim deployment success after `--dry-run`; distinguish local validation, local Playwright execution, bundle construction, upload, and remote scheduling.
