# SiteOS Connection Onboarding

Use this reference when a target repository is not connected to SiteOS or `.siteos/project.json` cannot be safely used.

The normal starting prerequisites are only a local project repository and the packaged `siteos-forms` skill. A missing SiteOS project, missing repository connection, or missing `.siteos/project.json` is onboarding state, not a manual setup prerequisite.

The connection flow is CLI-owned. The skill may run SiteOS CLI commands and inspect safe command status, but it must not call organization API routes directly and must not read, print, or persist raw credential values.

## Mandatory Gate

Repository connection happens before form implementation. A missing connection is not permission to build a local-only form and defer registration until the end.

From the target project root, run these probes before inspecting or changing application files:

```bash
npx @s-os/cli health-check --json
npx @s-os/cli org --help
```

Branch on the safe health-check result:

- `projectConfig.status: ok` and `projectApiKey.status: ok`: the Forms gate has passed. Continue even if `organizationConfig.status` is `missing`; project-key form sync does not require a separate organization login profile.
- `projectConfig.status: missing` or `projectApiKey.status: missing`, with `organizationConfig.status: missing`: immediately ask for the user's SiteOS email and organization name, then run bootstrap. Do not write form files first.
- `projectConfig.status: missing`, with an organization profile available: continue the CLI project list/new/connect flow. Ask for the organization slug only when it cannot be safely inferred.
- `projectApiKey.status: missing`: reconnect the selected project through CLI so the CLI writes the approved local secret destination. Never ask for the key in chat.

After bootstrap, pause only for the one-time email login action. After login and project connection, rerun health-check and require project config plus project API key before form implementation. A global health-check `needs-setup` caused only by missing organization config does not block an already linked Forms project.

## Safe State

It is safe to report:

- linkage status: `ready`, `missing`, `malformed`, `not-ready`, `api-blocked`, or `unknown`
- API base URL source: `env`, `config`, or `default`
- API base URL
- organization auth status: `missing`, `email-requested`, `logged-in`, or `unknown`
- organization slug
- project id, name, and slug
- command category: `health-check`, `org-bootstrap`, `org-login`, `project-list`, `project-new`, or `project-connect`
- config path
- health-check status
- last checked timestamp

Never store or print raw one-time login tokens, organization API tokens, project API keys, delete tokens, bearer headers, full CLI commands that contain tokens, or full `.siteos/project.json` content.

## API Base Resolution

Use the CLI-owned resolution order for every onboarding command:

1. `SITEOS_API_BASE_URL` when intentionally set for local, test, or staging use.
2. The API base stored in the SiteOS organization or project connection.
3. `https://siteos.xui.se` as the current production default.

Before bootstrap, run `npx @s-os/cli health-check --json` and confirm that `checks.apiBaseUrl.value` is the intended environment without exposing any secrets.

## Existing Connection Check

Start by checking whether the repository already has a usable SiteOS connection:

1. Resolve the target project root.
2. Run SiteOS CLI health-check; do not read the credential-bearing config directly.
3. Continue to form work after health check confirms project config and project API key. Organization config is required only when onboarding or organization-authenticated UI commands are needed.

If `.siteos/project.json` is missing, start connection onboarding. If it is malformed, prefer the same onboarding path when the safe repair is to reconnect the project through CLI. Stop only when malformed local state cannot be safely overwritten, moved aside, or explained as a CLI-owned reconnect action.

## CLI-Owned Flow

When connection is missing, use this order:

1. Request organization login email:

   ```bash
   npx @s-os/cli org bootstrap --email <email> --organization-name <name>
   ```

2. Complete login by having the user run the one-time CLI command from email, or by using a trusted mailbox/Gmail workflow to retrieve and run that command without exposing the token in chat.
3. Confirm organization auth through CLI:

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

7. Run health check again before definition sync or live form submission.

Do not interleave steps 1-7 with local form implementation. Complete this sequence first, except while paused for the user's email address, organization name, ambiguous project choice, or one-time email login action.

Run project commands from the target project root. Do not mention or require `--ai-preset` in this flow.

## User Decisions

Ask for the minimum missing information:

- email address for organization bootstrap
- organization name when it cannot be inferred
- existing project vs new project only when `project list` shows an ambiguous choice
- project slug/name when creating a new project and no safe default is obvious

Do not ask the user to create a SiteOS project manually, connect a repository manually, provide a project API key in chat, or provide `.siteos/project.json` before onboarding can begin. Those are outcomes of the CLI-owned connection flow.

Do not ask the user to paste raw tokens into chat. If a one-time login command is needed, ask the user to run the command locally or allow a trusted mailbox workflow to run it.

## Reporting

Use `references/onboarding-report-template.md` for user-facing checkpoint or blocker reports.

For SiteOS connection status fields:

- `SiteOS connection`: use `ready`, `not-ready`, `api-blocked`, or `unknown`
- `SiteOS linkage`: use `present`, `missing`, `malformed`, or `unknown`
- `SiteOS project`: show safe name and slug when known, otherwise `not configured` or `unknown`

Never include raw credential values, bearer headers, full secret-bearing commands, or full `.siteos/project.json` content in reports, artifacts, snapshots, or test evidence.
