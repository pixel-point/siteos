# Pulse workflow reference

## Project and configuration state

`siteos.config.json` is the tracked Pulse configuration. Version 2 contains:

- `project.slug`, `project.name`, optional `project.baseUrl`, and `project.monitoringEnabled`
- `testsDir` and optional `playwrightConfig`
- optional bundle include paths
- one or more Checks with a unique slug, name, include patterns, active state, and either scheduled or manual execution

The CLI reads version 1 and normalizes it to version 2, but new work should retain version 2. Never edit generated archives as configuration.

The private common selection in `~/.siteos/projects.json` is keyed by API origin and the repository's real path. It stores the selected Project and environment and resolves each service through explicit attachments. CLI 2 never reads old service-specific binding files. After upgrading, run `siteos project use <id-or-slug> --environment <slug>` once per repository; existing Auth and runtime credentials remain valid.

## Commands

- `pulse init` creates a safe starter configuration and Playwright Check files; it does not create another product's Project.
- `pulse validate --json` validates config, include paths, imports, and bundle inputs locally.
- `pulse sync --check --json` detects whether interactive discovery would change the tracked config without mutating it.
- `pulse sync --json` may update tracked Pulse configuration; review the diff and rerun validation.
- `pulse test` runs the selected Playwright tests locally and may accept Playwright options after `--`.
- `pulse deploy --dry-run --json` builds the same versioned JSON manifest and archive as deploy, writes only the requested/local artifact, and never uploads. With a common Project selected, it reads authenticated metadata to resolve the current environment URL and bound resource identity.
- `pulse deploy --json` requires Auth, the selected Organization, and a repository-specific common Project/environment selection, then uploads against the immutable bound Pulse Project ID.

Use `SITEOS_AUTH_BASE_URL` for an intentional local or staging override. Pulse APIs share the normal hosted SiteOS application origin `https://app.siteos.sh`.

## Failures

Preserve safe CLI error codes and hints. Pulse reserves exit codes `3`, `4`, and `5` for authorization, conflict, and unavailable-service failures. Do not bypass a failure with direct API calls or hand-edited private state.
