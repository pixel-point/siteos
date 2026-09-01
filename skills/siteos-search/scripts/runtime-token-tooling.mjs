#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const environmentSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const runtimeTokenHeader = "x-siteos-project-search-credential";
const runtimeTokenRegex = /^psq_[A-Za-z0-9_-]{22}$/;
const runtimeTokenEnvName = "SITEOS_SEARCH_TOKEN";
const runtimeEnvironmentEnvName = "SITEOS_SEARCH_ENV";
const runtimeTokenStatuses = new Set([
  "environment-mismatch",
  "invalid-format",
  "missing",
  "revoked",
  "search-inactive",
  "search-not-ready",
  "unauthorized",
  "valid",
]);

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const args = new Map();

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (!arg.startsWith("--")) {
      continue;
    }

    const [key, inlineValue] = arg.slice(2).split("=", 2);
    const value = inlineValue ?? rest[index + 1];
    if (inlineValue === undefined) {
      index += 1;
    }

    args.set(key, value);
  }

  return {
    command: command ?? "",
    args,
  };
}

function usage() {
  return [
    "Usage:",
    "  node scripts/runtime-token-tooling.mjs help [command]",
    "  node scripts/runtime-token-tooling.mjs validate --environment <slug> [--project-root <path>]",
    "  node scripts/runtime-token-tooling.mjs query --q <query> --environment <slug> [--project-root <path>] [--limit <n>] [--offset <n>]",
  ].join("\n");
}

function commandUsage(command) {
  if (command === "validate") {
    return "Usage:\n  node scripts/runtime-token-tooling.mjs validate --environment <slug> [--project-root <path>]";
  }

  if (command === "init" || command === "rotate") {
    const cliCommand = command === "init" ? "issue" : "rotate";
    return `Query credential ${command} is CLI-owned. Use:\n  npx @siteoshq/cli search credential ${cliCommand} --environment <slug> --install --json`;
  }

  if (command === "query") {
    return [
      "Usage:",
      "  node scripts/runtime-token-tooling.mjs query --q <query> --environment <slug> [--project-root <path>] [--limit <n>] [--offset <n>]",
      "",
      "Reads SITEOS_SEARCH_TOKEN and SITEOS_SEARCH_ENV from the project .env and sends a runtime query smoke request without printing the token.",
    ].join("\n");
  }

  return usage();
}

function readOptionalString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function ensureObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value;
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile(filePath, label) {
  let raw;
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    throw new Error(`${label} cannot be read.`);
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}

function readEnvVariable(content, name) {
  const pattern = new RegExp(`^${name}=(.*)$`, "gm");
  const matches = [...content.matchAll(pattern)];
  if (matches.length === 0) {
    return null;
  }
  if (matches.length > 1) {
    throw new Error(`${name} must appear only once in the project .env.`);
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

function isRuntimeTokenFormat(token) {
  return runtimeTokenRegex.test(token.trim());
}

function resolveApiBaseUrl(dotenv) {
  const fromEnv = readOptionalString(process.env.SITEOS_SEARCH_PUBLIC_URL);
  const fromDotenv = readOptionalString(readEnvVariable(dotenv, "SITEOS_SEARCH_PUBLIC_URL"));
  const configured = fromEnv ?? fromDotenv;
  if (!configured) {
    throw new Error("SITEOS_SEARCH_PUBLIC_URL is required.");
  }
  return configured.replace(/\/+$/, "");
}

async function requestJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error("SiteOS Search runtime request failed.");
  }

  const text = await response.text();
  let body;
  try {
    body = text.length > 0 ? JSON.parse(text) : {};
  } catch {
    throw new Error("SiteOS Search runtime returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(`SiteOS Search runtime request was rejected (HTTP ${response.status}).`);
  }

  return body;
}

function readIntegerOption(value, fallback, label) {
  const raw = readOptionalString(value);
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }

  return parsed;
}

