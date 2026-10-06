import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { PronunciationIntelligenceService } from '../pronunciation-intelligence/pronunciation-intelligence.service';
import {
  AssessPronunciationInput,
  GqlPronunciationAssessResult,
  GqlPronunciationCapability,
  GqlPronunciationEngine,
} from './gql.types';

type GqlReq = Request & {
  translateAuth?: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Resolver
export class PronunciationIntelligenceGraphqlResolver {
  constructor(private readonly pronunciation: PronunciationIntelligenceService) {}

  @Query( => GqlPronunciationEngine, { name: 'pronunciationEngine' })
  pronunciationEngine: GqlPronunciationEngine {
    const catalog = this.pronunciation.engine;
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlPronunciationCapability[],
    };
  }

  @Mutation( => GqlPronunciationAssessResult, { name: 'assessPronunciation' })
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async assessPronunciation(
    @Args('input', { type:  => AssessPronunciationInput }) input: AssessPronunciationInput,
    @Context('req') req: GqlReq,
  ): Promise<GqlPronunciationAssessResult> {
    const auth = req.translateAuth!;
    const result = await this.pronunciation.assess({
      reference: input.reference,
      hypothesis: input.hypothesis,
      language: input.language,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
    return {
      language: result.language,
      hypothesis: result.hypothesis,
      scores: {
        overall: result.scores.overall,
        accuracy: result.scores.accuracy,
        fluency: result.scores.fluency,
        stress: result.scores.stress,
      },
      note: result.note,
    };
  }
}
