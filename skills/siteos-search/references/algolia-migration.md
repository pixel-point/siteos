# Preparing an Algolia migration

The current CLI can prepare a local Algolia export for review. This command is offline: it does
not authenticate, read credentials, query Algolia, upload content or change a Search environment.
Use it before the normal SiteOS Auth/Project preflight. A customer export or cutover still needs
the user's authorization. Never copy private customer records into a public repository.

## Access with an agent

**Migrate with AI** opens a copyable task for the user's agent. It includes the exact SiteOS
Project/environment, not an Algolia login, API key or access grant. Browser migration keys remain
in that browser flow and are never included in the prompt or forwarded through SiteOS MCP.

First identify the exact Algolia application/index and either a customer-provided export or a
customer-authorized local Algolia CLI connection. If neither exists, ask which path the user wants.
For CLI access, check the installed CLI help. Current versions support browser sign-in and explicit
application selection; have the user complete these in their own terminal:

```sh
algolia auth login
algolia application select
algolia application current
```

Compare the selected application with the authorized Application ID before exporting the named
index. Follow the [official authentication guidance](https://www.algolia.com/doc/tools/cli/authentication).
An existing restricted-key profile remains usable in versions supporting `--profile PROFILE`,
but manual profiles are deprecated in the current CLI. Never ask for keys in chat or print/read
stored secrets into the conversation. Environment credentials override profiles: check whether
overrides are present without exposing values, and resolve any mismatch before export. Do not
silently switch a customer's account. SiteOS authentication and MCP access do not authenticate
Algolia; an export file also works without installing or signing in to the Algolia CLI.

## Export

Algolia provides a Browse API and CLI for complete record export. Ordinary search responses are
not complete exports. With a verified customer-authorized Algolia application and index, use:

```sh
algolia objects browse INDEX > records.ndjson
algolia settings get INDEX > settings.json
algolia synonyms browse INDEX > synonyms.ndjson
algolia rules browse INDEX > rules.ndjson
```

Use the exact customer index; do not export every account index. Browse requires a `browse`
permission; settings, synonyms and rules require `settings` permission. A search-only website key
is insufficient. Keep credentials out of command arguments, terminal output and committed files.
See [Algolia CLI exports](https://www.algolia.com/doc/tools/cli/examples) and
[Browse API](https://www.algolia.com/doc/libraries/sdk/methods/search/browse-objects).

## Map and prepare

Adapt [the mapping example](../assets/algolia-mapping.example.json) to the exported record shape.
`title`, `content` and optional `section` list fields to join; dotted paths support nested objects.
`url` names the URL field. Absolute URLs must match the configured HTTPS origin. Relative URLs and
real anchor fragments are preserved. `objectID` supplies stable identity; it is namespaced by
the Algolia index and hashed into the SiteOS ID. The original record is retained in `sourcePayload`.

```sh
siteos search migrate algolia \
  --records records.ndjson --mapping mapping.json \
  --settings settings.json --synonyms synonyms.ndjson --rules rules.ndjson \
  --out migration-review --json
```

Records, synonyms and rules accept NDJSON or JSON arrays. Settings and mapping use JSON objects.
The output directory must be new. It is created with owner-only permissions; files are owner-only.
The command preserves original bytes in `archive/`, writes `report.json`, and prepares a relevance
candidate. Only a fully valid, nonempty content set within the current import limit produces
`content.json`. Rejected rows or oversized content return a nonzero exit and a reviewable report;
they never silently produce a partial replacement.

Preparation accepts up to 100,000 records and 100 MB per source file. The CLI stages content over
4 MB through the bounded bulk API: begin, immutable parts of at most 1 MB, complete preview, then
one explicit apply. The entire prepared upload must fit 100 MB. One very large document or source
configuration cannot exceed the part limit. Incomplete, stale or rejected uploads cannot publish.
Do not split a large index into independent full-replacement imports.

The application also offers **Set up Search** and **Migrate from Algolia** on the empty Search
Overview. Migration accepts a records export or connects directly from the customer's browser.
Direct connection starts with the Application ID and a temporary read key. `listIndexes` is optional:
with it, the wizard lists indices for selection; without it, the user enters the exact index name.
Denied listing does not prove that a key is valid. The next step verifies `browse` and `settings`
access to the selected index and reads at most 50 records to suggest observed field paths. It
does not upload data to SiteOS. A records file uses the same bounded field discovery. Suggestions
remain editable through field pickers and advanced mappings, with an example result. The website
origin comes from the selected Project environment, or one unambiguous HTTPS origin in the sample.
Unknown fields or ambiguous origins require user selection; full import validation remains mandatory.
There is no OAuth login in this browser form. SiteOS never receives or stores that Algolia key.
On Review migration, the wizard reads the complete records/settings/synonyms/rules,
keeps a downloadable archive, previews mappings and requires explicit full-replacement confirmation.
Review stages a temporary content copy on SiteOS but does not change the live index. Confirming
the import queues a build; the indexer publishes the new index only after a successful build.
File upload accepts records only; use the CLI for a full multi-file archive and synonym mapping.
No wizard import applies provider ranking or rules automatically. Revoke the temporary key after use.

## Review and cutover

- Original custom fields remain available in the archive and prepared source payload. Public
  query responses expose the supported result fields, not the full provider record.
- Standard and one-way synonyms are mapped within SiteOS limits; unsupported types are listed.
  All imported settings and rules require review. Ranking rules, custom ranking, facets, replicas,
  A/B tests, personalization and historical analytics are not translated automatically.
- Inspect the report, add representative queries to `relevance.json`, and use a staging environment.
  `content.json` is a full replacement: preserve existing sources explicitly when migrating into
  an environment that already has content. Prefer a separate migration environment for comparison.

After normal SiteOS Auth, Project and explicit environment selection:

```sh
siteos search sync --environment staging --file migration-review/content.json --json
# After reviewing that preview and the replacement scope:
siteos search sync --environment staging --file migration-review/content.json --apply --json
siteos search diagnostics --environment staging --json
siteos search relevance preview --environment staging --file migration-review/relevance.json --json
siteos search relevance compare --environment staging --revision RETURNED_REVISION --json
```

Read the actual build state before comparing results. A snapshot does not establish ongoing
updates: connect the customer CMS/build source or verified crawler, replay the final content delta,
and compare representative searches. Switch the editable website adapter only after acceptance;
retain Algolia for rollback. This is migration preparation, not an Algolia API compatibility layer.
