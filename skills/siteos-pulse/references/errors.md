# Pulse Errors

Errors collects runtime failures independently of Checks. Do not create Playwright specs, schedules,
Check deployments or a runner just to enable Errors. Leave existing monitoring unchanged.

1. Resolve the user's exact Organization, common Project and environment through the shared
   execution contract. Inspect `siteos project status --json`; attach Pulse only within the requested
   setup. No fallback to production.
2. Discover whether the installed CLI/server expose `pulse errors` and the MCP error tools. If not,
   report the version mismatch; do not invent endpoints or silently install an unpublished package.
3. Read `siteos pulse errors settings --environment <slug> --json`. Save configuration using
   `pulse errors settings --input settings.json --environment <slug> --json` with the returned
   revision, `enabled`, exact `origins` and an optional saved `destinationId` (or null). Changing
   these settings is a real write. Notifications remain off unless requested.
4. `pulse errors keys --revision <revision> --output <new-private-file> --environment <slug>` rotates
   both collection keys. Never print the resulting server key, paste it into chat or commit it.
   Prefer the SiteOS protected UI/server secret store for transferring it to hosting. Browser keys
   permit collection only; CLI/MCP management authentication is separate.
5. Install `@siteoshq/pulse` only after verifying its published availability. Use the browser
   root entry, `/node` for server capture and `/nextjs` for request instrumentation. Reuse the
   application's boundaries, consent manager, release ID and environment conventions. Initialize
   one browser client. Default to `after-consent`; `essential` requires an explicit site policy.
6. Set up **automatic private source map upload as part of Errors installation**, not as a recurring
   manual CLI step. Verify SDK 0.2+ / CLI 2.48+ and matching server availability. Keep collection and
   build credentials separate. Issue `pulse errors upload-key issue --environment <slug> --name
   "Website build" --output <new-private-file>` once in the selected environment. Transfer its `key`
   to the hosting build secret `SITEOS_PULSE_SOURCEMAPS_KEY`; never print it or put it in a public
   environment variable. Its authority is limited to map upload for this Pulse resource; it expires
   after 365 days. Use `upload-key list` to inspect expiry and `upload-key revoke --credential <id>`
   after installing a replacement. Existing collection keys are not upload keys.
   - Next.js 16.3+ (16.x): wrap the final config with `withPulseErrors` from
     `@siteoshq/pulse/nextjs/config`, outside other config plugins. Use
     `process.env.NEXT_PUBLIC_SITEOS_RELEASE` in both browser and server initialization. The wrapper
     derives it from `SITEOS_RELEASE`, `VERCEL_GIT_COMMIT_SHA`, or Git; provide `SITEOS_RELEASE` for
     Git-free source archives. Run builds from the Next project directory. Preserve existing hooks.
   - Other supported Node builds: call `uploadSourceMaps` from `@siteoshq/pulse/build` in the
     framework's post-build hook, with explicit output directories, generated URL prefixes and the
     same build release. Reuse the project's build system; do not introduce a new CLI invocation
     for each map. Enable map generation, then remove maps before public packaging. Keep untested
     framework support explicit rather than claiming every bundler is configured automatically.
   - Build uploads require no interactive login. With a configured key, failures stop the build.
     Local builds without it remain offline. Do not weaken that policy or deploy partially processed
     artifacts. Verify that `.map` URLs are unavailable and that a report resolves to its original
     source line after a successful build. The uploader must stay out of browser imports.
   - Self-hosted SiteOS: pass the credential file's `endpoint` to the build adapter. This is the
     application upload endpoint, not the Errors collection endpoint. Keep environment keys separate.
   Manual `pulse errors upload-map --environment <slug> --release <id> --file <generated-path>
   --input <local-map>` remains an explicit repair tool. Never pass map contents through chat.
7. Test on an owned fixture or an explicitly approved project. A synthetic report can trigger an
   enabled destination; obtain authorization before external test notifications. Read the exact
   issue, verify grouping/source location, and distinguish local transport from hosted delivery.

Read-only MCP tools are `siteos_pulse_list_errors` and `siteos_pulse_get_error`; pass Organization,
Project and environment, plus `issueId` for detail. CLI reads are `pulse errors list` and
`pulse errors show --issue <id>`. They do not enable collection, install SDKs or send reports.
Triage is an explicit CLI write: `pulse errors triage --issue <id> --revision <revision>
--status open|resolved|ignored` in the selected environment. Re-read on revision conflicts.

Counts are received reports after sampling, deduplication and limits, not all crashes or users.
No events proves neither health nor successful installation. Keep disabled, publication pending,
waiting for first event, processing backlog and open issues distinct. Resolving an issue does not
change Check health. DataChain is a reference only until the user authorizes changing it.
