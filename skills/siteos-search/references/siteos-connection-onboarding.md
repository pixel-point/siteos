# SiteOS Search connection onboarding

Use this reference before editing a target repository when authentication, the Search Project selection, or an explicit Search Environment slug is unavailable.

## Auth prerequisite

Run `npx @siteoshq/cli auth status --json`. If signed out or no Organization is selected, invoke `$siteos-auth` and stop Search work until that identity prerequisite succeeds. Auth does not create or select Search Projects.

## Search Project gate

```sh
npx @siteoshq/cli search project status --json
npx @siteoshq/cli search project list --json
```

When the intended existing Search Project is explicit:

```sh
npx @siteoshq/cli search project use <slug> --json
```

When a new Search Project is required, require an explicit slug and display name:

```sh
npx @siteoshq/cli search project create --slug <slug> --name <name> --json
npx @siteoshq/cli search project use <slug> --json
```

Use `--replace` only after explicit approval. The tracked `.siteos/search/project.json` contains version 1, service `search`, and the safe name/slug. The immutable Project ID remains in private CLI state. Never inspect, print, or edit `~/.siteos/project-bindings.json`.

No Search command may create, select, link, or mutate a Pulse or Forms Project. Matching names/slugs are not shared identity.

## Search Environment gate

After Search Project selection succeeds, use `npx @siteoshq/cli search environment list --json`. Require an explicit Environment slug and display name from the user or task context. Create an empty Environment or fork a named source Environment only after that choice; never infer `prod` or silently select another Environment.

Record only product-owned safe state:

```sh
node .agents/skills/siteos-search/scripts/session-state-cli.mjs set-siteos-connection \
  --session-file "$SESSION_FILE" \
  --linkage-status ready \
  --api-base-url-source config \
  --project-name "<project-name>" \
  --project-slug "<project-slug>" \
  --environment-slug "<environment-slug>" \
  --config-path ".siteos/search/project.json"
```

Do not store Auth status, Organization selection, immutable Project IDs, authorization proofs, service grants, runtime credentials, headers, or full config content in Search session state.

## Scoped Search credentials

```sh
npx @siteoshq/cli search indexing-credential list --environment <slug> --json
npx @siteoshq/cli search credential list --environment <slug> --json
npx @siteoshq/cli search indexing-credential issue --environment <slug> --install --json
npx @siteoshq/cli search credential issue --environment <slug> --install --json
```

Issue only when no suitable active credential exists. Use matching `rotate --install --json` only for intentional replacement. Never inspect `.env` or reveal installed plaintext.

## Safe reporting

Report only Auth readiness, safe Organization identity, Search Project name/slug/status, explicit Environment slug, credential metadata, and installation status returned by the CLI. Never report tokens, sessions, assertions, grants, immutable private bindings, runtime credentials, headers, private files, environment contents, or absolute private paths.
