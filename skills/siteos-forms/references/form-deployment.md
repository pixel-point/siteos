# Automatic form publication

Requires the matching SiteOS server and CLI with `forms deploy` and `forms deployment-key` in help.
Do not infer installation from a source checkout; upgrade the CLI when these commands are absent.

## One-time setup

1. Select the common Project and Environment and connect Forms using the usual SiteOS onboarding.
2. Install the existing submission credential on the website server; it can only send answers.
3. Issue a separate release key:

   ```sh
   npx @siteoshq/cli forms deployment-key issue --environment <slug> --install --name release --json
   ```

   The key is installed into ignored `.env` as `SITEOS_FORMS_DEPLOYMENT_KEY`; plaintext is never
   printed. Install it into the host's deployment-secret store using the approved secret workflow,
   without displaying it. Keep it out of browser bundles and production application runtime.
   `deployment-key list` shows safe metadata; `revoke --credential <id>` disables an obsolete key.
   To rotate, issue/install a new key, update the release secret, verify deployment, then revoke the
   old key. Each key is scoped to one Forms Environment and cannot read answers or alter lifecycle.
4. Configure explicit `SITEOS_FORMS_PUBLIC_URL` in the release environment. Its origin must match
   the intended SiteOS installation. The key selects the Environment; deploy does not use local
   interactive Auth, common Project state, or a fallback Environment.

## One field map and generated versions

Copy `assets/define-form.ts` and `assets/contract-version.ts` into the host project for Zod 4.
Keep its installed Zod version and established TypeScript runner. Adapt schema construction to an
existing mature validator for other stacks; never force users to maintain a second schema.

The project generator collects named form definitions, calls `.definition()`, and appends
`sourceExportId: formsContractVersion(definition)`. Write those generated artifacts and manifest
under `.siteos/forms/`. Derive field metadata from the same field map, including optional fields.

The fingerprint is `sha256:` plus SHA-256 of UTF-8 canonical JSON for the object containing exactly
`schemaJson` and `normalizedFieldsJson`. Sort object keys by Unicode code-unit order recursively,
preserve array order, use JSON string escaping and number serialization. Do not hash names, paths,
form keys, timestamps or the fingerprint itself. Use the supplied serializer unchanged. Keep
artifacts finite JSON values with no undefined values or class instances.

Zod refinements and transforms are not all representable in JSON Schema. Run full `safeParse` or
`safeParseAsync` at the website server and send the parsed output. Generated contracts describe
serialized output. A generator error must fail the build; never replace unsupported schemas with
`{}` or disable server validation. Host-only business checks must be explicit and tested.

## Ordinary build and release

Wire generation into the host's existing build command; local builds generate without network.
In the trusted deployment step, after generation and before new server traffic:

```sh
npx @siteoshq/cli forms deploy --manifest .siteos/forms/manifest.json --json
```

For the local onboarding smoke test, load the ignored `.env` explicitly. With the matching CLI
installed globally, use `node --env-file=.env "$(command -v siteos)" forms deploy --manifest .siteos/forms/manifest.json --json`.
CI receives the key directly through its secret store; do not copy a developer Auth session there.
Use a pinned CLI version once installed in CI. Keep publication failure fatal to the release.
Deploy takes the whole manifest atomically, verifies generated fingerprints and returns the exact
saved versions. Repeating an unchanged publication creates no duplicate versions. Missing entries
never archive/delete forms. Limit one manifest to 100 forms and the API body to 512 KiB; split a
larger inventory into explicitly separate releases or extend the supported contract first.

Send `contractVersion: generatedDefinition.sourceExportId` from the website server alongside
`formKey`, `payload`, and `idempotencyKey` to `POST /api/forms/submissions`. Never let browser input
select the version, destination or account identity. New and old deployed servers use their own
saved contracts; rollback reuses the old fingerprint without editing SiteOS settings.

Publishing preserves the old active/default version for existing unpinned integrations. Migrate
those integrations to pinned requests; use legacy `definition sync` only when explicitly changing
the unpinned default. Unknown versions fail; archive/delete stop all versions. Version pinning does
not replace compatibility handling for a changed browser-to-host API or server-only business rule.

Verify add/remove/required/limit changes, one accepted browser submission and receipt readback;
verify errors preserve input and an uncertain request retries with its original idempotency key.
