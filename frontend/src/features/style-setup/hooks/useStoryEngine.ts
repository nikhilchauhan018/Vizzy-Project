import { useState, useEffect, useCallback, useRef } from 'react';
import { Project, StyleBible, Character, Environment, ChatMessageItem } from '../../../types/story';
import { PRESET_PROJECTS } from '../data/presets';
import { storiesApi } from '../../../services/storiesApi';
import {
  mapBackendToProject,
  mapBackendStyleBible,
  mapBackendCharacter,
  mapBackendEnvironment,
  mapBackendChatMessage,
} from '../services/storyMapper';

// ONLY store non-authoritative UI session pointer (active project ID) in localStorage
const ACTIVE_ID_KEY = 'vizzy_ui_active_project_id';

export function useStoryEngine() {
  const [projects, setProjects] = useState<Project[]>(PRESET_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      return localStorage.getItem(ACTIVE_ID_KEY) || PRESET_PROJECTS[0]?.id || '';
    } catch {
      return PRESET_PROJECTS[0]?.id || '';
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // In-memory UI cache for transient page/panel states
  const uiExtrasCache = useRef<Record<string, Partial<Project>>>({});

  // Sync active project ID to localStorage UI session pointer only
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_ID_KEY, activeProjectId);
    } catch {
      // Ignore localStorage write failure in restrictive environments
    }
  }, [activeProjectId]);

  // Load authoritative projects and their persisted chat messages from Django backend
  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const backendProjects = await storiesApi.listProjects();
      if (Array.isArray(backendProjects) && backendProjects.length > 0) {
        const hydrated = await Promise.all(
          backendProjects.map(async (bp) => {
            try {
              const [fullBp, messages] = await Promise.all([
                storiesApi.getProject(bp.id),
                storiesApi.getProjectMessages(bp.id).catch(() => []),
              ]);
              const projectObj = mapBackendToProject(fullBp, uiExtrasCache.current[bp.id]);
              if (Array.isArray(messages) && messages.length > 0) {
                projectObj.chatHistory = messages.map(mapBackendChatMessage);
              }
              return projectObj;
            } catch {
              return mapBackendToProject(bp, uiExtrasCache.current[bp.id]);
            }
          })
        );

        setProjects(hydrated);

        const storedActiveId = localStorage.getItem(ACTIVE_ID_KEY);
        const match = hydrated.find((p) => p.id === storedActiveId);
        if (match) {
          setActiveProjectId(match.id);
        } else if (hydrated.length > 0) {
          setActiveProjectId(hydrated[0].id);
        }
      } else {
        // Seed default initial project into Django backend if database is empty for this user
        try {
          const seeded = await storiesApi.createProject({
            title: PRESET_PROJECTS[0].title,
            story_notes: PRESET_PROJECTS[0].story_notes,
            historically_grounded: PRESET_PROJECTS[0].historically_grounded,
            status: 'IN_PROGRESS',
          });

          if (PRESET_PROJECTS[0].styleBible) {
            await storiesApi.createOrUpdateStyleBible(seeded.id, {
              art_style: PRESET_PROJECTS[0].styleBible.art_style,
              palette: PRESET_PROJECTS[0].styleBible.palette,
              lighting_default: PRESET_PROJECTS[0].styleBible.lighting_default,
              aspect_ratio: PRESET_PROJECTS[0].styleBible.aspect_ratio,
              render_medium: PRESET_PROJECTS[0].styleBible.render_medium,
              locked_style_prompt_prefix: PRESET_PROJECTS[0].styleBible.locked_style_prompt_prefix,
            });
          }

          for (const char of PRESET_PROJECTS[0].characters) {
            await storiesApi.createCharacter(seeded.id, {
              name: char.name,
              role: char.role,
              age: char.age,
              appearance: char.appearance,
              uniform: char.uniform,
              hair: char.hair,
              reference_image_url: char.reference_image_url,
            });
          }

          for (const env of PRESET_PROJECTS[0].environments) {
            await storiesApi.createEnvironment(seeded.id, {
              name: env.name,
              description: env.description,
              weather: env.weather,
              time_of_day: env.time_of_day,
              reference_image_url: env.reference_image_url,
            });
          }

          const fullSeeded = await storiesApi.getProject(seeded.id);
          const mappedSeeded = mapBackendToProject(fullSeeded, {
            pages: PRESET_PROJECTS[0].pages,
            chatHistory: PRESET_PROJECTS[0].chatHistory,
          });
          setProjects([mappedSeeded]);
          setActiveProjectId(mappedSeeded.id);
        } catch (seedErr) {
          console.warn('Could not seed initial backend project:', seedErr);
        }
      }
    } catch (err: any) {
      console.warn('Backend unavailable, using client state:', err.message);
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Fetch persisted messages when active project changes
  const fetchActiveProjectMessages = useCallback(async (projectId: string) => {
    if (!projectId || projectId.startsWith('preset-')) return;
    try {
      const messages = await storiesApi.getProjectMessages(projectId);
      if (Array.isArray(messages)) {
        const mapped = messages.map(mapBackendChatMessage);
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, chatHistory: mapped } : p))
        );
      }
    } catch (err: any) {
      console.warn('Failed to load project messages:', err);
    }
  }, []);

  useEffect(() => {
    if (activeProjectId && !activeProjectId.startsWith('preset-')) {
      fetchActiveProjectMessages(activeProjectId);
    }
  }, [activeProjectId, fetchActiveProjectMessages]);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0] || PRESET_PROJECTS[0];

  // 1. Send / Persist Chat Message (Authoritative server persistence with rollback)
  const sendChatMessage = async (
    text: string,
    options?: {
      pageId?: string | null;
      sender?: 'user' | 'vizzy' | 'system';
      messageType?: string;
      payload?: Record<string, any>;
    }
  ): Promise<ChatMessageItem> => {
    if (!text || !text.trim()) {
      throw new Error('Message content cannot be empty.');
    }

    const sender = options?.sender || 'user';
    const pageId = options?.pageId || null;
    const messageType = options?.messageType || 'text';
    const payload = options?.payload || {};

    const previousProjects = projects;
    setApiError(null);

    // Optimistic UI representation
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessageItem = {
      id: tempId,
      sender,
      text,
      timestamp: new Date().toISOString(),
      pageId: pageId || '',
      type: (messageType as any) || 'text',
      candidates: payload.candidates,
      refinedImageUrl: payload.refinedImageUrl,
      actionPrompt: payload.actionPrompt,
    };

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? {
              ...p,
              chatHistory: [...(p.chatHistory || []), optimisticMsg],
            }
          : p
      )
    );

    if (!activeProject.id.startsWith('preset-')) {
      try {
        const confirmed = await storiesApi.createProjectMessage(activeProject.id, {
          sender,
          content: text,
          page_id: pageId,
          message_type: messageType,
          payload,
        });

        const mapped = mapBackendChatMessage(confirmed);

        // Replace optimistic placeholder with server-confirmed message
        setProjects((prev) =>
          prev.map((p) =>
            p.id === activeProject.id
              ? {
                  ...p,
                  chatHistory: (p.chatHistory || []).map((m) =>
                    m.id === tempId ? mapped : m
                  ),
                }
              : p
          )
        );
        return mapped;
      } catch (err: any) {
        // Rollback state on failure so no stale or corrupt state remains
        setProjects(previousProjects);
        const msg = err.message || 'Failed to send message';
        setApiError(msg);
        throw err;
      }
    }

    return optimisticMsg;
  };

  // 2. Update Project (Authoritative server update with rollback on failure)
  const updateProject = async (updates: Partial<Project>) => {
    const previousProjects = projects;
    setApiError(null);

    uiExtrasCache.current[activeProject.id] = {
      ...(uiExtrasCache.current[activeProject.id] || {}),
      chatHistory: updates.chatHistory ?? activeProject.chatHistory,
      pages: updates.pages ?? activeProject.pages,
      genre: updates.genre ?? activeProject.genre,
      uploadedReferenceImage: updates.uploadedReferenceImage ?? activeProject.uploadedReferenceImage,
    };

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? { ...p, ...updates, updated_at: new Date().toISOString() }
          : p
      )
    );

    if (!activeProject.id.startsWith('preset-')) {
      try {
        const backendPayload: any = {};
        if (updates.title !== undefined) backendPayload.title = updates.title;
        if (updates.story_notes !== undefined) backendPayload.story_notes = updates.story_notes;
        if (updates.historically_grounded !== undefined)
          backendPayload.historically_grounded = updates.historically_grounded;
        if (updates.status !== undefined) backendPayload.status = updates.status;
        if (updates.genre !== undefined) backendPayload.genre = updates.genre;

        if (Object.keys(backendPayload).length > 0) {
          const confirmed = await storiesApi.updateProject(activeProject.id, backendPayload);
          setProjects((prev) =>
            prev.map((p) =>
              p.id === activeProject.id
                ? {
                    ...p,
                    title: confirmed.title,
                    story_notes: confirmed.story_notes || '',
                    historically_grounded: confirmed.historically_grounded ?? false,
                    status: confirmed.status,
                    genre: (confirmed as any).genre || p.genre,
                    updated_at: confirmed.updated_at,
                  }
                : p
            )
          );
        }
      } catch (err: any) {
        setProjects(previousProjects);
        const msg = err.message || 'Failed to update project';
        setApiError(msg);
        throw err;
      }
    }
  };

  // 3. Delete Project
  const deleteProject = async (projectId: string) => {
    const previousProjects = projects;
    const previousActiveId = activeProjectId;
    setApiError(null);

    const remaining = projects.filter((p) => p.id !== projectId);
    setProjects(remaining);

    if (activeProjectId === projectId) {
      setActiveProjectId(remaining[0]?.id || '');
    }

    if (!projectId.startsWith('preset-')) {
      try {
        await storiesApi.deleteProject(projectId);
      } catch (err: any) {
        setProjects(previousProjects);
        setActiveProjectId(previousActiveId);
        const msg = err.message || 'Failed to delete project';
        setApiError(msg);
        throw err;
      }
    }
  };

  // 4. Update StyleBible
  const updateStyleBible = async (updates: Partial<StyleBible>) => {
    const previousProjects = projects;
    setApiError(null);

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? {
              ...p,
              styleBible: {
                ...p.styleBible,
                ...updates,
                updated_at: new Date().toISOString(),
              },
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );

    if (!activeProject.id.startsWith('preset-')) {
      try {
        const confirmed = await storiesApi.createOrUpdateStyleBible(activeProject.id, {
          art_style: updates.art_style,
          palette: updates.palette,
          lighting_default: updates.lighting_default,
          aspect_ratio: updates.aspect_ratio,
          render_medium: updates.render_medium,
          locked_style_prompt_prefix: updates.locked_style_prompt_prefix,
        });

        setProjects((prev) =>
          prev.map((p) =>
            p.id === activeProject.id
              ? {
                  ...p,
                  styleBible: mapBackendStyleBible(confirmed, activeProject.id),
                  updated_at: confirmed.updated_at || new Date().toISOString(),
                }
              : p
          )
        );
      } catch (err: any) {
        setProjects(previousProjects);
        const msg = err.message || 'Failed to update StyleBible';
        setApiError(msg);
        throw err;
      }
    }
  };

  // 5. Character CRUD
  const addCharacter = async (
    characterData: Omit<Character, 'id' | 'projectId' | 'created_at' | 'updated_at'>
  ) => {
    setApiError(null);
    if (activeProject.id.startsWith('preset-')) {
      const newChar: Character = {
        ...characterData,
        id: `char-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        projectId: activeProject.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProject.id
            ? { ...p, characters: [...p.characters, newChar], updated_at: new Date().toISOString() }
            : p
        )
      );
      return newChar;
    }

    try {
      const backendChar = await storiesApi.createCharacter(activeProject.id, {
        name: characterData.name,
        role: characterData.role,
        age: characterData.age,
        appearance: characterData.appearance,
        uniform: characterData.uniform,
        hair: characterData.hair,
        reference_image_url: characterData.reference_image_url,
      });

      const confirmedChar = mapBackendCharacter(backendChar, activeProject.id);

      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProject.id
            ? { ...p, characters: [...p.characters, confirmedChar], updated_at: new Date().toISOString() }
            : p
        )
      );
      return confirmedChar;
    } catch (err: any) {
      const msg = err.message || 'Failed to create character';
      setApiError(msg);
      throw err;
    }
  };

  const updateCharacter = async (characterId: string, updates: Partial<Character>) => {
    const previousProjects = projects;
    setApiError(null);

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? {
              ...p,
              characters: p.characters.map((c) =>
                c.id === characterId
                  ? { ...c, ...updates, updated_at: new Date().toISOString() }
                  : c
              ),
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );

    if (!activeProject.id.startsWith('preset-')) {
      try {
        const confirmed = await storiesApi.updateCharacter(activeProject.id, characterId, {
          name: updates.name,
          role: updates.role,
          age: updates.age,
          appearance: updates.appearance,
          uniform: updates.uniform,
          hair: updates.hair,
          reference_image_url: updates.reference_image_url,
        });

        const mapped = mapBackendCharacter(confirmed, activeProject.id);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === activeProject.id
              ? {
                  ...p,
                  characters: p.characters.map((c) => (c.id === characterId ? mapped : c)),
                  updated_at: new Date().toISOString(),
                }
              : p
          )
        );
      } catch (err: any) {
        setProjects(previousProjects);
        const msg = err.message || 'Failed to update character';
        setApiError(msg);
        throw err;
      }
    }
  };

  const deleteCharacter = async (characterId: string) => {
    const previousProjects = projects;
    setApiError(null);

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? {
              ...p,
              characters: p.characters.filter((c) => c.id !== characterId),
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );

    if (!activeProject.id.startsWith('preset-')) {
      try {
        await storiesApi.deleteCharacter(activeProject.id, characterId);
      } catch (err: any) {
        setProjects(previousProjects);
        const msg = err.message || 'Failed to delete character';
        setApiError(msg);
        throw err;
      }
    }
  };

  // 6. Environment CRUD
  const addEnvironment = async (
    envData: Omit<Environment, 'id' | 'projectId' | 'created_at' | 'updated_at'>
  ) => {
    setApiError(null);
    if (activeProject.id.startsWith('preset-')) {
      const newEnv: Environment = {
        ...envData,
        id: `env-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        projectId: activeProject.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProject.id
            ? { ...p, environments: [...p.environments, newEnv], updated_at: new Date().toISOString() }
            : p
        )
      );
      return newEnv;
    }

    try {
      const backendEnv = await storiesApi.createEnvironment(activeProject.id, {
        name: envData.name,
        description: envData.description,
        weather: envData.weather,
        time_of_day: envData.time_of_day,
        reference_image_url: envData.reference_image_url,
      });

      const confirmedEnv = mapBackendEnvironment(backendEnv, activeProject.id);

      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProject.id
            ? { ...p, environments: [...p.environments, confirmedEnv], updated_at: new Date().toISOString() }
            : p
        )
      );
      return confirmedEnv;
    } catch (err: any) {
      const msg = err.message || 'Failed to create environment';
      setApiError(msg);
      throw err;
    }
  };

  const updateEnvironment = async (envId: string, updates: Partial<Environment>) => {
    const previousProjects = projects;
    setApiError(null);

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? {
              ...p,
              environments: p.environments.map((e) =>
                e.id === envId ? { ...e, ...updates, updated_at: new Date().toISOString() } : e
              ),
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );

    if (!activeProject.id.startsWith('preset-')) {
      try {
        const confirmed = await storiesApi.updateEnvironment(activeProject.id, envId, {
          name: updates.name,
          description: updates.description,
          weather: updates.weather,
          time_of_day: updates.time_of_day,
          reference_image_url: updates.reference_image_url,
        });

        const mapped = mapBackendEnvironment(confirmed, activeProject.id);
        setProjects((prev) =>
          prev.map((p) =>
            p.id === activeProject.id
              ? {
                  ...p,
                  environments: p.environments.map((e) => (e.id === envId ? mapped : e)),
                  updated_at: new Date().toISOString(),
                }
              : p
          )
        );
      } catch (err: any) {
        setProjects(previousProjects);
        const msg = err.message || 'Failed to update environment';
        setApiError(msg);
        throw err;
      }
    }
  };

  const deleteEnvironment = async (envId: string) => {
    const previousProjects = projects;
    setApiError(null);

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? {
              ...p,
              environments: p.environments.filter((e) => e.id !== envId),
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );

    if (!activeProject.id.startsWith('preset-')) {
      try {
        await storiesApi.deleteEnvironment(activeProject.id, envId);
      } catch (err: any) {
        setProjects(previousProjects);
        const msg = err.message || 'Failed to delete environment';
        setApiError(msg);
        throw err;
      }
    }
  };

  // 7. Create Project
  const createNewProject = async (title: string = 'Untitled Story') => {
    setApiError(null);
    try {
      const backendProject = await storiesApi.createProject({
        title,
        story_notes: '',
        historically_grounded: false,
        status: 'SETUP',
      });

      await storiesApi.createOrUpdateStyleBible(backendProject.id, {
        art_style: 'Modern cinematic graphic novel, crisp brush inking, atmospheric lighting',
        palette: ['#1E293B', '#3B82F6', '#8B5CF6', '#F59E0B', '#F8FAFC'],
        lighting_default: 'Dramatic key light with deep contrasting shadow falloff',
        aspect_ratio: '16:9',
        render_medium: 'Digital graphic novel inking with textured gouache wash',
        locked_style_prompt_prefix: 'Masterpiece graphic novel illustration, cohesive narrative palette, clear expressive silhouettes',
      });

      const fullBp = await storiesApi.getProject(backendProject.id);
      const newMapped = mapBackendToProject(fullBp);

      setProjects((prev) => [newMapped, ...prev]);
      setActiveProjectId(newMapped.id);
      return newMapped;
    } catch (err: any) {
      const msg = err.message || 'Failed to create project';
      setApiError(msg);
      throw err;
    }
  };

  const resetToPresets = () => {
    loadProjects();
  };

  return {
    projects,
    activeProject,
    activeProjectId,
    setActiveProjectId,
    sendChatMessage,
    fetchActiveProjectMessages,
    updateProject,
    deleteProject,
    updateStyleBible,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    addEnvironment,
    updateEnvironment,
    deleteEnvironment,
    createNewProject,
    resetToPresets,
    isLoading,
    apiError,
  };
}
