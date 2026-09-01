# SiteOS Search Onboarding Report Template

Use this template only when onboarding reaches a user decision checkpoint or a real blocker. Do not emit a progress report when the next step can continue automatically.

The session JSON remains the canonical source for step state, checkpoint decisions, blockers, artifacts, and remaining steps. Use `scripts/session-state-cli.mjs` as the only supported interface for reading, evaluating, and mutating that state. This template defines the minimal user-facing explanation of that state.

## Decision Report

```text
# SiteOS Search Onboarding Flow

## Current step

<One or two short sentences explaining the current decision.>

## Candidate sources

<Include this section only when source selection is the decision. List only the candidate details needed to choose sources.>

## What is needed to continue

1. <First exact decision or unblock action.>
2. <Second exact decision when the checkpoint has one.>
```

## Blocker Report

```text
# SiteOS Search Onboarding Flow

## Blocked

<Short, honest explanation of the blocker and the blocking evidence.>

## What is needed to continue

<Exact unblock action required from the user, SiteOS API, credentials, project code, or environment.>
```

## Language Rules

- Keep `Current step` to one or two sentences.
- In `What is needed to continue`, name only the exact decision, confirmation, or unblock action required now. Use a numbered list when there is more than one decision.
- Keep completed steps, remaining steps, diagnostics, paths, framework metadata, timing, and status fields in session state or local artifacts unless one is necessary to explain the current decision or blocker.
- When no user input is needed, continue without a user-facing report.
- In blocker reports, state the reason first, then the exact unblock action.
- Redact all secrets. Never print project API keys, bearer tokens, runtime query credentials, raw auth headers, or full linkage JSON.

## Checkpoint-Specific Fill Rules

For `siteos-connection`, fill `What is needed to continue` with the next minimal input or technical action:

- delegation to `$siteos-auth` when authentication or Organization selection needs repair
- an explicit existing Search Project slug, or a new Search Project slug and display name
- an explicit existing Search Environment slug

Do not run Auth or Organization mutations, mutate another product's Project, fabricate a binding, ask for a Project API key, or edit the project before the Search Project gate is complete.

For `source-confirmation`, fill `What is needed to continue` with a numbered confirmation request for exactly two decision groups.

Decision group 1: sources and result references.

- found document count for each candidate source, including zero-document candidates
- document origin/provenance for each candidate source, such as API service, disk path, code-defined data, database, or external integration
- source scope
- source label
- result strategy or result URL/reference
- exclusions or visibility rules, when applicable

Show every candidate source from the persisted candidate inventory in the checkpoint report. Do not silently omit zero-count candidates; write them as `0 documents` and include the origin evidence that explains why the source is still being shown. Counts and provenance help the User decide; they must not confirm, reject, activate, or mutate sources without the User's source decision.

Decision group 2: search UI placement.

- dedicated search page, or
- one exact existing host-project UI location where search should be embedded

Before presenting the dedicated search page option, inspect whether `/search` can be created safely in the host project. If it is free, make the second numbered request `Confirm UI placement: /search (recommended).` If it is occupied or unsafe, name one concrete nearby fallback URL and the reason it is required.

Persist the second decision in `userDecisions.chosenUiPlacement` before scaffold/source-handler work starts. Do not use `ui-placement-confirmation` as a second routine user checkpoint after sync/query verification. Use it only as a validation or blocker surface when the saved placement is missing, ambiguous, unsafe, impossible in the host framework, or conflicts with host constraints.
