# Lugemi Live: incremental interpretation with commitment and repair

Priority: second | Family: Echo + Translate + Voice; learned streaming policy

## Exact addition

Live interpretation and streaming already exist in the supplied scope. Add a language-pair-specific policy deciding when to wait, show provisional text, commit text and speak it. The differentiator is a quality/latency operating curve plus transparent repair of already spoken mistakes, not an unsupported sub-500ms end-to-end promise.

Example: a speaker starts “Send five...” then corrects to “fifty, tomorrow, not today.” The output cannot silently revise audio the listener already heard. It must pause when necessary and issue an explicit correction if commitment happened too early.

## Architecture

Use causal audio chunks and bounded history. Keep VAD boundaries distinct from semantic completion. Existing ASR emits partial hypotheses with monotonically increasing revisions; translation generates provisional segments. A learned read/write policy estimates sufficient context. A separate commit policy uses entity stability, polarity, reordering risk and Fidelity's decision.

States: `receiving -> provisional -> committed -> spoken`; `repair_required` is reachable after commitment, and `cancelled` before playback. Once audio is played it is immutable. A repair references the earlier segment and creates new audible content. Stop buffered playback on interruption; preserve what has already been heard. Guarantee exactly-once commitment within a session using event IDs and acknowledgements, not exactly-once network delivery.

Start with an inspectable streaming cascade. Research direct speech-to-speech only as a later controlled comparison. Source S5 establishes that expressive streaming translation already has substantial prior work; novelty and superiority need evidence.

## Data and training

Collect paired timed conversations with false starts, self-corrections, late negations, overlap, names and language switching. Translators annotate multiple valid commit points, target paraphrases and repair utterances. Start with 500 reviewed conversations per corridor; expand after policy learning curves. Split by speaker/session and retain full timing.

First tune heuristic wait policies and compare wait-k baselines. Then learn read/write and commit decisions from annotated trajectories or simulated replay. Optimize a weighted objective for fidelity, delay, unnecessary pauses and repair burden. Do not reward a policy merely for predicting future words. Offline policy gains must survive causal streaming tests without lookahead. Reinforcement learning is optional after supervised imitation works.

## Proposed protocol

`POST /v1/live/sessions` negotiates PCM sample rate, channel count, languages, glossary and permissions. A WebSocket carries audio and versioned events:

```json
{
  "event_id": "evt_0042",
  "session_id": "session_example",
  "segment_id": "seg_17",
  "revision": 3,
  "type": "translation.committed",
  "source_start_ms": 4200,
  "source_end_ms": 6100,
  "replaces_segment_id": null,
  "evidence_ref": "ledger_example",
  "model_version": "pilot-1"
}
```

Authenticate session ownership, bound buffers, rate-limit streams, reject out-of-order source sequence gaps, support reconnect acknowledgements and expose backpressure. Disconnect may resume only unplayed buffered content; never replay all prior speech automatically. Caption revision styling distinguishes provisional and committed text.

## Evaluate and promote

Report p50/p95 delay from a labeled sufficient-context point to first target audio actually played. Also report onset-to-first-audio, final-segment lag and session startup. Include network, queue, ASR, translation, verification, TTS and playback separately. Provider inference milliseconds are not end-to-end interpretation latency.

Measure critical meaning errors at matched delay, delay at matched quality, revision churn, interruptions, audible repairs and listener task success. Record packet loss, device, region and concurrency. Proposed pilot gate: 20% lower p95 sufficient-context delay at no worse critical-error rate than current Lugemi, with cluster-aware intervals. Slower commitment is acceptable for unstable critical entities. Stop if quicker speech simply raises downstream repair costs.
