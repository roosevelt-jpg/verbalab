import { LugemiError } from './errors.js';
import { VoiceBridgeClient } from './voicebridge.js';
import { DealBridgeClient } from './dealbridge.js';
import type { BridgeTransport } from './bridge-transport.js';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  CreateJobRequest,
  DetectRequest,
  DetectResponse,
  Dialect,
  DialectDetectRequest,
  DialectDetectResponse,
  Accent,
  AccentDetectRequest,
  AccentDetectResponse,
  GrammarCheckRequest,
  GrammarCheckResponse,
  GrammarIntelligenceOverview,
  GrammarSpellResponse,
  GrammarCorrectResponse,
  GrammarSuggestRequest,
  GrammarSuggestResponse,
  GrammarAnalytics,
  StyleProfile,
  StyleRewriteRequest,
  StyleRewriteResponse,
  StyleIntelligenceOverview,
  StyleToneDetectRequest,
  StyleToneDetectResponse,
  StyleToneTransformRequest,
  StyleTransferRequest,
  StyleTransferResponse,
  StyleAnalytics,
  LanguageIntelligenceOverview,
  LanguageAnalyzeRequest,
  LanguageAnalyzeResponse,
  LanguageSentimentResponse,
  LanguageTranslationConfidenceRequest,
  LanguageTranslationConfidenceResponse,
  LanguageSpeechConfidenceRequest,
  LanguageSpeechConfidenceResponse,
  LanguageIntelligenceAnalytics,
  TmIntelligenceOverview,
  TmSearchRequest,
  TmSearchResponse,
  TmAnalytics,
  LanguageAnalyticsOverview,
  AnalyticsPeriodParams,
  AnalyticsOverviewResponse,
  AnalyticsTranslationUsage,
  AnalyticsQuality,
  AnalyticsLatency,
  EnterpriseAnalyticsReport,
  CountryPack,
  EmbeddingsRequest,
  EmbeddingsResponse,
  InterpretRequest,
  InterpretResponse,
  Job,
  Language,
  LanguageFamily,
  WritingSystem,
  LinguisticRule,
  RegistryOverview,
  RegistryValidateRequest,
  RegistryValidateResponse,
  RegistryAnalytics,
  RegistryHealth,
  LocalePack,
  LocaleLayout,
  LocaleFormatRequest,
  LocaleFormatResponse,
  LocalizationPlatformOverview,
  IcuValidateResponse,
  IcuFormatRequest,
  IcuFormatResponse,
  LocalizeCatalogResponse,
  LocalizeQaRequest,
  LocalizeQaResponse,
  LocalizeRequest,
  LocalizeResponse,
  OcrRequest,
  OcrResponse,
  RegionsResponse,
  SpeechRequest,
  SpeechResponse,
  TranscribeRequest,
  TranscribeResponse,
  TranslateRequest,
  TranslateResponse,
  TranslateFormatRequest,
  TranslateFormatResponse,
  TranslateChatRequest,
  TranslateChatResponse,
  TranslateEngineOverview,
  TranslateStreamEvent,
  UploadFile,
  LugemiClientOptions,
  Voice,
} from './types.js';

type ErrorBody = {
  error?: { code?: string; message?: string; request_id?: string };
};

type FetchBody =
  | string
  | Blob
  | FormData
  | ArrayBuffer
  | URLSearchParams
  | ReadableStream<Uint8Array>;

/** RequestInit with JSON-serializable body objects (mirrors web apiFetch). */
type JsonRequestInit = Omit<RequestInit, 'body'> & {
  body?: FetchBody | Record<string, unknown> | unknown[] | null;
};

function serializeJsonBody(body: JsonRequestInit['body']): FetchBody | undefined {
  if (body == null) return undefined;
  if (typeof body === 'string') return body;
  if (body instanceof Blob) return body;
  if (body instanceof FormData) return body;
  if (body instanceof ArrayBuffer) return body;
  if (ArrayBuffer.isView(body)) return body as unknown as FetchBody;
  if (body instanceof URLSearchParams) return body;
  if (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream) return body;
  return JSON.stringify(body);
}

function toBlob(file: UploadFile): Blob {
  if (file.data instanceof Blob) {
    return file.contentType && file.data.type !== file.contentType
      ? new Blob([file.data], { type: file.contentType })
      : file.data;
  }
  const bytes = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
  return new Blob([bytes], { type: file.contentType ?? 'application/octet-stream' });
}

export class Lugemi {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private actorId?: string;
  private organizationId?: string;
  private workspaceId?: string;
  private _voiceBridge?: VoiceBridgeClient;
  private _dealBridge?: DealBridgeClient;

  constructor(options: LugemiClientOptions) {
    const key = options.apiKey ?? '';
    const validPrefix =
      key.startsWith('lg_live_') ||
      key.startsWith('lg_test_') ||
      key.startsWith('vl_live_') ||
      key.startsWith('vl_test_');
    if (!validPrefix) {
      throw new Error(
        'apiKey must be a Lugemi key starting with lg_live_ or lg_test_ (legacy vl_live_ / vl_test_ also accepted)',
      );
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? 'https://api.lugemi.com').replace(/\/$/, '');
    this.fetchImpl = options.fetch ?? fetch;
    this.actorId = options.actorId;
    this.organizationId = options.organizationId;
    this.workspaceId = options.workspaceId;
  }

  /** Update actor / tenant context used by VoiceBridge and DealBridge. */
  setBridgeContext(next: { actorId?: string; organizationId?: string; workspaceId?: string }) {
    if (next.actorId !== undefined) this.actorId = next.actorId;
    if (next.organizationId !== undefined) this.organizationId = next.organizationId;
    if (next.workspaceId !== undefined) this.workspaceId = next.workspaceId;
    this._voiceBridge?.setContext(next);
    this._dealBridge?.setContext(next);
  }

  get voiceBridge(): VoiceBridgeClient {
    if (!this._voiceBridge) {
      this._voiceBridge = new VoiceBridgeClient({
        transport: this.bridgeTransport(),
        headers: {
          actorId: this.actorId,
          organizationId: this.organizationId,
          workspaceId: this.workspaceId,
        },
      });
    }
    return this._voiceBridge;
  }

  get dealBridge(): DealBridgeClient {
    if (!this._dealBridge) {
      this._dealBridge = new DealBridgeClient({
        transport: this.bridgeTransport(),
        headers: {
          actorId: this.actorId,
          organizationId: this.organizationId,
          workspaceId: this.workspaceId,
        },
      });
    }
    return this._dealBridge;
  }

  private bridgeTransport(): BridgeTransport {
    return {
      requestJson: <T>(
        path: string,
        init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
      ) =>
        this.requestJson<T>(path, {
          method: init.method,
          body: init.body as JsonRequestInit['body'],
          headers: init.headers,
        }),
      requestForm: <T>(
        path: string,
        form: FormData,
        init: { headers?: Record<string, string> } = {},
      ) => this.requestFormWithHeaders<T>(path, form, init.headers),
    };
  }

  async translate(input: TranslateRequest): Promise<TranslateResponse> {
    return this.requestJson<TranslateResponse>('/v1/translate', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async translateEngine(): Promise<TranslateEngineOverview> {
    return this.requestJson<TranslateEngineOverview>('/v1/translate/engine', { method: 'GET' });
  }

  async translateFormat(input: TranslateFormatRequest): Promise<TranslateFormatResponse> {
    return this.requestJson<TranslateFormatResponse>('/v1/translate/formats', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async translateChat(input: TranslateChatRequest): Promise<TranslateChatResponse> {
    return this.requestJson<TranslateChatResponse>('/v1/translate/chat', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async *translateStream(input: TranslateRequest): AsyncGenerator<TranslateStreamEvent> {
    const res = await this.fetchImpl(`${this.baseUrl}/v1/translate/stream`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as ErrorBody;
      throw new LugemiError(
        body.error?.message ?? `HTTP ${res.status}`,
        body.error?.code ?? 'http_error',
        res.status,
        body.error?.request_id,
      );
    }
    if (!res.body) {
      throw new LugemiError('Empty stream body', 'stream_error', res.status);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        const line = part
          .split('\n')
          .map((l) => l.trim())
          .find((l) => l.startsWith('data:'));
        if (!line) continue;
        const json = line.slice(5).trim();
        if (!json) continue;
        yield JSON.parse(json) as TranslateStreamEvent;
      }
    }
  }

  async detect(input: DetectRequest): Promise<DetectResponse> {
    return this.requestJson<DetectResponse>('/v1/detect', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async dialects(language?: string): Promise<Dialect[]> {
    const q = language ? `?language=${encodeURIComponent(language)}` : '';
    const res = await this.requestJson<{ data: Dialect[] }>(`/v1/dialects${q}`, { method: 'GET' });
    return res.data;
  }

  async dialect(code: string): Promise<Dialect> {
    return this.requestJson<Dialect>(`/v1/dialects/${encodeURIComponent(code)}`, { method: 'GET' });
  }

  async detectDialect(input: DialectDetectRequest): Promise<DialectDetectResponse> {
    return this.requestJson<DialectDetectResponse>('/v1/dialects/detect', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async accents(language?: string): Promise<Accent[]> {
    const q = language ? `?language=${encodeURIComponent(language)}` : '';
    const res = await this.requestJson<{ data: Accent[] }>(`/v1/accents${q}`, { method: 'GET' });
    return res.data;
  }

  async accent(code: string): Promise<Accent> {
    return this.requestJson<Accent>(`/v1/accents/${encodeURIComponent(code)}`, { method: 'GET' });
  }

  async detectAccent(input: AccentDetectRequest): Promise<AccentDetectResponse> {
    if (input.file) {
      const form = new FormData();
      form.append('file', toBlob(input.file), input.file.filename);
      if (input.text) form.append('text', input.text);
      if (input.language) form.append('language', input.language);
      return this.requestForm<AccentDetectResponse>('/v1/accents/detect', form);
    }
    return this.requestJson<AccentDetectResponse>('/v1/accents/detect', {
      method: 'POST',
      body: JSON.stringify({ text: input.text, language: input.language }),
    });
  }

  async accentEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
  }> {
    return this.requestJson('/v1/accents/engine', { method: 'GET' });
  }

  async countryEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: Record<string, boolean>;
    links: Record<string, string>;
  }> {
    return this.requestJson('/v1/country-packs/engine', { method: 'GET' });
  }

  async languageEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: Record<string, boolean>;
    links: Record<string, string>;
  }> {
    return this.requestJson('/v1/languages/engine', { method: 'GET' });
  }

  async dialectEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: Record<string, boolean>;
    links: Record<string, string>;
  }> {
    return this.requestJson('/v1/dialects/engine', { method: 'GET' });
  }

  async localeEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: Record<string, boolean>;
    links: Record<string, string>;
  }> {
    return this.requestJson('/v1/locales/engine', { method: 'GET' });
  }

  async modelsEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: Record<string, boolean>;
    links: Record<string, string>;
  }> {
    return this.requestJson('/v1/models/engine', { method: 'GET' });
  }

  async accentAnalytics(): Promise<{
    windowDays: number;
    detects: number;
    classifies: number;
    total: number;
    byAccent: Record<string, number>;
    registryProfiles: number;
    note: string;
  }> {
    return this.requestJson('/v1/accents/analytics', { method: 'GET' });
  }

  async classifyAccent(input: AccentDetectRequest): Promise<AccentDetectResponse & {
    classification: {
      label: string | null;
      name: string | null;
      confidence: number;
      confidenceBand: string;
      ranked: Array<{
        rank: number;
        code: string;
        nameEn: string;
        score: number;
      }>;
    };
  }> {
    if (input.file) {
      const form = new FormData();
      form.append('file', toBlob(input.file), input.file.filename);
      if (input.text) form.append('text', input.text);
      if (input.language) form.append('language', input.language);
      return this.requestForm('/v1/accents/classify', form);
    }
    return this.requestJson('/v1/accents/classify', {
      method: 'POST',
      body: JSON.stringify({ text: input.text, language: input.language }),
    });
  }

  async emotionEngine(): Promise<{
    product: string;
    note: string;
    labels: string[];
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
  }> {
    return this.requestJson('/v1/emotion/engine', { method: 'GET' });
  }

  async detectEmotion(input: {
    text?: string;
    language?: string;
    file?: UploadFile;
  }): Promise<{
    label: string;
    confidence: number;
    scores: Array<{ label: string; score: number }>;
    audioAdjusted: boolean;
    note: string;
  }> {
    if (input.file) {
      const form = new FormData();
      form.append('file', toBlob(input.file), input.file.filename);
      if (input.text) form.append('text', input.text);
      if (input.language) form.append('language', input.language);
      return this.requestForm('/v1/emotion/detect', form);
    }
    return this.requestJson('/v1/emotion/detect', {
      method: 'POST',
      body: JSON.stringify({ text: input.text, language: input.language }),
    });
  }

  async audioEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
  }> {
    return this.requestJson('/v1/audio-intelligence/engine', { method: 'GET' });
  }

  async analyzeAudio(input: { file: UploadFile }): Promise<{
    product: string;
    noise: { detected: boolean; noiseFloor: number; estimatedSnrDb: number };
    silence: { ratio: number; regions: Array<{ start: number; end: number; durationSeconds: number }> };
    metrics: Record<string, number>;
    note: string;
  }> {
    const form = new FormData();
    form.append('file', toBlob(input.file), input.file.filename);
    return this.requestForm('/v1/audio-intelligence/analyze', form);
  }

  async enhanceAudio(input: { file: UploadFile }): Promise<{
    format: string;
    mimeType: string;
    audioBase64: string;
    bytes: number;
    before: Record<string, unknown>;
    after: Record<string, unknown>;
    note: string;
  }> {
    const form = new FormData();
    form.append('file', toBlob(input.file), input.file.filename);
    return this.requestForm('/v1/audio-intelligence/enhance', form);
  }

  async isolateAudio(input: { file: UploadFile }): Promise<{
    format: string;
    mimeType: string;
    audioBase64: string;
    bytes: number;
    speechRatio: number;
    note: string;
  }> {
    const form = new FormData();
    form.append('file', toBlob(input.file), input.file.filename);
    return this.requestForm('/v1/audio-intelligence/isolate', form);
  }

  async pronunciationEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
  }> {
    return this.requestJson('/v1/pronunciation/engine', { method: 'GET' });
  }

  async assessPronunciation(input: {
    reference: string;
    hypothesis?: string;
    language?: string;
    file?: UploadFile;
  }): Promise<{
    language: string;
    hypothesis: string;
    scores: {
      overall: number;
      accuracy: number;
      fluency: number;
      stress: number;
      wordErrorRate: number;
    };
    coaching: Array<{ id: string; severity: string; message: string }>;
    note: string;
  }> {
    if (input.file) {
      const form = new FormData();
      form.append('file', toBlob(input.file), input.file.filename);
      form.append('reference', input.reference);
      if (input.hypothesis) form.append('hypothesis', input.hypothesis);
      if (input.language) form.append('language', input.language);
      return this.requestForm('/v1/pronunciation/assess', form);
    }
    return this.requestJson('/v1/pronunciation/assess', {
      method: 'POST',
      body: JSON.stringify({
        reference: input.reference,
        hypothesis: input.hypothesis,
        language: input.language,
      }),
    });
  }

  async wakeWordEngine(): Promise<{
    product: string;
    note: string;
    defaultWakePhrases: string[];
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
  }> {
    return this.requestJson('/v1/wake-word/engine', { method: 'GET' });
  }

  async detectWakeWord(input: {
    text?: string;
    language?: string;
    file?: UploadFile;
  }): Promise<{
    wakeDetected: boolean;
    transcript: string;
    hits: Array<{ phrase: string; kind: string; start: number; end: number }>;
    note: string;
  }> {
    if (input.file) {
      const form = new FormData();
      form.append('file', toBlob(input.file), input.file.filename);
      if (input.text) form.append('text', input.text);
      if (input.language) form.append('language', input.language);
      return this.requestForm('/v1/wake-word/detect', form);
    }
    return this.requestJson('/v1/wake-word/detect', {
      method: 'POST',
      body: JSON.stringify({ text: input.text, language: input.language }),
    });
  }

  async spotKeywords(input: {
    text?: string;
    keywords?: string[];
    language?: string;
    file?: UploadFile;
  }): Promise<{
    transcript: string;
    hits: Array<{ phrase: string; kind: string; start: number; end: number }>;
    hitCount: number;
    note: string;
  }> {
    if (input.file) {
      const form = new FormData();
      form.append('file', toBlob(input.file), input.file.filename);
      if (input.text) form.append('text', input.text);
      if (input.language) form.append('language', input.language);
      if (input.keywords?.length) form.append('keywords', input.keywords.join(','));
      return this.requestForm('/v1/wake-word/spot', form);
    }
    return this.requestJson('/v1/wake-word/spot', {
      method: 'POST',
      body: JSON.stringify({
        text: input.text,
        language: input.language,
        keywords: input.keywords,
      }),
    });
  }

  async callIntelligenceEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
  }> {
    return this.requestJson('/v1/call-intelligence/engine', { method: 'GET' });
  }

