---
name: siteos-cookie
description: Use when configuring, styling, installing, publishing or diagnosing a SiteOS Cookie consent banner through chat and the unified CLI, including regional rules, consent-aware integrations and consent analytics for the selected website Project.
---

# SiteOS Cookie

Use the common SiteOS Project and the unified CLI. Cookie owns banner configuration, public delivery, consent observations and receipts; it never owns the user's account or another service's configuration. Complete routine configuration through chat and CLI when the commands support it; do not send the user to the web editor merely to edit a JSON field.

## Establish the website and current capabilities

1. Run `npx @siteoshq/cli project status --json`. Use `$siteos` for missing account, Organization or Project selection. Select the intended environment with `npx @siteoshq/cli project environment use <slug> --json`. Its URL can be set with `npx @siteoshq/cli project environment update <slug> --url <website-url> --json`; never fall back to Production.
2. Before a new Cookie connection, check the Cookie service terms as described below. If Cookie setup is requested and no resource is attached, run `npx @siteoshq/cli project connect cookie --json`. Attach an existing resource explicitly with `--resource <id>` to preserve its key and installation. Project owns name and hostname; preserve them in Cookie draft payloads. Changing the website address requires explicit banner republication.
3. Read `npx @siteoshq/cli cookie --help`, `npx @siteoshq/cli cookie status --json` and `npx @siteoshq/cli cookie draft get --json`. Keep the complete save payload: `name`, `hostname`, `expectedDraftVersion` and `draft`. Preserve fields outside the requested change. New appearance fields require a compatible deployed Cookie service; local source changes do not update the hosted API or installed plugin.
4. Inspect the site's actual source and, when available, its rendered pages before selecting services or matching its design. Identify existing CMPs, GTM containers, scripts, pixels, embeds, cookies/storage and server-side integrations. Distinguish observed behavior from inferred purpose. Do not invent legal text, controller identity, policies, vendors or consent. Ask for missing business facts while continuing independent work.

## Review service terms before setup

Use a CLI version whose `cookie --help` includes `terms show` and `terms accept`, together with a
compatible application. Run `npx @siteoshq/cli cookie terms show --json` in the selected Organization
and Project; this works before Cookie is attached. Existing connections remain operational.

If the current version has not been accepted, show the returned notice, full terms link, version
and acknowledgement to the user. Obtain their explicit agreement on behalf of the Organization
before running `npx @siteoshq/cli cookie terms accept --version <reviewed-version> --confirm --json`.
A general request to configure or publish a banner is not agreement to service terms. Never accept
terms autonomously, invent an acceptance, or reuse confirmation for a different version or
Organization. Only an owner or admin can accept. Read back `cookie terms show` after success.
If the server reports changed terms, show the new version and obtain a new explicit agreement.

Acceptance records service responsibilities; it does not approve a banner configuration or
provide legal advice. Keep `customerResponsibilityReviewed` and publication approval separate.
The website operator still needs to review regional rules, disclosures and scripts with its legal
adviser. Passing technical checks does not certify legal compliance.


## Match the site's design

Use the site's existing background, foreground, accent, border, spacing and radius as the starting point. Inspect light/dark pages and mobile, then suggest a coherent treatment. Keep Accept and Reject equally prominent, text readable and preferences easy to reopen. Glass requires visible content behind the surface and a contrast check over that content; a computed contrast ratio against the solid color alone does not prove glass readability.

Edit these fields inside the returned `draft`; do not replace the entire draft with this field list:

| Area | Supported configuration |
| --- | --- |
| Banner layout | `banner.layout`: `bottom` or `center` |
| Banner colors | `banner.theme.accent`, `background`, `foreground`, `muted`: six-digit HEX |
| Banner geometry | `banner.theme.radius`: 0–24; `paddingX`, `paddingTop`, `paddingBottom`, `contentGap`, `buttonGap`: integer pixels 0–48 |
| Banner surface | `banner.theme.surface`: `solid` or `glass`; `backgroundOpacity`: 0–100; `backdropBlur`: 0–40 |
| Banner outline | `banner.theme.border`: `auto`, `custom` or `none`; `borderColor`, `borderOpacity`: 0–100 |
| Persistent button placement | `banner.floatingControls.corner`: `bottom-left` or `bottom-right`; `offsetX`: 8–96, `offsetY`: 8–160, `size`: 40–64 |
| Persistent button appearance | `banner.floatingControls.radius`: 0–32; independent `background`, `foreground`, `surface`, `backgroundOpacity`, `backdropBlur`, `border`, `borderColor`, `borderOpacity` with the same color/material ranges |
| Persistent button icon | `banner.floatingControls.icon`: `cookie`, `shield`, `sliders` or `custom`; `iconSize`: 16–32 |

