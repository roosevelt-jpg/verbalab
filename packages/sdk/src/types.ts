export type TranslateRequest = {
  text: string;
  /** Language code, or `"auto"` to detect first. */
  source: string;
  target: string;
};

export type DetectRequest = {
  text: string;
};

export type DetectResponse = {
  language: string;
  confidence: number;
  provider: string;
  characters?: number;
};

export type Dialect = {
  id: string;
  code: string;
  languageCode: string;
  nameEn: string;
  nameNative: string | null;
  region: string | null;
  cueTerms: string[];
  notes: string | null;
};

export type DialectDetectRequest = {
  text: string;
  language?: string;
};

export type DialectDetectResponse = {
  language: string;
  languageConfidence?: number;
  languageProvider?: string;
  dialect: string | null;
  dialectName: string | null;
  confidence: number;
  provider: string;
  candidates: Array<{
    code: string;
    nameEn: string;
    languageCode: string;
    score: number;
    matchedCues: string[];
  }>;
  note: string;
};

export type Accent = {
  id: string;
  code: string;
  languageCode: string;
  nameEn: string;
  nameNative: string | null;
  region: string | null;
  relatedDialectCode: string | null;
  cueTerms: string[];
  notes: string | null;
};

export type AccentDetectRequest = {
  text?: string;
  language?: string;
  file?: UploadFile;
};

export type AccentDetectResponse = {
  language: string;
  languageConfidence?: number;
  languageProvider?: string;
  accent: string | null;
  accentName: string | null;
  confidence: number;
  provider: string;
  inputMode: 'text' | 'audio';
  transcript?: string;
  candidates: Array<{
    code: string;
    nameEn: string;
    languageCode: string;
    score: number;
    matchedCues: string[];
  }>;
  note: string;
};

export type GrammarCheckRequest = {
  text: string;
  language?: string;
};

export type GrammarIssue = {
  type: string;
  severity: string;
  message: string;
  original?: string;
  suggestion?: string;
  offset?: number;
  length?: number;
};

export type GrammarCheckResponse = {
  language: string;
  original: string;
  corrected: string;
  changed: boolean;
  issues: GrammarIssue[];
  issueCount: number;
  provider: string;
  model: string | null;
  note: string;
};

export type StyleProfile = {
  id: string;
  name: string;
  description: string;
  domain?: string;
  disclaimer?: string;
};

export type GrammarIntelligenceOverview = {
  product: string;
  note: string;
  capabilities: Array<{
    id: string;
    name: string;
    status: string;
    api: string | null;
    notes: string;
  }>;
  engines: Record<string, unknown>;
  links: Record<string, string>;
};

export type GrammarSpellResponse = {
  language: string;
  original: string;
  corrected: string;
  changed: boolean;
  issues: GrammarIssue[];
  issueCount: number;
  provider: string;
  note: string;
};

export type GrammarCorrectResponse = {
  language: string;
  original: string;
  corrected: string;
  changed: boolean;
  issueCount: number;
  provider: string;
  model?: string | null;
  note: string;
};

export type GrammarSuggestRequest = {
  text: string;
  language?: string;
  styleProfile?: string;
};

export type GrammarSuggestResponse = {
  language: string;
  original: string;
  grammarCorrected: string;
  styleRewritten: string;
  styleProfile: string;
  styleDisclaimer?: string | null;
  changed: boolean;
  suggestions: Array<{
    kind: string;
    type: string;
    severity: string;
    message: string;
    original?: string;
    suggestion?: string;
  }>;
  suggestionCount: number;
  note: string;
};

export type GrammarAnalytics = {
  windowDays: number;
  grammarChecks: number;
  spellChecks: number;
  styleRewrites: number;
  note: string;
};

export type StyleRewriteRequest = {
  text: string;
  profile: string;
  language?: string;
};

export type StyleRewriteResponse = {
  language: string;
  profile: string;
  profileName: string;
  domain?: string;
  disclaimer?: string | null;
  original: string;
  rewritten: string;
  changed: boolean;
  changes: Array<{
    type: string;
    message: string;
    original?: string;
    suggestion?: string;
  }>;
  changeCount: number;
  provider: string;
  model: string | null;
  note: string;
};

