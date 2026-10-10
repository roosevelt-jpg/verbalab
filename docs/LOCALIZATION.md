# Enterprise Localization Platform

**Status:** Accepted (VL-053, VL-102 + VL-141 / Phase 9)  
**ADR:** [0062-localization-platform-phase-9.md](./adr/0062-localization-platform-phase-9.md)

---

## Honest scope

Software-string localization (JSON/YAML + ICU + locale packs). **Not** a website/game/mobile TMS.

| Ask | Status |
| --- | --- |
| Software strings | Shipped |
| Pluralization / gender (ICU) | Shipped / partial |
| Currency / date / timezone | Shipped (Intl) |
| RTL layout metadata | Shipped |
| Localization QA | Shipped (string checks) |
| Websites / mobile / desktop / games | Deferred |

---

## APIs

| Method | Path |
| --- | --- |
| GET | `/v1/localization` |
| POST | `/v1/localize`, `/v1/localize/file` |
| POST | `/v1/localize/catalog` |
| POST | `/v1/localize/qa` |
| POST | `/v1/icu/validate`, `/v1/icu/format` |
| GET | `/v1/locales`, `/v1/locales/:code`, `/layout`, `/examples` |
| POST | `/v1/locales/format` |
| GraphQL | `localize`, `validateIcu`, `formatIcu`, `localizationPlatform` |

---

## Consoles

`/localization`, `/localize`, `/locales`

Production: ships with the API (Fly / optional EKS). No separate L10n deploy unit.
