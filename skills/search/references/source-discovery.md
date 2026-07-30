# SiteOS Search Source Discovery

Use this reference to inspect a target external project and propose candidate search sources. Do not confirm sources for the user, edit `siteos-search.config.ts`, generate source handlers, or run sync from this reference alone.

Source confirmation follows the combined source and UI placement checkpoint policy reported by `scripts/session-state-cli.mjs evaluate`:

- if the user already named a source family and the discovered source/result reference is high-confidence with no unresolved scope question, record that source confirmation structurally but still record the search UI placement decision before scaffold/source-handler work
- if discovery is automatic, ambiguous, low-confidence, has unresolved scope/result-reference questions, or lacks a safe UI placement decision, stop for the combined source and UI placement confirmation

## Internal Discovery Shapes

The discovery layer should recognize these internal shapes:

- `record-collection`
  - classic helper + collection + detail-route evidence
- `page-embedded-knowledge`
  - large structured arrays or knowledge blocks embedded directly in route or page files
- `component-local-catalog`
  - component-adjacent data modules imported into UI surfaces
- `curated-cards`
  - manually curated card arrays with title/url/date/image/description-style fields
- `external-linked-entities`
  - locally defined searchable entities whose click-through target is external

These are internal heuristics only. Do not expose them as new public source taxonomy in `siteos-search.config.ts`.

## Inspection Areas

Inspect local project structure before proposing sources:

- `package.json` for framework, CMS, database, SDK, content, and data-fetching dependencies.
- The host framework's route tree and API/server-route conventions. Inspect `src/app`, `app`, `src/pages`, `pages`, and their API subtrees only when the discovered framework uses those Next.js locations.
- Data helpers under `src/lib/**`, `lib/**`, `src/data/**`, `data/**`, `src/server/**`, `server/**`, `src/db/**`, and `db/**`.
- Component and feature folders such as `src/components/**`, `components/**`, `src/features/**`, and nearby `data.*` modules that feed rendered lists or catalogs.
- Content directories such as `content/**`, `docs/**`, `posts/**`, `blog/**`, `mdx/**`, or project-specific equivalents.
- Existing search-related files, routes, components, and utilities.
- Environment access patterns such as `process.env.*` and variable names in `.env.example`.

Do not read secret values from `.env`, `.env.local`, or deployment configs. It is safe to report required variable names found in code or examples.
Prefer concrete file, route, import, and structured-content evidence over vague naming guesses.

## Shape-Specific Evidence Signals

Prefer evidence like this when classifying candidates:

- `record-collection`
  - detail routes such as `[slug]`, `[id]`, or equivalent stable record pages
  - nearby helper, CMS, data, or DB access code for the same domain
- `page-embedded-knowledge`
  - route/page-local arrays of question/answer, section, or structured knowledge objects
  - repeated fields such as `title`, `description`, `body`, `href`, `anchor`, or `items`
- `component-local-catalog`
  - `data.ts`, `constants.ts`, `catalog.ts`, or similar modules imported by a nearby component
  - rendered map/list sections whose records are defined locally rather than fetched remotely
- `curated-cards`
  - manually curated item arrays with fields like `title`, `url`, `date`, `image`, `description`, `category`, or `cta`
  - newsroom, press, integrations, feature grids, and FAQ-like curated blocks are common examples
- `external-linked-entities`
  - locally defined searchable entities that include external URLs or outbound click targets
  - do not reject a candidate only because the result click-through is external
  - if the entity is locally defined and meaningful to search, keep it as a valid candidate

## Candidate Proposal Fields

Return each candidate source with these fields:

```json
{
  "id": "products",
  "label": "Products",
  "thresholdBand": "strong",
  "priorityTier": "P1",
  "discoveryShape": "record-collection",
  "confidence": "high",
  "count": 18,
  "documentOrigin": {
    "type": "api-service",
    "description": "Product documents come from the project-owned products API helper.",
    "evidenceFiles": ["src/lib/products.ts"]
  },
  "evidence": ["src/app/products/[slug]/page.tsx", "src/lib/products.ts"],
  "dataAccessFiles": ["src/lib/products.ts"],
  "routeExamples": ["/products/[slug]"],
  "linkBehavior": "internal",
  "envRequirements": ["PRODUCTS_API_URL"],
  "suggestedResultStrategy": {
    "type": "url",
    "description": "Use the product detail page route."
  },
  "risksOrQuestions": ["Confirm whether draft products should be indexed."],
  "recommendedHandlerPath": "scripts/siteos-search/sources/products.mjs"
}
```

Use project-language names for `id` and `label`. Do not use SiteOS-internal taxonomy unless the target project already uses those terms.
Use `discoveryShape` only as an internal heuristic label. It is not a public source type.
The `count` field is the found document count for the candidate source at discovery time. Preserve zero-count candidates as `count: 0` when the source was discovered but no indexable documents were found.
The `documentOrigin` field explains where those documents come from, using a concrete host-project provenance such as `api-service`, `disk-path`, `code-defined-data`, `database`, `external-integration`, or another project-specific origin. Include enough evidence files, directories, routes, or service names for the user to judge the candidate before confirming it.

