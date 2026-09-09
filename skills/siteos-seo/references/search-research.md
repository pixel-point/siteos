# Search research from SiteOS reports

## Choose a report

Use the exact selected Project environment. Read saved reports through the CLI before launching a
new measurement. Dashboard and the research pages expose the same records. Check installed
`npx @siteoshq/cli seo --help` for matching CLI/server support; use `$siteos-cli` when an update is
needed. Reports and JSON exports retain immutable measurement inputs and observation timestamps.

```sh
npx @siteoshq/cli seo research summary --json
npx @siteoshq/cli seo research history --kind keywords --json
npx @siteoshq/cli seo research status --kind rankings --json
npx @siteoshq/cli seo research show <run-id> --json
npx @siteoshq/cli seo research export <run-id> --format json --output ./research-report.json --json
```

Kinds: `keywords`, `domain`, `rankings`, `backlinks`, `brand`, `ai-visibility`. History shows the
latest 30 per kind; retained older report IDs still support show/export. CSV exports use one row per
dataset entry with JSON cells for the request, dataset metadata and entry; failed parts remain in
the file. Prefer JSON for analysis. Both formats preserve zero versus missing metrics. Choose new
output filenames; exports refuse to overwrite files.

| Question | Useful evidence | Interpretation boundary |
| --- | --- | --- |
| What should we write or improve? | Keyword research; GSC queries if connected | Volume and difficulty are provider estimates; relevance needs website context |
| Where do we and our competitors rank? | Rank tracking with query, country, language, device and time | Not found in returned results does not mean not indexed |
| Which domains compete for search demand? | Domain Overview → Competitors and overlapping queries | Search competitors can differ from business rivals |
| Who links to a website? | Backlinks, source/target URLs, anchors and available summary | Returned rows are a sample; provider totals and sample counts are distinct |
| What actually brings Google search clicks? | Connected GSC Insights, property and date range | Clicks, impressions, CTR and average position are first-party search metrics, not revenue |

Research checks do not require GSC. A missing GSC connection must not block analysis of other reports.
Do not initiate OAuth, connect another property or launch paid checks merely to fill an empty card.
Use the existing authorization and check estimate/available credits before a new research request.
Use the installed help and validated plan for markets, platforms and result limits; do not import another tool's defaults.

## Prepare or run a measurement

Create a local JSON file for the exact scope; do not include credentials. These are independent
request examples, not an instruction to run all of them:

```json
{"kind":"keywords","target":"example.com","keywords":["website analytics"],"country":"US","language":"en"}
```
```json
{"kind":"rankings","target":"example.com","keywords":["website analytics"],"competitors":["rival.example"],"country":"US","language":"en","device":"desktop"}
```
```json
{"kind":"domain","target":"example.com","country":"US","language":"en"}
```
```json
{"kind":"backlinks","target":"example.com"}
```

```sh
npx @siteoshq/cli seo research plan --input ./research-request.json --json
npx @siteoshq/cli seo research saved save --input ./research-request.json --name "Website keywords" --json
npx @siteoshq/cli seo research saved list --kind keywords --json
```

Plan validates and normalizes inputs and returns planned parts, availability and Organization
credits. It neither enqueues work nor calls a paid endpoint. Saving inputs also spends no credits;
use `--id <saved-id>` to update a saved check. Remove one only when requested with
`npx @siteoshq/cli seo research saved remove <saved-id> --json`.

After the user authorizes a measurement and the plan fits the available balance:

```sh
npx @siteoshq/cli seo research run --input ./research-request.json --idempotency-key <retry-key> --json
npx @siteoshq/cli seo research wait <run-id> --timeout 120 --json
```

Use a unique 8–100 character retry key (letters, digits, hyphens or underscores). Preserve it and
exactly the same request after an uncertain response. Never generate a new key merely to retry a
lost launch response. Admission, credits and worker dispatch are identical to the interface; there
is no automatic paid retry. Wait exit 3 means pending, exit 4 failed/cancelled; a partial report can
still contain useful evidence. Read each part before interpreting missing results. To stop queued
or subsequent parts, use `npx @siteoshq/cli seo research cancel <run-id> --json`; an in-flight provider
request may still finish and cost credits. Do not start background schedules or batches implicitly.

## Build a keyword plan

1. Establish the product, audience, market, important conversion and existing pages from the task or
   website context. Use the user's seed topic; expand it only when it serves that goal.
2. Inspect available queries and URLs. Preserve the source report and its measurement context.
   Prioritize business relevance, intent and a plausible target page alongside measured demand.
   Do not discard a relevant long-tail query merely because measured volume is low or unavailable.
3. Group terms that could be answered well by the same page. Label informational, commercial,
   transactional or navigational intent as an interpretation unless the report measures it.
   If clustering uses only wording and intent, call it thematic grouping; do not claim measured
   SERP overlap. Investigate possible cannibalization only when overlapping pages have evidence.
4. Map each group to an existing URL to improve or a proposed new page. A content gap is a relevant
   unmet need, not every keyword a competitor ranks for. Keep irrelevant terms outside the plan.
5. Return a compact shortlist: topic, representative queries, intent, available demand/difficulty,
   target page, business reason, recommended change and evidence. Propose a meaningful validation
   window; do not promise a ranking or calculate traffic/revenue from volume without assumptions.

