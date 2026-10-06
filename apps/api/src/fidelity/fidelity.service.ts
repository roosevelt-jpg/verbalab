import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { fidelityCatalog } from './fidelity.catalog';
import { portfolioMeta } from '../portfolio/portfolio.meta';

type Decision = 'accept' | 'retry' | 'clarify' | 'review';

type Ledger = {
  ledger_id: string;
  source_spans: Array<{ text: string; role: string }>;
  polarity: 'affirmative' | 'negated' | 'unknown';
  quantities: Array<{ raw: string; normalized: number | null }>;
  entities: string[];
  requested_action: string | null;
  modality: string | null;
  temporal: string | null;
  uncertainty: string[];
};

type PendingClarify = {
  clarify_id: string;
  organizationId: string;
  ledger_id: string;
  unresolved_span: string;
  prompt: string;
  createdAt: number;
};

@Injectable()
export class FidelityService {
  private readonly pending = new Map<string, PendingClarify>();

  constructor(private readonly audit: AuditService) {}

  engine() {
    return fidelityCatalog();
  }

  async verify(input: {
    source: string;
    target: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    audioSpanRef?: string;
    domainPolicy?: string;
    glossaryVersion?: string;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    ip?: string;
  }) {
    const source = input.source?.trim() ?? '';
    const target = input.target?.trim() ?? '';
    if (!source || !target) {
      throw new ApiException(
        'validation_error',
        'source and target text are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const ledger = this.buildLedger(source);
    const targetLedger = this.buildLedger(target);
    const errorSpans: Array<{
      category: string;
      severity: 'critical' | 'major' | 'minor';
      source: string;
      target: string;
      reason_code: string;
    }> = [];

    // Deterministic checks: negation
    if (ledger.polarity === 'negated' && targetLedger.polarity !== 'negated') {
      errorSpans.push({
        category: 'negation',
        severity: 'critical',
        source: source,
        target: target,
        reason_code: 'NEGATION_DROPPED',
      });
    }
    if (ledger.polarity !== 'negated' && targetLedger.polarity === 'negated') {
      errorSpans.push({
        category: 'negation',
        severity: 'critical',
        source: source,
        target: target,
        reason_code: 'NEGATION_INSERTED',
      });
    }

    // Quantity mismatch (e.g. 500 vs 5,000)
    for (const q of ledger.quantities) {
      if (q.normalized == null) continue;
      const matched = targetLedger.quantities.some(
        (t) => t.normalized != null && Math.abs(t.normalized - q.normalized!) < 1e-6,
      );
      if (!matched) {
        const nearMiss = targetLedger.quantities.find(
          (t) =>
            t.normalized != null &&
            (Math.abs(t.normalized / q.normalized!) === 10 ||
              Math.abs(t.normalized / q.normalized!) === 100 ||
              Math.abs(q.normalized! / t.normalized) === 10),
        );
        errorSpans.push({
          category: 'quantity',
          severity: 'critical',
          source: q.raw,
          target: nearMiss?.raw ?? target,
          reason_code: nearMiss ? 'QUANTITY_SCALE_CHANGED' : 'QUANTITY_MISSING_OR_CHANGED',
        });
      }
    }

    for (const ent of ledger.entities) {
      if (!target.toLowerCase().includes(ent.toLowerCase())) {
        errorSpans.push({
          category: 'entity',
          severity: 'critical',
          source: ent,
          target: target,
          reason_code: 'ENTITY_NOT_PRESERVED',
        });
      }
    }

    const catalog = fidelityCatalog();
    const critical = errorSpans.filter((e) => e.severity === 'critical');
    // Honest local calibrator: probability only when in-scope heuristic features fire; else null.
    const error_probability =
      critical.length > 0 ? Math.min(0.95, 0.55 + critical.length * 0.15) : null;

    let decision: Decision = 'accept';
    let proposed_clarification: string | null = null;
    let clarify_id: string | null = null;

    if (critical.some((c) => c.category === 'negation' || c.category === 'quantity')) {
      decision = 'clarify';
      const focus = critical[0]!;
      proposed_clarification =
        focus.category === 'negation'
          ? 'Did you mean to refuse or to approve this action?'
          : `Please confirm the amount: was it ${focus.source}?`;
      clarify_id = `clr_${randomUUID().slice(0, 10)}`;
      this.pending.set(clarify_id, {
        clarify_id,
        organizationId: input.organizationId,
        ledger_id: ledger.ledger_id,
        unresolved_span: focus.source,
        prompt: proposed_clarification,
        createdAt: Date.now(),
      });
    } else if (critical.length > 0) {
      decision = 'review';
    } else if (errorSpans.length > 0) {
      decision = 'retry';
    }

    const meta = portfolioMeta({
      modelId: 'lugemi-fidelity',
      sourceLanguageTags: [input.sourceLanguage?.trim() || 'auto'],
      targetLanguageTag: input.targetLanguage?.trim() || 'auto',
      warnings:
        decision === 'accept'
          ? []
          : ['Verifier flagged meaning risk — do not treat fluent output as confirmed.'],
      evidenceRef: ledger.ledger_id,
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'fidelity.verify',
      route: 'POST /v1/fidelity/verify',
      ip: input.ip,
      metadata: {
        request_id: meta.request_id,
        decision,
        errorCount: errorSpans.length,
        glossaryVersion: input.glossaryVersion ?? null,
        domainPolicy: input.domainPolicy ?? null,
      },
    });

    return {
      ...meta,
      decision,
      error_probability,
      error_event_definition: catalog.error_event_definition,
      calibration_version: catalog.calibration_version,
      error_spans: errorSpans,
      ledger,
      ledger_references: [ledger.ledger_id],
      proposed_clarification,
      clarify_id,
      audio_span_ref: input.audioSpanRef ?? null,
      note: 'Independent local verifier head. Generator self-assessment is not used as proof of fidelity.',
    };
  }

  async clarify(input: {
    clarifyId: string;
    answer?: string | null;
    silence?: boolean;
    refused?: boolean;
    organizationId: string;
    userId?: string;
    ip?: string;
  }) {
    const pending = this.pending.get(input.clarifyId);
    if (!pending || pending.organizationId !== input.organizationId) {
      throw new ApiException('not_found', 'Clarification request not found', HttpStatus.NOT_FOUND);
    }

    const refused = Boolean(input.refused);
    const silence = Boolean(input.silence) || (!input.answer?.trim() && !refused);
    const answer = input.answer?.trim() ?? '';

    // Must not turn refusal or silence into confirmation.
    let resolution: 'confirmed' | 'rejected' | 'unresolved' | 'needs_review';
    let confirmed_value: string | null = null;

    if (silence) {
      resolution = 'unresolved';
    } else if (refused || /^(no|nope|cancel|refuse|stop)\b/i.test(answer)) {
      resolution = 'rejected';
    } else if (/^(yes|confirm|correct|that's right|thats right)\b/i.test(answer)) {
      resolution = 'confirmed';
      confirmed_value = pending.unresolved_span;
    } else if (answer.length > 0) {
      resolution = 'needs_review';
      confirmed_value = answer;
    } else {
      resolution = 'unresolved';
    }

    this.pending.delete(input.clarifyId);

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'fidelity.clarify',
      route: 'POST /v1/fidelity/clarify',
      ip: input.ip,
      metadata: { clarifyId: input.clarifyId, resolution },
    });

    return {
      clarify_id: input.clarifyId,
      ledger_id: pending.ledger_id,
      unresolved_span: pending.unresolved_span,
      prompt: pending.prompt,
      resolution,
      confirmed_value,
      note:
        resolution === 'unresolved'
          ? 'Silence or empty answer does not confirm the unresolved span.'
          : resolution === 'rejected'
            ? 'Caller refused confirmation — span remains unconfirmed.'
            : undefined,
    };
  }

  private buildLedger(text: string): Ledger {
    const lower = text.toLowerCase();
    const polarity: Ledger['polarity'] = /\b(did not|didn't|do not|don't|not |never|no )\b/i.test(
      text,
    )
      ? 'negated'
      : /\b(approve|approved|confirm|yes)\b/i.test(text)
        ? 'affirmative'
        : 'unknown';

    const quantityRaw = text.match(/\b(\d[\d,]*(?:\.\d+)?)\b/g) ?? [];
    const wordAmounts: Array<{ raw: string; normalized: number | null }> = [];
    if (/\bfive hundred\b/i.test(text)) wordAmounts.push({ raw: 'five hundred', normalized: 500 });
    if (/\bfifty\b/i.test(text)) wordAmounts.push({ raw: 'fifty', normalized: 50 });
    if (/\bfive thousand\b/i.test(text)) wordAmounts.push({ raw: 'five thousand', normalized: 5000 });

    const quantities = [
      ...quantityRaw.map((raw) => ({
        raw,
        normalized: Number(raw.replace(/,/g, '')),
      })),
      ...wordAmounts,
    ];

    const entities = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g) ?? [];
    const requested_action = /\b(transfer|approve|send|pay|cancel)\b/i.test(text)
      ? (text.match(/\b(transfer|approve|send|pay|cancel)\b/i)?.[1]?.toLowerCase() ?? null)
      : null;

    return {
      ledger_id: `ledger_${randomUUID().slice(0, 10)}`,
      source_spans: [{ text, role: 'utterance' }],
      polarity,
      quantities,
      entities,
      requested_action,
      modality: /\b(might|may|could|should|must)\b/i.test(lower) ? 'modal' : null,
      temporal: /\b(today|tomorrow|yesterday|before|after)\b/i.test(lower)
        ? (text.match(/\b(today|tomorrow|yesterday|before|after)\b/i)?.[1]?.toLowerCase() ?? null)
        : null,
      uncertainty: polarity === 'unknown' ? ['polarity_unresolved'] : [],
    };
  }
}
