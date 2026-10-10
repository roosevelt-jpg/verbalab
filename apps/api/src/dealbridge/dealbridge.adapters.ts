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

@Injectable()
export class DealBridgeAdapters {
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
      if (process.env.DEALBRIDGE_ALLOW_FIXTURE_ASR === '1' || process.env.NODE_ENV === 'test') {
        return {
          text: process.env.DEALBRIDGE_FIXTURE_ASR_TEXT ?? 'Fifty bags of rice at GHS 320 per bag',
          language: input.language ?? 'en',
          provider: 'dealbridge-fixture-asr',
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
      if (process.env.DEALBRIDGE_ALLOW_FIXTURE_MT === '1' || process.env.NODE_ENV === 'test') {
        return {
          text: `[${input.target}] ${input.text}`,
          provider: 'dealbridge-fixture-mt',
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
        voice: process.env.DEALBRIDGE_TTS_VOICE ?? 'alloy',
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
      if (process.env.DEALBRIDGE_ALLOW_FIXTURE_TTS === '1' || process.env.NODE_ENV === 'test') {
        // Never return text bytes as audio — that produces browser beeps/noise.
        const { generateSpeechWav } = await import('../gateway/own-tts.adapter');
        const wav = generateSpeechWav(
          input.text,
          process.env.DEALBRIDGE_TTS_VOICE?.startsWith('own:')
            ? process.env.DEALBRIDGE_TTS_VOICE
            : 'own:en-us-female',
          'en-US',
          { allowFormant: true },
        );
        return {
          audio: wav.audio,
          mimeType: 'audio/wav',
          provider: 'dealbridge-fixture-tts',
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
}
