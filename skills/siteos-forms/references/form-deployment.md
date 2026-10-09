# Form publication from chat

Requires the matching SiteOS server and CLI with `forms deploy` and `forms deployment-key` in help.
Do not infer installation from a source checkout; upgrade the CLI when these commands are absent.

The default workflow is agent-managed: when the user asks to add or change a connected form,
generate and check its definitions, publish them to the authorized Environment, and verify the saved
versions within the same task. Do not leave routine publication as a command for the user to run.
This works with any website host and does not require changes to CI. Publication updates SiteOS's
validation and field metadata; deploying the website and configuring Mailchimp forwarding remain
separate operations. UI-only changes do not require publication.

## One-time setup

1. Select the common Project and Environment and connect Forms using the usual SiteOS onboarding.
2. Install the existing submission credential on the website server; it can only send answers.
3. Reuse an installed deployment key for the intended Environment. If publication needs a new key,
   issue it through the authenticated CLI after verifying Project, Environment and access:

   ```sh
   npx @siteoshq/cli forms deployment-key issue --environment <slug> --install --name local-publication --json
   ```

   The key is installed into ignored `.env` as `SITEOS_FORMS_DEPLOYMENT_KEY`; plaintext is never
   printed. Local agent publication uses that file; no hosting secret store is required.
   Keep the key out of browser bundles and hosted application runtime.
   `deployment-key list` shows safe metadata; `revoke --credential <id>` disables an obsolete key.
   To rotate, issue/install a new key, update its authorized consumers, verify publication, then revoke the
   old key. Each key is scoped to one Forms Environment and cannot read answers or alter lifecycle.
4. Configure explicit `SITEOS_FORMS_PUBLIC_URL` in the publication process. Its origin must match
   the intended SiteOS installation. The key selects the Environment; deploy does not use local
   interactive Auth, common Project state, or a fallback Environment.

## Developer handoff and environment examples

Include these blank placeholders in the host project's `.env.example`, with the two key purposes
clearly separated:

```dotenv
SITEOS_FORMS_PUBLIC_URL=https://app.siteos.sh
# Server runtime: submit answers only.
SITEOS_FORMS_API_KEY=
# Optional local publication / trusted CI only; omit from hosted application runtime.
SITEOS_FORMS_DEPLOYMENT_KEY=
```

Developers can edit the field map, regenerate definitions, run tests and build without a deployment
key. To send local test answers they need the selected Environment's API key. To publish changed
rules to their authorized test Environment they need a deployment key; an owner/admin can issue it
with the one-time setup command above. Keep publication access separate from ordinary source access.
During an authorized chat task, the agent checks access and obtains a key when needed; developers
do not need to copy another person's key. Repository access or CLI login alone does not grant
publication rights. Publish only to the requested Environment, and verify Production publication
before deploying changed server code there. An authorized Preview change does not include a
Production release.

`SITEOS_FORMS_API_KEY` is the canonical name from CLI 2.44.0. The previous
`SITEOS_FORMS_SUBMISSION_CREDENTIAL` is a read fallback for existing integrations. A non-empty
canonical value wins; renaming the variable does not rotate the key or change its rights. The CLI
writes the canonical name and also updates a legacy entry if one already exists during issuance or
rotation. Do not add the legacy name to new `.env.example` files.

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

## Agent-managed publication

Wire generation into the host's existing build command; local builds generate without network.
After changing validation or managed field metadata, run the project generator and applicable
checks, then validate the complete manifest:

```sh
npx @siteoshq/cli forms definition check --manifest .siteos/forms/manifest.json --json
```

Load the ignored local `.env` explicitly for publication. With the matching CLI installed globally,
run from the repository root:

```sh
node --env-file=.env "$(command -v siteos)" forms deploy --manifest .siteos/forms/manifest.json --json
```

The CLI does not load `.env` automatically. Do not evaluate it as shell code or print its contents.
For a process that already receives the explicit origin and scoped deployment key, use:

```sh
npx @siteoshq/cli forms deploy --manifest .siteos/forms/manifest.json --json
```

Deploy takes the whole manifest atomically, verifies generated fingerprints and returns the exact
saved versions. Repeating an unchanged publication creates no duplicate versions. Missing entries
never archive/delete forms. Limit one manifest to 100 forms and the API body to 512 KiB; split a
larger inventory into explicitly separate releases or extend the supported contract first.

Compare the returned Environment ID and every form/fingerprint with the intended target and
manifest. Read the definitions back through the supported Forms CLI or MCP. If publication fails,
report the exact blocker and keep the changed server version out of live traffic; do not introduce
a CI dependency as a workaround. For new or materially changed submit paths, verify a synthetic
submission and its full saved receipt in the approved test destination.

## Optional unattended CI publication

Only configure this when the user asks for publication on deployments that run without an agent.
Instructions alone do not execute on a Git push or hosting build. Reuse the same CLI command in
the existing trusted release job after generation and before new server traffic. The job receives
its own Environment-scoped deployment key from its secret store, uses a pinned CLI version, and
stops promotion on publication failure. Do not copy a developer Auth session into CI or require a
particular host. Keep Preview and Production authority separate.

## Runtime versions and rollback

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
