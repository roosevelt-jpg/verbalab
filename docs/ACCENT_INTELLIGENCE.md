# Lugemi Accent Intelligence

**Status:** Partial shipped (VL-153 / library Phase 19)  
**Rule:** Extends VL-132 cue-based accents. Do not regenerate dialects. Do not claim acoustic regional models.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Accent Intelligence / Engine | **VL-153** — `GET /v1/accents/engine` + `/accent-intelligence` |
| Accent Detection | **Shipped** — `POST /v1/accents/detect` (VL-132) |
| Accent Classification | **Shipped** — `POST /v1/accents/classify` (ranked + confidence band) |
| Accent Confidence | **Shipped** — detect/classify confidence fields |
| Dialect Detection | **Shipped (Language Cloud)** — `POST /v1/dialects/detect` (VL-131); linked, not reimplemented |
| Regional Accent Models | **Deferred** — acoustic / phonetics models |
| Accent Analytics | **Shipped** — `GET /v1/accents/analytics` |
| REST / SDK / Dashboard / Monitoring | Engine + classify + console + GraphQL `accentEngine` / `detectAccent` + shared observability |

---

## Honesty

Accent Intelligence is **not** an acoustic accent recognition lab. Cue scoring over curated spoken profiles only. See ADR-0053 and ADR-0072.
