const siteosSearchConfig = {
  schemaVersion: 1,
  project: {
    apiBaseUrlEnv: "SITEOS_API_BASE_URL",
  },
  environment: {
    slug: "prod",
  },
  sync: {
    mode: "full-replace",
    entrypoint: "scripts/siteos-search/sync.mjs",
  },
  sources: [
    {
      id: "example-source",
      label: "Example source",
      enabled: false,
      handler: "scripts/siteos-search/sources/example-source.mjs",
      result: {
        type: "url",
        description:
          "Replace with the confirmed result reference strategy for this source.",
      },
      compatibility: {
        notes:
          "Disabled placeholder. Replace during source handler generation after source confirmation.",
      },
    },
  ],
} as const;

export default siteosSearchConfig;
