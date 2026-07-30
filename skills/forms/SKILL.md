---
name: siteos-forms
description: Build and connect SiteOS-managed forms in any project or framework. Use when the user asks to add, migrate, debug, or document a form that should submit to SiteOS, register with SiteOS, store submissions in SiteOS, or work without requiring the user to visit SiteOS app. Applies to React, Next.js, TanStack Start, Vite, plain HTML, and other web stacks.
---

# SiteOS Forms

## Core Rule

Build forms through SiteOS's public API or MCP surface, never through direct database access. The skill may create local form code, validation, routes, config files, and API calls, but SiteOS backend owns users, projects, form registration, API keys, email delivery, submissions, storage, and permissions.

Never print project API keys, tokens, or secrets in chat. If a key must be created or rotated, call the SiteOS API flow that emails it to the registered user through SiteOS backend email delivery. Tell the user that the key was sent by email, not what the key is.

Do not inspect secret-bearing environment files or process environment values with output-producing commands such as `cat`, `sed`, `env`, `printenv`, or shell interpolation. Determine credential readiness through SiteOS CLI diagnostics and run the intended SiteOS command without exposing the underlying value. A secret appearing in a tool trace or verification log is a credential leak even when it is not repeated in the final response.

For missing SiteOS linkage, use the CLI-owned SiteOS connection flow from `references/siteos-connection-onboarding.md`. Do not call organization bootstrap/login/project routes directly from the skill. The CLI owns token exchange, local config writing, and secret handling.

Missing SiteOS project, missing repository connection, or missing `.siteos/project.json` is normal onboarding state, not a manual prerequisite. Do not ask the user to visit SiteOS app before a normal forms flow can begin.

A request to add a SiteOS-managed form includes onboarding, project connection, definition sync, and a submission smoke test. Do not reinterpret it as a request for local UI only. Unless the user explicitly asks for an offline prototype, connection is a hard gate: do not edit form code while SiteOS linkage is missing.

Use SiteOS naming exclusively. When a touched target-project file still uses legacy product branding, config directories, environment variables, package scopes, or helper names, replace them with the matching SiteOS surface (`SiteOS`, `.siteos`, `SITEOS_*`, or `@s-os/*`) instead of adding a compatibility alias.

## Workflow

1. Resolve the target project root and pass the SiteOS connection gate.

   - Before inspecting the application stack or editing project files, run `npx @s-os/cli health-check --json` and `npx @s-os/cli org --help` from the target project root.
   - Treat project config plus a project API key as a usable Forms connection. An already linked project may sync forms even when organization config is missing; organization login is needed later only for organization management or signed-in UI handoff.
   - When project config or the project API key is missing, immediately load `references/siteos-connection-onboarding.md` and complete the CLI-owned onboarding flow.
   - If project linkage is missing and organization config is also missing, ask for the user's SiteOS email and organization name now, before implementing the form. These are the normal first inputs for registration, not a final handoff request.
   - Do not create the UI, proxy route, validation code, or definition artifact while linkage is missing. Pause only for the minimum input or one-time email action required by the CLI.
   - After project connection, run health-check again. Continue when project config and the project API key are ready.

2. Detect the project stack and existing conventions.

   - Check package manager, framework, routes/API support, form libraries, validation libraries, UI primitives, env/config patterns, and existing `.siteos/` files.
   - Prefer local project patterns over generic templates.

3. Create or update the form.

   - Build the visible UI in the host project's style.
   - Load `references/form-contract.md` before implementing validation or the registration artifact.
   - Use the host project's established validation library. In a TypeScript/JavaScript project with Zod installed, Zod is mandatory; do not hand-write a schema walker, email regex, or parallel field parser.
   - Keep one form definition whose fields own both their Zod schema and SiteOS managed metadata. Derive the object schema, TypeScript payload type, `schemaJson`, and `normalizedFieldsJson` from that definition. Do not independently maintain equivalent field lists or validation rules.
   - Add a SiteOS form contract that describes managed semantics only.
   - For the SiteOS submission inbox, assign exactly one required, semantically useful field `displayRole: "primary"` and optional supporting fields `displayRole: "secondary"`. Choose roles from the form's meaning, never from property names. Always generate complete field metadata.
   - Keep generated definitions under `.siteos/forms/` and maintain `.siteos/forms/manifest.json` as the project-wide list of managed forms.
   - Leave a project-owned generate/check script so later code changes can regenerate definitions and fail CI on stale artifacts. Generated project scripts must be self-contained; do not add a SiteOS CLI dependency only for these scripts.
   - Keep UI behavior such as success messages, redirects, placeholders, and browser autocomplete in UI code, not in SiteOS registration metadata.

