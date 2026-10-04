# VIZZY — Implementation & QA Checklist

## Before coding
Read `.agent.md`, architecture/schema/folder/provider docs, inspect current frontend, identify extra generated UI, identify existing design tokens, routes, state and API contracts.

## Folder structure
DO NOT CHANGE THE EXISTING FOLDER STRUCTURE. Use the existing `FOLDER_STRUCTURE.md` exactly. Do not reorganize or invent a new folder architecture.

## Frontend cleanup
Remove filler text, unnecessary headings, fake metrics, feature cards not required, unrelated navigation, unnecessary settings and decorative content.

## Core UI
Artwork dominant; chat primary; page navigation secondary; context tertiary; existing light theme and colors preserved.

## Persistence
Chat messages, project context, StyleBible, Character/Environment data, Scene JSON, versions, candidates, selected state and last active project/page/panel must persist.

## Generation
Generation must remain asynchronous. Provider calls remain backend-only. Failover/checkpointing must not lose user work. Candidate selection persists. Refinement creates a new version.

## Responsive
Verify 320px, 375px, 390px, 430px, tablet portrait/landscape, laptop, desktop and ultrawide. Check no horizontal overflow, keyboard-safe composer, usable touch targets and correct image aspect ratio.

## UI states
Verify empty project, upload, generating, candidates ready, selected, refining, approved, failed, retrying, returning user, long chat history and long page list.

## Final review
For every visible UI element ask: Which current requirement does this support? If unclear, remove it or flag it for review.
