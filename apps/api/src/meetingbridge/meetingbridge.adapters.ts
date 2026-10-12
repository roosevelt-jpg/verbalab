import { Injectable } from '@nestjs/common';
import { AudioService } from '../audio/audio.service';
import { languagePackVoiceId } from '../gateway/own-tts.adapter';
import { TranslateService } from '../translate/translate.service';
import { GHANA_LANGUAGE_STACK } from '../ghana/ghana-language-stack';

export type MeetingTranslateResult = {
  text: string;
  status: 'ready' | 'fixture' | 'unsupported';
  modelVersion: string;
};

export type MeetingAsrResult = {
  text: string;
  language: string;
  status: 'ok' | 'fixture' | 'unsupported';
  provider: string;
};

export type MeetingTtsResult = {
  audio: Buffer | null;
  mimeType: string | null;
  voice: string;
  status: 'ok' | 'fixture' | 'unsupported';
  provider: string;
  note?: string;
};

/**
 * Echo voice ids that resolve in the own-TTS catalog.
 * Curated Ghana speakers where shipped; otherwise language-default `own:{code}-pack`.
 */
export function ghanaEchoVoiceId(languageCode: string): string {
  const curated: Record<string, string> = {
    en: 'own:en-gh-female',
    ak: 'own:ak-gh-female',
    ee: 'own:ee-gh-female',
  };
  return curated[languageCode] ?? languagePackVoiceId(languageCode);
}

export function ghanaAsrCapability(languageCode: string): {
  asr: boolean;
  tts: boolean;
  neuralClaim: boolean;
  note: string;
} {
  const major = new Set(['en', 'ak', 'ee', 'gaa', 'ada', 'dag', 'dga']);
  const known = GHANA_LANGUAGE_STACK.some((l) => l.code === languageCode);
  if (!known && languageCode !== 'fr') {
    return {
      asr: false,
      tts: false,
      neuralClaim: false,
      note: 'Language not in Ghana stack.',
    };
  }
  if (languageCode === 'en' || languageCode === 'fr') {
    return {
      asr: true,
      tts: true,
      neuralClaim: Boolean(process.env.OWN_TTS_URL?.trim()),
      note: 'Bridge language — ASR/TTS via Lugemi speech adapters.',
    };
  }
  if (major.has(languageCode)) {
    return {
      asr: process.env.MEETINGBRIDGE_GHANA_ASR === '1' || process.env.NODE_ENV === 'test',
      tts: true,
      neuralClaim: Boolean(process.env.OWN_TTS_URL?.trim()),
      note: process.env.OWN_TTS_URL?.trim()
        ? 'Dedicated Ghana listen-channel voice. Speech recognition stays gated until measured coverage is published.'
        : 'Dedicated Ghana listen-channel voice with formant fallback when neural synthesis is offline. Speech recognition stays gated until measured.',
    };
  }
  return {
    asr: false,
    tts: true,
    neuralClaim: false,
    note: 'Regional or community language listen-channel voice; speech recognition is not asserted.',
  };
}

@Injectable()
export class MeetingBridgeAdapters {
  constructor(
    private readonly translateService: TranslateService,
    private readonly audio: AudioService,
  ) {}

  async translateText(input: {
    text: string;
    sourceLang: string;
    targetLang: string;
    organizationId: string;
    workspaceId?: string;
  }): Promise<MeetingTranslateResult> {
    if (input.sourceLang === input.targetLang) {
      return { text: input.text, status: 'ready', modelVersion: 'identity' };
    }

    const allowFixture =
      process.env.NODE_ENV === 'test' || process.env.MEETINGBRIDGE_ALLOW_FIXTURE_MT === '1';

    try {
      const result = await this.translateService.translate({
        text: input.text,
        source: input.sourceLang,
        target: input.targetLang,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId ?? '',
        skipReview: true,
      });
      return {
        text: result.text,
        status: 'ready',
        modelVersion: (result as { engine?: string }).engine ?? 'lugemi-mt',
      };
    } catch {
      if (!allowFixture) {
        return {
          text: '',
          status: 'unsupported',
          modelVersion: 'none',
        };
      }
      return {
        text: `[fixture ${input.sourceLang}→${input.targetLang}] ${input.text}`,
        status: 'fixture',
        modelVersion: 'fixture-mt',
      };
    }
  }

  async recognizeSpeech(input: {
    file: Express.Multer.File;
    language?: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }): Promise<MeetingAsrResult> {
    const lang = input.language?.trim() || 'en';
    const cap = ghanaAsrCapability(lang);
    const allowFixture =
      process.env.NODE_ENV === 'test' || process.env.MEETINGBRIDGE_ALLOW_FIXTURE_ASR === '1';

    if (!cap.asr && !allowFixture) {
      return {
        text: '',
        language: lang,
        status: 'unsupported',
        provider: 'none',
      };
    }

    try {
      const result = await this.audio.transcribe({
        file: input.file,
        language: lang,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
      });
      return {
        text: result.text,
        language: result.language ?? lang,
        status: 'ok',
        provider: result.provider ?? 'audio',
      };
    } catch {
      if (!allowFixture) {
        return { text: '', language: lang, status: 'unsupported', provider: 'none' };
      }
      return {
        text: process.env.MEETINGBRIDGE_FIXTURE_ASR_TEXT ?? 'Dispatch fifty bags by Friday',
        language: lang,
        status: 'fixture',
        provider: 'meetingbridge-fixture-asr',
      };
    }
  }

  async synthesizeSpeech(input: {
    text: string;
    language: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }): Promise<MeetingTtsResult> {
    const voice = ghanaEchoVoiceId(input.language);
    const cap = ghanaAsrCapability(input.language);
    const allowFixture =
      process.env.NODE_ENV === 'test' || process.env.MEETINGBRIDGE_ALLOW_FIXTURE_TTS === '1';

    if (!cap.tts && !allowFixture) {
      return {
        audio: null,
        mimeType: null,
        voice,
        status: 'unsupported',
        provider: 'none',
        note: cap.note,
      };
    }

    try {
      const result = await this.audio.speak({
        text: input.text,
        voice,
        language: input.language,
        format: 'mp3',
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
      });
      return {
        audio: result.audio,
        mimeType: result.mimeType ?? 'audio/mpeg',
        voice: (result as { voice?: string }).voice ?? voice,
        status: 'ok',
        provider: result.provider ?? 'own-tts',
        note: cap.note,
      };
    } catch {
      if (!allowFixture) {
        return {
          audio: null,
          mimeType: null,
          voice,
          status: 'unsupported',
          provider: 'none',
          note: cap.note,
        };
      }
      const { generateSpeechWav } = await import('../gateway/own-tts.adapter');
      const wav = generateSpeechWav(input.text, voice, input.language, { allowFormant: true });
      return {
        audio: wav.audio,
        mimeType: 'audio/wav',
        voice,
        status: 'fixture',
        provider: 'meetingbridge-fixture-tts',
        note: `${cap.note} Fixture Echo audio labeled (${wav.engine}).`,
      };
    }
  }

  ghanaVoicePack() {
    return GHANA_LANGUAGE_STACK.map((lang) => {
      const cap = ghanaAsrCapability(lang.code);
      return {
        code: lang.code,
        name: lang.nameEn,
        echoVoiceId: ghanaEchoVoiceId(lang.code),
        asr: cap.asr,
        tts: cap.tts,
        neuralClaim: cap.neuralClaim,
        note: cap.note,
      };
    });
  }
}
