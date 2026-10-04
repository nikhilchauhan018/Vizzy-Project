"""
Deterministic Prompt Compiler for Vizzy.

Combines StyleBible + Character bibles + Environment bible + Scene parameters
into a structured, reproducible image generation prompt.
Matches the documented frontend specification exactly.
Speech bubbles, dialogue, and canvas overlays are strictly excluded.
"""

from typing import Any, Dict, Iterable, Optional


def compile_prompt(
    style_bible: Any = None,
    characters: Optional[Iterable[Any]] = None,
    environments: Optional[Iterable[Any]] = None,
    scene_params: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Deterministic Prompt Builder.
    Merges scene_json + the three bibles into the final prompt text.
    """
    scene = scene_params or {}
    parts = []

    # 1. Locked Style Prefix & Medium
    if style_bible:
        prefix = getattr(style_bible, 'locked_style_prompt_prefix', '')
        if prefix and prefix.strip():
            parts.push = parts.append(prefix.strip())

        art_style = getattr(style_bible, 'art_style', '')
        if art_style and art_style.strip():
            parts.append(f"Art Style: {art_style.strip()}")

        medium = getattr(style_bible, 'render_medium', '')
        if medium and medium.strip():
            parts.append(f"Render Medium: {medium.strip()}")

        palette = getattr(style_bible, 'palette', None)
        if palette and isinstance(palette, list) and len(palette) > 0:
            parts.append(f"Color Palette: {', '.join(str(p) for p in palette)}")

        lighting = scene.get('lighting_override') or scene.get('lightingOverride') or getattr(style_bible, 'lighting_default', '')
        if lighting and str(lighting).strip():
            parts.append(f"Lighting: {str(lighting).strip()}")

    # 2. Camera Framing & Composition
    camera = scene.get('camera')
    if camera and str(camera).strip():
        parts.append(f"Camera Framing: {str(camera).strip()}")

    # 3. Environment Setting
    env_id = scene.get('environment_id') or scene.get('environmentId')
    if env_id and environments:
        matched_env = next((e for e in environments if str(getattr(e, 'id', '')) == str(env_id)), None)
        if matched_env:
            details = [
                f"Location: {getattr(matched_env, 'name', '')}",
                getattr(matched_env, 'description', ''),
                f"Weather: {getattr(matched_env, 'weather', '')}" if getattr(matched_env, 'weather', '') else '',
                f"Time of day: {getattr(matched_env, 'time_of_day', '')}" if getattr(matched_env, 'time_of_day', '') else '',
            ]
            env_str = '. '.join(d.strip() for d in details if d and str(d).strip())
            if env_str:
                parts.append(f"Setting: [{env_str}]")

    # 4. Featured Characters (Strict Visual Consistency)
    char_ids = scene.get('character_ids') or scene.get('characterIds') or []
    if char_ids and characters:
        char_id_strings = [str(cid) for cid in char_ids]
        matched_chars = [c for c in characters if str(getattr(c, 'id', '')) in char_id_strings]
        if matched_chars:
            char_descriptions = []
            for c in matched_chars:
                name = getattr(c, 'name', 'Character')
                role = getattr(c, 'role', 'Character') or 'Character'
                age = getattr(c, 'age', 'Adult') or 'Adult'
                specs = [f"{name} ({role}, {age})"]
                
                appearance = getattr(c, 'appearance', '')
                if appearance:
                    specs.append(f"Appearance: {appearance.strip()}")
                
                uniform = getattr(c, 'uniform', '')
                if uniform:
                    specs.append(f"Attire/Uniform: {uniform.strip()}")
                
                hair = getattr(c, 'hair', '')
                if hair:
                    specs.append(f"Hair/Facial: {hair.strip()}")

                char_descriptions.append(f"[{', '.join(specs)}]")

            parts.append(f"Subject(s): {'; '.join(char_descriptions)}")

    # 5. Action, Mood & Details
    action = scene.get('action')
    if action and str(action).strip():
        parts.append(f"Action/Moment: {str(action).strip()}")

    mood = scene.get('mood')
    if mood and str(mood).strip():
        parts.append(f"Atmosphere/Mood: {str(mood).strip()}")

    extra = scene.get('extra_details') or scene.get('extraDetails')
    if extra and str(extra).strip():
        parts.append(f"Additional Detail: {str(extra).strip()}")

    # 6. Graphic novel composition constraint (no baked speech bubbles/dialogue)
    parts.append(
        "Quality & Constraints: Graphic novel illustration masterwork, high detail, balanced composition for panel layout. Avoid rendering baked speech bubble text or captions directly inside artwork."
    )

    return "\n\n".join(parts)
