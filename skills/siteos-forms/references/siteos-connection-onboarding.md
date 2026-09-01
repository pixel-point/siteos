# SiteOS Forms connection onboarding

Use this reference before editing a target repository when authentication, the Forms Project selection, or an explicit Forms Environment is unavailable.

## Auth prerequisite

Run `npx @siteoshq/cli auth status --json`. If signed out or no Organization is selected, invoke `$siteos-auth` and stop Forms work until that identity prerequisite succeeds. Auth does not create or select product Projects.

## Forms Project gate

Inspect only safe product-owned CLI output:

```sh
npx @siteoshq/cli forms project status --json
npx @siteoshq/cli forms project list --json
```

When the intended existing Project is explicit, select it by slug:

```sh
npx @siteoshq/cli forms project use <slug> --json
```

When a new Forms Project is required, require an explicit slug and display name:

```sh
npx @siteoshq/cli forms project create --slug <slug> --name <name> --json
npx @siteoshq/cli forms project use <slug> --json
```

Use `--replace` only after explicit approval. The tracked `.siteos/forms/project.json` contains version 1, service `forms`, and the safe name/slug. The immutable Project ID remains in private CLI state. Never inspect, print, or edit `~/.siteos/project-bindings.json`.

No Forms command may create, select, link, or mutate a Pulse or Search Project. Matching slugs are not shared identity.

## Forms Environment gate

```sh
npx @siteoshq/cli forms environment list --json
npx @siteoshq/cli forms environment create --slug <slug> --name <name> --json
```

Require an explicit Environment slug and display name before creation. Never infer `prod`, silently create an Environment, or delegate Forms product state to `$siteos-auth`.

Inspect safe credential metadata before initial issue/install or intentional rotation:

```sh
npx @siteoshq/cli forms credential list --environment <slug> --json
npx @siteoshq/cli forms credential issue --environment <slug> --install --json
npx @siteoshq/cli forms credential rotate --environment <slug> --install --json
```

Never read the installed plaintext credential or inspect `.env`.

## Safe reporting

Report only Auth readiness, safe Organization identity, Forms Project name/slug/status, Forms Environment metadata, and credential installation metadata returned by the CLI. Never report tokens, sessions, assertions, grants, immutable private bindings, runtime credentials, headers, private files, or environment contents.
