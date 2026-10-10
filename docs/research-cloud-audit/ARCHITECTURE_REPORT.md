# Research Cloud — Architecture Report (VL-280)

## Style

Nest modular monolith with DDD-bounded Research Cloud hubs, CQRS application slices, and hexagonal ports/adapters (`hexagonalRewrite: false`).

## Hubs

| Hub | VL | Pattern |
| --- | --- | --- |
| research-cloud | VL-271 | Foundation catalog + routing + overview |
| experiment-platform | VL-272 | Runs/lineage seed |
| synthetic-data-platform | VL-273 | Modalities + labeled artifacts |
| benchmark-platform | VL-274 | Suites + leaderboard seed |
| evaluation-platform | VL-275 | Extends existing eval surfaces |
| ai-publication-platform | VL-276 | Versioned publication records |
| patent-innovation-platform | VL-277 | Disclosure/IP portfolio |
| open-science-platform | VL-278 | Consent-gated releases |
| research-analytics | VL-279 | Sibling catalog aggregation |

## Extends

Intelligence Cloud, Knowledge Cloud, Foundation Model Cloud, model-evaluation-platform / eval — without regenerating Volumes 1–12.