All numeric values above are integers. Widget radius 0 makes a square; radius at least half the button size makes a circle. `stack` (`horizontal`/`vertical`) and `gap` (4–32px) matter when two privacy buttons exist. Keep the existing `zIndex` unless a real widget overlap requires changing it. The button appears after the first choice; accept or reject in a disposable preview to inspect it, then reopen preferences. Do not mistake the initial banner for the persistent button.

Glass defaults to 55% background opacity and 16px blur. Lower opacity reveals more of the page; 100% is opaque. Text and icons remain opaque. Unsupported backdrop filtering, reduced transparency and forced colors use a solid fallback. Widget styling is independent of the banner and applies in every region; only its colors inherit from the resolved banner theme when unset. Shape/material apply to both privacy buttons, while the icon belongs to Cookie settings.

Custom `iconImage` accepts only a normalized centered 128×128 alpha PNG data URI, at most 32768 characters; it is recolored using `foreground`. Never insert SVG markup, arbitrary HTML, a remote URL or a raw unnormalized image into this field. Studio has local SVG/PNG normalization, but the released CLI has no icon-upload/normalization command. In a chat workflow use a verified local image-processing capability to produce the required mask, validate dimensions/size and inspect it before saving; if that capability is unavailable, keep a built-in icon and state the limitation. Preserve an existing custom image when changing other fields. A publisher CSP that blocks data images leaves the built-in SVG fallback visible.

Do not invent font-family, typography, logo-upload or other configuration fields absent from the supported contract. Explain the limitation if the requested design needs them.

## Configure regional behavior

Region rules are technical policies chosen for the customer's requirements, not an automatic legal determination. Start from explicit opt-in and keep the unknown-location/default rule strict. Do not silently activate optional tracking to make a region's banner disappear.

- `draft.regionalPolicy.rules` supports audiences `default`, `country-group` with `group: "eea-v1"`, `countries` with `countryCodes`, and `subdivisions` with `subdivisionCodes` such as `US-CA`. The EEA group does not include the UK (`GB`) or Switzerland (`CH`); include them explicitly when required.
- Preserve stable rule keys, `defaultRuleKey`, `enabledPurposeKeys` and existing customer choices. More specific subdivision rules precede country rules, which precede country groups; priority orders rules with equal specificity. Avoid conflicting overlapping rules.
- `strict-opt-in-v1` blocks optional purposes until an affirmative choice. `opt-out-gpc-v1` activates eligible purposes by default and applies mapped sale/share and targeted-advertising opt-outs. Use the latter only with an explicitly reviewed customer policy; the fact that a visitor is in the US does not establish that policy.
- `notice-only-v1` does not turn a notice action into consent. `essential-only-v1` keeps optional processing blocked and shows no consent banner. These profiles are not shortcuts around consent requirements.
- A rule's `appearance.layout` / `appearance.theme` override selected shared banner fields; omitted fields inherit. Keep global widget settings in `banner.floatingControls`.
- Configure language through `defaultLocale`, complete `translations`, and each rule's `localeStrategy` (`browser` or `fixed`) / `fixedLocale`. Country and browser language are different inputs.
- Preserve GPC handling and the permanent settings/privacy entry. Never set `customerResponsibilityReviewed` merely because the agent finished editing; it records an actual customer acknowledgement.

Geography is estimated from the visitor's direct request to Cookie Edge using trusted Cloudflare country/subdivision metadata. Do not proxy this through an application server, replace it with browser geolocation permission, or spoof production geography with headers/query parameters. Test country/state/unknown-location resolution using an isolated simulator or trusted regional traffic. Preview simulation is not evidence of production geography. Use `npx @siteoshq/cli cookie regions resolve --country GB --source draft --json`, `--country US --subdivision CA`, and omit country for unknown location. Choose `--source published` to simulate the active policy. Every result is explicitly marked `simulation: true`; it never changes production geography.

## Edit text for each experience

