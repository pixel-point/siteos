# Connected GA4 reports

Resolve the user's exact Organization, Project and environment first. GA4 must be connected in that
environment's Analytics Setup. These reads never install the native SiteOS script, connect a Google
account, change key events or enable notifications.

## CLI

Use the installed command help before assuming a released CLI contains these controls:

```sh
siteos analytics ga4 --help
siteos analytics ga4 report --period 28d --compare year --section totals --environment production --json
siteos analytics ga4 report --period custom --from 2026-01-01 --to 2026-08-31 --compare previous --section events --offset 0 --limit 50 --environment production --json
siteos analytics ga4 realtime --environment production --json
siteos analytics ga4 explore --file funnel.json --environment production --json
siteos analytics ga4 export --file funnel.json --environment production > funnel.csv
siteos analytics ga4 saved list --environment production --json
```

Historical `--compare` accepts `previous`, `year`, or `none`. Custom ranges contain at most 366
calendar days in the property timezone. `--section` accepts totals, trend, events, channels, sources,
pages, countries, devices, quality. Follow `nextOffset` for paginated sections. `--filters` contains
an array of `{dimension, operator, values}`; supported historical dimensions are channel, source,
campaign, sourceMedium, page, landingPage, country, event, device, browser and os. Realtime supports
only country, event, device and pageTitle. Operators are `is` and `is_not`.

`funnel.json` selects a real Google funnel:

```json
{
  "kind": "funnel",
  "startDate": "2026-09-01",
  "endDate": "2026-09-07",
  "filters": [],
  "open": false,
  "steps": [
    { "name": "View", "event": "page_view" },
    { "name": "Purchase", "event": "purchase", "directly": false, "withinSeconds": 1800 }
  ]
}
```

Use actual collected event names. `directly` and `withinSeconds` describe the current step following
the preceding step. There are 2–10 steps. Funnels use Google's alpha endpoint; unavailable capability
is an error, not permission to approximate a journey from aggregate event totals.

Other exploration selections use the same `startDate`, `endDate` and `filters`:

- `kind: campaigns`, optional `dimension: sessionCampaignName | sessionSourceMedium`, optional
  `comparison: {startDate, endDate}`. Metrics are sessions, active users, key events and session key event rate.
- `kind: metadata` discovers registered event-scoped dimensions for this property.
- `kind: event`, `event: purchase`, `dimension: customEvent:plan`. Only names returned by metadata
  are eligible. Google validates compatibility; unregistered raw parameters cannot be reported.
- `kind: cohort`, `granularity: daily | weekly`, `offsets: 1..12`. Select at most 12 acquisition
  days or 12 complete Sunday–Saturday weeks. Cohorts are based on firstSessionDate. Unfinished
  observation intervals are unavailable. Do not describe raw future zeros as observed churn.

Calendar dates are whole-day selections. Campaign and event reports can additionally carry exact
`minuteRange: {from, to, previousFrom?, previousTo?}` boundaries as `YYYYMMDDHHmm` in the property
calendar; comparison bounds are required when a comparison is selected. Reuse the selected report's
bounds rather than inventing a UTC offset. Date edits in the UI clear these bounds.

Missing/stale selections queue a shared report; rerun after completion. Reads require
`analytics:workspace:read`. `export` writes only an existing snapshot as CSV and never waits for
Google. It retains precise values, definitions, timestamps and quality flags; UI rounding is display
formatting. Formula-like text cells are escaped for spreadsheets. Snapshot time is not a claim that
Google has finished processing data.

Owner/admin writes require `analytics:reports:write`. `saved save --file saved-report.json` accepts
`{name, revision: 0, bindingRevision, definition}`; update with the returned `id` and current `revision`.
Read `saved list` back after writing. `saved remove <id> --revision <number>` deletes only that definition.
Old binding revisions must not silently target a replacement Google stream. Saved definitions do not
freeze report data or trigger collection.

## MCP

All tools require explicit `organizationId`, `projectId`, `environment`:

- `siteos_analytics_get_ga4_report`: historical selection, comparison, section and bounded pagination.
- `siteos_analytics_get_ga4_exploration`: `selection` as above, `offset`, `limit` (maximum 100).
  Current and comparison rows are paginated independently; follow `nextOffset` even if one side is empty.
- `siteos_analytics_get_ga4_realtime`: realtime filters and shared cache state.
- `siteos_analytics_list_ga4_saved_reports`: saved selections and binding revisions.

These tools are read-only with respect to user configuration. A read can enqueue an internal cache
refresh. They cannot save definitions or enable notifications. State `queued`/`running`, unavailable
metrics and Google sampling/threshold/restriction metadata must remain visible in the answer.
Never sum user/rate/funnel aggregates to invent a wider population or retry by dropping a filter.

For anomalies, inspect the existing source-matched Trace evidence and notification status with the
Trace tools. Counts alone establish differences, not causes. Notification routing and monitoring
changes require an explicit user request; a GA report read does not authorize sending a message.
