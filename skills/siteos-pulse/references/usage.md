# Usage and queue diagnostics

Use `siteos pulse usage --json` after resolving the common Project/environment. The read uses
`pulse:workspace:read` and reports that Organization's Pulse estimate and technical limits. Discover
CLI help first when using an older installation; do not substitute browser automation for an
available MCP read. `siteos_billing_get_usage` is the Organization-level MCP equivalent.

- Preview mode is a forecast: no grant allocation, deduction or financial blocking. Its monthly
  period is returned by the server, not inferred from the local calendar or another service.
- Preserve decimal USD values from JSON for calculations; show monetary totals with two decimal
  places, matching the web UI. Sum precise values before formatting; a displayed $0.00 may be
  a positive sub-cent estimate, not a free run. Run/PR `usage` receipts include mode, rate version and cost.
  A null/missing cost is unknown, not $0; summarize measured/total Checks for partial PR estimates.
- `included` and `additional` on preview receipts are null because no money was allocated.
  Historical credits are not USD. Do not combine legacy ledger history with preview estimates.
- Operational limits expose this Organization's running/queued Checks and each environment's
  rolling 24-hour PR attempts. Browser and code attempts share that environment's PR limit.
  Raising a daily limit does not create runner capacity or buy credits.
- Capacity may be warming, constrained or unavailable; do not promise an exact queue ETA.
  A ready shared runner may already be occupied. Do not reveal other Organizations' work.
- Read saved Check/run errors and PR admission errors before retrying. An infrastructure failure
  is not a failed website assertion; a quarantined runner needs an operator, not repeated PRs.

Use `pulse pull-requests list --json`, `siteos_pulse_list_pull_requests`, and
`siteos_pulse_get_run` for saved costs and execution evidence. Cost display does not change
`siteos.config.json`, test installation, PR selection, schedules or deployment authority.
