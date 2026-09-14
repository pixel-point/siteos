# Independent Search indices

Select **Organization → common Project → environment → index**. Documentation and Blog can
share a website while keeping content, crawlers, Suggestions, relevance, keys and visitor reports
independent. A source is a content input inside an index, not another independent search.

## Discover and select

Use `siteos_search_list_indices` with the exact common Project and environment for discovery.
Pass the returned `indexId` to every subsequent Search MCP read. MCP is read-only; create and
change resources with CLI/UI. Compare the Project and environment across both interfaces.

```bash
siteos search index list --environment production --json
siteos search index create --environment production --name Documentation --slug documentation --json
siteos search content list --environment production --index INDEX_ID --json
siteos search query --environment production --index INDEX_ID --query installation --json
```

Creation requires an owner/admin and explicit task scope. Use the ID returned by create/list,
not the display name or slug. An unknown or foreign ID fails; never retry by dropping `--index`.
Omitting the selector addresses only the preserved legacy default. The first explicitly created
index in an empty environment becomes its default. New indices start empty; no content or keys
are copied from another index. Current commands do not rename, delete or change the default index.

## Keep every operation in scope

Add `--index INDEX_ID` to the hosted CLI examples in the other Search references: content/import,
bulk upload, query, crawler, relevance, Suggestions, visitor reports, delivery, installation,
credentials, diagnostics and reindex. Directory list/create do not accept this selector.
Offline `search migrate algolia` does not accept it: prepare the export locally, then select the
destination index when previewing/importing the resulting payload.

A full replacement changes the selected index only. Review all its sources and the removal
count. Optional `target.indexId` in a JSON payload guards against importing into the wrong index;
it must match the selected destination or indexing credential. Do not bypass a mismatch by
deleting the guard. Creating an index or publishing Suggestions does not publish website changes.

For initial Suggestions, read `siteos_search_get_suggestions` or `search suggestions show` in
the selected index. Resolve document IDs there, retain its revision, then use the documented
revision-fenced publication. It does not rebuild content or change query ranking.

## Install two searches on one website

Each query/indexing credential is bound to one index. Query URLs remain compatible; the key
selects the index, not a visitor-supplied source filter. Keep private query keys on the server.
Each public Edge installation uses that index's publishable key and allowed website origins.

```bash
siteos search credential issue --environment production --index INDEX_ID --install --json
siteos search indexing-credential issue --environment production --index INDEX_ID --install --json
```

Named-index installation writes separate variable names to the ignored owner-only `.env`; it
preserves existing default and other-index credentials. Use the returned safe `installed`
metadata for the variable names. Do not print or copy secret values into chat. Default installs
retain the conventional `SITEOS_SEARCH_*` names.

For server-proxy delivery, give each search a separate route group, for example
`/api/docs-search/query` and `/api/blog-search/query`, with its own Suggestions/events routes.
In each group's `runtime-url.ts`, set `searchRuntimeVariables` to the names returned by CLI
installation. Bind those names in server code; never accept them from a request. Set each native
Search component's query, Suggestions and event endpoints to the matching group.

For local source handlers, keep a config per index. Set `index: { id: "INDEX_ID" }` alongside
`environment.slug`; the sync runner reads that index's installed credential without a default
fallback. Use `pnpm search:sync --config siteos-search.docs.config.ts --dry-run --output docs.json`
and the corresponding Blog config. Live sync omits `--dry-run` only after review and authorization.
The runtime smoke helper accepts `--index INDEX_ID` with its existing `--environment` flag.

Verify both searches, a reload, an empty result, and separate Suggestions. If collecting visitor
analytics, verify each consented query/click against its own index. Never use internal MCP or
Playground queries as evidence of visitor traffic.
