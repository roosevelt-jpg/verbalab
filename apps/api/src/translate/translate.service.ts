import { Injectable } from '@nestjs/common';
import { GatewayService } from '../gateway/gateway.service';
import { LanguagesService } from '../languages/languages.service';
import { UsageService } from '../usage/usage.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { GlossaryService } from '../glossary/glossary.service';
import { TmService } from '../tm/tm.service';
import { QualityService } from '../quality/quality.service';
import { DetectOutput } from '../gateway/detect-provider';
import { TranslateLatencyService } from '../observability/translate-latency.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LocalesService } from '../locales/locales.service';
import {
  protectGlossaryTerms,
  type GlossaryTermLike,
} from '../glossary/glossary-apply';

@Injectable()
export class TranslateService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly languages: LanguagesService,
    private readonly usage: UsageService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly glossary: GlossaryService,
    private readonly tm: TmService,
    private readonly quality: QualityService,
    private readonly translateLatency: TranslateLatencyService,
    private readonly notifications: NotificationsService,
    private readonly locales: LocalesService,
  ) {}

  async detect(input: {
    text: string;
    organizationId: string;
    userId?: string;
    ip?: string;
    apiKeyId?: string;
  }): Promise<DetectOutput> {
    const result = await this.gateway.detect({ text: input.text });
    await this.languages.assertSupported(result.language);

    let apiKeyPrefix: string | undefined;
    if (input.apiKeyId) {
      const key = await this.prisma.apiKey.findUnique({ where: { id: input.apiKeyId } });
      apiKeyPrefix = key?.prefix;
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'detect.completed',
      route: 'POST /v1/detect',
      ip: input.ip,
      apiKeyPrefix,
      metadata: {
        language: result.language,
        confidence: result.confidence,
        provider: result.provider,
        characters: [...input.text].length,
      },
    });

    return result;
  }

  async translate(input: {
    text: string;
    source: string;
    target: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
    /** Bulk localize: skip per-string review rows. */
    skipReview?: boolean;
  }) {
    const sourceWasAuto = input.source === 'auto';
    let detection: DetectOutput | null = null;
    let source = input.source;

    if (sourceWasAuto) {
      detection = await this.gateway.detect({ text: input.text });
      source = detection.language;
    }

    await this.languages.assertSupported(source);
    await this.languages.assertSupported(input.target);

    const characters = [...input.text].length;
    const dataSettings = await this.prisma.organization.findUniqueOrThrow({
      where: { id: input.organizationId },
      select: {
        allowVendorTraining: true,
        persistSourceText: true,
        retentionDays: true,
      },
    });
    const vendorPolicy = {
      allowVendorTraining: dataSettings.allowVendorTraining,
      persistSourceText: dataSettings.persistSourceText,
      retentionDays: dataSettings.retentionDays,
      vendorTrainingEnforcement: 'contractual_default' as const,
    };

    const tmHit = await this.tm.lookupExact({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      sourceLang: source,
      targetLang: input.target,
      sourceText: input.text,
    });

    if (tmHit) {
      await this.usage.recordTranslation({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        characters,
        provider: 'tm',
        sourceLang: source,
        targetLang: input.target,
        latencyMs: 0,
      });
      void this.notifications.maybeNotifyUsageThresholds(input.organizationId);

      const quality = input.skipReview
        ? null
        : await this.quality.recordFromTranslate({
            organizationId: input.organizationId,
            workspaceId: input.workspaceId,
            sourceLang: source,
            targetLang: input.target,
            sourceText: input.text,
            targetText: tmHit.targetText,
            provider: 'tm',
          });

      let apiKeyPrefix: string | undefined;
      if (input.apiKeyId) {
        const key = await this.prisma.apiKey.findUnique({ where: { id: input.apiKeyId } });
        apiKeyPrefix = key?.prefix;
      }

      await this.audit.record({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'translate.completed',
        route: 'POST /v1/translate',
        ip: input.ip,
        apiKeyPrefix,
        metadata: {
          source,
          target: input.target,
          characters,
          provider: 'tm',
          tmHit: true,
          tmEntryId: tmHit.id,
          reviewId: quality?.reviewId,
          qualityScore: quality?.qualityScore,
          sourceWasAuto,
          detectionProvider: detection?.provider,
          detectionConfidence: detection?.confidence,
          ...vendorPolicy,
        },
      });

      this.translateLatency.record(0);

      return {
        text: tmHit.targetText,
        source,
        target: input.target,
        provider: 'tm',
        characters,
        glossaryApplied: 0,
        tmHit: true,
        reviewId: quality?.reviewId ?? null,
        qualityScore: quality?.qualityScore ?? null,
        needsReview: quality?.needsReview ?? false,
        detection,
      };
    }

    await this.billing.assertWithinQuota(input.organizationId, characters);

    const glossary = await this.glossary.applyForPair({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      source,
      target: input.target,
      text: input.text,
    });

    const localeTerms = [
      ...(await this.locales.doNotTranslateTerms(source)),
      ...(await this.locales.doNotTranslateTerms(input.target)),
    ].filter(
      (term, index, all) =>
        all.findIndex((t) => t.sourceTerm.toLowerCase() === term.sourceTerm.toLowerCase()) === index,
    );
    const localeProtect =
      localeTerms.length > 0
        ? protectGlossaryTerms(glossary.text, localeTerms, glossary.replacements?.length ?? 0)
        : { text: glossary.text, replacements: [] as Array<{ placeholder: string; targetTerm: string; sourceTerm: string }> };

    const protectTerms: GlossaryTermLike[] = [...glossary.terms, ...localeTerms];
    const protectReplacements = [
      ...(glossary.replacements ?? []),
      ...localeProtect.replacements,
    ];
    const localeApplied = localeProtect.replacements.length;

    const result = await this.gateway.translate({
      text: localeProtect.text,
      source,
      target: input.target,
    });

    const text =
      protectReplacements.length > 0
        ? this.glossary.finalizeTranslation({
            translated: result.text,
            terms: protectTerms,
            replacements: protectReplacements,
          })
        : result.text;

    await this.usage.recordTranslation({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      characters: result.characters,
      provider: result.provider,
      sourceLang: result.source,
      targetLang: result.target,
      latencyMs: result.latencyMs,
    });
    void this.notifications.maybeNotifyUsageThresholds(input.organizationId);

    this.translateLatency.record(result.latencyMs);
    const quality = input.skipReview
      ? null
      : await this.quality.recordFromTranslate({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          sourceLang: result.source,
          targetLang: result.target,
          sourceText: input.text,
          targetText: text,
          provider: result.provider,
        });

    let apiKeyPrefix: string | undefined;
    if (input.apiKeyId) {
      const key = await this.prisma.apiKey.findUnique({ where: { id: input.apiKeyId } });
      apiKeyPrefix = key?.prefix;
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'translate.completed',
      route: 'POST /v1/translate',
      ip: input.ip,
      apiKeyPrefix,
      metadata: {
        source: result.source,
        target: result.target,
        characters: result.characters,
        provider: result.provider,
        glossaryApplied: glossary.applied,
        localeEntitiesProtected: localeApplied,
        tmHit: false,
        reviewId: quality?.reviewId,
        qualityScore: quality?.qualityScore,
        needsReview: quality?.needsReview,
        sourceWasAuto,
        detectionProvider: detection?.provider,
        detectionConfidence: detection?.confidence,
        ...vendorPolicy,
      },
    });

    return {
      text,
      source: result.source,
      target: result.target,
      provider: result.provider,
      characters: result.characters,
      glossaryApplied: glossary.applied,
      localeEntitiesProtected: localeApplied,
      tmHit: false,
      reviewId: quality?.reviewId ?? null,
      qualityScore: quality?.qualityScore ?? null,
      needsReview: quality?.needsReview ?? false,
      detection,
    };
  }
}
