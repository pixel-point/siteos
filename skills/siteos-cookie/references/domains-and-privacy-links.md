# Domains and privacy links

## Configure installation hostnames and shared consent

Read `cookie schema --json` and `cookie draft get --json` through `npx @siteoshq/cli` first. Merge
only the requested fields into the complete current save payload; retain `name`, `hostname`,
`expectedDraftVersion`, regional rules, services and all unrelated settings. Validate before saving.

This partial example belongs inside `draft`, not at the top level of the save payload:

```json
{
  "domainScope": {
    "hostnames": ["example.com", "app.example.com", "console.example.com"],
    "sharedConsentDomain": "example.com"
  }
}
```

- Use 1–20 unique exact hostnames, including the Project's canonical hostname. All must share one
  registrable parent domain. URLs, ports, paths, wildcards and unrelated domains are unsupported.
- Omit `sharedConsentDomain` to keep choices independent on each hostname. Merely installing the
  same banner on multiple hosts does not share their consent.
- Enable sharing only when requested and every subdomain of the parent is trusted. A parent-domain
  cookie is exposed to all sibling subdomains, even those absent from `hostnames`; the list controls
  allowed installations, not isolation against an untrusted sibling.
- Save and explicitly publish the reviewed change, then use the same generated installation snippet
  on each authorized hostname. Public non-local installations use HTTPS. UI equivalents are
  **Installation → Website domains** and **Remember choices across subdomains**.

The runtime stores shared choices in `siteos_consent_<publicKey>` on the parent domain with
`Secure`, `SameSite=Lax` and `Path=/`. Host-only installations use `siteos_consent`. Sharing remains
bound to this banner; positive grants require the same regional rule, profile and material policy.
Runtime 11.7+ retains unexpired purpose refusals and manual privacy restrictions across different
policies without bypassing GPC. Material scope changes require reevaluating the choice; old host-only
choices are not promoted to a shared cookie.
Unrelated domains cannot share choices through this feature.

Visible sibling pages check the shared cookie every second and on focus/visibility changes.
Withdrawals use the existing service cleanup/reload behavior. Suspended background tabs catch up
when resumed; do not promise instantaneous synchronization. If browser storage is unavailable,
choices cannot be remembered. Reading an existing choice does not create a new consent receipt.

## Replace floating controls with your own links

Set `draft.banner.preferencesAccess` to `"custom-link"`, preserving the rest of `banner`, or choose
**Banner design → Cookie settings button → My own link**. Add visible, keyboard-accessible native
links or buttons to every affected page, including mobile navigation and SPA routes:

```html
<a href="#cookie-settings" data-siteos-cookie-preferences>Cookie settings</a>
<a href="#privacy-choices" data-siteos-cookie-privacy-choices>Your privacy choices</a>
```

The second link opens sale/share and targeted-advertising controls when relevant to the visitor's
rule. Each floating control hides independently only while its matching usable custom control is
present. Missing, hidden, disabled or negative-tabindex controls retain the floating fallback.
Route changes recheck availability. Do not remove the fallback through CSS.

`SiteOSCookie.openPreferences()` and `SiteOSCookie.openPrivacyChoices()` remain available for
custom interactions. Use the attributes for automatic fallback detection: a hash alone does not
open the settings. Publish the setting and verify the actual website markup together.

## Verify the website behavior

`cookie verify --json` checks one route on the selected Project environment's origin using public
runtime APIs. `--url` does not authorize another hostname. It recognizes this banner's exact shared
cookie when sharing is published, but that classification does not prove cross-host behavior.
Keep its JSON report and complete these additional scenarios in fresh isolated browser contexts
on the explicitly authorized installation hosts; never reuse an authenticated browser session:

1. Confirm the same public key and active revision on each host. With sharing off, a choice on one
   host must not silently become a choice on another.
2. With sharing on and compatible regional rules, accept on the primary host and visit a sibling.
   Check the saved choice, permitted services and actual requests/storage. Repeat with refusal.
3. Keep two sibling pages open. Withdraw on one; check that the other updates while visible or on
   resume, and that vendor teardown or the required reload occurs. Reload both and check refusal
   persists. Account for different regional rules and GPC rather than forcing reuse of a choice.
4. Click and keyboard-activate each applicable custom privacy link. Confirm the correct panel opens,
   choices can be changed, and focus remains usable. Check desktop, mobile and representative SPA routes.
5. In a local fixture or isolated browser page, remove/hide/disable the matching link and navigate
   between routes. Confirm the floating fallback returns and still opens the panel. Restore the
   link and confirm only its matching floating control hides. Do not change production settings
   merely to induce this failure.
6. Verify material scope/policy changes in a fixture or during an authorized publication: a previous
   refusal must remain effective across opt-out/notice regions until its original expiry; an old
   grant must not carry into a new strict policy. Verify runtime 11.7+ on every participating host.
   Include WebKit for pilot browser acceptance.

Report the tested hostnames, revision, browser, sharing mode, custom-link behavior and untested
scope separately from the CLI result. Never call one successful route a cross-domain or compliance pass.
