import { HttpStatus, Injectable } from '@nestjs/common';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { TranslateService } from '../translate/translate.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { deepCloneJson, flattenStrings, setAtPath } from './i18n-tree';
import { protectIcu, restoreIcu } from './icu';

export type LocalizeFormat = 'json' | 'yaml';

const MAX_STRINGS = Number(process.env.LOCALIZE_MAX_STRINGS ?? 200);

@Injectable
export class LocalizeService {
  constructor(
    private readonly translate: TranslateService,
    private readonly audit: AuditService,
  ) {}

  parseContent(format: LocalizeFormat, raw: string): unknown {
    try {
      if (format === 'json') return JSON.parse(raw) as unknown;
      return parseYaml(raw) as unknown;
    } catch {
      throw new ApiException('validation_error', `Invalid ${format} content`, HttpStatus.BAD_REQUEST);
    }
  }

  serializeContent(format: LocalizeFormat, value: unknown): string {
    if (format === 'json') return `${JSON.stringify(value, null, 2)}\n`;
    return stringifyYaml(value);
  }

  detectFormat(filename: string, explicit?: string): LocalizeFormat {
    if (explicit === 'json' || explicit === 'yaml') return explicit;
    const lower = filename.toLowerCase;
    if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml';
    if (lower.endsWith('.json')) return 'json';
    throw new ApiException(
      'validation_error',
      'format must be json or yaml (or use .json/.yaml filename)',
      HttpStatus.BAD_REQUEST,
    );
  }

  async localize(input: {
    format: LocalizeFormat;
    content: unknown;
    source: string;
    target: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    if (input.content === null || typeof input.content !== 'object') {
      throw new ApiException(
        'validation_error',
        'content must be a JSON object or array',
        HttpStatus.BAD_REQUEST,
      );
    }

    const entries = flattenStrings(input.content);
    if (entries.length === 0) {
      throw new ApiException('validation_error', 'No string values found to translate', HttpStatus.BAD_REQUEST);
    }
    if (entries.length > MAX_STRINGS) {
      throw new ApiException(
        'validation_error',
        `Too many strings (${entries.length}). Maximum is ${MAX_STRINGS}.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const output = deepCloneJson(input.content);
    let translated = 0;
    let tmHits = 0;
    let glossaryApplied = 0;

    for (const entry of entries) {
      if (!entry.value.trim) {
        setAtPath(output, entry.path, entry.value);
        continue;
      }
      const icu = protectIcu(entry.value);
      const result = await this.translate.translate({
        text: icu.text,
        source: input.source,
        target: input.target,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
        skipReview: true,
      });
      const restored = restoreIcu(result.text, icu.slots);
      setAtPath(output, entry.path, restored);
      translated += 1;
      if (result.tmHit) tmHits += 1;
      glossaryApplied += result.glossaryApplied;
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'localize.completed',
      route: 'POST /v1/localize',
      ip: input.ip,
      metadata: {
        format: input.format,
        strings: entries.length,
        translated,
        tmHits,
        glossaryApplied,
        source: input.source,
        target: input.target,
      },
    });

    return {
      format: input.format,
      content: output,
      serialized: this.serializeContent(input.format, output),
      strings: entries.length,
      translated,
      tmHits,
      glossaryApplied,
    };
  }
}
