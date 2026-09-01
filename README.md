# SiteOS

This repository distributes the public SiteOS Agent plugin: one installation with an orchestrator and focused skills for the unified CLI, Auth, Pulse, Forms, Search, and Search analytics.

Release: 1.1.0.

## Install

### Codex

```sh
codex plugin marketplace add https://github.com/pixel-point/siteos.git --ref v1.1.0
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

### CLI (`$siteos-cli`)

Installs and diagnoses `@siteoshq/cli`, provides the generated command reference, and enforces safe JSON and local-state boundaries.

### Auth (`$siteos-auth`)

Authenticates the CLI and selects the intended Organization. Auth never creates product Projects.

### Pulse (`$siteos-pulse`)

Creates or selects a Pulse Project, authors and maintains versioned Playwright Checks, runs them locally, and builds or deploys bundles.

### Search (`$siteos-search`)

Inspect an external project, configure managed search sources and synchronization, and deliver the supported search runtime and UI workflow.

### Forms (`$siteos-forms`)

Add, migrate, connect, or debug SiteOS-managed forms, including definition registration, synchronization, and submission workflows.

### Analytics (`$siteos-analytics`)

Review health, usage, source coverage, synchronization jobs, diagnostics, and reports for an already linked SiteOS managed Search project.

## Use

### Codex

```text
$siteos set up SiteOS for this repository
$siteos-cli check whether the unified CLI is ready
$siteos-auth authenticate and select my Organization
$siteos-pulse configure Playwright monitoring for this project
$siteos-search inspect this project and configure managed search
$siteos-forms add a managed contact form to this project
$siteos-analytics inspect search health and usage for this linked project
```

### Claude Code

```text
/siteos:siteos set up SiteOS for this repository
/siteos:siteos-cli check whether the unified CLI is ready
/siteos:siteos-auth authenticate and select my Organization
/siteos:siteos-pulse configure Playwright monitoring for this project
/siteos:siteos-search inspect this project and configure managed search
/siteos:siteos-forms add a managed contact form to this project
/siteos:siteos-analytics inspect search health and usage for this linked project
```

## Architecture and contribution boundary

Pulse, Forms, and Search own independent Projects. Matching names or slugs never imply shared identity, and configuring one service does not provision another.

The plugin and skills in this repository are a generated, public-safe release projection of `pixel-point/siteos-platform/plugins/siteos`. CLI and service changes are made and verified upstream, then reproduced here through the publication manifest and release gates. Open issues in this public repository for bugs or proposals; do not hand-edit generated release files.

## License

License: MIT. Developed by Pixel Point.
