# SiteOS Form Contract

## Purpose

The contract describes platform-managed form semantics so SiteOS can register, validate, store, display, and later notify on submissions. It is not a host-project visual UI schema and should not contain component styling or layout behavior.

Runtime validation has one source of truth. The SiteOS `schemaJson` registration value must be generated from that source, not maintained as an independent copy.

## Recommended Contract Shape

```ts
type SiteOSFormContract = {
  formKey: string;
  formName?: string;
  schema: unknown;
  fields: SiteOSFormFieldContract[];
  spamProtection?: {
    honeypot?: boolean;
    turnstile?: boolean;
  };
};

type SiteOSFormFieldContract = {
  name: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "checkbox";
  label?: string;
  displayRole?: "primary" | "secondary";
  options?: Array<{ label: string; value: string }>;
  multiple?: boolean;
};
```

## One Definition, Not Parallel Schemas

For TypeScript projects, prefer a small project-owned `defineSiteOSForm` helper whose field entries contain the runtime schema and managed metadata together:

```ts
const contactForm = defineSiteOSForm({
  formKey: "contact",
  name: "Contact form",
  sourcePagePath: "/contact",
  fields: {
    name: {
      schema: z.string().trim().min(2).max(80),
      label: "Name",
      kind: "text",
      displayRole: "primary",
    },
    email: {
      schema: z.string().email(),
      label: "Email",
      kind: "email",
      displayRole: "secondary",
    },
    message: {
      schema: z.string().trim().min(10).max(2000),
      label: "Message",
      kind: "textarea",
    },
  },
});

export const contactFormSchema = contactForm.schema;
export type ContactFormPayload = z.infer<typeof contactFormSchema>;
```

The helper builds `z.object(...)` from the field schemas and generates `schemaJson` plus `normalizedFieldsJson` from the same keys. A field must never be declared once in Zod and again in an unrelated hand-written metadata array.

## Ownership Rules

- `formKey`: Stable machine key. Use kebab-case or slug-like names. Do not derive from display copy that changes often.
- `formName`: Human label for SiteOS UI.
- `schema`: Source of truth for runtime validation and required/optional fields.
- `fields`: Source of truth for SiteOS managed metadata and field display in SiteOS UI.
- `label`: Useful for SiteOS UI and normalized submission display.
- `displayRole`: SiteOS inbox semantics. Every form must have exactly one required `primary` field for the submission title and may have any number of `secondary` fields for supporting context. Choose roles from form semantics, never from property names.
- `options`: Keep for select-like fields; useful for future SiteOS details and validation/UI inspection.
- `multiple`: Keep for array/multiselect semantics.
- `spamProtection`: Platform concern; keep at form level.

## What Must Stay Out

- `required`: derive from schema.
- `successMessage`, `successMode`, `successRedirectUrl`: UI behavior.
- `placeholder`, `autocomplete`, `className`, layout props: UI behavior.
- endpoint URL, project ID, project API key, export version: export/runtime binding, not component contract.

## Consistency Checks

Fail fast when:

- A contract field is missing from the validation schema.
- The schema contains a field missing from the contract.
- A field type is incompatible with schema shape, such as checkbox with string schema.
- `multiple` is used on a non-array schema.
- The contract does not declare exactly one `displayRole: "primary"` field.
- The primary display field is optional in the validation schema.

Do not require exact zod chain matching. Check compatibility with schema shape.

## TypeScript And JavaScript Validation

- If the project already uses Zod, use it. Do not replace it with custom `typeof` loops, JSON Schema walkers, or email regular expressions.
- If the project has no validation library and package changes are allowed, add Zod. If the project already standardizes on another mature schema validator, preserve that convention instead of adding a second validation system.
- Export one named form schema, infer the payload type from it, and call `safeParse` or `safeParseAsync` at the server submission boundary. Return structured field errors without exposing upstream internals.
- When React Hook Form is present, use its Zod resolver rather than maintaining separate client validation rules.
- Do not cast an unchecked record to the payload type. The validated result from the schema is the payload.

## Generating SiteOS Schema JSON

Generate the CLI definition artifact from the runtime schema and keep the generator in the project so later schema changes can be re-synced safely.

- Zod 4: use `z.toJSONSchema(formSchema, { target: "draft-07" })`.
- Zod 3: use a compatible `zod-to-json-schema` version with the same exported form schema.
- Use the project's existing TypeScript runner when available. Otherwise add a small project-owned generator with the least additional tooling required by the host project.
- Write the generated artifact under a predictable ignored or project-owned path such as `.siteos/forms/<form-key>.definition.json`.
- Add SiteOS-only metadata (`formKey`, `name`, `normalizedFieldsJson`, `sourcePagePath`) around the generated `schemaJson`; do not copy validation constraints into that metadata.
- Run the generator immediately before `forms definition sync` and fail if generation or sync fails.

Maintain a versioned project manifest next to the generated artifacts:

```json
{
  "version": 1,
  "forms": ["contact.definition.json", "demo-request.definition.json"]
}
```

Manifest paths are relative to the manifest file. Each `formKey` must be unique. Validate the complete set before writing remotely:

```bash
npx @s-os/cli forms definition check --manifest .siteos/forms/manifest.json --json
npx @s-os/cli forms definition sync --environment <slug> --manifest .siteos/forms/manifest.json --json
```

The manifest is an inventory, not a deletion instruction. Removing a path does not delete or archive its remote form because historical submissions must remain addressable.

The expected dependency direction is:

```text
shared Zod schema -> server safeParse
                  -> JSON Schema generator -> SiteOS definition JSON -> CLI sync
```

Avoid the reverse direction (`definition JSON -> custom runtime parser`). It recreates a validator incompletely and caused the hand-written email/length validation seen in the failed form run.

## Stack Guidance

- TypeScript/React projects: use Zod when present; otherwise add it when the project has no established validator and dependency changes are allowed.
- Projects with another validation layer: use that layer as source of truth and map to SiteOS field metadata.
- Plain HTML projects: create a JSON-schema-like contract only if no stronger local validation exists.
