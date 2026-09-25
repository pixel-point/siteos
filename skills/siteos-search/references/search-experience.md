# Content, relevance, installation and visitor analytics

Use the selected common Project and an explicit common `--environment`. The CLI resolves its native Search binding; never infer a connection from matching names or slugs. Existing user authorization remains valid throughout the workflow. Reuse approved sources and placement decisions when resuming.

Run `siteos search --help` first when using an older CLI. These operations require the updated CLI and Search backend. An unavailable command or route is a version mismatch, not permission to call internal endpoints. Use a locally built CLI during release acceptance; do not claim unpublished functionality is in the npm release.

For public website crawling, use [website-crawler.md](website-crawler.md). Its previews preserve other sources and do not install the website interface.

## Review and import content

The Content screen and CLI inspect the last published snapshot. Rebuilds do not fetch website content.

```sh
siteos search content --environment production --query 'getting started' --json
siteos search query --environment production --query 'getting started' --json
pnpm search:sync --dry-run --output .siteos/temp/search/content-preview.json
siteos search sync --environment production --file .siteos/temp/search/content-preview.json --json
# After the user has authorized the reviewed full replacement:
siteos search sync --environment production --file .siteos/temp/search/content-preview.json --apply --json
```

The export writes a new owner-only file and never overwrites one. Source handlers still own extraction. The remote preview validates the payload and reports added, changed, removed and unchanged documents. Every source must be included: sync is a full replacement. An empty sources array empties the index. The normal scaffold refuses zero enabled sources to catch accidental configuration mistakes; an intentional empty import is available through the reviewed JSON flow.

`--apply` revalidates the exact file and uses the published run from that preview as a concurrency guard. If content changes before admission, preview again. A queued response is not publication. Poll diagnostics and content, then execute a known query. The indexing credential is needed for the unattended `pnpm search:sync` runner; the authenticated CLI import uses its Search grant.

## Tune relevance

```sh
siteos search relevance show --environment production --json
siteos search relevance preview --environment production --file relevance.json --json
siteos search relevance compare --environment production --revision <returned-id> --json
siteos search relevance compare --environment production --revision <returned-id> --query 'help' --json
siteos search relevance apply --environment production --revision <returned-id> --json
```

Use the reviewable [relevance example](../assets/relevance.example.json). It contains ordered searchable attributes, directional synonyms, typo tolerance and up to ten benchmark queries. Expected IDs are optional and mean “present in the top five”; they do not assert an exact rank. Copy real document IDs from Content rather than fabricating them.

Preview creates a separately indexed version over the same published content. Poll `relevance show` until the revision succeeds; compare queries and inspect missing expected pages before applying. Applying changes visitor results and requires authorization for that configuration. Existing approval for tuning and applying this environment counts. A new content publication invalidates an unapplied preview. Applied settings survive subsequent syncs and rebuilds. Failed previews leave live search usable.

## Verify the website connection

```sh
siteos search installation status --environment production --json
siteos search installation verify --environment production --url https://website.example/api/search/query --query 'known indexed page' --json
```

Run verification after the updated website proxy is reachable. The CLI obtains a short-lived challenge, queries the explicit website endpoint without sending it a SiteOS management credential, then validates the returned Search receipt. At least one matching result is required. HTTPS is required except for loopback development; redirects are rejected. The saved result proves that query path at the check time, not continuous uptime or every keyboard interaction.

Complete browser verification separately: trigger, focus, typing, late response cancellation, empty results, errors, pagination, result clicks, keyboard and mobile. Resuming setup starts from `installation status` plus diagnostics; do not recreate working credentials or resync unchanged content to restart the checklist.

## Visitor analytics and collection mode

Read `siteos search visitors report --environment <slug> --index <index-id> --days 30 --json`
before installing events. Check `settings.enabled`, `settings.collectionMode` and retention.
New indices default to enabled independent collection with 30-day retention. Existing indices
preserve their settings and consent-required policy. Missing `collectionMode` means an older
server: retain consent-required behavior and do not claim independent delivery is supported.

For an authorized mode change (not a reporting-only request):

```sh
siteos search visitors configure --environment production --index <index-id> --enabled true --retention-days 30 --collection-mode independent --json
```

Independent collection requires CLI 2.26.0 or newer and a server that reports `collectionMode`.
Confirm the flag with `search visitors configure --help` first; use `siteos-cli` to upgrade an
older CLI before changing the mode. Read back the same index. Omitting
`--collection-mode` preserves the current policy. Never change an existing index's disabled
setting, mode or retention merely to install the search UI.

Match the editable client to the server mode. Independent collection needs no banner or consent
callback. Consent-required delivery uses `analyticsMode: "consent_required"` and a real live
`canRecordAnalytics` callback. The Next.js helper defaults to independent; call
`setSiteOSSearchAnalyticsMode("consent_required")` before using it for a consent-controlled index.
It recognizes explicit SiteOS Cookie analytics consent (`accept_all` or `custom` plus the
analytics category). Another CMP calls `setSiteOSSearchAnalyticsConsent(true|false)` on initial
state and every change; `null` restores the SiteOS Cookie adapter. Merely attaching Cookie does
not change independent collection. Never substitute a fabricated consent grant.

