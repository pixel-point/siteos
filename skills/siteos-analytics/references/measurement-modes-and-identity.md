# Measurement modes and optional website identity

Read the installed `analytics --help` first; this source does not prove an npm/server/runtime release.
Use the exact selected Project/environment and existing access. Do not call private APIs to bypass
missing command support. These commands require an owner/admin and Analytics workspace-write grant.

## Review before applying

```sh
npx @siteoshq/cli analytics measurement show --environment <slug> --json
npx @siteoshq/cli analytics measurement prepare --file <plan.json> --environment <slug> --json
npx @siteoshq/cli analytics measurement review --environment <slug> --json
npx @siteoshq/cli analytics measurement activate --file <activation.json> --environment <slug> --json
```

`show` returns `resourceRevision` and `planRevision`. `prepare` takes those exact fences and `policy`:

```json
{
  "resourceRevision": 1,
  "planRevision": 0,
  "policy": {
    "schemaVersion": 1,
    "mode": "visitor_recognition",
    "website": { "consent": "independent", "minimalPageviews": true },
    "consent": { "provider": "cookie" },
    "retention": { "browserRecognitionDays": 30, "historyRetentionDays": 365, "renewOnActivity": false }
  }
}
```

The numbers above illustrate shape, not valid current fences or a retention recommendation.
Default is Cookieless with 30-day history. Browser recognition is 1–90 days from the original grant,
without activity renewal; detailed history is independently 30–730 days. Longer history never
recovers deleted/expired events. A shorter history changes existing deadlines irreversibly.
Use the requested/minimum necessary lifetime, not the maximum merely because it is supported.

`review` must be ready before activation. For Cookie it checks the exact published resource, scopes,
recognition/history limits and optional identity fields. The Analytics browser review can prepare
a matching **Cookie draft** while preserving its other settings. Review and publish it explicitly
in Cookie, then repeat Analytics review. CLI callers use the Cookie skill and its own authorization;
an Analytics grant cannot write or publish Cookie. A separately published website-details gate can
remain even when an Analytics plan says independent; inspect `additionalWebsiteControl`.

The activation file contains the review's exact `plan.resourceRevision`, `plan.planRevision` and
`cookiePublication` (object or null). Add `confirmHistoryReductionDays` only after the user approves
the reported shortening and impact. Never retry a conflict with invented/new fences: reread and
review. `measurement discard --file <fences.json>` discards only the draft. `settings set --enabled`
controls collection, not measurement mode.

Read installation again after activation. Install its recognition opt-in once and reload the site.
Recognition needs the active policy **and** affirmative permission. Refusal leaves independent
cookieless collection running; a separate website-details gate or GPC/DNT/full opt-out still applies.
No old cookieless facts become linked retroactively. Changing mode retires prior browser contexts.

## External CMP and GTM

External mode uses `consent.provider: external`, a stable `bindingKey`, and separate
`recognition: { purposeKey, policyVersion }`. Add `website` only when website consent is required,
and `identity` only when account/contact identity is selected. Identity needs a distinct purpose.
All keys describe the published material policy, not a visitor. Preserve original grant and expiry.

Call `SiteOSAnalytics.setConsent` with an array of original scoped records on ready and every
choice change, including withdrawal. Each has `schemaVersion: 1`, exact `resourceKey`, `scope`
(`website`, `recognition` or `identity`), binding/purpose/policy keys, status and original
`grantedAt`/`expiresAt` in epoch milliseconds for a grant. Never infer these from a boolean.
Owner-selected requirements remain authoritative; the snapshot cannot select capabilities.

GTM: enable visitor recognition; map that array to **External recognition / identity permissions**.
Keep **Require external consent for website details** off unless an additional website gate is
intended. When using both, include its website record in the array too. Initialize/update ungated
on every CMP change; refusal must not prevent cleanup or base collection. The template requires
numeric loader `recognitionVersion` and `permissionsVersion` 1; an identity backend additionally
requires `identityVersion` 1. Native Cookie needs no mapped records. Update template and runtime
together and verify actual Tag Assistant/network/report behavior; Gallery sync is not publication.

## Accounts and submitted contacts

Optional `policy.identity` selects `account` and/or `submitted_contact`, each with `profileFields`.
An empty list allows only an opaque subject. Allowed fields: `email`, `displayName`; accounts may
add `emailVerified` only with email. No photos, arbitrary traits, automatic email discovery or merging
by email. A submitted contact is not a verified account. Cookieless sites need none of this setup.

Register the customer backend's **public** Ed25519 JWK with a bounded UTC expiry:

```sh
npx @siteoshq/cli analytics identity-keys register --file <public-key.json> --environment <slug> --json
npx @siteoshq/cli analytics identity-keys list --environment <slug> --json
npx @siteoshq/cli analytics identity-keys revoke <key-id> --environment <slug> --json
```

File shape: `{ "publicKey": { "kty": "OKP", "crv": "Ed25519", "x": "..." }, "expiresAt": "...Z" }`.
Never place a private key in the repo, CLI output, browser, GTM or prompts. Registration does not
activate identity. The backend must derive its own logged-in account or accepted submission from
trusted server state, not sign a supplied browser subject/profile. Validate same-origin JSON POST,
CSRF/session authority, exact application/resource audience, kind and bounded challenge; return a
short-lived signed assertion only, with no-store. Do not create a generic signing oracle.

Bind its same-origin path using `data-siteos-identity-endpoint` on the recognition-enabled script,
or **Website identity backend** in GTM. After the site's session is resolved on each document and
after permission, call `await SiteOSAnalytics.identify("account")`; after an accepted contact
submission use `"submitted_contact"`. Neither call accepts an email or arbitrary ID. A new document
must confirm the same account; stale tabs stay unlinked. Before logout/account or identity-kind
changes call `await SiteOSAnalytics.resetIdentity()`; false means cleanup is not confirmed and must
not be reported as success. Do not prevent logout, invent success or identify the next account from
stale state. Missing/denied permission yields no identity, with independently permitted base intact.

Identity requires an explicit choice made **after owner activation**, including reactivation. For
native Cookie, invite the visitor to reopen preferences (`SiteOSCookie.openPreferences()`) when the
site offers this optional feature; never manufacture a new timestamp or force acceptance. External
CMPs need their real corresponding choice flow. Publication before activation alone is not enough.

Sensitive People list/history/export/erase is owner/admin browser-only; existing CLI/MCP grants
cannot read it. Do not use aggregate tools to extract profiles. Each export is a bounded page,
not a promise of complete history. Erasure hides fields/history and revokes links immediately;
physical cleanup and backup expiry are separate operations, with reingestion fences retained.

## Evidence

`report` supports native custom ranges up to 730 calendar days and existing shared filters.
`recognitionReport` contains browser counts, returning browsers, event coverage, daily trends and
exact-day 1/7/30 cohorts. These are retained matching browser contexts, not authenticated people;
unfinished observation periods are null, not zero. Profiles are never included. Verify consent
unknown/grant/refusal/withdrawal, reload, multiple tabs, account switch, key revocation and erasure
against the real installed runtime and saved reports. Sample uses the same views but synthetic data.
