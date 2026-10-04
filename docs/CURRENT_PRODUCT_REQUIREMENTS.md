# VIZZY — Current Product Requirements

## Product
Vizzy is an AI-powered collaborative visual storytelling workspace for graphic novels, visual books, comics and storyboards.

## Initial input
The user can provide an image/reference image and/or story instructions. They may describe the desired visual style/aesthetic and high-level story requirements.

## Clarification
Vizzy should ask useful questions when important information is genuinely missing. Do not create unnecessary questionnaires or force advanced settings.

## Page-by-page workflow
For each page/scene: user gives an instruction; Vizzy interprets it; backend produces structured Scene JSON; the backend combines Scene JSON with StyleBible, Character Bible and Environment Bible; image generation produces multiple candidates; user selects one; user refines through chat; refinement creates a new version; user approves; user continues to the next page/scene.

## Page vs image
A Page is a layout container. It may contain one panel, multiple panels, or a storyboard frame. A Panel is the visual shot. Do not treat one generated image as the entire product page model.

## Composition text
Speech bubbles, captions and narration are composition-layer elements. They remain editable and should not be baked into generated artwork.

## Persistent project
Persist project, story notes, style, characters, environments, references, pages, panels, Scene JSON, versions, candidates, selected/approved versions, generation history and chat history.

## Resume behavior
When the user returns later, restore the project, conversation, story context, pages/panels, selected artwork and last active page/panel when available.

## Model independence
The project must remain coherent if different AI models are used on different days or different pages. Vizzy's stored context is the source of continuity.

## Final output
Completed pages form a sequence that can be reviewed, previewed as a slideshow and exported using the export capabilities already defined by the project.

## Out of scope
Do not add analytics, social feeds, marketplaces, unrelated AI utilities, generic dashboards, unnecessary settings or extra navigation unless an existing project requirement explicitly requires them.
