# New website onboarding in chat

Use this only when the user asks to create/set up a new website Project. Signing in, accepting an
invitation, selecting an existing Project or asking for one service does not authorize a new Project
or a broad research run. Reuse the Auth-owned Organization returned after verified sign-in; never
create a second Organization as an onboarding shortcut. Keep self-registration eligibility intact.

## Website and optional connections

Collect the Project name and a public website URL before creating it, even though the legacy CLI
still accepts URL-less resources. Reuse explicit repository/Organization context and check for an
existing Project first. Create with `project create --name <name> --slug <slug> --url <url>
--organization <id> --json`, then select that exact Project and environment through the common
Project workflow. Do not change the global Auth default.

Offer Google Analytics, Google Tag Manager, Search Console and GitHub together as optional sources.
The user may choose one, several or skip all; skipped sources never block the website analysis.
Do not ask again for already selected integrations or treat connection as tracker installation.
Match returned resource names/website URLs to the target to suggest a candidate, but let the user
confirm the actual stream/container/property or repository. Never bind a resource by URL resemblance
alone. Preserve other resources shared with the Organization.

Supported handoffs:

- GitHub: use `$siteos-integrations` for authorize → candidates → connect, then the Project repository
  commands for the exact environment. The user grants consent in the provider window and returns to
  chat for the selection. This does not configure Pulse checks or monitoring.
- Google: current consent and Organization resource sharing require the authenticated SiteOS browser.
  Use the target application's Services page (`/integrations`) and the selected Organization; the user
  chooses the provider, grants consent and shares the intended resource. No credential belongs in chat.
  Do not invent a Google authorization CLI command or promise an automatic browser-to-chat callback.
- GA reports: CLI 2.35.0+ supports `analytics ga4 status --json` and
  `analytics ga4 bind --connection <id> --property <numeric-id> --stream <numeric-id>
  --revision <current-revision> --json` after the resource is shared. Connect Analytics explicitly if
  absent, inspect status and keep revision/resource scope. A GA report binding does not install a tag.
- Search Console: `$siteos-seo` owns supported property status/bind and report sync commands after
  sharing. GTM container binding remains a browser operation in Trace or the creation wizard; the
  CLI can read its summary but cannot perform that write. Explain this narrow boundary and allow skip.

The web wizard keeps the whole setup on `/projects/new`, using a consent popup and resource dialog.
Chat has the same optional choices and safe skip behavior, but Google consent/sharing and GTM binding
are not fully headless. Do not use browser credentials, internal endpoints or a different provider's
OAuth scopes to work around that limit. Hosted MCP remains read-only; CLI authentication is separate.

## Initial reports

For authorized full new-website onboarding, state that the initial site audit, competitor discovery
and a small AI-answer sample use the Organization's existing research balance. This is one bounded
setup, not every SEO workflow. Do not add a separate cost confirmation when this scope is already
authorized; existing balance/admission limits still apply. If the user only requests registration or
Project creation, offer the report setup rather than silently buying research.

Use `$siteos-seo` and its supported CLI commands. First inspect saved audits/research: the web wizard
may already have queued the initial reports. Read/wait on those IDs instead of duplicating them.
For a new CLI-created Project with no preparation, explicitly connect SEO, enqueue one technical audit,
study the public homepage and up to four key pages it links to (pricing, features, solutions, about,
docs), and prepare one competitor request for that domain and an evidenced market. Prepare up to five
website-derived questions: at least three neutral discovery questions and at most two comparison
questions that never name the user's own brand. Choose up to four direct competitors a customer would
compare, with real names, official domains and aliases; prefer those also found by the competitor
request, drop the own domain, duplicates and sites that do not respond publicly. Run one
`category-mentions-v3` AI Visibility sample on ChatGPT, Perplexity and Gemini. Validate the request
through `research plan`, then run under stable idempotency keys and read its saved results. Follow
SEO's exact current request schema; do not invent an onboarding endpoint or launch other platforms,
backlinks, Performance, content scans, schedules or outreach. Inaccessible evidence stays unknown.

Return a short useful summary: audited-page coverage, the most actionable finding, leading observed
competitors and available AI mention/citation evidence. Include saved report links for the exact
Project/environment and identify partial/waiting results. GA/GSC may add existing measured traffic
or search context when connected. Do not claim a successful launch is a completed report, equate a
sample with universal rank, or retry uncertain paid work just to fill the dashboard.
