#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SECRET_PATTERNS = [
  /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi,
  /\bsiteos_[A-Za-z0-9_-]+/g,
  /\bmeili[A-Za-z0-9_-]*\b/gi,
];

const GENERATED_HTML_SAFETY_PATTERNS = [
  { label: "apiKey", pattern: /\bapiKey\b/i },
  { label: "Authorization header", pattern: /\bAuthorization\b/i },
  { label: "Bearer token", pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]+/i },
  { label: "project API key", pattern: /\bsiteos_[A-Za-z0-9_-]+/ },
  { label: "Meilisearch marker", pattern: /\bmeili[A-Za-z0-9_-]*\b/i },
  { label: "raw query event array", pattern: /\brawQueryEvents\b/i },
  { label: "raw query text", pattern: /\brawQueryText\b/i },
  { label: "raw linkage file", pattern: /\.siteos\/project\.json/i },
  { label: "remote http URL", pattern: /http:\/\//i },
  { label: "remote https URL", pattern: /https:\/\//i },
  { label: "remote script", pattern: /<script\s+[^>]*src\s*=/i },
  { label: "remote stylesheet", pattern: /<link\s+[^>]*href\s*=/i },
  { label: "CDN reference", pattern: /\bcdn\b/i },
  { label: "Chart.js dependency", pattern: /Chart\.js/i },
];

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      continue;
    }
    const [key, inlineValue] = arg.slice(2).split("=", 2);
    const value = inlineValue ?? argv[index + 1];
    if (inlineValue === undefined) {
      index += 1;
    }
    args.set(key, value);
  }
  return args;
}

function usage() {
  return [
    "Usage: node scripts/render-analytics-report.mjs --input <input.json> --output <index.html>",
    "Input must contain an analytics response and may contain diagnostics.",
  ].join("\n");
}

function redactText(value) {
  let text = String(value ?? "");
  for (const pattern of SECRET_PATTERNS) {
    text = text.replace(pattern, "<redacted>");
  }
  return text;
}

