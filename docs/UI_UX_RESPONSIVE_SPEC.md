# VIZZY — UI/UX Layout & Responsive Specification

## Important correction
The current frontend has extra generated content and feels crowded. Simplify it. Do not fill the page just because space is available. Every visible element must support the current Vizzy workflow.

## Initial creation screen
Focused screen containing the Vizzy identity, image/reference upload, story/instruction input, optional high-level information already supported, and one clear Create/Continue action. Do not add feature grids, marketing paragraphs, analytics or unnecessary settings.

## Desktop layout
Use the existing three-zone creative workspace: Left = story/page navigator; Center = dominant current artwork plus chat; Right = compact persistent context. The previously specified target was approximately 18% / 64% / 18%, but do not force rigid widths if that harms usability.

## Top bar
Keep it minimal: Vizzy, current project/story name and only essential actions that actually exist, such as Share/Export when applicable. Do not add fake notifications, analytics or unnecessary menus.

## Left page navigator
Use visual page thumbnails. Show page number, thumbnail and concise scene title/status when useful. Support long stories with internal scrolling. Do not turn this into generic navigation.

## Center artwork
The current artwork is the primary visual element. Preserve aspect ratio. Avoid unnecessary decorative containers, giant cards and excessive labels. Give the artwork breathing room without manufacturing UI around it.

## Chat
Chat is the primary interaction mechanism. It should feel like part of the creative workspace, not a generic customer-support chat. Show useful user messages, Vizzy responses, candidate results and refinement/generation states. Keep AI messages concise unless detail is actually useful.

## Generation candidates
Display multiple large, comparable candidates with clear Select actions. After selection, make the selected result prominent and keep refinement in chat. Preserve previous versions.

## Right context
Keep compact: story, visual style, characters, references, current scene and status. Do not turn it into a large settings form.

## Mobile
Use a single focused column. Current artwork remains dominant. Story navigator becomes a drawer/bottom sheet/compact filmstrip. Context becomes a drawer/bottom sheet/collapsible area. Keep chat composer accessible and keyboard-safe. No horizontal page scrolling.

## Tablet
Use a flexible two-zone layout when needed. Keep artwork dominant and collapse secondary panels.

## Wide desktop
Use sensible max widths. Do not stretch artwork unnaturally. Use extra space as whitespace instead of adding more content.

## Visual quality
The interface should look simple, intentional, professional and balanced. It must not look like an admin dashboard, marketing page, crowded template or AI-generated UI.

## Theme
Keep the existing light theme and existing color system. Do not add a new palette or dark theme.

## Remove
Remove unnecessary headings, long explanatory paragraphs, duplicate descriptions, feature cards, artificial metrics, decorative sections and unrelated controls if they are present in the current implementation.
