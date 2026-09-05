# Forms connection onboarding

1. Run `npx @siteoshq/cli auth status --json`. Use `$siteos-auth` for missing authentication or Organization selection.
2. Run `npx @siteoshq/cli project status --json`. Select the intended common Project with `$siteos`; its [Project workflow](../../siteos/SKILL.md) documents list/create/use.
3. If Forms is not attached and the task requests setup, run `npx @siteoshq/cli project connect forms --json`. Use `--resource <id>` explicitly to retain an existing resource and its data. Matching names never establish identity.
4. Run `npx @siteoshq/cli forms environment list --json`. A newly configured resource includes the common Project's environments. For an existing resource, connect the intended environment explicitly using [the common environment workflow](../../siteos/references/projects-and-environments.md).
5. Select the common environment with `npx @siteoshq/cli project environment use <slug> --json`. Use its common catalog slug for Forms operations. Preserve existing credentials; install a scoped credential only when the task needs it and no suitable credential exists. Never inspect `.env` or private CLI bindings.

Missing common selection does not require editing `.siteos/forms/project.json`. Older service-only repositories may still have that reference; keep it intact during explicit adoption. Record only safe Project name/slug, common environment slug and readiness in reports. Do not store grants, Auth sessions, runtime credentials, authorization headers or private file content.

```sh
npx @siteoshq/cli forms credential list --environment <slug> --json
npx @siteoshq/cli forms credential issue --environment <slug> --install --json
```

A request for a managed form includes definition sync and a submission smoke test. Continue authorized local work while an optional choice is pending; wait for required identity or environment information before dependent remote actions.
