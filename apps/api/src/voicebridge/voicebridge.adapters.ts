import { Injectable } from '@nestjs/common';
import { AudioService } from '../audio/audio.service';
import { TranslateService } from '../translate/translate.service';

export type SpeechResult = {
  text: string;
  language: string;
  provider: string;
  modelVersion: string;
  status: 'ok' | 'fixture' | 'unavailable';
};

export type TranslationResult = {
  text: string;
  provider: string;
  modelVersion: string;
  status: 'ok' | 'fixture' | 'unsupported';
};

export type TtsResult = {
  audio: Buffer | null;
  mimeType: string | null;
  provider: string;
  modelVersion: string;
  status: 'ok' | 'fixture' | 'unsupported';
};

export type CriticalTermIssue = {
  kind: string;
  sourceSpan: string;
  translatedSpan: string;
};

@Injectable()
export class VoiceBridgeAdapters {
  constructor(
    private readonly audio: AudioService,
    private readonly translateService: TranslateService,
  ) {}

  async recognize(input: {
    file: Express.Multer.File;
    language?: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }): Promise<SpeechResult> {
    try {
      const result = await this.audio.transcribe({
        file: input.file,
        language: input.language,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
      });
      return {
        text: result.text,
        language: result.language ?? input.language ?? 'und',
        provider: result.provider ?? 'audio',
        modelVersion: String((result as { model?: string }).model ?? result.provider ?? 'audio'),
        status: 'ok',
      };
    } catch {
      if (process.env.VOICEBRIDGE_ALLOW_FIXTURE_ASR === '1' || process.env.NODE_ENV === 'test') {
        return {
          text:
            process.env.VOICEBRIDGE_FIXTURE_ASR_TEXT ??
            'We can deliver fifty bags of rice next Tuesday',
          language: input.language ?? 'en',
          provider: 'voicebridge-fixture-asr',
          modelVersion: 'fixture-v1',
          status: 'fixture',
        };
      }
      return {
        text: '',
        language: input.language ?? 'und',
        provider: 'unavailable',
        modelVersion: 'none',
        status: 'unavailable',
      };
    }
  }

  async translateText(input: {
    text: string;
    source: string;
    target: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }): Promise<TranslationResult> {
    if (input.source === input.target) {
      return {
        text: input.text,
        provider: 'identity',
        modelVersion: 'identity-v1',
        status: 'ok',
      };
    }
    try {
      const result = await this.translateService.translate({
        text: input.text,
        source: input.source,
        target: input.target,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
      });
      return {
        text: result.text,
        provider: result.provider ?? 'translate',
        modelVersion: String((result as { model?: string }).model ?? result.provider ?? 'translate'),
        status: 'ok',
      };
    } catch {
      if (process.env.VOICEBRIDGE_ALLOW_FIXTURE_MT === '1' || process.env.NODE_ENV === 'test') {
        return {
          text: `[${input.target}] ${input.text}`,
          provider: 'voicebridge-fixture-mt',
          modelVersion: 'fixture-v1',
          status: 'fixture',
        };
      }
      return {
        text: '',
        provider: 'unsupported',
        modelVersion: 'none',
        status: 'unsupported',
      };
    }
  }

  async synthesize(input: {
    text: string;
    language: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }): Promise<TtsResult> {
    try {
      const result = await this.audio.speak({
        text: input.text,
        voice: process.env.VOICEBRIDGE_TTS_VOICE ?? 'alloy',
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
      });
      return {
        audio: result.audio,
        mimeType: result.mimeType ?? 'audio/mpeg',
        provider: result.provider ?? 'tts',
        modelVersion: String((result as { model?: string }).model ?? result.provider ?? 'tts'),
        status: 'ok',
      };
    } catch {
      if (process.env.VOICEBRIDGE_ALLOW_FIXTURE_TTS === '1' || process.env.NODE_ENV === 'test') {
        // Never return text bytes as audio/wav — that produces browser beeps/noise.
        const { generateSpeechWav } = await import('../gateway/own-tts.adapter');
        const wav = generateSpeechWav(
          input.text,
          process.env.VOICEBRIDGE_TTS_VOICE?.startsWith('own:')
            ? process.env.VOICEBRIDGE_TTS_VOICE
            : 'own:en-us-female',
          'en-US',
          { allowFormant: true },
        );
        return {
          audio: wav.audio,
          mimeType: 'audio/wav',
          provider: 'voicebridge-fixture-tts',
          modelVersion: `fixture-${wav.engine}`,
          status: 'fixture',
        };
      }
      return {
        audio: null,
        mimeType: null,
        provider: 'unsupported',
        modelVersion: 'none',
        status: 'unsupported',
      };
    }
  }

  /** Deterministic critical-term check — blocks spoken delivery on quantity/currency mismatches. */
  verifyCriticalTerms(source: string, translated: string): {
    status: 'ok' | 'needs_clarification';
    issues: CriticalTermIssue[];
  } {
    const issues: CriticalTermIssue[] = [];
    const sourceNums = source.match(/\d+(?:[.,]\d+)?/g) ?? [];
    const translatedNums = translated.match(/\d+(?:[.,]\d+)?/g) ?? [];
    for (const n of sourceNums) {
      const normalized = n.replace(',', '');
      if (!translatedNums.some((t) => t.replace(',', '') === normalized)) {
        issues.push({
          kind: 'quantity_mismatch',
          sourceSpan: n,
          translatedSpan: translatedNums.join(', ') || '(missing)',
        });
      }
    }
    const currency = source.match(/\b(GHS|USD|EUR|NGN|KES|XOF)\b/i)?.[1];
    if (currency && !new RegExp(currency, 'i').test(translated)) {
      issues.push({
        kind: 'currency_mismatch',
        sourceSpan: currency,
        translatedSpan: '(missing currency)',
      });
    }
    return {
      status: issues.length ? 'needs_clarification' : 'ok',
      issues,
    };
  }
}
