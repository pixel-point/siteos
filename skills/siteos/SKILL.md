---
name: siteos
description: Use for initial SiteOS setup, an unspecified SiteOS request, or a workflow spanning more than one SiteOS service. Routes work to the unified CLI, Auth, Pulse, Forms, Search, or Search analytics skills while preserving independent product Projects.
---

# SiteOS Orchestrator

Route the request; do not duplicate detailed service procedures here.

1. Resolve the target repository and the user's intended outcome.
2. Use `$siteos-cli` when the CLI is missing, outdated, unhealthy, or its command surface is unclear.
3. Use `$siteos-auth` for sign-in, Organization listing/creation/selection, session status, or logout.
4. Use exactly the product skills needed by the request:
   - `$siteos-pulse` for monitoring Projects, Playwright Checks, local runs, sync, and deploys.
   - `$siteos-forms` for Forms Projects, Environments, definitions, credentials, and submissions.
   - `$siteos-search` for Search Projects, Environments, sources, indexing, queries, and UI delivery.
   - `$siteos-analytics` for Search analytics, diagnostics, and reports after Search is connected.
5. For a multi-service request, finish authentication once, then complete each product workflow independently and report results per service.

## Boundaries

- Auth owns accounts, Organizations, sessions, and short-lived service grants. It does not own product Projects.
- Pulse, Forms, and Search each own their Project records, tracked repository reference, private binding, lifecycle, Environments, credentials, and data.
- Creating, selecting, renaming, or deleting a Project in one product must never create, select, link, or mutate a Project in another product.
- Similar names or slugs across products are a user convention, not shared identity.
- Use only commands documented by `$siteos-cli`; never revive `@s-os/cli`, a root `siteos project` command, or `.siteos/project.json`.
- Load only the sibling skills needed for this request. Do not cascade through every skill for a single-service task.

When the user explicitly names a service, prefer that service skill directly. Use this orchestrator for discovery, initial setup, and cross-service coordination.