async function loadToolContext(params = {}) {
  const projectRoot = path.resolve(readOptionalString(params.projectRoot) ?? process.cwd());
  const linkagePath = path.join(projectRoot, ".siteos", "search", "project.json");
  if (!(await fileExists(linkagePath))) {
    throw new Error(".siteos/search/project.json is missing.");
  }

  ensureObject(
    await readJsonFile(linkagePath, ".siteos/search/project.json"),
    ".siteos/search/project.json",
  );

  const environmentSlug = readOptionalString(params.environmentSlug);
  if (
    !environmentSlug ||
    environmentSlug.length < 2 ||
    environmentSlug.length > 30 ||
    !environmentSlugPattern.test(environmentSlug)
  ) {
    throw new Error("Missing or invalid required --environment slug.");
  }
  const dotenvPath = path.join(projectRoot, ".env");
  let dotenv = "";
  if (await fileExists(dotenvPath)) {
    try {
      dotenv = await readFile(dotenvPath, "utf8");
    } catch {
      throw new Error("The project .env cannot be read.");
    }
  }
  const token = readOptionalString(readEnvVariable(dotenv, runtimeTokenEnvName));
  const installedEnvironmentSlug = readOptionalString(
    readEnvVariable(dotenv, runtimeEnvironmentEnvName),
  );
  if (
    installedEnvironmentSlug &&
    (!environmentSlugPattern.test(installedEnvironmentSlug) ||
      installedEnvironmentSlug !== environmentSlug)
  ) {
    throw new Error("The installed Search environment does not match --environment.");
  }

  return {
    apiBaseUrl: resolveApiBaseUrl(dotenv),
    environmentSlug,
    installedEnvironmentSlug,
    token,
  };
}

export async function validateRuntimeToken(params = {}) {
  const context = await loadToolContext(params);

  if (!context.token || !context.installedEnvironmentSlug) {
    return {
      environmentSlug: context.environmentSlug,
      status: "missing",
    };
  }

  if (!isRuntimeTokenFormat(context.token)) {
    return {
      environmentSlug: context.environmentSlug,
      status: "invalid-format",
    };
  }

  const response = await requestJson(
    `${context.apiBaseUrl}/api/search/environment/${encodeURIComponent(context.environmentSlug)}/token-status`,
    {
      headers: {
        [runtimeTokenHeader]: context.token,
      },
      method: "GET",
    },
  );
  if (
    !response ||
    response.success !== true ||
    response.environmentSlug !== context.environmentSlug ||
    typeof response.canQuery !== "boolean" ||
    !runtimeTokenStatuses.has(response.status) ||
    (response.projectEnvironmentId !== null && typeof response.projectEnvironmentId !== "string")
  ) {
    throw new Error("SiteOS Search runtime returned an invalid response.");
  }

  return {
    canQuery: response.canQuery,
    projectEnvironmentId: response.projectEnvironmentId,
    environmentSlug: response.environmentSlug,
    status: response.status,
  };
}

export async function queryRuntime(params = {}) {
  const context = await loadToolContext(params);
  const query = readOptionalString(params.query);

  if (!query) {
    throw new Error("Missing required --q query.");
  }

  if (!context.token || !context.installedEnvironmentSlug) {
    throw new Error(
      `${runtimeTokenEnvName} and ${runtimeEnvironmentEnvName} must be installed through the SiteOS CLI.`,
    );
  }

  if (!isRuntimeTokenFormat(context.token)) {
    throw new Error(`${runtimeTokenEnvName} has an invalid format.`);
  }

  const searchParams = new URLSearchParams();
  searchParams.set("q", query);
  searchParams.set("limit", String(readIntegerOption(params.limit, 5, "limit")));
  searchParams.set("offset", String(readIntegerOption(params.offset, 0, "offset")));

  const response = await requestJson(
    `${context.apiBaseUrl}/api/search/environment/${encodeURIComponent(context.environmentSlug)}?${searchParams.toString()}`,
    {
      headers: {
        [runtimeTokenHeader]: context.token,
      },
      method: "GET",
    },
  );
  if (!response || typeof response !== "object" || typeof response.success !== "boolean") {
    throw new Error("SiteOS Search runtime returned an invalid response.");
  }

  return {
    query,
    response,
    environmentSlug: context.environmentSlug,
    status: response?.success === false ? "query-failed" : "query-ok",
  };
}

async function main() {
  const { args, command } = parseArgs(process.argv.slice(2));
  const helpTarget = command === "help" ? process.argv.slice(2)[1] : command;
  if (command === "help" || command === "--help" || command === "-h" || args.has("help")) {
    console.log(commandUsage(helpTarget));
    return;
  }

  const params = {
    projectRoot: args.get("project-root"),
    environmentSlug: args.get("environment"),
  };

  let result;
  if (command === "validate") {
    result = await validateRuntimeToken(params);
  } else if (command === "init" || command === "rotate") {
    throw new Error(commandUsage(command));
  } else if (command === "query") {
    result = await queryRuntime({
      ...params,
      limit: args.get("limit"),
      offset: args.get("offset"),
      query: args.get("q"),
    });
  } else {
    console.error(usage());
    process.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "SiteOS Search runtime failed.");
  process.exit(1);
});
