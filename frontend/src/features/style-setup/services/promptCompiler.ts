import { StyleBible, Character, Environment } from '../../../types/story';

export interface SceneParams {
  characterIds?: string[];
  environmentId?: string;
  camera?: string;
  lightingOverride?: string;
  action?: string;
  mood?: string;
  extraDetails?: string;
}

/**
 * Deterministic Prompt Compiler
 * Combines StyleBible + Character bibles + Environment bible + Scene parameters
 * into a structured, reproducible image generation prompt.
 */
export function compilePrompt(
  styleBible: StyleBible,
  characters: Character[],
  environments: Environment[],
  scene: SceneParams
): string {
  const parts: string[] = [];

  // 1. Locked Style Prefix & Medium
  if (styleBible.locked_style_prompt_prefix) {
    parts.push(styleBible.locked_style_prompt_prefix.trim());
  }
  if (styleBible.art_style) {
    parts.push(`Art Style: ${styleBible.art_style.trim()}`);
  }
  if (styleBible.render_medium) {
    parts.push(`Render Medium: ${styleBible.render_medium.trim()}`);
  }

  // 2. Color Palette & Lighting
  if (styleBible.palette && styleBible.palette.length > 0) {
    parts.push(`Color Palette: ${styleBible.palette.join(', ')}`);
  }
  const lighting = scene.lightingOverride || styleBible.lighting_default;
  if (lighting) {
    parts.push(`Lighting: ${lighting.trim()}`);
  }

  // 3. Camera Framing & Composition
  if (scene.camera) {
    parts.push(`Camera Framing: ${scene.camera.trim()}`);
  }

  // 4. Environment Setting
  if (scene.environmentId) {
    const env = environments.find((e) => e.id === scene.environmentId);
    if (env) {
      const envDetails = [
        `Location: ${env.name}`,
        env.description,
        env.weather ? `Weather: ${env.weather}` : '',
        env.time_of_day ? `Time of day: ${env.time_of_day}` : '',
      ]
        .filter(Boolean)
        .join('. ');
      parts.push(`Setting: [${envDetails}]`);
    }
  }

  // 5. Featured Characters (Strict Visual Consistency)
  if (scene.characterIds && scene.characterIds.length > 0) {
    const featuredChars = characters.filter((c) => scene.characterIds?.includes(c.id));
    if (featuredChars.length > 0) {
      const charDescriptions = featuredChars.map((c) => {
        const specs = [
          `${c.name} (${c.role || 'Character'}, ${c.age || 'Adult'})`,
          c.appearance ? `Appearance: ${c.appearance}` : '',
          c.uniform ? `Attire/Uniform: ${c.uniform}` : '',
          c.hair ? `Hair/Facial: ${c.hair}` : '',
        ]
          .filter(Boolean)
          .join(', ');
        return `[${specs}]`;
      });
      parts.push(`Subject(s): ${charDescriptions.join('; ')}`);
    }
  }

  // 6. Action & Mood
  if (scene.action) {
    parts.push(`Action/Moment: ${scene.action.trim()}`);
  }
  if (scene.mood) {
    parts.push(`Atmosphere/Mood: ${scene.mood.trim()}`);
  }
  if (scene.extraDetails) {
    parts.push(`Additional Detail: ${scene.extraDetails.trim()}`);
  }

  // 7. Format constraints (clean graphic novel composition, no embedded speech bubbles)
  parts.push(
    `Quality & Constraints: Graphic novel illustration masterwork, high detail, balanced composition for panel layout. Avoid rendering baked speech bubble text or captions directly inside artwork.`
  );

  return parts.join('\n\n');
}
