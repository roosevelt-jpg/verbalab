import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { LanguageIntelligenceService } from '../language-intelligence/language-intelligence.service';
import {
  AnalyzeLanguageInput,
  GqlLanguageAnalyzeResult,
  GqlLanguageIntelligence,
} from './gql.types';

type GqlReq = Request & {
  translateAuth?: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Resolver
export class LanguageIntelligenceGraphqlResolver {
  constructor(private readonly intel: LanguageIntelligenceService) {}

  @Query( => GqlLanguageIntelligence, { name: 'languageIntelligence' })
  languageIntelligence: GqlLanguageIntelligence {
    const c = this.intel.catalog;
    return {
      product: c.product,
      note: c.note,
      capabilityCount: c.capabilities.length,
      shippedCount: c.capabilities.filter((x) => x.status === 'shipped').length,
    };
  }

  @Mutation( => GqlLanguageAnalyzeResult, { name: 'analyzeLanguage' })
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async analyzeLanguage(
    @Args('input', { type:  => AnalyzeLanguageInput }) input: AnalyzeLanguageInput,
    @Context('req') req: GqlReq,
  ): Promise<GqlLanguageAnalyzeResult> {
    const auth = req.translateAuth!;
    const result = await this.intel.analyze({
      text: input.text,
      language: input.language,
      includeDialect: input.includeDialect,
      includeAccent: input.includeAccent,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
    return {
      language: result.language,
      languageConfidence: result.languageConfidence,
      intentLabel: result.intent.label,
      sentimentLabel: result.sentiment.label,
      emotionLabel: result.emotion.label,
      readabilityScore: result.readability.score,
      complexityScore: result.complexity.score,
      note: result.note,
    };
  }
}
