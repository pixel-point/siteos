#!/usr/bin/env node
import { readdir } from "node:fs/promises";
import path from "node:path";

import {
  SITEOS_SEARCH_ONBOARDING_STEPS,
  deleteSiteOSSearchSessionArtifacts,
  ensureSiteOSSearchSessionState,
  evaluateSiteOSSearchOnboardingProgress,
  getSiteOSSearchSessionCleanupConfirmation,
  markSiteOSSearchStepCompleted,
  markSiteOSSearchStepStarted,
  readSiteOSSearchSessionArtifacts,
  readSiteOSSearchSessionState,
  setSiteOSSearchOnboardingSourceFocus,
  setSiteOSSearchConnectionState,
  setSiteOSSearchUiPlacementChoice,
  updateSiteOSSearchSessionState,
  writeSiteOSSearchAdaptationBlockerReport,
  writeSiteOSSearchDeliveryDecisionArtifact,
  writeSiteOSSearchExtractionPathArtifact,
  writeSiteOSSearchHostBaselineArtifact,
  writeSiteOSSearchSessionArtifact,
  writeSiteOSSearchUiPlacementPlanArtifact,
} from "./session-state.mjs";

const COMMANDS = [
  "help",
  "steps",
  "latest",
  "init-onboarding",
  "start-step",
  "complete-step",
  "set-step-status",
  "set-siteos-connection",
  "add-finding",
  "record-blocker",
  "clear-blockers",
  "set-source-focus",
  "set-ui-placement",
  "set-user-decisions",
  "write-artifact",
  "write-source-candidates",
  "write-ui-placement-plan",
  "write-host-baseline",
  "write-delivery-decision",
  "write-adaptation-blocker",
  "write-extraction-path",
  "list-artifacts",
  "evaluate",
  "cleanup-plan",
  "cleanup-confirmed",
];

const STEP_IDS = SITEOS_SEARCH_ONBOARDING_STEPS.map((step) => step.id);
const STEP_STATUS_VALUES = new Set(["todo", "doing", "done"]);
const OUTPUT_VALUES = new Set(["json", "path"]);
const CREDENTIAL_VALUE_REGEX = /\b(?:pboot|porg|pui|pdel)_[A-Za-z0-9_-]+\b/;

const HELP_TEXT = `SiteOS Search session-state CLI

Usage:
  node .agents/skills/search/scripts/session-state-cli.mjs <command> [options]

Core commands:
  help
  steps
  latest --project-root <path> [--output json|path]
  init-onboarding --project-root <path> [connection options]
  start-step --session-file <path|latest> --step <step-id> [--project-root <path>]
  complete-step --session-file <path|latest> --step <step-id> [--project-root <path>]
  set-step-status --session-file <path|latest> --step <step-id> --status todo|doing|done [--project-root <path>]
  evaluate --session-file <path|latest> [--project-root <path>]

State update commands:
  set-siteos-connection --session-file <path|latest> [connection options]
  add-finding --session-file <path|latest> --message <text>
  record-blocker --session-file <path|latest> --code <code> --message <text>
  clear-blockers --session-file <path|latest>
  set-source-focus --session-file <path|latest> --source-focus <text>
  set-ui-placement --session-file <path|latest> --placement <id> [--placement <id>...]
  set-user-decisions --session-file <path|latest> [--confirmed-source <id>...] [--rejected-source <id>...] [--placement <id>...] [--constraint <text>...]

Artifact commands:
  write-artifact --session-file <path|latest> --suffix <name> --extension json|md|txt --description <text> --content <text> [--step <step-id>]
  write-source-candidates --session-file <path|latest> --candidates-json <json-array>
  write-ui-placement-plan --session-file <path|latest> [--step source-confirmation] [--content-json <json>]
  write-host-baseline --session-file <path|latest> [--step ui-delivery] --content-json <json>
  write-delivery-decision --session-file <path|latest> [--step ui-delivery] --content-json <json>
  write-adaptation-blocker --session-file <path|latest> [--step ui-delivery] --content-json <json>
  write-extraction-path --session-file <path|latest> [--step extraction-implementation] --content-json <json>
  list-artifacts --session-file <path|latest>

Cleanup commands:
  cleanup-plan --session-file <path|latest>
  cleanup-confirmed --session-file <path|latest>

Connection options:
  --linkage-status ready|missing|malformed|not-ready|api-blocked|unknown
  --api-base-url-source env|config|default|unknown
  --api-base-url <url>
  --organization-auth-status missing|email-requested|logged-in|unknown
  --organization-slug <slug>
  --project-id <id>
  --project-name <name>
  --project-slug <slug>
  --command-category health-check|org-bootstrap|org-login|project-list|project-new|project-connect
  --config-path <path>
  --health-check-status <status>

Known onboarding steps:
  ${STEP_IDS.join("\n  ")}

Notes:
  - Use this CLI instead of reading or importing session-state.mjs directly.
  - Use --session-file latest only together with --project-root.
  - The CLI rejects obvious SiteOS credential values in string options.
`;