export type StyleIntelligenceOverview = {
  product: string;
  note: string;
  capabilities: Array<{
    id: string;
    name: string;
    status: string;
    api: string | null;
    notes: string;
  }>;
  engines: Record<string, unknown>;
  links: Record<string, string>;
};

export type StyleToneDetectRequest = {
  text: string;
};

export type StyleToneDetectResponse = {
  original: string;
  detectedTone: string;
  confidence: number;
  suggestedProfile: string;
  scores: Record<string, number>;
  signals: Array<{ tone: string; weight: number; cue: string }>;
  provider: string;
  note: string;
};

export type StyleToneTransformRequest = {
  text: string;
  targetTone: string;
  language?: string;
};

export type StyleTransferRequest = {
  text: string;
  targetProfile: string;
  language?: string;
};

export type StyleTransferResponse = StyleRewriteResponse & {
  sourceTone: string;
  sourceConfidence: number;
  targetProfile: string;
  operation: string;
};

export type StyleAnalytics = {
  windowDays: number;
  rewrites: number;
  toneDetections: number;
  toneTransforms: number;
  styleTransfers: number;
  note: string;
};

export type LanguageIntelligenceOverview = {
  product: string;
  note: string;
  capabilities: Array<{
    id: string;
    name: string;
    status: string;
    api: string | null;
    notes: string;
  }>;
  engines: Record<string, unknown>;
  links: Record<string, string>;
};

export type LanguageAnalyzeRequest = {
  text: string;
  language?: string;
  includeDialect?: boolean;
  includeAccent?: boolean;
};

export type LanguageAnalyzeResponse = {
  language: string;
  languageConfidence: number;
  languageProvider: string;
  dialect: { code: string | null; confidence: number; provider: string } | null;
  accent: { code: string | null; confidence: number; provider: string } | null;
  intent: { label: string; confidence: number };
  sentiment: { label: string; score: number; confidence: number };
  emotion: { label: string; confidence: number };
  readability: { score: number; level: string };
  complexity: { score: number; level: string };
  note: string;
};

export type LanguageSentimentResponse = {
  original: string;
  label: string;
  score: number;
  confidence: number;
  note: string;
};

export type LanguageTranslationConfidenceRequest = {
  sourceText: string;
  targetText: string;
  sourceLang: string;
  targetLang: string;
  provider?: string;
};

export type LanguageTranslationConfidenceResponse = {
  score: number;
  confidence: number;
  needsReview: boolean;
  reasons: string[];
  note: string;
};

export type LanguageSpeechConfidenceRequest = {
  transcript: string;
  durationSeconds?: number;
  sttConfidence?: number;
};

export type LanguageSpeechConfidenceResponse = {
  original: string;
  score: number;
  confidence: number;
  reasons: string[];
  note: string;
};

export type LanguageIntelligenceAnalytics = {
  windowDays: number;
  analyzes: number;
  sentimentCalls: number;
  intentCalls: number;
  confidenceCalls: number;
  note: string;
};

export type TmIntelligenceOverview = {
  product: string;
  note: string;
  capabilities: Array<{
    id: string;
    name: string;
    status: string;
    api: string | null;
    notes: string;
  }>;
  engines: Record<string, unknown>;
  links: Record<string, string>;
};

export type TmSearchRequest = {
  text: string;
  sourceLang: string;
  targetLang: string;
  projectKey?: string;
  mode?: 'lexical' | 'vector' | 'auto';
  limit?: number;
  minScore?: number;
};

export type TmSearchHit = {
  id: string;
  scope: string;
  projectKey: string;
  sourceText: string;
  targetText: string;
  score: number;
  version: number;
  hitCount: number;
};

export type TmSearchResponse = {
  query: string;
  sourceLang: string;
  targetLang: string;
  provider: string;
  results: TmSearchHit[];
  resultCount: number;
  note: string;
};

export type TmAnalytics = {
  windowDays: number;
  entries: number;
  versions: number;
  upserts: number;
  searches: number;
  glossaryTerms: number;
  byScope: Record<string, number>;
  note: string;
};

