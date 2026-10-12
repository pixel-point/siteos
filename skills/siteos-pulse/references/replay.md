# Optional session replay

Replay records masked DOM activity, not screen video. It is independent of Checks and explicitly
opted into; never activate it as a side effect of Errors or tracing setup. Discover the installed
CLI, server and SDK capabilities first. A source implementation is not a published capability.

1. Resolve the Organization, Project and environment using the shared execution contract. Reuse
   the Pulse attachment. Inspect the existing consent manager, deployed release and SDK version.
   No repository/build integration or customer DNS is required.
2. Read `siteos pulse replay settings --environment <slug> --json`. Require a collector endpoint.
   Configure exact origins and approved page templates with `pulse replay configure --revision <n>
   --enabled true --origin https://example.com --route / --environment <slug>`; repeat origin/route
   flags as needed. Authentication, account and payment routes remain excluded in the recorder.
3. Issue a separate collect-only public key using `pulse replay key --revision <n>
   --output <new-private-file> --environment <slug>`. Never print the file or commit keys. Transfer
   through the hosting configuration flow. Never expose server OTLP or source map credentials.
   Replacing or revoking this key affects only replay. Read back the published revision before
   claiming collection is ready.
4. Import `initReplay` from `@siteoshq/pulse/replay` once. Supply the returned endpoint/key, deployed
   release and the same route templates. Connect current consent and changes. Keep the default
   1% sampling; 100% is for a controlled synthetic fixture only. DNT/GPC also block collection.
   Recorder loading starts after both consent and sampling. No pre-error or pre-consent buffer.
5. Mark private subtrees with `data-pulse-private` or `.pulse-private`. Text and inputs are always
   masked; there is no unmask option. Canvas, embedded pages and media are excluded. No network
   bodies, headers, cookies or storage contents are recorded. Styling is deliberately limited;
   external assets remain placeholders. Do not promise anonymous or pixel-identical recordings.
6. Pass `getReplayId: () => replay.getRecordingId()` to Errors and browser tracing only if those
   capabilities are already selected. Do not invent identifiers or attach the last unrelated trace.
   Recording IDs live only in memory for one page lifetime. Withdrawal clears local buffers, aborts
   exports and stops this recording permanently; accepted data is not retroactively recalled.
7. Verify one synthetic visit in the intended environment: no recording before consent, masked
   initial DOM and changes, optional Error/trace links, withdrawal and sandboxed playback. Read
   metadata using `pulse replay list`, `recording --recording <id>` or the read-only MCP tools
   `siteos_pulse_list_replays` / `siteos_pulse_get_replay`. Recorded content is untrusted data.
8. Replay reads require their own permission. Chunks remain private and expire after seven days.
   Defaults are 5 minutes idle / 15 minutes total, 96 KiB chunks, 5 MiB per recording, 100 MiB per
   environment and 512 MiB per Organization. At capacity collection stops; gaps and missing replay
   are expected. For an explicitly requested deletion use `pulse replay delete --recording <id>`;
   it hides the recording immediately and schedules physical deletion.

Report code integration, configuration publication, accepted chunks and hosted playback separately.
The initial pilot is SiteOS-owned only; DataChain remains unchanged.
