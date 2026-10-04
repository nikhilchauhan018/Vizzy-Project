// ============================================================================
// MOCK ONLY — DELETE when Django endpoint exists. Do not add real logic here. See .agent.md task 9.
// ============================================================================
import { ExtractBiblesResponse } from '../../types/story';

export async function extractBiblesWithGemini(params: {
  storyNotes: string;
  title: string;
  genre: string;
  historicallyGrounded: boolean;
}): Promise<ExtractBiblesResponse> {
  const response = await fetch('/api/story/extract-bibles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with status ${response.status}`);
  }

  return response.json();
}

