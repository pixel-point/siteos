# <img src="assets/siteos-logo.svg" alt="SiteOS logo" height="42" align="absbottom"> SiteOS

This repository distributes the public SiteOS Agent plugin: one installation with an orchestrator and focused skills for the unified CLI, common Projects, Auth, Pulse, Cookie, Forms, Search, Trace, SEO/GEO, Analytics, Storage, and Integrations.

Release: 2.36.3.

## Install

### Codex

```sh
codex plugin marketplace add https://github.com/pixel-point/siteos.git --ref v2.36.3
codex plugin add siteos@siteos
```

Start a new Codex session after installation to load the plugin.

### Claude Code

```sh
claude plugin marketplace add https://github.com/pixel-point/siteos.git
claude plugin install siteos@siteos
```

Run `/reload-plugins` to load the plugin in the current Claude Code session, or start a new session.

### Agent Skills installers

```sh
npx skills add pixel-point/siteos --all
```

This installs the complete suite in one command so the orchestrator can route to every sibling skill.

## Skills

### SiteOS orchestrator (`$siteos`)

Routes initial setup, unspecified requests, and cross-service work to only the required sibling skills.

### Remote MCP

The plugin connects to `https://app.siteos.sh/mcp` for read-only Project/service discovery, Pulse/Trace/SEO diagnostics, Cookie configuration and aggregates, Forms definitions, submissions and Contacts, SEO audit schedules, Search and Analytics reports, Organization integration status and usage limits. Authorize the intended Organization in the host. Read `siteos_get_context` first, then pass explicit Project and Environment identifiers. MCP does not change the CLI selection. The matching server must be deployed before this plugin release is published.

Use CLI for local files, builds, validation, deployment, CI and operations outside the MCP catalog. Compare origin, Organization, Project and Environment before switching interfaces. See `skills/siteos/references/mcp-and-cli.md`.

### CLI (`$siteos-cli`)

Installs and diagnoses `@siteoshq/cli`, provides the generated command reference, and enforces safe JSON and local-state boundaries.

### Auth (`$siteos-auth`)

Authenticates the CLI and selects the intended Organization. Auth never creates product Projects.

### Pulse (`$siteos-pulse`)

Configures monitoring for the selected common Project, authors versioned Playwright Checks, runs them locally, and builds or deploys bundles.

### Cookie (`$siteos-cookie`)

Configures consent banner drafts, installs the loader, publishes reviewed configuration, and verifies consent behavior.

### Trace (`$siteos-trace`)

Investigates destinations, events, properties, tracking issues and Debugger evidence; configures installation and publishes reviewed tracking rules.

### Integrations (`$siteos-integrations`)

Connects Organization providers and configures explicit notification destinations without sending messages implicitly.

### SEO/GEO (`$siteos-seo`)

Coordinates complete SEO/GEO setup and improvements, or focused audits and research. Studies the website, reviews technical and Performance evidence, GSC, keywords, competitors, backlinks and AI visibility; runs authorized checks and verifies fixes while preserving environment scope, coverage and research credits.

### Search (`$siteos-search`)

Inspect an external project, configure managed search sources and synchronization, deliver search UI, and report Search health, usage and diagnostics.

### Forms (`$siteos-forms`)

Add, migrate, connect, or debug SiteOS-managed forms, including definition registration, synchronization, and submission workflows.

### Storage (`$siteos-storage`)

- Private Project files, verified uploads/downloads, immutable publications and expiring shares through `siteos storage`.
- Read-only MCP catalog metadata; content and mutations use separately authorized CLI grants. Check installed command and server availability before use.

### Analytics (`$siteos-analytics`)

Connect website Analytics, configure optional Cookie or external consent control, register categorical events and verify real collection, conversions and realtime. Cookie and Trace are optional.

## Use

### Codex

```text
$siteos set up SiteOS for this repository
$siteos-cli check whether the unified CLI is ready
$siteos-auth authenticate and select my Organization
$siteos-pulse configure Playwright monitoring for this project
$siteos-search inspect this project and configure managed search
$siteos-forms add a managed contact form to this project
$siteos-storage upload website assets, review duplicate names and publish the selected versions
$siteos-analytics configure website analytics and verify a custom event
$siteos-seo complete SEO/GEO setup, research and verified improvements for this website
```

### Claude Code

```text
/siteos:siteos set up SiteOS for this repository
/siteos:siteos-cli check whether the unified CLI is ready
/siteos:siteos-auth authenticate and select my Organization
/siteos:siteos-pulse configure Playwright monitoring for this project
/siteos:siteos-search inspect this project and configure managed search
/siteos:siteos-forms add a managed contact form to this project
/siteos:siteos-storage upload website assets, review duplicate names and publish the selected versions
/siteos:siteos-analytics configure website analytics and verify a custom event
```

### Storage CLI

Install or update the CLI, select the exact Project and environment, then inspect files before uploading. Connect Storage explicitly only if the Project environment has no library yet.

```sh
npm install --global @siteoshq/cli@latest
siteos project use '<project-id-or-slug>' --organization '<organization-id>' --environment production --json
siteos storage status --json
siteos storage list --json
siteos storage folders list --json
siteos storage upload ./hero.png ./intro.mp4 --dry-run --json
siteos storage upload ./hero.png ./intro.mp4 --on-conflict skip --json
siteos storage --help
```

Use `--on-conflict replace` only when you intend to save new versions of matching files. Private uploads do not become public automatically. Use `siteos storage publish '<file-id>' --version '<version-id>' --media-type image/png --json` for an immutable website asset, or `siteos storage share '<file-id>' --version '<version-id>' --expires-in 3600 --json` for an expiring link. Read the [Storage workflow](skills/siteos-storage/SKILL.md) and [complete CLI command reference](skills/siteos-cli/references/command-reference.md#storage) for downloads, resume, versions, folders, trash and revocation.

## Architecture and contribution boundary

One common Project represents the website or product. Services retain their own data and credentials through explicit attachments. Selecting a Project never provisions a service; new setup and environment creation are explicit coordinated actions.

The plugin and skills in this repository are a generated, public-safe release projection of `pixel-point/siteos-platform/plugins/siteos`. CLI and service changes are made and verified upstream, then reproduced here through the publication manifest and release gates. Open issues in this public repository for bugs or proposals; do not hand-edit generated release files.

## License

License: MIT. Developed by Pixel Point.
