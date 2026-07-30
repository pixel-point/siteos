# SiteOS Connection Onboarding

Use this reference when a target repository is not yet connected to SiteOS, or when `.siteos/project.json` is malformed enough that search readiness cannot be checked safely.

The normal starting prerequisites are only a local external repository and the packaged `siteos-search` skill. A missing SiteOS project, missing repository connection, or missing `.siteos/project.json` is onboarding state, not a manual setup prerequisite.

The connection flow is CLI-owned. The skill may run SiteOS CLI commands and inspect safe command status, but it must not call organization API routes directly and must not read, print, or persist raw credential values.

## Safe State

Record SiteOS connection progress through `scripts/session-state-cli.mjs` in the `siteosConnection` context object and the `siteos-connection` onboarding step. Do not read or import `scripts/session-state.mjs` directly.

Safe fields include:

- `linkageStatus`: `ready`, `missing`, `malformed`, `not-ready`, `api-blocked`, or `unknown`
- `apiBaseUrlSource`: `env`, `config`, or `default`
- `apiBaseUrl`: the selected API base URL
- `organizationAuthStatus`: `missing`, `email-requested`, `logged-in`, or `unknown`
- `organizationSlug`
- `projectId`
- `projectName`
- `projectSlug`
- `commandCategory`: `health-check`, `org-bootstrap`, `org-login`, `project-list`, `project-new`, or `project-connect`
- `configPath`
- `healthCheckStatus`
- `lastCheckedAt`

Do not store raw one-time login tokens, organization tokens, project API keys, delete tokens, bearer headers, full CLI commands that contain tokens, or full `.siteos/project.json` content.

Use these exact session commands during SiteOS connection onboarding:

```bash
# After the initial probe shows a missing connection and no logged-in org.
SESSION_FILE="$(
  node .agents/skills/search/scripts/session-state-cli.mjs init-onboarding \
    --project-root "$PWD" \
    --linkage-status missing \
    --organization-auth-status email-requested \
    --command-category health-check \
    --health-check-status not-ready \
    --output path
)"

node .agents/skills/search/scripts/session-state-cli.mjs start-step \
  --session-file "$SESSION_FILE" \
  --step siteos-connection

node .agents/skills/search/scripts/session-state-cli.mjs add-finding \
  --session-file "$SESSION_FILE" \
  --message "SiteOS CLI health-check reported that the project is not connected."

node .agents/skills/search/scripts/session-state-cli.mjs add-finding \
  --session-file "$SESSION_FILE" \
  --message "SiteOS CLI org probe did not report a logged-in organization and requested bootstrap input."

node .agents/skills/search/scripts/session-state-cli.mjs record-blocker \
  --session-file "$SESSION_FILE" \
  --code bootstrap_email_required \
  --message "SiteOS organization bootstrap requires an email address because no logged-in organization was found by the CLI org probe."
```

After the user provides the email and bootstrap/login succeeds, clear the blocker and update the safe connection state:

```bash
node .agents/skills/search/scripts/session-state-cli.mjs clear-blockers \
  --session-file "$SESSION_FILE"

node .agents/skills/search/scripts/session-state-cli.mjs set-siteos-connection \
  --session-file "$SESSION_FILE" \
  --linkage-status ready \
  --api-base-url-source config \
  --organization-auth-status logged-in \
  --organization-slug "<org-slug>" \
  --project-id "<project-id>" \
  --project-name "<project-name>" \
  --project-slug "<project-slug>" \
  --command-category project-connect \
  --config-path ".siteos/project.json" \
  --health-check-status ready

node .agents/skills/search/scripts/session-state-cli.mjs complete-step \
  --session-file "$SESSION_FILE" \
  --step siteos-connection
```

## Existing Connection Check

Start by checking whether the repository already has a usable SiteOS connection with exactly two parallel CLI probes from the target project root:

```bash
npx @s-os/cli health-check --json
npx @s-os/cli org --help
```

Do not inspect `.siteos/project.json`, route paths, `package.json`, or project shape before this probe pair, except for resolving the target project root needed to run the commands.

Use this decision order:

