# Grammar Intelligence

**Status:** Accepted (VL-133, VL-134 + VL-142 / Phase 10)  
**ADR:** [0063-grammar-intelligence-phase-10.md](./adr/0063-grammar-intelligence-phase-10.md)

---

## Honest scope

Rules + optional LLM grammar/spell/style assist. **Not** Grammarly parity or certified medical/legal/government writing products.

| Ask | Status |
| --- | --- |
| Grammar / spell / sentence correction | Shipped |
| Writing + style suggestions | Shipped |
| Professional / academic | Shipped |
| Medical / legal / government | Partial (tone profiles + disclaimers) |

---

## APIs

| Method | Path |
| --- | --- |
| GET | `/v1/grammar/intelligence` |
| GET | `/v1/grammar/analytics` |
| POST | `/v1/grammar/check`, `/spell`, `/correct`, `/suggest` |
| GET/POST | `/v1/style/profiles`, `/v1/style/rewrite` |
| GraphQL | `grammarIntelligence`, `suggestWriting`, `correctGrammar`, `checkGrammar`, `rewriteStyle` |

Consoles: `/grammar-intelligence`, `/grammar`, `/style`
