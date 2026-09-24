# Projects and environments

One Project represents one website/product. Its name is shared; each environment has one website URL managed in Project settings. Production is created with the Project. Select the repository's common Project and environment before service work:

An explicit application, Organization, Project and environment in the user's request is sufficient
authorization to select that existing context. Verify access and identity; do not ask again merely
because the CLI was last used for another website. Check `project --help` for `--organization`;
use `$siteos-cli` if the installed version lacks it.

Before `project connect` or `project update`, verify CLI 2.25.2 or newer with `siteos --version`
(or `npx @siteoshq/cli@latest --version`). Earlier versions can use the global Auth Organization
for these writes even after successful repository selection. Upgrade the CLI or run the current
published package with `npx @siteoshq/cli@latest`; keep the repository binding and global Auth
default unchanged. After the command, compare its safe context and service attachment with the
requested target. Do not create another Project or environment to work around this version defect.

Establish the requested application origin first. With exact IDs and environment supplied, run
`project use` directly, then verify its status and service attachment. Use `project list` for
discovery when needed; reading the previously selected Project is not a prerequisite.

```sh
npx @siteoshq/cli project list --organization <organization-id> --json
npx @siteoshq/cli project use <project-id> --organization <organization-id> --environment <slug> --json
```

Selection saves the Organization, Project and environment for this repository and application.
It does not change the global `auth select` default or provision resources. Service grants use
that bound Organization and the server verifies current access for every grant. Reselecting the
same Project retains its saved environment; selecting a new Project requires `--environment`.
The `project status --json` response includes a safe `context` with application origin,
Organization/Project IDs and environment ID/slug. Match the requested service attachment too.
An access denial never falls back to the global Organization. A different application origin is
a separate installation; use its authenticated session rather than copying credentials.

```sh
npx @siteoshq/cli project status --json
npx @siteoshq/cli project environment list --json
npx @siteoshq/cli project environment use <slug> --json
npx @siteoshq/cli project environment create --name <name> --slug <slug> --url <website-url> --json
npx @siteoshq/cli project environment update <slug> --name <name> --url <website-url> --json
npx @siteoshq/cli project update --name <name> --json
```

Selection is private, repository-specific and shared by every service command. Forms/Search `--environment` and Trace `--environment` accept common catalog slugs and resolve explicit service bindings; omitting the flag uses the selected environment. Never fall back to Production when a requested binding is absent. Runtime credentials still identify their actual service environment; do not rewrite installed runtime values to a common slug.

`project connect <service>` sets up that service in the selected environment. Pulse and Cookie use separate service resources per environment; Forms, Search and Trace retain a parent resource with explicitly bound environments. Integrations connections remain Organization-owned. Creating a common environment prepares resources only in already attached services. Pulse/Cookie/Trace require its URL; without a URL they remain unconfigured. This never copies Production data, publishes configuration, creates runtime credentials or deploys code.

For adoption, inspect existing resource IDs and explicitly map the intended environment:

```sh
npx @siteoshq/cli project environment resources <service> --json
npx @siteoshq/cli project environment connect <service> --environment <project-environment-slug> --resource <service-environment-id> --json
```

All five services support explicit environment bindings. Omit `--resource` only to create a new empty resource. Match IDs from safe CLI output, never names alone. Bindings are immutable and cannot claim a resource already used elsewhere. Preserve installed identifiers and credentials.

Change the website address centrally with `project environment update`; `project update --url` changes Production's address. Project identity updates propagate atomically to attached service resources. Cookie and Trace published configuration remains unchanged until explicitly republished; inspect the returned publication-needed state. Pulse deployment resolves the selected environment's URL and resource identity, including dry runs. `pulse init` uses the common Project slug/name and selected URL by default, and `pulse test` uses that URL unless explicitly overridden for a local test. Never overwrite existing monitoring files implicitly.

Legacy service Project and environment lifecycle commands remain for unbound repositories and resource adoption. Common workflows use `project` commands; do not create a second service selection or tracked Forms/Search reference. Environment deletion/forking is not exposed by the common lifecycle and must not be bypassed with a service-local mutation.
