# SiteOS

SiteOS Cloud brings SiteOS services, CLI tooling, Agent workflows, and developer operations into one platform. This repository distributes its public Agent plugin for managed Search, Forms, and Analytics workflows.

Release: 0.3.0.

## Install

### Codex

```sh
codex plugin marketplace add https://github.com/pixel-point/siteos-public.git --ref main
codex plugin add siteos@siteos-public
```

### Claude Code

```sh
claude plugin marketplace add https://github.com/pixel-point/siteos-public.git
claude plugin install siteos@siteos-public
```

## Skills

### Search (`$siteos-search`)

Inspect an external project, configure managed search sources and synchronization, and deliver the supported search runtime and UI workflow.

### Forms (`$siteos-forms`)

Add, migrate, connect, or debug SiteOS-managed forms, including definition registration, synchronization, and submission workflows.

### Analytics (`$siteos-analytics`)

Review health, usage, source coverage, synchronization jobs, diagnostics, and reports for an already linked SiteOS managed Search project.

## Use

Ask your Agent to run the skill that matches the workflow:

```text
$siteos-search inspect this project and configure managed search
$siteos-forms add a managed contact form to this project
$siteos-analytics inspect search health and usage for this linked project
```

## License

License: MIT. Developed by Pixel Point.