export type LanguageAnalyticsOverview = {
  product: string;
  note: string;
  capabilities: Array<{
    id: string;
    name: string;
    status: string;
    api: string | null;
    notes: string;
  }>;
  engines: Record<string, unknown>;
  links: Record<string, string>;
};

export type AnalyticsPeriodParams = {
  from?: string;
  to?: string;
};

export type AnalyticsOverviewResponse = {
  periodStart: string;
  periodEnd: string;
  byFeature: Array<{
    feature: string;
    requests: number;
    units: number;
    unitType: string;
    estimatedCostUsd: number;
  }>;
  byLanguagePair: Array<{
    source: string;
    target: string;
    requests: number;
    characters: number;
  }>;
  cost: {
    estimatedUsd: number;
    currency: string;
    note: string;
  };
  errors: {
    jobSucceeded: number;
    jobFailed: number;
    jobTotal: number;
    errorRate: number;
  };
};

export type AnalyticsTranslationUsage = {
  periodStart: string;
  periodEnd: string;
  requests: number;
  characters: number;
  tmHits: number;
  byProvider: Array<{
    provider: string;
    requests: number;
    characters: number;
    avgLatencyMs: number | null;
  }>;
  note: string;
};

export type AnalyticsQuality = {
  periodStart: string;
  periodEnd: string;
  reviews: number;
  accepted: number;
  rejected: number;
  averageQualityScore: number | null;
  translationAccuracyProxy: number | null;
  note: string;
};

export type AnalyticsLatency = {
  periodStart: string;
  periodEnd: string;
  samples: number;
  avgMs: number | null;
  p50Ms: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
  maxMs: number | null;
  note: string;
};

export type EnterpriseAnalyticsReport = {
  product: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  overview: AnalyticsOverviewResponse;
  translation: AnalyticsTranslationUsage;
  quality: AnalyticsQuality;
  latency: AnalyticsLatency;
  note: string;
};

export type CountryPack = {
  id: string;
  code: string;
  nameEn: string;
  region: string | null;
  currencyCode: string | null;
  primaryLanguages: string[];
  bcp47Tags: string[];
  relatedDialectCodes: string[];
  relatedAccentCodes: string[];
  dateNotes: string | null;
  numberNotes: string | null;
  currencyNotes: string | null;
  culturalNotes: string | null;
  localePacks?: LocalePack[];
  note?: string;
};

export type TranslateResponse = {
  text: string;
  source: string;
  target: string;
  provider: string;
  characters: number;
  detection?: DetectResponse | null;
  glossaryApplied?: number;
  tmHit?: boolean;
  tmEntryId?: string | null;
  qualityScore?: number | null;
};

export type TranslateFormatRequest = {
  format: 'html' | 'markdown' | 'xml' | 'csv' | 'srt' | 'plain' | string;
  content: string;
  source: string;
  target: string;
};

export type TranslateFormatResponse = {
  format: string;
  content: string;
  source: string;
  target: string;
  segmentCount: number;
  characters: number;
  provider: string;
  glossaryApplied?: boolean;
  tmHits?: number;
  note?: string;
};

export type TranslateChatRequest = {
  messages: Array<{ role: string; content: string }>;
  source: string;
  target: string;
};

export type TranslateChatResponse = {
  source: string;
  target: string;
  messages: Array<{
    role: string;
    content: string;
    translated: boolean;
    provider?: string;
    tmHit?: boolean;
  }>;
  note: string;
};

export type TranslateEngineOverview = {
  product: string;
  note: string;
  capabilities: Array<{
    id: string;
    name: string;
    status: string;
    api: string | null;
    notes: string;
  }>;
  engines: Record<string, unknown>;
  links: Record<string, string>;
};

export type TranslateStreamEvent =
  | { event: 'start'; chunkCount: number; source: string; target: string }
  | {
      event: 'chunk';
      index: number;
      text: string;
      characters?: number;
      provider?: string;
      tmHit?: boolean;
    }
  | { event: 'done'; text: string; chunkCount: number }
  | { event: 'error'; message: string };

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatCompletionRequest = {
  messages: ChatMessage[];
  model?: string;
  translateReplyTo?: string;
};

