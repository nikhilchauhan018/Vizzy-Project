// Panel Review & Refinement API (Phase 2)
export const panelReviewApi = {
  selectCandidate: async (candidateId) => ({ selected: true }),
  requestRefinement: async (versionId, instructions) => ({ status: 'queued' }),
};
