# Service permissions and consent transitions

Use this contract when connecting custom vendor code or non-Google GTM tags, or investigating a
choice lost after a region/policy change. It requires browser runtime 11.7+; inspect the actual
installed runtime and feature-detect the methods. Updating this skill, the CLI or a saved draft
does not deploy runtime assets. Existing publications need no republication solely for this fix.

## Gate the exact service

Use the stable service key from `cookie services list --json` and the published configuration:

```js
const permission = window.SiteOSCookie?.getServicePermission?.("custom-example");
const allowed = permission?.allowed === true;
```

`getServicePermission(key)` returns `{ serviceKey, status, allowed, reason }`;
`isServiceAllowed(key)` returns the boolean. Missing APIs, unknown keys, pending configuration,
runtime failure and preview never grant permission. Reasons distinguish `user_refusal`,
`consent_required`, `purpose_disabled`, `gpc` and `privacy_opt_out` from runtime availability.
Do not derive permission from a broad category or Google `adsGranted` for an unrelated vendor.

`subscribeToServicePermission(key, callback)` immediately reports the current permission and then
semantic changes; its return value unsubscribes. Attach after the API becomes available, including
late loader readiness/recovery. The private workspace adapter's
`subscribeToSiteOSServicePermission` supports either loader order, but `@siteos/cookie-runtime` is
not a public npm package. Do not instruct external websites to install it from npm.

Use one installation owner and idempotent SDK initialization. Keep business/conversion events separate;
do not replay events collected while denied. A delayed SDK load must recheck permission before
execution. A permission callback is not an awaited teardown hook: compose vendor shutdown through
`registerVendorAdapter`, cancel pending initialization, and return `complete: true` only when
processing has actually stopped. A failed or stalled adapter uses the controlled-reload fallback
after at most 1500 ms per adapter. Verify cessation of actual requests and storage effects.
If teardown destroys the SDK, implement and test its restart on a later grant; a once-per-page
GTM initialization trigger alone cannot restart a destroyed instance.

## GTM

The existing Cookie template remains compatible. It still owns synchronous denied defaults and
native Google consent updates. For a selected non-Google service, use Custom Event
`siteos_service_permissions` and a Data Layer Variable such as
`siteosServicePermissions.custom-example.allowed` with condition exactly `true`.
Use **Once per page** for SDK initialization. This event can change another service's permission;
it is not a business event. Consent checks and event triggers do not unload an already running SDK.

`siteos_analytics_granted` and `siteos_ads_granted` remain specific to Google. In 11.7+ they fire for
the initial allowed state and subsequent denied-to-allowed transitions, not unchanged choices.
Explicitly selected Advanced Consent Mode can still load Google resources with denied signals;
`allowed: false` alone is not evidence that no cookieless request occurred.

## Preserve refusal and report the tested scope

Unexpired purpose refusals and manual sale/share or targeted-advertising restrictions survive
regional, profile and material-policy changes. Positive grants require matching policy identity;
other cases apply the new policy defaults minus retained restrictions. Preserve purpose keys.
New purposes follow the new policy. Legacy partial/GPC records migrate conservatively because they
cannot reliably distinguish refusal inventories or manual choices from a browser GPC signal.
Restoration neither extends expiry nor creates a new receipt. GPC still applies after Accept.

`resetConsent()` removes the record and reapplies current defaults, which can allow optional
services in opt-out regions. Use Reject or granular/privacy choices for withdrawal. Do not reset a
visitor's choice to make an integration start. Deploy and verify the compatible runtime on all
participating subdomains; an older runtime can still discard a refusal on a policy mismatch.

Use `getDebugState().services[].permission` for the reason, alongside `allowed` and
`footprintPresent`. These describe permission and observation, not verified blocking.
Hosted Cookie MCP reads expose saved configuration/aggregates, not a visitor's browser permission.
`cookie verify` tests one route and current Edge region; it does not switch policies or verify
event deduplication. Supplement it with refusal → different region/policy, original expiry,
GPC/manual opt-out, repeated unchanged choice, withdrawal and regrant checks in isolated fixtures
or an authorized publication. Check actual network/storage behavior in Chromium and WebKit.
