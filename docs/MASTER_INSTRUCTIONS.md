# VIZZY — Master Instructions for Google AI Studio

## Purpose
Use this document as the main instruction set while working on the existing Vizzy project. Read the existing repository documentation and current implementation before making changes. Do not replace the existing architecture with a shortcut or a fresh unrelated structure.

## Locked repository rule
DO NOT CHANGE THE EXISTING FOLDER STRUCTURE. Keep the repository structure exactly as documented in the existing `FOLDER_STRUCTURE.md`. Do not create a new architecture or reorganize existing folders just to make implementation easier.

## Product principle
Vizzy is an AI-assisted collaborative visual storytelling workspace for graphic novels, visual books, comics and storyboards. It is a creative workspace, not an admin dashboard.

## Workflow
User provides an image and/or story instructions → Vizzy understands the request → asks useful questions only when genuinely necessary → establishes story/style/character/environment context → works page/scene by page/scene through chat → generates visual candidates → user selects → refines through chat → approves → continues to the next page → completed pages form a sequence for preview/export.

## Persistent continuity
The AI model must not be treated as the application's memory. Vizzy must persist project state. A user may leave today and return tomorrow and must continue from the saved project, page, panel, selected version and relevant chat history. The model can change between sessions without breaking continuity.

## Frontend quality
The current frontend should be simplified where it contains unnecessary generated content. Do not fill empty space with artificial cards, long explanations, statistics or unrelated controls. Keep the UI simple, professional, light and focused.

## Theme
Use the existing project color system/design tokens. Do not create a new palette. Do not introduce a dark theme. Do not redesign the existing color system.

## Responsive quality
Mobile is a first-class experience. Support small phones, large phones, tablets, laptops, desktop and ultrawide displays. Do not simply shrink the desktop layout.

## Architecture rules
Keep provider integrations behind `backend/apps/providers/`. Keep the deterministic backend prompt compiler as the only place that merges Scene JSON + StyleBible + Character Bible + Environment Bible into the final image prompt. Do not duplicate this business logic in the frontend.

## Implementation method
Inspect first. Map every visible UI element to an actual requirement. Remove elements that have no current requirement. Reuse existing components/state/API contracts where appropriate. Implement real persistence and real loading/error/generation states. Do not claim mocked behavior is complete.

## Final standard
Do not try to impress by adding more UI. Make Vizzy simple, correct, responsive, persistent and smooth.
