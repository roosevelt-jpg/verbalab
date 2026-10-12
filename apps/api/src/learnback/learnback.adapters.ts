import { Injectable } from '@nestjs/common';
import { AudioService } from '../audio/audio.service';
import { languagePackVoiceId } from '../gateway/own-tts.adapter';
import { PronunciationIntelligenceService } from '../pronunciation-intelligence/pronunciation-intelligence.service';
import { TranslateService } from '../translate/translate.service';
import { pronunciationEnabled } from './learnback.types';

export type AsrResult = {
  text: string;
  provider: string;
  status: 'ok' | 'fixture' | 'unsupported' | 'uncertain';
  uncertainty: 'low' | 'medium' | 'high';
};

export type TtsResult = {
  audio: Buffer | null;
  mimeType: string | null;
  voice: string;
  status: 'ok' | 'fixture' | 'unsupported';
  modelVersion: string;
  note?: string;
};

export type PronunciationResult = {
  status: 'assessed' | 'not_assessed';
  reason?: string;
  findings: {
    feature: string;
    targetForm: string;
    evidence?: string;
    limitation?: string;
  }[];
  modelVersion: string;
};

function echoVoice(language: string): string {
  const curated: Record<string, string> = {
    en: 'own:en-gh-female',
    ak: 'own:ak-gh-female',
    ee: 'own:ee-gh-female',
    fr: 'own:fr-pack',
  };
  return curated[language] ?? languagePackVoiceId(language);
}

@Injectable()
export class LearnBackAdapters {
  constructor(
    private readonly audio: AudioService,
    private readonly translate: TranslateService,
    private readonly pronunciation: PronunciationIntelligenceService,
  ) {}

  voiceFor(language: string) {
    return echoVoice(language);
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
    const voice = echoVoice(input.language);
    const allowFixture =
      process.env.NODE_ENV === 'test' || process.env.LEARNBACK_ALLOW_FIXTURE_TTS === '1';
    try {
      const result = await this.audio.speak({
        text: input.text,
        voice,
        language: input.language,
        format: 'wav',
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
      });
      const audio = Buffer.isBuffer(result.audio)
        ? result.audio
        : Buffer.from(String((result as { audioBase64?: string }).audioBase64 ?? ''), 'base64');
      if (!audio.length) throw new Error('empty_tts');
      return {
        audio,
        mimeType: (result as { mimeType?: string }).mimeType ?? 'audio/wav',
        voice,
        status: 'ok',
        modelVersion: (result as { provider?: string }).provider ?? 'audio',
      };
    } catch {
      if (!allowFixture) {
        return {
          audio: null,
          mimeType: null,
          voice,
          status: 'unsupported',
          modelVersion: 'none',
          note: `No verified TTS for ${input.language}. Text remains available.`,
        };
      }
      const fixture = Buffer.alloc(44 + 16);
      fixture.write('RIFF', 0);
      fixture.writeUInt32LE(36 + 16, 4);
      fixture.write('WAVE', 8);
      fixture.write('fmt ', 12);
      fixture.writeUInt32LE(16, 16);
      fixture.writeUInt16LE(1, 20);
      fixture.writeUInt16LE(1, 22);
      fixture.writeUInt32LE(16000, 24);
      fixture.writeUInt32LE(32000, 28);
      fixture.writeUInt16LE(2, 32);
      fixture.writeUInt16LE(16, 34);
      fixture.write('data', 36);
      fixture.writeUInt32LE(16, 40);
      return {
        audio: fixture,
        mimeType: 'audio/wav',
        voice,
        status: 'fixture',
        modelVersion: 'learnback-fixture-tts',
        note: 'Fixture TTS for tests/local — not a native pronunciation claim.',
      };
    }
  }

