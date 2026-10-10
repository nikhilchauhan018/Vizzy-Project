"""
Scene Extraction Service for Vizzy.
Converts user's creative instructions into structured Scene JSON via LLM.
Validates the Scene JSON schema and maps character/environment references.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional

from apps.providers.instances import get_llm_router
from apps.providers.exceptions import ProviderError

logger = logging.getLogger(__name__)

SCENE_SCHEMA_FIELDS = {
    'camera',
    'action',
    'mood',
    'lighting_override',
    'character_ids',
    'environment_id',
    'extra_details',
}


def clean_json_response(raw_text: str) -> Optional[Dict[str, Any]]:
    """Extracts and parses JSON from raw LLM output, handling markdown fences and surrounding text."""
    if not raw_text or not raw_text.strip():
        return None

    text = raw_text.strip()

    # If wrapped in markdown code blocks: ```json ... ``` or ``` ... ```
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if match:
        text = match.group(1).strip()

    # Try direct parse
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    # Try finding the first '{' and last '}'
    first_brace = text.find('{')
    last_brace = text.rfind('}')
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        try:
            parsed = json.loads(text[first_brace : last_brace + 1])
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass

    return None


def validate_and_normalize_scene_json(
    raw_dict: Dict[str, Any],
    valid_character_ids: Optional[List[str]] = None,
    valid_environment_ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Validates and normalizes Scene JSON according to the locked schema.
    """
    valid_char_set = set(valid_character_ids or [])
    valid_env_set = set(valid_environment_ids or [])

    camera = str(raw_dict.get('camera') or raw_dict.get('camera_framing') or 'Medium shot').strip()
    action = str(raw_dict.get('action') or raw_dict.get('action_moment') or '').strip()
    mood = str(raw_dict.get('mood') or raw_dict.get('atmosphere') or '').strip()
    lighting = str(raw_dict.get('lighting_override') or raw_dict.get('lightingOverride') or '').strip()
    extra = str(raw_dict.get('extra_details') or raw_dict.get('extraDetails') or '').strip()

    # Validate character IDs
    raw_chars = raw_dict.get('character_ids') or raw_dict.get('characterIds') or []
    if not isinstance(raw_chars, list):
        raw_chars = [raw_chars] if raw_chars else []

    character_ids = []
    for cid in raw_chars:
        cid_str = str(cid).strip()
        if not valid_char_set or cid_str in valid_char_set:
            if cid_str and cid_str not in character_ids:
                character_ids.append(cid_str)

    # Validate environment ID
    raw_env = raw_dict.get('environment_id') or raw_dict.get('environmentId') or None
    env_id = str(raw_env).strip() if raw_env else None
    if env_id and valid_env_set and env_id not in valid_env_set:
        env_id = None

    return {
        'camera': camera,
        'action': action,
        'mood': mood,
        'lighting_override': lighting,
        'character_ids': character_ids,
        'environment_id': env_id,
        'extra_details': extra,
    }


def extract_scene_json(
    instruction: str,
    project: Any = None,
    user_auth_token: Optional[str] = None,
    fallback_scene: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Converts a creative user instruction into structured Scene JSON.
    Never outputs image generation prompt — strictly outputs Scene JSON.
    """
    if not instruction or not instruction.strip():
        return fallback_scene or {
            'camera': 'Medium shot',
            'action': 'Characters in scene',
            'mood': '',
            'lighting_override': '',
            'character_ids': [],
            'environment_id': None,
            'extra_details': '',
        }

    # Gather available project context
    characters = list(project.characters.all()) if project and hasattr(project, 'characters') else []
    environments = list(project.environments.all()) if project and hasattr(project, 'environments') else []

    valid_char_ids = [str(c.id) for c in characters]
    valid_env_ids = [str(e.id) for e in environments]

    char_info = [{'id': str(c.id), 'name': c.name, 'role': getattr(c, 'role', '')} for c in characters]
    env_info = [{'id': str(e.id), 'name': e.name, 'weather': getattr(e, 'weather', '')} for e in environments]

    system_prompt = (
        "You are the Vizzy Scene Extraction Engine for graphic novels.\n"
        "Your sole task is to convert the user's creative panel description into structured Scene JSON.\n"
        "You MUST output a single valid JSON object and nothing else. No explanation, no commentary, no markdown.\n\n"
        "Scene JSON Schema:\n"
        "{\n"
        '  "camera": "string (e.g., Wide shot, Close-up, Low angle, Over the shoulder, Cinematic wide)",\n'
        '  "action": "string describing visual character action and key focal moment",\n'
        '  "mood": "string (e.g., Tense, Melancholy, Heroic, Mysterious)",\n'
        '  "lighting_override": "string or empty (e.g., Harsh neon backlight, Golden hour)",\n'
        '  "character_ids": ["uuid-of-character"],\n'
        '  "environment_id": "uuid-of-environment or null",\n'
        '  "extra_details": "string describing specific visual props, atmospheric effects"\n'
        "}\n\n"
        f"Available Characters: {json.dumps(char_info)}\n"
        f"Available Environments: {json.dumps(env_info)}\n"
    )

    prompt = f"User instruction for this panel: {instruction.strip()}"

    try:
        router = get_llm_router()
        result = router.execute_text(
            prompt=prompt,
            system_prompt=system_prompt,
            user_auth_token=user_auth_token,
        )
        raw_text = result.get('text', '')
        parsed = clean_json_response(raw_text)
        if parsed:
            return validate_and_normalize_scene_json(
                parsed,
                valid_character_ids=valid_char_ids,
                valid_environment_ids=valid_env_ids,
            )
    except (ProviderError, Exception) as exc:
        logger.warning(f"Scene extraction via LLM failed ({exc}). Falling back to rule-based parser.")

    # Rule-based fallback if LLM is unavailable
    matched_chars = []
    instr_lower = instruction.lower()
    for c in characters:
        if c.name.lower() in instr_lower:
            matched_chars.append(str(c.id))

    matched_env = None
    for e in environments:
        if e.name.lower() in instr_lower:
            matched_env = str(e.id)
            break

    # Infer camera
    camera = 'Medium shot'
    if 'close up' in instr_lower or 'closeup' in instr_lower or 'face' in instr_lower:
        camera = 'Close-up'
    elif 'wide' in instr_lower or 'establishing' in instr_lower or 'landscape' in instr_lower:
        camera = 'Wide shot'
    elif 'low angle' in instr_lower:
        camera = 'Low angle'
    elif 'overhead' in instr_lower or 'aerial' in instr_lower or 'bird' in instr_lower:
        camera = 'Overhead shot'

    return {
        'camera': camera,
        'action': instruction.strip(),
        'mood': '',
        'lighting_override': '',
        'character_ids': matched_chars,
        'environment_id': matched_env,
        'extra_details': '',
    }
