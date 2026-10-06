# ADR-0030: Versioned prompts in the database

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-086

## Context

Chat, RAG, and voice FAQ system prompts lived in code. Changing them required deploys with no history. Interpret (VL-061) has no LLM system prompt today.

## Decision

1. **Keys:** `chat`, `rag`, `voice_faq` only. Code fallbacks remain in `chat-prompt.ts`, `prompt-defaults.ts` (RAG), `faq-prompt.ts`.
2. **Tables:** `prompts` (workspace + key, `active_version`) and `prompt_versions` (monotonic `version`, `body`).
3. **Runtime:** `PromptsService.resolve` loads the active body or the code fallback.
4. **API / console:** Clerk CRUD — create version (default activate), activate older version (rollback), restore fallback. Console `/prompts`.
5. **Out of scope:** marketplace, sharing across orgs, interpret key until interpret uses chat.

## Consequences

- Empty DB = previous behavior (code prompts).
- Prompt edits no longer require API redeploys for persona changes.