1. If `health-check --json` reports `status: "ok"`, record safe status in `siteosConnection` and continue automatically to search readiness.
2. If health-check reports missing project config or project API key, continue the CLI-owned connect flow.
3. If an organization slug cannot be inferred from existing safe project config or user context, ask for the org slug before running org-specific commands.
4. If no organization login exists, ask only for the user's email address, derive the organization name from the current project directory or package name, then run `org bootstrap`.

After the connect flow produces a usable repository connection, run `npx @s-os/cli health-check --json` again before search readiness.

If `.siteos/project.json` is missing, start connection onboarding. If it is malformed, prefer the same onboarding path when the safe repair is to reconnect the project through CLI. Stop as `repair-blocked` only when the malformed local state cannot be safely overwritten, moved aside, or explained as a CLI-owned reconnect action.

## CLI-Owned Flow

When connection is missing and no logged-in organization was found by the initial `org` probe, use this order:

1. Request only the organization login email. Derive the organization name from the current project directory or package name:

   ```bash
   npx @s-os/cli org bootstrap --email <email> --organization-name <name>
   ```

2. Complete login by having the User run the one-time CLI command from email, or by using a trusted mailbox/Gmail workflow to retrieve and run that command without exposing the token in chat.
3. Confirm org auth through CLI:

   ```bash
   npx @s-os/cli org <org-slug> auth status
   ```

4. List projects:

   ```bash
   npx @s-os/cli org <org-slug> project list
   ```

5. If a suitable project exists, connect it from the target project root:

   ```bash
   npx @s-os/cli org <org-slug> project connect <project-slug>
   ```

6. If no suitable project exists, create then connect from the target project root:

   ```bash
   npx @s-os/cli org <org-slug> project new <project-slug>
   npx @s-os/cli org <org-slug> project connect <project-slug>
   ```

7. Run health check again before search readiness.

Run project commands from the target project root. Do not mention or require `--ai-preset` in this flow.

When the safe local context already provides a logged-in organization slug, skip bootstrap and use that organization:

1. Confirm org auth through CLI when needed:

   ```bash
   npx @s-os/cli org <org-slug> auth status
   ```

2. List projects:

   ```bash
   npx @s-os/cli org <org-slug> project list
   ```

3. If a suitable project exists for the current project root or project-derived slug/name, connect it from the target project root:

   ```bash
   npx @s-os/cli org <org-slug> project connect <project-slug>
   ```

4. If no suitable project exists, create and connect a project using a slug/name derived from the current project directory or package name:

   ```bash
   npx @s-os/cli org <org-slug> project new <project-slug>
   npx @s-os/cli org <org-slug> project connect <project-slug>
   ```

5. Run health check again before search readiness.

Do not stop for intermediate confirmation when the CLI output and current project name provide a safe next action. Stop only for the email needed by bootstrap, a real CLI/API blocker, or a later onboarding checkpoint reported by `session-state-cli.mjs evaluate`.

## User Decisions

Ask for the minimum missing information:

- email address for organization bootstrap
- organization name only when it cannot be derived from the current project directory or package name
- existing project vs new project only when `project list` shows an ambiguous choice that cannot be safely resolved from the current project root or project-derived slug/name
- project slug/name only when creating a new project and no safe default can be derived from the current project directory or package name

Do not ask the User to create a SiteOS project manually, connect a repository manually, or provide `.siteos/project.json` before onboarding can begin. Those are outcomes of the CLI-owned connection flow.

Do not ask the User to paste raw tokens into the chat or into session state. If a one-time login command is needed, ask the User to run the command locally or allow a trusted mailbox workflow to run it.

## Reporting

Use `references/onboarding-report-template.md` for user-facing checkpoint or blocker reports.

For SiteOS connection status fields:

- `SiteOS connection`: use `ready`, `not-ready`, `api-blocked`, or `unknown`
- `SiteOS linkage`: use `present`, `missing`, `malformed`, or `unknown`
- `SiteOS project`: show safe name and slug when known, otherwise `not configured` or `unknown`

Never include raw credential values, bearer headers, or full secret-bearing commands in reports, artifacts, snapshots, or test evidence.
