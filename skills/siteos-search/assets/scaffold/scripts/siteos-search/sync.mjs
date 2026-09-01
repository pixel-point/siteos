#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();
const projectConfigPath = path.join(projectRoot, ".siteos", "search", "project.json");
const searchConfigPath = path.join(projectRoot, "siteos-search.config.ts");
const sourceIdPattern = /^[a-z0-9][a-z0-9-]{0,62}$/;
const environmentSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const indexingCredentialEnvName = "SITEOS_SEARCH_INDEXING_CREDENTIAL";
const indexingCredentialHeader = "x-siteos-project-search-indexing-credential";
const indexingCredentialPattern = /^psi_[A-Za-z0-9_-]{22}$/;

class SiteOSSearchSyncError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "SiteOSSearchSyncError";
    this.code = code;
  }
}

const args = new Set(process.argv.slice(2));

function readSyncOptions() {
  for (const argument of args) {
    if (argument === "--" || argument === "--dry-run") {
      continue;
    }

    throw new SiteOSSearchSyncError(
      "unsupported-argument",
      `Unsupported argument "${argument}". Use "pnpm search:sync" to update the SiteOS index or "pnpm search:sync --dry-run" to preview the payload without updating SiteOS.`,
    );
  }

  return {
    isDryRun: args.has("--dry-run"),
  };
}

async function readJsonFile(filePath, label) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`${label} is not valid JSON.`);
    }

    throw new Error(`${label} is missing or cannot be read.`);
  }
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadSearchConfig(filePath) {
  if (!(await fileExists(filePath))) {
    throw new Error("siteos-search.config.ts is missing.");
  }

  const source = await readFile(filePath, "utf8");
  let moduleSource = source;

  if (filePath.endsWith(".ts")) {
    let typescriptModule;
    try {
      typescriptModule = await import("typescript");
    } catch {
      throw new Error(
        "siteos-search.config.ts requires the scaffolded TypeScript 5.x devDependency so search:sync can load the config.",
      );
    }

    const typescript = typescriptModule.default ?? typescriptModule;
    if (
      typeof typescript.transpileModule !== "function" ||
      !typescript.ModuleKind ||
      !typescript.ScriptTarget
    ) {
      throw new Error(
        "siteos-search.config.ts requires a TypeScript 5.x compiler API. Restore the scaffolded typescript@^5.7.3 devDependency before running search:sync.",
      );
    }

    moduleSource = typescript.transpileModule(source, {
      compilerOptions: {
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022,
      },
    }).outputText;
  }

  const encoded = Buffer.from(moduleSource, "utf8").toString("base64");
  const configModule = await import(`data:text/javascript;base64,${encoded}`);
  const config = configModule.default ?? configModule.siteosSearchConfig;

  if (!config || typeof config !== "object") {
    throw new Error("siteos-search.config.ts must export a config object.");
  }

  return config;
}

function readNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value.trim();
}

function readSourceId(value, label) {
  const sourceId = readNonEmptyString(value, label);

  if (!sourceIdPattern.test(sourceId)) {
    throw new Error(`${label} must use lowercase letters, numbers, and hyphens.`);
  }

  return sourceId;
}

function readEnvironmentSlug(value) {
  const environmentSlug = readNonEmptyString(value, "environment.slug");

  if (
    environmentSlug.length < 2 ||
    environmentSlug.length > 30 ||
    !environmentSlugPattern.test(environmentSlug)
  ) {
    throw new Error(
      "environment.slug must be 2-30 lowercase alphanumeric segments separated by single hyphens.",
    );
  }

  return environmentSlug;
}

