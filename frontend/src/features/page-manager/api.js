// ============================================================================
// MOCK ONLY — DELETE when Django endpoint exists. Do not add real logic here. See .agent.md task 9.
// ============================================================================

export const pageManagerApi = {
  getPages: async (_projectId) => [],
  createPage: async (_projectId, _layoutMode) => ({ id: 'mock-page-fixture' }),
};

