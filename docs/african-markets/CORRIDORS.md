# Regional market language corridors

Shared catalog for Everyday, LearnBack, and Relay across **Africa**, **LATAM**, **Southeast Asia**, and the **Middle East**.

## Source of truth

- `apps/api/src/african-markets/african-markets.ts` — Africa codes + shared corridor builders (`allProductMarkets()`)
- `apps/api/src/world-markets/` — LATAM / SEA / Middle East codes, English accents, cultural varieties
- `apps/api/src/african-markets/african-english-accents.ts` — African country English
- Country packs: `apps/api/src/country-packs/country-pack-seeds.ts`
- Regional language registry: `apps/api/src/regional-language-registry/region-catalogs.ts`
- Accent identity: `apps/api/src/accents/accent-identity-seeds.ts` + `CULTURAL_ENGLISH_BCP47_DEFAULTS`

## Regions

| Region | Codes | Notes |
| --- | --- | --- |
| Africa | `AFRICAN_MARKET_CODES` | Ghana pattern + major African economies |
| LATAM | `LATAM_MARKET_CODES` | Mexico, Brazil, Southern Cone, Andes, Central America, Caribbean |
| SEA | `SEA_MARKET_CODES` | Philippines, Indonesia, Thailand, Vietnam, Malaysia, Singapore, … |
| Middle East | `MENA_MARKET_CODES` | Gulf, Levant, Iraq, Iran, Türkiye, Israel/Palestine (North Africa stays in Africa) |

## Country-identifying English

English is the universal bridge; each market keeps its own variety (`en-GH`, `en-NG`, `en-PH`, `en-MX`, `en-AE`, …). Corridor labels and `markets[].englishAccent` surface the variety. TTS/STT prefer `CULTURAL_ENGLISH_BCP47_DEFAULTS`.

## Languages, dialects, and culture

Each market exposes `culturalVarieties[]` with:

- Country language variety names (Mexican Spanish, Rioplatense, Brazilian Portuguese, Gulf Arabic, Filipino/Tagalog, Cebuano, Quechua, Guarani, …)
- Dialect lists and spoken accent labels
- Optional accent-identity pack ids and lifestyle / cultural notes

Corridor labels use these varieties (e.g. `Mexican Spanish ↔ Mexican English`) instead of generic `Spanish ↔ English`.

## Products

| Product | Builder | Notes |
| --- | --- | --- |
| Relay | `buildRelayCorridors()` | Local ↔ country English (+ FR/PT/AR/ES/… bridges). Market-currency quotes. Demo interpreters. |
| Everyday | `buildEverydayCorridors()` | Same markets; private document pipeline. |
| LearnBack | `buildLearnBackCorridors()` + scenario seeds | Country English and local dialects are not marked wrong for non-prestige accent alone. |

Historical Ghana ids (`ak-en-business`, `en-ak`, `ak-en-interview`, …) are preserved.

## Honesty

- Demo interpreters are labeled `demo_staffed` — not a hired continent-wide pool.
- Instant / 24×7 coverage is not claimed.
- Adapter failures and missing localization stay explicit.
- Medical/legal/emergency Relay domains remain disabled.
- Country English and local dialect varieties identify the market; they are not US/UK or generic es/ar/pt substitutes.
