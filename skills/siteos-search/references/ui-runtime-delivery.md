# SiteOS Search UI Runtime Delivery

Use this reference only after a target project has a confirmed `siteos-search` scaffold and Phase 5 sync/query verification has succeeded or the user explicitly asks to prepare UI files for review.

This step defines the canonical SiteOS search UI asset pack, the server-proxied SiteOS environment query contract, and the delivery semantics for adapting those assets into a real host project. It does not install browser tooling or overwrite conflicts without approval.

## Host Baseline Prerequisite

Before any runtime or UI delivery work proceeds, the skill must create and read a mandatory `host-baseline` artifact.

The baseline must also record the host verification command and any relevant lint conventions for the files that Search will create or adapt. Read the project ESLint or equivalent formatter configuration when it governs JSX/TSX. Canonical interaction behavior is fixed, but the delivered syntax, prop ordering, imports, and component style must follow the host's local rules.

Recommended filename:

- `.siteos/temp/search/session-<started-at>.host-baseline.json`

Minimum artifact shape:

```json
{
  "artifactSlug": "host-baseline",
  "hostLanguage": "typescript",
  "hostFramework": "detected-host-framework",
  "touchedProjectArea": "src/app",
  "moduleStyle": "esm",
  "importStyle": "alias-first",
  "importAliases": ["@/*", "@root/*"],
  "routerConventions": ["app-router", "route-handlers"],
  "deliveryConstraints": ["preserve-existing-aliases"],
  "notes": ["Target project expects TypeScript route handlers."]
}
```

## Delivery Decision Ladder

Before runtime or UI delivery mutates a target project, choose an explicit per-artifact-class decision from the host baseline:

- `copy`
- `adapt`
- `recreate`

Recommended session-scoped artifact:

- `.siteos/temp/search/session-<started-at>.delivery-decision-ladder.json`

Recommended minimum shape:

```json
{
  "artifactSlug": "delivery-decision-ladder",
  "baselineArtifactSlug": "host-baseline",
  "artifactClasses": {
    "search-trigger": {
      "decision": "adapt",
      "rationale": "Keep canonical compact trigger behavior while adapting host tokens and primitives."
    },
    "search-dialog": {
      "decision": "adapt",
      "rationale": "Preserve canonical dialog behavior while adapting host styles and utility imports."
    },
    "siteos-query-client": {
      "decision": "adapt",
      "rationale": "Preserve the local browser query client while adapting the server proxy route to the host runtime."
    },
    "server-query-route": {
      "decision": "adapt",
      "rationale": "Keep credentials server-side and proxy search requests through the host project."
    },
    "support-primitives": {
      "decision": "adapt",
      "rationale": "Reuse host button/dialog/scroll primitives when equivalent files already exist."
    },
    "search-page": {
      "decision": "recreate",
      "rationale": "Generate the real working search page in host-project structure instead of copying a canned page.",
      "canonicalDeviation": "No deviation; the generated page keeps the canonical SearchBar and SearchDialog interaction model."
    }
  }
}
```

## Adaptation Blocker Reporting

If safe adaptation is not obvious, stop with an explicit blocker report.

Recommended session-scoped artifact:

- `.siteos/temp/search/session-<started-at>.adaptation-blocker-report.json`

Recommended minimum shape:

```json
{
  "artifactSlug": "adaptation-blocker-report",
  "whatAlreadyWorks": [
    "SiteOS search sync/query verification already passed.",
    "The canonical search assets are available."
  ],
  "adaptationBlocker": "The target project has existing UI primitives or route structure that require a deliberate adaptation choice.",
  "nextMeaningfulCheckpoint": "Choose whether the affected file should be adapted to host primitives or recreated in host-project style."
}
```

## Canonical Asset Pack

These committed asset paths are the canonical Next.js implementation. Deliver them directly only to a compatible Next.js host. For another framework, use the decision ladder to adapt the interaction model to the host's component, routing, and server conventions; do not copy Next.js paths verbatim and do not stop solely because a host-native adapter is required.

Canonical Next.js asset paths:

- `src/components/ui/search-bar.tsx`
- `src/components/ui/search-dialog.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/scroll-area.tsx`
- `src/hooks/use-debounce.ts`
- `src/hooks/use-touch-device.ts`
- `src/lib/siteos-project-search.ts`
- `src/lib/siteos-project-search-dialog.ts`
- `src/lib/utils.ts`
- `src/data/search.ts`
- `src/app/api/search/query/route.ts`