  async recognize(input: {
    buffer: Buffer;
    mimeType: string;
    language: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }): Promise<AsrResult> {
    const allowFixture =
      process.env.NODE_ENV === 'test' || process.env.LEARNBACK_ALLOW_FIXTURE_ASR === '1';
    try {
      const file = {
        buffer: input.buffer,
        originalname: 'learnback-attempt.wav',
        mimetype: input.mimeType || 'audio/wav',
        size: input.buffer.length,
        fieldname: 'file',
        encoding: '7bit',
        destination: '',
        filename: '',
        path: '',
        stream: undefined as unknown as NodeJS.ReadableStream,
      } as Express.Multer.File;
      const result = await this.audio.transcribe({
        file,
        language: input.language,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
      });
      const text = (result.text ?? '').trim();
      const uncertainty: AsrResult['uncertainty'] =
        text.length < 8 ? 'high' : text.length < 24 ? 'medium' : 'low';
      return {
        text,
        provider: result.provider ?? 'audio',
        status: uncertainty === 'high' ? 'uncertain' : 'ok',
        uncertainty,
      };
    } catch {
      if (!allowFixture) {
        return {
          text: '',
          provider: 'none',
          status: 'unsupported',
          uncertainty: 'high',
        };
      }
      const fixture =
        process.env.LEARNBACK_FIXTURE_ASR_TEXT?.trim() ||
        'I fixed the issue at work. I checked the list and told my supervisor.';
      return {
        text: fixture,
        provider: 'learnback-fixture-asr',
        status: 'fixture',
        uncertainty: 'medium',
      };
    }
  }

  async localize(input: {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    organizationId: string;
    workspaceId: string;
  }): Promise<{ text: string; modelVersion: string; status: 'ready' | 'fixture' | 'identity' | 'unsupported' }> {
    if (input.sourceLanguage === input.targetLanguage) {
      return { text: input.text, modelVersion: 'identity', status: 'identity' };
    }
    const allowFixture =
      process.env.NODE_ENV === 'test' || process.env.LEARNBACK_ALLOW_FIXTURE_MT === '1';
    try {
      const result = await this.translate.translate({
        text: input.text,
        source: input.sourceLanguage,
        target: input.targetLanguage,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        skipReview: true,
      });
      return {
        text: result.text,
        modelVersion: (result as { engine?: string }).engine ?? 'lugemi-mt',
        status: 'ready',
      };
    } catch {
      if (!allowFixture) {
        return { text: '', modelVersion: 'none', status: 'unsupported' };
      }
      return {
        text: `[${input.targetLanguage}] ${input.text}`,
        modelVersion: 'learnback-fixture-mt',
        status: 'fixture',
      };
    }
  }

  async assessPronunciation(input: {
    reference: string;
    hypothesis: string;
    language: string;
    organizationId: string;
    workspaceId: string;
    audioBuffer?: Buffer;
    mimeType?: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }): Promise<PronunciationResult> {
    if (!pronunciationEnabled()) {
      return {
        status: 'not_assessed',
        reason:
          'No validated pronunciation assessor is enabled for this variety yet.',
        findings: [],
        modelVersion: 'none',
      };
    }
    // Only claim assessment for English when enabled — other varieties stay honest
    if (input.language !== 'en') {
      return {
        status: 'not_assessed',
        reason: `No validated phoneme assessor for ${input.language}. Use listen-and-repeat; do not invent scores.`,
        findings: [],
        modelVersion: 'none',
      };
    }
    try {
      let file: Express.Multer.File | undefined;
      if (input.audioBuffer?.length) {
        file = {
          buffer: input.audioBuffer,
          originalname: 'learnback-pron.wav',
          mimetype: input.mimeType || 'audio/wav',
          size: input.audioBuffer.length,
          fieldname: 'file',
          encoding: '7bit',
          destination: '',
          filename: '',
          path: '',
          stream: undefined as unknown as NodeJS.ReadableStream,
        } as Express.Multer.File;
      }
      const result = await this.pronunciation.assess({
        reference: input.reference,
        hypothesis: input.hypothesis,
        language: input.language,
        file,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
        skipAudit: true,
      });
      const coaching = (result.coaching ?? []).slice(0, 2).map((c) => ({
        feature: c.id || 'comprehensibility',
        targetForm: input.reference.slice(0, 40),
        evidence: c.message,
        limitation: 'Assessor output is advisory; accent variety is not graded as wrong.',
      }));
      return {
        status: 'assessed',
        findings: coaching,
        modelVersion: String((result as { modelVersion?: string }).modelVersion ?? 'pronunciation-intelligence'),
      };
    } catch {
      return {
        status: 'not_assessed',
        reason: 'Pronunciation adapter failed — left unscored rather than inventing a score.',
        findings: [],
        modelVersion: 'none',
      };
    }
  }
}
