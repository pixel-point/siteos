# SiteOS Search Scaffold Contract

Use this reference only after onboarding mode has completed the source and result-reference confirmation checkpoint.

The scaffold is committed project-local state. It must be readable without skill memory and safe to review in a pull request.

## Target Files

Create these files in the target project root:

- `siteos-search.config.ts`
- `scripts/siteos-search/sync.mjs`
- `scripts/siteos-search/sources/README.md`

Update the target project's `package.json` scripts with:

```json
{
  "scripts": {
    "search:sync": "node scripts/siteos-search/sync.mjs"
  }
}
```

Add the scaffolded `devDependencies.typescript: "^5.7.3"` entry as well. The committed TypeScript config is loaded by the generated sync runner through the TypeScript 5.x compiler API; do not replace that dependency with an incompatible compiler major. Do not add other package scripts in the first scaffold slice.

## Template Sources

Copy from these skill assets:

- `assets/scaffold/siteos-search.config.ts`
- `assets/scaffold/scripts/siteos-search/sync.mjs`
- `assets/scaffold/scripts/siteos-search/sources/README.md`
- `assets/scaffold/package-json.snippet.json`

Keep paths unchanged unless the user explicitly asks for a different project layout and the change is recorded in `siteos-search.config.ts`.

## Config Shape

The root config must export a plain object with:

- `schemaVersion: 1`
- `project.apiBaseUrlEnv: "SITEOS_API_BASE_URL"`
- `environment.slug: "prod"` as an explicit selected example
- `sync.mode: "full-replace"`
- `sync.entrypoint: "scripts/siteos-search/sync.mjs"`
- `sources[]` entries with:
  - `id`
  - `label`
  - `enabled`
  - `handler`
  - `result.type`
  - `result.description`
  - `compatibility.notes`

Every source `handler` must point under `scripts/siteos-search/sources/`.

Use `result.type` values:

- `url` when results can link to real project URLs
- `synthetic-route` when a generated or existing landing route will render results
- `inline` when the caller must render abstract result content

The initial scaffold may contain disabled placeholder source entries only when the user confirmed those source names and the handler files are still intentionally future work.

## Sync Runner Contract

The committed `scripts/siteos-search/sync.mjs` template is a deterministic sync runner. `pnpm search:sync` updates the SiteOS search index by default, and `pnpm search:sync --dry-run` is the only supported debug preview mode.

It must:

- read `.siteos/project.json`, the project `.env`, and `siteos-search.config.ts`
- resolve the API base URL from `SITEOS_API_BASE_URL`, then `.siteos/project.json.apiBaseUrl`, then the production default
- resolve the project API key from `SITEOS_PROJECT_API_KEY`, then the project `.env`
- load only enabled source entries
- load handlers only from `scripts/siteos-search/sources/`
- require handlers to return documents with `id`, `title`, `url`, and `searchableText`
- build `mode: "full-replace"` payloads with source-level identity and document-level `sourceName`
- support `--dry-run` as an explicit debug mode that validates and prints a redacted summary without sending a request
- run live sync by default when `--dry-run` is absent
- call explicit-environment diagnostics before submission and block unsafe readiness states
- submit the document payload to the selected environment only after source extraction and diagnostics preflight
- poll explicit-environment diagnostics for first-sync readiness; do not use a job-status route
- classify common outcomes with stable codes such as `api-unreachable`, `auth-rejected`, `selected-environment-unavailable`, `diagnostics-blocked`, `sync-submit-failed`, and `sync-succeeded`; an explicit-environment `404` must not claim that the environment is absent or trigger a fallback
- never print API keys, bearer tokens, runtime query credentials, or raw `.siteos/project.json`

Do not run live `pnpm search:sync` until source extraction is implemented for the enabled handlers, an environment is explicitly selected, and diagnostics have been rerun for that environment. Use `pnpm search:sync --dry-run` only for explicit payload preview/debugging.

Before the first live push, rerun `npx @s-os/cli search diagnostics --environment <slug> --json`. The first successful live sync establishes the environment's initial Search state; do not activate a runtime, register an export, or poll a job-status route. When UI delivery needs a query credential, use the internal `scripts/runtime-token-tooling.mjs` helper with the selected environment and store the result only as server-side `SITEOS_SEARCH_TOKEN`. Do not create browser-public search credential, environment-slug, or SiteOS API-base variables in any framework; `NEXT_PUBLIC_*` is prohibited for these values in Next.js projects.

## Onboarding Continuation Point

After creating the base scaffold, use `references/source-confirmation-and-handlers.md` to author only user-confirmed source entries and guarded handler files. Then evaluate onboarding progress through `scripts/session-state-cli.mjs`, which is the supported session interface.

Use the exact step commands for scaffold creation:

```bash
node .agents/skills/search/scripts/session-state-cli.mjs start-step \
  --session-file "$SESSION_FILE" \
  --step scaffold-creation

node .agents/skills/search/scripts/session-state-cli.mjs complete-step \
  --session-file "$SESSION_FILE" \
  --step scaffold-creation

node .agents/skills/search/scripts/session-state-cli.mjs evaluate \
  --session-file "$SESSION_FILE"
```

Keep these facts in session artifacts and use them only when a decision or blocker requires them:

- files created
- package script added
- confirmed source ids represented in `siteos-search.config.ts`
- handler files created for confirmed sources
- that `pnpm search:sync` updates the selected environment after source extraction and diagnostics readiness are complete
- that `pnpm search:sync --dry-run` is available for explicit local document preview/debugging
- the next technical step: source extraction and explicit local document preview, then diagnostics and the first live sync for the selected environment

Do not stop only because scaffold creation completed. Continue into source extraction and explicit local dry-run preview when the confirmed source and data path are clear. Then continue through diagnostics rerun and the first live `pnpm search:sync` for the selected environment when no real blocker exists.

Do not run live `pnpm search:sync` as a SiteOS push in this slice.
