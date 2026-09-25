// Export API (Phase 3: Video / Slideshow / PDF)
export const exportApi = {
  triggerExport: async (projectId, exportType) => ({ jobId: 'export-job-1' }),
  getExportStatus: async (jobId) => ({ status: 'DONE' }),
};