Read `cookie schema` first: regional content requires a compatible deployed application. In Studio,
use **Banner → Content & languages**, or **Rules → Edit text**. Scope, language and visitor screen
are separate selections. First-banner fields differ for choice, notice-only and essential-only
profiles. Preferences, privacy choices, reopen controls and service messages have their own groups;
purpose names and vendor disclosures are in Services.

For a draft with `content.version: 1`, edit `content.shared[profile][locale]` for shared text or
`regionalPolicy.rules[].content[profile][locale]` for an individual rule. These are partial copies
using the existing translation field names. A regional field overrides the shared field; deleting
it restores inheritance. Keep variants for other profiles and languages. Every locale must exist
in `translations`. Do not substitute a country-specific language code for a regional override.

For an older draft without `content`, first preserve its current effective text: create
`content: { version: 1, shared: {} }` and copy the complete existing `translations` into each profile
already used by its rules, then apply the requested override. This avoids changing unrelated
wording. With content enabled, editing legacy `translations` alone may be shadowed by shared text.
Behavior suggestions are English and need review/translation; do not overwrite existing authored
translations or imply automatic legal approval. Adding a language also needs its shared and rule
variants copied or translated. Do not remove a default or rule-fixed language.

`title` is an accessible name in a choice banner and a visible notice heading. `preferences` names
both the first settings link and preferences heading. `dismissNotice` closes a notice without
recording consent. `necessaryLabel` has no current runtime consumer. Edit the actual supported
field, and verify the compiled result with `cookie regions resolve` for each affected audience.

## Save, review and publish

Read the supported save schema with `npx @siteoshq/cli cookie schema --json`. Validate the edited payload without saving using `npx @siteoshq/cli cookie validate --input <draft.json> --json`; inspect both `valid` and `draftVersionMatches`. Invalid configuration or a stale version returns a nonzero exit code. Validation does not acknowledge customer responsibility.

Save the full edited payload with `npx @siteoshq/cli cookie draft save --input <draft.json> --json`. Read `cookie status` and `cookie draft get` again, inspect returned compliance issues and compare the saved values with the intended changes. A version conflict requires reconciling the latest draft; never blindly overwrite it. Saving has no public effect.

Before publication, show a concise field/region/service diff against `publishedConfig` from status, outstanding warnings and the affected website/environment. Cosmetic changes preserve consent choices; material policy changes may require visitors to choose again. Do not equate a publishable configuration with a verified installation.

When publication is authorized, prepare a JSON object with the freshly reviewed `expectedDraftVersion` and a unique stable `idempotencyKey`, then run `npx @siteoshq/cli cookie publish --input <publication.json> --json`. Keep the same key for retries of that exact attempt. Read status and inspect the served public revision after publication; a draft save or build is not successful Edge activation. A changed draft needs a newly reviewed publication attempt.

## Install once and connect tracking

Run `npx @siteoshq/cli cookie installation --json`. Use its exact `delivery` URLs and snippet; do not guess an Edge hostname or use staging endpoints on Production. Missing delivery configuration is a deployment issue. The runtime, configuration and analytics are served by Cookie Edge; receipts/handshakes use the application origin. Production routes share `app.siteos.sh` while remaining independently delivered.

Install one loader through the site's chosen direct/framework/GTM channel. Remove a replaced CMP only as part of the authorized migration and verify that it no longer loads. Published design changes arrive through configuration. The v11 runtime URL is an update channel with a five-minute cache, not an immutable pinned artifact. Old installations cached under the previous one-year policy need a one-time snippet/template URL upgrade to v11. Do not claim that deploying a new runtime updates every browser that cached an older URL.

The current service catalog has `google-analytics`, `google-ads`, `meta-pixel` and `hubspot-tracking`. Selecting a service describes its policy; it does not provision its tracking IDs, install its vendor code, or block every independently loaded script. Inventory and gate each optional resource before execution. Runtime cleanup covers managed resources and reviewed adapters; code that has already run can require a controlled reload on withdrawal. Preserve necessary forms, authentication and explicitly requested support actions separately from optional tracking.

For native **SiteOS Analytics**, set `draft.integrations.siteosAnalytics: true` while preserving `googleConsentMode` and all other draft fields. This is the **Cookie → Services → SiteOS Analytics → Control with Cookie** switch. Publish the reviewed change only when authorized; read back the active revision. Both services must be explicitly attached to the same Project environment. The switch controls detailed pageviews/custom events according to the resolved regional policy and visitor choice, including withdrawal. It does not install Analytics or enable it merely by attaching Cookie. With the switch off (the default), Analytics collects independently. Its separately enabled minimal page counter remains independent of consent; detailed Cookie interaction events always require an explicit Analytics grant. Use `$siteos-analytics` for installation, custom events and reports, and verify both script load orders.

