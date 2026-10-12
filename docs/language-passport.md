# Language Passport

**Your language. Your meaning. Wherever you use Lugemi.**

Production owner-private language-context memory: approved terminology, local unit definitions, pronunciation aliases, preferred names, and listening/synthesis preferences. Not an identity document, nationality credential, voice biometric, or silent fine-tuning feed.

## Surfaces

| Surface | Path |
| --- | --- |
| Studio console | `/language-passport` |
| API | `/v1/passport/*` |
| Catalog / model sync | `GET /v1/passport/catalog`, `GET /v1/passport/model-sync` |

## Synced models / adapters

| Adapter | Consumes | Existing Lugemi path |
| --- | --- | --- |
| TerminologyProvider | terminology / translations / preferred names | Glossary protect/restore on `POST /v1/translate` |
| PronunciationProvider | pronunciation aliases | Voice Studio lexemes |
| AsrVocabularyProvider | term / name / pronunciation forms | `SpeechVocabularyTerm` soft priming |
| UnitClarifier | local_unit_definition | DealBridge / Everyday clarification |
| VarietyPreference | preferred varieties | Accent Identity catalog |
| VoicePreference | preferred voices | OWN TTS registry (`own:*`) |

Unsupported varieties or voices are rejected explicitly — a profile cannot invent model capability.

## Safety invariants

- Unsaved / unapproved corrections never resolve.
- Context-specific rules (e.g. rice bag) do not apply to flour or unknown business scope.
- Current task overrides win for that request; saving a revised entry is separate.
- Conflicting approved values return `clarification_required`.
- Caller ID cannot retrieve a private Passport.
- Share grants are selected-entry, purpose/product scoped, expiring, and revocable.
- Import is untrusted: no foreign grants, pending until owner approval.
- Training consent is separate from storage, application, and sharing (default off).

## Ops

- Migration: `20261012080000_language_passport`
- Feature flag key: `languagePassport`
- Test actor header (API keys): `X-Language-Passport-Actor-Id`
- Rollback: disable resolver consumers via pausing personalization; CRUD/export remain available.
