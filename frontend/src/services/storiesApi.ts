/**
 * Authoritative Backend Story Engine API Client
 * Connects frontend directly to Django REST Framework endpoints.
 * Automatically injects the active authenticated user's credentials.
 */

import { getAuthHeaders } from './authApi';

export interface BackendStyleBible {
  id?: string;
  project?: string;
  art_style: string;
  palette: string[];
  lighting_default: string;
  aspect_ratio: string;
  render_medium: string;
  locked_style_prompt_prefix: string;
  created_at?: string;
  updated_at?: string;
}

export interface BackendCharacter {
  id: string;
  project?: string;
  name: string;
  role?: string;
  age?: string;
  appearance: string;
  uniform: string;
  hair: string;
  reference_image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BackendEnvironment {
  id: string;
  project?: string;
  name: string;
  description: string;
  weather?: string;
  time_of_day?: string;
  reference_image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BackendChatMessage {
  id: string;
  project: string;
  page_id?: string | null;
  sender: 'user' | 'vizzy' | 'system';
  message_type: string;
  content: string;
  payload: Record<string, any>;
  created_at: string;
}

export interface BackendProject {
  id: string;
  owner?: string;
  title: string;
  story_notes?: string;
  historically_grounded?: boolean;
  status: 'SETUP' | 'IN_PROGRESS' | 'COMPLETE';
  style_bible?: BackendStyleBible | null;
  characters?: BackendCharacter[];
  environments?: BackendEnvironment[];
  characters_count?: number;
  environments_count?: number;
  created_at: string;
  updated_at: string;
}

const BASE_URL = (import.meta.env?.VITE_STORIES_API_BASE_URL as string) || '/api/stories';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `API request failed with status ${res.status}`;
    try {
      const err = await res.json();
      if (typeof err === 'object' && err !== null) {
        if (err.detail) {
          errorDetail = err.detail;
        } else {
          // Flatten field validation errors e.g. { title: ["This field is required."] }
          const messages = Object.entries(err)
            .map(([field, msg]) => `${field}: ${Array.isArray(msg) ? msg.join(', ') : msg}`)
            .join('; ');
          if (messages) errorDetail = messages;
        }
      }
    } catch {
      // Fallback to generic status error
    }
    throw new Error(errorDetail);
  }
  if (res.status === 204) {
    return {} as T;
  }
  return res.json();
}

export const storiesApi = {
  // Project endpoints
  async listProjects(): Promise<BackendProject[]> {
    const res = await fetch(`${BASE_URL}/projects/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<BackendProject[]>(res);
  },

  async getProject(projectId: string): Promise<BackendProject> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<BackendProject>(res);
  },

  async createProject(params: {
    title: string;
    story_notes?: string;
    historically_grounded?: boolean;
    status?: 'SETUP' | 'IN_PROGRESS' | 'COMPLETE';
  }): Promise<BackendProject> {
    const res = await fetch(`${BASE_URL}/projects/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    return handleResponse<BackendProject>(res);
  },

  async updateProject(
    projectId: string,
    updates: Partial<{
      title: string;
      story_notes: string;
      historically_grounded: boolean;
      status: 'SETUP' | 'IN_PROGRESS' | 'COMPLETE';
    }>
  ): Promise<BackendProject> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse<BackendProject>(res);
  },

  async deleteProject(projectId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(res);
  },

  // StyleBible endpoints
  async getStyleBible(projectId: string): Promise<BackendStyleBible> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/style-bible/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<BackendStyleBible>(res);
  },

  async createOrUpdateStyleBible(
    projectId: string,
    data: Partial<BackendStyleBible>
  ): Promise<BackendStyleBible> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/style-bible/`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<BackendStyleBible>(res);
  },

  async deleteStyleBible(projectId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/style-bible/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(res);
  },

  // Character endpoints
  async listCharacters(projectId: string): Promise<BackendCharacter[]> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/characters/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<BackendCharacter[]>(res);
  },

  async createCharacter(
    projectId: string,
    data: Omit<BackendCharacter, 'id' | 'project' | 'created_at' | 'updated_at'>
  ): Promise<BackendCharacter> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/characters/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<BackendCharacter>(res);
  },

  async updateCharacter(
    projectId: string,
    characterId: string,
    updates: Partial<BackendCharacter>
  ): Promise<BackendCharacter> {
    const res = await fetch(
      `${BASE_URL}/projects/${projectId}/characters/${characterId}/`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      }
    );
    return handleResponse<BackendCharacter>(res);
  },

  async deleteCharacter(projectId: string, characterId: string): Promise<void> {
    const res = await fetch(
      `${BASE_URL}/projects/${projectId}/characters/${characterId}/`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<void>(res);
  },

  // Environment endpoints
  async listEnvironments(projectId: string): Promise<BackendEnvironment[]> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/environments/`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<BackendEnvironment[]>(res);
  },

  async createEnvironment(
    projectId: string,
    data: Omit<BackendEnvironment, 'id' | 'project' | 'created_at' | 'updated_at'>
  ): Promise<BackendEnvironment> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/environments/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<BackendEnvironment>(res);
  },

  async updateEnvironment(
    projectId: string,
    envId: string,
    updates: Partial<BackendEnvironment>
  ): Promise<BackendEnvironment> {
    const res = await fetch(
      `${BASE_URL}/projects/${projectId}/environments/${envId}/`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      }
    );
    return handleResponse<BackendEnvironment>(res);
  },

  async deleteEnvironment(projectId: string, envId: string): Promise<void> {
    const res = await fetch(
      `${BASE_URL}/projects/${projectId}/environments/${envId}/`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<void>(res);
  },

  // Chat message endpoints
  async getProjectMessages(
    projectId: string,
    pageId?: string
  ): Promise<BackendChatMessage[]> {
    const url = pageId
      ? `${BASE_URL}/projects/${projectId}/messages/?page_id=${encodeURIComponent(pageId)}`
      : `${BASE_URL}/projects/${projectId}/messages/`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse<BackendChatMessage[]>(res);
  },

  async createProjectMessage(
    projectId: string,
    message: {
      sender: 'user' | 'vizzy' | 'system';
      content: string;
      page_id?: string | null;
      message_type?: string;
      payload?: Record<string, any>;
    }
  ): Promise<BackendChatMessage> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/messages/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(message),
    });
    return handleResponse<BackendChatMessage>(res);
  },
};
