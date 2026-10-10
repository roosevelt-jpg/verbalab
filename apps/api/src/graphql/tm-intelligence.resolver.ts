import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { TmService } from '../tm/tm.service';
import { GqlTmIntelligence, GqlTmSearchResult, SearchTmInput } from './gql.types';

type GqlReq = Request & {
  translateAuth?: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Resolver()
export class TmIntelligenceGraphqlResolver {
  constructor(private readonly tm: TmService) {}

  @Query(() => GqlTmIntelligence, { name: 'tmIntelligence' })
  tmIntelligence(): GqlTmIntelligence {
    const c = this.tm.intelligence();
    return {
      product: c.product,
      note: c.note,
      capabilityCount: c.capabilities.length,
      shippedCount: c.capabilities.filter((x) => x.status === 'shipped').length,
    };
  }

  @Mutation(() => GqlTmSearchResult, { name: 'searchTm' })
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async searchTm(
    @Args('input', { type: () => SearchTmInput }) input: SearchTmInput,
    @Context('req') req: GqlReq,
  ): Promise<GqlTmSearchResult> {
    const auth = req.translateAuth!;
    const mode =
      input.mode === 'lexical' || input.mode === 'vector' || input.mode === 'auto'
        ? input.mode
        : 'auto';
    const result = await this.tm.search({
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      sourceLang: input.sourceLang,
      targetLang: input.targetLang,
      text: input.text,
      projectKey: input.projectKey,
      mode,
      limit: input.limit,
      apiKeyId: auth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
    return {
      provider: result.provider,
      resultCount: result.resultCount,
      results: result.results.map((r) => ({
        id: r.id,
        scope: r.scope,
        sourceText: r.sourceText,
        targetText: r.targetText,
        score: r.score,
        version: r.version,
      })),
      note: result.note,
    };
  }
}
