import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { flattenStrings } from './i18n-tree';
import {
  extractIcuPlaceholders,
  formatIcuMessage,
  validateIcuMessage,
} from './icu';
import { localizationPlatformCatalog } from './localization-platform.catalog';
import type { LocalizeFormat } from './localize.service';

export type L10nQaIssue = {
  code: string;
  severity: 'error' | 'warning';
  key?: string;
  message: string;
};

@Injectable()
export class LocalizationPlatformService {
  platform() {
    return localizationPlatformCatalog();
  }

  catalog(content: unknown) {
    if (content === null || typeof content !== 'object') {
      throw new ApiException(
        'validation_error',
        'content must be a JSON object or array',
        HttpStatus.BAD_REQUEST,
      );
    }
    const entries = flattenStrings(content);
    let icuCount = 0;
    let pluralCount = 0;
    let selectCount = 0;
    const keys = entries.map((e) => {
      const v = validateIcuMessage(e.value);
      if (v.placeholders.length || v.hasPlural || v.hasSelect) icuCount += 1;
      if (v.hasPlural) pluralCount += 1;
      if (v.hasSelect) selectCount += 1;
      return {
        key: e.path,
        chars: [...e.value].length,
        placeholders: v.placeholders,
        hasPlural: v.hasPlural,
        hasSelect: v.hasSelect,
        icuValid: v.valid,
      };
    });
    return {
      stringCount: entries.length,
      icuCount,
      pluralCount,
      selectCount,
      keys,
      note: 'Software-string inventory — not a TMS project.',
    };
  }

  validateIcu(message: string) {
    if (typeof message !== 'string') {
      throw new ApiException('validation_error', 'message is required', HttpStatus.BAD_REQUEST);
    }
    return validateIcuMessage(message);
  }

  formatIcu(input: {
    message: string;
    values?: Record<string, string | number>;
    locale?: string;
  }) {
    if (typeof input.message !== 'string') {
      throw new ApiException('validation_error', 'message is required', HttpStatus.BAD_REQUEST);
    }
    const check = validateIcuMessage(input.message);
    if (!check.valid) {
      throw new ApiException(
        'invalid_icu',
        check.issues.map((i) => i.message).join('; ') || 'Invalid ICU message',
        HttpStatus.BAD_REQUEST,
      );
    }
    return {
      formatted: formatIcuMessage(input.message, input.values ?? {}, input.locale ?? 'en'),
      placeholders: check.placeholders,
      locale: input.locale ?? 'en',
    };
  }

  qa(input: {
    format: LocalizeFormat;
    sourceContent: unknown;
    targetContent: unknown;
    sourceLang?: string;
    targetLang?: string;
  }) {
    if (
      input.sourceContent === null ||
      typeof input.sourceContent !== 'object' ||
      input.targetContent === null ||
      typeof input.targetContent !== 'object'
    ) {
      throw new ApiException(
        'validation_error',
        'sourceContent and targetContent must be objects/arrays',
        HttpStatus.BAD_REQUEST,
      );
    }

    const source = flattenStrings(input.sourceContent);
    const target = flattenStrings(input.targetContent);
    const sourceMap = new Map(source.map((e) => [e.path, e.value]));
    const targetMap = new Map(target.map((e) => [e.path, e.value]));
    const issues: L10nQaIssue[] = [];

    for (const [key, src] of sourceMap) {
      if (!targetMap.has(key)) {
        issues.push({
          code: 'missing_key',
          severity: 'error',
          key,
          message: `Missing target key "${key}"`,
        });
        continue;
      }
      const tgt = targetMap.get(key)!;
      if (!tgt.trim()) {
        issues.push({
          code: 'empty_target',
          severity: 'error',
          key,
          message: `Empty target for "${key}"`,
        });
      } else if (tgt === src && src.trim()) {
        issues.push({
          code: 'identical_to_source',
          severity: 'warning',
          key,
          message: `Target identical to source for "${key}"`,
        });
      }

      const srcIcu = validateIcuMessage(src);
      const tgtIcu = validateIcuMessage(tgt);
      if (!srcIcu.valid) {
        issues.push({
          code: 'source_icu_invalid',
          severity: 'error',
          key,
          message: srcIcu.issues.map((i) => i.message).join('; '),
        });
      }
      if (!tgtIcu.valid) {
        issues.push({
          code: 'target_icu_invalid',
          severity: 'error',
          key,
          message: tgtIcu.issues.map((i) => i.message).join('; '),
        });
      }

      const srcPh = new Set(extractIcuPlaceholders(src));
      const tgtPh = new Set(extractIcuPlaceholders(tgt));
      for (const p of srcPh) {
        if (!tgtPh.has(p)) {
          issues.push({
            code: 'placeholder_missing',
            severity: 'error',
            key,
            message: `Target missing placeholder {${p}}`,
          });
        }
      }
      for (const p of tgtPh) {
        if (!srcPh.has(p)) {
          issues.push({
            code: 'placeholder_extra',
            severity: 'warning',
            key,
            message: `Target has extra placeholder {${p}}`,
          });
        }
      }

      if (src.trim() && tgt.trim()) {
        const ratio = [...tgt].length / Math.max(1, [...src].length);
        if (ratio > 3 || ratio < 0.25) {
          issues.push({
            code: 'length_outlier',
            severity: 'warning',
            key,
            message: `Length ratio ${ratio.toFixed(2)} looks unusual`,
          });
        }
      }
    }

    for (const key of targetMap.keys()) {
      if (!sourceMap.has(key)) {
        issues.push({
          code: 'extra_key',
          severity: 'warning',
          key,
          message: `Extra target key "${key}" not in source`,
        });
      }
    }

    const errors = issues.filter((i) => i.severity === 'error').length;
    const warnings = issues.filter((i) => i.severity === 'warning').length;

    return {
      format: input.format,
      sourceLang: input.sourceLang ?? null,
      targetLang: input.targetLang ?? null,
      sourceKeys: sourceMap.size,
      targetKeys: targetMap.size,
      issueCount: issues.length,
      errorCount: errors,
      warningCount: warnings,
      passed: errors === 0,
      issues,
      note: 'Localization QA for software strings — not screenshot/visual QA.',
    };
  }
}
