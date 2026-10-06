import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { LocalizeService } from '../localize/localize.service';
import { LocalizationPlatformService } from '../localize/localization-platform.service';
import {
  FormatIcuInput,
  GqlIcuFormatResult,
  GqlIcuValidateResult,
  GqlLocalizeResult,
  GqlLocalizationPlatform,
  LocalizeInput,
  ValidateIcuInput,
} from './gql.types';

type GqlReq = Request & {
  translateAuth?: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Resolver
export class LocalizationGraphqlResolver {
  constructor(
    private readonly localize: LocalizeService,
    private readonly platform: LocalizationPlatformService,
  ) {}

  @Query( => GqlLocalizationPlatform, { name: 'localizationPlatform' })
  localizationPlatform: GqlLocalizationPlatform {
    const c = this.platform.platform;
    return {
      product: c.product,
      note: c.note,
      capabilityCount: c.capabilities.length,
      shippedCount: c.capabilities.filter((x) => x.status === 'shipped').length,
    };
  }

  @Mutation( => GqlLocalizeResult, { name: 'localize' })
  @UseGuards(TranslateAuthGuard)
  async localize(
    @Args('input', { type:  => LocalizeInput }) input: LocalizeInput,
    @Context('req') req: GqlReq,
  ): Promise<GqlLocalizeResult> {
    const auth = req.translateAuth!;
    const format = input.format === 'yaml' ? 'yaml' : 'json';
    const content =
      typeof input.content === 'string'
        ? this.localize.parseContent(format, input.content)
        : JSON.parse(input.content);
    const result = await this.localize.localize({
      format,
      content,
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
      serialized: result.serialized,
      strings: result.strings,
      translated: result.translated,
      tmHits: result.tmHits,
    };
  }

  @Mutation( => GqlIcuValidateResult, { name: 'validateIcu' })
  validateIcu(
    @Args('input', { type:  => ValidateIcuInput }) input: ValidateIcuInput,
  ): GqlIcuValidateResult {
    const result = this.platform.validateIcu(input.message);
    return {
      valid: result.valid,
      placeholders: result.placeholders,
      hasPlural: result.hasPlural,
      hasSelect: result.hasSelect,
      issueMessages: result.issues.map((i) => i.message),
    };
  }

  @Mutation( => GqlIcuFormatResult, { name: 'formatIcu' })
  formatIcu(@Args('input', { type:  => FormatIcuInput }) input: FormatIcuInput): GqlIcuFormatResult {
    let values: Record<string, string | number> = {};
    if (input.valuesJson) {
      values = JSON.parse(input.valuesJson) as Record<string, string | number>;
    }
    const result = this.platform.formatIcu({
      message: input.message,
      values,
      locale: input.locale,
    });
    return {
      formatted: result.formatted,
      placeholders: result.placeholders,
      locale: result.locale,
    };
  }
}