## Explore a domain

Domain Overview accepts any public domain without GSC. Use `kind: "domain"` to collect the domain
summary, ranking keywords, top pages and search competitors for one country and language. Read its
history with `seo research history --kind domain --json`; report/show/export use the same run IDs.
The stored kind remains `competitors` for compatibility. Old `competitors` request files still
collect only keywords and competitors; do not silently change an already authorized retry payload.

Domain summary metrics are independent of the first 100 keywords, pages and competitors returned.
Do not sum those samples into a domain total. A missing summary or page dataset in an older or partial
report remains unavailable, not zero. Use `domain-summary` and `domain-pages` datasets for totals
and page opportunities. Ranking keywords include available CPC in USD and SEO difficulty (0–100).
Filtering, sorting and exporting a saved report do not start another check. Compare report dates,
market and target before drawing conclusions; editing a search draft does not change saved evidence.

## Inspect one keyword's SERP

Use installed CLI help to check support for `seo research serp`. Read the Keyword Research report
first and choose an exact returned word. These commands share the interface's report/word cache:

```sh
npx @siteoshq/cli seo research serp show <run-id> --keyword "website analytics" --json
npx @siteoshq/cli seo research serp ensure <run-id> --keyword "website analytics" --json
npx @siteoshq/cli seo research serp wait <run-id> --keyword "website analytics" --json
npx @siteoshq/cli seo research serp export <run-id> --keyword "website analytics" --format json --output ./keyword-serp.json --json
```

`show`, `wait` and `export` never spend credits. Use `ensure` only within the user's authorized
paid-research scope: it consumes Organization research credits if no snapshot exists. Repeating
it for the same report/word returns the saved job, including failures; do not start a new report
merely to retry an uncertain charge. Market and device come from the parent report. Members can
read saved snapshots but cannot ensure a new one; a CLI run grant does not override that policy.

Compare the organic pages, titles, intent and useful content in the saved results (up to 20).
Keep observation time and market in the report. Monthly volume is estimated demand, not actual
site visits; missing months are unknown. A low difficulty score is not a guarantee of ranking.

## Compare competitors

Use named business competitors when supplied and distinguish them from observed search competitors.
Compare the same market, device, language and query set. Different rank-tracking configurations or
missing prior reports do not provide a reliable movement baseline. A provider's estimated domain
traffic is not measured Analytics traffic. Show which observations support each opportunity and
which differences might reflect unequal report coverage.

Review competitor pages for audience, intent, useful information, evidence, freshness and internal
links. Recommend improvements tailored to this website. Do not copy their page text, promise that
matching their word count will win, or infer an entire strategy from one sampled result.

## Assess backlinks

Review source relevance, destination page, anchor and link attributes actually present in the report.
Deduplicate repeated source domains when making an outreach shortlist, but preserve the original
rows in evidence. Keep provider summary totals distinct from the returned page of links. Do not
claim links are live, new, lost or followed unless that state is recorded or separately verified.

A domain score alone cannot establish quality, spam or harm. Treat suspicious links as candidates
for investigation, not automatic disavow instructions. Explain realistic editorial opportunities
such as relevant resource pages or unlinked mentions. Drafting outreach can follow the user's task;
contacting people and sending messages require explicit authorization.

## Use GSC when available

```sh
npx @siteoshq/cli seo gsc status --json
npx @siteoshq/cli seo gsc report --dataset queries --filter all --page 1 --json
npx @siteoshq/cli seo gsc report --dataset pages --filter declining --json
npx @siteoshq/cli seo gsc report --url <page-url> --json
npx @siteoshq/cli seo gsc export --dataset queries --format json --output ./gsc-queries.json --json
```

GSC report pages contain 25 rows. Export reads all matching rows from one saved comparison (up to
20,000 across current and previous periods), with coverage and truncation metadata. Selected-page
query evidence is a preview of at most 25 rows; do not describe it as every query. Property totals
are fetched independently; summing sampled rows does not reproduce them.

If refreshed evidence is needed and authorized, run `npx @siteoshq/cli seo gsc sync --json` and read
status until the returned synchronization finishes. This uses the existing Google worker and no
research credits. A new Google account still needs interactive SiteOS OAuth; agents do not collect
Google credentials. Once connected, status lists available properties. Bind the exact environment
only within the user's requested setup using returned connection/property and current revision:

```sh
npx @siteoshq/cli seo gsc bind --connection <connection-id> --property <site-url> --website <environment-url> --revision <revision> --json
```

Use revision 0 only for a resource never bound before. After disconnect, use the retained revision
reported by status. `npx @siteoshq/cli seo gsc disconnect --revision <revision> --json` removes only
this environment's binding and requires explicit setup-change scope, not routine report analysis.

Retain property, date range, query/page filters, country/device and synchronization freshness. Compare
equivalent time windows and account for incomplete recent data and changed filters. CTR and average
position depend on their aggregation; do not average page averages or equate average position to a
fixed rank. Show high-impression low-CTR candidates in context of intent and current snippets rather
than treating every low CTR as a title problem. Cross-reference audit findings on the same URLs.

GSC alone does not prove conversions or revenue. If the user requests that connection, use independently
measured Analytics evidence and explain attribution limits. Never substitute synthetic or example data
for a missing report.
