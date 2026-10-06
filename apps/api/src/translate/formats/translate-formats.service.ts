import { Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { TranslateService } from '../translate.service';
import { ApiException } from '../../common/errors/api-exception';
import { planContent, splitForStreaming } from './plan-content';
import { restoreFormat, type ContentFormat } from './format-types';
import { translateEngineCatalog } from '../translate-engine.catalog';

const FORMATS: ContentFormat[] = ['html', 'markdown', 'xml', 'csv', 'srt', 'plain'];

@Injectable()
export class TranslateFormatsService {
  constructor(private readonly translate: TranslateService) {}

  engine() {
    return translateEngineCatalog();
  }

  parseFormat(raw?: string): ContentFormat {
    const f = (raw ?? '').trim().toLowerCase();
    if (!FORMATS.includes(f as ContentFormat)) {
      throw new ApiException(
        'validation_error',
        `format must be one of: ${FORMATS.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return f as ContentFormat;
  }

  async translateFormat(input: {
    format: ContentFormat;
    content: string;
    source: string;
    target: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    if (!input.content || typeof input.content !== 'string') {
      throw new ApiException('validation_error', 'content is required', HttpStatus.BAD_REQUEST);
    }
    const plan = planContent(input.format, input.content);
    const translations: string[] = [];
    let characters = 0;
    let provider = 'none';
    let glossaryApplied = false;
    let tmHits = 0;

    for (const segment of plan.segments) {
      const result = await this.translate.translate({
        text: segment.text,
        source: input.source,
        target: input.target,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
        skipReview: true,
      });
      translations.push(result.text);
      characters += result.characters ?? [...segment.text].length;
      provider = result.provider ?? provider;
      if (result.glossaryApplied) glossaryApplied = true;
      if (result.tmHit) tmHits += 1;
    }

    return {
      format: input.format,
      source: input.source,
      target: input.target,
      content: restoreFormat(plan, translations),
      segmentCount: plan.segments.length,
      characters,
      provider,
      glossaryApplied,
      tmHits,
      note: plan.note,
    };
  }

  async *streamTranslate(input: {
    text: string;
    source: string;
    target: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    const chunks = splitForStreaming(input.text);
    yield {
      event: 'start',
      chunkCount: chunks.length,
      source: input.source,
      target: input.target,
    };

    const translatedParts: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]!;
      const result = await this.translate.translate({
        text: chunk,
        source: input.source,
        target: input.target,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
        skipReview: true,
      });
      const translated = result.text;
      translatedParts.push(translated);
      yield {
        event: 'chunk',
        index: i,
        text: translated,
        characters: result.characters,
        provider: result.provider,
        tmHit: Boolean(result.tmHit),
      };
    }

    yield {
      event: 'done',
      text: translatedParts.join('\n\n'),
      chunkCount: chunks.length,
    };
  }

  async translateChat(input: {
    messages: Array<{ role: string; content: string }>;
    source: string;
    target: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    if (!Array.isArray(input.messages) || input.messages.length === 0) {
      throw new ApiException('validation_error', 'messages are required', HttpStatus.BAD_REQUEST);
    }
    const out = [];
    for (const msg of input.messages) {
      if (typeof msg.content !== 'string' || !msg.content) {
        out.push({ role: msg.role, content: msg.content ?? '', translated: false });
        continue;
      }
      const result = await this.translate.translate({
        text: msg.content,
        source: input.source,
        target: input.target,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
        skipReview: true,
      });
      out.push({
        role: msg.role,
        content: result.text,
        translated: true,
        provider: result.provider,
        tmHit: Boolean(result.tmHit),
      });
    }
    return {
      source: input.source,
      target: input.target,
      messages: out,
      note: 'Message content MT only — not a WhatsApp/Teams/SMS channel.',
    };
  }
}
