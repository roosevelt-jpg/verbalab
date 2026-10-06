# VerbaLab AI Gateway Cloud Foundation

**Status:** Accepted (VL-129)  
**Volume:** Closes **Volume 1 Part A** (strategy → blueprint → Engineering OS → Cloud/Identity/Developer/Enterprise foundations → AI Gateway).  
**Rule:** Thin gateway facade. Buy models. Do not build an Inference Cloud or OpenRouter clone.

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| OpenAI | Chat, Whisper STT, TTS, embeddings |
| Whisper | OpenAI Whisper STT |
| Claude / Gemini / DeepSeek / Qwen / Llama / Mistral / NeMo | **Deferred** — buy when contracted; not first-class adapters |
| OpenRouter | **Optional chat fallback** (`OPENROUTER_API_KEY`) — OpenAI-compatible |
| Custom Models | Fine-tune `phrase_map` / `http_endpoint` + own TTS URL |
| Model Routing | Feature adapters + finetune pair routes + TTS voice prefix |
| Fallback | Detect Google→franc; translate finetune→Google; chat OpenAI→OpenRouter |
| Caching | Finetune ready-pair memory only — **no** response cache layer |
| Cost / Latency optimization | Analytics estimates + timeouts/retries — **not** optimizer products |
| Streaming | **Deferred** (VL-122 speech depth / future chat SSE) |
| Health Monitoring | `/health` + gateway overview configured flags |

---

## APIs (VL-129)

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/v1/gateway/providers` | Public | Catalog + configured flags |
| GET | `/v1/gateway/overview` | Clerk | Hub aggregate + live model matrix |

Console: `/gateway`.

---

## Env (chat fallback)

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Primary chat / STT / TTS / embeddings |
| `OPENROUTER_API_KEY` | Optional chat fallback |
| `OPENROUTER_CHAT_MODEL` | Default `openai/gpt-4o-mini` |
| `OPENROUTER_BASE_URL` | Default `https://openrouter.ai/api/v1` |

---

## Explicit non-goals

- Multi-LLM mesh / geo inference routing  
- First-class Claude/Gemini/DeepSeek/Qwen/Llama/Mistral/NeMo adapters in this phase  
- Prompt/response caching product  
- Cost optimizer or universal streaming  

See ADR-0050.
