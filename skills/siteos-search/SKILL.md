---
name: siteos-search
description: Use when creating, selecting, configuring, verifying, repairing, or operating a product-owned SiteOS Search Project, including Environments, source discovery, scoped credentials, sync, query, and UI delivery through @siteoshq/cli.
---

# SiteOS Search

Use this skill from the root of a target external project, or pass an explicit target project root when the user names one.

This skill is the search implementation entrypoint only. It routes work across SiteOS connection, readiness, source discovery, scaffold/source handlers, sync/runtime repair, runtime-token tooling, and supported search UI delivery. Do not use this skill for analytics dashboards, search usage reporting, sidecar HTML reports, charts, or aggregate diagnostics reporting; use the sibling `siteos-analytics` skill for those tasks.

Run `npx @siteoshq/cli auth status --json` before remote Search operations and delegate missing authentication or Organization selection to `$siteos-auth`. Search Project discovery, creation, and selection remain in this skill through `siteos search project ...`. Never call Auth, Project, or credential-management endpoints directly, inspect CLI private state, or use legacy Organization tokens or Project API keys.

Do not inspect secret-bearing environment files or process environment values with output-producing commands. Determine credential readiness through safe CLI metadata and run the intended Search commands without exposing plaintext. The tracked `.siteos/search/project.json` contains only version, service, and safe Project name/slug; the immutable ID lives in the repository-specific private binding. Runtime query and indexing credentials belong only in the ignored owner-only project `.env` installed by the CLI.

Use [references/siteos-connection-onboarding.md](references/siteos-connection-onboarding.md) for CLI-owned SiteOS repository connection, [references/source-discovery.md](references/source-discovery.md) for candidate discovery and the combined source/UI placement checkpoint, [references/source-confirmation-and-handlers.md](references/source-confirmation-and-handlers.md) for confirmed config and handler work, [references/scaffold-contract.md](references/scaffold-contract.md) for the committed scaffold and sync runner, [references/ui-runtime-delivery.md](references/ui-runtime-delivery.md) for canonical `SearchBar` + `SearchDialog` UI/runtime delivery, and [references/onboarding-report-template.md](references/onboarding-report-template.md) for user-facing onboarding reports.

On onboarding runs only, use `scripts/session-state-cli.mjs` to create and maintain `.siteos/temp/search/session-<started-at>.json`. The JSON session file is the canonical source for `siteosConnection`, steps, user decisions, blockers, findings, artifacts, per-step timing metadata, checkpoint progression, cleanup confirmation, and the saved UI placement decision. Step timing is observability metadata only; it must not drive progression, checkpoint decisions, source confirmation, UI placement, or sync/runtime behavior. Do not create onboarding session files for analytics, reporting, or other non-onboarding requests.

## Session State CLI Contract

Use `scripts/session-state-cli.mjs` as the only supported session-state interface. Do not read or import `scripts/session-state.mjs` during normal skill execution. If syntax is unclear, run `node .agents/skills/siteos-search/scripts/session-state-cli.mjs help`; do not inspect the implementation file.

Create the onboarding session immediately after the Search Project preflight determines onboarding mode or a real blocker:

```bash
node .agents/skills/siteos-search/scripts/session-state-cli.mjs init-onboarding \
  --project-root "$PWD" \
  --linkage-status missing \
  --output json
```

The command prints JSON containing `sessionFilePath`; use that exact path for later commands. If the path is not available in the current turn, resolve it without file searching:

```bash
node .agents/skills/siteos-search/scripts/session-state-cli.mjs latest \
  --project-root "$PWD" \
  --output path
```

For every onboarding step, mark start and completion with the known step id:

```bash
node .agents/skills/siteos-search/scripts/session-state-cli.mjs start-step \
  --session-file "$SESSION_FILE" \
  --step siteos-connection

node .agents/skills/siteos-search/scripts/session-state-cli.mjs complete-step \
  --session-file "$SESSION_FILE" \
  --step siteos-connection
```

Known step ids, in order:

1. `siteos-connection`
2. `readiness-and-mode-detection`
3. `candidate-source-discovery`
4. `source-confirmation`
5. `scaffold-creation`
6. `extraction-implementation`
7. `dry-run-preview`
8. `first-live-sync`
9. `query-verification`
10. `ui-delivery`
11. `ui-placement-confirmation`
12. `ui-integration`
13. `final-verification`
14. `cleanup-confirmation`

Use these exact commands for session mutations:

