import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { CallIntelligenceService } from '../call-intelligence/call-intelligence.service';
import {
  GqlCallCapability,
  GqlCallIntelligenceEngine,
  GqlCallRecord,
  IngestCallInput,
} from './gql.types';

type GqlReq = Request & {
  translateAuth?: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Resolver
export class CallIntelligenceGraphqlResolver {
  constructor(private readonly calls: CallIntelligenceService) {}

  @Query( => GqlCallIntelligenceEngine, { name: 'callIntelligenceEngine' })
  callIntelligenceEngine: GqlCallIntelligenceEngine {
    const catalog = this.calls.engine;
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlCallCapability[],
    };
  }

  @Mutation( => GqlCallRecord, { name: 'ingestCall' })
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async ingestCall(
    @Args('input', { type:  => IngestCallInput }) input: IngestCallInput,
    @Context('req') req: GqlReq,
  ): Promise<GqlCallRecord> {
    const auth = req.translateAuth!;
    const created = await this.calls.createCall({
      transcript: input.transcript,
      language: input.language,
      direction: input.direction,
      externalRef: input.externalRef,
      analyze: true,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
    return {
      id: created.id,
      status: created.status,
      summary: created.summary,
      transcript: created.transcript,
    };
  }
}
