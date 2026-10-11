# Page checks and Playwright setup

Use the repository-scoped common Project and explicit environment. Read CLI help first when the installed version might predate these commands. MCP Check diagnostics include setup kind/revision/definition, candidate and refresh state; reads do not publish or run anything.

## New project

```sh
siteos project use <project> --environment <environment>
siteos project connect pulse
siteos pulse native save --name "Homepage" --slug home --kind http --path / --cadence 300
siteos pulse checks list --json
```

Use `--kind page` for a browser check that requires visible text content. Without `--cadence`, the CLI creates a manual Check. It does not prove a form or purchase works. Addresses come from the selected Project environment; paths stay on that website. Private addresses, unsupported ports and credential-bearing URLs are rejected.

For journeys, retain the project's ordinary `@playwright/test` configuration:

```sh
siteos pulse playwright attach --name "Customer journeys" --slug journeys \
  --config playwright.config.ts --files 'tests/**/*.spec.ts' --project chromium --tag @smoke
siteos pulse playwright list --json
siteos pulse playwright publish --check <returned-id> --dry-run
siteos pulse playwright publish --check <returned-id>
```

`--files`, `--project`, `--tag` and `--assets` repeat. Empty project selection follows the config; tags match any selected tag. Imported local helpers are included automatically. Use `--assets` for files read by fixtures or config paths loaded dynamically. The runner currently supports Chromium, Playwright and Node built-ins; external packages, local app servers and empty discovery fail explicitly without replacing active tests. Do not install customer dependencies inside the SiteOS web process. Conditional local servers should be absent when `PLAYWRIGHT_BASE_URL` is set; local execution can retain them.

Use `--variables 'TEST_LOGIN,SESSION_TOKEN'` to declare required names; an empty `--variables ''` clears the list. Store values through Pulse Variables and Secrets, never in source or chat. Changes to these names require a new verified snapshot.

Choose schedules in Pulse after verification. The current runner does not require installing `@siteoshq/pulse`; that SDK is for Errors.

## Existing project

```sh
siteos pulse playwright list --json
siteos pulse playwright migrate --check <existing-id> --revision <shown-revision> --dry-run
siteos pulse playwright migrate --check <existing-id> --revision <shown-revision>
siteos pulse playwright publish --check <existing-id>
```

Verify the candidate's Run and active deployment via MCP. Migration keeps the current working snapshot, history and scheduling. A stale revision requires re-reading and reconciling the draft. Remove legacy config only after readback confirms the verified version and no other browser/code Checks need that file. Never convert a custom journey into a generic page probe without an explicit decision.

## Automatic refresh

```sh
siteos pulse playwright attach --check <id> --revision <shown-revision> \
  --refresh-environment Production
```

This opts into the existing Project repository binding's branch and directory; it does not connect a repository implicitly. The GitHub worker checks at most once every five minutes per Check. It requires the latest successful, non-transient deployment in that exact GitHub environment, its SHA equal to the trusted branch head and its environment URL equal to the selected website. Deployment refs may name that branch or its exact commit SHA. For monorepos, select the app-specific deployment environment (for example `Production (siteos-website)`) so another app cannot mask its release. A provider exposing only an unrelated preview URL is not sufficient evidence: keep explicit publication until a matching deployment adapter exists.

Source is prepared without executing repository code. The runner verifies the candidate, then the worker rechecks deployment and binding authority before activation. Missing deployment, revoked access, unsupported source or failed tests retain the previous version and expose a saved refresh/candidate state. `--no-refresh` disables future source refresh. Explicit publication remains available for deliberate local/test-only updates; remote verification still gates activation.

A finished failed candidate can be retried deliberately with `publish --check <id> --retry`. Repeating a normal upload reuses its verification request. Schedules, PR policy and Errors collection are independent.
