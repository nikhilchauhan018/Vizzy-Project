/**
 * Generation & Visual Engine API client.
 * Calls Django backend GenerationJob and Candidate endpoints.
 * Never calls AI providers directly from the browser.
 */

import { getAuthToken } from './authApi';
import { puterAuth } from './puterAuth';

export interface BackendCandidate {
  id: string;
  panel_version: string;
  option_index: number;
  image_url: string;
  seed?: number | null;
  created_at?: string;
}

export interface BackendGenerationJob {
  id: string;
  panel_version?: string;
  status: 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED_RETRYABLE' | 'FAILED_FINAL';
  current_step: string;
  error_message?: string;
  created_at: string;
  updated_at?: string;
  candidates: BackendCandidate[];
}

export interface EnqueueJobParams {
  panel_id?: string;
  panel_version_id?: string;
  instruction?: string;
  prompt_override?: string;
  num_candidates?: number;
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const puterToken = puterAuth.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (puterToken) {
    headers['X-Puter-Auth-Token'] = puterToken;
  }

  return headers;
}

export const generationApi = {
  /**
   * Enqueues an asynchronous GenerationJob with Celery backend.
   */
  async enqueueGeneration(params: EnqueueJobParams): Promise<{ job_id: string; status: string; panel_version_id?: string }> {
    const res = await fetch('/api/jobs/generate/', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      let errorMsg = 'Failed to enqueue image generation.';
      try {
        const data = await res.json();
        errorMsg = data.detail || errorMsg;
      } catch {
        // Fallback
      }
      throw new Error(errorMsg);
    }

    return res.json();
  },

  /**
   * Retrieves the current state and candidates of a GenerationJob.
   */
  async getJobDetail(jobId: string): Promise<BackendGenerationJob> {
    const res = await fetch(`/api/jobs/${jobId}/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch job status (${res.status})`);
    }

    return res.json();
  },

  /**
   * Polls a GenerationJob until it completes or enters a terminal failure state.
   */
  async pollJobUntilComplete(
    jobId: string,
    onProgress?: (job: BackendGenerationJob) => void,
    intervalMs: number = 1500,
    maxWaitMs: number = 90000
  ): Promise<BackendGenerationJob> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const job = await this.getJobDetail(jobId);
      if (onProgress) {
        onProgress(job);
      }

      if (job.status === 'DONE') {
        return job;
      }

      if (job.status === 'FAILED_FINAL') {
        throw new Error(job.error_message || 'Image generation failed on server. Please try again.');
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error('Image generation timed out. Please check active jobs.');
  },

  /**
   * Selects a candidate option for a panel.
   */
  async selectCandidate(candidateId: string): Promise<any> {
    const res = await fetch(`/api/pages/candidates/${candidateId}/select/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      let errorMsg = 'Failed to select candidate.';
      try {
        const data = await res.json();
        errorMsg = data.detail || errorMsg;
      } catch {
        // Fallback
      }
      throw new Error(errorMsg);
    }

    return res.json();
  },

  /**
   * Fetches pages for a project.
   */
  async listPages(projectId: string): Promise<any[]> {
    const res = await fetch(`/api/pages/pages/?project_id=${projectId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  },
};
