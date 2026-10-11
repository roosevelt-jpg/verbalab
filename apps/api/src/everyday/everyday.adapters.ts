import { Injectable } from '@nestjs/common';
import { AudioService } from '../audio/audio.service';
import { DocumentCodecService } from '../documents/document-codec.service';
import { GatewayService } from '../gateway/gateway.service';
import { languagePackVoiceId } from '../gateway/own-tts.adapter';
import { TranslateService } from '../translate/translate.service';
import {
  buildBlocksFromText,
  preserveCriticalTokens,
} from './everyday.checks';
import type { EverydayBlock } from './everyday.types';

export type EverydayOcrResult = {
  text: string;
  pages: number;
  provider: string;
  modelVersion: string;
  blocks: EverydayBlock[];
  status: 'ok' | 'fixture' | 'unsupported';
};

export type EverydayTranslateResult = {
  text: string;
  modelVersion: string;
  status: 'ready' | 'fixture' | 'unsupported';
  criticalFindings: { code: string; message: string }[];
};

export type EverydayTtsResult = {
  audio: Buffer | null;
  mimeType: string | null;
  voice: string;
  modelVersion: string;
  status: 'ok' | 'fixture' | 'unsupported' | 'failed';
  note?: string;
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
export class EverydayAdapters {
  constructor(
    private readonly gateway: GatewayService,
    private readonly translate: TranslateService,
    private readonly audio: AudioService,
    private readonly codec: DocumentCodecService,
  ) {}

  voiceFor(language: string) {
    return echoVoice(language);
  }

  async extractTextFromUpload(input: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }): Promise<{ text: string; pageCount: number; via: string }> {
    if (input.mimeType === 'text/plain' || input.filename.toLowerCase().endsWith('.txt')) {
      return { text: input.buffer.toString('utf8'), pageCount: 1, via: 'plaintext' };
    }
    if (input.mimeType === 'application/pdf' || input.filename.toLowerCase().endsWith('.pdf')) {
      try {
        const decoded = await this.codec.extract(input.buffer, input.mimeType, input.filename);
        const text = decoded.paragraphs.join('\n\n');
        const pages = Math.max(1, decoded.paragraphs.length ? Math.ceil(decoded.paragraphs.length / 8) : 1);
        return { text, pageCount: pages, via: 'pdf-parse' };
      } catch {
        // Fall through to OCR path for image-like PDFs / fixture providers
      }
    }
    return { text: '', pageCount: 1, via: 'ocr' };
  }

  async runOcr(input: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
    languageHint?: string;
  }): Promise<EverydayOcrResult> {
    const allowFixture =
      process.env.NODE_ENV === 'test' || process.env.EVERYDAY_ALLOW_FIXTURE_OCR === '1';

    const pre = await this.extractTextFromUpload(input);
    if (pre.text.trim() && pre.via !== 'ocr') {
      const blocks = buildBlocksFromText(pre.text, pre.pageCount);
      return {
        text: pre.text,
        pages: pre.pageCount,
        provider: pre.via,
        modelVersion: `everyday-${pre.via}`,
        blocks,
        status: 'ok',
      };
    }

    try {
      const ocr = await this.gateway.ocr({
        buffer: input.buffer,
        filename: input.filename,
        mimeType: input.mimeType,
        languageHints: input.languageHint ? [input.languageHint] : undefined,
      });
      const blocks = buildBlocksFromText(ocr.text, ocr.pages);
      return {
        text: ocr.text,
        pages: ocr.pages,
        provider: ocr.provider,
        modelVersion: ocr.provider,
        blocks,
        status: 'ok',
      };
    } catch {
      if (!allowFixture) {
        return {
          text: '',
          pages: 0,
          provider: 'none',
          modelVersion: 'none',
          blocks: [],
          status: 'unsupported',
        };
      }
      const fixtureText =
        process.env.EVERYDAY_FIXTURE_OCR_TEXT?.trim() ||
        input.buffer.toString('utf8').replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, '').trim() ||
        'School notice. Please attend on 2026-10-20. Amount due: GHS 150. Reference: REF-00042. Do not ignore this letter.';
      const blocks = buildBlocksFromText(fixtureText, 1);
      return {
        text: fixtureText,
        pages: 1,
        provider: 'everyday-fixture-ocr',
        modelVersion: 'everyday-fixture-ocr',
        blocks,
        status: 'fixture',
      };
    }
  }

  async translateFaithful(input: {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    organizationId: string;
    workspaceId: string;
  }): Promise<EverydayTranslateResult> {
    if (input.sourceLanguage === input.targetLanguage) {
      return {
        text: input.text,
        modelVersion: 'identity',
        status: 'ready',
        criticalFindings: [],
      };
    }
    const allowFixture =
      process.env.NODE_ENV === 'test' || process.env.EVERYDAY_ALLOW_FIXTURE_MT === '1';
    try {
      const result = await this.translate.translate({
        text: input.text,
        source: input.sourceLanguage,
        target: input.targetLanguage,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        skipReview: true,
      });
      const criticalFindings = preserveCriticalTokens(input.text, result.text);
      return {
        text: result.text,
        modelVersion: (result as { engine?: string }).engine ?? 'lugemi-mt',
        status: 'ready',
        criticalFindings,
      };
    } catch {
      if (!allowFixture) {
        return {
          text: '',
          modelVersion: 'none',
          status: 'unsupported',
          criticalFindings: [
            {
              code: 'mt_unavailable',
              message: 'Faithful translation adapter is unavailable for this corridor.',
            },
          ],
        };
      }
      // Deterministic fixture that preserves numbers, refs, negations, and dates.
      const fixture = `[${input.targetLanguage}] ${input.text}`;
      return {
        text: fixture,
        modelVersion: 'everyday-fixture-mt',
        status: 'fixture',
        criticalFindings: preserveCriticalTokens(input.text, fixture),
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
  }): Promise<EverydayTtsResult> {
    const voice = echoVoice(input.language);
    const allowFixture =
      process.env.NODE_ENV === 'test' || process.env.EVERYDAY_ALLOW_FIXTURE_TTS === '1';
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
      if (!audio.length) {
        throw new Error('empty_tts');
      }
      return {
        audio,
        mimeType: (result as { mimeType?: string }).mimeType ?? 'audio/wav',
        voice,
        modelVersion: (result as { provider?: string }).provider ?? 'audio',
        status: 'ok',
      };
    } catch {
      if (!allowFixture) {
        return {
          audio: null,
          mimeType: null,
          voice,
          modelVersion: 'none',
          status: 'unsupported',
          note: `No verified TTS voice for ${input.language}. Text is available; neighboring-language audio is not substituted.`,
        };
      }
      // Minimal RIFF header + silence-ish payload labeled fixture
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
        modelVersion: 'everyday-fixture-tts',
        status: 'fixture',
        note: 'Fixture TTS for tests/local — not a native pronunciation claim.',
      };
    }
  }
}
