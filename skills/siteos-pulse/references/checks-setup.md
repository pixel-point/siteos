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

For journeys, first select a deployment source as described below, then retain the project's ordinary `@playwright/test` configuration:

```sh
siteos pulse playwright attach --name "Customer journeys" --slug journeys \
  --config playwright.config.ts --files 'tests/**/*.spec.ts' --project chromium --tag @smoke --auto-refresh
siteos pulse playwright list --json
```

`--files`, `--project`, `--tag` and `--assets` repeat. Empty project selection follows the config; tags match any selected tag. Imported local helpers are included automatically. Use `--assets` for files read by fixtures or config paths loaded dynamically. The runner currently supports Chromium, Playwright and Node built-ins; external packages, local app servers and empty discovery fail explicitly without replacing active tests. Do not install customer dependencies inside the SiteOS web process. Conditional local servers should be absent when `PLAYWRIGHT_BASE_URL` is set; local execution can retain them.

Use `--variables 'TEST_LOGIN,SESSION_TOKEN'` to declare required names; an empty `--variables ''` clears the list. Store values through Pulse Variables and Secrets, never in source or chat. Changes to these names require a new verified snapshot.

Choose schedules in Pulse after verification. The current runner does not require installing `@siteoshq/pulse`; that SDK is for Errors.

## Existing project

```sh
siteos pulse playwright list --json
siteos pulse playwright migrate --check <existing-id> --revision <shown-revision> --dry-run
siteos pulse playwright migrate --check <existing-id> --revision <shown-revision> --auto-refresh
```

With a deployment source selected, Pulse prepares the first candidate automatically. Verify the candidate's Run and active deployment via MCP. Migration keeps the current working snapshot, history and scheduling. A stale revision requires re-reading and reconciling the draft. Remove legacy config only after readback confirms the verified version and no other browser/code Checks need that file. Never convert a custom journey into a generic page probe without an explicit decision.

## Automatic refresh

```sh
siteos pulse playwright attach --check <id> --revision <shown-revision> \
  --auto-refresh
```

First read `siteos project repository show --json` and confirm its repository, branch, directory and environment URL. For an ordinary Vercel project, connect Vercel in Services using [the Integrations workflow](../../siteos-integrations/SKILL.md#vercel-deployments). In Project environment settings choose the matching Vercel project as **Deployment source**. For CLI setup, read safe project IDs from `integrations vercel status`, then save the existing repository binding with `deploymentSource: { "provider": "vercel", "connectionId": "<returned-id>", "projectId": "<returned-prj-id>" }` and its current `revision`. Explicit `null` selects GitHub deployment events; an omitted field preserves the previous choice. Do not invent IDs or change the customer build.

`--auto-refresh` enables updates from that source. The trusted worker polls each enabled Check at most once every five minutes. Vercel must prove which ready deployment currently serves the selected domain and identify its repository and commit. GitHub deployment events work without a hosting connection when their successful environment URL matches the website exactly. Existing `--refresh-environment <name>` remains an optional filter for GitHub events. An immutable preview URL alone is insufficient proof for a production domain.

The deployed commit must be on the selected trusted branch, but need not equal its current head. This supports ordinary deployments and rollbacks while newer commits await release. A custom builder that rewrites source identity needs verifiable equivalence; arbitrary `sourceSha` metadata is not enough. If evidence is unavailable, report the saved refresh state and use deliberate publication; do not guess the latest commit.

For rewritten Git identity, Pulse independently requires a successful GitHub commit status whose target is the exact immutable Vercel deployment URL. The GitHub App installation needs **Commit statuses: read** for this proof. Have the organization owner accept that permission update when required; never fabricate a success status to make refresh pass.

For a new project, attach Playwright tests with `--auto-refresh` after selecting the deployment source. For an existing project, use the current Check ID and revision above. Both flows preserve the customer's hosting pipeline; no GitHub Actions artifact or SiteOS build script is installed.

Source is prepared without executing repository code. The runner verifies the candidate, then the worker rechecks deployment and binding authority before activation. Missing deployment, revoked access, unsupported source or failed tests retain the previous version and expose a saved refresh/candidate state. `--no-refresh` disables future source refresh. Explicit publication remains available for deliberate local/test-only updates; remote verification still gates activation. Disable automatic refresh first if those tests must remain independent of the deployed commit; otherwise reconciliation restores the deployed source.

`pulse playwright publish --check <id> --dry-run` prepares a local snapshot without writing; omit `--dry-run` only for authorized explicit publication. A finished failed candidate can be retried deliberately with `publish --check <id> --retry`. Repeating a normal upload reuses its verification request. Schedules, PR policy and Errors collection are independent.
