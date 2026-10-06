# VerbaLab Recommendation Engine

**Status:** Partial shipped (VL-187 / library Phase 54)  
**Rule:** Light rankers over languages, voices, knowledge/content, translation pairs, models, and workflow recipes. Do **not** build a retail recommender OS (CF, bandits, feature stores).

---

## Library term → VerbaLab

| Library ask | VerbaLab reality |
| --- | --- |
| Content / Knowledge Recommendation | **Shipped** — `kind=content\|knowledge` via Vector Cloud or filename rank |
| Language Recommendation | **Shipped** — registry + African tier + workspace defaults |
| Voice Recommendation | **Shipped** — Neural TTS + marketplace (Pro optional) |
| Translation Recommendation | **Shipped** — suggested language pairs |
| Model Recommendation | **Partial** — embedding catalog; chat model marketplace deferred |
| Workflow Recommendation | **Partial** — fixed API recipes |
| Enterprise Recommendation | **Deferred** |
| Engine / Dashboard | **VL-187** — `GET /v1/recommendation-engine/engine` + `/recommendation-engine` |
| GraphQL / SDK / CLI | `recommendationEngine`, `verbalab recommend` |

---

## Honesty

Not Amazon/Netflix-style personalization. See ADR-0098. Knowledge vector rank needs embeddings live.
