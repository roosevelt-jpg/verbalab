import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { StyleService } from '../style/style.service';
import {
  DetectToneInput,
  GqlStyleIntelligence,
  GqlStyleRewriteResult,
  GqlStyleTransferResult,
  GqlToneDetectResult,
  TransferStyleInput,
  TransformToneInput,
} from './gql.types';

type GqlReq = Request & {
  translateAuth?: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Resolver
export class StyleIntelligenceGraphqlResolver {
  constructor(private readonly style: StyleService) {}

  @Query( => GqlStyleIntelligence, { name: 'styleIntelligence' })
  styleIntelligence: GqlStyleIntelligence {
    const c = this.style.intelligence;
    return {
      product: c.product,
      note: c.note,
      capabilityCount: c.capabilities.length,
      shippedCount: c.capabilities.filter((x) => x.status === 'shipped').length,
    };
  }

  @Mutation( => GqlToneDetectResult, { name: 'detectTone' })
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async detectTone(
    @Args('input', { type:  => DetectToneInput }) input: DetectToneInput,
    @Context('req') req: GqlReq,
  ): Promise<GqlToneDetectResult> {
    const auth = req.translateAuth!;
    const result = await this.style.detect({
      text: input.text,
      organizationId: auth.organizationId,
      apiKeyId: auth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
    return {
      detectedTone: result.detectedTone,
      confidence: result.confidence,
      suggestedProfile: result.suggestedProfile,
      note: result.note,
    };
  }

  @Mutation( => GqlStyleRewriteResult, { name: 'transformTone' })
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async transformTone(
    @Args('input', { type:  => TransformToneInput }) input: TransformToneInput,
    @Context('req') req: GqlReq,
  ): Promise<GqlStyleRewriteResult> {
    const auth = req.translateAuth!;
    const result = await this.style.transform({
      text: input.text,
      targetTone: input.targetTone,
      language: input.language,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
    return {
      profile: result.profile,
      rewritten: result.rewritten,
      changed: result.changed,
      changeCount: result.changeCount,
      provider: result.provider,
      note: result.note,
    };
  }

  @Mutation( => GqlStyleTransferResult, { name: 'transferStyle' })
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async transferStyle(
    @Args('input', { type:  => TransferStyleInput }) input: TransferStyleInput,
    @Context('req') req: GqlReq,
  ): Promise<GqlStyleTransferResult> {
    const auth = req.translateAuth!;
    const result = await this.style.transfer({
      text: input.text,
      targetProfile: input.targetProfile,
      language: input.language,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
    return {
      sourceTone: result.sourceTone,
      sourceConfidence: result.sourceConfidence,
      targetProfile: result.targetProfile,
      rewritten: result.rewritten,
      changed: result.changed,
      changeCount: result.changeCount,
      note: result.note,
    };
  }
}
