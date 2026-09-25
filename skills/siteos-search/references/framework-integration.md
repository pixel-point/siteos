# Editable Search components on any platform

SiteOS does not require a hosted `search.js` widget. The canonical Next.js components are an editable
reference for the interaction and visual design. Deliver native components for the host framework:
React/Next.js, Vue/Nuxt, Svelte, Astro or plain HTML. Reuse the host router, accessible primitives,
styles and build pipeline; do not introduce React or Next.js into a different framework.

`assets/ui-runtime/src/lib/siteos-project-search.ts` exports the framework-neutral
`createSiteOSSearchClient`. Copy/adapt this owned source into the project. It only handles bounded
Search response validation, requests, cancellation signals, safe local result links and optional
signed analytics receipts. It does not render UI or load another script at runtime. In a JavaScript-only
host, transpile it with the existing build or deliver an equivalent local JavaScript module.

```ts
const search = createSiteOSSearchClient({
  endpoint: "/api/search/query",
  analyticsMode: "independent",
});

const controller = new AbortController();
const interactionId = search.canRecordAnalytics() ? crypto.randomUUID() : undefined;
const result = await search.search("tokens", { signal: controller.signal, limit: 10, interactionId });
if (result.success) await search.record(result.analyticsReceipt);
// On a result click: search.record(result.analyticsReceipt, hit.id).
```

Two delivery paths share this client. For a configured Cloudflare Search environment, use the
public endpoint and publishable key returned by Search → Connection or `siteos search delivery`:

```ts
const search = createSiteOSSearchClient({
  endpoint: "https://search.example.com/api/search/public/query",
  publicKey: "spk_PUBLISHABLE_KEY_FROM_SITEOS",
  analyticsMode: "independent",
});
```

No per-site server proxy is needed with Edge. Origin admission and bounded queries run in the
Worker; accepted events receive 202 only after R2 persistence. Enable this path only after
operator deployment and a successful query/event readback. The code in a branch does not imply
that a hosted Worker is available. Check `siteos search delivery status` in the exact environment.
Only explicitly public documents may use this delivery path.

The host-owned `/api/search/query` proxy remains supported for server-held private `psq_` keys.
Keep `psi_`, `psq_`, OAuth and engine credentials server-only. Adapt the existing server route to
the host framework when using this path; never substitute a private key for a publishable key.

Preserve these interactions when adapting:

- The trigger opens a labelled dialog; focus enters it, Escape closes it and focus returns.
- Typing cancels obsolete requests. A late response cannot replace the newer result set.
- Render result text and highlight segments as text; never inject provider HTML.
- Preserve engine order, support pagination, and distinguish zero results from a failed request.
- Result navigation uses validated local paths and real anchors. Keep mobile controls reachable.
- Read the index collection settings and match `analyticsMode`. Independent collection needs no
  consent callback; `consent_required` uses `canRecordAnalytics` with actual current consent.
  Existing callbacks without an explicit mode retain their consent-required behavior.
- Generate an in-memory interaction ID only when `search.canRecordAnalytics()` allows it; pass it
  to `search.search`. Record the settled result receipt, including zero results, via `search.record`.
  Record result clicks with their document ID and receipt before navigation. Keep the ID across
  typing/pagination; clear it on close, clearing the query or permission withdrawal.
- GPC, DNT, `window.SiteOSSearchDisabled` and `isAnalyticsDisabled` stop events. Recheck at send
  time. Do not add storage/visitor profiles or report a fabricated consent grant.

For existing Next.js delivery, the `searchSiteOSProject` convenience function and consent helper
retain the current `/api/search/query` endpoint. Other frameworks can use the factory directly.
Use [UI delivery](ui-runtime-delivery.md) for host inspection, adaptation and acceptance.

## Hosted suggestions

The editable client's `suggestions(signal?)` method reads curated articles for the empty-query
state without an engine query or an analytics event. If the query URL ends in `/query`, implement
its sibling `/suggestions`; otherwise append `/suggestions`. A Next.js host can use the bundled
suggestions route and shared `runtime-url.ts` helper; other frameworks should implement the same
server-only credential forwarding. Edge serves `/api/search/public/suggestions` using the same
public key, origin policy and configuration lease. Preserve array order and safe text rendering.
`configured: true` with no items means intentionally empty, not a signal to restore static defaults.
