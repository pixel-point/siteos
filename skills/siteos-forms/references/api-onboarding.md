# SiteOS Forms API And Onboarding

## Boundary

The skill must use SiteOS CLI for skill-time SiteOS operations when a CLI command exists. Generated target-project runtime code may call SiteOS APIs directly from server-side project code. The skill must not connect to or mutate the database directly.

```text
skill-time work -> SiteOS CLI -> SiteOS API -> SiteOS domain use cases -> database
generated project runtime -> SiteOS API -> SiteOS domain use cases -> database
```

## Forms Project And Environment

A repository is connected to Forms only when `siteos forms project status --json` reports a
product-owned selection. The tracked `.siteos/forms/project.json` carries the safe Forms name and
slug; the immutable ID stays in the private CLI binding. Never read or write private binding state.

After the Auth prerequisite is ready, select Forms-owned state explicitly:

```bash
npx @siteoshq/cli forms environment list --json
```

If the Environment list is empty, require a user- or task-supplied slug and display name before running:

```bash
npx @siteoshq/cli forms environment create --slug <slug> --name <name> --json
```

The unified CLI obtains the exact Auth grant and product Project context internally for management;
the skill never handles either proof. The CLI installs runtime credentials into the ignored
owner-only project `.env`; do not inspect or print that file.

## Unlinked Forms Project Flow

When the project is not linked:

1. Load `references/siteos-connection-onboarding.md`.
2. Delegate missing Auth or Organization selection to `$siteos-auth`.
3. Run `forms project status --json`, then list, create, or select only the intended Forms Project.
4. After the Forms Project boundary succeeds, list Forms Environments.
5. If none exists, stop for an explicit Environment slug and display name before creating one.
6. After an explicit Environment is selected, use Forms credential metadata to choose initial issue/install or intentional rotate/install.

Do not mutate Auth or another product's Projects from this skill and do not call Auth, Project, or Forms credential-management routes directly. The CLI owns proof exchange and secret installation.

## Credential Handling

- Never use or print Organization tokens, Project API keys, service grants, authorization codes, or scoped credentials.
- Never include credentials in generated markdown instructions or client-side source code.
- Never log credentials during smoke tests.
- Keep runtime credentials server-only.
- Keep the environment-scoped Forms submission credential in
  `SITEOS_FORMS_SUBMISSION_CREDENTIAL`; never reuse the project management API
  key for runtime submissions.
- Use `forms credential list` metadata before `issue --install` or an intentional `rotate --install`; never read the plaintext installation.

## Form Registration

Registration should send:

- project identity/auth
- `formKey`
- `formName`
- schema/contract
- normalized field metadata
- source file/page when known

Registration should be idempotent. If the same schema is unchanged and normalized field metadata is unchanged, reuse the current version. If schema changes or normalized field metadata changes, SiteOS should create a new form version.

For current Forms-linked projects, definition sync should be treated as required before live submit. If a form is created locally but never synced, live submissions can return `NOT_FOUND` even though the Forms Project and Environment selection are valid.

## Definition Sync Runtime

For current SiteOS-linked projects, skill-time definition sync should use:

```bash
npx @siteoshq/cli forms definition sync --environment <slug> --input <path> --json
```

When the project maintains `.siteos/forms/manifest.json`, validate and sync the complete inventory instead:

```bash
npx @siteoshq/cli forms definition check --manifest .siteos/forms/manifest.json --json
npx @siteoshq/cli forms definition sync --environment <slug> --manifest .siteos/forms/manifest.json --json
```

Manifest removal is non-destructive. It does not delete or archive a remote form or its historical submissions.

The skill must invoke this management operation only through the canonical CLI, which acquires a fresh `siteos-forms` / `forms:workspace:write` service grant. Generated project code must not call this management route.

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
npx @siteoshq/cli forms submit --input <path> --json
```

Generated target-project runtime should still use this upstream submission contract unless newer source or docs explicitly override it:

```text
POST {SITEOS_FORMS_PUBLIC_URL}/api/forms/submissions
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

The CLI's hosted default is `https://siteoapp.xui.se` and credential installation writes that
origin to `SITEOS_FORMS_PUBLIC_URL`. Generated runtime must still fail safely when the explicit
installed value is missing or unsafe, and must send only `SITEOS_FORMS_SUBMISSION_CREDENTIAL` as runtime authority.
It must never send an Auth grant, Project context, browser cookie, or Project API key.

If the upstream response is HTML or another non-JSON payload, assume the route or environment contract is wrong and normalize the local error message accordingly.

If the upstream response is a JSON `NOT_FOUND` for a known-good authenticated request, treat that as a likely missing form registration issue before assuming the submit runtime itself is broken.

Use a direct public SiteOS endpoint only when SiteOS API explicitly supports safe public form tokens.