GPC, DNT and `window.SiteOSSearchDisabled = true` stop events in either mode. The helper also
provides `setSiteOSSearchAnalyticsDisabled(boolean)`; the factory accepts `isAnalyticsDisabled`.
For live host preference changes, dispatch `siteos-search:consent` so the dialog cancels pending
work and refreshes permission. Consent-required collection waits for a grant and stops on
withdrawal. Search results must keep working when collection is unavailable or off.

Install the event wiring with the UI: assign an in-memory interaction ID, pass it to `search`,
record the settled query receipt (including zero results), and record a returned result ID on
navigation. Verify actual event requests and the same index's visitor report. A successful GET
alone does not establish analytics installation. Backend/Edge/client publication are separate;
old installed components require an explicit update.

The website uses an in-memory interaction UUID and signed result receipts. A settled query records one search; later typing within the same interaction updates it. Result clicks use the corresponding receipt and count at most once per interaction. Clearing or closing search starts a new interaction. There are no persistent visitor identifiers, user profiles or session stitching. Playground, relevance comparison, installation verification and CLI/MCP query operations are excluded.

Reports provide completed searches, no-result searches, searches with a click, daily totals, popular queries and zero-result queries. Click-through rate is searches with a click divided by completed searches. They cover retained interactions admitted under the mode active when collected. A mode change governs new events and does not relabel or remove historical counts. Keep environment, actual retention-limited period and last event time visible. Do not equate counts with unique people or conversions.

Query text is normalized. Common sensitive patterns (email, URL, long numbers and credential-like assignments) are withheld while aggregate counts remain. This heuristic is not a PII classifier. Retention is 7, 30 or 90 days; expired rows are excluded immediately and require the configured explicit Search maintenance job for physical deletion. Disabling collection stops new events and does not erase retained history. Do not silently enable collection or extend retention for a reporting request.

`search analytics` and its existing sidecar renderer remain operational index/job reports. `search visitors report` is the visitor report; hosted MCP operational analytics must not be described as visitor analytics. Report bounded query aggregates only when relevant to the requested analysis; never print receipt tokens, raw event rows, credentials or private identifiers.

## Suggestions before typing

Suggestions are curated articles, separate from query suggestions and relevance. Manage them in
Search → Content: pin documents in All documents, open Suggestions, order the list and review
before Publish suggestions. The list belongs to the selected environment. It does not rebuild or
replace the index; removed documents are omitted from public delivery.

With a CLI release that exposes `search suggestions` in `--help`, the same workflow is available
through chat. Resolve the shared Project and explicit environment first. Read the published list
and indexed content; never invent document IDs:

```bash
siteos search suggestions show --environment staging --json
siteos search content --environment staging --query "installation" --json
```

Prepare a JSON file with the returned revision and the complete ordered selection (up to 10 unique
IDs). For example, `{"revision": 2, "documentIds": ["<indexed-document-id>"]}`. Review the titles,
order and environment with the user, then publish the authorized selection:

```bash
siteos search suggestions publish --environment staging --file suggestions.json --apply --json
```

An empty `documentIds` array explicitly clears hosted suggestions. A conflict means another session
published a newer revision: reread and reconcile; do not blindly retry with the new revision. A
missing document must be removed or replaced from the current index. Do not run sync/reindex for
suggestion changes. The website must first use the current editable runtime and a suggestions
endpoint; afterwards UI/CLI publication updates it without a website build. Search Edge refreshes
its leased configuration automatically, so delivery can lag publication by a refresh interval.

## Article activity in Content

When the installed CLI help includes content activity flags, read per-document activity in the
selected environment without a sync or index rebuild:

```sh
siteos search content --environment staging --days 30 --sort clicks --direction desc --json
siteos search content --environment staging --from 2026-09-01 --to 2026-09-14 --filters '[{"dimension":"query","operator":"is","values":["install"]}]' --json
```

`--query` finds text in indexed documents. The `query` filter selects the visitor queries that
returned them. Filters are a JSON array of up to three `{ dimension, operator, values }` objects:
`section`, `query`, or `activity`; `is` or `is_not`; activity values `clicked`, `unclicked`, or
`not_appeared`. Sort by `title`, `appearances`, `clicks`, or `ctr`, with `asc` or `desc` direction.
The API sorts all matching documents before pagination (`--offset`). Query text is normalized and
privacy filtered, as in visitor analytics.

Appearances count an article in a completed search's latest signed result list, once per
interaction/document. They are not screen impressions or all possible engine matches. Clicks count
those interactions with a verified article click; CTR is clicks / appearances. Events use existing
the selected collection mode and collection settings. Read `activity.collectedSince` and the effective report
period before interpreting zero activity: historical search totals cannot reconstruct article
appearances. Collection may be paused, and missing/private query text is excluded from query lists.
Top queries are limited to ten per article. Do not infer that a low-click article is irrelevant or
a no-appearance article is absent from the index. Suggestions are independent of these rankings.