## Quantity Threshold Bands

Expose quantity interpretation explicitly through `thresholdBand`:

- `<= 3` items
  - `thresholdBand: "skip"`
- `4-6` items
  - `thresholdBand: "inspect"`
- `7-12` items
  - `thresholdBand: "candidate"`
- `> 12` items
  - `thresholdBand: "strong"`
- `> 25` items
  - `thresholdBand: "strong"`
  - also treat as likely high-priority

These bands are discovery/planning signals only. They are not hard indexing rules by themselves.

## Priority Tiers

Expose discovery urgency explicitly through `priorityTier`:

- `P1`
  - blog
  - products in e-commerce-like projects
  - case studies
  - documentation
  - knowledge base
  - any source with more than 25 entries
- `P2`
  - news
  - press releases
  - events
  - FAQ
  - features
  - services
- `P3`
  - landing pages unless they clearly qualify higher
  - repeating card sets across one or more pages
  - external data surfaces such as YouTube videos, external posts, or outbound entity lists

Priority tiers are discovery/planning signals only. They are not hard rules about what must be indexed.

## Temporary Candidate Inventory Artifact

Persist discovery proposals in one temporary, machine-friendly artifact so later confirmation steps can reuse the same proposal state without relying only on narration.

Use the existing lightweight onboarding artifact flow and keep the inventory session-scoped, for example:

- `.siteos/temp/search/session-<started-at>.source-candidates.json`

Treat this file as temporary and disposable. It belongs to the lightweight execution model, not to long-lived project documentation.

The artifact should be written with the same artifact helper layer already used for other onboarding step-local files:

- artifact suffix: `source-candidates`
- extension: `json`
- current step: `candidate-source-discovery`

Use this exact CLI command to persist the candidate inventory. Do not call `session-state-cli.mjs help`, do not inspect `scripts/session-state.mjs`, and do not hand-edit the session JSON:

```bash
node .agents/skills/search/scripts/session-state-cli.mjs write-source-candidates \
  --session-file "$SESSION_FILE" \
  --candidates-json '[{"id":"faq","label":"FAQ","count":9,"documentOrigin":{"type":"code-defined-data","description":"FAQ entries are defined locally.","evidenceFiles":["src/app/faq/page.jsx"]},"discoveryShape":"page-embedded-knowledge","priorityTier":"P2","thresholdBand":"candidate","confidence":"medium","sourceCategory":"knowledge-base","evidenceFiles":["src/app/faq/page.jsx"],"routeExamples":["/faq"],"envRequirements":[],"resultStrategySuggestion":{"type":"url","description":"Use /faq."},"linkBehavior":"internal","userDecision":"proposed","notes":[]}]'
```

Replace the example JSON array with the discovered candidate objects. Do not include the top-level `sessionArtifact` object in the command; the CLI adds that canonical wrapper automatically so review tooling can identify the artifact consistently.

## Candidate Inventory Fields

Each candidate entry should be able to carry at least:

- `id`
- `label`
- `count`
- `documentOrigin`
- `discoveryShape`
- `priorityTier`
- `thresholdBand`
- `confidence`
- `sourceCategory`
- `evidenceFiles`
- `routeExamples`
- `envRequirements`
- `resultStrategySuggestion`
- `linkBehavior`
- `userDecision`
- `notes`

Suggested placeholder enumerations:

- `userDecision`
  - `proposed`
  - `confirmed`
  - `rejected`
  - `deferred`

The contract should preserve candidate evidence and scoring metadata now, even if the later user-decision workflow is not implemented in this phase slice.
The `count` field must be preserved as the found document count in the temporary inventory and any proposal/report artifact derived from it. Do not silently drop zero-count sources; keep them visible with `count: 0`, a `thresholdBand` such as `skip`, and a note explaining what evidence was found but why no documents were counted.
The `documentOrigin` value must travel with each candidate into the source-confirmation report. It should identify the concrete provenance of the counted documents, not only the broad source category.

## Result Strategy Defaults

Use these defaults at the discovery/confirmation layer only. They are proposal defaults, not runtime guarantees.

### FAQ

- default to fragment-aware result strategy when the project structure supports stable anchors or sections
- prefer the FAQ page plus section/item anchor over a generic top-of-page route when that structure is visible in project evidence
- if fragment-aware linking is not obviously supported yet, keep the candidate and record the anchor question in `risksOrQuestions`

### Integrations

- default to fragment-aware result strategy when the project structure supports stable anchors, grouped sections, or item-level anchors
- prefer the integrations page plus section/subgroup/item anchor over a generic top-of-page route when that structure is visible in project evidence
- if fragment-aware linking is not obviously supported yet, keep the candidate and record the anchor question in `risksOrQuestions`

### External-Linked Entities