Use these asset sources:

- `assets/ui-runtime/src/components/ui/search-bar.tsx`
- `assets/ui-runtime/src/components/ui/search-dialog.tsx`
- `assets/ui-runtime/src/components/ui/dialog.tsx`
- `assets/ui-runtime/src/components/ui/button.tsx`
- `assets/ui-runtime/src/components/ui/scroll-area.tsx`
- `assets/ui-runtime/src/hooks/use-debounce.ts`
- `assets/ui-runtime/src/hooks/use-touch-device.ts`
- `assets/ui-runtime/src/lib/siteos-project-search.ts`
- `assets/ui-runtime/src/lib/siteos-project-search-dialog.ts`
- `assets/ui-runtime/src/lib/utils.ts`
- `assets/ui-runtime/src/data/search.ts`
- `assets/ui-runtime/src/app/api/search/query/route.ts`

These assets represent the canonical search interaction model:

- compact search trigger styled like a small search input
- search icon on the left
- `⌘K` hint on the right for non-touch devices
- click opens the dialog instead of focusing an inline page input
- all interactive search happens inside the dialog
- dialog results update while the user types
- keyboard navigation and highlight behavior stay canonical

## Canonical UI Generation Contract

Generated search UI must match the committed canonical assets as closely as the host project allows.

### JavaScript Next.js TypeScript Transition

Before copying the canonical `.ts` or `.tsx` assets into a Next.js project, preserve JavaScript-project aliases when the project has `jsconfig.json` but no `tsconfig.json`:

```bash
node .agents/skills/siteos-search/scripts/ensure-typescript-config.mjs --project-root "$PWD"
```

The helper creates `tsconfig.json` only when needed and carries forward compatible `compilerOptions.baseUrl`, `compilerOptions.paths`, and `compilerOptions.jsx` values. Do not replace or edit an existing `tsconfig.json`. This step must run before Next.js sees generated TypeScript files, so its automatic TypeScript setup retains the host project's import aliases.

For `JS/TS` Next.js projects, canonical asset delivery is mandatory unless a concrete host constraint is recorded in `canonicalDeviation`. For another framework, the canonical interaction model remains mandatory, while the delivery decision must record whether each Next.js-oriented asset can be adapted safely or needs a host-native recreation. A non-Next host is not itself a blocker.

Required first delivery path:

1. Copy or adapt the canonical `SearchBar` trigger.
2. Copy or adapt the canonical `SearchDialog`.
3. Copy or adapt `siteos-project-search-dialog` helpers.
4. Copy or adapt the browser query client.
5. Copy or adapt the server query route.
6. Copy or adapt required hooks, support primitives, and project-owned `src/data/search`.
7. Generate the dedicated page only as a minimal host-project wrapper that renders the canonical search trigger.

Do not recreate search interaction locally when the canonical assets can be copied or adapted. A custom inline search page is invalid if it replaces the canonical trigger/dialog model.

Keep these canonical behaviors intact when copying, adapting, or recreating host-native components:

- the visible surface is the canonical compact `SearchBar` trigger
- the main interaction surface is the canonical `SearchDialog`
- source labels, section labels, suggestions, recent searches, highlighting, keyboard navigation, and screen-reader title/description behavior remain present
- browser code queries only a project-owned search endpoint; `/api/search/query` is the canonical Next.js route shape
- the host server route queries SiteOS through `/api/search/environment/:environmentSlug` and attaches `SITEOS_SEARCH_TOKEN` as `x-siteos-project-search-credential`
- layout remains responsive without inventing alternate mobile-only or desktop-only search models

Pay attention to these canonical interaction details when a manual JSX adaptation or host-native recreation is unavoidable:

- the dialog search input uses `type="text"` unless the native search cancel control is explicitly disabled; do not ship a duplicate browser clear button next to the canonical clear affordance
- the clear affordance, query reset behavior, focus behavior, and `enterKeyHint="search"` should match the canonical input behavior
- ArrowDown and ArrowUp navigation should match the canonical bounded behavior: move within the first and last result instead of wrapping around the list unless a recorded `canonicalDeviation` explains the change
- the highlighted result must stay visible while navigating with the keyboard; preserve the canonical `data-index` + `scrollIntoView` behavior or an equivalent ref-based implementation
- the scroll target must be the active result row inside the dialog results viewport, not the page body or the whole dialog
- touch-device handling should remain equivalent to the canonical behavior; do not add desktop keyboard scrolling side effects to touch-only flows
- result rows must preserve the observable selected/highlighted state used by keyboard navigation and Enter/click navigation

