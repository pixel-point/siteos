# Usage and queue diagnostics

Use `siteos pulse usage --json` after resolving the common Project/environment. The read uses
`pulse:workspace:read` and reports that Organization's Pulse budget or estimate and concurrency. Discover
CLI help first when using an older installation; do not substitute browser automation for an
available MCP read. `siteos_billing_get_usage` is the Organization-level MCP equivalent.

- Enforced mode reserves the maximum Check cost before execution, settles measured seconds and releases the unused amount. PR, manual and scheduled checks share the Organization’s monthly $10 allowance. `CREDIT_LIMIT_REACHED` means waiting for released funds or renewal; it is not a failed test. No paid overage is enabled.
- Preview mode is a forecast: no grant allocation, deduction or financial blocking. Its monthly
  period is returned by the server, not inferred from the local calendar or another service.
- Preserve decimal USD values from JSON for calculations; show monetary totals with two decimal
  places, matching the web UI. Sum precise values before formatting; a displayed $0.00 may be
  a positive sub-cent estimate, not a free run. Run/PR `usage` receipts include mode, rate version and cost.
  A null/missing cost is unknown, not $0; summarize measured/total Checks for partial PR estimates.
- `included` and `additional` on preview receipts are null because no money was allocated.
  Historical credits are not USD. Do not combine legacy ledger history with preview estimates.
- Operational limits expose only this Organization's concurrent and queued Checks. There is no daily PR count quota. Do not configure `dailyAttemptLimit`; old clients may send it but it is ignored.
- Capacity may be warming, constrained or unavailable; do not promise an exact queue ETA.
  A ready shared runner may already be occupied. Do not reveal other Organizations' work.
- Read saved Check/run errors and PR admission errors before retrying. An infrastructure failure
  is not a failed website assertion; a quarantined runner needs an operator, not repeated PRs.

Use `pulse pull-requests list --json`, `siteos_pulse_list_pull_requests`, and
`siteos_pulse_get_run` for saved costs and execution evidence. Cost display does not change
`siteos.config.json`, test installation, PR selection, schedules or deployment authority.
