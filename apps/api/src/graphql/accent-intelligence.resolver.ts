import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { AccentsService } from '../accents/accents.service';
import {
  DetectAccentInput,
  GqlAccentCapability,
  GqlAccentDetectResult,
  GqlAccentEngine,
} from './gql.types';

type GqlReq = Request & {
  translateAuth?: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Resolver
export class AccentIntelligenceGraphqlResolver {
  constructor(private readonly accents: AccentsService) {}

  @Query( => GqlAccentEngine, { name: 'accentEngine' })
  accentEngine: GqlAccentEngine {
    const catalog = this.accents.engine;
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlAccentCapability[],
    };
  }

  @Mutation( => GqlAccentDetectResult, { name: 'detectAccent' })
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async detectAccent(
    @Args('input', { type:  => DetectAccentInput }) input: DetectAccentInput,
    @Context('req') req: GqlReq,
  ): Promise<GqlAccentDetectResult> {
    const auth = req.translateAuth!;
    const result = await this.accents.detect({
      text: input.text,
      language: input.language,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
    return {
      language: result.language,
      accent: result.accent,
      accentName: result.accentName,
      confidence: result.confidence,
      provider: result.provider,
      note: result.note,
    };
  }
}
