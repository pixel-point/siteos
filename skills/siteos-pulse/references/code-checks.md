# PR code Checks

Requires CLI 2.29.0 or newer and a matching server with a configured code executor.

Use this for Vitest/unit tests, lint, formatting or typechecking on SiteOS infrastructure. It
requires a CLI/server that support config version 4 and an operator-enabled code executor. Check
`pulse validate` and CLI help; do not interpret an older release's rejection as a project defect.
No additional client installation or GitHub Actions workflow is needed.

1. Reuse the repository's `package.json` scripts. Add only critical Checks requested by the user.
   Browser Checks test a deployed URL; code Checks execute the exact same-repository PR head and
   require no preview. Code cannot replace database/browser/deployment acceptance.
2. Preserve existing config fields and browser Checks. Set `version: 4`, and add, for example:

   ```json
   {
     "type": "code",
     "slug": "unit",
     "name": "Critical unit tests",
     "command": ["pnpm", "test:unit"],
     "workingDirectory": ".",
     "timeoutSeconds": 300,
     "schedule": { "mode": "manual" },
     "pullRequests": { "enabled": true }
   }
   ```

   `command` is an argument array, not a shell string. Use `node`, `npm` or `pnpm`. The directory
   is relative to the configured repository binding directory; locally it is relative to the
   config. Code needs no `include`, Playwright config or browser installation. Keep scheduled
   monitoring untouched. Code Checks cannot use a schedule, project variables or Secrets.
3. The Git repository root must contain an exact `packageManager` (`pnpm@9.x.y`, `pnpm@10.x.y`
   or `npm@10.x.y`) and its committed lockfile. Installation is frozen, lifecycle hooks are off,
   `.npmrc`/`.pnpmfile.cjs` are excluded and only public npm packages are reachable. Commands run
   on Node.js 22 without network. Private registries, database services and custom images are
   unsupported; do not silently replace those tests with a claimed pass.
4. Use existing commands: `pulse validate --json`, `pulse sync --check --json`,
   `pulse test --check unit`, `pulse deploy --dry-run --json`. The selected local Check uses
   the developer's installed dependencies; it is not a sandbox simulation. Unfiltered `pulse test`
   runs all active Checks. `sync` preserves code definitions while discovering browser tests.
5. Publish within authorization using `pulse deploy --json`. Bind the selected GitHub repository
   and enable PR policy using the [PR setup reference](github-pull-requests.md). For code-only
   usage, omit both preview fields in the binding; browser usage requires both. Publication stores
   commands, not a source checkout; a PR cannot replace the trusted published command configuration.
6. Update/open a same-repository PR. Code starts for that exact head; browser Checks independently
   wait for their preview. Read `executionKind`, attempt `kind`, head SHA and result via existing
   MCP/CLI Check/PR/run readers. Missing code executor/source is unavailable, never success.
   Installation and command steps expose bounded private logs and exit failures; step counts are
   not Vitest test counts. No `pulse run` for code: this release admits it only with a PR source.

An App comment combines both kinds. Separate GitHub Checks keep a successful unit run from hiding
an unfinished browser run. Neither kind updates scheduled monitoring health. Never enable branch
protection until the observed Check has completed a real per-head round trip.
