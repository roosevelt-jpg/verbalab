# ADR-0089: Voice Analytics (distinct from Speech Analytics)

- Status: Accepted
- Date: 2026-10-03
- Phase: VL-178 (library “Phase 35 Voice Analytics” mapped)

## Context

Library Phase 35 asks for voice usage, languages, voices, customers, revenue, latency, quality, streaming, downloads, marketplace analytics, dashboard, reports, REST/GraphQL/SDK/monitoring/docs.

Lugemi already has Speech Analytics (VL-159) for STT/TTS speech-cloud surfaces and Language Analytics for MT. Regenerating Speech Analytics under a Voice Cloud label would confuse products. A Looker-grade BI product is out of scope for a small team.

## Decision

1. Ship **Voice Analytics** under `/v1/voice-analytics/*` + console `/voice-analytics`.  
2. Aggregate from **existing** `usage_events` (feature=tts), Voice Cloud **audit** prefixes, clone inventory, and Voice Marketplace sale/install tables — no new event bus.  
3. **Do not** regenerate or wrap Speech Analytics endpoints.  
4. Mark BI dashboard product and full HTTP p95 latency as **deferred/partial**.  
5. Revenue = recorded Voice Marketplace sales (publisher side), not Stripe invoices.

## Consequences

- Voice Cloud marks analytics `partial`.  
- Speech Analytics and Language Analytics unchanged.  
- Downstream Voice Cloud Production Audit (VL-179) can cite these aggregates as evidence.
