# FOLDER_STRUCTURE.md — Repository Organization (LOCKED)

```
.
├── backend/
│   ├── config/              # Django settings, wsgi, asgi, urls, celery
│   ├── apps/
│   │   ├── core/            # Base utilities
│   │   ├── accounts/        # User model, auth
│   │   ├── stories/         # Project, StyleBible, Character, Environment
│   │   ├── pages/           # Page, Panel, PanelVersion, Candidate
│   │   ├── composition/     # TextElement (speech bubbles, captions)
│   │   ├── jobs/            # GenerationJob, JobCheckpoint, async pipeline
│   │   ├── billing/         # CreditBalance, CreditTransaction
│   │   ├── providers/       # AI provider routers, adapters, rate budgets
│   │   └── exports/         # Video/slideshow/PDF export assembly
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/             # Top-level App entry
│   │   ├── features/        # Modular domains
│   │   │   ├── style-setup/ # StyleBible & bible creation
│   │   │   ├── page-manager/# Story navigator & page thumbnails
│   │   │   ├── panel-review/# Dominant artwork, comparison, versions
│   │   │   ├── chat/        # Persistent chat panel & composer
│   │   │   ├── canvas-editor/# Speech bubbles & layout (Konva)
│   │   │   └── export/      # Export modal, player & sequence view
│   │   ├── shared/          # TopBar, drawers, common components
│   │   ├── types/           # Domain TypeScript definitions
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── docs/                    # System designs, architecture, specifications
├── .agent.md                # Project context, decisions log, tracker
└── docker-compose.yml
```
