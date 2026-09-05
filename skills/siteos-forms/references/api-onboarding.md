# SiteOS Forms API And Onboarding

## Boundary

The skill must use SiteOS CLI for skill-time SiteOS operations when a CLI command exists. Generated target-project runtime code may call SiteOS APIs directly from server-side project code. The skill must not connect to or mutate the database directly.

```text
skill-time work -> SiteOS CLI -> SiteOS API -> SiteOS domain use cases -> database
generated project runtime -> SiteOS API -> SiteOS domain use cases -> database
```

## Forms Project And Environment

A repository uses the common Project selection and its Forms attachment, reported by `siteos project status --json`. The CLI keeps immutable resource IDs private. New setup prepares the Project environments; existing resources require explicit environment binding. Load `siteos-connection-onboarding.md` for setup.

```sh
npx @siteoshq/cli forms environment list --json
npx @siteoshq/cli project environment create --slug <slug> --name <name> --json
```

The unified CLI obtains the exact Auth grant and product Project context internally for management;
the skill never handles either proof. The CLI installs runtime credentials into the ignored
owner-only project `.env`; do not inspect or print that file.

Ensure `.env` is ignored before running `credential issue --install`. The Forms installer writes
`SITEOS_FORMS_SUBMISSION_CREDENTIAL` only; it does not install `SITEOS_FORMS_PUBLIC_URL`. Configure
that non-secret URL separately for the selected SiteOS application, preserving all other entries
without printing the file. Production uses `https://app.siteos.sh`; the separate staging
installation uses `https://siteosapp.xui.se`. A Project's website URL is not its Forms API origin.

## Unlinked Forms Project Flow

When the project is not linked:

1. Load `references/siteos-connection-onboarding.md`.
2. Delegate missing Auth or Organization selection to `$siteos-auth`.
3. Run `project status --json`, select the intended common Project and explicitly connect Forms.
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

For skill-time upstream smoke tests with the runtime environment already loaded, use:

```bash
npx @siteoshq/cli forms submit --input <path> --json
```

The CLI reads process environment values; saving `.env` does not load them into a later command.
For the shared globally installed CLI on POSIX hosts with Node.js 22+, load the file safely with:

```sh
node --env-file=.env "$(command -v siteos)" forms submit --input <path> --json
```

On other hosts use the project's normal environment-loading runner. Do not print the credential,
source `.env` as shell code, or issue another key to repair an unloaded environment. Keep the
explicit API origin in the loaded environment when testing staging.

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

The CLI's hosted default is `https://app.siteos.sh`; the credential installer does not write the
API origin. Generated runtime must fail safely when the explicitly configured
`SITEOS_FORMS_PUBLIC_URL` is missing or unsafe, and must send only `SITEOS_FORMS_SUBMISSION_CREDENTIAL` as runtime authority.
It must never send an Auth grant, Project context, browser cookie, or Project API key.

If the upstream response is HTML or another non-JSON payload, assume the route or environment contract is wrong and normalize the local error message accordingly.

If the upstream response is a JSON `NOT_FOUND` for a known-good authenticated request, treat that as a likely missing form registration issue before assuming the submit runtime itself is broken.

Use a direct public SiteOS endpoint only when SiteOS API explicitly supports safe public form tokens.
