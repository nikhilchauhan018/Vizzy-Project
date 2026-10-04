# DATABASE_SCHEMA.md — Core Data Model (v2, three-engine model)

## Entity overview

```
User ──< Project ──< StyleBible (1:1)
                 │
                 ├──< Character            (Story Engine — face/uniform consistency)
                 ├──< Environment          (Story Engine — location/weather consistency)
                 │
                 └──< Page ──< Panel ──< PanelVersion ──< GenerationJob ──< JobCheckpoint
                        │         │            │                                 │
                        │         │            └──> parent_version (self-FK)     └──> Candidate (image)
                        │         │
                        │         └──< TextElement (SpeechBubble / Caption / SFX) (Composition Engine layer)
                        │
                        └──< (layout_mode: single_panel / multi_panel / storyboard)
                 │
                 └──< Export                (Composition Engine — PDF/slideshow/video)

User ──< CreditBalance (1:1) ──< CreditTransaction
```

## Entity details

### 1. accounts.User (custom user model)
- Inherits Django AbstractUser, UUID PK.

### 2. stories.Project
- `id` (UUID PK), `owner` (FK User), `title`, `story_notes`, `genre`, `historically_grounded` (bool), `status` (SETUP / IN_PROGRESS / COMPLETE).

### 3. stories.StyleBible (1:1 Project)
- `id` (UUID PK), `project` (OneToOne), `art_style`, `palette` (JSON array of hex codes), `lighting_default`, `aspect_ratio`, `render_medium`, `locked_style_prompt_prefix`.

### 4. stories.Character (FK Project)
- `id` (UUID PK), `project` (FK), `name`, `role`, `age`, `appearance`, `uniform`, `hair`, `reference_image_url`, `avatar_color`.

### 5. stories.Environment (FK Project)
- `id` (UUID PK), `project` (FK), `name`, `description`, `weather`, `time_of_day`, `reference_image_url`.

### 6. pages.Page (FK Project)
- `id` (UUID PK), `project` (FK), `order` (int), `page_number` (string "01"), `title`, `layout_mode` (single_panel, multi_panel, storyboard), `status` (DRAFT, GENERATING, OPTIONS_READY, REFINING, APPROVED).

### 7. pages.Panel (FK Page)
- `id` (UUID PK), `page` (FK), `panel_index` (int), `scene_json` (JSON), `compiled_prompt` (text).

### 8. pages.PanelVersion (FK Panel)
- `id` (UUID PK), `panel` (FK), `parent_version` (self-FK), `version_number` (int), `prompt_used`, `image_url`.

### 9. pages.Candidate (FK PanelVersion)
- `id` (UUID PK), `panel_version` (FK), `option_index` (int), `image_url`, `seed`.

### 10. composition.TextElement (FK Panel)
- `id` (UUID PK), `panel` (FK Panel), `element_type` (SPEECH_BUBBLE, CAPTION, THOUGHT_BUBBLE, SFX, NARRATION), `text`, `x_percent`, `y_percent`, `width_percent`, `height_percent`, `tail_x_percent`, `tail_y_percent`, `font_size`.

### 11. jobs.GenerationJob (FK PanelVersion) & JobCheckpoint
- Tracks async provider execution, step-by-step resumption, and error logs.

### 12. exports.Export (FK Project)
- `id` (UUID PK), `project` (FK), `export_type` (PDF, SLIDESHOW, VIDEO), `status` (QUEUED, RENDERING, DONE, FAILED), `output_url`, `transition_style`.

### 13. billing.CreditBalance & CreditTransaction
- Credit ledger system protecting user usage and provider costs.
