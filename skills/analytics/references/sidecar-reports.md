# SiteOS Search Sidecar Reports

Use this reference when the `siteos-analytics` output selection rule chooses a richer visual artifact instead of concise chat.

This step generates a standalone HTML report outside the target project. It does not change target-project files, open a browser, run Playwright, install SiteOS MCP, add CLI/MCP behavior, or change SiteOS APIs.

## Selection Context

Use this path by default for prompts asking for charts, graphs, distributions, dashboards, architecture diagrams or schemes, comparisons across sources, environments, or runs, sync/index health reports, or multi-section diagnostics.

Do not use this path for simple health or status questions with only 2-4 values and no useful visual structure; those stay as concise chat answers from [assistant-analytics.md](assistant-analytics.md).

The report input must come from the same redacted analytics response and optional diagnostics response used by assistant analytics. Reports must preserve API limitation metadata and must not invent query history, click tracking, top-query analytics, zero-result analytics, durable query analytics, auth-failure breakdowns, or any data outside the API contract.

## Canonical Report Types

Use these canonical developer-mode report types when selecting or shaping a sidecar report:

- `source-coverage`: show source counts, active/inactive/blocked state, per-source table, snapshot-derived document counts when present, and limitation notes near source data. Missing per-source document counts must render as `n/a`, not inferred totals.
- `query-activity`: show only supported `in-process-recent-events` query activity counts and outcomes, including `process-lifetime-or-200-events` retention and `in-process` scope when supplied. It is not durable query history, top-query analytics, zero-result analytics, click tracking, raw query text, or client/user tracking.
- `sync-index-health`: show environment/index status, sync freshness and totals, latest run status, jobs/failures, and recommended actions.
- `architecture-map`: explain the host project boundary, local route/environment credential path, sync/indexing path, SiteOS search environment, and ownership boundaries with static HTML/CSS only. Do not use Mermaid, SVG dependencies, remote assets, or chart dependencies.

## Inputs

Create or collect a redacted JSON input with this shape:

```json
{
  "generatedAt": "2026-06-22T10:30:00.000Z",
  "environmentSlug": "prod",
  "apiBaseUrlSource": "config",
  "analytics": {
    "success": true,
    "projectId": "project_redacted",
    "environmentSlug": "prod",
    "environment": {},
    "queryActivity": {},
    "sync": {},
    "jobs": {},
    "sourceCoverage": {},
    "limitations": []
  },
  "diagnostics": {
    "success": true,
    "status": "ready",
    "readiness": {},
    "recommendedActions": []
  }
}
```

Required fields:

- `analytics`: response from `GET /api/v1/project/search/analytics?environmentSlug=<environmentSlug>`.
- `generatedAt`: ISO timestamp. If omitted, the renderer may generate one.

Optional fields:

- `diagnostics`: response from `GET /api/v1/project/search/diagnostics?environmentSlug=<environmentSlug>`.
- `environmentSlug`: explicitly selected environment slug for display.
- `apiBaseUrlSource`: `env`, `config`, `default`, or another non-secret source label.

Do not include credentials, bearer headers, raw `.siteos/project.json`, environment query credentials, Meilisearch keys, raw query events, raw query text, or client identifiers.

## Output Location

Write reports outside the target project by default, for example:

- `/tmp/siteos-search-reports/<run-id>/index.html`
- `.epic-loop/epics/siteos-search-skill/verification/phase-7/<run-id>/reports/index.html`
- another agent-created evidence/report directory outside the target project root

Never commit the report into the target project unless the user explicitly asks for that artifact to be added. The report is an operator artifact, not project-owned application code.

## Renderer

Use the packaged renderer:

```bash
node <skill-root>/scripts/render-analytics-report.mjs \
  --input <redacted-input.json> \
  --output <report-dir>/index.html
```

The renderer must:

- use only Node built-ins
- read saved JSON input
- render deterministic standalone HTML
- embed CSS locally in the HTML
- avoid external fonts, CDN scripts, Chart.js, remote images, and network dependencies
- escape HTML content
- redact likely credential-looking strings before rendering
- run a generated-HTML safety scan before writing success output
- fail with a clear safety error if `apiKey`, `Authorization`, `Bearer`, `siteos_`, `meili`, raw query event arrays, raw query text markers, raw `.siteos/project.json`, `http://`, `https://`, `<script src=`, `<link href=`, CDN references, or `Chart.js` survive into the generated HTML
- render only aggregate analytics/diagnostics fields, never raw query events or raw query text

## Lightweight Visual Guidelines

Keep reports deterministic, readable, and easy to inspect without turning the helper into a production dashboard:

- provide stable section anchors for `source-coverage`, `query-activity`, `sync-index-health`, and `architecture-map`
- use clear heading hierarchy and short explanatory text before dense data
- use compact metric cards and tables for aggregate fields
- use simple CSS bars for counts where they improve scanability
- place limitation callouts close to the constrained data they describe
- keep the layout accessible and text-first, with no required JavaScript
- do not use remote scripts/assets, external fonts, image dependencies, or chart dependencies

## Required Report Sections

The report must include:

- title and generated timestamp
- environment summary
- readiness/diagnostics summary when diagnostics is provided
- query activity summary with clear `in-process-recent-events` telemetry, retention, and scope limitations
- sync/index health section with sync totals, latest run, and recent status counts
- job counts and latest failure
- source coverage counts and source table with snapshot-derived document counts when present
- static architecture/search-flow explainer
- limitations section
- recommended actions section

Use simple HTML tables, cards, and CSS bars. Do not add chart dependencies in this slice.

## Temporary Local Server

If the user wants to inspect the report locally, use the packaged server helper:

```bash
node <skill-root>/scripts/serve-report.mjs --root <report-dir> --port 0
```

The server helper must:

- use only Node built-ins
- serve the specified report directory only when it contains `index.html`
- print the local URL
- bind only to `127.0.0.1`
- prevent path traversal outside the report directory
- not open a browser automatically
- not call SiteOS APIs
- not read target-project files
- not print credentials

Browser verification and screenshots are a separate verification checkpoint, not part of report generation.

## Report Output

After generating or serving a sidecar report, answer with:

```text
SiteOS search sidecar report:
- input: <redacted input path>
- output: <report html path>
- server: <local URL or not started>
- data sources: analytics, diagnostics | analytics only
- limitations: in-process recent-event telemetry, overview recent window, or API-provided limits
- safety: outside target project, no external assets, no credentials rendered

Next checkpoint: verify the rendered report in a browser contour.
```

## Safety Checks

Before reporting success:

- confirm the output path is outside the target project unless explicitly approved
- scan generated HTML for obvious secret markers such as `apiKey`, `Authorization`, `Bearer`, `siteos_`, `meili`, raw query event arrays, raw query text markers, or raw `.siteos/project.json`
- confirm the HTML has no `http://`, `https://`, `<script src=`, `<link href=`, CDN references, or `Chart.js`
- keep raw API responses redacted before saving them as report input
