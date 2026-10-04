# VIZZY — Puter + AI Gateway Direction

## Purpose
This document records the discussed Puter direction without replacing the existing Vizzy provider architecture or folder structure.

## Puter onboarding
Puter supports temporary-user creation through its authentication flow using `attempt_temp_user_creation`. The intended UX is that a Vizzy user should not be forced to manually visit Puter.com and create a separate account as part of normal onboarding.

## Important limitation
Do not assume that a temporary Puter identity automatically becomes a permanent Puter account with guaranteed state preservation. If permanent conversion is required, verify the current Puter lifecycle before implementing it.

## Identity
Vizzy remains the primary product identity. Never store a user's Puter password.

## User resources
Use supported user-scoped Puter resources without exposing one user's resources to another user.

## Vizzy remains source of truth
Puter is an infrastructure/integration layer. Vizzy must still persist its own users, projects, story context, chat history, pages, panels, versions and generation records.

## AI Gateway
Frontend should call Vizzy backend. Backend should handle provider routing. The architecture can route to Puter-backed models and other approved providers without exposing provider-specific logic to frontend components.

## Capability-aware routing
Provider selection should consider reference/image input support, image-to-image support, aspect ratio/resolution, quality, latency, provider health, current quota, user entitlement, cost and provider terms.

## Quota separation
Keep Vizzy's own Free/Pro entitlement separate from actual provider limits. Do not hard-code provider limits into frontend UI.

## Async generation
User request → validate entitlement → create GenerationJob → queue → AI Gateway → provider → save candidate → notify frontend. Do not block the browser during long image generation.

## Failover
Keep the existing provider abstraction, circuit breaker, retries and checkpoints. Provider failure must not destroy user work.

## Compliance
Do not use fake account farms, rate-limit evasion or quota abuse. Provider limits and terms can change, so keep provider configuration isolated.