  async ingestCall(input: {
    transcript?: string;
    language?: string;
    direction?: string;
    externalRef?: string;
    file?: UploadFile;
    analyze?: boolean;
  }): Promise<{
    id: string;
    status: string;
    summary: string | null;
    transcript: string | null;
    analysis: unknown;
  }> {
    if (input.file) {
      const form = new FormData();
      form.append('file', toBlob(input.file), input.file.filename);
      if (input.transcript) form.append('transcript', input.transcript);
      if (input.language) form.append('language', input.language);
      if (input.direction) form.append('direction', input.direction);
      if (input.externalRef) form.append('externalRef', input.externalRef);
      if (input.analyze === false) form.append('analyze', 'false');
      return this.requestForm('/v1/call-intelligence/calls', form);
    }
    return this.requestJson('/v1/call-intelligence/calls', {
      method: 'POST',
      body: JSON.stringify({
        transcript: input.transcript,
        language: input.language,
        direction: input.direction,
        externalRef: input.externalRef,
        analyze: input.analyze,
      }),
    });
  }

  async callIntelligenceReport(): Promise<{
    totalCalls: number;
    bySentiment: Record<string, number>;
    averageQaScore: number | null;
    note: string;
  }> {
    return this.requestJson('/v1/call-intelligence/report', { method: 'GET' });
  }