function readOptionalString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readEnvVariable(content, name) {
  const pattern = new RegExp(`^${name}=(.*)$`, "gm");
  const matches = [...content.matchAll(pattern)];
  if (matches.length === 0) {
    return null;
  }
  if (matches.length > 1) {
    throw new SiteOSSearchSyncError(
      "indexing-credential-invalid",
      "The SiteOS Search indexing credential must appear only once in the project .env.",
    );
  }

  const value = matches[0]?.[1]?.trim() ?? "";
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

async function readIndexingCredential(projectRoot) {
  const fromEnv = readOptionalString(process.env[indexingCredentialEnvName]);
  if (fromEnv) {
    if (!indexingCredentialPattern.test(fromEnv)) {
      throw new SiteOSSearchSyncError(
        "indexing-credential-invalid",
        "The SiteOS Search indexing credential has an invalid format.",
      );
    }
    return fromEnv;
  }
  const dotenvPath = path.join(projectRoot, ".env");
  if (!(await fileExists(dotenvPath))) {
    throw new SiteOSSearchSyncError(
      "indexing-credential-missing",
      "The SiteOS Search indexing credential is missing. Install it through the SiteOS CLI.",
    );
  }

  let dotenv;
  try {
    dotenv = await readFile(dotenvPath, "utf8");
  } catch {
    throw new SiteOSSearchSyncError(
      "indexing-credential-missing",
      "The SiteOS Search indexing credential cannot be read. Install it through the SiteOS CLI.",
    );
  }
  const fromDotenv = readOptionalString(readEnvVariable(dotenv, indexingCredentialEnvName));
  if (!fromDotenv) {
    throw new SiteOSSearchSyncError(
      "indexing-credential-missing",
      "The SiteOS Search indexing credential is missing. Install it through the SiteOS CLI.",
    );
  }
  if (!indexingCredentialPattern.test(fromDotenv)) {
    throw new SiteOSSearchSyncError(
      "indexing-credential-invalid",
      "The SiteOS Search indexing credential has an invalid format.",
    );
  }

  return fromDotenv;
}

async function resolveApiBaseUrl(config) {
  const envName = readOptionalString(config.project?.apiBaseUrlEnv) ?? "SITEOS_SEARCH_PUBLIC_URL";
  const fromEnv = readOptionalString(process.env[envName]);
  let fromDotenv;
  const dotenvPath = path.join(projectRoot, ".env");
  if (await fileExists(dotenvPath)) {
    const dotenv = await readFile(dotenvPath, "utf8");
    fromDotenv = readOptionalString(readEnvVariable(dotenv, envName));
  }
  const configured = fromEnv ?? fromDotenv;
  if (!configured) {
    throw new SiteOSSearchSyncError(
      "api-base-url-missing",
      `${envName} is required for SiteOS Search sync.`,
    );
  }
  return configured.replace(/\/+$/, "");
}

function sourceIdToDocumentPrefix(sourceId, documentId) {
  const normalizedDocumentId = readNonEmptyString(documentId, "document.id").replace(
    /[^a-zA-Z0-9_-]+/g,
    "-",
  );
  const expectedPrefix = `${sourceId}_`;
  return normalizedDocumentId.startsWith(expectedPrefix)
    ? normalizedDocumentId
    : `${expectedPrefix}${normalizedDocumentId}`;
}

function ensureRelativeHandlerPath(handlerPath) {
  const handler = readNonEmptyString(handlerPath, "source.handler");
  const normalized = handler.replace(/\\/g, "/");

  if (
    !normalized.startsWith("scripts/siteos-search/sources/") ||
    path.isAbsolute(normalized) ||
    normalized.includes("..")
  ) {
    throw new Error(`source.handler must stay under scripts/siteos-search/sources/: ${normalized}`);
  }

  return normalized;
}

async function loadSourceHandler(source) {
  const handlerPath = ensureRelativeHandlerPath(source.handler);
  const absoluteHandlerPath = path.join(projectRoot, handlerPath);

  if (!(await fileExists(absoluteHandlerPath))) {
    throw new Error(`Source handler is missing: ${handlerPath}`);
  }

  const handlerModule = await import(`${pathToFileURL(absoluteHandlerPath).href}?t=${Date.now()}`);
  const handler = handlerModule.default ?? handlerModule.sourceHandler;

  if (!handler || typeof handler !== "object" || typeof handler.collectDocuments !== "function") {
    throw new Error(`Source handler must export sourceHandler.collectDocuments(): ${handlerPath}`);
  }

  return { handler, handlerPath };
}

function normalizeDocument(source, document) {
  if (!document || typeof document !== "object") {
    throw new Error(`Source "${source.id}" returned a non-object document.`);
  }

  const sourceId = readSourceId(source.id, "source.id");
  const title = readNonEmptyString(document.title, "document.title");
  const url = readNonEmptyString(document.url, "document.url");

  if (!url.startsWith("/")) {
    throw new Error(
      `Source "${sourceId}" returned document "${document.id ?? "<missing>"}" with a non-path url.`,
    );
  }

  return {
    id: sourceIdToDocumentPrefix(sourceId, document.id),
    metadata: document.metadata,
    presentation: document.presentation,
    searchableText:
      typeof document.searchableText === "string" ? document.searchableText.trim() : "",
    sourceName: sourceId,
    sourcePayload: document.sourcePayload,
    title,
    url,
  };
}

async function collectSourceDocuments(source) {
  const sourceId = readSourceId(source.id, "source.id");
  const label = readNonEmptyString(source.label, "source.label");
  const { handler, handlerPath } = await loadSourceHandler(source);
  const collected = await handler.collectDocuments({
    projectRoot,
    source,
  });
  const documents = Array.isArray(collected) ? collected : collected?.documents;

  if (!Array.isArray(documents)) {
    throw new Error(
      `Source handler "${handlerPath}" must return an array of documents or { documents }.`,
    );
  }

  const normalizedDocuments = documents.map((document) => normalizeDocument(source, document));
  const seenIds = new Set();

  for (const document of normalizedDocuments) {
    if (seenIds.has(document.id)) {
      throw new Error(`Source "${sourceId}" returned duplicate document id "${document.id}".`);
    }
    seenIds.add(document.id);
  }

  return {
    sourceType: sourceId,
    sourceKey: sourceId,
    label,
    configJson: {
      handler: handlerPath,
      result: source.result ?? null,
      compatibility: source.compatibility ?? null,
    },
    documents: normalizedDocuments,
  };
}

async function buildSyncPayload(config) {
  if (config.sync?.mode !== "full-replace") {
    throw new Error('siteos-search.config.ts must use sync.mode: "full-replace".');
  }

  const environmentSlug = readEnvironmentSlug(config.environment?.slug);

  const enabledSources = Array.isArray(config.sources)
    ? config.sources.filter((source) => source?.enabled === true)
    : [];

  if (enabledSources.length === 0) {
    throw new Error(
      "No enabled siteos-search sources were found. Enable only confirmed and implemented sources before syncing.",
    );
  }

  const sources = [];
  for (const source of enabledSources) {
    sources.push(await collectSourceDocuments(source));
  }

  return {
    mode: "full-replace",
    target: {
      environmentSlug,
    },
    sources,
  };
}

function summarizePayload(payload) {
  return {
    mode: payload.mode,
    environmentSlug: payload.target?.environmentSlug,
    sourceCount: payload.sources.length,
    documentCount: payload.sources.reduce((count, source) => count + source.documents.length, 0),
    sources: payload.sources.map((source) => ({
      id: source.sourceType,
      label: source.label,
      documentCount: source.documents.length,
    })),
  };
}

async function readJsonResponse(response) {
  const responseText = await response.text();

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new SiteOSSearchSyncError(
      "invalid-response",
      "SiteOS Search returned an invalid sync response.",
    );
  }
}

