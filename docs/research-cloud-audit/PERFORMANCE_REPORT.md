# Research Cloud — Performance Report (VL-280)

| Check | Expectation | Notes |
| --- | --- | --- |
| Engine catalog GETs | < 1s in test env | In-process catalogs |
| GraphQL multi-engine query | < 5s | Audit gate |
| Open-science consent check | Sync in-process | No external registry |

No distributed training, public leaderboard fan-out, or USPTO/DOI network calls in this volume.
