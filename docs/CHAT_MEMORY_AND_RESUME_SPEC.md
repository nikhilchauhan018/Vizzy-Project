# VIZZY — Chat History, Memory & Resume Specification

## Core principle
Vizzy owns persistent memory. The AI model is treated as stateless. Do not depend on a model remembering yesterday's conversation.

## Persist chat
Persist meaningful conversation messages with project association and, when applicable, page/panel association, sender, content, timestamp, attachments/reference IDs and generation/job association where useful.

## Project memory
Keep structured project memory separate from raw chat history: StyleBible, Character records, Environment records, references, story notes, continuity information and Scene JSON.

## AI context assembly
For a new AI request, assemble relevant context: product instructions + project story context + StyleBible + relevant Character/Environment records + current Page + current Panel + current Scene JSON + selected/parent version + relevant recent chat + current user instruction. Do not blindly send the entire historical chat every time.

## Why this matters
This reduces token usage, latency and context noise while keeping the important project information available.

## Resume
When the user returns: authenticate → load project → load story context → load chat history → load pages/panels → load selected version → restore last active page/panel when available.

## Example
Day 1: user creates Page 1, selects a candidate, refines it and leaves. Day 2: the same project opens with Page 1, selected version and relevant conversation restored. If Page 2 was the last active page, open Page 2.

## Last active state
Persist last active project/page/panel as application state. This is not AI memory.

## Model switching
Model A may generate Page 1 and Model B may generate Page 2. Continuity must remain because Vizzy supplies the persisted structured context.

## Version history
Never overwrite a refinement. Create a new PanelVersion linked to its parent so the user can revisit previous work.

## Performance
Long chat histories should be paginated or virtualized. Load recent history first and fetch older messages when required. Do not render thousands of messages at once.

## UI rule
Do not expose internal prompts, provider details or database concepts to the user. Keep the visible conversation clean and focused.
