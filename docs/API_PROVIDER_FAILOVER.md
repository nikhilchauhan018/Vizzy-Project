# API_PROVIDER_FAILOVER.md — Provider Architecture & Fallback Chains

## Core Philosophy
1. Never block HTTP calls during image synthesis.
2. Failover mid-task across free-tier providers without losing progress.
3. Check Redis rate budgets before dispatching.

## LLM Chain (Scene Extraction & Story Prompting)
`Gemini` → `Groq` → `Cohere` → `Mistral` → `OpenRouter`

## Image Generation Chain
`Pollinations` → `Stable Horde` → `Hugging Face` (+ Puter gateway integrations)

## Circuit Breaker & Rate Budget
- Rate budgets tracked in Upstash Redis.
- Concurrency guard limits 2 active jobs per user.
- Failure triggers next provider in chain without restarting completed pipeline steps.
