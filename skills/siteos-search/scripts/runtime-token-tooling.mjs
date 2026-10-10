#!/usr/bin/env node

import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const environmentSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const runtimeTokenHeader = "x-siteos-project-search-credential";
const runtimeTokenRegex = /^psq_[A-Za-z0-9_-]{22}$/;

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
    "  node scripts/runtime-token-tooling.mjs validate --environment <slug> [--index <id>] [--env-prefix <prefix>] [--project-root <path>]",
    "  node scripts/runtime-token-tooling.mjs query --q <query> --environment <slug> [--index <id>] [--env-prefix <prefix>] [--project-root <path>] [--limit <n>] [--offset <n>]",
  ].join("\n");
}

function commandUsage(command) {
  if (command === "validate") {
    return "Usage:\n  node scripts/runtime-token-tooling.mjs validate --environment <slug> [--index <id>] [--env-prefix <prefix>] [--project-root <path>]\n\nChecks local credential format and environment only, without a request. Use query --q <query> to verify server access.";
  }

  if (command === "init" || command === "rotate") {
    const cliCommand = command === "init" ? "issue" : "rotate";
    return `Query credential ${command} is CLI-owned. Use:\n  npx @siteoshq/cli search credential ${cliCommand} --environment <slug> --install --json`;
  }

  if (command === "query") {
    return [
      "Usage:",
      "  node scripts/runtime-token-tooling.mjs query --q <query> --environment <slug> [--index <id>] [--env-prefix <prefix>] [--project-root <path>] [--limit <n>] [--offset <n>]",
      "",
      "Reads the installed Search variable names from the project .env and sends a runtime query smoke request without printing the token. Use --env-prefix when several installations share an index.",
    ].join("\n");
  }

  return usage();
}

function readOptionalString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
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

function resolveApiBaseUrl(dotenv, name = "SITEOS_SEARCH_PUBLIC_URL") {
  const fromEnv = readOptionalString(process.env[name]);
  const fromDotenv = readOptionalString(readEnvVariable(dotenv, name));
  const configured = fromEnv ?? fromDotenv;
  if (!configured) {
    throw new Error(`${name} is required.`);
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
  const environmentSlug = readOptionalString(params.environmentSlug);
  if (
    !environmentSlug ||
    environmentSlug.length < 2 ||
    environmentSlug.length > 30 ||
    !environmentSlugPattern.test(environmentSlug)
  ) {
    throw new Error("Missing or invalid required --environment slug.");
  }
  const indexId = readOptionalString(params.indexId);
  if (indexId && !/^[A-Za-z0-9_-]{1,255}$/.test(indexId)) throw new Error("Invalid --index ID.");
  const requestedPrefix = readOptionalString(params.envPrefix);
  if (params.envPrefix !== undefined && (!requestedPrefix || !indexId ||
    requestedPrefix.length > 80 || !/^SITEOS_SEARCH(?:_[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*)?$/.test(requestedPrefix)))
    throw new Error("--env-prefix requires --index and SITEOS_SEARCH or an uppercase prefix such as SITEOS_SEARCH_BLOG.");
  const dotenvPath = path.join(projectRoot, ".env");
  let dotenv = "";
  if (await fileExists(dotenvPath)) {
    try {
      dotenv = await readFile(dotenvPath, "utf8");
    } catch {
      throw new Error("The project .env cannot be read.");
    }
  }
  const bindings = [...dotenv.matchAll(/^# siteos-search binding ([A-Z0-9_]+) ([A-Za-z0-9_-]+)\r?$/gm)];
  const installedPrefixes = [...new Set(bindings.filter((binding) => binding[2] === indexId).map((binding) => binding[1]))];
  if (!requestedPrefix && installedPrefixes.length > 1) throw new Error("Several Search variable prefixes are installed for this index. Pass --env-prefix explicitly.");
  const prefix = requestedPrefix ?? installedPrefixes[0] ??
    (indexId ? `SITEOS_SEARCH_INDEX_${createHash("sha256").update(indexId).digest("hex").slice(0,24).toUpperCase()}` : "SITEOS_SEARCH");
  if (!/^SITEOS_SEARCH(?:_[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*)?$/.test(prefix))
    throw new Error("The installed Search variable prefix is invalid.");
  const owners = bindings.filter((binding) => binding[1] === prefix);
  if (owners.length > 1 || (owners.length === 1 && owners[0][2] !== indexId))
    throw new Error("The installed Search variable prefix belongs to another index. Keep --index and --env-prefix aligned.");
  const token = readOptionalString(readEnvVariable(dotenv, `${prefix}_TOKEN`));
  const installedEnvironmentSlug = readOptionalString(
    readEnvVariable(dotenv, `${prefix}_ENV`),
  );
  if (
    installedEnvironmentSlug &&
    (!environmentSlugPattern.test(installedEnvironmentSlug) ||
      installedEnvironmentSlug !== environmentSlug)
  ) {
    throw new Error("The installed Search environment does not match --environment.");
  }

  return {
    apiBaseUrl: resolveApiBaseUrl(dotenv, `${prefix}_PUBLIC_URL`),
    environmentSlug,
    installedEnvironmentSlug,
    token,
    tokenVariable: `${prefix}_TOKEN`,
    environmentVariable: `${prefix}_ENV`,
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

  return {
    environmentSlug: context.environmentSlug,
    status: "locally-valid",
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
      `${context.tokenVariable} and ${context.environmentVariable} must be installed through the SiteOS CLI.`,
    );
  }

  if (!isRuntimeTokenFormat(context.token)) {
    throw new Error(`${context.tokenVariable} has an invalid format.`);
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
    indexId: args.get("index"),
    envPrefix: args.get("env-prefix"),
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
