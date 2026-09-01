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
  through safe `siteos forms project status --json` output backed by `.siteos/forms/project.json`
  plus the private CLI binding.
- Select or explicitly create the Forms-owned Environment through `siteos forms environment
  list/create`; mutable Organization, Project, or Environment names/slugs are never canonical
  Project authority.
- Add forms using the same `/api/forms/:formKey` local proxy shape.
- Reuse existing SiteOS submission helper if present.
- Before generating new runtime, inspect the existing SiteOS helper and proxy files first. If the project already has `src/lib/siteos-project-form.*` or `app/api/forms/*`, extend those instead of inventing a parallel implementation.
- For linked Forms projects, sync the form definition before treating the form as complete. Project and Environment selection do not register the form.
- For skill-time SiteOS-backed definition sync, write the definition payload to a local JSON file and run `npx @siteoshq/cli forms definition sync --environment <slug> --input <path> [--json]`.
- When `.siteos/forms/manifest.json` exists, check and sync the manifest instead of syncing definitions one by one.
- For SiteOS-backed submissions, the browser-facing local proxy may stay `/api/forms/:formKey`. The upstream independent Forms API expects a JSON `POST` to `{SITEOS_FORMS_PUBLIC_URL}/api/forms/submissions` with `formKey`, `payload`, `idempotencyKey`, and optional request context fields, authenticated only by the server-only `SITEOS_FORMS_SUBMISSION_CREDENTIAL` value in the `x-siteos-project-forms-credential` header.
- Do not generate nested upstream paths such as `/api/v1/project/forms/{formKey}/submissions` unless that exact route is verified in current source or docs.
- If the upstream response is HTML or any non-JSON payload, treat it as an integration mismatch or wrong endpoint. Normalize the local error instead of surfacing raw HTML-oriented upstream messages to end users.

## Verification

Use the host project's own commands. Prefer:

- formatter/linter
- typecheck
- relevant unit tests
- build
- local definition sync smoke test with `npx @siteoshq/cli forms definition sync --environment <slug> --input <path> [--json]` when SiteOS config is available
- local upstream submit smoke test with `npx @siteoshq/cli forms submit --input <path> [--json]` when SiteOS config is available
- for linked SiteOS projects, verify both the sync endpoint and the submit proxy against the configured `SITEOS_FORMS_PUBLIC_URL` before considering the form finished

Treat these smoke-test outcomes differently:

- definition sync `201`: form created or new version created.
- definition sync `200`: sync succeeded and current version was reused.
- HTML or non-JSON response: wrong route, wrong host, or wrong environment contract.
- JSON `NOT_FOUND`: likely missing remote form registration, or submit ran before definition sync.
- JSON validation/auth errors: runtime is reaching SiteOS, then fix payload or credentials.

If remote registration or submission cannot be tested because API credentials are intentionally not exposed in chat, state that limitation clearly.
