export function liveCatalog() {
  return {
    product: 'Lugemi Live',
    model_id: 'lugemi-live',
    model_version: 'pilot-1',
    family: 'Echo + Translate + Voice',
    note:
      'Incremental interpretation with learned wait/commit policy and transparent repair. States: receiving → provisional → committed → spoken; repair_required after commitment; cancelled before playback. Spoken audio is immutable.',
    apis: {
      engine: 'GET /v1/live/engine',
      sessions: 'POST /v1/live/sessions',
      audio: 'POST /v1/live/sessions/:id/audio',
      events: 'GET /v1/live/sessions/:id/events',
      ack: 'POST /v1/live/sessions/:id/ack',
      repair: 'POST /v1/live/sessions/:id/repair',
    },
    transport:
      'Session negotiation over HTTP; versioned events delivered via Server-Sent Events at GET /v1/live/sessions/:id/events (same event schema as the portfolio brief). A transport=websocket request is accepted for compatibility but events still stream over SSE — there is no native WebSocket upgrade in this pilot adapter.',
    console: '/live',
    docs: '/docs/next-model-portfolio/03_LIVE.md',
  };
}
