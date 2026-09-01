# Playwright authoring for Pulse

Use this reference when a Pulse task requires creating, extending, or repairing Playwright tests. It defines the boundary between general Playwright authoring and the tests that can run safely in the isolated Pulse runner.

## Start from the repository

Inspect the existing package manager, `@playwright/test` dependency, Playwright configurations, fixtures, helpers, and specs before changing files.

- Reuse an existing user journey when it already proves the requested behavior.
- Preserve the repository's locator, fixture, authentication, and test-data conventions.
- Prefer a dedicated Pulse spec only when an existing test depends on unsupported runtime behavior or has destructive side effects.
- Use `pulse init` for a missing Pulse configuration and starter, not as a replacement for an existing Playwright suite.
- Use `pulse sync --check --json` to preview which specs and supporting files Pulse would add or remove before accepting synchronization changes.

## Optional Microsoft companion

When the current agent environment exposes `$playwright-cli`, load it for interactive browser exploration, semantic locator generation, test creation, and failure diagnosis. The optional companion is the [Microsoft Playwright CLI skill](https://github.com/microsoft/playwright-cli/tree/main/skills/playwright-cli), licensed under [Apache-2.0](https://github.com/microsoft/playwright-cli/blob/main/LICENSE).

This SiteOS plugin links to that independently distributed skill; it does not bundle or require it. Do not install the skill or a global `@playwright/cli` package automatically.

When `$playwright-cli` is unavailable, continue with the repository's local Playwright executable. Detect it without downloading another package:

```sh
npx --no-install playwright --version
npx --no-install playwright cli --help
```

Run the help command only after the version check confirms a local executable. Use the equivalent local command for pnpm, Yarn, or Bun when the repository declares another package manager. If the project's Playwright version does not expose the `cli` subcommand, author and debug through its existing `playwright test` command and repository scripts. Missing optional tooling is not a Pulse blocker.

## Choose monitoring scenarios

A Pulse Check should prove a stable, user-observable outcome and remain safe when scheduled repeatedly.

- Prefer public availability, navigation, rendering, validation, and explicitly mocked submission behavior.
- Use semantic roles, labels, and test IDs before brittle CSS structure.
- Navigate with paths relative to `PLAYWRIGHT_BASE_URL` so the same Check can run locally and remotely.
- Do not perform real purchases, bookings, lead creation, account changes, uploads, deletions, or other irreversible third-party mutations unless the user explicitly requests the scenario and provides an isolated reversible test-data contract.
- Never hardcode credentials or print secrets. Use only environment variables intentionally approved for the selected Check.
- Keep each scenario independent. Do not rely on another test's order, browser state, or prior scheduled run.

Split broad coverage into focused Checks that fit the configured suite wall-time. Increasing an individual Playwright timeout does not extend the Pulse runner's wall-time limit.

## Preserve runner compatibility

Pulse bundles the selected specs and their local imports for an isolated Chromium run.

- Runtime package imports are limited to `@playwright/test`; Node built-ins and repository-local supporting files are allowed.
- Do not depend on a Playwright `webServer` entry. The remote runner targets the configured deployed base URL and does not start the repository application.
- Keep the Pulse configuration single-worker and deterministic unless the service contract explicitly changes.
- Treat environment variables reported by `pulse sync --check --json` as review items. Do not deploy until every required value has an intentional run-scoped source.
- If an existing test needs unsupported external packages, create a small Pulse-specific adapter or dedicated Check instead of expanding the runner dependency boundary.

## Author and repair

For a new scenario:

1. State the user journey and observable assertions before editing the spec.
2. Start from the repository's existing fixture or the Pulse starter.
3. Explore the real page through the test context when browser tooling is available.
4. Add the smallest deterministic actions and assertions that prove the behavior.
5. Run the single spec through `npx @siteoshq/cli pulse test -- <relative-spec>` before the full configured Check set.

For a failure, first decide whether the application regressed, the intended behavior changed, or only the test implementation drifted. Repair locators or timing only when the user-visible contract is unchanged. Do not hide failures with sleeps, retries, broad exception handling, `test.skip`, or `test.fixme` without an explicit documented reason.

Finish every authoring or repair pass with:

```sh
npx @siteoshq/cli pulse validate --json
npx @siteoshq/cli pulse sync --check --json
npx @siteoshq/cli pulse test
npx @siteoshq/cli pulse deploy --dry-run --json
```

These commands prove local configuration, synchronization intent, Playwright execution, and bundle construction respectively. They do not prove remote deployment or scheduled execution.
