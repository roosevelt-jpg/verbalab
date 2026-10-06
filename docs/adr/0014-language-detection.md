# ADR-0014: Language detection (source=auto)

- Status: Accepted
- Date: 2026-09-06
- Phase: VL-054

## Context

Translate and chat UX need `source=auto`. TM/glossary require a concrete language pair, so detection must run before those steps.

## Decision

- Prefer Google Translate Detect (`/language/translate/v2/detect`) using `GOOGLE_TRANSLATE_API_KEY`.
- Fall back to `franc-min` (Latin-script oriented) when the key is missing or Google fails.
- `POST /v1/detect` returns `{ language, confidence, provider }`.
- `POST /v1/translate` accepts `source: "auto"`; resolves language first; response includes `detection` when auto was used.
- Detected language must be in the registry (`assertSupported`).
- Tests inject `GatewayService.setDetectProviderForTests`.

## Consequences

- Offline franc fallback is approximate — production should set the Google key.
- Unsupported / `und` detections surface as API errors rather than silent English defaults on the Google path.
