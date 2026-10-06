import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { EmotionIntelligenceService } from '../emotion-intelligence/emotion-intelligence.service';
import {
  DetectEmotionInput,
  GqlEmotionCapability,
  GqlEmotionDetectResult,
  GqlEmotionEngine,
} from './gql.types';

type GqlReq = Request & {
  translateAuth?: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Resolver()
export class EmotionIntelligenceGraphqlResolver {
  constructor(private readonly emotion: EmotionIntelligenceService) {}

  @Query(() => GqlEmotionEngine, { name: 'emotionEngine' })
  emotionEngine(): GqlEmotionEngine {
    const catalog = this.emotion.engine();
    return {
      product: catalog.product,
      note: catalog.note,
      labels: catalog.labels,
      capabilities: catalog.capabilities as GqlEmotionCapability[],
    };
  }

  @Mutation(() => GqlEmotionDetectResult, { name: 'detectEmotion' })
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async detectEmotion(
    @Args('input', { type: () => DetectEmotionInput }) input: DetectEmotionInput,
    @Context('req') req: GqlReq,
  ): Promise<GqlEmotionDetectResult> {
    const auth = req.translateAuth!;
    const result = await this.emotion.detect({
      text: input.text,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
    return {
      label: result.label,
      confidence: result.confidence,
      audioAdjusted: result.audioAdjusted,
      note: result.note,
      sentiment: result.sentiment,
      tone: {
        label: result.tone.label,
        confidence: result.tone.confidence,
        note: result.tone.note,
      },
      honesty: result.honesty,
    };
  }
}