4. Register or sync the form through SiteOS.

   - Use `npx @s-os/cli forms definition sync --environment <slug> --input <path> [--json]` for skill-time definition sync when a linked SiteOS project is available.
   - Prefer `npx @s-os/cli forms definition check --manifest .siteos/forms/manifest.json --json` followed by `npx @s-os/cli forms definition sync --environment <slug> --manifest .siteos/forms/manifest.json --json` when the project has a manifest. This validates every registered definition and rejects duplicate form keys before API writes.
   - For linked SiteOS projects, sync the form definition immediately after creating or changing the form. Do not leave a new form in a submit-only state.
   - Treat definition sync as part of the implementation, not as a manual follow-up step.
   - Re-sync when the validation schema changes, when managed field metadata changes, or when form identity changes.
   - Do not silently delete forms missing from a manifest. A removed form retains its submissions and requires an explicit archive/inactive operation when that API capability is available.
   - Do not write directly to the SiteOS database.
   - If the required CLI/API capability does not exist yet, implement the local form code and clearly report that remote registration is blocked by missing SiteOS capability.
   - Read the safe `ui.url` returned by definition sync and include it as an optional final link. Make clear that the CLI remains fully usable without opening SiteOS UI.
   - If the user asks to open an already signed-in browser, run the safe `ui.openCommand` returned by the CLI (equivalent to `npx @s-os/cli ui open forms --form-id <id>`). This command keeps the short-lived handoff secret out of stdout. Never extract, print, or reconstruct the handoff URL.

5. Add submit runtime.

   - For server-capable projects, add a local server route that reads SiteOS config/env and proxies submissions to SiteOS.
   - Verify the SiteOS submission endpoint contract from local source, existing generated runtime, or SiteOS API docs before writing the proxy. Do not guess path shapes or payload shapes.
   - For static-only projects, prefer a SiteOS public submission endpoint only if the API supports it. Otherwise explain that a serverless route or public endpoint is required.
   - Do not expose secret project credentials to browser bundles.

6. Verify.
   - Run stack-appropriate lint/typecheck/tests.
   - Scan changed target-project files for legacy product names and replace every match that belongs to the SiteOS integration.
   - Smoke-test definition sync through `.siteos/forms/manifest.json` when present; use `npx @s-os/cli forms definition sync --environment <slug> --input <path> [--json]` only as the single-definition fallback.
   - Smoke-test upstream form submission with `npx @s-os/cli forms submit --input <path> [--json]` when a local linked project and scoped `SITEOS_FORMS_SUBMISSION_CREDENTIAL` are available.
   - Confirm successful sync output contains the permanent optional SiteOS form URL. Do not treat opening that URL as a prerequisite for completion.
   - In Zod projects, confirm the server submission boundary calls the shared Zod schema with `safeParse` or `safeParseAsync`, and confirm the definition artifact is generated from that schema.
   - Run the project-owned stale-artifact check and the CLI manifest check when present.
   - Report exactly what was verified and what remains blocked.

## Completion Invariant

Do not report a newly created SiteOS form as complete unless the CLI definition sync succeeded. A local form plus a proxy returning a temporary `503` is unfinished, not a successful SiteOS Forms result. If onboarding needs an email or one-time login action, ask for it at the connection gate and resume the same workflow after the user completes it.

## Reference Files

Load only the reference needed for the task:

- `references/siteos-connection-onboarding.md`: CLI-owned email login, organization token, and project connect flow.
- `references/onboarding-report-template.md`: user-facing form onboarding checkpoint and blocker report shape.
- `references/form-contract.md`: field contract rules, validation ownership, and metadata boundaries.
- `references/api-onboarding.md`: project linking, email-based key delivery, and security rules.
- `references/framework-adapters.md`: implementation patterns for common stacks.

## Non-Negotiables

- Do not expose project API keys in chat, generated docs, screenshots, logs, or comments.
- Do not emit legacy-branded commands, config paths, environment variables, package names, helpers, or compatibility shims.
- Do not ask the user to manually paste a project API key into chat unless there is no safer bootstrap path yet and the user explicitly accepts the risk.
- Do not make the user visit SiteOS app for a normal form flow.
- Do not silently create fake registration. If remote SiteOS registration cannot be completed, say so.
- Do not hardcode production SiteOS URLs when the project already has `apiBaseUrl` or environment-specific config.
- Do not invent SiteOS definition or submission endpoints. Verify the exact upstream route and request shape before generating runtime code.
- Do not duplicate required/optional field metadata when a validation schema is the source of truth.
- Do not store success messages, redirects, placeholders, or browser autocomplete in the SiteOS managed form contract.
