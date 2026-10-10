# SiteOS form contract

The host owns ordinary validation schemas. SiteOS owns registration, portable
output validation, inbox display, versioning and delivery. A connection must not
force the host to rebuild its Zod schema into a service-specific field DSL.

## Existing schemas are the source of validation

Keep the project's installed validator and resolver. In a Zod project, export
normal schemas and infer payload types from them. The browser and server share
those schemas; the server calls `safeParse` or `safeParseAsync` and submits only
the parsed output. Do not write a parallel parser or JSON Schema walker.

Install `@siteoshq/forms` 0.2+ with Zod 4. Use the root import; `/zod4` is a
compatibility alias. Zod 3 is not supported by new SDK releases. If the project
still uses it, migrate Zod and its resolver only within an authorized upgrade;
otherwise preserve the working older integration. A separate server-only registration
module refers to the existing schema:

```ts
import { createForm } from '@siteoshq/forms';
import { contactSchema } from './src/lib/validation';

export const contact = createForm({
  schema: contactSchema,
  formKey: 'contact',
  name: 'Contact form',
  sourcePagePath: '/contact',
  fields: {
    name: { label: 'Name', kind: 'text', displayRole: 'primary' },
    email: { label: 'Email', kind: 'email', displayRole: 'secondary' },
    message: { label: 'Message', kind: 'textarea' },
  },
});
export default [contact];
```

This example assumes those three fields exist in `contactSchema`. The metadata
keys are checked against its output, including optional fields. They describe
only inbox semantics, not validation rules. The package derives required flags,
portable validation and the exact version; the host does not implement that work.

## Metadata boundaries

- `formKey` is stable; names and UI copy do not determine identity.
- `fields` references the schema output keys. Each entry has a useful `label` and
  optional `kind`, `multiple`, `options`, or `displayRole`.
- Exactly one required field is `primary`; supporting fields may be `secondary`.
  Choose these by meaning, never by guessing property names.
- Required/optional rules and constraints come from the schema, not metadata.
- Success copy, redirects, placeholders, autocomplete and layout stay in the UI.
- Credentials, provider mappings and destinations stay outside these contracts.

Keep this module server-only because the adapter uses Node crypto and conversion
code. Browser components import the original schema module, not registration.

## Publication and runtime

The new default has no generated project files or custom build step. CLI 2.45.0+
loads the trusted registration source directly:

```sh
siteos forms definition check --source siteos.forms.ts --json
siteos forms deploy --source siteos.forms.ts --json
```

The package and CLI use the existing JSON Schema wire protocol internally. This
is not a second schema for developers to maintain. `--source` evaluates local
code; it is not a sandbox. Publish only trusted project sources. The CLI checks
the complete inventory before making a remote write; duplicate keys fail.
See `form-deployment.md` for environment authority and publication keys.

The website server sends `contractVersion: contact.contractVersion`. Old and new
servers retain independently pinned versions. The package snapshots the portable
contract so later metadata mutations cannot change the version silently.

## Full Zod versus portable output checks

SiteOS does not execute customer JavaScript. Host-only refinements and business
checks still run at the website server. Do not claim JSON Schema runs arbitrary
Zod logic. Transformations must have a describable output; use an explicit output
schema when it cannot be inferred, for example:

```ts
z.string().transform(Number).pipe(z.number().int());
```

Unsupported output descriptions fail. Never weaken the schema, omit validation,
or claim that every arbitrary transform can be inferred. Keep such host checks
covered by the website tests. JSON-compatible output remains required for HTTP.

## Existing integrations and other validators

Existing manifests, helper files and generated `sourceExportId` versions remain
supported. Do not migrate them incidentally, and never hand-edit generated files.
`assets/define-form.ts` and `assets/contract-version.ts` are legacy compatibility
examples, not the template for a new Zod integration.

Other established validators retain their existing supported portable-contract
workflow. Do not force Zod or promise a package adapter that has not shipped.
