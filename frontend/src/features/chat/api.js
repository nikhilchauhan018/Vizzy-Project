// ============================================================================
// MOCK ONLY — DELETE when Django endpoint exists. Do not add real logic here. See .agent.md task 9.
// ============================================================================

export const chatApi = {
  sendMessage: async (_prompt) => {
    // Pure mock fixture data for client UI testing
    return {
      status: 'queued',
      messageId: 'mock-msg-fixture',
    };
  },
};

