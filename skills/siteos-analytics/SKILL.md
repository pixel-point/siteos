---
name: siteos-analytics
description: Use when answering SiteOS managed search health, usage, sync/job, source coverage, diagnostics, or reporting questions for an already linked external project. Fetches SiteOS API v1 analytics/diagnostics, chooses concise chat or a served sidecar HTML report, and keeps all credentials and report artifacts outside the target project.
---

# SiteOS Analytics

Use this skill from the root of a target external project, or pass an explicit target project root when the user names one.

This skill owns analytics and reporting for existing SiteOS managed Search Projects. It does not create/select a Search Project, configure sources, scaffold `siteos-search.config.ts`, author source handlers, deliver search UI, run `search:sync`, install SiteOS MCP, or change SiteOS APIs. For those tasks, use the sibling `$siteos-search` skill.

Start by using safe CLI output to confirm Auth, the Search Project, and the selected environment:

1. Resolve the target project root.
2. Run `npx @siteoshq/cli auth status --json`. Delegate missing Auth or Organization selection to `$siteos-auth`.
3. Run `npx @siteoshq/cli project status --json`. Delegate missing Search Project selection or product repair to `$siteos-search`; never interpret private binding state or inspect credential-bearing files.
4. Read `siteos-search.config.ts` only when needed to resolve an explicitly configured environment slug or explain source labels. Stop when no environment is selected; do not fall back to `prod`.
5. Run `npx @siteoshq/cli search analytics --environment <slug> --json` as the primary source.
6. Run `npx @siteoshq/cli search diagnostics --environment <slug> --json` only when supporting readiness context is needed.
7. Choose concise chat or a sidecar HTML report from prompt complexity before answering.

Use [references/assistant-analytics.md](references/assistant-analytics.md) for API calls, classifications, concise answer shape, limitations, and secret handling. Use [references/sidecar-reports.md](references/sidecar-reports.md) and `scripts/render-analytics-report.mjs` when the prompt asks for charts, graphs, distributions, dashboards, architecture diagrams or schemes, source/environment/run comparisons, sync/index health reports, or multi-section diagnostics. Use `scripts/serve-report.mjs` only when the user wants a local report URL.

## Output Selection

- Use concise chat for simple health or status questions with only 2-4 values and no useful visual structure.
- Use a served sidecar HTML report by default for complex visual or multi-section reporting prompts.
- Sidecar reports must be written outside the target project unless the user explicitly asks to commit a report artifact.
- Browser verification and screenshots are a separate checkpoint; do not open a browser automatically.

## Hard Stops

Stop before:

- creating or editing `siteos-search.config.ts`
- adding source handlers or modifying `scripts/siteos-search/**`
- running `pnpm search:sync`
- changing search UI or server-side query files
- printing raw `.siteos/search/project.json`, private bindings, broad credentials, authorization headers, environment query credentials, Meilisearch keys, raw query events, raw query text, or client identifiers
- fabricating durable query history, top-query analytics, zero-result analytics, click tracking, auth-failure breakdowns, or per-user history outside the API contract
- writing analytics HTML reports inside the target project without explicit user approval
- installing SiteOS MCP
- changing SiteOS API, DB schema, CLI behavior, or exported-project behavior
- running Auth/Organization mutations instead of delegating to `$siteos-auth`, or Search Project mutations instead of delegating to `$siteos-search`
