# Form publication from chat

New Zod integrations require Zod 4, `@siteoshq/forms` 0.2+ and CLI 2.45.0+ with `forms deploy --source` in help. The existing Forms server API is unchanged.
Do not infer installation from a source checkout; upgrade the CLI when these commands are absent.

The default workflow is agent-managed: when the user asks to add or change a connected form,
check its source contracts, publish them to the authorized Environment, and verify the saved
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

Developers can edit ordinary Zod schemas, run tests and build without a deployment
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

## Existing Zod schemas and package-owned versions

Keep the original schemas and form resolver. Use `@siteoshq/forms` in a server-only `siteos.forms.ts`, exporting the contract
array as default. See `form-contract.md` for the typed metadata. Browser code
imports only the original validation module. The runtime server and CLI consume
the same registration module; no generated project JSON or custom generator is
needed. Leave the ordinary website build command intact.

The package internally uses the existing `sha256:` contract fingerprint over
canonical `schemaJson` and `normalizedFieldsJson`. It does not change the remote
protocol or require new hosting variables. Full refinements and normalization
run at the website server; SiteOS independently checks the portable output.
Unsupported outputs fail explicitly. Never replace checks with an empty schema.

## Agent-managed publication

After changing schemas or inbox metadata, run the applicable host checks and:

```sh
npx @siteoshq/cli forms definition check --source siteos.forms.ts --json
```

`--source` evaluates trusted local JS/TS like a framework configuration file. It
is not a sandbox. Use it only after establishing trust in the selected project.
The CLI bounds evaluation time/output, suppresses arbitrary source logs and does
not pass deployment credentials or Auth environment state into that process.
Source evaluation must be side-effect free and must not read secrets.

Load the ignored local `.env` explicitly for publication. With the matching CLI
installed globally, run from the repository root:

```sh
node --env-file=.env "$(command -v siteos)" forms deploy --source siteos.forms.ts --json
```

The CLI does not load `.env` automatically. Do not evaluate it as shell code or
print its contents. If the process already receives the explicit origin and
scoped deployment key, use `siteos forms deploy --source siteos.forms.ts --json`.

The complete inventory is validated before the existing atomic publication;
duplicate keys fail before writes. Compare the returned Environment and every
fingerprint with the runtime contracts, then read back saved versions. Unchanged
contracts reuse versions; missing entries never archive or delete forms. The
publication API allows 100 forms and 512 KiB per request. Do not confuse source
execution limits with the publication API limits.

If publication fails, keep changed server code out of live traffic and report
the blocker. Do not add CI publication as a workaround. For an initial integration
or changed submit path, verify the actual browser, saved receipt and downstream
delivery in the approved destination.

## Existing manifests and other validators

Keep the existing `--manifest .siteos/forms/manifest.json` workflow until an
explicit migration. Its project-owned generators and `sourceExportId` versions
remain supported. Do not copy those helpers into a new Zod integration. Other
validators may retain their supported portable-contract path; the package does
not promise adapters for every validation library.

## Optional unattended CI publication

Only configure this when the user asks for publication on deployments that run without an agent.
Instructions alone do not execute on a Git push or hosting build. Reuse the same CLI command in
the existing trusted release job before new server traffic. The job receives
its own Environment-scoped deployment key from its secret store, uses a pinned CLI version, and
stops promotion on publication failure. Do not copy a developer Auth session into CI or require a
particular host. Keep Preview and Production authority separate.

## Runtime versions and rollback

Send `contractVersion: form.contractVersion` (existing manifests use `generatedDefinition.sourceExportId`) from the website server alongside
`formKey`, `payload`, and `idempotencyKey` to `POST /api/forms/submissions`. Never let browser input
select the version, destination or account identity. New and old deployed servers use their own
saved contracts; rollback reuses the old fingerprint without editing SiteOS settings.

Publishing preserves the old active/default version for existing unpinned integrations. Migrate
those integrations to pinned requests; use legacy `definition sync` only when explicitly changing
the unpinned default. Unknown versions fail; archive/delete stop all versions. Version pinning does
not replace compatibility handling for a changed browser-to-host API or server-only business rule.

Verify add/remove/required/limit changes, one accepted browser submission and receipt readback;
verify errors preserve input and an uncertain request retries with its original idempotency key.
