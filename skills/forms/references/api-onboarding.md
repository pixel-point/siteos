# SiteOS Forms API And Onboarding

## Boundary

The skill must use SiteOS CLI for skill-time SiteOS operations when a CLI command exists. Generated target-project runtime code may call SiteOS APIs directly from server-side project code. The skill must not connect to or mutate the database directly.

```text
skill-time work -> SiteOS CLI -> SiteOS API -> SiteOS domain use cases -> database
generated project runtime -> SiteOS API -> SiteOS domain use cases -> database
```

## Project Linking

A project is linked when local config exists, usually under `.siteos/project.json` or equivalent.

Expected safe config values:

- project identity or slug
- `apiBaseUrl`
- non-secret metadata needed by tooling

Resolve `apiBaseUrl` through `SITEOS_API_BASE_URL`, then the stored SiteOS connection, then `https://siteos.xui.se`.

Secret values must live in environment files or secure local storage according to the host project's convention. Do not print them.

## Unlinked Project Flow

When the project is not linked:

1. Load `references/siteos-connection-onboarding.md`.
2. Ask only for the minimum missing user decision, usually email and organization/project name.
3. Run the CLI-owned bootstrap/login/project connect flow.
4. Let SiteOS backend create or find the user and organization.
5. Let SiteOS backend create or link the project and credentials.
6. Let the CLI write local project config and secret-bearing values to approved local destinations.
7. Run SiteOS health-check before definition sync.

Do not call organization bootstrap, login, or project-connect API routes directly from the skill. The CLI owns token exchange, local config writing, and secret handling.

## Credential Handling

- Never print project API keys in chat.
- Never include keys in generated markdown instructions.
- Never put keys in client-side source code.
- Never log keys during smoke tests.
- Prefer server env vars for secrets.
- Keep the environment-scoped Forms submission credential in
  `SITEOS_FORMS_SUBMISSION_CREDENTIAL`; never reuse the project management API
  key for runtime submissions.
- If a key is returned by a current internal API to CLI-owned code, do not echo it; write it only to the approved local secret destination if that is explicitly part of the CLI/API contract.

## Form Registration

Registration should send:

- project identity/auth
- `formKey`
- `formName`
- schema/contract
- normalized field metadata
- source file/page when known

Registration should be idempotent. If the same schema is unchanged and normalized field metadata is unchanged, reuse the current version. If schema changes or normalized field metadata changes, SiteOS should create a new form version.

For current SiteOS-linked projects, definition sync should be treated as required before live submit. If a form is created locally but never synced, live submissions can return `NOT_FOUND` even though `.siteos/project.json` is present and valid.

## Definition Sync Runtime

For current SiteOS-linked projects, skill-time definition sync should use:

```bash
npx @s-os/cli forms definition sync --environment <slug> --input <path> --json
```

When the project maintains `.siteos/forms/manifest.json`, validate and sync the complete inventory instead:

```bash
npx @s-os/cli forms definition check --manifest .siteos/forms/manifest.json --json
npx @s-os/cli forms definition sync --environment <slug> --manifest .siteos/forms/manifest.json --json
```

Manifest removal is non-destructive. It does not delete or archive a remote form or its historical submissions.

The input JSON should use this canonical upstream contract unless newer source or docs explicitly override it:

```text
POST {apiBaseUrl}/api/v1/project/forms/environments/{environmentSlug}/definitions
Authorization: Bearer <project-api-key>
Content-Type: application/json
```

```json
{
  "formKey": "contact-main",
  "name": "Contact form",
  "sourcePagePath": "/contact",
  "schemaJson": {
    "type": "object",
    "properties": {
      "email": {
        "type": "string"
      }
    },
    "required": ["email"]
  },
  "normalizedFieldsJson": [
    {
      "key": "email",
      "label": "Email",
      "kind": "email",
      "displayRole": "primary"
    }
  ],
  "sourceExportId": "optional"
}
```

Expected success response fields:

- `success`
- `formId`
- `formKey`
- `activeVersionId`
- `version`
- `createdForm`
- `createdVersion`

Treat `201` as either first registration or new version creation. Treat `200` as successful no-op sync where the current active version was reused.

Do not invent alternate definition sync paths or payload fields unless they are verified in current SiteOS source or documentation.

## Submission Runtime

Browser submit should normally call a local project endpoint:

```text
browser -> local /api/forms/:formKey -> SiteOS API -> SiteOS storage
```

The local endpoint reads SiteOS config and credentials server-side, validates basic request shape, and proxies to SiteOS. This keeps credentials out of the browser.

For skill-time upstream smoke tests, use:

```bash
npx @s-os/cli forms submit --input <path> --json
```

Generated target-project runtime should still use this upstream submission contract unless newer source or docs explicitly override it:

```text
POST {apiBaseUrl}/api/forms/submissions
x-siteos-project-forms-credential: <environment-scoped-forms-credential>
Content-Type: application/json
```

```json
{
  "formKey": "contact-main",
  "payload": {
    "email": "person@example.com"
  },
  "idempotencyKey": "uuid-or-stable-key",
  "sourceUrl": "https://example.com/contact",
  "userAgent": "optional",
  "ipAddress": "optional"
}
```

Do not switch to a project API-key submission path or a form-key path such as `/api/v1/project/forms/{formKey}/submissions`; the scoped credential selects the project environment and the payload selects the form.

If the upstream response is HTML or another non-JSON payload, assume the route or environment contract is wrong and normalize the local error message accordingly.

If the upstream response is a JSON `NOT_FOUND` for a known-good authenticated request, treat that as a likely missing form registration issue before assuming the submit runtime itself is broken.

Use a direct public SiteOS endpoint only when SiteOS API explicitly supports safe public form tokens.