export type ChatCompletionResponse = {
  id: string;
  object: string;
  model: string;
  provider: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  translated: boolean;
  translateReplyTo: string | null;
};

export type EmbeddingsRequest = {
  input: string | string[];
  model?: string;
};

export type EmbeddingsResponse = {
  object: string;
  data: Array<{
    object: string;
    index: number;
    embedding: number[];
  }>;
  model: string;
  provider: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
};

export type Language = {
  code: string;
  name: string;
  nativeName?: string | null;
  script?: string | null;
  familyCode?: string | null;
  familyName?: string | null;
  rtl: boolean;
  tier: 'vendor' | 'strategic_african' | string;
};

export type LanguageFamily = {
  code: string;
  nameEn: string;
  parentCode?: string | null;
  notes?: string | null;
};

export type WritingSystem = {
  code: string;
  nameEn: string;
  kind: string;
  rtl: boolean;
  sampleChars?: string | null;
  notes?: string | null;
  isAlphabet?: boolean;
  isWritingSystem?: boolean;
  isScript?: boolean;
};

export type LinguisticRule = {
  code: string;
  kind: 'pronunciation' | 'grammar' | 'phonetic' | 'morphology' | string;
  languageCode?: string | null;
  nameEn: string;
  description: string;
  pattern?: string | null;
  examples?: unknown;
  notes?: string | null;
};

export type RegistryOverview = {
  product: string;
  note: string;
  counts: Record<string, number>;
  links: Record<string, string>;
};

export type RegistryValidateRequest = {
  language?: string;
  dialect?: string;
  accent?: string;
  locale?: string;
  script?: string;
  family?: string;
  rule?: string;
  bcp47?: string;
};

export type RegistryValidateResponse = {
  valid: boolean;
  errors: string[];
  resolved: Record<string, unknown>;
  note: string;
};

export type RegistryAnalytics = {
  asOf: string;
  counts: Record<string, number>;
  languagesByTier: Array<{ tier: string; count: number }>;
  languagesByFamily: Array<{ familyCode: string | null; count: number }>;
  languagesByScript: Array<{ script: string | null; count: number }>;
  rulesByKind: Array<{ kind: string; count: number }>;
  writingSystemsByKind: Array<{ kind: string; count: number }>;
  note: string;
};

export type RegistryHealth = {
  status: 'ok' | 'degraded' | string;
  issues: string[];
  counts: Record<string, number>;
  checkedAt: string;
};

export type RegionDefinition = {
  code: string;
  name: string;
  flyRegion: string;
  residencyLabel: string;
  apiBaseUrl: string;
  webBaseUrl: string;
  isCurrentDeploy?: boolean;
};

export type RegionsResponse = {
  currentRegion: string;
  disclaimer: string;
  regions: RegionDefinition[];
};

export type LocalePack = {
  languageCode: string;
  bcp47?: string | null;
  dateNotes?: string | null;
  numberNotes?: string | null;
  currencyCode?: string | null;
  currencyNotes?: string | null;
  culturalNotes?: string | null;
  honorifics?: unknown[];
  doNotTranslate?: string[];
  language?: {
    code: string;
    name: string;
    nativeName?: string | null;
    tier: string;
    script?: string | null;
    rtl: boolean;
  } | null;
  code?: string;
  name?: string;
  [key: string]: unknown;
};

export type LocaleLayout = {
  languageCode: string;
  bcp47: string | null;
  script: string | null;
  rtl: boolean;
  dir: 'rtl' | 'ltr' | string;
  note: string;
};

export type LocaleFormatRequest = {
  code: string;
  date?: string;
  number?: number;
  currencyValue?: number;
  timeZone?: string;
};

export type LocaleFormatResponse = {
  languageCode: string;
  bcp47: string;
  timeZone?: string | null;
  date?: string;
  dateTime?: string;
  number?: string;
  currency?: string;
  currencyCode?: string;
};