function parseArgs(argv) {
  const [command = "help", ...tokens] = argv;
  const options = {};
  const positionals = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }

    const key = token.slice(2);
    if (!key) {
      throw new Error("Empty option name is not allowed.");
    }

    const next = tokens[index + 1];
    const value =
      next === undefined || next.startsWith("--") ? "true" : tokens[++index];

    if (options[key] === undefined) {
      options[key] = value;
    } else if (Array.isArray(options[key])) {
      options[key].push(value);
    } else {
      options[key] = [options[key], value];
    }
  }

  return {
    command,
    options,
    positionals,
  };
}

function asArray(value) {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function requireOption(options, name) {
  const value = options[name];
  if (value === undefined || value === "true") {
    throw new Error(`Missing required option: --${name}`);
  }
  validateSafeString(name, value);
  return value;
}

function optionalString(options, name) {
  const value = options[name];
  if (value === undefined || value === "true") {
    return undefined;
  }
  validateSafeString(name, value);
  return value;
}

function validateSafeString(name, value) {
  for (const entry of asArray(value)) {
    if (typeof entry === "string" && CREDENTIAL_VALUE_REGEX.test(entry)) {
      throw new Error(
        `Refusing to store or print a credential-like value from --${name}.`,
      );
    }
  }
}

function validateStepId(stepId) {
  if (!STEP_IDS.includes(stepId)) {
    throw new Error(
      `Unknown step id "${stepId}". Run "session-state-cli.mjs steps" for valid ids.`,
    );
  }
}

function validateOutput(output) {
  if (!OUTPUT_VALUES.has(output)) {
    throw new Error(`Invalid --output value "${output}". Use json or path.`);
  }
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function parseJsonOption(options, name, fallback = {}) {
  const raw = optionalString(options, name);
  if (raw === undefined) {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in --${name}: ${error.message}`);
  }
}

function createSourceCandidatesArtifact(candidates) {
  if (!Array.isArray(candidates)) {
    throw new Error("--candidates-json must be a JSON array.");
  }

  return {
    sessionArtifact: {
      artifactSuffix: "source-candidates",
      description:
        "Temporary candidate inventory for the current onboarding discovery step.",
      extension: "json",
      stepId: "candidate-source-discovery",
    },
    candidates,
  };
}

function artifactSuffixFromFilename(filename) {
  const match = /^session-.+?\.([^.]+)\.[^.]+$/.exec(filename);
  return match?.[1] ?? null;
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  );
}

function connectionPatchFromOptions(options) {
  return compactObject({
    apiBaseUrl: optionalString(options, "api-base-url"),
    apiBaseUrlSource: optionalString(options, "api-base-url-source"),
    commandCategory: optionalString(options, "command-category"),
    configPath: optionalString(options, "config-path"),
    healthCheckStatus: optionalString(options, "health-check-status"),
    lastCheckedAt: optionalString(options, "last-checked-at"),
    linkageStatus: optionalString(options, "linkage-status"),
    organizationAuthStatus: optionalString(options, "organization-auth-status"),
    organizationSlug: optionalString(options, "organization-slug"),
    projectId: optionalString(options, "project-id"),
    projectName: optionalString(options, "project-name"),
    projectSlug: optionalString(options, "project-slug"),
  });
}

async function resolveLatestSessionFile(projectRoot) {
  if (!projectRoot) {
    throw new Error(
      "--project-root is required when --session-file is latest.",
    );
  }

  const searchDir = path.join(projectRoot, ".siteos", "temp", "search");
  let entries;
  try {
    entries = await readdir(searchDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(
        `No SiteOS Search session directory found at ${searchDir}.`,
      );
    }
    throw error;
  }

  const sessionFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /^session-.+\.json$/.test(name))
    .sort();

  if (sessionFiles.length === 0) {
    throw new Error(`No SiteOS Search session files found at ${searchDir}.`);
  }

  return path.join(searchDir, sessionFiles.at(-1));
}

async function resolveSessionFile(options) {
  const sessionFile = requireOption(options, "session-file");
  if (sessionFile === "latest") {
    return resolveLatestSessionFile(optionalString(options, "project-root"));
  }
  return sessionFile;
}

async function readAndEvaluate(sessionFilePath) {
  const state = await readSiteOSSearchSessionState(sessionFilePath);
  return {
    progress: evaluateSiteOSSearchOnboardingProgress(state),
    sessionFilePath,
    state,
  };
}

async function setStepStatus(sessionFilePath, stepId, status) {
  validateStepId(stepId);
  if (!STEP_STATUS_VALUES.has(status)) {
    throw new Error(
      `Invalid step status "${status}". Use todo, doing, or done.`,
    );
  }

  return updateSiteOSSearchSessionState(sessionFilePath, (state) => ({
    steps: state.steps.map((step) =>
      step.id === stepId
        ? {
            ...step,
            status,
          }
        : step,
    ),
  }));
}

async function handleInitOnboarding(options) {
  const projectRoot = requireOption(options, "project-root");
  const startedAt =
    optionalString(options, "started-at") ?? new Date().toISOString();
  const output = optionalString(options, "output") ?? "json";
  validateOutput(output);

  const connectionPatch = connectionPatchFromOptions(options);
  const context = compactObject({
    projectRoot,
    hostFramework: optionalString(options, "host-framework"),
    hostLanguage: optionalString(options, "host-language"),
    siteosApiBaseUrl: optionalString(options, "siteos-api-base-url"),
    siteosLinkagePresent:
      options["siteos-linkage-present"] === undefined
        ? undefined
        : options["siteos-linkage-present"] === "true",
    siteosProjectId: optionalString(options, "siteos-project-id"),
    siteosProjectSlug: optionalString(options, "siteos-project-slug"),
    runtimeTarget: optionalString(options, "runtime-target"),
    searchConfigPresent:
      options["search-config-present"] === undefined
        ? undefined
        : options["search-config-present"] === "true",
    userRequestedSourceFocus: optionalString(options, "source-focus"),
    siteosConnection:
      Object.keys(connectionPatch).length > 0 ? connectionPatch : undefined,
  });

  const result = await ensureSiteOSSearchSessionState({
    context,
    mode: "onboarding",
    projectRoot,
    startedAt,
  });

  if (output === "path") {
    process.stdout.write(`${result.sessionFilePath}\n`);
    return;
  }

  printJson({
    created: result.created,
    progress: evaluateSiteOSSearchOnboardingProgress(result.state),
    sessionFilePath: result.sessionFilePath,
  });
}

async function handleCommand(command, options) {
  if (command === "help" || command === "--help" || command === "-h") {
    process.stdout.write(HELP_TEXT);
    return;
  }

  if (!COMMANDS.includes(command)) {
    throw new Error(
      `Unknown command "${command}". Run "session-state-cli.mjs help".`,
    );
  }

  if (command === "steps") {
    printJson({ steps: SITEOS_SEARCH_ONBOARDING_STEPS });
    return;
  }

  if (command === "latest") {
    const sessionFilePath = await resolveLatestSessionFile(
      requireOption(options, "project-root"),
    );
    const output = optionalString(options, "output") ?? "json";
    validateOutput(output);
    if (output === "path") {
      process.stdout.write(`${sessionFilePath}\n`);
      return;
    }
    printJson({ sessionFilePath });
    return;
  }

  if (command === "init-onboarding") {
    await handleInitOnboarding(options);
    return;
  }

  const sessionFilePath = await resolveSessionFile(options);

  if (command === "start-step") {
    const stepId = requireOption(options, "step");
    validateStepId(stepId);
    await markSiteOSSearchStepStarted(
      sessionFilePath,
      stepId,
      optionalString(options, "at") ?? new Date().toISOString(),
    );
    await setStepStatus(sessionFilePath, stepId, "doing");
    printJson(await readAndEvaluate(sessionFilePath));
    return;
  }

  if (command === "complete-step") {
    const stepId = requireOption(options, "step");
    validateStepId(stepId);
    await markSiteOSSearchStepCompleted(
      sessionFilePath,
      stepId,
      optionalString(options, "at") ?? new Date().toISOString(),
    );
    await setStepStatus(sessionFilePath, stepId, "done");
    printJson(await readAndEvaluate(sessionFilePath));
    return;
  }

  if (command === "set-step-status") {
    await setStepStatus(
      sessionFilePath,
      requireOption(options, "step"),
      requireOption(options, "status"),
    );
    printJson(await readAndEvaluate(sessionFilePath));
    return;
  }

  if (command === "set-siteos-connection") {
    const patch = connectionPatchFromOptions(options);
    if (Object.keys(patch).length === 0) {
      throw new Error("At least one connection option is required.");
    }
    await setSiteOSSearchConnectionState(sessionFilePath, patch);
    printJson(await readAndEvaluate(sessionFilePath));
    return;
  }

  if (command === "add-finding") {
    const message = requireOption(options, "message");
    await updateSiteOSSearchSessionState(sessionFilePath, (state) => ({
      findings: [...state.findings, message],
    }));
    printJson(await readAndEvaluate(sessionFilePath));
    return;
  }

  if (command === "record-blocker") {
    const code = requireOption(options, "code");
    const message = requireOption(options, "message");
    await updateSiteOSSearchSessionState(sessionFilePath, (state) => ({
      blockers: [
        ...state.blockers,
        {
          code,
          message,
        },
      ],
    }));
    printJson(await readAndEvaluate(sessionFilePath));
    return;
  }

  if (command === "clear-blockers") {
    await updateSiteOSSearchSessionState(sessionFilePath, { blockers: [] });
    printJson(await readAndEvaluate(sessionFilePath));
    return;
  }

  if (command === "set-source-focus") {
    await setSiteOSSearchOnboardingSourceFocus(
      sessionFilePath,
      requireOption(options, "source-focus"),
    );
    printJson(await readAndEvaluate(sessionFilePath));
    return;
  }

  if (command === "set-ui-placement") {
    const placements = asArray(options.placement);
    if (placements.length === 0) {
      throw new Error("At least one --placement value is required.");
    }
    placements.forEach((placement) =>
      validateSafeString("placement", placement),
    );
    await setSiteOSSearchUiPlacementChoice(sessionFilePath, placements);
    printJson(await readAndEvaluate(sessionFilePath));
    return;
  }

  if (command === "set-user-decisions") {
    const decisions = compactObject({
      confirmedSources:
        options["confirmed-source"] === undefined
          ? undefined
          : asArray(options["confirmed-source"]),
      rejectedSources:
        options["rejected-source"] === undefined
          ? undefined
          : asArray(options["rejected-source"]),
      chosenUiPlacement:
        options.placement === undefined
          ? undefined
          : asArray(options.placement),
      otherConstraints:
        options.constraint === undefined
          ? undefined
          : asArray(options.constraint),
    });
    if (Object.keys(decisions).length === 0) {
      throw new Error("At least one user decision option is required.");
    }
    Object.entries(decisions).forEach(([name, values]) =>
      values.forEach((value) => validateSafeString(name, value)),
    );
    await updateSiteOSSearchSessionState(sessionFilePath, {
      userDecisions: decisions,
    });
    printJson(await readAndEvaluate(sessionFilePath));
    return;
  }

  if (command === "write-artifact") {
    const result = await writeSiteOSSearchSessionArtifact({
      artifactSuffix: requireOption(options, "suffix"),
      content: requireOption(options, "content"),
      currentStepId: optionalString(options, "step") ?? null,
      description: requireOption(options, "description"),
      extension: requireOption(options, "extension"),
      sessionFilePath,
    });
    printJson({
      artifact: result.artifact,
      progress: evaluateSiteOSSearchOnboardingProgress(result.state),
      sessionFilePath,
    });
    return;
  }

  if (command === "write-source-candidates") {
    const result = await writeSiteOSSearchSessionArtifact({
      artifactSuffix: "source-candidates",
      content: createSourceCandidatesArtifact(
        parseJsonOption(options, "candidates-json", []),
      ),
      currentStepId:
        optionalString(options, "step") ?? "candidate-source-discovery",
      description:
        "Temporary candidate inventory for the current onboarding discovery step.",
      extension: "json",
      sessionFilePath,
    });
    printJson({
      artifact: result.artifact,
      progress: evaluateSiteOSSearchOnboardingProgress(result.state),
      sessionFilePath,
    });
    return;
  }

  if (command === "write-ui-placement-plan") {
    const result = await writeSiteOSSearchUiPlacementPlanArtifact({
      currentStepId: optionalString(options, "step") ?? "source-confirmation",
      plan: parseJsonOption(options, "content-json", {}),
      sessionFilePath,
    });
    printJson({
      artifact: result.artifact,
      progress: evaluateSiteOSSearchOnboardingProgress(result.state),
      sessionFilePath,
    });
    return;
  }

  if (command === "write-host-baseline") {
    const result = await writeSiteOSSearchHostBaselineArtifact({
      currentStepId: optionalString(options, "step") ?? "ui-delivery",
      hostBaseline: parseJsonOption(options, "content-json"),
      sessionFilePath,
    });
    printJson({
      artifact: result.artifact,
      progress: evaluateSiteOSSearchOnboardingProgress(result.state),
      sessionFilePath,
    });
    return;
  }

  if (command === "write-delivery-decision") {
    const result = await writeSiteOSSearchDeliveryDecisionArtifact({
      currentStepId: optionalString(options, "step") ?? "ui-delivery",
      decision: parseJsonOption(options, "content-json"),
      sessionFilePath,
    });
    printJson({
      artifact: result.artifact,
      progress: evaluateSiteOSSearchOnboardingProgress(result.state),
      sessionFilePath,
    });
    return;
  }

  if (command === "write-adaptation-blocker") {
    const result = await writeSiteOSSearchAdaptationBlockerReport({
      currentStepId: optionalString(options, "step") ?? "ui-delivery",
      report: parseJsonOption(options, "content-json"),
      sessionFilePath,
    });
    printJson({
      artifact: result.artifact,
      progress: evaluateSiteOSSearchOnboardingProgress(result.state),
      sessionFilePath,
    });
    return;
  }

  if (command === "write-extraction-path") {
    const result = await writeSiteOSSearchExtractionPathArtifact({
      currentStepId:
        optionalString(options, "step") ?? "extraction-implementation",
      decision: parseJsonOption(options, "content-json"),
      sessionFilePath,
    });
    printJson({
      artifact: result.artifact,
      progress: evaluateSiteOSSearchOnboardingProgress(result.state),
      sessionFilePath,
    });
    return;
  }

  if (command === "list-artifacts") {
    const artifacts = await readSiteOSSearchSessionArtifacts(sessionFilePath);
    printJson({
      artifacts: artifacts.map((artifact) => ({
        description: artifact.description,
        filename: path.basename(artifact.fullFilePath),
        fullFilePath: artifact.fullFilePath,
        suffix: artifactSuffixFromFilename(
          path.basename(artifact.fullFilePath),
        ),
      })),
      sessionFilePath,
    });
    return;
  }

  if (command === "evaluate") {
    printJson(await readAndEvaluate(sessionFilePath));
    return;
  }

  if (command === "cleanup-plan") {
    printJson(await getSiteOSSearchSessionCleanupConfirmation(sessionFilePath));
    return;
  }

  if (command === "cleanup-confirmed") {
    printJson(
      await deleteSiteOSSearchSessionArtifacts({
        confirmCleanup: true,
        sessionFilePath,
      }),
    );
  }
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  await handleCommand(command, options);
}

main().catch((error) => {
  process.stderr.write(`session-state-cli error: ${error.message}\n\n`);
  process.stderr.write("Run `session-state-cli.mjs help` for usage.\n");
  process.exitCode = 1;
});