If host framework, styling, file-format, or primitive constraints require a deviation from the canonical assets, record the reason in the delivery-decision artifact with `canonicalDeviation` or in the final onboarding report. Do not leave deviations only in chat.

## Working Search Page Principle

The skill does not ship a canned dedicated page file.

Instead, when the user asks for a dedicated search page, generate a real working page in the host project using host-project structure and layout conventions:

- use the canonical `SearchBar` as the visible search surface
- import and render the copied/adapted canonical search trigger rather than recreating a local input/results component
- place it in a restrained layout that fits the host project
- keep typography and spacing at sidebar/body scale rather than hero scale
- preserve host theme colors, fonts, radii, and border tokens
- keep the page intentionally minimal so the dialog remains the main search experience
- include only the necessary search experience and minimal supporting copy when useful
- do not add unrelated hero sections, marketing sections, feature grids, decorative cards, unrelated calls to action, demo content, or extra components that are not required for search
- do not add decorative background shapes, oversized title/hero copy, runtime badges, or invented suggestions/results sections outside canonical `src/data/search` plus dialog behavior

The dedicated page is a real production search page, not a temporary demo-only widget.

Invalid dedicated page output includes:

- inline search forms that own querying, loading state, results, suggestions, or cards outside `SearchDialog`
- page-local `SearchResultCard`, `SearchSuggestion`, or equivalent replacement components for canonical dialog behavior
- decorative background classes such as `circle-primary` or `nuggets-white`
- hero-scale headings such as `font-sans-titles text-60`
- invented marketing copy such as `Find <project> content fast.`
- runtime badges such as `Runtime prod`

If a host-native recreation is unavoidable, the recreated components must still expose the same observable canonical markers and behavior: trigger opens dialog, dialog owns input/results, keyboard navigation, highlighting, source/section labels, `/api/search/query`, server-side credential boundary, and responsive behavior. If those markers cannot be preserved, stop with an adaptation blocker instead of delivering a custom inline search page.

## Server-Proxied Search Query Contract

The canonical browser contract is fixed:

- browser code calls only the project-owned `GET /api/search/query`
- browser code never sends search credentials, environment slugs, SiteOS API base URLs, project API keys, bearer auth, or SiteOS headers
- the project-owned server route calls SiteOS `GET /api/search/environment/:environmentSlug`
- the server route attaches the runtime query credential with `x-siteos-project-search-credential`

The server-side environment contract is fixed:

- `SITEOS_SEARCH_TOKEN` stores the environment query credential
- `SITEOS_SEARCH_ENV` selects the environment slug explicitly; `prod` is an example selected environment, not a fallback
- the SiteOS API base URL is server-side only and requires `SITEOS_SEARCH_PUBLIC_URL`

Production, staging, and local client projects must set the reviewed server-side `SITEOS_SEARCH_PUBLIC_URL`; Project configuration and another service origin are not Search fallbacks.

Use unified CLI commands for query credential management. Inspect metadata before choosing an initial issue or an intentional rotation; both mutation commands install the credential without printing it:

```bash
npx @siteoshq/cli search credential list \
  --environment prod \
  --json

npx @siteoshq/cli search credential issue \
  --environment prod \
  --install \
  --name "SiteOS Search UI" \
  --json
```

Use `search credential rotate` with the same `--environment`, `--install`, optional `--name`, and `--json` arguments only for intentional replacement. Do not read CLI Auth storage, parse a plaintext credential from CLI output, or call the Search credential-management HTTP endpoints directly.

Use the runtime helper only for server-side validation and query smoke verification. Do not read `.env` manually and do not write inline Node HTTP clients for the SiteOS environment query:

```bash
node .agents/skills/siteos-search/scripts/runtime-token-tooling.mjs validate \
  --project-root "$PWD" \
  --environment prod

node .agents/skills/siteos-search/scripts/runtime-token-tooling.mjs query \
  --project-root "$PWD" \
  --environment prod \
  --q "<representative query>" \
  --limit 5
```

The `validate` and `query` commands read `SITEOS_SEARCH_TOKEN` and `SITEOS_SEARCH_ENV` from the project `.env`, require the explicit command environment to match, and print redacted JSON. Treat `status: "query-ok"` as enough evidence for server-side runtime query reachability. The retired helper `init` and `rotate` commands stop locally with unified CLI guidance and make no request.

