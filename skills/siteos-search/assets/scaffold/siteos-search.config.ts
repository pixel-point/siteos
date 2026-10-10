const siteosSearchConfig = {
  schemaVersion: 1,
  // Set index: { id: "<exact-index-id>", envPrefix: "SITEOS_SEARCH" }.
  // Copy envPrefix from CLI installed metadata. Use SITEOS_SEARCH_BLOG for another search.
  // Existing index-only configs retain their legacy ID-derived names; no credential fallback.
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
