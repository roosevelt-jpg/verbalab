import { createHash, randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { GatewayService } from '../gateway/gateway.service';
import { ApiException } from '../common/errors/api-exception';
import { resolveDemoSpeechTarget } from '../demo-speech/demo-resolve';
import { DIALECT_SEEDS } from '../dialects/dialect-seeds';
import { ACCENT_SEEDS } from '../accents/accent-seeds';
import { LanguagePassportService } from '../language-passport/passport.service';
import { PrismaService } from '../prisma/prisma.service';
import { SpeechReviewService } from '../speech-review/speech-review.service';
import { assertTaskAuthorized, buildNseCapabilities } from './nse.capabilities';
import { diagnoseSpeechAudio, looksLikeAudioBuffer } from './nse.diagnosis';
import { applyPronunciationAliases, normalizeForSynthesis } from './nse.normalize';
import {
  NSE_RESOLVER_VERSION,
  type NseProsodySettings,
  type NseProvenance,
  type NseTask,
} from './nse.types';

type Actor = {
  organizationId?: string;
  workspaceId?: string;
  userId?: string;
};

function scoreCues(text: string, cues: string[]): { score: number; matched: string[] } {
  const lower = text.toLocaleLowerCase('en');
  const matched: string[] = [];
  for (const cue of cues) {
    const c = cue.trim().toLocaleLowerCase('en');
    if (!c) continue;
    if (lower.includes(c)) matched.push(cue);
  }
  const score = cues.length ? matched.length / Math.max(3, Math.min(cues.length, 12)) : 0;
  return { score: Math.min(1, score), matched };
}

@Injectable()
export class NativeSpeechEngineService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly passport: LanguagePassportService,
    private readonly prisma: PrismaService,
    private readonly speechReview: SpeechReviewService,
  ) {}

  capabilities() {
    const live = this.gateway.listVoices();
    const manifest = buildNseCapabilities(live);
    const approved = this.speechReview.approvedCatalogue();
    return {
      product: 'native_speech_engine',
      promise:
        'Understand supported source speech. Speak natural target varieties — without fabricating coverage.',
      ...manifest,
      approvedNativeReviews: approved.count,
      streamingInterpretation: {
        status: 'limited',
        note: 'Requires additional lifecycle tests (cancel/ack/epoch). Batch/turn paths are production.',
      },
    };
  }

  diagnose(input: {
    audioBase64: string;
    mimeType?: string;
    synthEngine?: string;
    verificationStatus?: string;
    requireIntelligible?: boolean;
  }) {
    let audio: Buffer;
    try {
      audio = Buffer.from(input.audioBase64, 'base64');
    } catch {
      throw new ApiException('validation_error', 'audioBase64 is invalid', HttpStatus.BAD_REQUEST);
    }
    const result = diagnoseSpeechAudio({
      audio,
      mimeType: input.mimeType || 'application/octet-stream',
      synthEngine: input.synthEngine,
      verificationStatus: input.verificationStatus,
      requireIntelligible: input.requireIntelligible ?? true,
    });
    return {
      engineVersion: NSE_RESOLVER_VERSION,
      ...result,
      looksLikeAudio: looksLikeAudioBuffer(audio, input.mimeType || ''),
    };
  }

  /** Advisory dialect/accent cue detection — never silent nationality inference. */
  async detectSourceVariety(input: { text?: string; askIfUncertain?: boolean }) {
    const text = input.text?.trim() ?? '';
    if (!text) {
      return {
        status: 'needs_clarification' as const,
        reason: 'empty_text',
        note: 'Provide text or select a source variety explicitly.',
        nationalityInference: false,
      };
    }

    const detected = await this.gateway.detect({ text });
    const dialectScores = DIALECT_SEEDS.filter((d) =>
      !detected.language ? true : d.languageCode === detected.language || d.languageCode.startsWith(detected.language),
    )
      .map((d) => {
        const cues = Array.isArray(d.cueTerms) ? d.cueTerms : [];
        const { score, matched } = scoreCues(text, cues);
        return {
          code: d.code,
          nameEn: d.nameEn,
          languageCode: d.languageCode,
          score,
          matchedCues: matched,
        };
      })
      .filter((d) => d.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const accentScores = ACCENT_SEEDS.map((a) => {
      const cues = Array.isArray(a.cueTerms) ? a.cueTerms : [];
      const { score, matched } = scoreCues(text, cues);
      return {
        code: a.code,
        nameEn: a.nameEn,
        languageCode: a.languageCode,
        score,
        matchedCues: matched,
      };
    })
      .filter((a) => a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const top = dialectScores[0]?.score ?? accentScores[0]?.score ?? 0;
    const uncertain = top < 0.35;
    return {
      status: uncertain && input.askIfUncertain !== false ? ('needs_clarification' as const) : ('suggested' as const),
      language: detected,
      dialects: dialectScores,
      accents: accentScores,
      note: uncertain
        ? 'Source variety is ambiguous — user selection overrides unsupported guesses. Cue scoring is not acoustic phonetics ID.'
        : 'Suggestion only; synthesis target variety is selected independently.',
      nationalityInference: false,
    };
  }

  async synthesize(
    input: {
      text: string;
      language: string;
      voice?: string;
      format?: 'mp3' | 'wav';
      prosody?: NseProsodySettings;
      requireIntelligible?: boolean;
      demoRemap?: boolean;
      passportDictionary?: boolean;
      organizationId?: string;
      workspaceId?: string;
      userId?: string;
    },
    actor?: Actor,
  ) {
    const textIn = input.text?.trim() ?? '';
    const language = input.language?.trim() ?? '';
    if (!textIn || !language) {
      throw new ApiException('validation_error', 'text and language are required', HttpStatus.BAD_REQUEST);
    }
    if ([...textIn].length > 2500) {
      throw new ApiException('validation_error', 'text exceeds 2500 characters', HttpStatus.BAD_REQUEST);
    }

    const requireIntelligible = input.requireIntelligible !== false;
    const demoRemap = input.demoRemap !== false && requireIntelligible;

    let voice = input.voice?.trim();
    let lang = language;
    let workText = textIn;
    let remapped = false;
    let remapNote: string | null = null;
    let requestedVoice: string | null = voice ?? null;

    if (demoRemap) {
      const target = resolveDemoSpeechTarget({ text: workText, language: lang, voice });
      if (!target.voice) {
        throw new ApiException(
          'capability_unavailable',
          'No verified synthesizer for this language/voice — refusing fabricated accent.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      voice = target.voice;
      lang = target.language;
      workText = target.text;
      remapped = target.remapped;
      remapNote = target.note;
      requestedVoice = target.requestedVoice;
    }

    const caps = buildNseCapabilities(this.gateway.listVoices());
    const authorized = assertTaskAuthorized(caps.capabilities, 'text_to_speech', voice, lang);
    if (!authorized || authorized.status === 'unavailable' || authorized.status === 'suspended') {
      throw new ApiException(
        'capability_unavailable',
        'Voice/language not authorized for text_to_speech in the Native Speech Engine registry',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    let pronunciationApplied = 0;
    const aliases: Array<{ grapheme: string; alias: string }> = [];
    const orgId = actor?.organizationId ?? input.organizationId;
    const wsId = actor?.workspaceId ?? input.workspaceId;
    if (orgId && wsId) {
      const lexemes = await this.prisma.voiceStudioLexeme.findMany({
        where: { organizationId: orgId, workspaceId: wsId },
        take: 500,
      });
      for (const l of lexemes) aliases.push({ grapheme: l.grapheme, alias: l.alias });
    }
    if (input.passportDictionary && actor?.userId && orgId && wsId) {
      try {
        const plan = await this.passport.resolve(
          { organizationId: orgId, workspaceId: wsId, userId: actor.userId },
          {
            product: 'neural_tts',
            text: workText,
            languageVariety: lang,
            pinSnapshot: false,
          },
        );
        for (const a of plan.pronunciationAliases ?? []) {
          aliases.push({ grapheme: a.grapheme, alias: a.alias });
        }
      } catch {
        /* optional */
      }
    }
    if (aliases.length) {
      const applied = applyPronunciationAliases(workText, aliases);
      workText = applied.text;
      pronunciationApplied = applied.applied;
    }

    const normalized = normalizeForSynthesis({
      text: workText,
      targetLang: lang,
      prosody: input.prosody,
    });

    const out = await this.gateway.synthesize({
      text: normalized.text,
      voice: voice!,
      language: lang,
      format: input.format ?? 'mp3',
      requireIntelligible,
    });

    const diagnosis = diagnoseSpeechAudio({
      audio: out.audio,
      mimeType: out.mimeType,
      synthEngine: out.synthEngine,
      verificationStatus: out.verificationStatus,
      requireIntelligible,
    });

    if (!diagnosis.ok || !looksLikeAudioBuffer(out.audio, out.mimeType)) {
      throw new ApiException(
        'provider_error',
        `Speech delivery blocked: ${diagnosis.issues.map((i) => i.code).join(', ') || 'invalid audio'}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const jobId = `nse_${randomUUID()}`;
    const provenance: NseProvenance = {
      engineVersion: NSE_RESOLVER_VERSION,
      synthesizerVersion: out.provider,
      voiceId: out.voice,
      languageVariety: lang,
      synthEngine: out.synthEngine,
      verificationStatus: out.verificationStatus,
      remapped,
      remapNote,
      pronunciationApplied,
      tokenizerVersion: 'text_nfc_v1',
      decoderVersion: out.synthEngine || 'unknown',
    };

    return {
      jobId,
      task: 'text_to_speech' as NseTask,
      status: 'completed' as const,
      audioBase64: out.audio.toString('base64'),
      mimeType: out.mimeType,
      characters: out.characters,
      durationHintMs: diagnosis.durationHintMs,
      capabilityStatus: authorized.status,
      diagnosis: { ok: true, issues: diagnosis.issues },
      normalization: normalized.applied,
      provenance,
      requestedVoice,
      checksum: createHash('sha256').update(out.audio).digest('hex'),
      _audio: out.audio,
      _headers: {
        voice: out.voice,
        provider: out.provider,
        synthEngine: out.synthEngine,
        verificationStatus: out.verificationStatus,
        remapped,
        requestedVoice,
        requestedLanguage: language,
        remapNote,
      },
    };
  }

  async speechToText(input: {
    audioBase64: string;
    mimeType?: string;
    language?: string;
    askIfUncertain?: boolean;
  }) {
    if (!input.audioBase64?.trim()) {
      throw new ApiException('validation_error', 'audioBase64 is required', HttpStatus.BAD_REQUEST);
    }
    const buf = Buffer.from(input.audioBase64, 'base64');
    if (!looksLikeAudioBuffer(buf, input.mimeType || 'audio/wav')) {
      throw new ApiException(
        'validation_error',
        'Input is not valid audio — refusing recognition',
        HttpStatus.BAD_REQUEST,
      );
    }
    const result = await this.gateway.transcribe({
      buffer: buf,
      filename: 'nse-input.wav',
      mimeType: input.mimeType || 'audio/wav',
      language: input.language,
    });
    const variety = result.text
      ? await this.detectSourceVariety({ text: result.text, askIfUncertain: input.askIfUncertain })
      : null;
    return {
      jobId: `nse_asr_${randomUUID()}`,
      task: 'speech_to_text' as NseTask,
      status: variety?.status === 'needs_clarification' ? ('needs_clarification' as const) : ('completed' as const),
      text: result.text,
      language: result.language,
      confidence: result.confidence,
      provider: result.provider,
      sourceVariety: variety,
      provenance: {
        engineVersion: NSE_RESOLVER_VERSION,
        recognizerVersion: result.provider,
      },
      note: 'Low recognition confidence is never a judgment about speaker competence.',
    };
  }

  async speechTranslate(
    input: {
      audioBase64?: string;
      text?: string;
      sourceLanguage?: string;
      targetLanguage: string;
      targetVoice?: string;
      prosody?: NseProsodySettings;
    },
    actor?: Actor,
  ) {
    let sourceText = input.text?.trim() ?? '';
    let asrProvenance: Record<string, unknown> | undefined;
    if (!sourceText && input.audioBase64) {
      const asr = await this.speechToText({
        audioBase64: input.audioBase64,
        language: input.sourceLanguage,
      });
      if (asr.status === 'needs_clarification') {
        return {
          jobId: asr.jobId,
          task: 'speech_translation' as NseTask,
          status: 'needs_clarification' as const,
          audio: null,
          issues: [{ field: 'source_variety', reason: 'Ambiguous source dialect/accent — select explicitly.' }],
          sourceText: asr.text,
          provenance: asr.provenance,
        };
      }
      sourceText = asr.text;
      asrProvenance = asr.provenance;
    }
    if (!sourceText) {
      throw new ApiException('validation_error', 'text or audioBase64 is required', HttpStatus.BAD_REQUEST);
    }
    if (!input.targetLanguage?.trim()) {
      throw new ApiException('validation_error', 'targetLanguage is required', HttpStatus.BAD_REQUEST);
    }

    const source = input.sourceLanguage || 'auto';
    const mt = await this.gateway.translate({
      text: sourceText,
      source,
      target: input.targetLanguage,
    });

    const speech = await this.synthesize(
      {
        text: mt.text,
        language: input.targetLanguage,
        voice: input.targetVoice,
        prosody: input.prosody,
        requireIntelligible: true,
        demoRemap: true,
        organizationId: actor?.organizationId,
        workspaceId: actor?.workspaceId,
        userId: actor?.userId,
      },
      actor,
    );

    return {
      jobId: speech.jobId,
      task: 'speech_translation' as NseTask,
      status: 'completed' as const,
      sourceText,
      targetText: mt.text,
      sourceLanguage: mt.source,
      targetLanguage: mt.target,
      audioBase64: speech.audioBase64,
      mimeType: speech.mimeType,
      provenance: {
        ...speech.provenance,
        recognizerVersion: asrProvenance?.recognizerVersion as string | undefined,
        translatorVersion: mt.provider,
      },
      diagnosis: speech.diagnosis,
      _audio: speech._audio,
      _headers: speech._headers,
      note: 'Source accent is not copied into the target variety by default.',
    };
  }

  async textTranslate(input: { text: string; source?: string; target: string }) {
    const mt = await this.gateway.translate({
      text: input.text,
      source: input.source || 'auto',
      target: input.target,
    });
    return {
      task: 'text_translation' as NseTask,
      status: 'completed' as const,
      text: mt.text,
      source: mt.source,
      target: mt.target,
      provider: mt.provider,
      provenance: {
        engineVersion: NSE_RESOLVER_VERSION,
        translatorVersion: mt.provider,
      },
      note: 'Does not invent emotion or change commitments for politeness.',
    };
  }

  evaluationPlan() {
    return {
      product: 'native_speech_engine_evaluation',
      dimensions: [
        'meaning',
        'intelligibility',
        'pronunciation',
        'lexical_tone',
        'rhythm',
        'naturalness',
        'variety_authenticity',
      ],
      rules: [
        'Qualified native reviewers supply judgments; AI ratings are supplementary and labeled.',
        'ASR back-transcription can catch omissions but cannot alone certify tone/pronunciation.',
        'Review corrections do not automatically become training data.',
        'Fine-tuning requires licensed/consented data, session-separated splits, checkpointing, and rollback.',
        'Intelligible regional speech must not fail solely for differing from a prestige accent.',
      ],
      releaseGate: [
        'technically_verified assets',
        'critical regression tests pass',
        'native review for declared variety/task',
        'documented limitations',
      ],
      fineTune: {
        autoFromReviews: false,
        autoFromPassport: false,
        scriptsPath: 'services/tts/training/',
        note: 'Piper/Kokoro training remains operator-driven; no silent private-speech fine-tune API.',
      },
      speechReview: this.speechReview.approvedCatalogue(),
    };
  }
}
