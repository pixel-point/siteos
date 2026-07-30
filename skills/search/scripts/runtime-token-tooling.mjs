#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const productionApiBaseUrl = "https://siteos.xui.se";
const environmentSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const runtimeTokenHeader = "x-siteos-project-search-credential";
const runtimeTokenRegex = /^psq_[A-Za-z0-9_-]{22}$/;
const runtimeTokenEnvName = "SITEOS_SEARCH_TOKEN";
const runtimeEnvironmentEnvName = "SITEOS_SEARCH_ENV";
const envCandidates = [".env.local", ".env", ".env.development.local"];

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
    "  node scripts/runtime-token-tooling.mjs validate --environment <slug> [--project-root <path>] [--env-file <path>]",
    "  node scripts/runtime-token-tooling.mjs init --environment <slug> [--project-root <path>] [--env-file <path>] [--token-name <name>]",
    "  node scripts/runtime-token-tooling.mjs rotate --environment <slug> [--project-root <path>] [--env-file <path>] [--token-name <name>]",
    "  node scripts/runtime-token-tooling.mjs query --q <query> --environment <slug> [--project-root <path>] [--limit <n>] [--offset <n>]",
  ].join("\n");
}

function commandUsage(command) {
  if (command === "validate") {
    return "Usage:\n  node scripts/runtime-token-tooling.mjs validate [--project-root <path>] [--runtime-slug <slug>] [--env-file <path>]";
  }

  if (command === "init") {
    return "Usage:\n  node scripts/runtime-token-tooling.mjs init [--project-root <path>] [--runtime-slug <slug>] [--env-file <path>] [--token-name <name>]";
  }

  if (command === "rotate") {
    return "Usage:\n  node scripts/runtime-token-tooling.mjs rotate [--project-root <path>] [--runtime-slug <slug>] [--env-file <path>] [--token-name <name>]";
  }

  if (command === "query") {
    return [
      "Usage:",
      "  node scripts/runtime-token-tooling.mjs query --q <query> [--project-root <path>] [--runtime-slug <slug>] [--limit <n>] [--offset <n>]",
      "",
      "Reads SITEOS_SEARCH_TOKEN from the selected env file and sends a runtime query smoke request without printing the token.",
    ].join("\n");
  }

  return usage();
}

function readOptionalString(value) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
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
  const raw = await readFile(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}

function readEnvVariable(content, name) {
  const pattern = new RegExp(`^${name}=(.*)$`, "m");
  const match = content.match(pattern);
  if (!match) {
    return null;
  }

  const value = match[1]?.trim() ?? "";
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

async function readProjectApiKey(projectRoot) {
  const fromEnv = readOptionalString(process.env.SITEOS_PROJECT_API_KEY);
  if (fromEnv) {
    return fromEnv;
  }

  const dotenvPath = path.join(projectRoot, ".env");
  if (!(await fileExists(dotenvPath))) {
    throw new Error(
      "SITEOS_PROJECT_API_KEY is missing. Set it in the environment or the project .env file.",
    );
  }

  const fromDotenv = readOptionalString(
    readEnvVariable(
      await readFile(dotenvPath, "utf8"),
      "SITEOS_PROJECT_API_KEY",
    ),
  );
  if (!fromDotenv) {
    throw new Error(
      "SITEOS_PROJECT_API_KEY is missing. Set it in the environment or the project .env file.",
    );
  }

  return fromDotenv;
}

async function resolveEnvFilePath(projectRoot, explicitEnvFile) {
  const explicit = readOptionalString(explicitEnvFile);
  if (explicit) {
    return path.isAbsolute(explicit)
      ? explicit
      : path.join(projectRoot, explicit);
  }

  for (const candidate of envCandidates) {
    const filePath = path.join(projectRoot, candidate);
    if (await fileExists(filePath)) {
      return filePath;
    }
  }

  return path.join(projectRoot, ".env.local");
}

async function readSiteOSSearchTokenFromEnv(envFilePath) {
  if (!(await fileExists(envFilePath))) {
    return null;
  }

  const content = await readFile(envFilePath, "utf8");
  return readEnvVariable(content, runtimeTokenEnvName);
}

async function writeEnvVariable(envFilePath, name, value) {
  const existing = (await fileExists(envFilePath))
    ? await readFile(envFilePath, "utf8")
    : "";
  const normalizedLine = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");
  const nextContent = pattern.test(existing)
    ? existing.replace(pattern, normalizedLine)
    : `${existing}${existing.endsWith("\n") || existing.length === 0 ? "" : "\n"}${normalizedLine}\n`;

  await mkdir(path.dirname(envFilePath), { recursive: true });
  await writeFile(envFilePath, nextContent);
}

function isRuntimeTokenFormat(token) {
  return runtimeTokenRegex.test(token.trim());
}

function resolveApiBaseUrl(linkage) {
  const fromEnv = readOptionalString(process.env.SITEOS_API_BASE_URL);
  const fromConfig = readOptionalString(linkage.apiBaseUrl);
  return (fromEnv ?? fromConfig ?? productionApiBaseUrl).replace(/\/+$/, "");
}

async function requestJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `SiteOS API is unreachable: ${error.message}`
        : "SiteOS API is unreachable.",
    );
  }

  const text = await response.text();
  const body = text.length > 0 ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(
      body?.message ??
        body?.error ??
        `Request failed with HTTP ${response.status}.`,
    );
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
  const projectRoot = path.resolve(
    readOptionalString(params.projectRoot) ?? process.cwd(),
  );
  const linkagePath = path.join(projectRoot, ".siteos", "project.json");
  if (!(await fileExists(linkagePath))) {
    throw new Error(".siteos/project.json is missing.");
  }

  const linkage = ensureObject(
    await readJsonFile(linkagePath, ".siteos/project.json"),
    ".siteos/project.json",
  );
  const apiKey = await readProjectApiKey(projectRoot);

  const environmentSlug = readOptionalString(params.environmentSlug);
  if (
    !environmentSlug ||
    environmentSlug.length < 2 ||
    environmentSlug.length > 30 ||
    !environmentSlugPattern.test(environmentSlug)
  ) {
    throw new Error("Missing or invalid required --environment slug.");
  }
  const envFilePath = await resolveEnvFilePath(projectRoot, params.envFile);

  return {
    apiBaseUrl: resolveApiBaseUrl(linkage),
    apiKey,
    envFilePath,
    projectRoot,
    environmentSlug,
  };
}