async function requestSiteOSJson(params) {
  let response;

  try {
    response = await fetch(`${params.apiBaseUrl}${params.path}`, {
      method: "POST",
      headers: {
        [indexingCredentialHeader]: params.credential,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params.body),
    });
  } catch {
    throw new SiteOSSearchSyncError("api-unreachable", "SiteOS Search sync is unreachable.");
  }

  const body = await readJsonResponse(response);

  if (!response.ok) {
    if (response.status === 404) {
      throw new SiteOSSearchSyncError(
        "selected-environment-unavailable",
        "The selected SiteOS environment is unavailable or inaccessible to this indexing credential (HTTP 404).",
      );
    }

    const code =
      response.status === 401 || response.status === 403
        ? "indexing-credential-rejected"
        : (params.failureCode ?? "api-request-failed");

    throw new SiteOSSearchSyncError(
      code,
      `SiteOS Search sync request failed with HTTP ${response.status}.`,
    );
  }

  if (!body || typeof body !== "object" || body.success !== true) {
    throw new SiteOSSearchSyncError(
      "invalid-response",
      "SiteOS Search returned an invalid sync response.",
    );
  }

  return body;
}

async function submitPayload(params) {
  const body = await requestSiteOSJson({
    apiBaseUrl: params.apiBaseUrl,
    credential: params.credential,
    body: params.payload,
    failureCode: "sync-submit-failed",
    method: "POST",
    path: `/api/v1/project/search/environments/${encodeURIComponent(params.environmentSlug)}/actions/sync`,
  });

  return body;
}

async function main() {
  const options = readSyncOptions();
  await readJsonFile(projectConfigPath, ".siteos/search/project.json");
  const config = await loadSearchConfig(searchConfigPath);
  const apiBaseUrl = await resolveApiBaseUrl(config);
  const payload = await buildSyncPayload(config);
  const summary = summarizePayload(payload);

  console.log("SiteOS search sync payload is ready.");
  console.log(`SiteOS API base URL: ${apiBaseUrl}`);
  console.log(`Mode: ${summary.mode}`);
  console.log(`Environment: ${summary.environmentSlug}`);
  console.log(`Sources: ${summary.sourceCount}`);
  console.log(`Documents: ${summary.documentCount}`);
  for (const source of summary.sources) {
    console.log(`- ${source.id}: ${source.documentCount} documents`);
  }

  if (options.isDryRun) {
    console.log("Dry run only. No request was sent to SiteOS.");
    console.log('Run "pnpm search:sync" without --dry-run to update the SiteOS search index.');
    return;
  }

  const indexingCredential = await readIndexingCredential(projectRoot);

  const result = await submitPayload({
    apiBaseUrl,
    credential: indexingCredential,
    payload,
    environmentSlug: summary.environmentSlug,
  });

  console.log("SiteOS search sync request submitted.");
  console.log(
    JSON.stringify(
      {
        success: result?.success === true,
        skipped: result?.skipped === true,
        jobId: result?.jobId ?? null,
        syncRunId: result?.syncRunId ?? null,
        sourceTypes: Array.isArray(result?.sourceTypes) ? result.sourceTypes : [],
        acceptedDocumentCount:
          typeof result?.acceptedDocumentCount === "number" ? result.acceptedDocumentCount : null,
      },
      null,
      2,
    ),
  );

  console.log("Final status: sync-submitted");
}

try {
  await main();
} catch (error) {
  if (error instanceof SiteOSSearchSyncError) {
    console.error(`Classification: ${error.code}`);
  }
  console.error(error instanceof Error ? error.message : "SiteOS search sync failed.");
  process.exitCode = 1;
}
