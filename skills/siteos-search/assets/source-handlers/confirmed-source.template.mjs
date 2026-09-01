// Generated from a user-confirmed siteos-search source proposal.
// Fill project-specific extraction in a later source-extraction slice.

export const sourceHandler = {
  id: "__SOURCE_ID__",
  label: "__SOURCE_LABEL__",
  result: {
    type: "__RESULT_TYPE__",
    description: "__RESULT_DESCRIPTION__",
  },
  envRequirements: [],
  async collectDocuments() {
    throw new Error(
      "SiteOS search source handler is not implemented yet. Add project-specific extraction before running live sync.",
    );
  },
};

export default sourceHandler;
