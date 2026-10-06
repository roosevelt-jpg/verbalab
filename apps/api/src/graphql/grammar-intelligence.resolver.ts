import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { GrammarService } from '../grammar/grammar.service';
import {
  CheckGrammarInput,
  GqlGrammarIntelligence,
  GqlGrammarSuggestResult,
  SuggestWritingInput,
} from './gql.types';

type GqlReq = Request & {
  translateAuth?: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Resolver
export class GrammarIntelligenceGraphqlResolver {
  constructor(private readonly grammar: GrammarService) {}

  @Query( => GqlGrammarIntelligence, { name: 'grammarIntelligence' })
  grammarIntelligence: GqlGrammarIntelligence {
    const c = this.grammar.intelligence;
    return {
      product: c.product,
      note: c.note,
      capabilityCount: c.capabilities.length,
      shippedCount: c.capabilities.filter((x) => x.status === 'shipped').length,
    };
  }

  @Mutation( => GqlGrammarSuggestResult, { name: 'suggestWriting' })
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async suggestWriting(
    @Args('input', { type:  => SuggestWritingInput }) input: SuggestWritingInput,
    @Context('req') req: GqlReq,
  ): Promise<GqlGrammarSuggestResult> {
    const auth = req.translateAuth!;
    const result = await this.grammar.suggest({
      text: input.text,
      language: input.language,
      styleProfile: input.styleProfile,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
    return {
      language: result.language,
      original: result.original,
      grammarCorrected: result.grammarCorrected,
      styleRewritten: result.styleRewritten,
      styleProfile: result.styleProfile,
      suggestionCount: result.suggestionCount,
      changed: result.changed,
      note: result.note,
    };
  }

  @Mutation( => String, { name: 'correctGrammar' })
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async correctGrammar(
    @Args('input', { type:  => CheckGrammarInput }) input: CheckGrammarInput,
    @Context('req') req: GqlReq,
  ): Promise<string> {
    const auth = req.translateAuth!;
    const result = await this.grammar.correct({
      text: input.text,
      language: input.language,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
    return result.corrected;
  }
}
