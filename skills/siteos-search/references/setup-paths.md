# Choose the shortest Search setup path

Use three customer-facing stages: **add content → check results → add to the website**.
Resume from observed state and existing decisions. Do not make the user choose an SDK language
before inspecting the host framework, or present internal session steps as a fourteen-step setup.
The detailed session protocol remains appropriate for local source-handler implementation.

## 1. Add content

Confirm the exact Organization, common Project, environment and website scope. Use available MCP
reads for existing state; use normal CLI Auth/Project preflight before mutations. MCP and CLI have
independent selections: compare all three identifiers before switching. Never create an attachment
just because a setup page or prompt was opened.

Choose from actual source evidence and the user's request:

| Available content | Supported path | Read next |
| --- | --- | --- |
| Public server-rendered pages | Verify ownership, configure scope, crawl and review | [Website crawler](website-crawler.md) |
| CMS, Markdown or application data | Reuse the project's extraction/build pipeline or add a source handler | [Source discovery](source-discovery.md) |
| Prepared SiteOS JSON | Validate a preview, then apply the approved snapshot | [Content import](search-experience.md) |
| Existing Algolia index/export | Export with limited read permissions, preserve an archive and review mappings | [Algolia migration](algolia-migration.md) |

Crawling and prepared imports do not require local handler scaffolding, a fabricated
`siteos-search.config.ts` or a local extraction session. Follow their own status/preview operations;
use the session-state CLI when implementing the local source-handler path. Source setup and website
UI delivery remain separate in every path. Do not advertise unsupported CSV/TSV ingestion, hosted
JavaScript crawling or a catalog of native CMS connectors.

Ask one combined question only when source scope, result URLs or website UI placement remain
undecided. Previously authorized decisions still count. A newly discovered full-replacement scope,
private source or production cutover requires that specific decision, not a restart of onboarding.

## 2. Check results

Wait for the actual published index, not only an accepted job. Inspect content and run representative
queries through available MCP reads or `siteos search query --environment SLUG --query TEXT --json`.
Check titles, snippets, working local URLs/anchors and an expected no-result query. An Algolia
migration also needs a comparison with saved queries and a review of unsupported settings/rules.
Show a compact result sample and any rejected content before changing the website.

## 3. Add to the website

Inspect the existing framework and search trigger; deliver editable native components using
[framework integration](framework-integration.md). Reuse a working client and credentials.
Read connection/crawler state through the available MCP catalog, or CLI installation/delivery
status. Choose Edge only when configured and externally verified; public configuration alone is
not a successful query. The private-key host proxy remains an available path.

Verify the real website query path, keyboard/focus, empty/error states and mobile controls. Check
consented query/click delivery separately if collection is enabled. Finish with the selected
environment, evidence of a working query and one unresolved action if any. Keep package installation
and agent-host preparation separate from the customer task prompt.

Reference: [Algolia's agent workflow](https://www.algolia.com/doc/guides/get-started/build-with-ai)
uses MCP, CLI and skills as complementary interfaces. SiteOS exposes its implemented read catalog
through MCP and keeps changes in its CLI/UI; do not invent MCP write tools or cross-provider parity.
