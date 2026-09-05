---
name: siteos-auth
description: Use when authenticating the unified SiteOS CLI, checking or ending its session, listing or creating Organizations, selecting the active Organization, or repairing the identity prerequisite for a common Project or service workflow.
---

# SiteOS Auth

Auth owns user identity, Organizations, memberships, CLI sessions, and short-lived service grants. It does not own Projects or service resources.

Use only the unified CLI `auth` command group and safe structured output. Never call Auth endpoints directly, inspect private CLI state, read credential-bearing files, expose tokens or grants, or create product resources from this skill.

## Session

1. Run `npx @siteoshq/cli auth status --json`.
2. When signed out and no email was supplied, ask one explicit question containing the word `email` and stop.
3. With an email, run `npx @siteoshq/cli auth start --email <email> --json` and stop for the one-time token.
4. Pass the token only to `npx @siteoshq/cli auth complete --token <token> --json`. Never echo, retain, report, or write it.
5. Run `npx @siteoshq/cli auth status --json` again before continuing.

Use `npx @siteoshq/cli auth logout --json` only when the user asks to end the local CLI session.

## Organization selection

1. Run `npx @siteoshq/cli auth organizations --json`.
2. With zero Organizations, require an explicit display name before:

   ```sh
   npx @siteoshq/cli auth organizations create --display-name <display-name> --json
   ```

3. With one Organization, use it only when the user's request or confirmation establishes that choice.
4. With multiple Organizations, present only immutable IDs and display names and ask for one choice.
5. Select only by immutable ID:

   ```sh
   npx @siteoshq/cli auth select --organization <organization-id> --json
   ```

Never guess an Organization, select by slug, or edit Auth state.

## Return to the product skill

After authentication and Organization selection succeed, return to `$siteos` for common Project selection or to the requesting service skill. Do not pre-create service resources or infer common identity from names. Product commands obtain audience-bound service grants internally; never inspect or forward those grants.

## Safe reporting

Report only session readiness plus safe Organization IDs and display names. Never report one-time tokens, durable sessions, identity assertions, service grants, authorization headers, private Auth files, product credentials, or raw API responses.

Stop before guessing an identity choice, creating an Organization without its explicit name, logging out without a request, running a product Project command, or inventing an unsupported Auth mutation.