- locally defined searchable entities remain valid candidates even when their click-through target is external
- keep `linkBehavior` explicit and let `suggestedResultStrategy` describe the external destination or mixed local-preview/external-click behavior
- do not silently exclude the candidate only because the final click leaves the host project

## Confidence Levels

- `high`: route evidence and data access code clearly describe the same domain, and result URLs are obvious.
- `medium`: either route evidence or data access code is strong, but source boundaries or result strategy need confirmation.
- `low`: weak hints exist, such as content folder names or UI labels, but the data source is unclear.
- `needs-confirmation`: the candidate may be useful, but indexing scope, permissions, or result behavior cannot be inferred safely.

Never inflate confidence to avoid asking a question. Mark uncertain candidates as `needs-confirmation` and list the exact question.

## Result Strategy Hints

Suggest one result strategy per candidate:

- `url`: use when each record maps to an existing stable route.
- `synthetic-route`: use when results need a generated or existing landing route to render records.
- `inline`: use when records are useful only as abstract content or actions.

Explain the evidence for the strategy. Do not generate UI or routes in this step.

## Separation Of Stages

Keep these stages separate:

1. Candidate discovery: inspect project evidence and propose sources.
2. User source confirmation: user approves which sources and result references to pursue.
3. Config entry authoring: write confirmed sources into `siteos-search.config.ts`.
4. Handler generation: create `scripts/siteos-search/sources/**`.

This reference only covers stage 1.

## Report Shape

Use [onboarding-report-template.md](onboarding-report-template.md) for the user-facing onboarding report when discovery reaches the combined source and UI placement checkpoint. In `What is needed to continue`, ask the user to confirm exactly two numbered decision groups:

1. Which candidate sources to use, including source scope, source label, result strategy or result URL/reference, and any exclusions or visibility rules.
2. Where the search UI should be placed: either a dedicated search page or one explicit host-project location for the search UI.

The candidate source report must list every candidate from the temporary inventory, including zero-count candidates, with its found document count and document origin/provenance. Counts and origins are decision-support information only; they must not activate, reject, or mutate sources without user confirmation.

Before recommending a dedicated search page, inspect the discovered host framework's route tree to decide whether `/search` can be created safely. For Next.js, common checks include `src/app/search`, `app/search`, `src/pages/search.*`, and `pages/search.*`; for another framework, inspect that framework's route registry or page convention. If `/search` is free, request `Confirm UI placement: /search (recommended).` If `/search` is occupied or unsafe, request confirmation for exactly one nearby fallback URL, such as `/site-search`, and state the fallback reason. Do not present a menu of fallback routes or ask the User to choose among vague alternatives.

Before presenting the combined checkpoint report, persist the placement recommendation through the CLI:

```bash
node .agents/skills/search/scripts/session-state-cli.mjs start-step \
  --session-file "$SESSION_FILE" \
  --step source-confirmation

node .agents/skills/search/scripts/session-state-cli.mjs write-ui-placement-plan \
  --session-file "$SESSION_FILE" \
  --step source-confirmation \
  --content-json '{"dedicatedPageRoute":{"recommendedPath":"/search","availability":"available","checkedPaths":["/search"],"fallbackPath":"","fallbackReason":""}}'

node .agents/skills/search/scripts/session-state-cli.mjs evaluate \
  --session-file "$SESSION_FILE"
```

If the recommended URL is not `/search`, set `recommendedPath`, `availability`, `fallbackPath`, and `fallbackReason` to the inspected values. Do not hand-edit session JSON.

Include the candidate source details in the `Current step` section or immediately after the template when they are needed for the user decision:

```text
Candidate sources:
- id: <source-id>
  label: <human label>
  thresholdBand: skip | inspect | candidate | strong
  priorityTier: P1 | P2 | P3
  discoveryShape: record-collection | page-embedded-knowledge | component-local-catalog | curated-cards | external-linked-entities
  confidence: high | medium | low | needs-confirmation
  foundDocumentCount: <count> documents
  documentOrigin: <origin type> - <origin description and evidence>
  evidence: <files/directories/routes>
  dataAccessFiles: <files or none found>
  routeExamples: <routes or none found>
  linkBehavior: internal | external | mixed
  envRequirements: <env names only, no values>
  suggestedResultStrategy: <url | synthetic-route | inline> - <why>
  recommendedHandlerPath: scripts/siteos-search/sources/<source-id>.mjs
  risksOrQuestions: <specific confirmation questions>

UI placement choices:
- dedicated search page: <recommended URL>
  availability: /search available | /search occupied | /search unsafe
  fallbackReason: <only when the recommended URL is not /search>
  prompt: Confirm UI placement: <recommended URL> (recommended).
- one explicit host-project location for the search UI

Next step: confirm or record confirmed sources, result references, and search UI placement according to the session-state checkpoint policy.
```

If no candidate is strong enough, report `No safe candidates yet` and list the files inspected plus the missing evidence.