```bash
# Record safe SiteOS connection state.
node .agents/skills/siteos-search/scripts/session-state-cli.mjs set-siteos-connection \
  --session-file "$SESSION_FILE" \
  --linkage-status ready \
  --api-base-url-source config \
  --project-id "<project-id>" \
  --project-name "<project-name>" \
  --project-slug "<project-slug>" \
  --environment-slug "<environment-slug>" \
  --config-path ".siteos/search/project.json"

# Record a blocker and stop.
node .agents/skills/siteos-search/scripts/session-state-cli.mjs record-blocker \
  --session-file "$SESSION_FILE" \
  --code search_project_selection_required \
  --message "Select the intended Search Project through the Search CLI workflow."

# Clear blockers after the unblock action succeeds.
node .agents/skills/siteos-search/scripts/session-state-cli.mjs clear-blockers \
  --session-file "$SESSION_FILE"

# Record source and UI placement decisions after explicit user confirmation.
node .agents/skills/siteos-search/scripts/session-state-cli.mjs set-user-decisions \
  --session-file "$SESSION_FILE" \
  --confirmed-source "<source-id>" \
  --placement dedicated-page-first

# Evaluate checkpoint progression after each technical slice.
node .agents/skills/siteos-search/scripts/session-state-cli.mjs evaluate \
  --session-file "$SESSION_FILE"
```

Use these artifact commands instead of hand-registering artifact files:

```bash
node .agents/skills/siteos-search/scripts/session-state-cli.mjs write-source-candidates \
  --session-file "$SESSION_FILE" \
  --candidates-json '[{"id":"faq","label":"FAQ","count":9}]'

node .agents/skills/siteos-search/scripts/session-state-cli.mjs write-ui-placement-plan \
  --session-file "$SESSION_FILE" \
  --step source-confirmation \
  --content-json '{"dedicatedPageRoute":{"recommendedPath":"/search","availability":"available"}}'

node .agents/skills/siteos-search/scripts/session-state-cli.mjs write-extraction-path \
  --session-file "$SESSION_FILE" \
  --step extraction-implementation \
  --content-json '{"sources":{}}'

node .agents/skills/siteos-search/scripts/session-state-cli.mjs write-host-baseline \
  --session-file "$SESSION_FILE" \
  --step ui-delivery \
  --content-json '{"hostFramework":"detected-host-framework"}'

node .agents/skills/siteos-search/scripts/session-state-cli.mjs write-delivery-decision \
  --session-file "$SESSION_FILE" \
  --step ui-delivery \
  --content-json '{"artifactClasses":{}}'
```

Before cleanup, always produce the cleanup plan first; delete only after explicit user confirmation:

```bash
node .agents/skills/siteos-search/scripts/session-state-cli.mjs cleanup-plan \
  --session-file "$SESSION_FILE"
```

When an onboarding step needs to discover which session artifacts already exist, list artifact metadata only:

```bash
node .agents/skills/siteos-search/scripts/session-state-cli.mjs list-artifacts \
  --session-file "$SESSION_FILE"
```

This command returns suffixes, descriptions, filenames, and full file paths. It does not read artifact content; read an artifact file directly from disk only when that content is needed for the current step.

Unified CLI commands are the only Search credential-management boundary. Inspect safe metadata with `npx @siteoshq/cli search credential list --environment <slug> --json` or `npx @siteoshq/cli search indexing-credential list --environment <slug> --json`. Use the matching `issue --install` command when no suitable active credential exists, and use `rotate --install` only as an intentional replacement. The internal `scripts/runtime-token-tooling.mjs` helper supports only `validate` and `query`; it reads the CLI-installed `SITEOS_SEARCH_TOKEN` and `SITEOS_SEARCH_ENV`, never issues or rotates credentials, and never writes project files. Never create or use browser-public environment variables for the SiteOS search token, environment slug, or Search origin; this includes `NEXT_PUBLIC_SITEOS_SEARCH_TOKEN`, `NEXT_PUBLIC_SITEOS_SEARCH_ENV`, and `NEXT_PUBLIC_SITEOS_SEARCH_PUBLIC_URL` in Next.js projects.

```bash
npx @siteoshq/cli search credential issue --environment <slug> --install [--name <name>] --json
npx @siteoshq/cli search credential rotate --environment <slug> --install [--name <name>] --json
npx @siteoshq/cli search indexing-credential issue --environment <slug> --install [--name <name>] --json
npx @siteoshq/cli search indexing-credential rotate --environment <slug> --install [--name <name>] --json
```

## First Pass

