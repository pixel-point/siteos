# SiteOS Search Sources

Source handlers live in this directory.

Each handler should export the documents for one confirmed source from the project itself, normalize those documents for SiteOS managed search, and provide result references that match `siteos-search.config.ts`.

This scaffold intentionally does not include live source handlers yet. Source handler generation happens after source confirmation and before first SiteOS sync.
