# Website investigation and event checks

Use this workflow for a site's tracking audit or requested monitoring setup. Verify the common
Project, environment, website and current installation as described in the parent skill. An audit
can end with findings and a local proposed plan; it does not implicitly authorize remote writes.
Carry out configuration and publication when included in the user's authorization.

## Establish the event contract

Inspect the relevant website journeys, available application code, existing event definitions and
GTM configuration. Select actions that matter to the task, such as a successful form submission,
signup or purchase. Record a compact mapping of action, actual success signal, destination event,
required property names/types, applicable consent and the evidence supporting that relationship.
Distinguish an observed relationship from a product requirement still needing confirmation.

Follow each applicable stage: successful action → dataLayer or direct SDK → GTM trigger/tag when
used → observed request → accepted destination report. Read existing Trace events, properties,
coverage, issues and published rules. Use the page timeline to compare stages; proximity alone
does not prove causality. A configured GTM tag does not prove firing, and firing does not prove
report processing. For SiteOS Analytics, inspect its event catalog and accepted report through
`$siteos-analytics`; for GA4 use the exact bound stream and the Google investigation reference.

Use an available authorized test environment for actions that create orders, users or submissions.
Do not generate synthetic production conversions just to prove setup. If a necessary step cannot
be exercised, report it as unverified. Browser inspection must not expand Trace collection to form
values, DOM contents, payload values or persistent visitor identities.

## Choose a check that matches the evidence

Automatic discovery, duplicate candidates, technical failures, learned schemas and volume checks
already cover supported observations; a plan is not required for every discovered event. Consult
[actionable monitoring](actionable-monitoring.md) for learning and coverage requirements. A small
traffic drop or a new event is not automatically a failure, and insufficient data is not healthy.

Add explicit expectations only where the site contract provides additional meaning:

- `afterSourceEvent` checks a named custom dataLayer event followed by a supported network
  destination event within 5–300 seconds on the same visible page lifetime. The source cannot be a
  `gtm.*` system event and the destination provider cannot be `custom`. Choose the deadline from
  the implementation's expected behavior, not a universal default. Sampling, sequence gaps,
  hidden/closed pages and unavailable destination observation can prevent a conclusion.
- `properties` checks required names and types. Use the observed representation: encoded wire
  types can differ from the original application object. Do not copy raw values into the rule.
- `required` with `maximumSilenceMinutes` is appropriate only for an event with a known recurring
  cadence and sufficient traffic. A rare purchase should not raise an outage simply because no
  customer bought during a quiet interval.
- `afterConsentSeconds` is for events that should follow a new consent grant itself. It is not a
  deadline for a later purchase or form action. Preserve the site's actual consent behavior.

For example, if code and browser evidence establish that `form_success` should produce
`generate_lead` in GA4 within 30 seconds under analytics consent, this expectation is valid:

```json
{
  "provider": "ga4",
  "eventName": "generate_lead",
  "required": true,
  "consentPurpose": "analytics",
  "maximumSilenceMinutes": null,
  "afterSourceEvent": { "eventName": "form_success", "withinSeconds": 30 },
  "properties": []
}
```

Replace the example with the verified contract. This is one expectation, not a complete save
payload. Read the existing tracking-plan draft, merge by provider/event name and preserve unrelated
rules. Use the parent skill's version-guarded save/publish commands and read back the published plan.

If there is no source signal, propose instrumentation in the actual success callback when within
scope. A rule cannot create the source event. Do not claim `afterSourceEvent` verifies arbitrary
cross-page/server-side sequences or user conversion funnels; use destination reports or a separate
application check for those cases. Fix incorrect instrumentation rather than relaxing a valid rule
merely to clear an issue.

## Verify and hand off

Reproduce the action after the intended publication, inspect fresh Trace observations and the next
completed analysis window, and check the destination report when receipt is part of the outcome.
Describe zero/one/multiple observed sends without treating an attempt and its response as two
events. Check recovery using the evidence required by that issue; manual resolution proves no fix.
Exercise missing/duplicate sends in an authorized test environment when that failure path needs
validation. Label waiting-for-analysis, learning and unavailable evidence explicitly.

Finish with the actions covered, checks configured or proposed, evidence time, remaining gaps and
publication/verification state. Read notification settings if alerts are part of the task; use
only the user's authorized destination. Rule publication alone does not configure notifications.
