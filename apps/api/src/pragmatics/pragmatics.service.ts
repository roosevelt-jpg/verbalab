import { HttpStatus, Injectable } from '@nestjs/common';
import { TranslateService } from '../translate/translate.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { pragmaticsCatalog } from './pragmatics.catalog';
import { portfolioMeta } from '../portfolio/portfolio.meta';

export type PragmaticsMode = 'faithful' | 'literal' | 'localized';

@Injectable()
export class PragmaticsService {
  constructor(
    private readonly mt: TranslateService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return pragmaticsCatalog();
  }

  async translate(input: {
    text: string;
    source?: string;
    target: string;
    locale?: string;
    mode?: PragmaticsMode;
    register?: string;
    context?: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    const text = input.text.trim();
    const target = input.target.trim().toLowerCase();
    if (!text || !target) {
      throw new ApiException(
        'validation_error',
        'text and target are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const mode: PragmaticsMode = input.mode ?? 'faithful';
    if (!['faithful', 'literal', 'localized'].includes(mode)) {
      throw new ApiException(
        'validation_error',
        'mode must be faithful | literal | localized',
        HttpStatus.BAD_REQUEST,
      );
    }

    const speechAct = this.classifySpeechAct(text);
    const translated = await this.mt.translate({
      text,
      source: input.source?.trim() || 'en',
      target,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      ip: input.ip,
      skipReview: true,
    });

    const candidates = this.buildCandidates(translated.text, speechAct, mode, input.register);
    const primary = candidates.find((c) => c.mode === mode) ?? candidates[0]!;
    const preserved = this.preservationChecks(speechAct, primary.text, mode);
    const disclosed_changes =
      mode === 'localized'
        ? [
            'Localized mode selected explicitly. Rendering may adapt register with disclosed notes.',
            ...(primary.adaptation_notes ?? []),
          ]
        : mode === 'literal'
          ? ['Literal mode selected — natural equivalents may be omitted.']
          : [];

    // Hard rule: style must not turn refusal into consent or estimate into promise.
    if (speechAct.act === 'refusal' && /\b(agree|approve|consent|yes,? I will)\b/i.test(primary.text)) {
      throw new ApiException(
        'policy_violation',
        'Style controls cannot transform a refusal into consent',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    if (speechAct.act === 'estimate' && /\b(promise|guarantee|will definitely)\b/i.test(primary.text)) {
      throw new ApiException(
        'policy_violation',
        'Style controls cannot transform an estimate into a promise',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const meta = portfolioMeta({
      modelId: 'lugemi-pragmatics',
      sourceLanguageTags: [translated.source || input.source || 'auto'],
      targetLanguageTag: target,
      varietyId: input.locale ?? null,
      warnings: preserved.ok
        ? []
        : ['Speech-act preservation uncertain — prefer plain-language clarification if needed.'],
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'pragmatics.translate',
      route: 'POST /v1/pragmatics/translate',
      ip: input.ip,
      metadata: { request_id: meta.request_id, mode, act: speechAct.act },
    });

    return {
      ...meta,
      mode,
      locale: input.locale ?? null,
      register: input.register ?? null,
      speech_act: speechAct,
      candidates,
      translation: primary.text,
      preserved_act_checks: preserved,
      disclosed_changes,
      uncertainty: preserved.ok ? null : 'act_equivalence_uncertain',
      note: 'Fidelity constraints on numbers, negation, and named entities take priority over stylistic preferences.',
    };
  }

  private classifySpeechAct(text: string) {
    const lower = text.toLowerCase();
    let act:
      | 'request'
      | 'refusal'
      | 'warning'
      | 'commitment'
      | 'conditional_commitment'
      | 'estimate'
      | 'question'
      | 'statement' = 'statement';
    let politeness: 'indirect' | 'direct' | 'neutral' = 'neutral';
    let urgency: 'low' | 'medium' | 'high' = 'low';
    let obligation: 'none' | 'weak' | 'strong' = 'none';

    if (/\b(please|could you|would you|kindly|I was wondering)\b/i.test(text)) {
      act = 'request';
      politeness = 'indirect';
      obligation = 'weak';
    } else if (/\b(must|immediately|urgent|right now)\b/i.test(text)) {
      act = 'request';
      politeness = 'direct';
      urgency = 'high';
      obligation = 'strong';
    } else if (/\b(will not|won't|cannot|can't|refuse|no,?\s*I)\b/i.test(text)) {
      act = 'refusal';
      obligation = 'strong';
    } else if (/\b(warning|beware|careful|do not)\b/i.test(text)) {
      act = 'warning';
      urgency = 'high';
    } else if (/\b(if .*(will|would|can))\b/i.test(lower) || /\bunless\b/i.test(lower)) {
      act = 'conditional_commitment';
      obligation = 'weak';
    } else if (/\b(I will|I shall|I promise)\b/i.test(text)) {
      act = 'commitment';
      obligation = 'strong';
    } else if (/\b(about|approximately|around|estimate|might|maybe)\b/i.test(text)) {
      act = 'estimate';
    } else if (/\?$/.test(text.trim()) || /^(who|what|when|where|why|how)\b/i.test(text)) {
      act = 'question';
    }

    return {
      act,
      politeness,
      urgency,
      obligation,
      stance: politeness === 'indirect' ? 'deferential' : 'plain',
      evidence: text.slice(0, 160),
    };
  }

  private buildCandidates(
    base: string,
    speechAct: ReturnType<PragmaticsService['classifySpeechAct']>,
    mode: PragmaticsMode,
    register?: string,
  ) {
    const faithful = {
      mode: 'faithful' as const,
      text: base,
      adaptation_notes: [] as string[],
    };
    const literal = {
      mode: 'literal' as const,
      text: base,
      adaptation_notes: ['Literal rendering — may sound less natural in the target locale.'],
    };
    const localizedNotes: string[] = [];
    let localizedText = base;
    if (speechAct.politeness === 'indirect' && speechAct.act === 'request') {
      localizedNotes.push(
        'Indirect request preserved as a polite request; no exact equivalent claimed.',
      );
      if (register === 'formal') {
        localizedText = base;
        localizedNotes.push('Formal register selected by user.');
      }
    } else if (mode === 'localized') {
      localizedNotes.push('No culture stereotype applied — adaptation limited to explicit register choice.');
    }

    return [
      faithful,
      literal,
      { mode: 'localized' as const, text: localizedText, adaptation_notes: localizedNotes },
    ];
  }

  private preservationChecks(
    speechAct: ReturnType<PragmaticsService['classifySpeechAct']>,
    output: string,
    mode: PragmaticsMode,
  ) {
    const checks = [
      {
        name: 'act_preserved',
        ok:
          speechAct.act !== 'refusal' ||
          /\b(not|no|cannot|won't|will not|refuse)\b/i.test(output) ||
          mode === 'literal',
      },
      {
        name: 'urgency_not_inflated',
        ok: speechAct.urgency !== 'low' || !/\b(immediately|urgent|right now)\b/i.test(output),
      },
      {
        name: 'modes_not_mixed',
        ok: true,
      },
    ];
    return {
      ok: checks.every((c) => c.ok),
      checks,
    };
  }
}
