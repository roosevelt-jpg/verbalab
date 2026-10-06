import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { WakeWordService } from '../wake-word/wake-word.service';
import {
  DetectWakeWordInput,
  GqlWakeCapability,
  GqlWakeDetectResult,
  GqlWakeWordEngine,
} from './gql.types';

type GqlReq = Request & {
  translateAuth?: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Resolver
export class WakeWordGraphqlResolver {
  constructor(private readonly wake: WakeWordService) {}

  @Query( => GqlWakeWordEngine, { name: 'wakeWordEngine' })
  wakeWordEngine: GqlWakeWordEngine {
    const catalog = this.wake.engine;
    return {
      product: catalog.product,
      note: catalog.note,
      defaultWakePhrases: catalog.defaultWakePhrases,
      capabilities: catalog.capabilities as GqlWakeCapability[],
    };
  }

  @Mutation( => GqlWakeDetectResult, { name: 'detectWakeWord' })
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async detectWakeWord(
    @Args('input', { type:  => DetectWakeWordInput }) input: DetectWakeWordInput,
    @Context('req') req: GqlReq,
  ): Promise<GqlWakeDetectResult> {
    const auth = req.translateAuth!;
    const result = await this.wake.detect({
      text: input.text,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
    return {
      wakeDetected: result.wakeDetected,
      transcript: result.transcript,
      note: result.note,
    };
  }
}