The delivered query integration must not create or require browser-public environment variables for the SiteOS search token, environment slug, or API base URL. In Next.js, this specifically prohibits:

- `NEXT_PUBLIC_SITEOS_SEARCH_TOKEN`
- `NEXT_PUBLIC_SITEOS_SEARCH_ENV`
- `NEXT_PUBLIC_SITEOS_SEARCH_PUBLIC_URL`

The canonical Next.js asset `src/lib/siteos-project-search.ts` owns:

- local `/api/search/query` URL building
- response types for hits/items/error payloads

The canonical Next.js asset `src/app/api/search/query/route.ts` owns:

- reading `SITEOS_SEARCH_TOKEN` from server env
- resolving the server-side environment slug
- building the SiteOS environment query URL
- attaching `x-siteos-project-search-credential`
- normalizing upstream unavailable/error responses

## Search Trigger And Dialog Model

`src/components/ui/search-bar.tsx` owns:

- compact trigger UI
- `DialogTrigger`
- `⌘K` toggle behavior
- route-change close behavior

`src/components/ui/search-dialog.tsx` owns:

- the real search input
- debounce-driven querying
- suggestions and project-owned recents
- grouped result rendering
- keyboard navigation
- highlight rendering
- click/Enter navigation

`src/lib/siteos-project-search-dialog.ts` owns:

- grouping rules
- suggestions-state detection
- highlight-part fallback logic

`src/data/search.ts` is project-owned optional data for:

- initial suggestions
- optional initial recents

When the agent can infer strong project-owned suggestions from the target project, it should populate `src/data/search.ts`. When it cannot, empty arrays are acceptable and are not a blocker for UI delivery.

## Dependency And Primitive Adaptation

This slice does not install dependencies automatically.

Expected package follow-up may include:

