// ============================================================================
// MOCK ONLY — DELETE when Django endpoint exists. Do not add real logic here. See .agent.md task 9.
// ============================================================================

export const panelReviewApi = {
  selectCandidate: async (_candidateId) => ({ selected: true, versionId: 'mock-version-fixture' }),
  requestRefinement: async (_versionId, _instructions) => ({ status: 'queued', jobId: 'mock-job-fixture' }),
};

