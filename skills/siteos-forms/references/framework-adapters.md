# Framework Adapters

## Stack Detection

Inspect before editing:

- package manager and scripts
- framework: Next.js, TanStack Start, Vite/React, Remix, Astro, plain HTML, other
- server route support
- validation library
- existing form components
- UI library and styling conventions
- env/config convention

## Next.js App Router

- Put UI in the appropriate component/page location.
- Add a route handler such as `app/api/forms/[formKey]/route.ts`.
- The route reads server env/config and proxies submissions to SiteOS.
- Keep project credentials server-only.
- If Zod exists, export one shared Zod schema and validate the route payload with `safeParse` or `safeParseAsync`; never hand-roll a JSON Schema parser or email regex.
- If React Hook Form exists, use the Zod resolver so client and server validation share the same schema.
- Generate the SiteOS definition JSON from the shared validation schema as described in `form-contract.md` before syncing it.
- Prefer a project-owned `defineSiteOSForm` helper so the Zod field schema and managed field metadata are declared together, then generate the definition manifest from those declarations.

## TanStack Start

- Use TanStack-native server routes/functions according to the project convention.
- Keep route files thin and move reusable SiteOS proxy logic into a local helper.
- Preserve SSR and hydration safety; do not read browser-only APIs during server render.

## Vite/React Without Server

- Build the form UI and validation locally.
- Check if the deployed environment has serverless functions.
- If yes, add the function/proxy in the platform's expected directory.
- If no, require a SiteOS public form token endpoint before enabling real submission.

## Plain HTML

- Add semantic HTML form markup.
- Add progressive enhancement JavaScript only if needed.
- Use a server/proxy endpoint when available.
- Avoid embedding secrets in static HTML.

## Existing SiteOS-Exported Projects

- Preserve existing generated helper patterns, but establish Forms repository selection only
  through safe `siteos project status --json` output and its Forms attachment
  plus the private CLI binding.
- Select or explicitly create the shared Project Environment through `siteos project environment
  list/create`; mutable Organization, Project, or Environment names/slugs are never canonical
  Project authority.
- Add forms using the same `/api/forms/:formKey` local proxy shape.
- Reuse existing SiteOS submission helper if present.
- Before generating new runtime, inspect the existing SiteOS helper and proxy files first. If the project already has `src/lib/siteos-project-form.*` or `app/api/forms/*`, extend those instead of inventing a parallel implementation.
- For linked Forms projects, sync the form definition before treating the form as complete. Project and Environment selection do not register the form.
- Use `form-deployment.md` for automatic build generation, atomic `forms deploy --manifest .siteos/forms/manifest.json`, and server-pinned `contractVersion`. Keep legacy `definition sync` for explicit unpinned-default changes only.
- When `.siteos/forms/manifest.json` exists, check and sync the manifest instead of syncing definitions one by one.
- For SiteOS-backed submissions, the browser-facing local proxy may stay `/api/forms/:formKey`. The upstream Forms-owned API on the shared SiteOS origin expects a JSON `POST` to `{SITEOS_FORMS_PUBLIC_URL}/api/forms/submissions` with `formKey`, `contractVersion` from the generated artifact, `payload`, `idempotencyKey`, and optional request context fields, authenticated only by the server-only `SITEOS_FORMS_SUBMISSION_CREDENTIAL` value in the `x-siteos-project-forms-credential` header.
- Do not generate nested upstream paths such as `/api/v1/project/forms/{formKey}/submissions` unless that exact route is verified in current source or docs.
- If the upstream response is HTML or any non-JSON payload, treat it as an integration mismatch or wrong endpoint. Normalize the local error instead of surfacing raw HTML-oriented upstream messages to end users.

## Verification

Use the host project's own commands. Prefer:

- formatter/linter
- typecheck
- relevant unit tests
- build
- release publication smoke test with `npx @siteoshq/cli forms deploy --manifest .siteos/forms/manifest.json --json`
- local upstream submit smoke test with `npx @siteoshq/cli forms submit --input <path> [--json]` when SiteOS config is available
- for linked SiteOS projects, verify both the sync endpoint and the submit proxy against the configured `SITEOS_FORMS_PUBLIC_URL` before considering the form finished

Treat these smoke-test outcomes differently:

- Definition sync `200` or `201`: inspect `createdForm` and `createdVersion` in the result to
  distinguish creation from reuse. The current Forms handler also returns `201` when it reuses
  an unchanged version; HTTP status alone is not version-creation evidence.
- HTML or non-JSON response: wrong route, wrong host, or wrong environment contract.
- JSON `NOT_FOUND`: missing form or exact version in the selected runtime Environment. Regenerate/publish the matching contract; do not drop `contractVersion` to bypass the error.
- JSON validation/auth errors: runtime is reaching SiteOS, then fix payload or credentials.

Keep the same idempotency key when retrying an unchanged submission after an uncertain response.
Forms replays the original receipt for the same Environment, form, key and JSON payload, including
when the active schema has changed since acceptance. Different data under that key returns
`409 CONFLICT`. Older deployed servers can still return `409` for unchanged retries: explain the
uncertainty and read back the receipt. Never generate a new key automatically after an uncertain
response or treat a conflict as proof of successful delivery.

If remote registration or submission cannot be tested because API credentials are intentionally not exposed in chat, state that limitation clearly.
