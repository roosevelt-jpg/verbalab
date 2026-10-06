import { HttpStatus, Injectable } from '@nestjs/common';
import { GatewayService } from '../gateway/gateway.service';
import { DialectsService } from '../dialects/dialects.service';
import { AccentsService } from '../accents/accents.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { estimateTranslationQuality } from '../quality/quality-estimate';
import { languageIntelligenceCatalog } from './language-intelligence.catalog';
import {
  analyzeComplexity,
  analyzeEmotion,
  analyzeIntent,
  analyzeReadability,
  analyzeSentiment,
  analyzeSpeechConfidence,
} from './language-signals';

const MAX_CHARS = 12_000;

@Injectable()
export class LanguageIntelligenceService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly dialects: DialectsService,
    private readonly accents: AccentsService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  catalog() {
    return languageIntelligenceCatalog();
  }

  async analytics(organizationId: string) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [analyzes, sentiments, intents, confidences] = await Promise.all([
      this.prisma.auditEvent.count({
        where: { organizationId, action: 'language_intelligence.analyze', createdAt: { gte: since } },
      }),
      this.prisma.auditEvent.count({
        where: { organizationId, action: 'language_intelligence.sentiment', createdAt: { gte: since } },
      }),
      this.prisma.auditEvent.count({
        where: { organizationId, action: 'language_intelligence.intent', createdAt: { gte: since } },
      }),
      this.prisma.auditEvent.count({
        where: {
          organizationId,
          action: {
            in: [
              'language_intelligence.translation_confidence',
              'language_intelligence.speech_confidence',
            ],
          },
          createdAt: { gte: since },
        },
      }),
    ]);

    return {
      windowDays: 30,
      analyzes,
      sentimentCalls: sentiments,
      intentCalls: intents,
      confidenceCalls: confidences,
      note: 'Org audit-derived Language Intelligence usage — not an NLP quality scoreboard.',
    };
  }

  async analyze(input: {
    text: string;
    language?: string;
    includeDialect?: boolean;
    includeAccent?: boolean;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const text = this.requireText(input.text);

    let language = input.language?.trim().toLowerCase() || '';
    let languageConfidence = 1;
    let languageProvider = 'hint';
    if (!language) {
      const detected = await this.gateway.detect({ text });
      language = detected.language;
      languageConfidence = detected.confidence;
      languageProvider = detected.provider;
    }

    const sentiment = analyzeSentiment(text);
    const emotion = analyzeEmotion(text);
    const intent = analyzeIntent(text);
    const readability = analyzeReadability(text);
    const complexity = analyzeComplexity(text);

    let dialect: Awaited<ReturnType<DialectsService['detect']>> | null = null;
    if (input.includeDialect !== false) {
      dialect = await this.dialects.detect({
        text,
        language,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        userId: input.userId,
        apiKeyId: input.apiKeyId,
        ip: input.ip,
      });
    }

    let accent: Awaited<ReturnType<AccentsService['detect']>> | null = null;
    if (input.includeAccent) {
      accent = await this.accents.detect({
        text,
        language,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        userId: input.userId,
        apiKeyId: input.apiKeyId,
        ip: input.ip,
      });
    }

    const result = {
      language,
      languageConfidence,
      languageProvider,
      dialect: dialect
        ? {
            code: dialect.dialect,
            confidence: dialect.confidence,
            provider: dialect.provider,
          }
        : null,
      accent: accent
        ? {
            code: accent.accent,
            confidence: accent.confidence,
            provider: accent.provider,
          }
        : null,
      intent: { label: intent.label, confidence: intent.confidence },
      sentiment: { label: sentiment.label, score: sentiment.score, confidence: sentiment.confidence },
      emotion: { label: emotion.label, confidence: emotion.confidence },
      readability: { score: readability.score, level: readability.level },
      complexity: { score: complexity.score, level: complexity.level },
      note: 'Language Intelligence analyze. Intent/sentiment/emotion are heuristic; dialect/accent reuse 132.',
    };

    await this.recordAudit(input, 'language_intelligence.analyze', 'POST /v1/language-intelligence/analyze', {
      language,
      intent: intent.label,
      sentiment: sentiment.label,
    });

    return result;
  }

  async *analyzeStream(input: {
    text: string;
    language?: string;
    includeDialect?: boolean;
    includeAccent?: boolean;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }): AsyncGenerator<{ event: string; data: Record<string, unknown> }> {
    const text = this.requireText(input.text);
    yield { event: 'start', data: { chars: [...text].length } };

    let language = input.language?.trim().toLowerCase() || '';
    let languageConfidence = 1;
    let languageProvider = 'hint';
    if (!language) {
      const detected = await this.gateway.detect({ text });
      language = detected.language;
      languageConfidence = detected.confidence;
      languageProvider = detected.provider;
    }
    yield {
      event: 'language',
      data: { language, confidence: languageConfidence, provider: languageProvider },
    };

    const sentiment = analyzeSentiment(text);
    yield { event: 'sentiment', data: sentiment };

    const emotion = analyzeEmotion(text);
    yield { event: 'emotion', data: { label: emotion.label, confidence: emotion.confidence } };

    const intent = analyzeIntent(text);
    yield { event: 'intent', data: { label: intent.label, confidence: intent.confidence } };

    const readability = analyzeReadability(text);
    yield { event: 'readability', data: { score: readability.score, level: readability.level } };

    const complexity = analyzeComplexity(text);
    yield { event: 'complexity', data: { score: complexity.score, level: complexity.level } };

    if (input.includeDialect !== false) {
      const dialect = await this.dialects.detect({
        text,
        language,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        userId: input.userId,
        apiKeyId: input.apiKeyId,
        ip: input.ip,
      });
      yield {
        event: 'dialect',
        data: { code: dialect.dialect, confidence: dialect.confidence, provider: dialect.provider },
      };
    }

    if (input.includeAccent) {
      const accent = await this.accents.detect({
        text,
        language,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        userId: input.userId,
        apiKeyId: input.apiKeyId,
        ip: input.ip,
      });
      yield {
        event: 'accent',
        data: { code: accent.accent, confidence: accent.confidence, provider: accent.provider },
      };
    }

    await this.recordAudit(input, 'language_intelligence.analyze', 'POST /v1/language-intelligence/analyze/stream', {
      language,
      streamed: true,
    });

    yield { event: 'done', data: { note: 'SSE Language Intelligence stream.' } };
  }

  async sentiment(input: AuthTextInput) {
    const text = this.requireText(input.text);
    const result = analyzeSentiment(text);
    await this.recordAudit(input, 'language_intelligence.sentiment', 'POST /v1/language-intelligence/sentiment', {
      label: result.label,
    });
    return { original: text, ...result, provider: 'rules' as const };
  }

  async emotion(input: AuthTextInput) {
    const text = this.requireText(input.text);
    const result = analyzeEmotion(text);
    await this.recordAudit(input, 'language_intelligence.emotion', 'POST /v1/language-intelligence/emotion', {
      label: result.label,
    });
    return { original: text, ...result, provider: 'rules' as const };
  }

  async intent(input: AuthTextInput) {
    const text = this.requireText(input.text);
    const result = analyzeIntent(text);
    await this.recordAudit(input, 'language_intelligence.intent', 'POST /v1/language-intelligence/intent', {
      label: result.label,
    });
    return { original: text, ...result, provider: 'rules' as const };
  }

  async readability(input: AuthTextInput) {
    const text = this.requireText(input.text);
    const result = analyzeReadability(text);
    await this.recordAudit(input, 'language_intelligence.readability', 'POST /v1/language-intelligence/readability', {
      score: result.score,
    });
    return { original: text, ...result, provider: 'rules' as const };
  }

  async complexity(input: AuthTextInput) {
    const text = this.requireText(input.text);
    const result = analyzeComplexity(text);
    await this.recordAudit(input, 'language_intelligence.complexity', 'POST /v1/language-intelligence/complexity', {
      score: result.score,
    });
    return { original: text, ...result, provider: 'rules' as const };
  }

  async translationConfidence(input: {
    sourceText: string;
    targetText: string;
    sourceLang: string;
    targetLang: string;
    provider?: string;
    organizationId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const sourceText = this.requireText(input.sourceText);
    const targetText = this.requireText(input.targetText);
    if (!input.sourceLang?.trim() || !input.targetLang?.trim()) {
      throw new ApiException(
        'validation_error',
        'sourceLang and targetLang are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const estimate = estimateTranslationQuality({
      sourceText,
      targetText,
      sourceLang: input.sourceLang.trim().toLowerCase(),
      targetLang: input.targetLang.trim().toLowerCase(),
      provider: input.provider?.trim() || 'mt',
    });
    const confidence = Number((estimate.score / 100).toFixed(3));
    await this.recordAudit(
      input,
      'language_intelligence.translation_confidence',
      'POST /v1/language-intelligence/translation-confidence',
      { score: estimate.score },
    );
    return {
      score: estimate.score,
      confidence,
      needsReview: estimate.needsReview,
      reasons: estimate.reasons,
      note: 'Heuristic translation confidence — not a trained QE model.',
    };
  }

  async speechConfidence(input: {
    transcript: string;
    durationSeconds?: number;
    sttConfidence?: number;
    organizationId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const transcript = this.requireText(input.transcript);
    const result = analyzeSpeechConfidence({
      transcript,
      durationSeconds: input.durationSeconds,
      sttConfidence: input.sttConfidence,
    });
    await this.recordAudit(
      input,
      'language_intelligence.speech_confidence',
      'POST /v1/language-intelligence/speech-confidence',
      { score: result.score },
    );
    return { original: transcript, ...result };
  }

  private requireText(raw: string) {
    const text = raw.trim();
    if (!text) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    if ([...text].length > MAX_CHARS) {
      throw new ApiException(
        'validation_error',
        `text exceeds maximum of ${MAX_CHARS} characters`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return text;
  }

  private async recordAudit(
    input: { organizationId: string; userId?: string; apiKeyId?: string; ip?: string },
    action: string,
    route: string,
    metadata: Record<string, unknown>,
  ) {
    let apiKeyPrefix: string | undefined;
    if (input.apiKeyId) {
      const key = await this.prisma.apiKey.findUnique({ where: { id: input.apiKeyId } });
      apiKeyPrefix = key?.prefix ?? undefined;
    }
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action,
      route,
      ip: input.ip,
      apiKeyPrefix,
      metadata,
    });
  }
}

type AuthTextInput = {
  text: string;
  organizationId: string;
  userId?: string;
  apiKeyId?: string;
  ip?: string;
};
