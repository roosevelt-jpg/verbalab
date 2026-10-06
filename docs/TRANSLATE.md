# VerbaLab Translate

**Status:** Accepted (VL-022–053 + VL-140 / Phase 8)  
**ADR:** [0061-translation-engine-phase-8.md](./adr/0061-translation-engine-phase-8.md)

---

## Honest scope

| Library ask | VerbaLab |
| --- | --- |
| Realtime / batch / streaming | Shipped |
| JSON / YAML | Shipped (`/v1/localize`) |
| HTML / Markdown / XML / CSV / SRT | Shipped (`/v1/translate/formats`) |
| DOCX / PDF | Partial (document jobs) |
| Chat MT | Partial (`/v1/translate/chat`) |
| Slack | Partial (slash connector) |
| Website / email / WhatsApp / Teams / SMS / PPTX / XLSX | **Deferred** |

---

## Core APIs

| Method | Path |
| --- | --- |
| GET | `/v1/translate/engine` |
| POST | `/v1/translate` |
| POST | `/v1/translate/stream` (SSE) |
| POST | `/v1/translate/formats` |
| POST | `/v1/translate/chat` |
| POST | `/v1/localize` |
| POST | `/v1/documents/translate` |
| POST | `/v1/jobs` (`batch_translate`) |
| GraphQL | `mutation translate` / `translateFormat` |

Engines: glossary `/v1/glossary`, TM `/v1/tm`, quality `/v1/reviews`, metrics `/v1/metrics/translate`, analytics `/v1/analytics/overview`.

---

## SDK / CLI

```ts
await vl.translate({ text, source, target });
await vl.translateFormat({ format: 'html', content, source, target });
for await (const ev of vl.translateStream({ text, source, target })) { … }
```

```bash
verbalab translate --text "Hello" --target sw
verbalab translate-format --format srt --file demo.srt --target sw --source en
verbalab translate-engine
```

---

## Consoles

`/translate`, `/translate/formats`, `/documents`, `/localize`, `/glossary`, `/tm`, `/reviews`
