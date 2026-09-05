---
name: siteos-forms
description: Build and connect SiteOS-managed forms in any project or framework. Use when the user asks to add, migrate, debug, or document a form that should submit to SiteOS, register with SiteOS, store submissions in SiteOS, or work without requiring the user to visit SiteOS app. Applies to React, Next.js, TanStack Start, Vite, plain HTML, and other web stacks.
---

# SiteOS Forms

## Core Rule

Build forms through the unified SiteOS CLI and the Forms-owned runtime API, never through direct database access. The skill may create local form code, validation, routes, config files, and API calls. Auth owns users and Organizations. Forms owns its Projects, repository references, Environments, definitions, scoped credentials, submissions, storage, and product permissions even though its APIs share the SiteOS application origin.

Run `npx @siteoshq/cli auth status --json` before remote Forms operations and delegate missing authentication or Organization selection to `$siteos-auth`. Use `$siteos` for common Project selection and `siteos project connect forms` for explicit Forms setup.

Do not inspect secret-bearing environment files or process environment values with output-producing commands such as `cat`, `sed`, `env`, `printenv`, or shell interpolation. Determine credential readiness through SiteOS CLI diagnostics and run the intended SiteOS command without exposing the underlying value. A secret appearing in a tool trace or verification log is a credential leak even when it is not repeated in the final response.

For missing Forms linkage, use the common Project and explicit environment workflow in `references/siteos-connection-onboarding.md`. The CLI owns service-grant exchange, private binding, and secret installation.

Missing common Project selection is normal onboarding state. Use `siteos project list|create|use|status`, then connect Forms explicitly. The CLI resolves the Forms resource from the common attachment; no second selection or tracked service reference is required. Never inspect or edit private binding state.

A request to add a SiteOS-managed form includes onboarding, project connection, definition sync, and a submission smoke test. Do not reinterpret it as a request for local UI only. Unless the user explicitly asks for an offline prototype, connection is a hard gate: do not edit form code while SiteOS linkage is missing.

Use SiteOS naming exclusively. When a touched target-project file still uses legacy product branding, config directories, environment variables, package scopes, or helper names, replace them with the matching SiteOS surface (`SiteOS`, `.siteos`, `SITEOS_*`, or `@siteoshq/*`) instead of adding a compatibility alias.

## Workflow

1. Resolve the target project root and pass the SiteOS connection gate.
   - Run `npx @siteoshq/cli auth status --json`; delegate only missing Auth or Organization selection to `$siteos-auth`.
   - Run `npx @siteoshq/cli project status --json` and complete common selection through `$siteos` when needed.
   - Run `npx @siteoshq/cli project connect forms --json` only when Forms setup is part of the task and no resource is attached.
   - List Forms environments with `npx @siteoshq/cli forms environment list --json`. Setup uses the selected common environment. Choose it with `npx @siteoshq/cli project environment use <slug> --json`; operational flags accept that common slug. For additional or existing environments, use the common environment workflow in `../siteos/references/projects-and-environments.md`.
   - When Forms Project or Environment selection needs a user decision, load `references/siteos-connection-onboarding.md` and stop before project edits at the first required decision.
   - Do not create the UI, proxy route, validation code, or definition artifact while the connection gate is incomplete.

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
   - Before runtime work, run `npx @siteoshq/cli forms credential list --environment <slug> --json`. For a new environment with no credential metadata, install one with `npx @siteoshq/cli forms credential issue --environment <slug> --install --json`. The compatibility spelling `npx @siteoshq/cli forms credentials issue --environment <slug> --install --json` remains supported, but prefer the singular command. Rotate only when replacement is intentional, using `npx @siteoshq/cli forms credential rotate --environment <slug> --install --json`.
   - Before credential installation, ensure Git ignores the repository's `.env`; the CLI refuses installation otherwise. Never read the installed plaintext result or inspect `.env`; successful CLI output reports only safe installation metadata.
   - The Forms installer writes the credential only. Configure the non-secret `SITEOS_FORMS_PUBLIC_URL` separately for the selected SiteOS installation, preserving other environment entries without printing them. Use the application origin, such as `https://app.siteos.sh`, rather than the Project's website URL. Preserve intentional staging overrides. See `references/api-onboarding.md` for runtime environment loading.
   - Use `npx @siteoshq/cli forms definition sync --environment <slug> --input <path> [--json]` for skill-time definition sync when a linked SiteOS project is available.
   - Prefer `npx @siteoshq/cli forms definition check --manifest .siteos/forms/manifest.json --json` followed by `npx @siteoshq/cli forms definition sync --environment <slug> --manifest .siteos/forms/manifest.json --json` when the project has a manifest. This validates every registered definition and rejects duplicate form keys before API writes.
   - For linked SiteOS projects, sync the form definition immediately after creating or changing the form. Do not leave a new form in a submit-only state.
   - Treat definition sync as part of the implementation, not as a manual follow-up step.
   - Re-sync when the validation schema changes, when managed field metadata changes, or when form identity changes.
   - Do not silently delete forms missing from a manifest. A removed form retains its submissions and requires an explicit archive/inactive operation when that API capability is available.
   - Do not write directly to the SiteOS database.
   - If the required CLI/API capability does not exist yet, implement the local form code and clearly report that remote registration is blocked by missing SiteOS capability.
   - Read the safe `ui.url` returned by definition sync and include it as an optional final link. Make clear that the CLI remains fully usable without opening SiteOS UI.
   - If the user asks for a signed-in browser, use the safe `ui.url` returned by the CLI or the Forms-owned route `/forms/projects/<forms-project-id>`. The shared SiteOS shell uses the canonical host-only Auth session, while Forms retains its own Project authorization rules. Do not construct OAuth, PKCE, or Project handoff material, and never extract, print, or reconstruct a handoff URL.