- `lucide-react`
- `@radix-ui/react-dialog`
- `@radix-ui/react-scroll-area`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`

The delivery flow should prefer host-project primitives when they already exist:

- existing `Button`
- existing `Dialog`
- existing `ScrollArea`
- existing `cn`

When equivalent host primitives do not exist, the skill may deliver the canonical support files from `assets/ui-runtime/**`.

## Search Placement Planning And Confirmation

Search placement is confirmed in the combined source and UI placement checkpoint before scaffold/source-handler work starts. UI delivery must consume the saved `userDecisions.chosenUiPlacement` value instead of asking a second routine placement question.

Read the saved placement decision through the CLI evaluation output:

```bash
node .agents/skills/siteos-search/scripts/session-state-cli.mjs evaluate \
  --session-file "$SESSION_FILE"
```

Do not inspect or import `scripts/session-state.mjs` to determine placement.

Keep the dedicated search page as the default safe option:

- `dedicated-page-first`

Before the combined checkpoint recommends `dedicated-page-first`, inspect whether `/search` can be created safely in the host project. If `/search` is free, the recommended dedicated page is `/search`. If `/search` is already occupied or unsafe, store exactly one nearby fallback URL and its reason in the `ui-placement-plan` artifact. Do not offer vague fallback menus such as `/search`, `/site-search`, or `/resources/search`; choose one concrete URL before asking for confirmation.

Direct placement into an existing host-project location is also allowed when that exact location was confirmed in the combined checkpoint.

Broader placement options remain explicit proposals until they are confirmed in that combined checkpoint:

- `global-entry-points`
- `source-listing-pages`
- `source-detail-pages`

Recommended session-scoped artifact for the combined checkpoint:

- `.siteos/temp/search/session-<started-at>.ui-placement-plan.json`

Create or update that artifact with:

```bash
node .agents/skills/siteos-search/scripts/session-state-cli.mjs write-ui-placement-plan \
  --session-file "$SESSION_FILE" \
  --step source-confirmation \
  --content-json '{"dedicatedPageRoute":{"recommendedPath":"/search","availability":"available","checkedPaths":["/search"]}}'
```

Recommended minimum shape:

```json
{
  "artifactSlug": "ui-placement-plan",
  "defaultPlacementOptionId": "dedicated-page-first",
  "confirmationRequired": true,
  "dedicatedPageRoute": {
    "availability": "available",
    "checkedPaths": ["/search"],
    "recommendedPath": "/search",
    "fallbackPath": "",
    "fallbackReason": "",
    "promptText": "Confirm UI placement: /search (recommended)."
  },
  "options": [
    {
      "id": "dedicated-page-first",
      "kind": "default-safe-path",
      "label": "Dedicated search page first",
      "summary": "Generate the real working search page before broader embedding.",
      "targetSurfaces": ["dedicated-search-page"],
      "requiresConfirmation": true
    },
    {
      "id": "global-entry-points",
      "kind": "broader-embedding",
      "label": "Global entry points",
      "summary": "Insert the same tuned SearchBar trigger into shared host surfaces.",
      "targetSurfaces": ["header", "footer", "homepage"],
      "requiresConfirmation": true
    }
  ]
}
```

Embedding means reusing the same tuned `SearchBar` trigger and canonical dialog behavior, not inventing a second search UI.

Do not stop after sync/query verification only to ask where the search UI should go. Stop during UI delivery only when the saved placement is missing, ambiguous, unsafe, impossible in the host framework, or conflicts with host constraints.

## Extraction Path Ladder

Before later source extraction work proceeds, choose an explicit per-source extraction path from the host baseline:

- `reuse`
- `bridge`
- `fallback extractor`

Recommended session-scoped artifact:

- `.siteos/temp/search/session-<started-at>.extraction-path-ladder.json`

Recommended minimum shape:

```json
{
  "artifactSlug": "extraction-path-ladder",
  "baselineArtifactSlug": "host-baseline",
  "sources": {
    "blog-posts": {
      "decision": "reuse",
      "rationale": "The host project already exposes a stable blog data path."
    },
    "integrations": {
      "decision": "bridge",
      "rationale": "The host project has usable local data, but a thin adapter may be needed for search extraction."
    }
  }
}
```

## Delivery Report Shape

After a future delivery flow applies or previews these files, use [onboarding-report-template.md](onboarding-report-template.md) for the user-facing onboarding report. Report the saved placement decision from `userDecisions.chosenUiPlacement`; do not present a second routine placement checkpoint. If the saved placement is blocked, fill `What is needed to continue` with the specific unblock action, such as clarifying an ambiguous host surface or choosing a safe dedicated search page fallback.

Record UI delivery step state and delivery artifacts with:

```bash
node .agents/skills/siteos-search/scripts/session-state-cli.mjs start-step \
  --session-file "$SESSION_FILE" \
  --step ui-delivery

node .agents/skills/siteos-search/scripts/session-state-cli.mjs write-host-baseline \
  --session-file "$SESSION_FILE" \
  --step ui-delivery \
  --content-json '{"hostFramework":"detected-host-framework"}'

node .agents/skills/siteos-search/scripts/session-state-cli.mjs write-delivery-decision \
  --session-file "$SESSION_FILE" \
  --step ui-delivery \
  --content-json '{"artifactClasses":{}}'

node .agents/skills/siteos-search/scripts/session-state-cli.mjs complete-step \
  --session-file "$SESSION_FILE" \
  --step ui-delivery
```

Use these details as the content source for that report:

```text
SiteOS search UI/runtime delivery:
- new: <paths>
- identical: <paths>
- conflicts: <paths>

Dependency follow-up:
- <dependency or none>

Search runtime contract:
- browser queries only the project-owned `/api/search/query` endpoint
- project server route queries SiteOS runtime
- server-side `SITEOS_SEARCH_TOKEN` is configured
- project API keys are not exposed
- existing conflicts were not overwritten

Next verification step: verify the delivered trigger, dialog, local query endpoint, and server-proxied SiteOS query behavior in the target project.
```

## Required Host Verification

Before completing UI/runtime delivery, run the host project's configured build or lint command that covers the delivered files. Do not treat copied or adapted canonical assets as verified merely because they were written successfully.

If verification reports an error in a Search file created or adapted during this delivery, repair that Search file to follow the host's conventions and rerun the same command. Preserve the canonical interaction model, project-owned browser query route, and server-only credential boundary while making that repair.

Do not modify unrelated host files just to silence pre-existing failures. Record those separately as a host blocker with the exact command and failing path.

## Optional Browser Verification

Browser verification is desirable but not required for completion. Use only browser automation tools that are already available in the current agent environment or explicitly required by the host project instructions. Do not install global browser automation packages such as `agent-browser` during this skill.

If a browser tool is available, verify:

- the delivered trigger renders and opens the dialog
- typing a representative query calls the project-owned `/api/search/query` endpoint
- result rows render without exposing SiteOS credentials
- the dedicated page or confirmed host placement works on desktop and mobile viewports when the tool supports viewport changes

If no browser tool is available, skip browser automation, record `browserVerification: "skipped-no-available-tool"` in the final verification artifact, and tell the user the exact local page/API route that needs manual verification.
