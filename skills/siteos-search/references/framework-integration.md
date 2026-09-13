# Editable Search components on any platform

SiteOS does not require a hosted `search.js` widget. The canonical Next.js components are an editable
reference for the interaction and visual design. Deliver native components for the host framework:
React/Next.js, Vue/Nuxt, Svelte, Astro or plain HTML. Reuse the host router, accessible primitives,
styles and build pipeline; do not introduce React or Next.js into a different framework.

`assets/ui-runtime/src/lib/siteos-project-search.ts` exports the framework-neutral
`createSiteOSSearchClient`. Copy/adapt this owned source into the project. It only handles bounded
Search response validation, requests, cancellation signals, safe local result links and optional
consented receipts. It does not render UI or load another script at runtime. In a JavaScript-only
host, transpile it with the existing build or deliver an equivalent local JavaScript module.

```ts
const search = createSiteOSSearchClient({
  endpoint: "/api/search/query",
  canRecordAnalytics: () => consentManager.hasConsent("analytics"),
});

const controller = new AbortController();
const result = await search.search("tokens", { signal: controller.signal, limit: 10 });
```

Two delivery paths share this client. For a configured Cloudflare Search environment, use the
public endpoint and publishable key returned by Search → Connection or `siteos search delivery`:

```ts
const search = createSiteOSSearchClient({
  endpoint: "https://search.example.com/api/search/public/query",
  publicKey: "spk_PUBLISHABLE_KEY_FROM_SITEOS",
  canRecordAnalytics: () => consentManager.hasConsent("analytics"),
});
```

No per-site server proxy is needed with Edge. Origin admission and bounded queries run in the
Worker; consented events receive 202 only after R2 persistence. Enable this path only after
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
- Analytics needs current consent plus backend enablement. GPC and DNT disable it. Generate a
  per-interaction ID only after consent; keep it across pagination, and discard it on consent
  withdrawal. Send query and click receipts only through `record` with a live consent callback.

For existing Next.js delivery, the `searchSiteOSProject` convenience function and consent helper
retain the current `/api/search/query` endpoint. Other frameworks can use the factory directly.
Use [UI delivery](ui-runtime-delivery.md) for host inspection, adaptation and acceptance.
