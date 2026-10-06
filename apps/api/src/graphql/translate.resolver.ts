import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { TranslateService } from '../translate/translate.service';
import { TranslateFormatsService } from '../translate/formats/translate-formats.service';
import {
  GqlTranslateEngine,
  GqlTranslateFormatResult,
  GqlTranslateResult,
  TranslateFormatInput,
  TranslateInput,
} from './gql.types';

type GqlReq = Request & {
  translateAuth?: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Resolver()
export class TranslateGraphqlResolver {
  constructor(
    private readonly translate: TranslateService,
    private readonly formats: TranslateFormatsService,
  ) {}

  @Query(() => GqlTranslateEngine, { name: 'translateEngine' })
  translateEngine(): GqlTranslateEngine {
    const catalog = this.formats.engine();
    return {
      product: catalog.product,
      note: catalog.note,
      capabilityCount: catalog.capabilities.length,
      shippedCount: catalog.capabilities.filter((c) => c.status === 'shipped').length,
    };
  }

  @Mutation(() => GqlTranslateResult, { name: 'translate' })
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async translate(
    @Args('input', { type: () => TranslateInput }) input: TranslateInput,
    @Context('req') req: GqlReq,
  ): Promise<GqlTranslateResult> {
    const auth = req.translateAuth!;
    const result = await this.translate.translate({
      text: input.text,
      source: input.source,
      target: input.target,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
    return {
      text: result.text,
      source: result.source,
      target: result.target,
      provider: result.provider,
      characters: result.characters,
      tmHit: Boolean(result.tmHit),
      glossaryApplied: Number(result.glossaryApplied ?? 0),
    };
  }

  @Mutation(() => GqlTranslateFormatResult, { name: 'translateFormat' })
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  async translateFormat(
    @Args('input', { type: () => TranslateFormatInput }) input: TranslateFormatInput,
    @Context('req') req: GqlReq,
  ): Promise<GqlTranslateFormatResult> {
    const auth = req.translateAuth!;
    const format = this.formats.parseFormat(input.format);
    const result = await this.formats.translateFormat({
      format,
      content: input.content,
      source: input.source,
      target: input.target,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
    return {
      format: result.format,
      content: result.content,
      source: result.source,
      target: result.target,
      segmentCount: result.segmentCount,
      characters: result.characters,
      provider: result.provider,
      note: result.note ?? null,
    };
  }
}
