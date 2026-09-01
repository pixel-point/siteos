# SiteOS Forms Onboarding Report Template

Use this template for user-facing reports whenever the form flow reaches a user decision checkpoint, a real blocker, or a substantial onboarding progress point.

## Standard Onboarding Report

```text
SiteOS Forms Onboarding Flow

<One short sentence explaining the exact form work currently being done.>

Already completed:
- <Completed step in simple user-facing language>
- <Completed step in simple user-facing language>

Current step:
<One or two short sentences explaining the current step.>

What is needed to continue:
<Exact user decision needed now, or the exact technical action the agent will perform next when no user decision is needed.>

After that I will continue with the following steps:
- <Remaining step>
- <Remaining step>
- <Remaining step>

Status:
- Canonical Project preflight: <ready | delegated-to-siteos-auth | unavailable | unknown>
- SiteOS connection: <ready | not-ready | api-blocked | unknown>
- Canonical Project binding: <present | missing | malformed | mismatched | unknown>
- Canonical Project ID: <immutable-id> | not configured | unknown
- Project display metadata: <name> (<slug>) | unavailable | unknown
- Forms attachment: <recorded:lifecycle | missing | unknown>
- Forms Environment: <slug> (<name>) | selection-required | creation-required | unknown
- Forms submission credential: <installed | missing | rotation-required | unknown>
- Form implementation: <path> | not added yet | not found | unknown
- Form contract: <formKey> | not added yet | not synced | synced | unknown
- Definition sync: <not attempted | succeeded | failed | blocked | unknown>
- Submit proxy: <path> | not added yet | not found | unknown
- Submit smoke test: <not attempted | succeeded | failed | blocked | unknown>
```

## Blocker Report

```text
SiteOS Forms Onboarding Flow

<One short sentence explaining the exact work that was in progress.>

Already completed:
- <Completed step in simple user-facing language>
- <Completed step in simple user-facing language>

Blocked:
<Short, honest explanation of the blocker and the blocking evidence.>

What is needed to continue:
<Exact unblock action required from the user, SiteOS API, credentials, project code, or environment.>

After that I will continue with the following steps:
- <Remaining step>
- <Remaining step>
- <Remaining step>

Status:
- Canonical Project preflight: <ready | delegated-to-siteos-auth | unavailable | unknown>
- SiteOS connection: <ready | not-ready | api-blocked | unknown>
- Canonical Project binding: <present | missing | malformed | mismatched | unknown>
- Canonical Project ID: <immutable-id> | not configured | unknown
- Project display metadata: <name> (<slug>) | unavailable | unknown
- Forms attachment: <recorded:lifecycle | missing | unknown>
- Forms Environment: <slug> (<name>) | selection-required | creation-required | unknown
- Forms submission credential: <installed | missing | rotation-required | unknown>
- Form implementation: <path> | not added yet | not found | unknown
- Form contract: <formKey> | not added yet | not synced | synced | unknown
- Definition sync: <not attempted | succeeded | failed | blocked | unknown>
- Submit proxy: <path> | not added yet | not found | unknown
- Submit smoke test: <not attempted | succeeded | failed | blocked | unknown>
```

## Language Rules

- Keep the opening work sentence to one short sentence.
- Write `Already completed` in simple user-facing language. Do not turn it into a file diff.
- Keep `Current step` to one or two sentences.
- In `What is needed to continue`, name one exact decision, confirmation, or unblock action. If no user input is needed, name the exact technical action the agent is continuing with.
- In blocker reports, state the reason first, then the exact unblock action.
- Redact all secrets. Never print project API keys, one-time login tokens, bearer tokens, raw auth headers, or full linkage JSON.

## Checkpoint-Specific Fill Rules

For missing Auth or Organization selection, delegate the exact repair to `$siteos-auth` and stop. For Forms Project selection, use the Forms-owned CLI workflow and report the required slug/name decision.

- an explicit Forms Environment slug and display name when none exists
- the exact next CLI-owned technical action when no user input is needed

Names and slugs are Forms-local selection only. Do not fabricate an immutable binding, couple the
selection to another product, fall back to a legacy command, ask for a Project API key, or continue
project edits while the Forms binding is missing.

For form implementation, stop only for real product choices such as form purpose, required fields, destination page, or submit UX when they cannot be inferred from the user's request or existing project conventions.

When a step can continue automatically, do not present it as a user checkpoint. Use `What is needed to continue` to state the next technical action the agent is taking.
