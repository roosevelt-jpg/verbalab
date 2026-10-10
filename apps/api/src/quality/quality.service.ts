import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import { TmService } from '../tm/tm.service';
import { estimateTranslationQuality } from './quality-estimate';

@Injectable()
export class QualityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly tm: TmService,
  ) {}

  async recordFromTranslate(input: {
    organizationId: string;
    workspaceId: string;
    sourceLang: string;
    targetLang: string;
    sourceText: string;
    targetText: string;
    provider: string;
  }) {
    const org = await this.prisma.organization.findUnique({
      where: { id: input.organizationId },
      select: { persistSourceText: true },
    });
    const persist = org?.persistSourceText ?? true;

    const estimate = estimateTranslationQuality({
      sourceText: input.sourceText,
      targetText: input.targetText,
      sourceLang: input.sourceLang,
      targetLang: input.targetLang,
      provider: input.provider,
    });

    const review = await this.prisma.translationReview.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        sourceLang: input.sourceLang,
        targetLang: input.targetLang,
        sourceText: persist ? input.sourceText : '[redacted]',
        targetText: persist ? input.targetText : '[redacted]',
        provider: input.provider,
        qualityScore: estimate.score,
        needsReview: estimate.needsReview,
        status: 'pending',
      },
    });

    return {
      reviewId: review.id,
      qualityScore: estimate.score,
      needsReview: estimate.needsReview,
      reasons: estimate.reasons,
    };
  }

  list(
    organizationId: string,
    opts?: { status?: string; needsReview?: boolean; limit?: number },
  ) {
    const take = Math.min(Math.max(opts?.limit ?? 50, 1), 200);
    return this.prisma.translationReview.findMany({
      where: {
        organizationId,
        ...(opts?.status ? { status: opts.status } : {}),
        ...(opts?.needsReview !== undefined ? { needsReview: opts.needsReview } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async accept(input: {
    organizationId: string;
    reviewId: string;
    userId: string;
    note?: string;
    addToTm?: boolean;
    ip?: string;
  }) {
    const review = await this.getOwned(input.organizationId, input.reviewId);
    if (review.status !== 'pending') {
      throw new ApiException('conflict', 'Review already decided', HttpStatus.CONFLICT);
    }

    const updated = await this.prisma.translationReview.update({
      where: { id: review.id },
      data: {
        status: 'accepted',
        reviewNote: input.note,
        reviewedById: input.userId,
        reviewedAt: new Date(),
        needsReview: false,
      },
    });

    let tmEntryId: string | undefined;
    if (input.addToTm !== false) {
      const org = await this.prisma.organization.findUnique({
        where: { id: input.organizationId },
        select: { persistSourceText: true },
      });
      if (org?.persistSourceText !== false && review.sourceText !== '[redacted]') {
        const entry = await this.tm.upsertApproved({
          organizationId: input.organizationId,
          workspaceId: review.workspaceId,
          userId: input.userId,
          sourceLang: review.sourceLang,
          targetLang: review.targetLang,
          sourceText: review.sourceText,
          targetText: review.targetText,
          ip: input.ip,
        });
        tmEntryId = entry.id;
      }
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'quality.accepted',
      route: 'POST /v1/reviews/:id/accept',
      ip: input.ip,
      metadata: { reviewId: review.id, tmEntryId },
    });

    return { ...updated, tmEntryId: tmEntryId ?? null };
  }

  async reject(input: {
    organizationId: string;
    reviewId: string;
    userId: string;
    note?: string;
    ip?: string;
  }) {
    const review = await this.getOwned(input.organizationId, input.reviewId);
    if (review.status !== 'pending') {
      throw new ApiException('conflict', 'Review already decided', HttpStatus.CONFLICT);
    }

    const updated = await this.prisma.translationReview.update({
      where: { id: review.id },
      data: {
        status: 'rejected',
        reviewNote: input.note,
        reviewedById: input.userId,
        reviewedAt: new Date(),
        needsReview: false,
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'quality.rejected',
      route: 'POST /v1/reviews/:id/reject',
      ip: input.ip,
      metadata: { reviewId: review.id },
    });

    return updated;
  }

  private async getOwned(organizationId: string, reviewId: string) {
    const review = await this.prisma.translationReview.findFirst({
      where: { id: reviewId, organizationId },
    });
    if (!review) {
      throw new ApiException('not_found', 'Review not found', HttpStatus.NOT_FOUND);
    }
    return review;
  }
}
