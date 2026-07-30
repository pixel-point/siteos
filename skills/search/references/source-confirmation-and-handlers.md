# SiteOS Search Source Confirmation And Handlers

Use this reference only after source discovery has produced candidate proposals and the user has explicitly confirmed both which sources/result references to add or repair and where the search UI should be placed.

Do not confirm sources for the user. Do not author config entries or handler files for discovered-but-unconfirmed candidates. Do not perform live SiteOS sync or first-push API calls in this step.

## Combined Checkpoint Requirement

Before scaffold/config/handler authoring starts, the onboarding session must persist both decision groups:

1. `userDecisions.confirmedSources`: the confirmed source ids and result-reference decisions.
2. `userDecisions.chosenUiPlacement`: exactly one placement decision, either `dedicated-page-first` for a dedicated search page or one explicit host-project location for the search UI.

Do not continue into scaffold/source handler work with only source decisions recorded. Do not introduce a second routine UI-placement checkpoint after scaffold, sync, or query verification. Later UI delivery must consume `userDecisions.chosenUiPlacement`; it may stop only when that saved placement is ambiguous, unsafe, impossible in the host framework, or conflicts with host constraints.

Persist the user decisions only through the CLI:

```bash
node .agents/skills/search/scripts/session-state-cli.mjs set-user-decisions \
  --session-file "$SESSION_FILE" \
  --confirmed-source "<source-id>" \
  --placement dedicated-page-first

node .agents/skills/search/scripts/session-state-cli.mjs complete-step \
  --session-file "$SESSION_FILE" \
  --step source-confirmation

node .agents/skills/search/scripts/session-state-cli.mjs evaluate \
  --session-file "$SESSION_FILE"
```

For multiple confirmed sources, repeat `--confirmed-source`. For direct UI placement, pass the exact saved placement id through `--placement <placement-id>`. Do not hand-edit `userDecisions` JSON.

## Confirmation Input Shape

Each confirmed source must include:

```json
{
  "id": "products",
  "label": "Products",
  "handlerPath": "scripts/siteos-search/sources/products.mjs",
  "enabled": false,
  "count": 18,
  "documentOrigin": {
    "type": "api-service",
    "description": "Product documents come from the project-owned products API helper.",
    "evidenceFiles": ["src/lib/products.ts"]
  },
  "result": {
    "type": "url",
    "description": "Product detail pages",
    "urlPattern": "/products/[slug]"
  },
  "envRequirements": ["PRODUCTS_API_URL"],
  "dataAccessFiles": ["src/lib/products.ts"],
  "routeExamples": ["/products/[slug]"],
  "compatibility": {
    "notes": ["Handler extraction remains to be implemented."]
  }
}
```

The same checkpoint should persist the UI placement decision next to the source decisions. Minimal session-state shape:

```json
{
  "userDecisions": {
    "confirmedSources": ["products"],
    "chosenUiPlacement": ["dedicated-page-first"]
  }
}
```

The checkpoint must also preserve the dedicated-page route recommendation in the `ui-placement-plan` artifact used for confirmation. Record whether `/search` was available, occupied, or unsafe; the final recommended dedicated-page URL; and the fallback reason when the recommended URL is not `/search`. The route availability check must happen before asking the User to confirm dedicated-page placement.

For direct placement, store one explicit host-project location, for example:

```json
{
  "userDecisions": {
    "confirmedSources": ["products"],
    "chosenUiPlacement": ["header-search-trigger"]
  }
}
```

Required fields:

- `id`: stable project-language source id from the confirmed proposal.
- `label`: human-readable project-language label.
- `handlerPath`: path under `scripts/siteos-search/sources/`.
- `enabled`: `false` unless handler extraction and result references are complete.
- `count`: found document count shown at the source-confirmation checkpoint. Keep `0` when the candidate was discovered with zero documents.
- `documentOrigin`: concrete provenance for the counted documents, such as API service, disk path, code-defined data, database, external integration, or another host-project origin.
- `result.type`: `url`, `synthetic-route`, or `inline`.
- `result.description`: concise explanation of how results should resolve.
- `envRequirements`: env variable names only, never values.
- `compatibility.notes`: unresolved compatibility notes or an empty array.

