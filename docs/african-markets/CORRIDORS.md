# African market language corridors

Shared catalog for Everyday, LearnBack, and Relay.

## Source of truth

- `apps/api/src/african-markets/african-markets.ts` — `AFRICAN_MARKET_CODES`, bridges, timezones, quote rates
- `apps/api/src/african-markets/african-english-accents.ts` — country-identifying English accents (`en-GH`, `en-NG`, …)
- Country packs: `apps/api/src/country-packs/country-pack-seeds.ts`
- Language registry: `apps/api/src/languages/language-seeds.ts`
- Accent identity: `apps/api/src/accents/accent-identity-seeds.ts` + `CULTURAL_ENGLISH_BCP47_DEFAULTS`

## Priority markets

South Africa, Nigeria, Rwanda, Ethiopia, Kenya, Uganda, Zimbabwe, Zambia, Tanzania, Ghana, plus other large African economies (Egypt, Morocco, Senegal, Côte d’Ivoire, Cameroon, DRC, Angola, Mozambique, and the full `AFRICAN_MARKET_CODES` list).

## Country-identifying English

English is the universal bridge, but each market keeps its own English variety:

| Market | Label | BCP-47 | Accent identity |
| --- | --- | --- | --- |
| Ghana | Ghanaian English | `en-GH` | `gh-ghanaian-english` |
| Nigeria | Nigerian English | `en-NG` | `ng-nigerian-english` |
| South Africa | South African English | `en-ZA` | `za-south-african-english` |
| Kenya | Kenyan English | `en-KE` | `ke-english` |
| Other `AFRICAN_MARKET_CODES` | `{Demonym} English` | `en-{CC}` | generated pack + nearest Echo voice |

Corridor labels and catalog `markets[].englishAccent` surface the variety. TTS/STT routing prefers `CULTURAL_ENGLISH_BCP47_DEFAULTS` — never generic US/UK for African markets. Dedicated Echo voices exist for GH/NG/ZA/KE; other markets use the nearest African English voice until a dedicated weight is provisioned (`voiceProvisioning: nearest_african_english`).

## Products

| Product | Builder | Notes |
| --- | --- | --- |
| Relay | `buildRelayCorridors()` | Local ↔ country English (+ FR/PT/AR bridges). Market-currency pinned quotes. Demo interpreters per market. |
| Everyday | `buildEverydayCorridors()` | Same markets; private document pipeline with honest adapter status. |
| LearnBack | `buildLearnBackCorridors()` + generated scenario seeds | Interview/workplace practice packs per corridor; country English is not marked wrong for non-US/UK accent. |

Historical Ghana ids (`ak-en-business`, `en-ak`, `ak-en-interview`, …) are preserved.

## Honesty

- Demo interpreters are labeled `demo_staffed` — not a hired continent-wide pool.
- Instant / 24×7 coverage is not claimed.
- Adapter failures and missing localization stay explicit.
- Medical/legal/emergency Relay domains remain disabled.
- Country English accents identify the market; they are not US/UK substitutes.
