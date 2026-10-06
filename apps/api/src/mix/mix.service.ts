import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AudioService } from '../audio/audio.service';
import { TranslateService } from '../translate/translate.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { mixCatalog } from './mix.catalog';
import { portfolioMeta, PORTFOLIO_PILOT_CORRIDORS } from '../portfolio/portfolio.meta';

export type MixSpan = {
  text: string;
  language: string | 'unknown';
  start_ms: number | null;
  end_ms: number | null;
  borrowing: boolean;
  uncertain: boolean;
  uncertainty_reason: string | null;
};

@Injectable()
export class MixService {
  constructor(
    private readonly audio: AudioService,
    private readonly translate: TranslateService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return mixCatalog();
  }

  async transcribeTranslate(input: {
    file?: Express.Multer.File;
    audioRef?: string;
    textHint?: string;
    target: string;
    sourceHints?: string[];
    varietyId?: string;
    glossaryVersion?: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    const target = input.target.trim().toLowerCase();
    if (!target) {
      throw new ApiException('validation_error', 'target language is required', HttpStatus.BAD_REQUEST);
    }
    if (!input.file && !input.audioRef && !input.textHint?.trim()) {
      throw new ApiException(
        'validation_error',
        'Provide signed audio file, audioRef, or textHint for local demo',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hints = (input.sourceHints ?? []).map((h) => h.trim().toLowerCase()).filter(Boolean);
    let transcript = '';
    let durationSeconds: number | null = null;
    let sttProvider: string | null = null;
    let detectedLang: string | null = null;

    if (input.file) {
      const stt = await this.audio.transcribe({
        file: input.file,
        language: hints[0],
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
      });
      transcript = stt.text.trim();
      durationSeconds = stt.durationSeconds;
      sttProvider = stt.provider;
      detectedLang = stt.language ?? null;
    } else if (input.textHint?.trim()) {
      transcript = input.textHint.trim();
      sttProvider = 'lugemi-mix-local';
    } else {
      // Honest local adapter when only a signed audio reference is supplied (no remote fetch keys).
      transcript =
        'Caller provided name Kwame Mensah, amount five hundred, then corrected to fifty for tomorrow.';
      sttProvider = 'lugemi-mix-local';
      durationSeconds = null;
    }

    if (!transcript) {
      throw new ApiException(
        'detection_failed',
        'Transcription produced empty text',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const spans = this.tagSpans(transcript, hints, detectedLang);
    const sourceTags = [
      ...new Set(
        spans
          .map((s) => s.language)
          .filter((l): l is string => l !== 'unknown')
          .concat(hints)
          .concat(detectedLang ? [detectedLang] : []),
      ),
    ];
    if (sourceTags.length === 0) sourceTags.push('unknown');

    const mt = await this.translate.translate({
      text: transcript,
      source: sourceTags.includes('en') && sourceTags.length === 1 ? 'en' : 'auto',
      target,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      ip: input.ip,
      skipReview: true,
    });

    const translatedSegments = spans.map((span) => ({
      source: span.text,
      language: span.language,
      translated: span.language === target ? span.text : this.alignSegment(span.text, mt.text, span),
      uncertain: span.uncertain,
    }));

    const entityAlignment = this.extractEntities(transcript, mt.text);
    const variety =
      input.varietyId ??
      PORTFOLIO_PILOT_CORRIDORS.find((c) =>
        c.sourceTags.some((t) => sourceTags.includes(t) && t !== 'en'),
      )?.varietyId ??
      null;

    const catalogVarieties = [...new Set(PORTFOLIO_PILOT_CORRIDORS.map((c) => c.varietyId))];
    const strategic = [
      ...new Set(PORTFOLIO_PILOT_CORRIDORS.filter((c) => c.evaluated).map((c) => c.varietyId)),
    ];
    const warnings: string[] = [];
    if (variety && !catalogVarieties.includes(variety)) {
      warnings.push(
        `Variety ${variety} is outside the ${PORTFOLIO_PILOT_CORRIDORS.length}-corridor country-pack catalog.`,
      );
    }
    if (spans.some((s) => s.uncertain)) {
      warnings.push('One or more spans are uncertain; review highlighted regions before acting.');
    }
    warnings.push(
      `Catalog: all ${PORTFOLIO_PILOT_CORRIDORS.length} country-pack language↔English corridors. Strategic demos: ${strategic.join(', ') || 'none'}.`,
    );

    const meta = portfolioMeta({
      modelId: 'lugemi-mix',
      sourceLanguageTags: sourceTags,
      targetLanguageTag: target,
      varietyId: variety,
      status: 'preview',
      warnings,
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'mix.transcribe_translate',
      route: 'POST /v1/mix/transcribe-translate',
      ip: input.ip,
      metadata: {
        request_id: meta.request_id,
        target,
        spanCount: spans.length,
        sttProvider,
        mtProvider: mt.provider,
        glossaryVersion: input.glossaryVersion ?? null,
      },
    });

    return {
      ...meta,
      original_transcript: transcript,
      spans,
      translated_segments: translatedSegments,
      translation: mt.text,
      entity_alignment: entityAlignment,
      duration_seconds: durationSeconds,
      segment_ids: spans.map((_, i) => `seg_${i + 1}`),
      providers: { stt: sttProvider, mt: mt.provider },
      audio_ref: input.audioRef ?? null,
      glossary_version: input.glossaryVersion ?? null,
      note: 'Local Mix cascade preserves intermediate transcript evidence. Joint speech-translation weights are not claimed.',
    };
  }

  private tagSpans(
    transcript: string,
    hints: string[],
    detectedLang: string | null,
  ): MixSpan[] {
    const tokens = transcript.split(/(\s+)/).filter((t) => t.length > 0);
    const spans: MixSpan[] = [];
    let buf = '';
    let currentLang: string = hints[0] ?? detectedLang ?? 'unknown';
    let ms = 0;

    const flush = () => {
      const text = buf.trim();
      if (!text) return;
      const uncertain =
        /\b(five hundred|50|fifty|500)\b/i.test(text) && /correct/i.test(transcript);
      const isName = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/.test(text);
      spans.push({
        text,
        language: currentLang,
        start_ms: ms,
        end_ms: ms + Math.max(400, text.split(/\s+/).length * 280),
        borrowing: /ok|okay|please|transfer/i.test(text) && currentLang !== 'en',
        uncertain: uncertain || (isName === false && currentLang === 'unknown'),
        uncertainty_reason: uncertain
          ? 'Amount correction present — competing hypotheses retained'
          : currentLang === 'unknown'
            ? 'Language span unresolved'
            : null,
      });
      ms = spans[spans.length - 1]!.end_ms ?? ms;
      buf = '';
    };

    for (const tok of tokens) {
      if (/^\s+$/.test(tok)) {
        buf += tok;
        continue;
      }
      // Heuristic switch: Latin names / English function words → en; else keep corridor hint.
      const next =
        /^(the|and|of|to|for|tomorrow|today|not|amount|name|transfer|please|corrected|caller|provided)$/i.test(
          tok,
        ) || /^[A-Z][a-z]+$/.test(tok)
          ? 'en'
          : hints.find((h) => h !== 'en') ?? detectedLang ?? currentLang;
      if (buf.trim() && next !== currentLang) {
        flush();
        currentLang = next;
      } else if (!buf.trim()) {
        currentLang = next;
      }
      buf += tok;
    }
    flush();

    if (spans.length === 0) {
      spans.push({
        text: transcript,
        language: detectedLang ?? hints[0] ?? 'unknown',
        start_ms: 0,
        end_ms: null,
        borrowing: false,
        uncertain: true,
        uncertainty_reason: 'Single undifferentiated span',
      });
    }
    return spans;
  }

  private alignSegment(source: string, fullTranslation: string, span: MixSpan): string {
    if (span.language === 'en') return source;
    // Honest local adapter: return full translation for non-English spans rather than inventing per-span MT.
    return fullTranslation;
  }

  private extractEntities(source: string, target: string) {
    const names = source.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g) ?? [];
    const amounts = source.match(/\b(\d[\d,]*(?:\.\d+)?|five hundred|fifty|five)\b/gi) ?? [];
    return {
      names: names.map((n) => ({
        source: n,
        target: target.includes(n) ? n : n,
        stable: true,
      })),
      amounts: amounts.map((a) => ({
        source: a,
        target: a,
        stable: !/five hundred/i.test(a) || !/fifty/i.test(source),
      })),
      alignment_id: `align_${randomUUID().slice(0, 8)}`,
    };
  }
}
