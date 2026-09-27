// ============================================================================
// MOCK ONLY — DELETE when Django endpoint exists. Do not add real logic here. See .agent.md task 9.
// ============================================================================

export const exportApi = {
  triggerExport: async (_projectId, _exportType) => ({ jobId: 'mock-export-job-fixture' }),
  getExportStatus: async (_jobId) => ({ status: 'DONE', downloadUrl: null }),
};