For `url` results, include `result.urlPattern` or equivalent route reference. For `synthetic-route`, include the route or route plan. For `inline`, explain the rendering contract.

## Config Entry Rules

Update `siteos-search.config.ts` using these rules:

- Preserve `schemaVersion`, project settings, runtime defaults, `sync.entrypoint`, and `sync.mode: "full-replace"`.
- Add or update only explicitly confirmed source entries.
- Never activate sources that were only discovered but not confirmed.
- Keep a new source `enabled: false` when handler extraction, env readiness, or result references remain incomplete.
- Keep every `handler` path under `scripts/siteos-search/sources/`.
- Preserve existing unrelated source entries unless the user explicitly confirmed a removal or repair.
- Record unresolved source concerns in `compatibility.notes`.

Source entries should keep this shape:

```ts
{
  id: "products",
  label: "Products",
  enabled: false,
  handler: "scripts/siteos-search/sources/products.mjs",
  result: {
    type: "url",
    description: "Product detail pages",
    urlPattern: "/products/[slug]",
  },
  compatibility: {
    notes: ["Handler extraction remains to be implemented."],
  },
}
```

## Handler File Rules

Create one handler file per confirmed source at the confirmed `handlerPath`.

Use `assets/source-handlers/confirmed-source.template.mjs` as the safe starting point. Replace placeholders with confirmed source data, project-owned helper import notes, env variable names, and result strategy notes.

Handler files must:

- export a deterministic `sourceHandler` object with `id`, `label`, `result`, `envRequirements`, and `collectDocuments`.
- make `collectDocuments` return an array of documents or `{ documents }`; each document must include `id`, `title`, `url`, and `searchableText`.
- prefer project-owned fetchers, helpers, content readers, and env names from confirmed evidence.
- avoid SiteOS API calls, bearer tokens, runtime query credentials, Meilisearch keys, and `Authorization` headers.
- avoid printing env values or `.siteos/project.json` contents.
- throw a clear not-implemented error until project-specific extraction is added in a later slice.
- keep TODO placeholders only where project-specific extraction logic must be filled later.

Do not make handler templates call `fetch(` by default. A later source-extraction slice may choose project-specific calls only after inspecting the target project.

## Safe Authoring Continuation

After config and handler authoring, continue into source extraction and local document preview without a user-facing progress report. If a real blocker requires user action, use [onboarding-report-template.md](onboarding-report-template.md) and state only that blocker and its exact unblock action.

When config and guarded handler authoring starts and completes, record step status through the CLI:

```bash
node .agents/skills/search/scripts/session-state-cli.mjs start-step \
  --session-file "$SESSION_FILE" \
  --step scaffold-creation

node .agents/skills/search/scripts/session-state-cli.mjs complete-step \
  --session-file "$SESSION_FILE" \
  --step scaffold-creation
```

If source extraction is blocked after handler authoring, record the blocker through the CLI before reporting:

```bash
node .agents/skills/search/scripts/session-state-cli.mjs record-blocker \
  --session-file "$SESSION_FILE" \
  --code source_extraction_blocked \
  --message "<specific blocker reason>"
```

Use these details as the content source for that report:

```text
Confirmed sources represented in config:
- <source-id> -> <handlerPath> -> <result.type> -> <count> found documents from <documentOrigin>

Files created or updated:
- siteos-search.config.ts
- scripts/siteos-search/sources/<source-id>.mjs

Safety state:
- `pnpm search:sync --dry-run` is available for explicit payload preview/debugging
- `pnpm search:sync` is the live index update command after extraction, explicit environment selection, and diagnostics readiness are complete
- source extraction remains disabled until implemented and previewed
- first SiteOS push must wait for source extraction, the selected environment's diagnostics readiness, and the first live sync

Next technical step: implement source extraction and local document preview before first push.
```

Do not stop only because confirmed config entries and guarded handlers were authored. Continue into source extraction and explicit local dry-run preview (`pnpm search:sync --dry-run`) when the confirmed source and data path are clear. If extraction is ambiguous, credentials are missing, permissions are unclear, or result references are unresolved, record a real blocker and stop with the blocker reason.

Do not run live `pnpm search:sync` as a SiteOS push in this step.
