# Enterprise Language Registry

**Status:** Accepted (VL-139 / Phase 7)  
**Extends:** VL-020 language seed, VL-102 locales, VL-131–135 Language Cloud catalogs

---

## Honest scope

| Library ask | Lugemi reality |
| --- | --- |
| Every language / dialect / script / … | **Every registered** entity in the curated enterprise catalog |
| Morphology / phonetics / grammar engines | **Rule catalog** only (metadata) — not runtime linguistics engines |
| Ethnologue / full CLDR | **Out of scope** |

---

## Database

| Table | Purpose |
| --- | --- |
| `languages` | BCP-47 / ISO codes + script + family + tier (expanded vendor + African) |
| `language_families` | Family nodes |
| `writing_systems` | ISO 15924 scripts / alphabets / writing systems |
| `linguistic_rules` | pronunciation \| grammar \| phonetic \| morphology |
| `dialects` / `accents` / `locale_packs` / `country_packs` | Existing Language Cloud catalogs |

---

## REST

| Method | Path |
| --- | --- |
| GET | `/v1/registry` |
| GET | `/v1/registry/families`, `/families/:code` |
| GET | `/v1/registry/scripts`, `/writing-systems`, `/alphabets` |
| GET | `/v1/registry/rules?kind=&language=` |
| POST | `/v1/registry/validate` |
| GET | `/v1/registry/analytics` |
| GET | `/v1/registry/health` |
| GET | `/v1/languages`, `/v1/languages/:code` |

Plus existing dialects, accents, locales, country-packs.

---

## Surfaces

- **SDK:** `@lugemi/sdk` — `registry()`, `languageFamilies()`, `writingSystems()`, `linguisticRules()`, `validateRegistry()`, …
- **Admin dashboard:** `/registry`
- **Docs:** this file + ADR-0060
- **Production:** ships with API DB migrations + boot seed; Fly / EKS unchanged (`infra/DEPLOY.md`, `infra/AWS_EKS.md`)

---

## Monitoring

`GET /v1/registry/health` checks language→script and language→family integrity.
