#!/usr/bin/env node
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const SITEOS_SEARCH_SESSION_SCHEMA_VERSION = 1;

export const SITEOS_SEARCH_ONBOARDING_STEPS = [
  {
    id: "siteos-connection",
    title: "SiteOS connection",
  },
  {
    id: "readiness-and-mode-detection",
    title: "Readiness and mode detection",
  },
  {
    id: "candidate-source-discovery",
    title: "Candidate source discovery",
  },
  {
    id: "source-confirmation",
    title: "Source confirmation",
  },
  {
    id: "scaffold-creation",
    title: "Scaffold creation",
  },
  {
    id: "extraction-implementation",
    title: "Extraction implementation",
  },
  {
    id: "dry-run-preview",
    title: "Dry-run preview",
  },
  {
    id: "first-live-sync",
    title: "First live sync",
  },
  {
    id: "query-verification",
    title: "Query verification",
  },
  {
    id: "ui-delivery",
    title: "UI delivery",
  },
  {
    id: "ui-placement-confirmation",
    title: "UI placement validation",
  },
  {
    id: "ui-integration",
    title: "UI integration",
  },
  {
    id: "final-verification",
    title: "Final verification",
  },
  {
    id: "cleanup-confirmation",
    title: "Cleanup confirmation",
  },
];

export const SITEOS_SEARCH_ONBOARDING_CHECKPOINT_REASONS = {
  sourceConfirmation: "source-and-ui-placement-confirmation",
  uiPlacementConfirmation: "ui-placement-confirmation",
};

export const SITEOS_SEARCH_UI_DELIVERY_PATHS = {
  dedicatedPageFirst: {
    description:
      "Start with a dedicated search page before embedding search into existing UI surfaces.",
    id: "dedicated-page-first",
    label: "Dedicated search page first",
  },
  directPlacement: {
    description:
      "Insert search directly into an existing host-project UI surface after explicit placement confirmation.",
    id: "direct-placement",
    label: "Direct placement into existing UI surfaces",
  },
};

export const SITEOS_SEARCH_UI_PLACEMENT_OPTIONS = {
  dedicatedPageFirst: {
    id: "dedicated-page-first",
    kind: "default-safe-path",
    label: "Dedicated search page first",
    requiresConfirmation: true,
    summary:
      "Ship the dedicated search page as the first user-facing surface before broader embedding.",
    targetSurfaces: ["dedicated-search-page"],
  },
  globalEntryPoints: {
    id: "global-entry-points",
    kind: "broader-embedding",
    label: "Global entry points",
    requiresConfirmation: true,
    summary:
      "Add search entry points to shared host surfaces such as header, footer, or homepage areas.",
    targetSurfaces: ["header", "footer", "homepage"],
  },
  sourceListingPages: {
    id: "source-listing-pages",
    kind: "broader-embedding",
    label: "Source listing pages",
    requiresConfirmation: true,
    summary:
      "Expose search on listing-style pages for implemented source families.",
    targetSurfaces: ["source-listing-pages"],
  },
  sourceDetailPages: {
    id: "source-detail-pages",
    kind: "broader-embedding",
    label: "Source detail pages",
    requiresConfirmation: true,
    summary:
      "Expose search on source detail pages where in-context lookup is useful.",
    targetSurfaces: ["source-detail-pages"],
  },
};

const SITEOS_SEARCH_DEFAULT_DEDICATED_PAGE_ROUTE = {
  availability: "available",
  checkedPaths: ["/search"],
  fallbackPath: "",
  fallbackReason: "",
  promptText: "Confirm UI placement: /search (recommended).",
  recommendedPath: "/search",
};

const SITEOS_SEARCH_CREDENTIAL_VALUE_REGEX =
  /\b(?:pboot|porg|pui|pdel)_[A-Za-z0-9_-]+\b/;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneArray(value) {
  return Array.isArray(value) ? value.map((item) => item) : [];
}

