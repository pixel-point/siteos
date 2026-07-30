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
- SiteOS connection: <ready | not-ready | api-blocked | unknown>
- SiteOS linkage: <present | missing | malformed | unknown>
- SiteOS project: <name> (<slug>) | not configured | unknown
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
- SiteOS connection: <ready | not-ready | api-blocked | unknown>
- SiteOS linkage: <present | missing | malformed | unknown>
- SiteOS project: <name> (<slug>) | not configured | unknown
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

For SiteOS connection, fill `What is needed to continue` with the next minimal input or technical action:

- email address for organization bootstrap
- organization name only when it cannot be inferred
- existing project vs new project only when the CLI project list is ambiguous
- project slug/name only when creating a new project and no safe default is obvious
- the exact next CLI-owned technical action when no user input is needed

Do not ask the user to manually create a SiteOS project, manually connect a repository, provide `.siteos/project.json`, or paste a project API key into chat as a prerequisite.

For form implementation, stop only for real product choices such as form purpose, required fields, destination page, or submit UX when they cannot be inferred from the user's request or existing project conventions.

When a step can continue automatically, do not present it as a user checkpoint. Use `What is needed to continue` to state the next technical action the agent is taking.
