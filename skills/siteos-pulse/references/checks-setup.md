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

First read `siteos project repository show --json` and confirm the repository, branch, directory
and environment URL. In **Repository & deployments**, find GitHub deployments and review the
suggested environment before saving. CLI discovery uses `project repository deployments` with
installation/repository IDs from the shared GitHub catalog. A reviewed binding can set
`deploymentEnvironment`; omit it to preserve the previous value, or use an empty string to clear
the filter. Preserve the binding's current `revision`. Do not invent IDs or silently broaden access.

`--auto-refresh` polls each enabled Check at most once every five minutes. GitHub must report a
successful deployment whose URL matches the website exactly and whose source commit belongs to
the trusted branch. The optional per-Check `--refresh-environment <name>` overrides the binding's
filter. A rollback to a deployed ancestor is supported; a newer unshipped branch head is not proof.

Hosting providers that already report this evidence need no build changes. Otherwise configure the
[generic successful-publication notification](../../siteos-integrations/SKILL.md#deployment-evidence)
once in the customer's build system. It uses that build's own repository-scoped GitHub authority;
there is no separate hosting connection, SiteOS build service or GitHub artifact dependency.

For a new Check, attach Playwright tests with `--auto-refresh`. For an existing Check, use its current
ID and revision above. Keep the current snapshot, history, schedule and PR policy. Missing evidence
is an actionable waiting state; do not substitute the latest commit or fake a deployment.

Source is prepared without executing repository code. The runner verifies the candidate, then the worker rechecks deployment and binding authority before activation. Missing deployment, revoked access, unsupported source or failed tests retain the previous version and expose a saved refresh/candidate state. `--no-refresh` disables future source refresh. Explicit publication remains available for deliberate local/test-only updates; remote verification still gates activation. Disable automatic refresh first if those tests must remain independent of the deployed commit; otherwise reconciliation restores the deployed source.

`pulse playwright publish --check <id> --dry-run` prepares a local snapshot without writing; omit `--dry-run` only for authorized explicit publication. A finished failed candidate can be retried deliberately with `publish --check <id> --retry`. Repeating a normal upload reuses its verification request. Schedules, PR policy and Errors collection are independent.
