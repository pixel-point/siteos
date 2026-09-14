const siteosSearchConfig = {
  schemaVersion: 1,
  // For a named index, set index: { id: "<exact-index-id>" }.
  // CLI-installed credential names are derived from that ID; no default fallback.
  project: {},
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
