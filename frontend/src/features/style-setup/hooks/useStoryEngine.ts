import { useState, useEffect } from 'react';
import { Project, StyleBible, Character, Environment } from '../../../types/story';
import { PRESET_PROJECTS } from '../data/presets';

const STORAGE_KEY = 'vizzy_story_projects_v2';
const ACTIVE_ID_KEY = 'vizzy_active_project_id_v2';

function normalizeProject(p: any): Project {
  const preset = PRESET_PROJECTS.find((pr) => pr.id === p.id);
  return {
    ...p,
    title: p.title || preset?.title || 'Untitled Story',
    story_notes: p.story_notes || preset?.story_notes || '',
    genre: p.genre || preset?.genre || 'Graphic Novel',
    historically_grounded: p.historically_grounded ?? preset?.historically_grounded ?? false,
    status: p.status || preset?.status || 'IN_PROGRESS',
    styleBible: p.styleBible || preset?.styleBible || {
      id: `sb-${p.id}`,
      projectId: p.id,
      art_style: 'Cinematic graphic novel',
      palette: ['#1C242C', '#39464E', '#66757F', '#B45309', '#F1ECE1'],
      lighting_default: 'High contrast chiaroscuro',
      aspect_ratio: '16:9',
      render_medium: 'Digital graphic novel inking',
      locked_style_prompt_prefix: 'Graphic novel illustration',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    characters: Array.isArray(p.characters) ? p.characters : preset?.characters || [],
    environments: Array.isArray(p.environments) ? p.environments : preset?.environments || [],
    pages: Array.isArray(p.pages) && p.pages.length > 0 ? p.pages : (preset?.pages || []),
    chatHistory: Array.isArray(p.chatHistory) && p.chatHistory.length > 0 ? p.chatHistory : (preset?.chatHistory || []),
    uploadedReferenceImage: p.uploadedReferenceImage || preset?.uploadedReferenceImage || null,
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
  };
}

export function useStoryEngine() {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      // Check v2 key first, then fallback to v1 migration
      let stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        stored = localStorage.getItem('vizzy_story_projects_v1');
      }
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeProject);
        }
      }
    } catch (e) {
      console.error('Failed to parse stored projects:', e);
    }
    return PRESET_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      const activeId = localStorage.getItem(ACTIVE_ID_KEY);
      if (activeId) return activeId;
    } catch (e) {
      // fallback
    }
    return PRESET_PROJECTS[0]?.id || '';
  });

  // Sync projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects to localStorage:', e);
    }
  }, [projects]);

  // Sync active project ID
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_ID_KEY, activeProjectId);
    } catch (e) {
      console.error('Failed to save active project ID:', e);
    }
  }, [activeProjectId]);

  const rawActive =
    projects.find((p) => p.id === activeProjectId) || projects[0] || PRESET_PROJECTS[0];
  const activeProject = normalizeProject(rawActive);

  const updateProject = (updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? { ...p, ...updates, updated_at: new Date().toISOString() }
          : p
      )
    );
  };

  const updateStyleBible = (updates: Partial<StyleBible>) => {
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
  };

  const addCharacter = (characterData: Omit<Character, 'id' | 'projectId' | 'created_at' | 'updated_at'>) => {
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
          ? {
              ...p,
              characters: [...p.characters, newChar],
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );
    return newChar;
  };

  const updateCharacter = (characterId: string, updates: Partial<Character>) => {
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
  };

  const deleteCharacter = (characterId: string) => {
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
  };

  const addEnvironment = (envData: Omit<Environment, 'id' | 'projectId' | 'created_at' | 'updated_at'>) => {
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
          ? {
              ...p,
              environments: [...p.environments, newEnv],
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );
    return newEnv;
  };

  const updateEnvironment = (envId: string, updates: Partial<Environment>) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? {
              ...p,
              environments: p.environments.map((e) =>
                e.id === envId
                  ? { ...e, ...updates, updated_at: new Date().toISOString() }
                  : e
              ),
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );
  };

  const deleteEnvironment = (envId: string) => {
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
  };

  const createNewProject = (title: string = 'Untitled Story') => {
    const newId = `proj-${Date.now()}`;
    const newProj: Project = {
      id: newId,
      title,
      story_notes: '',
      genre: 'Graphic Novel / Sequential Art',
      historically_grounded: false,
      status: 'SETUP',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      styleBible: {
        id: `sb-${newId}`,
        projectId: newId,
        art_style: 'Modern cinematic graphic novel, crisp brush inking, atmospheric lighting',
        palette: ['#1E293B', '#3B82F6', '#8B5CF6', '#F59E0B', '#F8FAFC'],
        lighting_default: 'Dramatic key light with deep contrasting shadow falloff',
        aspect_ratio: '16:9',
        render_medium: 'Digital graphic novel inking with textured gouache wash',
        locked_style_prompt_prefix: 'Masterpiece graphic novel illustration, cohesive narrative palette, clear expressive silhouettes',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      characters: [],
      environments: [],
      pages: [],
      chatHistory: [],
    };
    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newId);
  };

  const resetToPresets = () => {
    setProjects(PRESET_PROJECTS);
    setActiveProjectId(PRESET_PROJECTS[0].id);
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
  };
}
