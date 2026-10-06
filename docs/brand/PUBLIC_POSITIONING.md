# Lugemi public positioning

Site: [https://lugemi.com](https://lugemi.com). Visible identity: **Lugemi**. Historical package name: VerbaLab (npm `@verbalab/*`, env vars, `X-VerbaLab-*` headers, health JSON `verbalab-web` stay as-is).

## Category

Lugemi is a **fully built Africa-first language intelligence platform** with a **first-party API** and **first-party models** — same category as ElevenLabs, not a reseller or wrapper of Google Translate, OpenAI, ElevenLabs, or other vendor APIs.

Product verbs: generate speech, transcribe, translate. Developer entry: Our API (`/v1`, keys `vl_live_` / `vl_test_`).

## Geography

- **Africa first — comprehensive:** Lugemi covers languages and dialects across **all African countries and ethnic communities**. Africa is not one culture; the product directory spans countries, languages, and ethnic varieties.
- **Also in scope:** Latin America, Southeast Asia, the Middle East, the EU, and other global markets.
- Distinguish the **Africa language catalog** (product scope / marketing & coverage directory) from **live API seed + eval pairs** (gateway registry and measured goldens). Do not use flags as language selectors.
- Avoid claiming perfect or human-indistinguishable quality. Comprehensive African language coverage **is** an allowed product claim.

## Tone

Capable, concrete, and user-friendly (ElevenLabs-like). Prefer clear CTAs, short explanations, and fewer jargon walls. Avoid inventing SOC2 badges, customer logos, or clinical/legal suitability claims.

## Historical code (not the public story)

Google, OpenAI, and ElevenLabs adapters under `apps/api/src/gateway/` are legacy/internal scaffolding. `OWN_TTS_URL` is the intended production speech path (`own:*`). Fixtures are not live GPU.
