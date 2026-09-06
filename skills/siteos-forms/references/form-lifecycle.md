# Form lifecycle

Check `siteos forms --help` for these commands and confirm the selected server supports the lifecycle
API. The repository source CLI may be ahead of the published npm CLI or deployed server. Never use
direct database writes as a fallback. Auth, common Project selection and the explicit Environment
binding remain prerequisites. Use `forms:workspace:write` grants; only owners/admins may change forms.

```sh
siteos forms definition list --environment <slug> --status all --json
siteos forms definition read --environment <slug> --form <form-id> --json
siteos forms definition archive --environment <slug> --form <form-id> --expected-revision <revision> --json
siteos forms definition restore --environment <slug> --form <form-id> --expected-revision <revision> --json
siteos forms definition delete --environment <slug> --form <form-id> --json
```

Active is the default list. API status `inactive` means Archive. Archive closes new submissions,
hides the form from Active and preserves all history. Restore is explicit; ordinary sync returns
`FORM_ARCHIVED` and must not automatically restore it. An identical accepted retry can return its
saved receipt while archived; that is not a new submission.

Deletion without `--apply` is read-only. Show the exact Project, Environment, key, version and answer
count before asking for any still-missing destructive authorization. Existing explicit authorization
for that exact target remains sufficient. Then use those same preview values:

```sh
siteos forms definition delete --environment <slug> --form <form-id> --apply --confirm <form-key> --expected-revision <revision> --expected-submissions <count> --json
```

A changed revision or answer count returns `CONFLICT`. Read a new preview and review the new state;
never silently replace the confirmation values or retry a destructive command with fresh counts.
After deletion, read returns `NOT_FOUND` and runtime/sync returns `FORM_DELETED`. Versions and answers
are purged from the working database. Only a minimal tombstone remains to reserve the key. Use a new
key for an intentionally new form. There is no restore for deletion. Backups follow separate operator
retention and are not a product recycle bin.

Never revoke shared Environment credentials to retire one form. Never delete forms merely because
a manifest no longer lists them. Update the host UI/runtime and manifest deliberately after archive
or deletion; stale deployments must receive a closed-form error and cannot resurrect the resource.
Report source implementation, server deployment and public CLI/plugin publication separately.
