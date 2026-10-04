import { useState, useEffect, useCallback, useRef } from 'react';
import { Project, StyleBible, Character, Environment } from '../../../types/story';
import { PRESET_PROJECTS } from '../data/presets';
import {
  storiesApi,
  BackendProject,
} from '../../../services/storiesApi';

// ONLY store non-authoritative UI session pointers in localStorage
const ACTIVE_ID_KEY = 'vizzy_ui_active_project_id';

/**
 * Transforms backend Django model response into the frontend Project interface.
 * Preserves existing Page/Panel UI states until dedicated Page/Panel step.
 */
function mapBackendToProject(
  bp: BackendProject,
  cachedExtras?: Partial<Project>
): Project {
  const sb = bp.style_bible;
  const mappedStyleBible: StyleBible = {
    id: sb?.id || `sb-${bp.id}`,
    projectId: bp.id,
    art_style: sb?.art_style || 'Cinematic graphic novel',
    palette: Array.isArray(sb?.palette) && sb.palette.length > 0
      ? sb.palette
      : ['#1C242C', '#39464E', '#66757F', '#B45309', '#F1ECE1'],
    lighting_default: sb?.lighting_default || 'High contrast chiaroscuro',
    aspect_ratio: (sb?.aspect_ratio as any) || '16:9',
    render_medium: sb?.render_medium || 'Digital graphic novel inking',
    locked_style_prompt_prefix: sb?.locked_style_prompt_prefix || 'Graphic novel illustration',
    created_at: sb?.created_at || bp.created_at,
    updated_at: sb?.updated_at || bp.updated_at,
  };

  const mappedCharacters: Character[] = (bp.characters || []).map((c) => ({
    id: c.id,
    projectId: bp.id,
    name: c.name,
    role: c.role || '',
    age: c.age || '',
    appearance: c.appearance || '',
    uniform: c.uniform || '',
    hair: c.hair || '',
    reference_image_url: c.reference_image_url || undefined,
    created_at: c.created_at || bp.created_at,
    updated_at: c.updated_at || bp.updated_at,
  }));

  const mappedEnvironments: Environment[] = (bp.environments || []).map((e) => ({
    id: e.id,
    projectId: bp.id,
    name: e.name,
    description: e.description || '',
    weather: e.weather || '',
    time_of_day: e.time_of_day || '',
    reference_image_url: e.reference_image_url || undefined,
    created_at: e.created_at || bp.created_at,
    updated_at: e.updated_at || bp.updated_at,
  }));

  return {
    id: bp.id,
    title: bp.title || 'Untitled Story',
    story_notes: bp.story_notes || '',
    genre: cachedExtras?.genre || 'Graphic Novel',
    historically_grounded: bp.historically_grounded ?? false,
    status: bp.status || 'IN_PROGRESS',
    styleBible: mappedStyleBible,
    characters: mappedCharacters,
    environments: mappedEnvironments,
    pages: cachedExtras?.pages || PRESET_PROJECTS[0]?.pages || [],
    chatHistory: cachedExtras?.chatHistory || PRESET_PROJECTS[0]?.chatHistory || [],
    uploadedReferenceImage: cachedExtras?.uploadedReferenceImage || null,
    created_at: bp.created_at,
    updated_at: bp.updated_at,
  };
}

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

  // In-memory UI cache for transient page/panel and chat states during Step 3
  const uiExtrasCache = useRef<Record<string, Partial<Project>>>({});

  // Sync active project ID to localStorage UI session pointer only
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_ID_KEY, activeProjectId);
    } catch (e) {
      // Ignore localStorage write failure in restrictive environments
    }
  }, [activeProjectId]);

  // Load authoritative projects from Django backend
  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const backendProjects = await storiesApi.listProjects();
      if (Array.isArray(backendProjects) && backendProjects.length > 0) {
        const hydrated = await Promise.all(
          backendProjects.map(async (bp) => {
            try {
              const fullBp = await storiesApi.getProject(bp.id);
              return mapBackendToProject(fullBp, uiExtrasCache.current[bp.id]);
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
        // Seed default initial project into Django backend if database is empty
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

  const rawActive =
    projects.find((p) => p.id === activeProjectId) || projects[0] || PRESET_PROJECTS[0];

  const activeProject = rawActive;

  // 1. Update Project (Snapshot rollback on failure)
  const updateProject = async (updates: Partial<Project>) => {
    const previousProjects = projects;
    setApiError(null);

    // Cache transient UI extras in memory
    uiExtrasCache.current[activeProject.id] = {
      ...(uiExtrasCache.current[activeProject.id] || {}),
      chatHistory: updates.chatHistory ?? activeProject.chatHistory,
      pages: updates.pages ?? activeProject.pages,
      genre: updates.genre ?? activeProject.genre,
      uploadedReferenceImage: updates.uploadedReferenceImage ?? activeProject.uploadedReferenceImage,
    };

    // Optimistic UI update
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

        if (Object.keys(backendPayload).length > 0) {
          await storiesApi.updateProject(activeProject.id, backendPayload);
        }
      } catch (err: any) {
        // Immediate rollback to snapshot
        setProjects(previousProjects);
        const msg = err.message || 'Failed to update project';
        setApiError(msg);
        throw err;
      }
    }
  };

  // 2. Update StyleBible (Snapshot rollback on failure)
  const updateStyleBible = async (updates: Partial<StyleBible>) => {
    const previousProjects = projects;
    setApiError(null);

    // Optimistic UI update
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
        await storiesApi.createOrUpdateStyleBible(activeProject.id, {
          art_style: updates.art_style,
          palette: updates.palette,
          lighting_default: updates.lighting_default,
          aspect_ratio: updates.aspect_ratio,
          render_medium: updates.render_medium,
          locked_style_prompt_prefix: updates.locked_style_prompt_prefix,
        });
      } catch (err: any) {
        // Immediate rollback to snapshot
        setProjects(previousProjects);
        const msg = err.message || 'Failed to update StyleBible';
        setApiError(msg);
        throw err;
      }
    }
  };

  // 3. Character CRUD
  // 3a. Add Character (Server-confirmed: UI only appends after backend confirms)
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

      const confirmedChar: Character = {
        id: backendChar.id,
        projectId: activeProject.id,
        name: backendChar.name,
        role: backendChar.role || '',
        age: backendChar.age || '',
        appearance: backendChar.appearance || '',
        uniform: backendChar.uniform || '',
        hair: backendChar.hair || '',
        reference_image_url: backendChar.reference_image_url || undefined,
        created_at: backendChar.created_at || new Date().toISOString(),
        updated_at: backendChar.updated_at || new Date().toISOString(),
      };

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

  // 3b. Update Character (Snapshot rollback on failure)
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
        await storiesApi.updateCharacter(activeProject.id, characterId, {
          name: updates.name,
          role: updates.role,
          age: updates.age,
          appearance: updates.appearance,
          uniform: updates.uniform,
          hair: updates.hair,
          reference_image_url: updates.reference_image_url,
        });
      } catch (err: any) {
        setProjects(previousProjects);
        const msg = err.message || 'Failed to update character';
        setApiError(msg);
        throw err;
      }
    }
  };

  // 3c. Delete Character (Snapshot rollback on failure)
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

  // 4. Environment CRUD
  // 4a. Add Environment (Server-confirmed: UI only appends after backend confirms)
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

      const confirmedEnv: Environment = {
        id: backendEnv.id,
        projectId: activeProject.id,
        name: backendEnv.name,
        description: backendEnv.description || '',
        weather: backendEnv.weather || '',
        time_of_day: backendEnv.time_of_day || '',
        reference_image_url: backendEnv.reference_image_url || undefined,
        created_at: backendEnv.created_at || new Date().toISOString(),
        updated_at: backendEnv.updated_at || new Date().toISOString(),
      };

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

  // 4b. Update Environment (Snapshot rollback on failure)
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
        await storiesApi.updateEnvironment(activeProject.id, envId, {
          name: updates.name,
          description: updates.description,
          weather: updates.weather,
          time_of_day: updates.time_of_day,
          reference_image_url: updates.reference_image_url,
        });
      } catch (err: any) {
        setProjects(previousProjects);
        const msg = err.message || 'Failed to update environment';
        setApiError(msg);
        throw err;
      }
    }
  };

  // 4c. Delete Environment (Snapshot rollback on failure)
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

  // 5. Create Project (Server-confirmed: only active upon backend persistence)
  const createNewProject = async (title: string = 'Untitled Story') => {
    setApiError(null);
    try {
      const backendProject = await storiesApi.createProject({
        title,
        story_notes: '',
        historically_grounded: false,
        status: 'SETUP',
      });

      // Initialize StyleBible on backend
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
    updateProject,
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
