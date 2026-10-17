# Regional rule templates

Templates are reviewed starting points for one regulation or region: EEA (GDPR and ePrivacy),
United Kingdom, Switzerland, United States state privacy laws, California with opt-in for recording
and pixels, Quebec, Brazil and India. Each one fills an ordinary regional rule: audience, technical
profile, first layer, OK action, every optional purpose of the site and template provenance. Prefer
them over hand-written rule JSON. They do not decide which laws apply to a business and are not legal
advice; the customer confirms the regions and publication remains a separate, authorized step.

Use a CLI whose `cookie --help` lists `templates list` and `templates apply`, with a compatible
deployed application. Without them, write rules by hand as described in the Cookie skill.

## Read the catalog

```bash
npx @siteoshq/cli cookie templates list --json
```

The result contains:

- `draftVersion`, to pass to `templates apply`;
- `templates[]`: `id`, `version`, `label`, `summary`, `who`, `laws[]` (with `sourceUrl` where
  reviewed), `audience`, `profile`, `optOutAction`, `requirements[]` (`key`, `text`), `scope`,
  `reviewedAt` (null while the catalog is a draft) and `coverage` for this site: `available`,
  `partial` or `covered` with the covering rule names;
- `recommendations[]`: `templateId`, `share` of banner views in the last 90 days, optional `note`.
  Only uncovered regions with at least 1% (`recommendationThreshold`) appear. A state or province
  template uses its whole country's share. The California template is recommended only when the
  site has session recording or an advertising pixel;
- `trafficAvailable`: false when banner views could not be read. Recommendations are then empty;
  missing traffic is unknown, not zero;
- `rules[]`: each current rule and, when it came from a template, its `status` (`matches`,
  `customized`, `unknown`) and whether a newer template version exists (`outdated`).

## Propose, confirm, apply

1. Read `templates list`, `cookie status` and, when useful, `cookie analytics --range-days 90`.
2. Propose the recommended templates first, largest share first, then any template the customer
   asked for. For each, state the audience in words (`who`), what visitors get before a choice
   (opt-in: optional services stay off; opt-out: they run, with GPC honored and the two US privacy
   choices), the main laws, the `requirements` and the `scope` note. Mention covered regions instead
   of proposing duplicates.
3. Ask only what changes the choice and cannot be read from the site: whether the business advertises
   to or shares data about US visitors, whether it uses session recording, chat or pixels for
   California visitors, and whether it serves Quebec. Sensitive data and minors are out of scope;
   say so instead of improvising a rule.
4. Apply only the templates the customer confirmed, in one call:

   ```bash
   npx @siteoshq/cli cookie templates apply --template eea-gdpr --template us-state-privacy --expected-draft-version 7 --json
   ```

   `--template` repeats or takes a comma-separated list. The result lists `added` rule keys and the
   compiled `compliance` summary. A stale version returns a conflict: read the catalog again and
   reapply, never overwrite. The call changes only the draft.
5. Check the result: `cookie regions resolve --source draft` for the affected audiences, for
   example `--country DE`, `--country GB`, `--country US --subdivision CA`, `--country CA
   --subdivision QC` and no country for unknown location. Report blockers and warnings from
   `compliance`.
6. Work through each template's `requirements`: the permanent Your Privacy Choices entry, Google
   Consent Mode Basic unless Advanced was chosen deliberately, the GPP `usnat` not-signatory signal,
   and `usPrivacyPurposes` on advertising and data-sharing services. Use the existing workflows in
   this skill; do not change these settings silently.
7. Show the draft diff against the published configuration and publish only with explicit
   authorization, then verify the installation.

## Rules already on the site

- Keep existing rules and keys. A template whose region is `covered` adds a second rule; the more
  specific rule wins (state over country over group), then higher priority. Add it only when the
  customer wants to replace or narrow the existing behavior, and explain which rule then applies.
- A rule with template status `customized` keeps the customer's edits. Do not reset it to the
  template without being asked.
- `outdated` means a newer catalog version exists. Describe the difference and let the customer
  decide; never change a published policy because the catalog changed.
- Never set `customerResponsibilityReviewed`. Applying a template is not the customer's
  acknowledgement, and a reviewed template is not a compliance certificate.
