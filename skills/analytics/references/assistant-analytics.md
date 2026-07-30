# SiteOS Search Analytics

Use this reference from the `siteos-analytics` skill when the user asks about search health, search usage, sync outcomes, job outcomes, source coverage, diagnostics, or reporting signals for an already linked project.

This step fetches the API v1 analytics/diagnostics data and chooses the output channel before answering. It may return concise chat for simple questions or route complex report requests to [sidecar-reports.md](sidecar-reports.md). It does not generate browser artifacts, CLI wiring, MCP wiring, SiteOS API changes, sync/query behavior changes, or target-project mutations.

## Inputs

Start from the linkage checks in `SKILL.md`:

- target project root
- `.siteos/project.json` with project and organization identity
- `SITEOS_PROJECT_API_KEY` or a project-local `.env` containing `SITEOS_PROJECT_API_KEY`
- optional `.siteos/project.json.apiBaseUrl`
- optional `SITEOS_API_BASE_URL`
- required environment selection from the user or `siteos-search.config.ts`

Read `.siteos/project.json` only to resolve project identity and API base URL. Resolve bearer access from `SITEOS_PROJECT_API_KEY` or the project-local `.env`. Never print raw linkage JSON, project API keys, bearer tokens, environment query credentials, Meilisearch keys, or raw headers.

Resolve the API base URL in this order:

1. `SITEOS_API_BASE_URL`
2. `.siteos/project.json.apiBaseUrl`
3. `https://siteos.xui.se`

## API Calls

Prefer analytics as the primary source:

```text
GET /api/v1/project/search/analytics?environmentSlug=<environmentSlug>
Authorization: Bearer <project-api-key>
```

Require `environmentSlug` from the user or explicit `siteos-search.config.ts` configuration. Do not rely on an API default; `prod` is valid only as an explicit selection.

Use diagnostics as supporting context when analytics indicates not-ready state, missing source/environment coverage, recent failures, or when the user asks for remediation:

```text
GET /api/v1/project/search/diagnostics?environmentSlug=<environmentSlug>
Authorization: Bearer <project-api-key>
```

Do not call SiteOS UI, SiteOS MCP, public/exported-project query routes, direct Meilisearch APIs, or project-local browser routes for analytics answers.

## Output Channel Selection

Choose the output channel from prompt complexity before composing the answer:

- Use concise chat for simple health or status questions with only 2-4 values and no useful visual structure.
- Use a served sidecar HTML report by default for prompts asking for charts, graphs, distributions, dashboards, architecture diagrams or schemes, comparisons across sources, environments, or runs, sync/index health reports, or multi-section diagnostics.
- Use [sidecar-reports.md](sidecar-reports.md) canonical report types for complex developer-mode reports: `source-coverage`, `query-activity`, `sync-index-health`, and `architecture-map`.
- Served reports still use the same redacted analytics response and optional diagnostics response described here. Do not invent query history, click tracking, top-query analytics, zero-result analytics, durable query analytics, auth-failure breakdowns, or any data outside the API contract.
- Served reports must carry API limitation metadata, especially `recent_process_local_query_telemetry`, `overview_recent_window_only`, `no_raw_query_history`, and `no_durable_query_analytics` when the API returns them.
- Raw query text, raw query events, client identifiers, credentials, bearer headers, environment tokens, Meilisearch keys, and raw `.siteos/project.json` are excluded from both chat answers and report artifacts.

## Analytics Fields To Use

Use these `GET /api/v1/project/search/analytics` sections:

- `environment`: selected environment slug/name/status, current index presence, and document count.
- `queryActivity`: recent event counts, last-hour count, last-day count, limited request count, recent limited timestamp, outcome counts, `telemetryScope: "in-process-recent-events"`, and `logging` query-protection metadata.
- `queryActivity.logging`: `retention: "process-lifetime-or-200-events"` and `scope: "in-process"` describe the non-durable recent-event window.
- `sync`: recent run count, counts by status, latest run, totals, and latest failure.
- `jobs`: recent job count, counts by state, and latest failure.
- `sourceCoverage`: source count, active/inactive/blocked counts, counts by status/type, source keys, labels, source types, snapshot-derived document counts when present, activation modes, and statuses.
- `limitations`: API-stated reporting limits.

Use these `GET /api/v1/project/search/diagnostics` sections when needed:

- `status`
- `readiness.primaryCode`
- `readiness.checks`
- `environment`
- `diagnostics.backendHealth`
- `diagnostics.latestFailure`
- `recommendedActions`

## Answer Shape

Use this shape only when the selection rule chooses concise chat:

Answer in concise chat form:

```text
SiteOS search analytics: <healthy | needs attention | blocked | unavailable>
Environment: <environmentSlug> (<status>)
Query activity: <in-process-recent-events summary and outcome counts>
Sync: <latest run, totals, recent failures>
Jobs: <recent jobs and terminal/failure counts>
Sources: <active/inactive/blocked coverage and notable source keys>
Limitations: <API limitations, especially process-local telemetry>
Evidence: <fields used from analytics/diagnostics>
Recommended actions: <short concrete actions or none>
```

Use `healthy` only when environment state, source coverage, sync/job signals, and diagnostics support that conclusion. Use `needs attention` when the API is reachable but recent failures, a non-queryable environment, no index, no successful sync, blocked sources, or diagnostic warnings require action. Use `blocked` when diagnostics says readiness is unsafe or required data is missing. Use `unavailable` when the API cannot provide a truthful analytics answer.

## Limitations To State

Always distinguish supported analytics from missing durable analytics:

- `queryActivity.telemetryScope: "in-process-recent-events"` is query-protection telemetry, not durable historical analytics. Its `logging.retention: "process-lifetime-or-200-events"` and `logging.scope: "in-process"` describe the current recent-event window.
- `recent_process_local_query_telemetry` means query activity may reset with server process lifecycle.
- `overview_recent_window_only` means sync/job aggregation is limited to the overview's recent window.
- The analytics route does not expose raw query events, raw query text, client identifiers, or durable per-user history.
- Sidecar HTML reports and charts use [sidecar-reports.md](sidecar-reports.md) as the sibling output channel for complex prompts, from the same redacted analytics/diagnostics data.

## Blocked Classifications

Use these stable classifications:

- `analytics-linkage-missing`: `.siteos/project.json` is missing or malformed, or `SITEOS_PROJECT_API_KEY` cannot be resolved from the environment or project `.env`.
- `analytics-api-unreachable`: the API base URL cannot be reached.
- `analytics-auth-rejected`: the project API key is rejected.
- `analytics-response-malformed`: analytics or diagnostics JSON does not match the expected contract.
- `analytics-diagnostics-blocked`: diagnostics reports blocking readiness such as missing search root, backend unavailable, missing environment, an environment that is not queryable, or recent sync failure.
- `analytics-not-ready`: analytics is reachable but state is incomplete, such as no successful sync, no index, or no active sources.

When blocked, report one concrete repair action and stop. Do not fabricate analytics from local files, SiteOS UI, SiteOS MCP, direct Meilisearch access, or chat memory.

## Secret Handling

Do not include any of these in chat answers, saved notes, logs, generated artifacts, or commands pasted to the user:

- raw project API keys
- bearer headers or tokens
- environment query credentials
- Meilisearch keys
- raw `.siteos/project.json`
- raw query events, query text, or client identifiers

It is safe to report whether credentials are present, which API base URL source was selected, which environment slug was queried, and the redacted status of API calls.
