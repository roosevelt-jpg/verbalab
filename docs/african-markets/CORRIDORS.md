# African market language corridors

Shared catalog for Everyday, LearnBack, and Relay.

## Source of truth

- `apps/api/src/african-markets/african-markets.ts` — `AFRICAN_MARKET_CODES`, bridges, timezones, quote rates
- Country packs: `apps/api/src/country-packs/country-pack-seeds.ts`
- Language registry: `apps/api/src/languages/language-seeds.ts`

## Priority markets

South Africa, Nigeria, Rwanda, Ethiopia, Kenya, Uganda, Zimbabwe, Zambia, Tanzania, Ghana, plus other large African economies (Egypt, Morocco, Senegal, Côte d’Ivoire, Cameroon, DRC, Angola, Mozambique, and the full `AFRICAN_MARKET_CODES` list).

## Products

| Product | Builder | Notes |
| --- | --- | --- |
| Relay | `buildRelayCorridors()` | Local ↔ English (+ FR/PT/AR bridges). Market-currency pinned quotes. Demo interpreters per market. |
| Everyday | `buildEverydayCorridors()` | Same markets; private document pipeline with honest adapter status. |
| LearnBack | `buildLearnBackCorridors()` + generated scenario seeds | Interview/workplace practice packs per corridor. |

Historical Ghana ids (`ak-en-business`, `en-ak`, `ak-en-interview`, …) are preserved.

## Honesty

- Demo interpreters are labeled `demo_staffed` — not a hired continent-wide pool.
- Instant / 24×7 coverage is not claimed.
- Adapter failures and missing localization stay explicit.
- Medical/legal/emergency Relay domains remain disabled.