export type LocalizationPlatformOverview = {
  product: string;
  note: string;
  capabilities: Array<{
    id: string;
    name: string;
    status: string;
    api: string | null;
    notes: string;
  }>;
  engines: Record<string, unknown>;
  links: Record<string, string>;
};

export type IcuValidateResponse = {
  valid: boolean;
  issues: Array<{ code: string; message: string; severity: string }>;
  placeholders: string[];
  hasPlural: boolean;
  hasSelect: boolean;
};

export type IcuFormatRequest = {
  message: string;
  values?: Record<string, string | number>;
  locale?: string;
};

export type IcuFormatResponse = {
  formatted: string;
  placeholders: string[];
  locale: string;
};

export type LocalizeCatalogResponse = {
  stringCount: number;
  icuCount: number;
  pluralCount: number;
  selectCount: number;
  keys: Array<{
    key: string;
    chars: number;
    placeholders: string[];
    hasPlural: boolean;
    hasSelect: boolean;
    icuValid: boolean;
  }>;
  note: string;
};

export type LocalizeQaRequest = {
  format?: 'json' | 'yaml' | string;
  sourceContent: unknown;
  targetContent: unknown;
  source?: string;
  target?: string;
};

export type LocalizeQaResponse = {
  format: string;
  sourceKeys: number;
  targetKeys: number;
  issueCount: number;
  errorCount: number;
  warningCount: number;
  passed: boolean;
  issues: Array<{ code: string; severity: string; key?: string; message: string }>;
  note: string;
};

export type LocalizeRequest = {
  source: string;
  target: string;
  content: unknown;
  format?: 'json' | 'yaml';
};

export type LocalizeResponse = {
  format: string;
  content: unknown;
  serialized: string;
  strings: number;
  translated: number;
  tmHits: number;
  glossaryApplied: number;
};

export type JobType = 'batch_translate' | 'document_translate' | 'workflow';

export type CreateJobRequest = {
  type: JobType;
  input?: unknown;
  webhookUrl?: string;
};

export type Job = {
  id: string;
  type: string;
  status: string;
  input: unknown;
  result: unknown | null;
  error: string | null;
  webhookUrl: string | null;
  webhookStatus: string | null;
  attempts: number;
  createdAt: string;
  startedAt: string | null;
  completedAt?: string | null;
};

export type UploadFile = {
  /** File bytes */
  data: Blob | ArrayBuffer | Uint8Array;
  /** Filename sent as multipart filename */
  filename: string;
  /** Optional MIME type */
  contentType?: string;
};

export type OcrRequest = {
  file: UploadFile;
  languageHint?: string;
  source?: string;
  target?: string;
};

export type OcrResponse = {
  text: string;
  pages: number;
  provider: string;
  characters: number;
  translatedText: string | null;
  translateProvider: string | null;
  source: string | null;
  target: string | null;
};

export type TranscribeRequest = {
  file: UploadFile;
  language?: string;
};

export type TranscribeResponse = {
  text: string;
  language?: string | null;
  durationSeconds?: number;
  durationMinutes?: number;
  provider: string;
  [key: string]: unknown;
};

export type SpeechRequest = {
  text: string;
  voice: string;
  language?: string;
  format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
};

export type SpeechResponse = {
  audio: Uint8Array;
  mimeType: string;
  provider?: string;
  voice?: string;
  characters?: number;
  watermarkApplied?: boolean;
};

export type Voice = {
  id: string;
  name: string;
  [key: string]: unknown;
};

export type InterpretRequest = {
  file: UploadFile;
  target: string;
  voice: string;
  source?: string;
  language?: string;
  format?: 'mp3' | 'wav' | 'opus' | 'aac' | 'flac';
};

export type InterpretResponse = {
  sourceText: string;
  targetText: string;
  source: string;
  target: string;
  durationSeconds: number;
  durationMinutes: number;
  voice: string;
  format: string;
  mimeType: string;
  audioBase64: string;
  skippedMt: boolean;
  providers: { stt: string; mt: string | null; tts: string };
};

export type VerbaLabClientOptions = {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
};
