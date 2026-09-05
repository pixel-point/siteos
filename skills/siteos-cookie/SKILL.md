---
name: siteos-cookie
description: Use when configuring, installing, publishing or diagnosing a SiteOS Cookie consent banner, consent-aware integrations or consent analytics for the selected website Project.
---

# SiteOS Cookie

Use the common SiteOS Project and the unified CLI. Cookie owns banner configuration, public delivery, consent observations and receipts; it never owns the user's account or another service's configuration.

1. Run `npx @siteoshq/cli project status --json`. Use `$siteos` for missing account, Organization or Project selection. If Cookie setup is requested and no resource is attached, run `npx @siteoshq/cli project connect cookie --json`. Select the common environment with `project environment use <slug>` and add its website URL in Project settings first when missing. Name and hostname are centrally managed; preserve them in service draft payloads. An address change requires an explicit banner republication. Attach an existing resource explicitly with `--resource <id>` to preserve its key and installed banner.
2. Run `npx @siteoshq/cli cookie status --json` and `npx @siteoshq/cli cookie draft get --json`. Preserve the returned complete configuration and `expectedDraftVersion`. Edit a local JSON draft using the site's actual controller identity, policy URLs, languages, regions, services and desired visual treatment. Do not invent legal text, tracking vendors or user consent. Ask for missing facts while continuing independent implementation.
3. Save with `npx @siteoshq/cli cookie draft save --input <draft.json> --json`. Read status again and resolve reported configuration errors. Saving a draft has no public effect. A version conflict requires reading the current draft and reconciling changes, not overwriting it blindly.
4. Get the exact installation snippet with `npx @siteoshq/cli cookie installation --json`. Install the loader once through the project's chosen script, framework or GTM channel. Do not combine multiple loader channels. Preserve execution order before scripts that require consent. Permanent Cookie Settings and privacy-choice controls belong in the site's UI.
5. When publication is authorized, prepare a JSON object with the reviewed `expectedDraftVersion` and a unique stable `idempotencyKey`, then run `npx @siteoshq/cli cookie publish --input <publication.json> --json`. Keep the same key for retries of that exact publication. Read status after publication; a draft save or build is not a successful Edge activation.
6. Verify the served website: banner visibility, keyboard access, reject/accept/customize, reopening preferences, region behavior, consent-aware script execution and requests after consent changes. Run `npx @siteoshq/cli cookie analytics --range-days 7 --json` only to inspect actual observations. A recorded runtime handshake does not establish correct tag classification or legal compliance.

The public installation key and snippet are browser safe. Auth grants, internal delivery credentials and receipt data are not. Never inspect private CLI state or `.env`, reuse browser sessions for API management, or export individual consent receipts as part of a routine analytics request. Do not fabricate runtime activity when no observations are available.