1. Resolve the target project root.
2. Run `npx @siteoshq/cli auth status --json`; delegate missing Auth or Organization selection to `$siteos-auth`.
3. Run `npx @siteoshq/cli search project status --json`. When missing, list Projects with `npx @siteoshq/cli search project list --json`; require an explicit existing slug or new slug/name, then use `search project create` and/or `search project use` as needed.
4. After SiteOS connection is usable, inspect only the local files needed for mode selection, verify SiteOS API v1 search readiness, classify the workflow mode, and report findings with secrets redacted.

## Linkage Check

The first remote preflight is `npx @siteoshq/cli auth status --json`, followed by `npx @siteoshq/cli search project status --json`. Do not inspect `.siteos/search/project.json`, package metadata, routes, or project shape before this preflight completes, except for resolving the target project root.

A usable Search workspace requires a product-owned Project selection, the secret-free `.siteos/search/project.json`, its private immutable-ID binding, and an explicit environment slug. Creating or selecting it must never create, select, link, or mutate Pulse or Forms Projects.

Resolve the independent Search origin in this order:

1. `SITEOS_SEARCH_PUBLIC_URL`, when intentionally set for local, staging, or production.
2. The CLI development default `http://localhost:3080` only for an intentional local run.

Never use legacy Project `apiBaseUrl`, Server Legacy, or another product origin as a Search fallback.

If Auth or Organization selection is unavailable, delegate it to `$siteos-auth`. If the Search Project is unavailable, load [references/siteos-connection-onboarding.md](references/siteos-connection-onboarding.md) and complete the Search-owned list/create/use workflow. Do not fabricate IDs, copy a Project key, use `--replace` without approval, or silently select another Project.

Never echo authorization codes, CLI sessions, service grants, scoped credentials, Project keys, Meilisearch keys, raw headers, or full config JSON. It is safe to report safe IDs, status, metadata, and which API base URL source was selected.

## API Readiness

Use the SiteOS CLI diagnostics command. Do not read `.siteos/search/project.json` manually for API credentials, do not run `curl`, and do not write inline Node HTTP clients for readiness checks:

```bash
npx @siteoshq/cli search diagnostics \
  --environment prod \
  --json
```

If the CLI reports an API or contract failure, classify readiness as `api-blocked` and stop with the CLI error code/message. Do not inspect SiteOS app source code, do not use SiteOS UI, and do not use SiteOS MCP as a substitute for API readiness.

Use the CLI JSON response to classify:

- `ready`: diagnostics status says the selected environment is ready or all blocking checks pass.
- `not-ready`: SiteOS is reachable, but environment search health, accepted payload, sync success, or query target checks are not ready.
- `api-blocked`: SiteOS API cannot be reached, authorization is rejected, the response is malformed, or the endpoint fails in a way that prevents a truthful readiness verdict. A `404` for the explicitly selected environment means it is unavailable or inaccessible to the current authorization; do not infer absence, select a fallback environment, or probe other environment slugs.

Before the first live sync in onboarding mode, record the selected environment explicitly (normally `prod`), rerun diagnostics with `--environment <slug>`, and use the unified CLI to list then issue/install or intentionally rotate/install the environment's indexing credential. The first successful `pnpm search:sync` is the only Search setup path; do not activate or manage a runtime.

Search Environment lifecycle belongs to this skill after Search Project selection succeeds. Use only unified CLI commands:

```bash
npx @siteoshq/cli search environment list --json
npx @siteoshq/cli search environment create --slug <slug> --name <name> --json
npx @siteoshq/cli search environment update --environment <slug> --name <name> --json
npx @siteoshq/cli search environment fork --source <slug> --slug <slug> --name <name> --json
npx @siteoshq/cli search environment delete --environment <slug> --json
```

For first onboarding, list Environments and ask for an explicit slug and display name before creating one when none is suitable. For later dev, staging, or feature work, prefer `fork` when the user wants the latest successful immutable snapshot from an existing Environment; use `create` for an empty isolated Environment. Never infer `prod`, rename a slug, copy credentials, or delete without explicit confirmation. A fork copies no credentials, browser authorization, leases, or history and must complete its queued indexer job before query readiness.

## Project Shape Inspection

Inspect only enough local files to choose the next workflow and prepare later phases:

- `package.json`: package manager hints, framework dependencies, and scripts relevant to later verification.
- TypeScript presence: `tsconfig.json`, `.ts`, `.tsx`, and package dependencies.
- Host framework evidence: framework dependencies, config files, route conventions, and project-owned build scripts. Record the discovered framework or `unknown`; do not reject a project because it is not Next.js.
- Next.js App Router presence: `src/app` or `app`, only when Next.js is detected.
- Next.js Pages Router presence: `src/pages` or `pages`, only when Next.js is detected.
- Existing search surfaces: obvious search trigger/dialog components, `src/lib/**search**`, project-owned suggestion datasets, and any existing SiteOS search runtime files.
- SiteOS search config: root `siteos-search.config.ts`.