5. Add submit runtime.
   - For server-capable projects, add a local server route that reads `SITEOS_FORMS_PUBLIC_URL` and the server-only `SITEOS_FORMS_SUBMISSION_CREDENTIAL`, then proxies submissions to the exact Forms-owned endpoint `POST {SITEOS_FORMS_PUBLIC_URL}/api/forms/submissions`.
   - Verify the SiteOS submission endpoint contract from local source, existing generated runtime, or SiteOS API docs before writing the proxy. Do not guess path shapes or payload shapes.
   - For static-only projects, prefer a SiteOS public submission endpoint only if the API supports it. Otherwise explain that a serverless route or public endpoint is required.
   - The runtime credential is Environment-scoped `pfs_` authority only. Do not send an Auth grant, Project context, Project API key, or browser cookie, and do not expose the credential to browser bundles. The CLI defaults to the hosted SiteOS application origin; generated runtime must require the separately configured `SITEOS_FORMS_PUBLIC_URL` so it never submits to production accidentally.

6. Verify.
   - Run stack-appropriate lint/typecheck/tests.
   - Scan changed target-project files for legacy product names and replace every match that belongs to the SiteOS integration.
   - Smoke-test definition sync through `.siteos/forms/manifest.json` when present; use `npx @siteoshq/cli forms definition sync --environment <slug> --input <path> [--json]` only as the single-definition fallback.
   - Smoke-test upstream form submission with `npx @siteoshq/cli forms submit --input <path> [--json]` after loading the repository's runtime environment. `--install` writes `.env`, but `forms submit` reads its process environment and does not load that file automatically. With the shared CLI installed on a POSIX host, use `node --env-file=.env "$(command -v siteos)" forms submit --input <path> --json` from the repository root. A missing-credential message after installation requires loading the environment, not reauthentication or key rotation. Never print credentials or evaluate `.env` as shell code.
   - Confirm successful sync output contains the permanent optional SiteOS form URL. Do not treat opening that URL as a prerequisite for completion.
   - In Zod projects, confirm the server submission boundary calls the shared Zod schema with `safeParse` or `safeParseAsync`, and confirm the definition artifact is generated from that schema.
   - Run the project-owned stale-artifact check and the CLI manifest check when present.
   - Report exactly what was verified and what remains blocked.

## Completion Invariant

Do not report a newly created SiteOS form as complete unless the CLI definition sync succeeded. A local form plus a proxy returning a temporary `503` is unfinished, not a successful SiteOS Forms result. If onboarding needs an email or one-time login action, ask for it at the connection gate and resume the same workflow after the user completes it.

## Reference Files

Load only the reference needed for the task:

- `references/siteos-connection-onboarding.md`: Auth, common Project selection, explicit Forms attachment, environments and credentials.
- `references/onboarding-report-template.md`: user-facing form onboarding checkpoint and blocker report shape.
- `references/form-contract.md`: field contract rules, validation ownership, and metadata boundaries.
- `references/api-onboarding.md`: Forms-owned same-origin routing, scoped credential installation, and security rules.
- `references/framework-adapters.md`: implementation patterns for common stacks.

## Non-Negotiables

- Do not use or expose Organization tokens, Project API keys, service grants, authorization codes, or scoped credentials.
- Do not emit legacy-branded commands, config paths, environment variables, package names, helpers, or compatibility shims.
- Do not ask the user to paste runtime credentials into chat. Authentication interaction belongs to `siteos-auth` and must not be retained or echoed by this skill.
- Do not make the user visit SiteOS app for a normal form flow.
- Do not silently create fake registration. If remote SiteOS registration cannot be completed, say so.
- Do not hardcode a production Forms URL. Require explicit `SITEOS_FORMS_PUBLIC_URL` configuration.
- Do not invent SiteOS definition or submission endpoints. Verify the exact upstream route and request shape before generating runtime code.
- Do not duplicate required/optional field metadata when a validation schema is the source of truth.
- Do not store success messages, redirects, placeholders, or browser autocomplete in the SiteOS managed form contract.
