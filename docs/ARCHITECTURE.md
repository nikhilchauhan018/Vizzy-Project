# ARCHITECTURE.md — Vizzy System Design

## 0. The Three Engines
- **Story Engine**: Project, StyleBible, Character Bible, Environment Bible.
- **Visual Engine**: Turns structured Scene JSON into artwork via deterministic prompt builder & ProviderRouter.
- **Composition Engine**: Arranges panels on pages, speech bubble/caption overlays, sequence preview, and export assembly.

## 1. Managed Infrastructure
- **Database**: Neon (PostgreSQL)
- **Cache & Async Broker**: Upstash (Redis)
- **Media Storage**: Cloudinary

## 2. Stateless Processing
- Django + Celery async job queue.
- Checkpoints at each generation step.