Do not execute arbitrary project code during this foundation step. Read files and inspect paths only.

## Mode Selection

Choose exactly one mode:

- `onboarding`: canonical Auth and the stable Project binding are usable, SiteOS API readiness is not `api-blocked`, and root `siteos-search.config.ts` does not exist.
- `existing-search`: `.siteos/search/project.json` is usable, root `siteos-search.config.ts` exists and is readable, and SiteOS API readiness is not `api-blocked`.
- `repair-blocked`: canonical Auth or stable Project binding is unavailable, the API cannot produce a truthful readiness verdict after connection, or an existing `siteos-search.config.ts` is unreadable.

`not-ready` diagnostics do not automatically block onboarding or existing-search mode. Report the failing readiness codes and make readiness repair the first checkpoint inside the selected mode unless the API failure itself prevents safe continuation. Before the first live sync, the expected no-successful-sync readiness state is not a reason to activate or create a separate runtime.

## Required Report Shape

For first-pass mode selection, report in a concise, deterministic shape:

```text
SiteOS search mode: onboarding | existing-search | repair-blocked
Project root: <path>
SiteOS linkage: present | missing | malformed
API base URL source: env | config | default
API readiness: ready | not-ready | api-blocked
Search config: present | missing | unreadable
Host framework: <detected framework or unknown>
Router conventions: <short discovered summary or unknown>
Existing search surfaces: <short list or none found>
Next checkpoint: <one concrete checkpoint>
```

Include relevant machine-readable diagnostic codes when the API returns them, but keep prose short. Redact all secrets.

After successful search delivery, state the safe Search Project name/slug and environment slug. Make clear that opening SiteOS UI is not required. Present a safe destination only when an existing command returns one. If the user asks for a signed-in browser and no safe destination is available, explain that Search authenticates through central Auth OIDC. Do not invent or run a handoff command, and never extract, print, or reconstruct a handoff URL.

For onboarding decision checkpoints and blockers after mode selection, use [references/onboarding-report-template.md](references/onboarding-report-template.md). The report title must be exactly `SiteOS Search Onboarding Flow`. Do not include a generic status table, completed-step recap, or remaining-step plan.

## Workflow Routing

For `onboarding`, initialize or update the session only through `scripts/session-state-cli.mjs`, then route each step through the linked references. Continue automatically through technical steps until `session-state-cli.mjs evaluate` reports a user-decision checkpoint or a real blocker. The only routine user-decision checkpoint is the combined source/result-reference and search UI placement confirmation before scaffold/source-handler work starts.

For `existing-search`, treat `siteos-search.config.ts`, `scripts/siteos-search/**`, and the `search:sync` package script as reviewable search implementation state. Route source changes through [references/source-discovery.md](references/source-discovery.md) and [references/source-confirmation-and-handlers.md](references/source-confirmation-and-handlers.md), runtime-token repair through `scripts/runtime-token-tooling.mjs`, sync/scaffold repair through [references/scaffold-contract.md](references/scaffold-contract.md), and UI/runtime repair through [references/ui-runtime-delivery.md](references/ui-runtime-delivery.md).

For `repair-blocked`, stop with one repair action:

- delegate Auth or Organization repair to `$siteos-auth`
- repair Search Project selection with the Search-owned CLI workflow
- set or remove `SITEOS_SEARCH_PUBLIC_URL`
- restore or make `siteos-search.config.ts` readable
- retry diagnostics after SiteOS API reachability is restored

## Hard Stops

Stop before:

- confirming sources on behalf of the user
- authoring source entries in `siteos-search.config.ts` without explicit user confirmation
- adding source handlers without explicit user confirmation
- extracting unconfirmed sources, ambiguous sources, or data that requires unresolved credentials, permissions, or result-reference decisions
- executing live `pnpm search:sync` against SiteOS before source extraction, an explicit environment selection, and diagnostics readiness are complete
- pushing or syncing data to SiteOS
- exposing project API keys, bearer tokens, or raw linkage data to browser/client files
- overwriting existing UI/runtime files without explicit approval
- running browser UI verification before the UI/runtime delivery and wiring checkpoint
- answering analytics/reporting prompts from this search implementation skill instead of routing to `siteos-analytics`
- installing SiteOS MCP
- changing SiteOS API, DB schema, CLI behavior, or exported-project behavior
- installing global browser automation packages for verification