function normalizeStartedAt(value) {
  const startedAt = value ?? new Date().toISOString();
  const date = new Date(startedAt);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid startedAt value: ${startedAt}`);
  }
  return date.toISOString();
}

function normalizeNullableString(value) {
  return typeof value === "string" ? value : null;
}

function normalizeSafeNullableString(value) {
  const normalized = normalizeNullableString(value);
  if (!normalized) {
    return normalized;
  }

  return SITEOS_SEARCH_CREDENTIAL_VALUE_REGEX.test(normalized)
    ? null
    : normalized;
}

function normalizeNullableBoolean(value) {
  return typeof value === "boolean" ? value : null;
}

function normalizeNullableNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeNullableString(entry))
    .filter((entry) => entry !== null);
}

function normalizeDedicatedPageRouteRecommendation(value = {}) {
  const candidate = isRecord(value) ? value : {};
  const recommendedPath =
    normalizeNullableString(candidate.recommendedPath) ??
    normalizeNullableString(candidate.path) ??
    SITEOS_SEARCH_DEFAULT_DEDICATED_PAGE_ROUTE.recommendedPath;

  return {
    availability:
      normalizeNullableString(candidate.availability) ??
      SITEOS_SEARCH_DEFAULT_DEDICATED_PAGE_ROUTE.availability,
    checkedPaths:
      normalizeStringArray(candidate.checkedPaths).length > 0
        ? normalizeStringArray(candidate.checkedPaths)
        : SITEOS_SEARCH_DEFAULT_DEDICATED_PAGE_ROUTE.checkedPaths,
    fallbackPath: normalizeNullableString(candidate.fallbackPath) ?? "",
    fallbackReason: normalizeNullableString(candidate.fallbackReason) ?? "",
    promptText:
      normalizeNullableString(candidate.promptText) ??
      `Confirm UI placement: ${recommendedPath} (recommended).`,
    recommendedPath,
  };
}

function normalizeDeliveryDecision(value) {
  const normalized = normalizeNullableString(value);
  return normalized === "copy" ||
    normalized === "adapt" ||
    normalized === "recreate"
    ? normalized
    : null;
}

function normalizeNullableIsoTimestamp(value) {
  const normalized = normalizeNullableString(value);
  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function calculateDurationMs(startedAt, completedAt) {
  if (!startedAt || !completedAt) {
    return null;
  }

  const startedTime = new Date(startedAt).getTime();
  const completedTime = new Date(completedAt).getTime();

  if (Number.isNaN(startedTime) || Number.isNaN(completedTime)) {
    return null;
  }

  return Math.max(0, completedTime - startedTime);
}

function normalizeStepTiming(value = {}) {
  const candidate = isRecord(value) ? value : {};
  const startedAt = normalizeNullableIsoTimestamp(candidate.startedAt);
  const completedAt = normalizeNullableIsoTimestamp(candidate.completedAt);

  return {
    completedAt,
    durationMs:
      normalizeNullableNumber(candidate.durationMs) ??
      calculateDurationMs(startedAt, completedAt),
    startedAt,
  };
}

function normalizeExtractionPathDecision(value) {
  const normalized = normalizeNullableString(value);
  return normalized === "reuse" ||
    normalized === "bridge" ||
    normalized === "fallback extractor"
    ? normalized
    : null;
}

function normalizeArtifactEntries(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry) => isRecord(entry))
    .map((entry) => ({
      description: normalizeNullableString(entry.description) ?? "",
      filename: normalizeNullableString(entry.filename) ?? "",
    }));
}

function normalizeExtension(extension) {
  const normalized = normalizeNullableString(extension)?.replace(/^\.+/, "");
  if (!normalized) {
    throw new Error("artifact extension is required.");
  }
  return normalized;
}

function normalizeArtifactSuffix(suffix) {
  const normalized = normalizeNullableString(suffix)?.replace(/^\.+/, "");
  if (!normalized) {
    throw new Error("artifact suffix is required.");
  }
  return normalized;
}

function flattenStepArtifacts(steps) {
  return steps.flatMap((step) => normalizeArtifactEntries(step.artifacts));
}

function normalizeContext(context, projectRoot) {
  const candidate = isRecord(context) ? context : {};

  return {
    projectRoot:
      normalizeNullableString(candidate.projectRoot) ??
      normalizeNullableString(projectRoot),
    siteosProjectId: normalizeNullableString(candidate.siteosProjectId),
    siteosProjectSlug: normalizeNullableString(candidate.siteosProjectSlug),
    siteosApiBaseUrl: normalizeNullableString(candidate.siteosApiBaseUrl),
    hostLanguage: normalizeNullableString(candidate.hostLanguage),
    hostFramework: normalizeNullableString(candidate.hostFramework),
    searchConfigPresent: normalizeNullableBoolean(
      candidate.searchConfigPresent,
    ),
    siteosLinkagePresent: normalizeNullableBoolean(
      candidate.siteosLinkagePresent,
    ),
    siteosConnection: normalizeSiteOSConnectionState(candidate.siteosConnection),
    runtimeTarget: normalizeNullableString(candidate.runtimeTarget),
    userRequestedSourceFocus: normalizeNullableString(
      candidate.userRequestedSourceFocus,
    ),
  };
}

function normalizeStep(step, fallback) {
  const candidate = isRecord(step) ? step : {};
  return {
    id: normalizeNullableString(candidate.id) ?? fallback.id,
    title: normalizeNullableString(candidate.title) ?? fallback.title,
    status: normalizeNullableString(candidate.status) ?? "todo",
    artifacts: normalizeArtifactEntries(candidate.artifacts),
    timing: normalizeStepTiming(candidate.timing),
  };
}

function normalizeSteps(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return SITEOS_SEARCH_ONBOARDING_STEPS.map((step) => ({
      ...step,
      status: "todo",
      artifacts: [],
      timing: normalizeStepTiming(),
    }));
  }

  const stepIds = new Set(SITEOS_SEARCH_ONBOARDING_STEPS.map((step) => step.id));
  const hasRecognizedStepIds = steps.some(
    (candidate) =>
      isRecord(candidate) &&
      typeof candidate.id === "string" &&
      stepIds.has(candidate.id),
  );

  return SITEOS_SEARCH_ONBOARDING_STEPS.map((step, index) =>
    normalizeStep(
      steps.find(
        (candidate) => isRecord(candidate) && candidate.id === step.id,
      ) ?? (hasRecognizedStepIds ? null : steps[index]),
      step,
    ),
  );
}

function normalizeUserDecisions(value) {
  const candidate = isRecord(value) ? value : {};
  return {
    confirmedSources: cloneArray(candidate.confirmedSources),
    rejectedSources: cloneArray(candidate.rejectedSources),
    chosenResultStrategies: isRecord(candidate.chosenResultStrategies)
      ? { ...candidate.chosenResultStrategies }
      : {},
    chosenUiPlacement: cloneArray(candidate.chosenUiPlacement),
    otherConstraints: cloneArray(candidate.otherConstraints),
  };
}

function hasConfirmedUiPlacement(userDecisions) {
  return normalizeUserDecisions(userDecisions).chosenUiPlacement.length > 0;
}

function normalizeSiteOSConnectionStatus(value) {
  const normalized = normalizeSafeNullableString(value);
  return normalized === "ready" ||
    normalized === "missing" ||
    normalized === "malformed" ||
    normalized === "not-ready" ||
    normalized === "api-blocked" ||
    normalized === "unknown"
    ? normalized
    : "unknown";
}

function normalizeSiteOSConnectionState(value) {
  const candidate = isRecord(value) ? value : {};

  return {
    apiBaseUrl: normalizeSafeNullableString(candidate.apiBaseUrl),
    apiBaseUrlSource: normalizeSafeNullableString(candidate.apiBaseUrlSource),
    commandCategory: normalizeSafeNullableString(candidate.commandCategory),
    configPath: normalizeSafeNullableString(candidate.configPath),
    healthCheckStatus: normalizeSafeNullableString(candidate.healthCheckStatus),
    lastCheckedAt: normalizeSafeNullableString(candidate.lastCheckedAt),
    linkageStatus: normalizeSiteOSConnectionStatus(candidate.linkageStatus),
    organizationAuthStatus: normalizeSafeNullableString(
      candidate.organizationAuthStatus,
    ),
    organizationSlug: normalizeSafeNullableString(candidate.organizationSlug),
    projectId: normalizeSafeNullableString(candidate.projectId),
    projectName: normalizeSafeNullableString(candidate.projectName),
    projectSlug: normalizeSafeNullableString(candidate.projectSlug),
  };
}

function activeBlockerSummary(blockers) {
  if (!Array.isArray(blockers) || blockers.length === 0) {
    return null;
  }

  const [firstBlocker] = blockers;
  if (typeof firstBlocker === "string") {
    return firstBlocker;
  }

  if (isRecord(firstBlocker)) {
    if (typeof firstBlocker.message === "string") {
      return firstBlocker.message;
    }
    if (typeof firstBlocker.code === "string") {
      return firstBlocker.code;
    }
  }

  return "Recorded blocker";
}

export function getSiteOSSearchOnboardingStepIndex(stepId) {
  return SITEOS_SEARCH_ONBOARDING_STEPS.findIndex((step) => step.id === stepId);
}

export function getSiteOSSearchOnboardingActiveStep(state) {
  const steps = normalizeSteps(state?.steps);
  const activeStep = steps.find((step) => step.status !== "done") ?? null;

  if (!activeStep) {
    return null;
  }

  return {
    ...activeStep,
    index: getSiteOSSearchOnboardingStepIndex(activeStep.id),
  };
}

export function getSiteOSSearchOnboardingNextStep(stepId) {
  const currentStepIndex = getSiteOSSearchOnboardingStepIndex(stepId);
  if (currentStepIndex < 0) {
    return null;
  }

  const nextStep = SITEOS_SEARCH_ONBOARDING_STEPS[currentStepIndex + 1];
  return nextStep
    ? {
        ...nextStep,
        index: currentStepIndex + 1,
      }
    : null;
}

function evaluateCheckpoint(activeStep, options, state) {
  if (!activeStep) {
    return null;
  }

  if (
    activeStep.id === "source-confirmation" &&
    (options.requireSourceConfirmation ?? true)
  ) {
    return {
      checkpointKind: "user-decision",
      reason: SITEOS_SEARCH_ONBOARDING_CHECKPOINT_REASONS.sourceConfirmation,
    };
  }

  if (
    activeStep.id === "ui-placement-confirmation" &&
    (options.requireUiPlacementConfirmation ?? true) &&
    !hasConfirmedUiPlacement(state?.userDecisions)
  ) {
    return {
      checkpointKind: "user-decision",
      reason:
        SITEOS_SEARCH_ONBOARDING_CHECKPOINT_REASONS.uiPlacementConfirmation,
    };
  }

  return null;
}

function progressMessage(
  previousStep,
  activeStep,
  nextStep,
  decision,
  blocker,
) {
  const stepDone = previousStep
    ? `Step ${previousStep.index + 1} done: ${previousStep.title}.`
    : "Step done: none yet.";

  const weAreHere = activeStep
    ? `We are here: Step ${activeStep.index + 1} - ${activeStep.title}.`
    : "We are here: onboarding execution is complete.";

  if (decision === "blocked") {
    return {
      nextSteps: `Next steps: stop for a real blocker before continuing (${blocker ?? "blocker recorded"}).`,
      stepDone,
      weAreHere,
    };
  }

  if (decision === "checkpoint") {
    return {
      nextSteps: `Next steps: stop for the ${activeStep.title.toLowerCase()} checkpoint before continuing.`,
      stepDone,
      weAreHere,
    };
  }

  if (decision === "continue") {
    return {
      nextSteps: nextStep
        ? `Next steps: continue automatically to Step ${nextStep.index + 1} - ${nextStep.title}.`
        : "Next steps: continue to final completion reporting.",
      stepDone,
      weAreHere,
    };
  }

  return {
    nextSteps: "Next steps: onboarding technical steps are complete.",
    stepDone,
    weAreHere,
  };
}

export function createSiteOSSearchOnboardingSessionState({
  context = {},
  projectRoot = null,
  startedAt,
} = {}) {
  const normalizedStartedAt = normalizeStartedAt(startedAt);
  return {
    schemaVersion: SITEOS_SEARCH_SESSION_SCHEMA_VERSION,
    startedAt: normalizedStartedAt,
    mode: "onboarding",
    context: normalizeContext(context, projectRoot),
    steps: normalizeSteps([]),
    userDecisions: normalizeUserDecisions({}),
    findings: [],
    blockers: [],
    artifacts: [],
  };
}

export function createSiteOSSearchHostBaselineArtifact(baseline = {}) {
  const candidate = isRecord(baseline) ? baseline : {};

  return {
    artifactSlug: "host-baseline",
    deliveryConstraints: normalizeStringArray(candidate.deliveryConstraints),
    hostFramework: normalizeNullableString(candidate.hostFramework),
    hostLanguage: normalizeNullableString(candidate.hostLanguage),
    importAliases: normalizeStringArray(candidate.importAliases),
    importStyle: normalizeNullableString(candidate.importStyle),
    moduleStyle: normalizeNullableString(candidate.moduleStyle),
    notes: normalizeStringArray(candidate.notes),
    routerConventions: normalizeStringArray(candidate.routerConventions),
    touchedProjectArea: normalizeNullableString(candidate.touchedProjectArea),
  };
}

export function createSiteOSSearchDeliveryDecisionArtifact(decision = {}) {
  const candidate = isRecord(decision) ? decision : {};
  const artifactClasses = isRecord(candidate.artifactClasses)
    ? Object.fromEntries(
        Object.entries(candidate.artifactClasses)
          .filter(([, value]) => isRecord(value))
          .map(([artifactClass, value]) => [
            artifactClass,
            {
              canonicalDeviation:
                normalizeNullableString(value.canonicalDeviation) ?? "",
              decision: normalizeDeliveryDecision(value.decision) ?? "copy",
              rationale: normalizeNullableString(value.rationale) ?? "",
            },
          ]),
      )
    : {};

  return {
    artifactClasses,
    artifactSlug: "delivery-decision-ladder",
    baselineArtifactSlug:
      normalizeNullableString(candidate.baselineArtifactSlug) ??
      "host-baseline",
  };
}

export function createSiteOSSearchAdaptationBlockerReport(report = {}) {
  const candidate = isRecord(report) ? report : {};

  return {
    adaptationBlocker:
      normalizeNullableString(candidate.adaptationBlocker) ?? "",
    artifactSlug: "adaptation-blocker-report",
    nextMeaningfulCheckpoint:
      normalizeNullableString(candidate.nextMeaningfulCheckpoint) ?? "",
    whatAlreadyWorks: normalizeStringArray(candidate.whatAlreadyWorks),
  };
}

export function createSiteOSSearchExtractionPathArtifact(decision = {}) {
  const candidate = isRecord(decision) ? decision : {};
  const sources = isRecord(candidate.sources)
    ? Object.fromEntries(
        Object.entries(candidate.sources)
          .filter(([, value]) => isRecord(value))
          .map(([sourceId, value]) => [
            sourceId,
            {
              decision:
                normalizeExtractionPathDecision(value.decision) ?? "reuse",
              rationale: normalizeNullableString(value.rationale) ?? "",
            },
          ]),
      )
    : {};

  return {
    artifactSlug: "extraction-path-ladder",
    baselineArtifactSlug:
      normalizeNullableString(candidate.baselineArtifactSlug) ??
      "host-baseline",
    sources,
  };
}

export function createSiteOSSearchUiPlacementPlanArtifact(plan = {}) {
  const candidate = isRecord(plan) ? plan : {};
  const options = Array.isArray(candidate.options)
    ? candidate.options
        .filter((value) => isRecord(value))
        .map((value) => ({
          id: normalizeNullableString(value.id) ?? "",
          kind: normalizeNullableString(value.kind) ?? "broader-embedding",
          label: normalizeNullableString(value.label) ?? "",
          requiresConfirmation:
            normalizeNullableBoolean(value.requiresConfirmation) ?? true,
          summary: normalizeNullableString(value.summary) ?? "",
          targetSurfaces: normalizeStringArray(value.targetSurfaces),
        }))
        .filter((value) => value.id.length > 0 && value.label.length > 0)
    : Object.values(SITEOS_SEARCH_UI_PLACEMENT_OPTIONS);

  return {
    artifactSlug: "ui-placement-plan",
    confirmationRequired:
      normalizeNullableBoolean(candidate.confirmationRequired) ?? true,
    dedicatedPageRoute: normalizeDedicatedPageRouteRecommendation(
      candidate.dedicatedPageRoute,
    ),
    defaultPlacementOptionId:
      normalizeNullableString(candidate.defaultPlacementOptionId) ??
      SITEOS_SEARCH_UI_PLACEMENT_OPTIONS.dedicatedPageFirst.id,
    options,
  };
}

export function normalizeSiteOSSearchSessionState(state, options = {}) {
  const candidate = isRecord(state) ? state : {};
  const startedAt = normalizeStartedAt(candidate.startedAt);

  return {
    schemaVersion: SITEOS_SEARCH_SESSION_SCHEMA_VERSION,
    startedAt,
    mode: "onboarding",
    context: normalizeContext(candidate.context, options.projectRoot),
    steps: normalizeSteps(candidate.steps),
    userDecisions: normalizeUserDecisions(candidate.userDecisions),
    findings: cloneArray(candidate.findings),
    blockers: cloneArray(candidate.blockers),
    artifacts: normalizeArtifactEntries(candidate.artifacts),
  };
}

export function formatSiteOSSearchSessionTimestamp(startedAt) {
  return normalizeStartedAt(startedAt)
    .replaceAll(":", "-")
    .replaceAll(".", "-");
}

const SITEOS_SEARCH_TEMP_DIRECTORY = [".siteos", "temp", "search"];

export function resolveSiteOSSearchSessionArtifactPath({
  extension,
  artifactSuffix,
  sessionFilePath,
}) {
  const normalizedSuffix = normalizeArtifactSuffix(artifactSuffix);
  const normalizedExtension = normalizeExtension(extension);
  const sessionDirectory = path.dirname(sessionFilePath);
  const sessionBaseName = path.basename(sessionFilePath, ".json");

  return path.join(
    sessionDirectory,
    `${sessionBaseName}.${normalizedSuffix}.${normalizedExtension}`,
  );
}

function serializeSiteOSSearchSessionArtifact({ content, extension }) {
  const normalizedExtension = normalizeExtension(extension);

  if (normalizedExtension === "json") {
    const jsonValue =
      typeof content === "string" ? JSON.parse(content) : content;
    return `${JSON.stringify(jsonValue, null, 2)}\n`;
  }

  return `${String(content ?? "")}\n`;
}

export function evaluateSiteOSSearchOnboardingProgress(state, options = {}) {
  const normalizedState = normalizeSiteOSSearchSessionState(state);
  const activeStep = getSiteOSSearchOnboardingActiveStep(normalizedState);
  const previousStep = activeStep
    ? activeStep.index > 0
      ? {
          ...normalizedState.steps[activeStep.index - 1],
          index: activeStep.index - 1,
        }
      : null
    : normalizedState.steps.length > 0
      ? {
          ...normalizedState.steps[normalizedState.steps.length - 1],
          index: normalizedState.steps.length - 1,
        }
      : null;
  const nextStepAfterSuccess = activeStep
    ? getSiteOSSearchOnboardingNextStep(activeStep.id)
    : null;
  const blocker = activeBlockerSummary(normalizedState.blockers);
  const checkpoint = evaluateCheckpoint(activeStep, options, normalizedState);

  if (blocker) {
    return {
      activeStep,
      checkpointKind: "blocker",
      decision: "blocked",
      message: progressMessage(
        previousStep,
        activeStep,
        nextStepAfterSuccess,
        "blocked",
        blocker,
      ),
      nextStepAfterSuccess,
      shouldContinueAutomatically: false,
      stopReason: blocker,
    };
  }

  if (checkpoint) {
    return {
      activeStep,
      checkpointKind: checkpoint.checkpointKind,
      decision: "checkpoint",
      message: progressMessage(
        previousStep,
        activeStep,
        nextStepAfterSuccess,
        "checkpoint",
        null,
      ),
      nextStepAfterSuccess,
      shouldContinueAutomatically: false,
      stopReason: checkpoint.reason,
    };
  }

  if (activeStep) {
    return {
      activeStep,
      checkpointKind: null,
      decision: "continue",
      message: progressMessage(
        previousStep,
        activeStep,
        nextStepAfterSuccess,
        "continue",
        null,
      ),
      nextStepAfterSuccess,
      shouldContinueAutomatically: true,
      stopReason: null,
    };
  }

  return {
    activeStep: null,
    checkpointKind: null,
    decision: "complete",
    message: progressMessage(previousStep, null, null, "complete", null),
    nextStepAfterSuccess: null,
    shouldContinueAutomatically: false,
    stopReason: null,
  };
}

export function evaluateSiteOSSearchUiDeliveryBranch(state) {
  const normalizedState = normalizeSiteOSSearchSessionState(state);
  const progress = evaluateSiteOSSearchOnboardingProgress(normalizedState);
  const activeStepId = progress.activeStep?.id ?? null;
  const placementPlan = createSiteOSSearchUiPlacementPlanArtifact();
  const chosenUiPlacement = cloneArray(
    normalizedState.userDecisions.chosenUiPlacement,
  );
  const placementDecisionRequired = chosenUiPlacement.length === 0;

  return {
    activeStepId,
    chosenUiPlacement,
    defaultPath: SITEOS_SEARCH_UI_DELIVERY_PATHS.dedicatedPageFirst,
    directPlacementPath: SITEOS_SEARCH_UI_DELIVERY_PATHS.directPlacement,
    placementOptions: placementPlan.options,
    placementPlan,
    placementDecisionRequired,
    shouldStopForPlacementDecision: false,
    uiIntegratedIntoHostSurfaces: false,
    userFacingSummary: {
      defaultPathSummary:
        "Default safe path: start with a dedicated search page.",
      placementDecisionSummary: placementDecisionRequired
        ? "UI placement must be confirmed in the source-confirmation checkpoint before scaffold and UI delivery continue."
        : "UI placement is already confirmed and should be consumed by UI delivery without a second placement checkpoint.",
      placementOptionsSummary:
        "The combined checkpoint supports either a dedicated search page or one explicit host-project UI location.",
      serverSideReadinessSummary:
        "Server-side search integration is working and can already be tested.",
      uiSurfaceSummary:
        "UI is not yet integrated into the final user-facing host surfaces.",
    },
  };
}

export async function getSiteOSSearchSessionCleanupConfirmation(
  sessionFilePath,
) {
  const state = await readSiteOSSearchSessionState(sessionFilePath);
  const artifactEntries =
    await readSiteOSSearchSessionArtifacts(sessionFilePath);

  return {
    candidateFiles: [
      sessionFilePath,
      ...artifactEntries.map((artifact) => artifact.fullFilePath),
    ],
    confirmationRequired: true,
    sessionFilePath,
    summary: {
      cleanupPrompt:
        "Temporary onboarding files are ready for cleanup, but deletion requires explicit confirmation.",
      scopeSummary:
        "Cleanup is limited to the current onboarding session JSON and the step-local artifacts derived from that same session.",
    },
    userFacingFiles: [
      path.basename(sessionFilePath),
      ...artifactEntries.map((artifact) =>
        path.basename(artifact.fullFilePath),
      ),
    ],
    userRequestedSourceFocus: state.context.userRequestedSourceFocus,
  };
}

export function resolveSiteOSSearchSessionStatePath({ projectRoot, startedAt }) {
  if (typeof projectRoot !== "string" || projectRoot.length === 0) {
    throw new Error("projectRoot is required.");
  }

  return path.join(
    projectRoot,
    ...SITEOS_SEARCH_TEMP_DIRECTORY,
    `session-${formatSiteOSSearchSessionTimestamp(startedAt)}.json`,
  );
}

async function writeSessionState(sessionFilePath, state) {
  await mkdir(path.dirname(sessionFilePath), { recursive: true });
  await writeFile(sessionFilePath, `${JSON.stringify(state, null, 2)}\n`);
}

export async function readSiteOSSearchSessionState(sessionFilePath) {
  const raw = await readFile(sessionFilePath, "utf8");
  return normalizeSiteOSSearchSessionState(JSON.parse(raw));
}

export async function setSiteOSSearchOnboardingSourceFocus(
  sessionFilePath,
  sourceFocus,
) {
  const normalizedSourceFocus = normalizeNullableString(sourceFocus);
  return updateSiteOSSearchSessionState(sessionFilePath, {
    context: {
      userRequestedSourceFocus: normalizedSourceFocus,
    },
  });
}

export async function setSiteOSSearchConnectionState(
  sessionFilePath,
  siteosConnection,
) {
  return updateSiteOSSearchSessionState(sessionFilePath, {
    context: {
      siteosConnection: normalizeSiteOSConnectionState(siteosConnection),
    },
  });
}

export async function setSiteOSSearchUiPlacementChoice(
  sessionFilePath,
  chosenUiPlacement,
) {
  const normalizedChoices = Array.isArray(chosenUiPlacement)
    ? chosenUiPlacement
        .map((choice) => normalizeNullableString(choice))
        .filter((choice) => choice !== null)
    : [];

  return updateSiteOSSearchSessionState(sessionFilePath, {
    userDecisions: {
      chosenUiPlacement: normalizedChoices,
    },
  });
}

async function markSiteOSSearchStepTiming(sessionFilePath, stepId, timingPatch) {
  const normalizedStepId = normalizeNullableString(stepId);
  if (!normalizedStepId) {
    throw new Error("stepId is required.");
  }

  return updateSiteOSSearchSessionState(sessionFilePath, (currentState) => {
    const matchedStep = currentState.steps.some(
      (step) => step.id === normalizedStepId,
    );

    if (!matchedStep) {
      throw new Error(`Unknown siteos-search onboarding step: ${stepId}`);
    }

    return {
      steps: currentState.steps.map((step) =>
        step.id === normalizedStepId
          ? {
              ...step,
              timing: normalizeStepTiming({
                ...step.timing,
                ...timingPatch,
              }),
            }
          : step,
      ),
    };
  });
}

export async function markSiteOSSearchStepStarted(
  sessionFilePath,
  stepId,
  startedAt,
) {
  return markSiteOSSearchStepTiming(sessionFilePath, stepId, {
    startedAt: normalizeStartedAt(startedAt),
  });
}

export async function markSiteOSSearchStepCompleted(
  sessionFilePath,
  stepId,
  completedAt,
) {
  return markSiteOSSearchStepTiming(sessionFilePath, stepId, {
    completedAt: normalizeStartedAt(completedAt),
  });
}

export async function readSiteOSSearchSessionArtifacts(sessionFilePath) {
  const state = await readSiteOSSearchSessionState(sessionFilePath);
  const artifactEntries = flattenStepArtifacts(state.steps);

  return artifactEntries.map((artifact) => ({
    description: artifact.description,
    fullFilePath: path.join(path.dirname(sessionFilePath), artifact.filename),
  }));
}

export async function ensureSiteOSSearchSessionState({
  context = {},
  mode,
  projectRoot,
  startedAt,
} = {}) {
  if (mode !== "onboarding") {
    return {
      created: false,
      sessionFilePath: null,
      state: null,
    };
  }

  const normalizedStartedAt = normalizeStartedAt(startedAt);
  const sessionFilePath = resolveSiteOSSearchSessionStatePath({
    projectRoot,
    startedAt: normalizedStartedAt,
  });

  try {
    const existingState = await readSiteOSSearchSessionState(sessionFilePath);
    return {
      created: false,
      sessionFilePath,
      state: existingState,
    };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    } else {
      throw error;
    }
  }

  const state = createSiteOSSearchOnboardingSessionState({
    context,
    projectRoot,
    startedAt: normalizedStartedAt,
  });
  await writeSessionState(sessionFilePath, state);

  return {
    created: true,
    sessionFilePath,
    state,
  };
}

export async function updateSiteOSSearchSessionState(
  sessionFilePath,
  updateOrMutator,
) {
  const current = await readSiteOSSearchSessionState(sessionFilePath);
  const patch =
    typeof updateOrMutator === "function"
      ? await updateOrMutator(current)
      : updateOrMutator;

  if (!isRecord(patch)) {
    throw new Error("Session state update must return an object patch.");
  }

  const next = normalizeSiteOSSearchSessionState(
    {
      ...current,
      ...patch,
      context: isRecord(patch.context)
        ? {
            ...current.context,
            ...patch.context,
          }
        : current.context,
      userDecisions: isRecord(patch.userDecisions)
        ? {
            ...current.userDecisions,
            ...patch.userDecisions,
          }
        : current.userDecisions,
      steps: patch.steps ?? current.steps,
      findings: patch.findings ?? current.findings,
      blockers: patch.blockers ?? current.blockers,
      artifacts: patch.artifacts ?? current.artifacts,
    },
    {
      projectRoot: current.context.projectRoot,
    },
  );

  await writeSessionState(sessionFilePath, next);

  return {
    sessionFilePath,
    state: next,
  };
}

export async function writeSiteOSSearchSessionArtifact({
  artifactSuffix,
  content,
  currentStepId = null,
  description,
  extension,
  sessionFilePath,
} = {}) {
  const state = await readSiteOSSearchSessionState(sessionFilePath);
  const activeStep =
    getSiteOSSearchOnboardingActiveStep(state) ??
    (state.steps.length > 0
      ? {
          ...state.steps[state.steps.length - 1],
          index: state.steps.length - 1,
        }
      : null);

  const targetStep =
    currentStepId === null
      ? activeStep
      : (state.steps.find((step) => step.id === currentStepId) ?? null);

  if (!targetStep) {
    throw new Error("No session step is available for artifact registration.");
  }

  const artifactFilePath = resolveSiteOSSearchSessionArtifactPath({
    artifactSuffix,
    extension,
    sessionFilePath,
  });
  const artifactFilename = path.basename(artifactFilePath);
  const artifactDescription = normalizeNullableString(description) ?? "";

  await writeFile(
    artifactFilePath,
    serializeSiteOSSearchSessionArtifact({
      content,
      extension,
    }),
  );

  const updated = await updateSiteOSSearchSessionState(sessionFilePath, {
    steps: state.steps.map((step) => {
      if (step.id !== targetStep.id) {
        return step;
      }

      const existingArtifacts = normalizeArtifactEntries(step.artifacts);
      const artifactIndex = existingArtifacts.findIndex(
        (artifact) => artifact.filename === artifactFilename,
      );

      if (artifactIndex >= 0) {
        const nextArtifacts = existingArtifacts.map((artifact, index) =>
          index === artifactIndex
            ? {
                description: artifactDescription,
                filename: artifactFilename,
              }
            : artifact,
        );

        return {
          ...step,
          artifacts: nextArtifacts,
        };
      }

      return {
        ...step,
        artifacts: [
          ...existingArtifacts,
          {
            description: artifactDescription,
            filename: artifactFilename,
          },
        ],
      };
    }),
  });

  return {
    artifact: {
      description: artifactDescription,
      filename: artifactFilename,
      fullFilePath: artifactFilePath,
      stepId: targetStep.id,
    },
    sessionFilePath,
    state: updated.state,
  };
}

export async function writeSiteOSSearchHostBaselineArtifact({
  currentStepId = "ui-delivery",
  hostBaseline = {},
  sessionFilePath,
} = {}) {
  return writeSiteOSSearchSessionArtifact({
    artifactSuffix: "host-baseline",
    content: createSiteOSSearchHostBaselineArtifact(hostBaseline),
    currentStepId,
    description: "Detected host baseline for adaptive runtime/UI delivery.",
    extension: "json",
    sessionFilePath,
  });
}

export async function writeSiteOSSearchDeliveryDecisionArtifact({
  currentStepId = "ui-delivery",
  decision = {},
  sessionFilePath,
} = {}) {
  return writeSiteOSSearchSessionArtifact({
    artifactSuffix: "delivery-decision-ladder",
    content: createSiteOSSearchDeliveryDecisionArtifact(decision),
    currentStepId,
    description:
      "Per-artifact delivery decisions derived from the host baseline.",
    extension: "json",
    sessionFilePath,
  });
}

export async function writeSiteOSSearchAdaptationBlockerReport({
  currentStepId = "ui-delivery",
  report = {},
  sessionFilePath,
} = {}) {
  return writeSiteOSSearchSessionArtifact({
    artifactSuffix: "adaptation-blocker-report",
    content: createSiteOSSearchAdaptationBlockerReport(report),
    currentStepId,
    description:
      "Current adaptation blocker report for host-compatible delivery.",
    extension: "json",
    sessionFilePath,
  });
}

export async function writeSiteOSSearchExtractionPathArtifact({
  currentStepId = "extraction-implementation",
  decision = {},
  sessionFilePath,
} = {}) {
  return writeSiteOSSearchSessionArtifact({
    artifactSuffix: "extraction-path-ladder",
    content: createSiteOSSearchExtractionPathArtifact(decision),
    currentStepId,
    description:
      "Per-source extraction path decisions derived from the host baseline.",
    extension: "json",
    sessionFilePath,
  });
}

export async function writeSiteOSSearchUiPlacementPlanArtifact({
  currentStepId = "source-confirmation",
  plan = {},
  sessionFilePath,
} = {}) {
  return writeSiteOSSearchSessionArtifact({
    artifactSuffix: "ui-placement-plan",
    content: createSiteOSSearchUiPlacementPlanArtifact(plan),
    currentStepId,
    description:
      "Search placement options to confirm together with source selections.",
    extension: "json",
    sessionFilePath,
  });
}

export async function deleteSiteOSSearchSessionArtifacts({
  confirmCleanup = false,
  sessionFilePath,
} = {}) {
  const cleanupPlan =
    await getSiteOSSearchSessionCleanupConfirmation(sessionFilePath);

  if (!confirmCleanup) {
    return {
      deletedFiles: [],
      deletedWithoutConfirmation: false,
      pendingConfirmation: true,
      sessionFilePath,
    };
  }

  for (const filePath of cleanupPlan.candidateFiles) {
    await rm(filePath, { force: true });
  }

  return {
    deletedFiles: cleanupPlan.candidateFiles,
    deletedWithoutConfirmation: false,
    pendingConfirmation: false,
    sessionFilePath,
  };
}
