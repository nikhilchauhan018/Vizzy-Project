// ============================================================================
// MOCK ONLY — DELETE when Django endpoint exists. Do not add real logic here. See .agent.md task 9.
// ============================================================================

export const canvasEditorApi = {
  saveTextElements: async (_panelId, _elements) => ({ success: true, savedCount: 0 }),
};

