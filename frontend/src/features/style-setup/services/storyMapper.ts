import { Project, StyleBible, Character, Environment } from '../../../types/story';
import {
  BackendProject,
  BackendStyleBible,
  BackendCharacter,
  BackendEnvironment,
} from '../../../services/storiesApi';
import { PRESET_PROJECTS } from '../data/presets';

export function mapBackendStyleBible(sb: BackendStyleBible | null | undefined, projectId: string, fallbackDate?: string): StyleBible {
  return {
    id: sb?.id || `sb-${projectId}`,
    projectId,
    art_style: sb?.art_style || 'Cinematic graphic novel',
    palette: Array.isArray(sb?.palette) && sb.palette.length > 0
      ? sb.palette
      : ['#1C242C', '#39464E', '#66757F', '#B45309', '#F1ECE1'],
    lighting_default: sb?.lighting_default || 'High contrast chiaroscuro',
    aspect_ratio: (sb?.aspect_ratio as any) || '16:9',
    render_medium: sb?.render_medium || 'Digital graphic novel inking',
    locked_style_prompt_prefix: sb?.locked_style_prompt_prefix || 'Graphic novel illustration',
    created_at: sb?.created_at || fallbackDate || new Date().toISOString(),
    updated_at: sb?.updated_at || fallbackDate || new Date().toISOString(),
  };
}

export function mapBackendCharacter(c: BackendCharacter, projectId: string, fallbackDate?: string): Character {
  return {
    id: c.id,
    projectId,
    name: c.name,
    role: c.role || '',
    age: c.age || '',
    appearance: c.appearance || '',
    uniform: c.uniform || '',
    hair: c.hair || '',
    reference_image_url: c.reference_image_url || undefined,
    created_at: c.created_at || fallbackDate || new Date().toISOString(),
    updated_at: c.updated_at || fallbackDate || new Date().toISOString(),
  };
}

export function mapBackendEnvironment(e: BackendEnvironment, projectId: string, fallbackDate?: string): Environment {
  return {
    id: e.id,
    projectId,
    name: e.name,
    description: e.description || '',
    weather: e.weather || '',
    time_of_day: e.time_of_day || '',
    reference_image_url: e.reference_image_url || undefined,
    created_at: e.created_at || fallbackDate || new Date().toISOString(),
    updated_at: e.updated_at || fallbackDate || new Date().toISOString(),
  };
}

export function mapBackendToProject(
  bp: BackendProject,
  cachedExtras?: Partial<Project>
): Project {
  return {
    id: bp.id,
    title: bp.title || 'Untitled Story',
    story_notes: bp.story_notes || '',
    genre: (bp as any).genre || cachedExtras?.genre || 'Graphic Novel',
    historically_grounded: bp.historically_grounded ?? false,
    status: bp.status || 'IN_PROGRESS',
    styleBible: mapBackendStyleBible(bp.style_bible, bp.id, bp.created_at),
    characters: (bp.characters || []).map((c) => mapBackendCharacter(c, bp.id, bp.created_at)),
    environments: (bp.environments || []).map((e) => mapBackendEnvironment(e, bp.id, bp.created_at)),
    pages: cachedExtras?.pages || PRESET_PROJECTS[0]?.pages || [],
    chatHistory: cachedExtras?.chatHistory || PRESET_PROJECTS[0]?.chatHistory || [],
    uploadedReferenceImage: cachedExtras?.uploadedReferenceImage || null,
    created_at: bp.created_at,
    updated_at: bp.updated_at,
  };
}