  async speechAnalyticsEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
  }> {
    return this.requestJson('/v1/speech-analytics/engine', { method: 'GET' });
  }

  async speechAnalyticsOverview(params?: { from?: string; to?: string }): Promise<{
    periodStart: string;
    periodEnd: string;
    estimatedCostUsd: number;
    usage: { stt: { requests: number; seconds: number }; tts: { requests: number; characters: number } };
    note: string;
  }> {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return this.requestJson(`/v1/speech-analytics/overview${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }

  async speechAnalyticsReport(params?: { from?: string; to?: string }): Promise<{
    product: string;
    generatedAt: string;
    note: string;
  }> {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return this.requestJson(`/v1/speech-analytics/report${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }

  async checkGrammar(input: GrammarCheckRequest): Promise<GrammarCheckResponse> {
    return this.requestJson<GrammarCheckResponse>('/v1/grammar/check', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async grammarIntelligence(): Promise<GrammarIntelligenceOverview> {
    return this.requestJson<GrammarIntelligenceOverview>('/v1/grammar/intelligence', {
      method: 'GET',
    });
  }

  async spellCheck(input: GrammarCheckRequest): Promise<GrammarSpellResponse> {
    return this.requestJson<GrammarSpellResponse>('/v1/grammar/spell', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async correctGrammar(input: GrammarCheckRequest): Promise<GrammarCorrectResponse> {
    return this.requestJson<GrammarCorrectResponse>('/v1/grammar/correct', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async suggestWriting(input: GrammarSuggestRequest): Promise<GrammarSuggestResponse> {
    return this.requestJson<GrammarSuggestResponse>('/v1/grammar/suggest', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async grammarAnalytics(): Promise<GrammarAnalytics> {
    return this.requestJson<GrammarAnalytics>('/v1/grammar/analytics', { method: 'GET' });
  }

  async styleProfiles(): Promise<StyleProfile[]> {
    const res = await this.requestJson<{ data: StyleProfile[] }>('/v1/style/profiles', { method: 'GET' });
    return res.data;
  }

  async rewriteStyle(input: StyleRewriteRequest): Promise<StyleRewriteResponse> {
    return this.requestJson<StyleRewriteResponse>('/v1/style/rewrite', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async styleIntelligence(): Promise<StyleIntelligenceOverview> {
    return this.requestJson<StyleIntelligenceOverview>('/v1/style/intelligence', {
      method: 'GET',
    });
  }

  async detectTone(input: StyleToneDetectRequest): Promise<StyleToneDetectResponse> {
    return this.requestJson<StyleToneDetectResponse>('/v1/style/detect', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async transformTone(input: StyleToneTransformRequest): Promise<StyleRewriteResponse> {
    return this.requestJson<StyleRewriteResponse>('/v1/style/transform', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async transferStyle(input: StyleTransferRequest): Promise<StyleTransferResponse> {
    return this.requestJson<StyleTransferResponse>('/v1/style/transfer', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async styleAnalytics(): Promise<StyleAnalytics> {
    return this.requestJson<StyleAnalytics>('/v1/style/analytics', { method: 'GET' });
  }

  async languageIntelligence(): Promise<LanguageIntelligenceOverview> {
    return this.requestJson<LanguageIntelligenceOverview>('/v1/language-intelligence', {
      method: 'GET',
    });
  }

  async analyzeLanguage(input: LanguageAnalyzeRequest): Promise<LanguageAnalyzeResponse> {
    return this.requestJson<LanguageAnalyzeResponse>('/v1/language-intelligence/analyze', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async languageSentiment(input: { text: string }): Promise<LanguageSentimentResponse> {
    return this.requestJson<LanguageSentimentResponse>('/v1/language-intelligence/sentiment', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async languageIntent(input: { text: string }): Promise<LanguageSentimentResponse> {
    return this.requestJson<LanguageSentimentResponse>('/v1/language-intelligence/intent', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async translationConfidence(
    input: LanguageTranslationConfidenceRequest,
  ): Promise<LanguageTranslationConfidenceResponse> {
    return this.requestJson<LanguageTranslationConfidenceResponse>(
      '/v1/language-intelligence/translation-confidence',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  }

  async speechConfidence(
    input: LanguageSpeechConfidenceRequest,
  ): Promise<LanguageSpeechConfidenceResponse> {
    return this.requestJson<LanguageSpeechConfidenceResponse>(
      '/v1/language-intelligence/speech-confidence',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  }

  async languageIntelligenceAnalytics(): Promise<LanguageIntelligenceAnalytics> {
    return this.requestJson<LanguageIntelligenceAnalytics>('/v1/language-intelligence/analytics', {
      method: 'GET',
    });
  }

  async tmIntelligence(): Promise<TmIntelligenceOverview> {
    return this.requestJson<TmIntelligenceOverview>('/v1/tm', { method: 'GET' });
  }

  async searchTm(input: TmSearchRequest): Promise<TmSearchResponse> {
    return this.requestJson<TmSearchResponse>('/v1/tm/search', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async tmAnalytics(): Promise<TmAnalytics> {
    return this.requestJson<TmAnalytics>('/v1/tm/analytics', { method: 'GET' });
  }

  async languageAnalyticsCatalog(): Promise<LanguageAnalyticsOverview> {
    return this.requestJson<LanguageAnalyticsOverview>('/v1/analytics', { method: 'GET' });
  }

  async analyticsOverview(params?: AnalyticsPeriodParams): Promise<AnalyticsOverviewResponse> {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return this.requestJson<AnalyticsOverviewResponse>(
      `/v1/analytics/overview${qs ? `?${qs}` : ''}`,
      { method: 'GET' },
    );
  }

  async analyticsTranslation(params?: AnalyticsPeriodParams): Promise<AnalyticsTranslationUsage> {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return this.requestJson<AnalyticsTranslationUsage>(
      `/v1/analytics/translation${qs ? `?${qs}` : ''}`,
      { method: 'GET' },
    );
  }

  async analyticsQuality(params?: AnalyticsPeriodParams): Promise<AnalyticsQuality> {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return this.requestJson<AnalyticsQuality>(`/v1/analytics/quality${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }

  async analyticsLatency(params?: AnalyticsPeriodParams): Promise<AnalyticsLatency> {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return this.requestJson<AnalyticsLatency>(`/v1/analytics/latency${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }

  async enterpriseAnalyticsReport(
    params?: AnalyticsPeriodParams,
  ): Promise<EnterpriseAnalyticsReport> {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return this.requestJson<EnterpriseAnalyticsReport>(
      `/v1/analytics/reports/enterprise${qs ? `?${qs}` : ''}`,
      { method: 'GET' },
    );
  }

  async countryPacks(region?: string): Promise<CountryPack[]> {
    const q = region ? `?region=${encodeURIComponent(region)}` : '';
    const res = await this.requestJson<{ data: CountryPack[] }>(`/v1/country-packs${q}`, {
      method: 'GET',
    });
    return res.data;
  }

  async countryPack(code: string, includeLocales = false): Promise<CountryPack> {
    const q = includeLocales ? '?includeLocales=true' : '';
    return this.requestJson<CountryPack>(`/v1/country-packs/${encodeURIComponent(code)}${q}`, {
      method: 'GET',
    });
  }

  async chat(input: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return this.requestJson<ChatCompletionResponse>('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async embeddings(input: EmbeddingsRequest): Promise<EmbeddingsResponse> {
    return this.requestJson<EmbeddingsResponse>('/v1/embeddings', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async languages(): Promise<Language[]> {
    const res = await this.requestJson<{ data: Language[] }>('/v1/languages', { method: 'GET' });
    return res.data;
  }

  async language(code: string): Promise<Language> {
    return this.requestJson<Language>(`/v1/languages/${encodeURIComponent(code)}`, { method: 'GET' });
  }

  async registry(): Promise<RegistryOverview> {
    return this.requestJson<RegistryOverview>('/v1/registry', { method: 'GET' });
  }

  async languageFamilies(): Promise<LanguageFamily[]> {
    const res = await this.requestJson<{ data: LanguageFamily[] }>('/v1/registry/families', {
      method: 'GET',
    });
    return res.data;
  }

  async languageFamily(code: string): Promise<LanguageFamily & { languages?: unknown[] }> {
    return this.requestJson(`/v1/registry/families/${encodeURIComponent(code)}`, { method: 'GET' });
  }

  async writingSystems(kind?: string): Promise<WritingSystem[]> {
    const q = kind ? `?kind=${encodeURIComponent(kind)}` : '';
    const res = await this.requestJson<{ data: WritingSystem[] }>(`/v1/registry/scripts${q}`, {
      method: 'GET',
    });
    return res.data;
  }

  async writingSystem(code: string): Promise<WritingSystem & { languages?: unknown[] }> {
    return this.requestJson(`/v1/registry/scripts/${encodeURIComponent(code)}`, { method: 'GET' });
  }

  async alphabets(): Promise<WritingSystem[]> {
    const res = await this.requestJson<{ data: WritingSystem[] }>('/v1/registry/alphabets', {
      method: 'GET',
    });
    return res.data;
  }

  async linguisticRules(filters?: { kind?: string; language?: string }): Promise<LinguisticRule[]> {
    const params = new URLSearchParams();
    if (filters?.kind) params.set('kind', filters.kind);
    if (filters?.language) params.set('language', filters.language);
    const q = params.toString() ? `?${params}` : '';
    const res = await this.requestJson<{ data: LinguisticRule[] }>(`/v1/registry/rules${q}`, {
      method: 'GET',
    });
    return res.data;
  }

  async linguisticRule(code: string): Promise<LinguisticRule> {
    return this.requestJson<LinguisticRule>(`/v1/registry/rules/${encodeURIComponent(code)}`, {
      method: 'GET',
    });
  }

  async validateRegistry(input: RegistryValidateRequest): Promise<RegistryValidateResponse> {
    return this.requestJson<RegistryValidateResponse>('/v1/registry/validate', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async registryAnalytics(): Promise<RegistryAnalytics> {
    return this.requestJson<RegistryAnalytics>('/v1/registry/analytics', { method: 'GET' });
  }

  async registryHealth(): Promise<RegistryHealth> {
    return this.requestJson<RegistryHealth>('/v1/registry/health', { method: 'GET' });
  }

  async regions(): Promise<RegionsResponse> {
    return this.requestJson<RegionsResponse>('/v1/regions', { method: 'GET' });
  }

  async locales(): Promise<LocalePack[]> {
    const res = await this.requestJson<{ data: LocalePack[] }>('/v1/locales', { method: 'GET' });
    return res.data;
  }

  async locale(code: string): Promise<LocalePack> {
    return this.requestJson<LocalePack>(`/v1/locales/${encodeURIComponent(code)}`, { method: 'GET' });
  }

  async localeLayout(code: string): Promise<LocaleLayout> {
    return this.requestJson<LocaleLayout>(`/v1/locales/${encodeURIComponent(code)}/layout`, {
      method: 'GET',
    });
  }

  async localeFormat(input: LocaleFormatRequest): Promise<LocaleFormatResponse> {
    return this.requestJson<LocaleFormatResponse>('/v1/locales/format', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async localizationPlatform(): Promise<LocalizationPlatformOverview> {
    return this.requestJson<LocalizationPlatformOverview>('/v1/localization', { method: 'GET' });
  }

  async validateIcu(message: string): Promise<IcuValidateResponse> {
    return this.requestJson<IcuValidateResponse>('/v1/icu/validate', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async formatIcu(input: IcuFormatRequest): Promise<IcuFormatResponse> {
    return this.requestJson<IcuFormatResponse>('/v1/icu/format', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async localizeCatalog(content: unknown, format: 'json' | 'yaml' = 'json'): Promise<LocalizeCatalogResponse> {
    return this.requestJson<LocalizeCatalogResponse>('/v1/localize/catalog', {
      method: 'POST',
      body: JSON.stringify({ format, content }),
    });
  }

  async localizeQa(input: LocalizeQaRequest): Promise<LocalizeQaResponse> {
    return this.requestJson<LocalizeQaResponse>('/v1/localize/qa', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async localize(input: LocalizeRequest): Promise<LocalizeResponse> {
    return this.requestJson<LocalizeResponse>('/v1/localize', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async createJob(input: CreateJobRequest): Promise<Job> {
    return this.requestJson<Job>('/v1/jobs', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async listJobs(limit = 50): Promise<Job[]> {
    return this.requestJson<Job[]>(`/v1/jobs?limit=${encodeURIComponent(String(limit))}`, {
      method: 'GET',
    });
  }

  async getJob(id: string): Promise<Job> {
    return this.requestJson<Job>(`/v1/jobs/${encodeURIComponent(id)}`, { method: 'GET' });
  }

  async ocr(input: OcrRequest): Promise<OcrResponse> {
    const form = new FormData();
    form.append('file', toBlob(input.file), input.file.filename);
    if (input.languageHint) form.append('languageHint', input.languageHint);
    if (input.source) form.append('source', input.source);
    if (input.target) form.append('target', input.target);
    return this.requestForm<OcrResponse>('/v1/ocr', form);
  }

  async voices(): Promise<{ data: Voice[] }> {
    return this.requestJson<{ data: Voice[] }>('/v1/audio/voices', { method: 'GET' });
  }

  async speechProducts(): Promise<{
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/speech/products', { method: 'GET' });
  }

  async voiceProducts(): Promise<{
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/voice-cloud/products', { method: 'GET' });
  }

  async intelligenceProducts(): Promise<{
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/intelligence-cloud/products', { method: 'GET' });
  }

  async knowledgeProducts(): Promise<{
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/knowledge-cloud/products', { method: 'GET' });
  }

  async inferenceProducts(): Promise<{
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/inference-cloud/products', { method: 'GET' });
  }

  async aiKernelProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/ai-kernel/products', { method: 'GET' });
  }

  async foundationModelCloudProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      modality: string;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/foundation-model-cloud/products', { method: 'GET' });
  }

  async modelTrainingPlatformEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    methods: Array<{
      id: string;
      name: string;
      status: string;
      launchable: boolean;
      existingApi: string | null;
      notes: string;
    }>;
    honesty: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/model-training-platform/engine', { method: 'GET' });
  }

  async modelEvaluationPlatformEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    suites: Array<{
      id: string;
      name: string;
      status: string;
      runnable: boolean;
      existingApi: string | null;
      notes: string;
    }>;
    honesty: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/model-evaluation-platform/engine', { method: 'GET' });
  }

  async modelRegistryEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/model-registry/engine', { method: 'GET' });
  }

  /** Live Models Engine matrix (public) — Lugemi + vendor readiness per feature. */
  async modelsLive(): Promise<{
    asOf: string;
    disclaimer: string;
    features: Array<{
      feature: string;
      hasConfiguredProvider: boolean;
      models: Array<{
        id: string;
        slug: string;
        displayName: string;
        kind: string;
        provider: string | null;
        baseModel: string;
        configured: boolean;
        envKey: string | null;
        notes: string | null;
      }>;
    }>;
  }> {
    return this.requestJson('/v1/models/live', { method: 'GET' });
  }

  async atlasEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/atlas/engine', { method: 'GET' });
  }

  async aiFabricProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/ai-fabric/products', { method: 'GET' });
  }

  async eventFabricProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    brokers: Array<{
      id: string;
      name: string;
      status: string;
      protocol: string;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    backend: string;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/event-fabric/products', { method: 'GET' });
  }

  async eventFabricPublish(input: {
    topic?: string;
    type?: string;
    source?: string;
    data?: unknown;
    eventVersion?: string;
    dataschema?: string | null;
    subject?: string | null;
  }): Promise<{ event: Record<string, unknown>; backend: string }> {
    return this.requestJson('/v1/event-fabric/events', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async eventFabricPoll(params?: {
    topic?: string;
    count?: number;
    eventVersion?: string;
  }): Promise<{
    events: Array<Record<string, unknown>>;
    backend: string;
    group: string;
    topic: string;
  }> {
    const q = new URLSearchParams();
    if (params?.topic) q.set('topic', params.topic);
    if (params?.count != null) q.set('count', String(params.count));
    if (params?.eventVersion) q.set('eventVersion', params.eventVersion);
    const suffix = q.toString() ? `?${q}` : '';
    return this.requestJson(`/v1/event-fabric/events${suffix}`, { method: 'GET' });
  }

  async eventFabricAnalytics(): Promise<{
    backend: string;
    topics: Array<Record<string, unknown>>;
    totals: Record<string, number>;
  }> {
    return this.requestJson('/v1/event-fabric/analytics', { method: 'GET' });
  }

  async contextFabricProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    routes: Array<{
      kind: string;
      name: string;
      target: string;
      api: string;
      cloud: string;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/context-fabric/products', { method: 'GET' });
  }

  async contextFabricRoute(body?: { kinds?: string[] }): Promise<{
    plan: Array<Record<string, unknown>>;
    missing: string[];
    include: Record<string, boolean>;
  }> {
    return this.requestJson('/v1/context-fabric/route', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async contextFabricPropagate(body?: {
    kinds?: string[];
    query?: string;
    conversationId?: string;
    projectKey?: string;
    modelHint?: string;
    maxChars?: number;
    publishEvent?: boolean;
    topic?: string;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/context-fabric/propagate', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async knowledgeFabricProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    routes: Array<{
      kind: string;
      name: string;
      target: string;
      api: string;
      cloud: string;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/knowledge-fabric/products', { method: 'GET' });
  }

  async knowledgeFabricRoute(body?: { kinds?: string[] }): Promise<{
    plan: Array<Record<string, unknown>>;
    missing: string[];
  }> {
    return this.requestJson('/v1/knowledge-fabric/route', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async knowledgeFabricFederate(body?: { kinds?: string[] }): Promise<{
    federation: Array<Record<string, unknown>>;
    missing: string[];
  }> {
    return this.requestJson('/v1/knowledge-fabric/federate', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async knowledgeFabricDistribute(body?: {
    kinds?: string[];
    targetWorkspaceIds?: string[];
    publishEvent?: boolean;
    topic?: string;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/knowledge-fabric/distribute', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async knowledgeFabricSync(body: {
    targetWorkspaceId: string;
    kinds?: string[];
    publishEvent?: boolean;
    topic?: string;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/knowledge-fabric/sync', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async promptFabricProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    routes: Array<{
      kind: string;
      name: string;
      target: string;
      api: string;
      cloud: string;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/prompt-fabric/products', { method: 'GET' });
  }

  async promptFabricRoute(body?: {
    kinds?: string[];
    feature?: string;
  }): Promise<{
    plan: Array<Record<string, unknown>>;
    missing: string[];
    runtimeRoute: Record<string, unknown> | null;
  }> {
    return this.requestJson('/v1/prompt-fabric/route', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async promptFabricValidate(body?: {
    key?: string;
    body?: string;
    version?: number;
    variables?: Record<string, string>;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/prompt-fabric/validate', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async promptFabricDistribute(body?: {
    keys?: string[];
    targetWorkspaceIds?: string[];
    publishEvent?: boolean;
    topic?: string;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/prompt-fabric/distribute', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async promptFabricSync(body: {
    targetWorkspaceId: string;
    keys?: string[];
    publishEvent?: boolean;
    topic?: string;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/prompt-fabric/sync', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async reasoningFabricProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    routes: Array<{
      kind: string;
      name: string;
      target: string;
      api: string;
      cloud: string;
      notes: string;
    }>;
    pipelines: Array<{
      id: string;
      name: string;
      steps: string[];
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/reasoning-fabric/products', { method: 'GET' });
  }

  async reasoningFabricRoute(body?: { kinds?: string[] }): Promise<{
    plan: Array<Record<string, unknown>>;
    missing: string[];
  }> {
    return this.requestJson('/v1/reasoning-fabric/route', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async reasoningFabricPipeline(body?: {
    pipelineId?: string;
    steps?: string[];
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/reasoning-fabric/pipeline', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async reasoningFabricFederate(body?: { kinds?: string[] }): Promise<{
    federation: Array<Record<string, unknown>>;
    missing: string[];
  }> {
    return this.requestJson('/v1/reasoning-fabric/federate', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async reasoningFabricDistribute(body?: {
    kinds?: string[];
    targetWorkspaceIds?: string[];
    publishEvent?: boolean;
    topic?: string;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/reasoning-fabric/distribute', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async memoryFabricProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    routes: Array<{
      kind: string;
      name: string;
      target: string;
      api: string;
      cloud: string;
      notes: string;
    }>;
    pipelines: Array<{
      id: string;
      name: string;
      steps: string[];
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/memory-fabric/products', { method: 'GET' });
  }

  async memoryFabricRoute(body?: { kinds?: string[] }): Promise<{
    plan: Array<Record<string, unknown>>;
    missing: string[];
  }> {
    return this.requestJson('/v1/memory-fabric/route', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async memoryFabricPipeline(body?: {
    pipelineId?: string;
    steps?: string[];
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/memory-fabric/pipeline', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async memoryFabricFederate(body?: { kinds?: string[] }): Promise<{
    federation: Array<Record<string, unknown>>;
    missing: string[];
  }> {
    return this.requestJson('/v1/memory-fabric/federate', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async memoryFabricDistribute(body?: {
    kinds?: string[];
    targetWorkspaceIds?: string[];
    publishEvent?: boolean;
    topic?: string;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/memory-fabric/distribute', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async agentFabricProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    routes: Array<{
      kind: string;
      name: string;
      target: string;
      api: string;
      cloud: string;
      notes: string;
    }>;
    pipelines: Array<{
      id: string;
      name: string;
      steps: string[];
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/agent-fabric/products', { method: 'GET' });
  }

  async agentFabricRoute(body?: { kinds?: string[] }): Promise<{
    plan: Array<Record<string, unknown>>;
    missing: string[];
  }> {
    return this.requestJson('/v1/agent-fabric/route', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async agentFabricPipeline(body?: {
    pipelineId?: string;
    steps?: string[];
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/agent-fabric/pipeline', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async agentFabricFederate(body?: { kinds?: string[] }): Promise<{
    federation: Array<Record<string, unknown>>;
    missing: string[];
  }> {
    return this.requestJson('/v1/agent-fabric/federate', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async agentFabricDistribute(body?: {
    kinds?: string[];
    targetWorkspaceIds?: string[];
    publishEvent?: boolean;
    topic?: string;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/agent-fabric/distribute', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async policyFabricProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    routes: Array<{
      kind: string;
      name: string;
      target: string;
      api: string;
      cloud: string;
      notes: string;
    }>;
    pipelines: Array<{
      id: string;
      name: string;
      steps: string[];
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/policy-fabric/products', { method: 'GET' });
  }

  async ecosystemCloudProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/ecosystem-cloud/products', { method: 'GET' });
  }

  async pluginMarketplaceEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/plugin-marketplace/engine', { method: 'GET' });
  }

  async modelMarketplaceEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/model-marketplace/engine', { method: 'GET' });
  }

  async datasetMarketplaceEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/dataset-marketplace/engine', { method: 'GET' });
  }

  async promptMarketplaceEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/prompt-marketplace/engine', { method: 'GET' });
  }

  async agentMarketplaceEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/agent-marketplace/engine', { method: 'GET' });
  }

  async workflowMarketplaceEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/workflow-marketplace/engine', { method: 'GET' });
  }

  async connectorMarketplaceEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/connector-marketplace/engine', { method: 'GET' });
  }

  /** Studio Connectors hub — platform installer registry. */
  async platformConnectors(category?: string): Promise<{
    product: string;
    note: string;
    categories: Array<{ id: string; label: string; lead: string }>;
    apis: Record<string, { method: string; path: string; summary: string }>;
    connectors: Array<{
      id: string;
      name: string;
      category: string;
      blurb: string;
      fields: string[];
      demoHref: string;
      lugemiApis: string[];
    }>;
    console: string;
    docs: string;
    sdk: Record<string, string>;
  }> {
    const qs = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.requestJson(`/v1/connectors/platform${qs}`, { method: 'GET' });
  }

  async platformConnector(id: string): Promise<{
    id: string;
    name: string;
    category: string;
    blurb: string;
    docs: string;
    integrationGuide: string;
    fields: string[];
    envHint: string;
    demoHref: string;
    demoLabel: string;
    lugemiApis: Array<{ method: string; path: string; summary: string }>;
    apiReference: string;
    sdk: { typescript: string; python: string };
    demo: { method: string; path: string; summary: string };
  }> {
    return this.requestJson(`/v1/connectors/platform/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
  }

  async platformConnectorDemo(
    id: string,
    input?: { text?: string; source?: string; target?: string },
  ): Promise<{
    connectorId: string;
    name: string;
    ok: boolean;
    message: string;
    sample: Record<string, unknown>;
    next: Record<string, unknown>;
    integrationGuide: string;
    console: string;
  }> {
    return this.requestJson(`/v1/connectors/platform/${encodeURIComponent(id)}/demo`, {
      method: 'POST',
      body: JSON.stringify(input ?? {}),
    });
  }

  /** First-party TTS synthesize (JSON → audio bytes). */
  async ttsSynthesize(input: {
    text: string;
    voice?: string;
    format?: string;
    language?: string;
  }): Promise<SpeechResponse> {
    const response = await this.fetchImpl(`${this.baseUrl}/v1/tts/synthesize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: '*/*',
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as ErrorBody;
      throw new LugemiError(
        body.error?.message ?? `Request failed with status ${response.status}`,
        body.error?.code ?? 'http_error',
        response.status,
        body.error?.request_id,
      );
    }
    const audio = new Uint8Array(await response.arrayBuffer());
    return {
      audio,
      mimeType: response.headers.get('content-type') ?? 'audio/mpeg',
      provider: response.headers.get('x-lugemi-provider') ?? undefined,
      voice: response.headers.get('x-lugemi-voice') ?? undefined,
      characters: Number(response.headers.get('x-lugemi-characters') ?? '') || undefined,
      watermarkApplied: response.headers.get('x-lugemi-watermark') === 'required',
    };
  }

  /** List workspace voice clone refs (Clerk or org-scoped key). */
  async listVoiceClones(): Promise<unknown> {
    return this.requestJson('/v1/voice-clones', { method: 'GET' });
  }

  async voiceLanguageMarketplaceEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/voice-language-marketplace/engine', { method: 'GET' });
  }


  async africanIntelligenceCloudProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/african-intelligence-cloud/products', { method: 'GET' });
  }

  async africanLanguageRegistryEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/african-language-registry/engine', { method: 'GET' });
  }

  async regionalLanguageRegistryEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    counts?: Record<string, number>;
    docs?: string;
  }> {
    return this.requestJson('/v1/regional-language-registry/engine', { method: 'GET' });
  }

  async regionalLanguageRegistryRegions(): Promise<{
    regions: Array<{ id: string; label: string; shortLabel: string; count?: number }>;
    counts: Record<string, number>;
    africaFirst: boolean;
  }> {
    return this.requestJson('/v1/regional-language-registry/regions', { method: 'GET' });
  }

  async regionalLanguageRegistryLanguages(params?: {
    region?: string;
    q?: string;
  }): Promise<{ region: string; languages: unknown[]; count: number; counts?: Record<string, number> }> {
    const qs = new URLSearchParams();
    if (params?.region) qs.set('region', params.region);
    if (params?.q) qs.set('q', params.q);
    const suffix = qs.toString() ? `?${qs}` : '';
    return this.requestJson(`/v1/regional-language-registry/languages${suffix}`, { method: 'GET' });
  }

  async culturalIntelligenceEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/cultural-intelligence/engine', { method: 'GET' });
  }

  async africanKnowledgeGraphEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/african-knowledge-graph/engine', { method: 'GET' });
  }

  async governmentIntelligenceEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/government-intelligence/engine', { method: 'GET' });
  }

  async languageIntegrityEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    trust?: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/language-integrity/engine', { method: 'GET' });
  }

  async languageIntegrityProtocol(): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/language-integrity/protocol', { method: 'GET' });
  }

  async languageIntegrityVerify(body: {
    claimType?: string;
    cloneId?: string;
    watermarkHeader?: string;
    consentAttested?: boolean;
    ownershipAttested?: boolean;
    audioClaimText?: string;
    attestationNotes?: string;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/language-integrity/verify', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async healthcareIntelligenceEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/healthcare-intelligence/engine', { method: 'GET' });
  }

  async financialIntelligenceEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/financial-intelligence/engine', { method: 'GET' });
  }

  async educationIntelligenceEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/education-intelligence/engine', { method: 'GET' });
  }

  async agriculturalIntelligenceEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/agricultural-intelligence/engine', { method: 'GET' });
  }



  async mlopsLlmopsCloudProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/mlops-llmops-cloud/products', { method: 'GET' });
  }

  async datasetPipelineEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/dataset-pipeline/engine', { method: 'GET' });
  }

  async trainingPipelineEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/training-pipeline/engine', { method: 'GET' });
  }

  async continuousEvaluationEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/continuous-evaluation/engine', { method: 'GET' });
  }

  async promptopsPlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/promptops-platform/engine', { method: 'GET' });
  }

  async ragopsPlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/ragops-platform/engine', { method: 'GET' });
  }

  async agentopsPlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/agentops-platform/engine', { method: 'GET' });
  }

  async aiDriftDetectionEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/ai-drift-detection/engine', { method: 'GET' });
  }

  async continuousLearningEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/continuous-learning/engine', { method: 'GET' });
  }

  async aiOperationsDashboardEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/ai-operations-dashboard/engine', { method: 'GET' });
  }

  async trustCloudProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/trust-cloud/products', { method: 'GET' });
  }

  async aiSafetyPlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/ai-safety-platform/engine', { method: 'GET' });
  }

  async aiGovernancePlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/ai-governance-platform/engine', { method: 'GET' });
  }

  async explainabilityPlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/explainability-platform/engine', { method: 'GET' });
  }

  async privacyPlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/privacy-platform/engine', { method: 'GET' });
  }

  async compliancePlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/compliance-platform/engine', { method: 'GET' });
  }

  async riskIntelligenceEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/risk-intelligence/engine', { method: 'GET' });
  }

  async identityFederationEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/identity-federation/engine', { method: 'GET' });
  }

  async trustAnalyticsEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/trust-analytics/engine', { method: 'GET' });
  }

  async platformEngineeringCloudProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/platform-engineering-cloud/products', { method: 'GET' });
  }

  async internalDeveloperPortalEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/internal-developer-portal/engine', { method: 'GET' });
  }

  async serviceCatalogEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/service-catalog/engine', { method: 'GET' });
  }

  async goldenPathPlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/golden-path-platform/engine', { method: 'GET' });
  }

  async gitopsPlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/gitops-platform/engine', { method: 'GET' });
  }

  async releaseEngineeringEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/release-engineering/engine', { method: 'GET' });
  }

  async reliabilityEngineeringEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/reliability-engineering/engine', { method: 'GET' });
  }

  async finopsPlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/finops-platform/engine', { method: 'GET' });
  }

  async supplyChainSecurityEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/supply-chain-security/engine', { method: 'GET' });
  }

  async developerExperiencePlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/developer-experience-platform/engine', { method: 'GET' });
  }

  async platformEngineeringAnalyticsEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/platform-engineering-analytics/engine', { method: 'GET' });
  }

  async researchCloudProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/research-cloud/products', { method: 'GET' });
  }

  async experimentPlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/experiment-platform/engine', { method: 'GET' });
  }

  async syntheticDataPlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/synthetic-data-platform/engine', { method: 'GET' });
  }

  async benchmarkPlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/benchmark-platform/engine', { method: 'GET' });
  }

  async evaluationPlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/evaluation-platform/engine', { method: 'GET' });
  }

  async aiPublicationPlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/ai-publication-platform/engine', { method: 'GET' });
  }

  async patentInnovationPlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/patent-innovation-platform/engine', { method: 'GET' });
  }

  async openSciencePlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/open-science-platform/engine', { method: 'GET' });
  }

  async researchAnalyticsEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/research-analytics/engine', { method: 'GET' });
  }

  async tourismHeritageIntelligenceEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/tourism-heritage-intelligence/engine', { method: 'GET' });
  }

  async creatorEconomyEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/creator-economy/engine', { method: 'GET' });
  }

  async policyFabricRoute(body?: { kinds?: string[] }): Promise<{
    plan: Array<Record<string, unknown>>;
    missing: string[];
  }> {
    return this.requestJson('/v1/policy-fabric/route', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async policyFabricPipeline(body?: {
    pipelineId?: string;
    steps?: string[];
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/policy-fabric/pipeline', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async policyFabricAssert(body: {
    bus?: string;
    action: string;
    subjectId?: string;
    permissions?: string[];
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/policy-fabric/assert', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async policyFabricDistribute(body?: {
    kinds?: string[];
    targetWorkspaceIds?: string[];
    publishEvent?: boolean;
    topic?: string;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/policy-fabric/distribute', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });
  }

  async memoryRuntimeEngine(): Promise<{
    product: string;
    note: string;
    mode: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    ceilings: {
      maxEntriesPerWorkspace: number;
      defaultShortTermTtlSec: number;
      mode: string;
    };
    honesty: {
      mem0Os: boolean;
      infinitePersonalizationOs: boolean;
      replicationOs: boolean;
      encryptionKmsOs: boolean;
      regeneratesMemoryCloud: boolean;
      regeneratesKnowledgeMemory: boolean;
      extendsMemoryCloud: boolean;
      orgWorkspaceScoped: boolean;
      kernelLayerOnly: boolean;
      vectorSemanticOs: boolean;
    };
    links: Record<string, string>;
  }> {
    return this.requestJson('/v1/memory-runtime/engine', { method: 'GET' });
  }

  async promptRuntimeEngine(): Promise<{
    product: string;
    note: string;
    mode: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    ceilings: {
      maxRenderedChars: number;
      cacheTtlSec: number;
      mode: string;
    };
    honesty: {
      autoPromptResearchLab: boolean;
      llmAsJudgeEvalLab: boolean;
      promptMeshOs: boolean;
      redisPromptCacheOs: boolean;
      callsLlmOnExecute: boolean;
      regeneratesPromptIntelligence: boolean;
      regeneratesVl086: boolean;
      extendsPromptIntelligence: boolean;
      extendsVersionedPrompts: boolean;
      orgWorkspaceScoped: boolean;
      usesIntelligentCachePromptNamespace: boolean;
    };
    links: Record<string, string>;
  }> {
    return this.requestJson('/v1/prompt-runtime/engine', { method: 'GET' });
  }

  async promptRuntimeExecute(body: {
    key?: string;
    feature?: string;
    body?: string;
    version?: number;
    variables?: Record<string, string>;
    useCache?: boolean;
    skipSecurity?: boolean;
  }): Promise<{
    key: string;
    source: string;
    version: number | null;
    body: string;
    chars: number;
    cache: string;
    note?: string;
  }> {
    return this.requestJson('/v1/prompt-runtime/execute', {
      method: 'POST',
      body,
    });
  }

  async contextRuntimeEngine(): Promise<{
    product: string;
    note: string;
    mode: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    ceilings: {
      maxChars: number;
      cacheTtlSec: number;
      mode: string;
    };
    honesty: {
      infiniteContextWindow: boolean;
      llmSummarization: boolean;
      realtimePush: boolean;
      regeneratesContextEngine: boolean;
      extendsContextEngine: boolean;
      orgWorkspaceScoped: boolean;
      redisContextCacheOs: boolean;
      usesIntelligentCacheContextNamespace: boolean;
      modelRouterOs: boolean;
    };
    links: Record<string, string>;
  }> {
    return this.requestJson('/v1/context-runtime/engine', { method: 'GET' });
  }

  async contextRuntimeAssemble(body?: {
    query?: string;
    conversationId?: string;
    projectKey?: string;
    subjectUserId?: string;
    promptKey?: 'chat' | 'rag';
    modelHint?: string;
    providerHint?: string;
    include?: Record<string, boolean>;
    maxChars?: number;
    documentK?: number;
    memoryLimit?: number;
    useCache?: boolean;
    priorityOverrides?: Record<string, number>;
  }): Promise<{
    assembledAt: string;
    included: string[];
    promptContext: string;
    compression: {
      maxChars: number;
      beforeChars: number;
      afterChars: number;
      truncated: boolean;
    };
    cache: string;
    note?: string;
  }> {
    return this.requestJson('/v1/context-runtime/assemble', {
      method: 'POST',
      body: body ?? {},
    });
  }

  async reasoningRuntimeEngine(): Promise<{
    product: string;
    note: string;
    mode: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    ceilings: {
      maxHistoryPerWorkspace: number;
      mode: string;
    };
    honesty: {
      customReasonerKernel: boolean;
      symbolicReasonerOs: boolean;
      fullTreeOfThought: boolean;
      toolExecution: boolean;
      agentOs: boolean;
      llmAsJudgeEvalLab: boolean;
      droolsPegaBrms: boolean;
      regeneratesReasoningCloud: boolean;
      extendsReasoningCloud: boolean;
      orgWorkspaceScoped: boolean;
      storesHistoryInMemoryCloud: boolean;
    };
    links: Record<string, string>;
  }> {
    return this.requestJson('/v1/reasoning-runtime/engine', { method: 'GET' });
  }

  async reasoningRuntimePlan(body: {
    problem: string;
    language?: string;
    model?: string;
    retrieve?: boolean;
    sandboxOnly?: boolean;
  }): Promise<{
    strategy: string;
    problem: string;
    steps: string[];
    answer: string;
    historyId?: string | null;
    note?: string;
  }> {
    return this.requestJson('/v1/reasoning-runtime/plan', {
      method: 'POST',
      body,
    });
  }

  async reasoningRuntimeReason(body: {
    problem: string;
    strategy?: string;
    language?: string;
    model?: string;
    retrieve?: boolean;
    persist?: boolean;
  }): Promise<{
    strategy: string;
    steps: string[];
    answer: string;
    confidence?: { score: number; label: string };
    historyId?: string | null;
    note?: string;
  }> {
    return this.requestJson('/v1/reasoning-runtime/reason', {
      method: 'POST',
      body,
    });
  }

  async agentRuntimeEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    permissions: Array<{ id: string }>;
    deniedActions: Array<{ id: string }>;
    ceilings: {
      maxAgentsPerWorkspace: number;
      maxStepsPerRun: number;
      mode: string;
      liveToolExecution: boolean;
    };
    mode: string;
    honesty: {
      openToolExecution: boolean;
      liveExternalActionsByDefault: boolean;
      langGraphOs: boolean;
      autoGptOs: boolean;
      regeneratesVolumes1to7: boolean;
      scopedPermissionsRequired: boolean;
      sandboxRequired: boolean;
      policyHardGateRequired: boolean;
      policyRuntimeWired: boolean;
      localPermissionHardGate: boolean;
      orgWorkspaceScoped: boolean;
    };
    links: Record<string, string>;
    safety?: {
      scopedPermissionsRequired: boolean;
      sandboxRequired: boolean;
      openToolExecutionForbidden: boolean;
      policyMustHardGate: boolean;
      note: string;
    };
  }> {
    return this.requestJson('/v1/agent-runtime/engine', { method: 'GET' });
  }

  async agentRuntimeCreate(body: {
    name: string;
    permissions?: string[];
    goal?: string;
  }): Promise<{
    agent: {
      id: string;
      name: string;
      status: string;
      permissions: string[];
      goal?: string;
    };
    note?: string;
  }> {
    return this.requestJson('/v1/agent-runtime/agents', {
      method: 'POST',
      body,
    });
  }

  async agentRuntimeLifecycle(
    id: string,
    body: { status: string },
  ): Promise<{ agent: { id: string; status: string }; note?: string }> {
    return this.requestJson(`/v1/agent-runtime/agents/${encodeURIComponent(id)}/lifecycle`, {
      method: 'POST',
      body,
    });
  }

  async agentRuntimeRun(body: {
    agentId: string;
    goal?: string;
    actions?: Array<{ action: string; input?: Record<string, unknown> }>;
  }): Promise<{
    run: {
      id: string;
      agentId: string;
      status: string;
      sandbox: boolean;
      liveToolExecution: boolean;
      steps: Array<{
        action: string;
        allowed: boolean;
        simulated: boolean;
        error?: string;
      }>;
    };
    honesty?: { openToolExecution: boolean; simulatedSteps?: boolean };
    note?: string;
  }> {
    return this.requestJson('/v1/agent-runtime/run', {
      method: 'POST',
      body,
    });
  }

  async agentRuntimeCollaborate(body: {
    agentIds: string[];
    topic?: string;
    message?: string;
  }): Promise<{
    session: {
      id: string;
      topic: string;
      agentIds: string[];
      transcript: Array<{ from: string; to: string; body: string }>;
      sandbox: boolean;
    };
    note?: string;
  }> {
    return this.requestJson('/v1/agent-runtime/collaborate', {
      method: 'POST',
      body,
    });
  }

  async workflowRuntimeEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    permissions: Array<{ id: string }>;
    deniedActions: Array<{ id: string }>;
    ceilings: {
      maxWorkflowsPerWorkspace: number;
      maxStepsPerRun: number;
      maxRetries: number;
      mode: string;
      liveStepExecution: boolean;
    };
    mode: string;
    honesty: {
      openToolExecution: boolean;
      liveStepExecution: boolean;
      temporalOs: boolean;
      airflowOs: boolean;
      distributedWorkflowOs: boolean;
      regeneratesVolumes1to7: boolean;
      regeneratesWorkflowsProduct: boolean;
      extendsWorkflowsProduct: boolean;
      scopedPermissionsRequired: boolean;
      sandboxRequired: boolean;
      policyHardGateRequired: boolean;
      policyRuntimeWired: boolean;
      localPermissionHardGate: boolean;
      orgWorkspaceScoped: boolean;
    };
    links: Record<string, string>;
  }> {
    return this.requestJson('/v1/workflow-runtime/engine', { method: 'GET' });
  }

  async workflowRuntimeCreate(body: {
    name: string;
    permissions?: string[];
    mode?: string;
    steps?: Array<{ action: string; input?: Record<string, unknown> }>;
    requiresApproval?: boolean;
  }): Promise<{
    workflow: {
      id: string;
      name: string;
      status: string;
      version: number;
      permissions: string[];
    };
    note?: string;
  }> {
    return this.requestJson('/v1/workflow-runtime/workflows', {
      method: 'POST',
      body,
    });
  }

  async workflowRuntimeLifecycle(
    id: string,
    body: { status: string },
  ): Promise<{ workflow: { id: string; status: string }; note?: string }> {
    return this.requestJson(`/v1/workflow-runtime/workflows/${encodeURIComponent(id)}/lifecycle`, {
      method: 'POST',
      body,
    });
  }

  async workflowRuntimeRun(body: {
    workflowId: string;
    approved?: boolean;
    forceFailAction?: string;
  }): Promise<{
    run: {
      id: string;
      workflowId: string;
      status: string;
      sandbox: boolean;
      liveStepExecution: boolean;
      steps: Array<{ action: string; allowed: boolean; simulated: boolean; attempt: number }>;
    };
    note?: string;
  }> {
    return this.requestJson('/v1/workflow-runtime/run', {
      method: 'POST',
      body,
    });
  }

  async pluginRuntimeEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    permissions: Array<{ id: string }>;
    deniedActions: Array<{ id: string }>;
    ceilings: {
      maxPluginsPerWorkspace: number;
      maxInvokeSteps: number;
      mode: string;
      liveCodeExecution: boolean;
    };
    mode: string;
    honesty: {
      openToolExecution: boolean;
      liveCodeExecution: boolean;
      browserExtensionOs: boolean;
      vsCodeExtensionOs: boolean;
      wasmPluginOs: boolean;
      regeneratesVolumes1to7: boolean;
      regeneratesMarketplace: boolean;
      extendsMarketplace: boolean;
      scopedPermissionsRequired: boolean;
      sandboxRequired: boolean;
      policyHardGateRequired: boolean;
      policyRuntimeWired: boolean;
      localPermissionHardGate: boolean;
      orgWorkspaceScoped: boolean;
    };
    links: Record<string, string>;
  }> {
    return this.requestJson('/v1/plugin-runtime/engine', { method: 'GET' });
  }

  async pluginRuntimeRegister(body: {
    name: string;
    permissions?: string[];
    dependencies?: string[];
    description?: string;
  }): Promise<{
    plugin: {
      id: string;
      name: string;
      status: string;
      version: number;
      permissions: string[];
    };
    note?: string;
  }> {
    return this.requestJson('/v1/plugin-runtime/plugins', {
      method: 'POST',
      body,
    });
  }

  async pluginRuntimeLifecycle(
    id: string,
    body: { status: string },
  ): Promise<{ plugin: { id: string; status: string }; note?: string }> {
    return this.requestJson(`/v1/plugin-runtime/plugins/${encodeURIComponent(id)}/lifecycle`, {
      method: 'POST',
      body,
    });
  }

  async pluginRuntimeInvoke(body: {
    pluginId: string;
    actions?: Array<{ action: string; input?: Record<string, unknown> }>;
    payload?: Record<string, unknown>;
  }): Promise<{
    invocation: {
      id: string;
      pluginId: string;
      status: string;
      sandbox: boolean;
      liveCodeExecution: boolean;
      steps: Array<{ action: string; allowed: boolean; simulated: boolean }>;
    };
    note?: string;
  }> {
    return this.requestJson('/v1/plugin-runtime/invoke', {
      method: 'POST',
      body,
    });
  }

  async policyRuntimeEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    globalDenies: Array<{ id: string }>;
    kinds: Array<{ id: string }>;
    ceilings: {
      maxPoliciesPerWorkspace: number;
      mode: string;
      logOnlyForbidden: boolean;
      hardGateRequired: boolean;
    };
    mode: string;
    honesty: {
      hardGate: boolean;
      logOnly: boolean;
      logOnlyForbidden: boolean;
      opaOs: boolean;
      cedarOs: boolean;
      enterpriseGrcOs: boolean;
      regeneratesVolumes1to7: boolean;
      wiredIntoAgentRuntime: boolean;
      wiredIntoWorkflowRuntime: boolean;
      wiredIntoPluginRuntime: boolean;
      orgWorkspaceScoped: boolean;
    };
    links: Record<string, string>;
  }> {
    return this.requestJson('/v1/policy-runtime/engine', { method: 'GET' });
  }

  async policyRuntimeEvaluate(body: {
    runtime?: string;
    subjectId?: string;
    action: string;
    permissions?: string[];
  }): Promise<{
    allowed: boolean;
    hardGate: boolean;
    logOnly: boolean;
    reason: string;
    matchedPolicyIds: string[];
    engine: string;
  }> {
    return this.requestJson('/v1/policy-runtime/evaluate', {
      method: 'POST',
      body,
    });
  }

  async policyRuntimeCreate(body: {
    name: string;
    kind?: string;
    effect?: string;
    actions: string[];
    targets?: string[];
    region?: string;
    enabled?: boolean;
  }): Promise<{
    policy: {
      id: string;
      name: string;
      kind: string;
      effect: string;
      actions: string[];
      enabled: boolean;
    };
    note?: string;
  }> {
    return this.requestJson('/v1/policy-runtime/policies', {
      method: 'POST',
      body,
    });
  }

  async memoryRuntimePut(body: {
    scope?: string;
    kind?: string;
    content: string;
    key?: string;
    conversationId?: string;
    agentId?: string;
    subjectUserId?: string;
    ttlSec?: number;
    encrypt?: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<{
    memory: {
      id: string;
      scope: string;
      kind: string;
      content: string;
      version: number;
    };
    note?: string;
  }> {
    return this.requestJson('/v1/memory-runtime/put', {
      method: 'POST',
      body,
    });
  }

  async gpuPlatformEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      gpuHyperscalerOs: boolean;
      callsCloudGpuApis: boolean;
      openEndedGpuAutoscale: boolean;
      hardSpendCeilingsRequired: boolean;
      sandboxLogicalOnly: boolean;
    };
    ceilings: {
      maxInstances: number;
      maxSpendUsd: number;
      provisionMode: string;
    };
  }> {
    return this.requestJson('/v1/gpu-platform/engine', { method: 'GET' });
  }

  async gpuPlatformPools(params?: { vendor?: string }): Promise<{
    pools: Array<{
      id: string;
      vendor: string;
      name: string;
      estimatedHourlyUsd: number;
      status: string;
    }>;
  }> {
    const q = new URLSearchParams();
    if (params?.vendor) q.set('vendor', params.vendor);
    const suffix = q.toString() ? `?${q}` : '';
    return this.requestJson(`/v1/gpu-platform/pools${suffix}`, { method: 'GET' });
  }

  async gpuPlatformAllocate(input: {
    poolId: string;
    instances?: number;
    purpose?: string;
    reservationHours?: number;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/gpu-platform/allocations', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async gpuPlatformScale(
    id: string,
    input: { targetInstances: number },
  ): Promise<Record<string, unknown>> {
    return this.requestJson(`/v1/gpu-platform/allocations/${id}/scale`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async modelServingEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      vllmOs: boolean;
      kserveOs: boolean;
      tritonOs: boolean;
      selfHostedGpuServingOs: boolean;
      regeneratesAiGateway: boolean;
      extendsAiGateway: boolean;
      extendsModelRegistry: boolean;
      orgWorkspaceScoped: boolean;
      sandboxDeploymentsOnly: boolean;
    };
    ceilings: {
      maxActiveDeployments: number;
      mode: string;
    };
  }> {
    return this.requestJson('/v1/model-serving/engine', { method: 'GET' });
  }

  async modelServingKinds(): Promise<{
    kinds: Array<{
      id: string;
      name: string;
      status: string;
      registryFeatures: string[];
      gatewayApis: string[];
    }>;
  }> {
    return this.requestJson('/v1/model-serving/kinds', { method: 'GET' });
  }

  async modelServingEndpoints(params?: { kind?: string }): Promise<{
    endpoints: Array<{
      kind: string;
      api: string;
      status: string;
    }>;
  }> {
    const q = new URLSearchParams();
    if (params?.kind) q.set('kind', params.kind);
    const suffix = q.toString() ? `?${q}` : '';
    return this.requestJson(`/v1/model-serving/endpoints${suffix}`, { method: 'GET' });
  }

  async modelServingDeploy(input: {
    kind: string;
    modelSlug: string;
    version?: string;
    strategy?: string;
    trafficPercent?: number;
    slot?: string;
    label?: string;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/model-serving/deployments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async modelServingPromote(id: string): Promise<Record<string, unknown>> {
    return this.requestJson(`/v1/model-serving/deployments/${id}/promote`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async aiRouterEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      serviceMeshOs: boolean;
      multiCloudRouterOs: boolean;
      regeneratesAiGateway: boolean;
      extendsAiGateway: boolean;
      dryRunResolveOnly: boolean;
      enforcesSpendCaps: boolean;
    };
    mode: string;
  }> {
    return this.requestJson('/v1/ai-router/engine', { method: 'GET' });
  }

  async aiRouterResolve(input: {
    feature?: string;
    optimize?: string;
    preferProvider?: string;
    preferRegion?: string;
    allowFallback?: boolean;
    streaming?: boolean;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/ai-router/resolve', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async aiRouterUpsertPolicy(input: {
    optimize?: string;
    maxRetries?: number;
    preferRegion?: string;
    allowFallback?: boolean;
    preferProvider?: string | null;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/ai-router/policies', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async streamingRuntimeEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      websocketOs: boolean;
      grpcStreamingOs: boolean;
      videoStreamingOs: boolean;
      regeneratesExistingStreams: boolean;
      extendsExistingSse: boolean;
      sandboxChunkStream: boolean;
    };
    mode: string;
  }> {
    return this.requestJson('/v1/streaming-runtime/engine', { method: 'GET' });
  }

  async streamingRuntimeSurfaces(params?: { kind?: string }): Promise<{
    surfaces: Array<{
      id: string;
      kind: string;
      status: string;
      transport: string;
      api: string | null;
    }>;
  }> {
    const q = new URLSearchParams();
    if (params?.kind) q.set('kind', params.kind);
    const suffix = q.toString() ? `?${q}` : '';
    return this.requestJson(`/v1/streaming-runtime/surfaces${suffix}`, { method: 'GET' });
  }

  async streamingRuntimeCreateSession(input: {
    kind?: string;
    label?: string;
    text?: string;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/streaming-runtime/sessions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async batchRuntimeEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      sparkOs: boolean;
      airflowOs: boolean;
      regeneratesJobsApi: boolean;
      extendsBullMqJobs: boolean;
      distributedBatchOs: boolean;
    };
    mode: string;
  }> {
    return this.requestJson('/v1/batch-runtime/engine', { method: 'GET' });
  }

  async batchRuntimeCreateRun(input: {
    kind: string;
    items: unknown[];
    priority?: string;
    source?: string;
    target?: string;
    label?: string;
    maxRetries?: number;
    runAt?: string;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/batch-runtime/runs', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async intelligentCacheEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      redisClusterOs: boolean;
      vectorSemanticOs: boolean;
      cdnOs: boolean;
      autoWiresGatewayResponses: boolean;
      exactKeyLookup: boolean;
    };
    mode: string;
  }> {
    return this.requestJson('/v1/intelligent-cache/engine', { method: 'GET' });
  }

  async intelligentCachePut(input: {
    namespace: string;
    key?: string;
    text?: string;
    value?: unknown;
    ttlSec?: number;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/intelligent-cache/put', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async intelligentCacheLookup(input: {
    namespace: string;
    key?: string;
    text?: string;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/intelligent-cache/lookup', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async costOptimizationEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      finOpsOs: boolean;
      cloudSpotApis: boolean;
      reservedInstanceMarketplace: boolean;
      openEndedAutoscale: boolean;
      enforcesSpendCaps: boolean;
      reportOnly: boolean;
    };
    mode: string;
  }> {
    return this.requestJson('/v1/cost-optimization/engine', { method: 'GET' });
  }

  async costOptimizationRecord(input: {
    category: string;
    amountUsd: number;
    feature?: string;
    providerId?: string;
    label?: string;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/cost-optimization/record', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async costOptimizationOptimize(input: {
    feature?: string;
    tokensPer1k?: number;
  }): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/cost-optimization/optimize', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async aiRuntimeAnalyticsEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      biDashboardOs: boolean;
      apmOs: boolean;
      cloudGpuTelemetryOs: boolean;
      regeneratesIntelligenceAnalytics: boolean;
      aggregatesOnly: boolean;
    };
    mode: string;
  }> {
    return this.requestJson('/v1/ai-runtime-analytics/engine', { method: 'GET' });
  }

  async aiRuntimeAnalyticsOverview(input?: {
    from?: string;
    to?: string;
  }): Promise<Record<string, unknown>> {
    const q = new URLSearchParams();
    if (input?.from) q.set('from', input.from);
    if (input?.to) q.set('to', input.to);
    const suffix = q.toString() ? `?${q}` : '';
    return this.requestJson(`/v1/ai-runtime-analytics/overview${suffix}`, {
      method: 'GET',
    });
  }

  async aiRuntimeAnalyticsReport(input?: {
    from?: string;
    to?: string;
  }): Promise<Record<string, unknown>> {
    const q = new URLSearchParams();
    if (input?.from) q.set('from', input.from);
    if (input?.to) q.set('to', input.to);
    const suffix = q.toString() ? `?${q}` : '';
    return this.requestJson(`/v1/ai-runtime-analytics/report${suffix}`, {
      method: 'GET',
    });
  }

  async knowledgeBaseEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      confluenceOs: boolean;
      sharePointParity: boolean;
      approvalWorkflow: boolean;
      multimodalMediaIngest: boolean;
      ocrLayoutTables: boolean;
      orgWorkspaceScoped: boolean;
      extendsVl062: boolean;
      regeneratesVl062: boolean;
    };
  }> {
    return this.requestJson('/v1/knowledge-base/engine', { method: 'GET' });
  }

  async enterpriseSearchEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      elasticOs: boolean;
      openSearchParity: boolean;
      bm25Parity: boolean;
      imageSearch: boolean;
      voiceSearch: boolean;
      orgWorkspaceScoped: boolean;
      extendsVl062: boolean;
      extendsVectorCloud: boolean;
    };
  }> {
    return this.requestJson('/v1/enterprise-search/engine', { method: 'GET' });
  }

  async enterpriseSearch(body: {
    query: string;
    mode?: 'keyword' | 'semantic' | 'hybrid';
    k?: number;
    collection?: string;
    tag?: string;
    contentKind?: string;
    documentId?: string;
    minScore?: number;
  }): Promise<{
    query: string;
    mode: string;
    hits: Array<{
      rank: number;
      id: string;
      documentId: string;
      filename: string;
      ordinal: number;
      score: number;
      content: string;
      source: string;
    }>;
    note: string;
  }> {
    return this.requestJson('/v1/enterprise-search/search', {
      method: 'POST',
      body,
    });
  }

  async ontologyEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      owlOs: boolean;
      protegeParity: boolean;
      rdfTripleStore: boolean;
      certifiedVerticalOntologies: boolean;
      orgWorkspaceScoped: boolean;
      extendsKnowledgeGraph: boolean;
      extendsVl184: boolean;
    };
  }> {
    return this.requestJson('/v1/ontology/engine', { method: 'GET' });
  }

  async taxonomyEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      enterpriseTaxonomyOs: boolean;
      mlAutoClassification: boolean;
      schemaRegistry: boolean;
      orgWorkspaceScoped: boolean;
      extendsKnowledgeBase: boolean;
      distinctFromOntology: boolean;
    };
  }> {
    return this.requestJson('/v1/taxonomy/engine', { method: 'GET' });
  }

  async enterpriseRagEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      langchainOs: boolean;
      llamaindexParity: boolean;
      agenticRagOs: boolean;
      bm25Parity: boolean;
      learnedRanker: boolean;
      regeneratesVl062: boolean;
      extendsVl062: boolean;
      extendsEnterpriseSearch: boolean;
      orgWorkspaceScoped: boolean;
      handVerifyRequired: boolean;
    };
  }> {
    return this.requestJson('/v1/enterprise-rag/engine', { method: 'GET' });
  }

  async enterpriseRagRetrieve(body: {
    query: string;
    mode?: 'keyword' | 'semantic' | 'hybrid';
    k?: number;
    maxChars?: number;
    collection?: string;
    tag?: string;
    contentKind?: string;
    documentId?: string;
    minScore?: number;
  }): Promise<{
    query: string;
    mode: string;
    passages: Array<{
      rank: number;
      id: string;
      documentId: string;
      filename: string;
      ordinal: number;
      score: number;
      content: string;
      source: string;
    }>;
    citations: Array<{
      index: number;
      documentId: string;
      chunkId: string;
      filename: string;
      snippet: string;
      score: number;
    }>;
    context: {
      passageCount: number;
      droppedDuplicates: number;
      maxChars: number;
      truncated: boolean;
      totalChars: number;
    };
    note: string;
  }> {
    return this.requestJson('/v1/enterprise-rag/retrieve', {
      method: 'POST',
      body,
    });
  }

  async enterpriseRagQuery(body: {
    question: string;
    mode?: 'keyword' | 'semantic' | 'hybrid';
    k?: number;
    maxChars?: number;
    collection?: string;
    tag?: string;
    contentKind?: string;
    documentId?: string;
  }): Promise<{
    answer: string;
    citations: Array<{
      index: number;
      documentId: string;
      chunkId: string;
      filename: string;
      snippet: string;
      score: number;
    }>;
    mode: string;
    grounded: boolean;
    model: string | null;
    provider: string | null;
    note?: string;
  }> {
    return this.requestJson('/v1/enterprise-rag/query', {
      method: 'POST',
      body,
    });
  }

  async knowledgeMemoryEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      mem0Os: boolean;
      zepParity: boolean;
      infinitePersonalizationOs: boolean;
      regeneratesMemoryCloud: boolean;
      extendsVl183: boolean;
      distinctFromMemoryCloud: boolean;
      orgWorkspaceScoped: boolean;
      gdprViaMemoryCloud: boolean;
    };
  }> {
    return this.requestJson('/v1/knowledge-memory/engine', { method: 'GET' });
  }

  async knowledgeMemoryCreate(body: {
    scope?: 'organization' | 'workspace' | 'user' | 'conversation' | 'ai';
    kind?: string;
    content: string;
    key?: string;
    subjectUserId?: string;
    agentId?: string;
    conversationId?: string;
    documentId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{
    id: string;
    scope: string;
    content: string;
    version: number;
    documentId: string | null;
    layer: string;
  }> {
    return this.requestJson('/v1/knowledge-memory/memories', {
      method: 'POST',
      body,
    });
  }

  async knowledgeMemoryEvolve(
    id: string,
    body: { content: string; reason?: string },
  ): Promise<{ id: string; version: number; content: string; evolutionCount: number }> {
    return this.requestJson(`/v1/knowledge-memory/memories/${id}/evolve`, {
      method: 'POST',
      body,
    });
  }

  async knowledgeIntelligenceEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      biOs: boolean;
      palantirParity: boolean;
      mlNearDuplicate: boolean;
      calibratedConfidence: boolean;
      regeneratesIntelligenceAnalytics: boolean;
      regeneratesVl191: boolean;
      orgWorkspaceScoped: boolean;
      extendsKnowledgeCloud: boolean;
    };
  }> {
    return this.requestJson('/v1/knowledge-intelligence/engine', { method: 'GET' });
  }

  async knowledgeIntelligenceDiscover(body: {
    query: string;
    limit?: number;
  }): Promise<{
    query: string;
    documents: Array<{ id: string; filename: string; status: string }>;
    taxonomyTerms: Array<{ id: string; name: string; slug: string }>;
    ontologyConcepts: Array<{ id: string; name: string; type: string }>;
    note: string;
  }> {
    return this.requestJson('/v1/knowledge-intelligence/discover', {
      method: 'POST',
      body,
    });
  }

  async knowledgeIntelligenceInsight(): Promise<{
    documents: number;
    ready: number;
    failed: number;
    chunks: number;
    taxonomyTerms: number;
    ontologyConcepts: number;
    knowledgeMemories: number;
  }> {
    return this.requestJson('/v1/knowledge-intelligence/insight', { method: 'GET' });
  }

  async knowledgeApisEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      grpcOs: boolean;
      kafkaEventStreamingOs: boolean;
      sdkGeneratorOs: boolean;
      regeneratesDeveloperCloud: boolean;
      regeneratesVl062: boolean;
      extendsExistingKnowledgeApis: boolean;
      orgWorkspaceScoped: boolean;
      openapiSharedDocument: boolean;
    };
  }> {
    return this.requestJson('/v1/knowledge-apis/engine', { method: 'GET' });
  }

  async knowledgeApisSurfaces(): Promise<{
    surfaces: Array<{
      product: string;
      rest: string[];
      graphql: string[];
      console: string | null;
    }>;
    note: string;
  }> {
    return this.requestJson('/v1/knowledge-apis/surfaces', { method: 'GET' });
  }

  async knowledgeAnalyticsEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      regeneratesLanguageAnalytics: boolean;
      regeneratesSpeechAnalytics: boolean;
      regeneratesVoiceAnalytics: boolean;
      regeneratesIntelligenceAnalytics: boolean;
      biDashboardOs: boolean;
      enterpriseReportingSuite: boolean;
      aggregatesOnly: boolean;
      orgWorkspaceScoped: boolean;
      calibratedConfidence: boolean;
    };
  }> {
    return this.requestJson('/v1/knowledge-analytics/engine', { method: 'GET' });
  }

  async knowledgeAnalyticsOverview(params?: {
    from?: string;
    to?: string;
  }): Promise<Record<string, unknown>> {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const suffix = q.toString() ? `?${q}` : '';
    return this.requestJson(`/v1/knowledge-analytics/overview${suffix}`, {
      method: 'GET',
    });
  }

  async knowledgeAnalyticsReport(params?: {
    from?: string;
    to?: string;
  }): Promise<Record<string, unknown>> {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const suffix = q.toString() ? `?${q}` : '';
    return this.requestJson(`/v1/knowledge-analytics/report${suffix}`, {
      method: 'GET',
    });
  }

  async embeddingCloudEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      trainsEmbeddingModels: boolean;
      multimodalOs: boolean;
      speechImageVideo: boolean;
    };
  }> {
    return this.requestJson('/v1/embedding-cloud/engine', { method: 'GET' });
  }

  async embeddingCloudModels(): Promise<{
    models: Array<{
      id: string;
      provider: string;
      modalities: string[];
      dimensions: number;
      default: boolean;
      status: string;
    }>;
  }> {
    return this.requestJson('/v1/embedding-cloud/models', { method: 'GET' });
  }

  async vectorCloudEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      managedVectorDbOs: boolean;
      pineconeParity: boolean;
      hybridBm25: boolean;
      customSharding: boolean;
    };
  }> {
    return this.requestJson('/v1/vector-cloud/engine', { method: 'GET' });
  }

  async vectorCloudSearch(body: {
    query: string;
    k?: number;
    documentId?: string;
    minScore?: number;
  }): Promise<{
    query: string;
    namespace: string;
    collection: string;
    backend: string;
    metric: string;
    hits: Array<{
      rank: number;
      id: string;
      documentId: string;
      filename: string;
      ordinal: number;
      score: number;
      content: string;
    }>;
    note: string;
  }> {
    return this.requestJson('/v1/vector-cloud/search', {
      method: 'POST',
      body,
    });
  }

  async memoryCloudEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      infinitePersonalizationOs: boolean;
      vectorSemanticMemory: boolean;
      agentOs: boolean;
      automatedRetentionSweeper: boolean;
      gdprExport: boolean;
      gdprErase: boolean;
    };
  }> {
    return this.requestJson('/v1/memory-cloud/engine', { method: 'GET' });
  }

  async memoryCloudExport(body?: { subjectUserId?: string }): Promise<{
    exportedAt: string;
    count: number;
    memories: Array<{ id: string; content: string; scope: string; kind: string }>;
    note: string;
  }> {
    return this.requestJson('/v1/memory-cloud/export', {
      method: 'POST',
      body: body ?? {},
    });
  }

  async memoryCloudErase(body: {
    subjectUserId?: string;
    confirm: boolean;
    hard?: boolean;
  }): Promise<{ erased: boolean; count: number; note: string }> {
    return this.requestJson('/v1/memory-cloud/erase', {
      method: 'POST',
      body,
    });
  }

  async knowledgeGraphEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      neo4jParity: boolean;
      ontologyPlatform: boolean;
      taxonomyPlatform: boolean;
      preferRag: boolean;
      verticalDomainPacks: boolean;
    };
  }> {
    return this.requestJson('/v1/knowledge-graph/engine', { method: 'GET' });
  }

  async knowledgeGraphCreateEntity(body: {
    name: string;
    type?: string;
    description?: string;
    documentId?: string;
    domain?: string;
    aliases?: string[];
  }): Promise<{
    id: string;
    name: string;
    type: string;
    domain: string;
    documentId: string | null;
  }> {
    return this.requestJson('/v1/knowledge-graph/entities', {
      method: 'POST',
      body,
    });
  }

  async contextEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      infiniteContextWindow: boolean;
      llmSummarization: boolean;
      realtimePush: boolean;
      orchestratesExisting: boolean;
    };
  }> {
    return this.requestJson('/v1/context-engine/engine', { method: 'GET' });
  }

  async contextAssemble(body?: {
    query?: string;
    conversationId?: string;
    projectKey?: string;
    subjectUserId?: string;
    promptKey?: 'chat' | 'rag';
    maxChars?: number;
    documentK?: number;
    memoryLimit?: number;
  }): Promise<{
    assembledAt: string;
    included: string[];
    promptContext: string;
    compression: {
      maxChars: number;
      beforeChars: number;
      afterChars: number;
      truncated: boolean;
    };
    note: string;
  }> {
    return this.requestJson('/v1/context-engine/assemble', {
      method: 'POST',
      body: body ?? {},
    });
  }

  async reasoningCloudEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      customReasonerKernel: boolean;
      symbolicReasonerOs: boolean;
      fullTreeOfThought: boolean;
      agentOs: boolean;
      toolExecution: boolean;
      llmGateway: boolean;
    };
  }> {
    return this.requestJson('/v1/reasoning-cloud/engine', { method: 'GET' });
  }

  async reasoningCloudReason(body: {
    problem: string;
    strategy?: string;
    language?: string;
    retrieve?: boolean;
  }): Promise<{
    strategy: string;
    steps: string[];
    answer: string;
    provider: string;
    note: string;
  }> {
    return this.requestJson('/v1/reasoning-cloud/reason', {
      method: 'POST',
      body,
    });
  }

  async recommendationEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      retailRecommenderOs: boolean;
      collaborativeFiltering: boolean;
      banditsFeatureStore: boolean;
      trainsRankingModels: boolean;
      lightRankers: boolean;
    };
  }> {
    return this.requestJson('/v1/recommendation-engine/engine', { method: 'GET' });
  }

  async recommend(body: {
    kind: string;
    query?: string;
    language?: string;
    k?: number;
  }): Promise<{
    kind: string;
    items: Array<{ id: string; title: string; score: number; reason: string }>;
    note: string;
  }> {
    return this.requestJson('/v1/recommendation-engine/recommend', {
      method: 'POST',
      body,
    });
  }

  async promptIntelligenceEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      autoPromptResearchLab: boolean;
      trainsPromptOptimizers: boolean;
      llmAsJudgeEvalLab: boolean;
      redTeamHarnessOs: boolean;
      extendsVersionedPrompts: boolean;
    };
  }> {
    return this.requestJson('/v1/prompt-intelligence/engine', { method: 'GET' });
  }

  async promptIntelligencePreview(body: {
    key: string;
    body?: string;
    version?: number;
  }): Promise<{
    key: string;
    source: string;
    body: string;
    chars: number;
    note: string;
  }> {
    return this.requestJson('/v1/prompt-intelligence/preview', {
      method: 'POST',
      body,
    });
  }

  async promptIntelligenceEvaluate(body: {
    key: string;
    body?: string;
    version?: number;
  }): Promise<{
    key: string;
    score: number;
    findings: Array<{ id: string; severity: string; message: string }>;
    note: string;
  }> {
    return this.requestJson('/v1/prompt-intelligence/evaluate', {
      method: 'POST',
      body,
    });
  }

  async decisionEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      enterpriseBrms: boolean;
      droolsPegaParity: boolean;
      lightRules: boolean;
      trainsDecisionModels: boolean;
      executesTools: boolean;
    };
  }> {
    return this.requestJson('/v1/decision-engine/engine', { method: 'GET' });
  }

  async decide(body: {
    kind: string;
    query?: string;
    family?: string;
    quality?: string;
    signalStrength?: number;
    matched?: boolean;
  }): Promise<{
    kind: string;
    decision: string;
    confidence: number;
    reasons: string[];
    note: string;
  }> {
    return this.requestJson('/v1/decision-engine/decide', {
      method: 'POST',
      body,
    });
  }

  async aiOrchestrationEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      multiCloudAgentOs: boolean;
      langGraphOs: boolean;
      distributedAiFabric: boolean;
      loadBearingE2e: boolean;
      executesRealRequests: boolean;
    };
  }> {
    return this.requestJson('/v1/ai-orchestration/engine', { method: 'GET' });
  }

  async aiOrchestrationRun(body: {
    pipeline: string;
    text: string;
    source?: string;
    target?: string;
    ops?: string[];
    model?: string;
  }): Promise<{
    pipeline: string;
    steps: Array<{ id: string; op: string; ok: boolean; durationMs: number }>;
    result: string;
    note: string;
  }> {
    return this.requestJson('/v1/ai-orchestration/run', {
      method: 'POST',
      body,
    });
  }

  async intelligenceAnalyticsEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      regeneratesLanguageAnalytics: boolean;
      regeneratesSpeechAnalytics: boolean;
      regeneratesVoiceAnalytics: boolean;
      biDashboardOs: boolean;
      aggregatesOnly: boolean;
    };
  }> {
    return this.requestJson('/v1/intelligence-analytics/engine', { method: 'GET' });
  }

  async intelligenceAnalyticsOverview(params?: {
    from?: string;
    to?: string;
  }): Promise<{
    periodStart: string;
    periodEnd: string;
    estimatedCostUsd: number;
    note: string;
  }> {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const suffix = qs.toString() ? `?${qs}` : '';
    return this.requestJson(`/v1/intelligence-analytics/overview${suffix}`, {
      method: 'GET',
    });
  }

  async intelligenceAnalyticsReport(params?: {
    from?: string;
    to?: string;
  }): Promise<{ generatedAt: string; note: string }> {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const suffix = qs.toString() ? `?${qs}` : '';
    return this.requestJson(`/v1/intelligence-analytics/report${suffix}`, {
      method: 'GET',
    });
  }

  async neuralTtsEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
  }> {
    return this.requestJson('/v1/tts/engine', { method: 'GET' });
  }

  async neuralTtsVoices(params?: {
    gender?: string;
    language?: string;
    personality?: string;
    category?: string;
  }): Promise<{
    data: Array<{
      id: string;
      name: string;
      gender: string;
      languages: string[];
      provider: string;
      personality: string;
      ageGroup: string;
      dialect: string | null;
      accent: string | null;
      category: string;
    }>;
  }> {
    const qs = new URLSearchParams();
    if (params?.gender) qs.set('gender', params.gender);
    if (params?.language) qs.set('language', params.language);
    if (params?.personality) qs.set('personality', params.personality);
    if (params?.category) qs.set('category', params.category);
    const suffix = qs.toString() ? `?${qs}` : '';
    return this.requestJson(`/v1/tts/voices${suffix}`, { method: 'GET' });
  }

  async voiceCloningEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    trust: {
      consentRequired: boolean;
      ownershipAttestation: boolean;
      abuseReview: boolean;
      watermarkRequired: boolean;
    };
  }> {
    return this.requestJson('/v1/voice-cloning/engine', { method: 'GET' });
  }

  async voiceCloningConsentPolicy(): Promise<{
    product: string;
    required: Record<string, unknown>;
    forbidden: string[];
  }> {
    return this.requestJson('/v1/voice-cloning/consent/policy', { method: 'GET' });
  }

  async emotionVoiceEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
  }> {
    return this.requestJson('/v1/emotion-voice/engine', { method: 'GET' });
  }

  async emotionVoiceProfiles(): Promise<{
    profiles: Array<{
      id: string;
      name: string;
      category: string;
      description: string;
      preferredVoice: string;
    }>;
  }> {
    return this.requestJson('/v1/emotion-voice/profiles', { method: 'GET' });
  }

  async voiceStudioEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: { nonlinearDaw: boolean; vendorSsmlPassthrough: boolean };
  }> {
    return this.requestJson('/v1/voice-studio/engine', { method: 'GET' });
  }

  async voiceStudioLibrary(): Promise<{
    voices: Array<{ id: string; name: string; provider: string }>;
    count: number;
  }> {
    return this.requestJson('/v1/voice-studio/library', { method: 'GET' });
  }

  async voiceEnhancementEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: { spectralMlDenoise: boolean; liveAec: boolean };
  }> {
    return this.requestJson('/v1/voice-enhancement/engine', { method: 'GET' });
  }

  async voiceEnhancementProfiles(): Promise<{
    profiles: Array<{
      id: string;
      name: string;
      category: string;
      description: string;
    }>;
  }> {
    return this.requestJson('/v1/voice-enhancement/profiles', { method: 'GET' });
  }

  async voiceBiometricsEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: { nistCertified: boolean; padCertified: boolean };
  }> {
    return this.requestJson('/v1/voice-biometrics/engine', { method: 'GET' });
  }

  async voiceBiometricsEncryption(): Promise<{
    algorithm: string;
    keyConfigured: boolean;
    keySource: string;
  }> {
    return this.requestJson('/v1/voice-biometrics/encryption', { method: 'GET' });
  }

  async voiceMarketplaceEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: { celebrityWithoutRights: boolean; crossTenantCloneSynthesis: boolean };
  }> {
    return this.requestJson('/v1/voice-marketplace/engine', { method: 'GET' });
  }

  async voiceMarketplaceLanguagePacks(): Promise<{
    packs: Array<{ id: string; title: string; language: string; voices: string[] }>;
  }> {
    return this.requestJson('/v1/voice-marketplace/language-packs', { method: 'GET' });
  }

  async voiceAnalyticsEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
    honesty: {
      regeneratesSpeechAnalytics: boolean;
      biDashboardProduct: boolean;
      fullHttpLatencyP95: boolean;
    };
  }> {
    return this.requestJson('/v1/voice-analytics/engine', { method: 'GET' });
  }

  async voiceAnalyticsOverview(params?: { from?: string; to?: string }): Promise<{
    periodStart: string;
    periodEnd: string;
    estimatedCostUsd: number;
    usage: { tts: { requests: number; characters: number } };
    revenueCents: number;
    note: string;
  }> {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return this.requestJson(`/v1/voice-analytics/overview${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }

  async voiceAnalyticsReport(params?: { from?: string; to?: string }): Promise<{
    product: string;
    generatedAt: string;
    note: string;
  }> {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return this.requestJson(`/v1/voice-analytics/report${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }

  async speechEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
  }> {
    return this.requestJson('/v1/speech/engine', { method: 'GET' });
  }

  async speechVocabularyPacks(): Promise<{
    packs: Array<{
      id: string;
      name: string;
      description: string;
      phraseCount: number;
      phrases: string[];
    }>;
  }> {
    return this.requestJson('/v1/speech/vocabulary/packs', { method: 'GET' });
  }

  async speakerEngine(): Promise<{
    product: string;
    note: string;
    capabilities: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      notes: string;
    }>;
  }> {
    return this.requestJson('/v1/speakers/engine', { method: 'GET' });
  }

  async speakerProfiles(): Promise<{
    data: Array<{
      id: string;
      displayName: string;
      status: string;
      enrolled: boolean;
      enrollmentCount: number;
    }>;
    note: string;
  }> {
    return this.requestJson('/v1/speakers/profiles', { method: 'GET' });
  }

  async createSpeakerProfile(input: {
    displayName: string;
    externalRef?: string;
  }): Promise<{
    id: string;
    displayName: string;
    status: string;
    enrolled: boolean;
  }> {
    return this.requestJson('/v1/speakers/profiles', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async enrollSpeaker(input: {
    profileId: string;
    file: UploadFile;
  }): Promise<Record<string, unknown>> {
    const form = new FormData();
    form.append('file', toBlob(input.file), input.file.filename);
    return this.requestForm(`/v1/speakers/profiles/${encodeURIComponent(input.profileId)}/enroll`, form);
  }

  async verifySpeaker(input: {
    profileId: string;
    file: UploadFile;
    threshold?: number;
  }): Promise<Record<string, unknown>> {
    const form = new FormData();
    form.append('file', toBlob(input.file), input.file.filename);
    form.append('profileId', input.profileId);
    if (input.threshold != null) form.append('threshold', String(input.threshold));
    return this.requestForm('/v1/speakers/verify', form);
  }

  async identifySpeaker(input: {
    file: UploadFile;
    threshold?: number;
    topK?: number;
  }): Promise<Record<string, unknown>> {
    const form = new FormData();
    form.append('file', toBlob(input.file), input.file.filename);
    if (input.threshold != null) form.append('threshold', String(input.threshold));
    if (input.topK != null) form.append('topK', String(input.topK));
    return this.requestForm('/v1/speakers/identify', form);
  }

  async diarizeSpeech(input: {
    file: UploadFile;
    language?: string;
    gapSeconds?: number;
  }): Promise<Record<string, unknown>> {
    const form = new FormData();
    form.append('file', toBlob(input.file), input.file.filename);
    if (input.language) form.append('language', input.language);
    if (input.gapSeconds != null) form.append('gapSeconds', String(input.gapSeconds));
    return this.requestForm('/v1/speakers/diarize', form);
  }

  async recognizeSpeech(input: {
    file: UploadFile;
    language?: string;
    industryPacks?: string[];
    vocabulary?: string[];
  }): Promise<{
    text: string;
    language: string | null;
    durationSeconds: number;
    durationMinutes: number;
    provider: string;
    confidence: number | null;
    segments: Array<{
      id: number;
      start: number;
      end: number;
      text: string;
      confidence?: number;
    }>;
    vocabularyApplied: boolean;
    industryPacks: string[];
  }> {
    const form = new FormData();
    form.append('file', toBlob(input.file), input.file.filename);
    if (input.language) form.append('language', input.language);
    if (input.industryPacks?.length) form.append('industryPacks', input.industryPacks.join(','));
    if (input.vocabulary?.length) form.append('vocabulary', input.vocabulary.join(','));
    return this.requestForm('/v1/speech/recognize', form);
  }

  async transcribe(input: TranscribeRequest): Promise<TranscribeResponse> {
    const form = new FormData();
    form.append('file', toBlob(input.file), input.file.filename);
    if (input.language) form.append('language', input.language);
    return this.requestForm<TranscribeResponse>('/v1/audio/transcriptions', form);
  }

  async speech(input: SpeechRequest): Promise<SpeechResponse> {
    const response = await this.fetchImpl(`${this.baseUrl}/v1/audio/speech`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: '*/*',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as ErrorBody;
      throw new LugemiError(
        body.error?.message ?? `Request failed with status ${response.status}`,
        body.error?.code ?? 'http_error',
        response.status,
        body.error?.request_id,
      );
    }

    const audio = new Uint8Array(await response.arrayBuffer());
    return {
      audio,
      mimeType: response.headers.get('content-type') ?? 'audio/mpeg',
      provider: response.headers.get('x-lugemi-provider') ?? undefined,
      voice: response.headers.get('x-lugemi-voice') ?? undefined,
      characters: Number(response.headers.get('x-lugemi-characters') ?? '') || undefined,
      watermarkApplied: response.headers.get('x-lugemi-watermark') === 'required',
    };
  }

  async interpret(input: InterpretRequest): Promise<InterpretResponse> {
    const form = new FormData();
    form.append('file', toBlob(input.file), input.file.filename);
    form.append('target', input.target);
    form.append('voice', input.voice);
    if (input.source) form.append('source', input.source);
    if (input.language) form.append('language', input.language);
    if (input.format) form.append('format', input.format);
    return this.requestForm<InterpretResponse>('/v1/interpret', form);
  }

  private async requestJson<T>(path: string, init: JsonRequestInit = {}): Promise<T> {
    const { body, headers, ...rest } = init;
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...rest,
      body: serializeJsonBody(body),
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(headers ?? {}),
      },
    });
    return this.parseJsonResponse<T>(response);
  }

  private async requestForm<T>(path: string, form: FormData): Promise<T> {
    return this.requestFormWithHeaders<T>(path, form);
  }

  private async requestFormWithHeaders<T>(
    path: string,
    form: FormData,
    headers?: Record<string, string>,
  ): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
        ...(headers ?? {}),
      },
      body: form,
    });
    return this.parseJsonResponse<T>(response);
  }


  async controlPlaneCloudProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/control-plane-cloud/products', { method: 'GET' });
  }

  async organizationControlEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/organization-control/engine', { method: 'GET' });
  }

  async globalConfigurationPlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/global-configuration-platform/engine', { method: 'GET' });
  }

  async globalPolicyEngineEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/global-policy-engine/engine', { method: 'GET' });
  }

  async globalDeploymentControllerEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/global-deployment-controller/engine', { method: 'GET' });
  }

  async globalRoutingControllerEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/global-routing-controller/engine', { method: 'GET' });
  }

  async secretsCertificatePlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/secrets-certificate-platform/engine', { method: 'GET' });
  }

  async globalSchedulerEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/global-scheduler/engine', { method: 'GET' });
  }

  async controlPlaneAnalyticsEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/control-plane-analytics/engine', { method: 'GET' });
  }


  async dataPlaneCloudProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/data-plane-cloud/products', { method: 'GET' });
  }

  async translationRuntimeEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/translation-runtime/engine', { method: 'GET' });
  }

  async speechRuntimeEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/speech-runtime/engine', { method: 'GET' });
  }

  async voiceRuntimeEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/voice-runtime/engine', { method: 'GET' });
  }

  async visionRuntimeEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/vision-runtime/engine', { method: 'GET' });
  }

  async knowledgeRuntimeEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/knowledge-runtime/engine', { method: 'GET' });
  }

  async embeddingRuntimeEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/embedding-runtime/engine', { method: 'GET' });
  }

  async dataPlaneStreamingEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/data-plane-streaming/engine', { method: 'GET' });
  }

  async gpuRuntimeEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/gpu-runtime/engine', { method: 'GET' });
  }


  async vaiosProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/vaios/products', { method: 'GET' });
  }

  async aiSchedulerEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/ai-scheduler/engine', { method: 'GET' });
  }

  async runtimeManagerEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/runtime-manager/engine', { method: 'GET' });
  }

  async resourceManagerEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/resource-manager/engine', { method: 'GET' });
  }

  async workflowOperatingSystemEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/workflow-operating-system/engine', { method: 'GET' });
  }

  async agentOperatingSystemEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/agent-operating-system/engine', { method: 'GET' });
  }

  async aiMemoryOperatingSystemEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/ai-memory-operating-system/engine', { method: 'GET' });
  }

  async knowledgeOperatingSystemEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/knowledge-operating-system/engine', { method: 'GET' });
  }

  async pluginOperatingSystemEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
  }> {
    return this.requestJson('/v1/plugin-operating-system/engine', { method: 'GET' });
  }


  async enterpriseEngineeringSystemProducts(): Promise<{
    product: string;
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    honesty: Record<string, unknown>;
    safety: Record<string, unknown>;
    docs: string;
    note: string;
  }> {
    return this.requestJson('/v1/enterprise-engineering-system/products', { method: 'GET' });
  }

  async engineeringGovernanceEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
    retroactiveChecks?: Array<Record<string, unknown>>;
  }> {
    return this.requestJson('/v1/engineering-governance/engine', { method: 'GET' });
  }

  async architectureGovernanceEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
    retroactiveChecks?: Array<Record<string, unknown>>;
  }> {
    return this.requestJson('/v1/architecture-governance/engine', { method: 'GET' });
  }

  async repositoryStandardsEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
    retroactiveChecks?: Array<Record<string, unknown>>;
  }> {
    return this.requestJson('/v1/repository-standards/engine', { method: 'GET' });
  }

  async engineeringQualityPlatformEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
    retroactiveChecks?: Array<Record<string, unknown>>;
  }> {
    return this.requestJson('/v1/engineering-quality-platform/engine', { method: 'GET' });
  }

  async aiEngineeringStandardsEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
    retroactiveChecks?: Array<Record<string, unknown>>;
  }> {
    return this.requestJson('/v1/ai-engineering-standards/engine', { method: 'GET' });
  }

  async apiEngineeringStandardsEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
    retroactiveChecks?: Array<Record<string, unknown>>;
  }> {
    return this.requestJson('/v1/api-engineering-standards/engine', { method: 'GET' });
  }

  async databaseEngineeringStandardsEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
    retroactiveChecks?: Array<Record<string, unknown>>;
  }> {
    return this.requestJson('/v1/database-engineering-standards/engine', { method: 'GET' });
  }

  async infrastructureEngineeringStandardsEngine(): Promise<{
    product: string;
    note: string;
    honesty: Record<string, unknown>;
    routesTo?: Array<{ module: string; path: string; role: string }>;
    safety?: Record<string, unknown>;
    docs?: string;
    retroactiveChecks?: Array<Record<string, unknown>>;
  }> {
    return this.requestJson('/v1/infrastructure-engineering-standards/engine', { method: 'GET' });
  }

  async aiEngineeringStandardsChecks(): Promise<{
    product: string;
    retroactiveChecks: Array<Record<string, unknown>>;
    checkedAgainstStandards: boolean;
    fakeComplianceCertification: boolean;
    note: string;
  }> {
    return this.requestJson('/v1/ai-engineering-standards/check/list', { method: 'GET' });
  }

  private async parseJsonResponse<T>(response: Response): Promise<T> {
    const body = (await response.json().catch(() => ({}))) as T & ErrorBody;

    if (!response.ok) {
      throw new LugemiError(
        body.error?.message ?? `Request failed with status ${response.status}`,
        body.error?.code ?? 'http_error',
        response.status,
        body.error?.request_id,
      );
    }

    return body;
  }
}