function escapeHtml(value) {
  return redactText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function assertGeneratedHtmlSafe(html) {
  const violation = GENERATED_HTML_SAFETY_PATTERNS.find(({ pattern }) =>
    pattern.test(html),
  );
  if (violation) {
    throw new Error(
      `Generated report failed safety scan: ${violation.label} detected.`,
    );
  }
}

function numberValue(value) {
  return Number.isFinite(value) ? value : 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(numberValue(value));
}

function formatOptionalNumber(value) {
  return Number.isFinite(value) ? formatNumber(value) : "n/a";
}

function formatDate(value) {
  if (!value) {
    return "n/a";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function statusClass(status) {
  if (
    ["ready", "active", "succeeded", "available", "success"].includes(status)
  ) {
    return "good";
  }
  if (
    ["degraded", "needs_setup", "running", "indexing", "queued"].includes(
      status,
    )
  ) {
    return "warn";
  }
  return "bad";
}

function metricCard(label, value, detail = "") {
  return `<article class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></article>`;
}

function countsList(counts = {}) {
  const entries = Object.entries(counts);
  if (entries.length === 0) {
    return '<p class="muted">No counts reported.</p>';
  }
  const max = Math.max(...entries.map(([, value]) => numberValue(value)), 1);
  return `<div class="bars">${entries
    .map(([label, value]) => {
      const numeric = numberValue(value);
      const width = Math.max(4, Math.round((numeric / max) * 100));
      return `<div class="bar-row"><span>${escapeHtml(label)}</span><div class="bar"><i style="width: ${width}%"></i></div><strong>${formatNumber(numeric)}</strong></div>`;
    })
    .join("")}</div>`;
}

function sourceRows(sources = []) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return '<tr><td colspan="6">No sources reported.</td></tr>';
  }
  return sources
    .map(
      (source) => `<tr>
        <td>${escapeHtml(source.sourceKey)}</td>
        <td>${escapeHtml(source.label)}</td>
        <td>${escapeHtml(source.sourceType)}</td>
        <td>${escapeHtml(formatOptionalNumber(source.documentCount))}</td>
        <td>${escapeHtml(source.activationMode)}</td>
        <td><span class="pill ${statusClass(source.status)}">${escapeHtml(source.status)}</span></td>
      </tr>`,
    )
    .join("");
}

function recommendedActions(diagnostics) {
  const actions = diagnostics?.recommendedActions;
  if (!Array.isArray(actions) || actions.length === 0) {
    return "<li>No recommended actions reported.</li>";
  }
  return actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("");
}

function limitationsList(analytics) {
  const limitations = analytics?.limitations;
  const items = Array.isArray(limitations) ? limitations : [];
  if (!items.includes("recent_process_local_query_telemetry")) {
    items.push("recent_process_local_query_telemetry");
  }
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function latestFailure(failure) {
  if (!failure) {
    return "No latest failure reported.";
  }
  return `${failure.scope ?? "unknown"}: ${failure.code ?? "no-code"} - ${failure.message ?? "No message"}`;
}

function architectureCards() {
  const cards = [
    {
      title: "Host project boundary",
      body: "The app owns the visible search UI and the local query route that proxies environment search requests.",
    },
    {
      title: "Environment credential path",
      body: "The environment query credential stays on the server side of the host route; reports only describe that boundary.",
    },
    {
      title: "Sync and indexing path",
      body: "The operator sync command collects confirmed sources, sends aggregate documents to SiteOS, and updates the selected environment index.",
    },
    {
      title: "SiteOS search environment",
      body: "SiteOS owns the managed index, query target, analytics summary, diagnostics, sync runs, and job status.",
    },
    {
      title: "Report ownership",
      body: "This page is an operator sidecar artifact outside the target project, built from redacted aggregate analytics.",
    },
  ];

  return cards
    .map(
      (card) => `<article class="flow-card">
        <h3>${escapeHtml(card.title)}</h3>
        <p>${escapeHtml(card.body)}</p>
      </article>`,
    )
    .join("");
}

function renderReport(input) {
  const analytics = input.analytics ?? {};
  const diagnostics = input.diagnostics ?? null;
  const environment = analytics.environment ?? {};
  const queryActivity = analytics.queryActivity ?? {};
  const queryProtection = queryActivity.logging ?? {};
  const sync = analytics.sync ?? {};
  const syncFreshness = sync.freshness ?? {};
  const jobs = analytics.jobs ?? {};
  const sourceCoverage = analytics.sourceCoverage ?? {};
  const environmentSlug =
    input.environmentSlug ?? analytics.environmentSlug ?? environment.slug ?? "unknown";
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const apiBaseUrlSource = input.apiBaseUrlSource ?? "unknown";
  const latestRunStatus =
    syncFreshness.latestRunStatus ?? sync.latestRun?.status ?? "none";
  const latestRunFinishedAt =
    syncFreshness.latestRunFinishedAt ?? sync.latestRun?.finishedAt;
  const telemetryScope =
    queryActivity.telemetryScope ?? "in-process-recent-events";
  const queryProtectionRetention =
    queryProtection.retention ?? "process-lifetime-or-200-events";
  const queryProtectionScope = queryProtection.scope ?? "in-process";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SiteOS Search Analytics Report</title>
  <style>
    :root { color-scheme: light; --ink: #17201a; --muted: #637064; --paper: #f7f2e8; --card: #fffaf0; --line: #d9cdb6; --good: #276749; --warn: #9a5b00; --bad: #9b2c2c; --accent: #245f73; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ui-serif, Georgia, Cambria, "Times New Roman", serif; color: var(--ink); background: radial-gradient(circle at top left, #fff7d6, transparent 30rem), var(--paper); }
    main { width: min(1120px, calc(100% - 32px)); margin: 0 auto; padding: 40px 0 56px; }
    header { border: 1px solid var(--line); background: rgba(255, 250, 240, 0.84); padding: 28px; box-shadow: 8px 8px 0 #e2d3b5; }
    h1 { margin: 0 0 8px; font-size: clamp(2rem, 5vw, 4rem); line-height: 0.95; }
    h2 { margin: 0 0 16px; font-size: 1.3rem; }
    section { margin-top: 28px; border: 1px solid var(--line); background: rgba(255, 250, 240, 0.9); padding: 22px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; }
    .metric { border: 1px solid var(--line); background: white; padding: 14px; min-height: 110px; }
    .metric span, .muted, small { color: var(--muted); }
    .metric strong { display: block; margin: 10px 0 6px; font-size: 1.65rem; }
    .pill { display: inline-block; border-radius: 999px; padding: 3px 9px; color: white; font-size: 0.82rem; }
    .good { background: var(--good); }
    .warn { background: var(--warn); }
    .bad { background: var(--bad); }
    .bars { display: grid; gap: 10px; }
    .bar-row { display: grid; grid-template-columns: minmax(110px, 1fr) 3fr 64px; gap: 10px; align-items: center; }
    .bar { height: 12px; background: #eadfc9; overflow: hidden; }
    .bar i { display: block; height: 100%; background: var(--accent); }
    .callout { border-left: 4px solid var(--accent); background: #f4ead6; padding: 12px 14px; color: var(--ink); }
    .flow-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; }
    .flow-card { border: 1px solid var(--line); background: white; padding: 14px; }
    .flow-card h3 { margin: 0 0 8px; font-size: 1rem; }
    .flow-card p { margin: 0; color: var(--muted); }
    section[id] { scroll-margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th, td { border: 1px solid var(--line); padding: 9px; text-align: left; vertical-align: top; }
    th { background: #f1e5cf; }
    code { background: #efe2c9; padding: 2px 5px; }
  </style>
</head>
<body>
<main>
  <header>
    <h1>SiteOS Search Analytics Report</h1>
    <p>Generated at ${escapeHtml(formatDate(generatedAt))} for environment <code>${escapeHtml(environmentSlug)}</code>. API base URL source: ${escapeHtml(apiBaseUrlSource)}.</p>
  </header>

  <section id="environment">
    <h2>Environment</h2>
    <div class="grid">
      ${metricCard("Environment", environment.name ?? "Unknown", environment.slug ?? environmentSlug)}
      ${metricCard("Status", environment.status ?? "unknown", environment.hasIndex ? "index present" : "index missing")}
      ${metricCard("Documents", formatNumber(environment.documentCount), "current index document count")}
      ${metricCard("Query route", `/api/search/environment/${environmentSlug}`, "server-only credential required")}
    </div>
  </section>

  <section id="readiness-diagnostics">
    <h2>Readiness And Diagnostics</h2>
    <div class="grid">
      ${metricCard("Diagnostics status", diagnostics?.status ?? "not provided", diagnostics?.readiness?.primaryCode ?? "no primary code")}
      ${metricCard("Backend health", diagnostics?.diagnostics?.backendHealth?.status ?? "not provided", diagnostics?.diagnostics?.backendHealth?.message ?? "")}
      ${metricCard("Latest failure", latestFailure(diagnostics?.diagnostics?.latestFailure), "")}
    </div>
    <h3>Recommended Actions</h3>
    <ul>${recommendedActions(diagnostics)}</ul>
  </section>

  <section id="query-activity">
    <h2>Query Activity</h2>
    <p class="muted">Telemetry scope: <code>${escapeHtml(telemetryScope)}</code>. Query-protection retention: <code>${escapeHtml(queryProtectionRetention)}</code>; scope: <code>${escapeHtml(queryProtectionScope)}</code>.</p>
    <p class="callout">Query activity uses in-process recent-event telemetry only. It does not include durable query history, top queries, zero-result analytics, click tracking, raw query text, or client identifiers.</p>
    <div class="grid">
      ${metricCard("Recent events", formatNumber(queryActivity.recentEventCount), `${queryProtectionRetention} / ${queryProtectionScope}`)}
      ${metricCard("Last hour", formatNumber(queryActivity.lastHourCount), "query events")}
      ${metricCard("Last day", formatNumber(queryActivity.lastDayCount), "query events")}
      ${metricCard("Limited requests", formatNumber(queryActivity.limitedRequestCount), formatDate(queryActivity.recentLimitedAt))}
    </div>
    <h3>Outcome Counts</h3>
    ${countsList(queryActivity.outcomeCounts)}
  </section>

  <section id="sync-index-health">
    <h2>Sync And Index Health</h2>
    <p class="callout">Sync health is built from overview and latest-run fields. Recent run counts are an overview window, not a complete historical ledger.</p>
    <div class="grid">
      ${metricCard("Index status", environment.status ?? "unknown", environment.hasIndex ? "index present" : "index missing")}
      ${metricCard("Query route", `/api/search/environment/${environmentSlug}`, "server-only credential required")}
      ${metricCard("Recent runs", formatNumber(sync.recentRunCount), "overview recent window")}
      ${metricCard("Latest run", latestRunStatus, latestRunFinishedAt ? `finished ${formatDate(latestRunFinishedAt)}` : "no finish time")}
      ${metricCard("Last successful sync", formatDate(syncFreshness.lastSuccessfulSyncAt), "freshness")}
      ${metricCard("Last failed sync", formatDate(syncFreshness.lastFailedSyncAt), "freshness")}
      ${metricCard("Extracted", formatNumber(sync.totals?.extractedDocumentCount), "documents")}
      ${metricCard("Written", formatNumber(sync.totals?.writtenDocumentCount), "documents")}
      ${metricCard("Deleted", formatNumber(sync.totals?.deletedDocumentCount), "documents")}
    </div>
    <h3>Status Counts</h3>
    ${countsList(sync.countsByStatus)}
    <p>Latest run: ${escapeHtml(sync.latestRun?.status ?? "none")} ${sync.latestRun?.startedAt ? `started ${escapeHtml(formatDate(sync.latestRun.startedAt))}` : ""}</p>
    <p>Latest failure: ${escapeHtml(latestFailure(sync.latestFailure))}</p>
  </section>

  <section id="jobs">
    <h2>Jobs</h2>
    <div class="grid">
      ${metricCard("Recent jobs", formatNumber(jobs.recentJobCount), "overview recent window")}
      ${metricCard("Latest failure", latestFailure(jobs.latestFailure), "")}
    </div>
    <h3>State Counts</h3>
    ${countsList(jobs.countsByState)}
  </section>

  <section id="source-coverage">
    <h2>Source Coverage</h2>
    <p class="callout">Per-source document counts are snapshot-derived when present. Missing or unsupported counts render as <code>n/a</code> instead of being inferred.</p>
    <div class="grid">
      ${metricCard("Sources", formatNumber(sourceCoverage.sourceCount), "total")}
      ${metricCard("Active", formatNumber(sourceCoverage.activeSourceCount), "queryable")}
      ${metricCard("Inactive", formatNumber(sourceCoverage.inactiveSourceCount), "not active")}
      ${metricCard("Blocked", formatNumber(sourceCoverage.blockedSourceCount), "needs repair")}
    </div>
    <h3>Status Counts</h3>
    ${countsList(sourceCoverage.countsByStatus)}
    <h3>Source Table</h3>
    <table>
      <thead><tr><th>Key</th><th>Label</th><th>Type</th><th>Document count</th><th>Activation</th><th>Status</th></tr></thead>
      <tbody>${sourceRows(sourceCoverage.sources)}</tbody>
    </table>
  </section>

  <section id="architecture-map">
    <h2>Architecture Map</h2>
    <p class="callout">This static explainer shows ownership boundaries only. It does not reveal credentials, raw project linkage files, raw query events, or raw query text.</p>
    <div class="flow-grid">${architectureCards()}</div>
  </section>

  <section id="limitations">
    <h2>Limitations</h2>
    <ul>${limitationsList(analytics)}</ul>
  </section>
</main>
</body>
</html>`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = args.get("input");
  const outputPath = args.get("output");

  if (!inputPath || !outputPath) {
    console.error(usage());
    process.exit(1);
  }

  const input = JSON.parse(await readFile(inputPath, "utf8"));
  const html = renderReport(input);
  assertGeneratedHtmlSafe(html);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf8");
  console.log(`SiteOS search sidecar report written: ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