export async function validateRuntimeToken(params = {}) {
  const context = await loadToolContext(params);
  const token = await readSiteOSSearchTokenFromEnv(context.envFilePath);

  if (!token) {
    return {
      envFilePath: context.envFilePath,
      environmentSlug: context.environmentSlug,
      status: "missing",
    };
  }

  if (!isRuntimeTokenFormat(token)) {
    return {
      envFilePath: context.envFilePath,
      environmentSlug: context.environmentSlug,
      status: "invalid-format",
    };
  }

  const response = await requestJson(
    `${context.apiBaseUrl}/api/search/environment/${encodeURIComponent(context.environmentSlug)}/token-status`,
    {
      headers: {
        [runtimeTokenHeader]: token,
      },
      method: "GET",
    },
  );

  return {
    canQuery: response.canQuery,
    envFilePath: context.envFilePath,
    projectSearchId: response.projectSearchId,
    queryTargetId: response.queryTargetId,
    environmentSlug: response.environmentSlug,
    status: response.status,
  };
}

async function requestManagedRuntimeToken(params) {
  const context = await loadToolContext(params);
  const endpointPath =
    params.mode === "rotate"
      ? `/api/v1/project/search/environments/${encodeURIComponent(context.environmentSlug)}/tokens/actions/rotate`
      : `/api/v1/project/search/environments/${encodeURIComponent(context.environmentSlug)}/tokens`;

  const body = {};
  const tokenName = readOptionalString(params.tokenName);
  if (tokenName) {
    body.name = tokenName;
  }

  const response = await requestJson(`${context.apiBaseUrl}${endpointPath}`, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${context.apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const token = readOptionalString(response?.token?.token);
  if (!token) {
    throw new Error(
      "Environment token mutation response did not include a one-time token value.",
    );
  }

  await writeEnvVariable(context.envFilePath, runtimeTokenEnvName, token);
  await writeEnvVariable(context.envFilePath, runtimeEnvironmentEnvName, context.environmentSlug);

  return {
    envFilePath: context.envFilePath,
    environmentSlug: context.environmentSlug,
    status: params.mode === "rotate" ? "rotated" : "initialized",
    tokenId: response?.token?.id ?? null,
  };
}

export async function initRuntimeToken(params = {}) {
  const validation = await validateRuntimeToken(params);
  if (validation.status === "valid") {
    return {
      ...validation,
      status: "valid",
    };
  }

  return await requestManagedRuntimeToken({
    ...params,
    mode: "init",
  });
}

export async function rotateRuntimeToken(params = {}) {
  return await requestManagedRuntimeToken({
    ...params,
    mode: "rotate",
  });
}

export async function queryRuntime(params = {}) {
  const context = await loadToolContext(params);
  const token = await readSiteOSSearchTokenFromEnv(context.envFilePath);
  const query = readOptionalString(params.query);

  if (!query) {
    throw new Error("Missing required --q query.");
  }

  if (!token) {
    throw new Error(
      `${runtimeTokenEnvName} is missing from ${context.envFilePath}. Run init first.`,
    );
  }

  if (!isRuntimeTokenFormat(token)) {
    throw new Error(
      `${runtimeTokenEnvName} in ${context.envFilePath} has an invalid format.`,
    );
  }

  const searchParams = new URLSearchParams();
  searchParams.set("q", query);
  searchParams.set(
    "limit",
    String(readIntegerOption(params.limit, 5, "limit")),
  );
  searchParams.set(
    "offset",
    String(readIntegerOption(params.offset, 0, "offset")),
  );

  const response = await requestJson(
    `${context.apiBaseUrl}/api/search/environment/${encodeURIComponent(context.environmentSlug)}?${searchParams.toString()}`,
    {
      headers: {
        [runtimeTokenHeader]: token,
      },
      method: "GET",
    },
  );

  return {
    envFilePath: context.envFilePath,
    query,
    response,
    environmentSlug: context.environmentSlug,
    status: response?.success === false ? "query-failed" : "query-ok",
  };
}

async function main() {
  const { args, command } = parseArgs(process.argv.slice(2));
  const helpTarget = command === "help" ? process.argv.slice(2)[1] : command;
  if (
    command === "help" ||
    command === "--help" ||
    command === "-h" ||
    args.has("help")
  ) {
    console.log(commandUsage(helpTarget));
    return;
  }

  const params = {
    envFile: args.get("env-file"),
    projectRoot: args.get("project-root"),
    environmentSlug: args.get("environment"),
    tokenName: args.get("token-name"),
  };

  let result;
  if (command === "validate") {
    result = await validateRuntimeToken(params);
  } else if (command === "init") {
    result = await initRuntimeToken(params);
  } else if (command === "rotate") {
    result = await rotateRuntimeToken(params);
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
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