Prefer Basic Consent Mode for the initial pilot. Advanced Consent Mode permits cookieless Google requests before consent and needs an explicit decision and verification. Do not use a timeout as permission to run consent-required tags.

For GTM:

1. Prefer the importable SiteOS custom template from the application origin's `/integrations/gtm/siteos-cookie.tpl`. Copy its public key, runtime, config, analytics and receipts URLs from `cookie installation`. Do not claim a Community Template Gallery listing unless it has been verified.
2. Set **Consent Initialization – All Pages**. The template sets denied defaults synchronously with `setDefaultConsentState` and forwards runtime updates with `updateConsentState`; do not replace those APIs with queued `gtag` consent updates in Custom HTML.
3. Configure consent checks and triggers for each Google and non-Google tag. Blocked tags must be able to fire on the same page after consent; merely changing a consent state does not guarantee every blocked tag is retriggered. Verify actual events and requests in Tag Assistant.
4. Audit optional scripts outside GTM too. The container cannot retroactively prevent an earlier script from executing. Test fresh and returning visits, delayed/blocked CMP loading, GPC, refusal and withdrawal before publishing the container.

A template installation and a container publication are separate actions. This CLI does not inspect or edit GTM containers; use an available authorized GTM tool or provide exact manual instructions. Do not publish a container without user authorization. Gallery distribution is separate from Google CMP certification/IAB TCF support; do not claim either from a working Consent Mode integration.

## Verify and report evidence

Verify a representative real route set in a fresh browser: first visit, Reject, Accept, granular settings, reopening, withdrawal, reload/repeat visit, material-policy changes, GPC, locales and every enabled regional rule. Inspect requests and storage before and after choices, including scripts outside GTM. Check keyboard/focus, mobile safe areas, long text, widget collisions and glass over actual content. Include Safari/WebKit for the pilot; Chrome alone is not cross-browser acceptance.

Check the actual published runtime/config endpoints, revision, strict failure behavior and installation observation. A handshake only proves the runtime was seen; it does not establish correct tag classification or legal compliance. Run `npx @siteoshq/cli cookie analytics --range-days 7 --json` only for actual aggregate observations.

Run `npx @siteoshq/cli cookie verify --json` from the selected website repository. Use `--url /pricing` for another same-origin route and `--browser webkit` for WebKit. If the local browser is missing, follow the command's exact Playwright browser-install instruction, then rerun. Verification uses fresh isolated contexts, public runtime consent actions and actual network/storage observations; it does not reuse an authenticated browser or submit forms. It makes real visits, so installation signals and aggregate consent events may increase.

Keep the complete JSON report with its publication revision, runtime versions, Edge region, scenarios, unknown origins/storage, timestamps and limitations. Reports stay local; Studio does not store or certify them. Exit 0 means the observed scope passed. `needs-review` and `failed` return exit 1; never hide this with `|| true`. Unknown resources, Advanced Consent Mode, delayed tags, first-party/server-side collection, visual/keyboard checks and GTM Tag Assistant need separate review. A single route or one observed country does not prove all routes or regions. Repeat on representative routes and invalidate evidence after website/configuration changes; reports expire after 24 hours.

To restore a published revision into the draft, prepare `{"revision":1,"expectedDraftVersion":3}` using current values and run `npx @siteoshq/cli cookie restore --input <restore.json> --json`. This changes the draft only; review and explicitly publish it to roll back visitor behavior.

Report separately: draft saved, publication activated, installation observed, scenarios verified, unresolved issues and untested scope. CLI 1.2.0 adds schema, validation, regional resolution, browser verification and draft restoration. There is no service-catalog, standalone diff, receipt-export or server-hosted continuous-scanning command. Do not invent these or the obsolete `cookie:pilot:preflight`.

The public installation key and snippet are browser safe. Auth grants, internal delivery credentials and receipt data are not. Never inspect private CLI state or `.env`, reuse browser sessions for API management, or export individual consent receipts as part of routine analytics. Do not fabricate runtime activity when no observations are available.
