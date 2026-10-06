import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { Request } from 'express';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  CheckGrammarCommand,
  DetectDialectCommand,
  ListAccentsQuery,
  ListCountryPacksQuery,
  ListDialectsQuery,
  ListLanguageProductsQuery,
  ListLanguagesQuery,
  ListLocalePacksQuery,
  ListStyleProfilesQuery,
  RewriteStyleCommand,
} from '../language-cloud/application/messages';
import {
  CheckGrammarInput,
  DetectDialectInput,
  GqlAccent,
  GqlCountryPack,
  GqlDialect,
  GqlDialectDetectResult,
  GqlGrammarCheckResult,
  GqlLanguage,
  GqlLanguageProduct,
  GqlLocalePack,
  GqlStyleProfile,
  GqlStyleRewriteResult,
  RewriteStyleInput,
} from './gql.types';

type GqlReq = Request & {
  translateAuth?: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Resolver()
export class LanguageCloudGraphqlResolver {
  constructor(
    private readonly commands: CommandBus,
    private readonly queries: QueryBus,
  ) {}

  @Query(() => [GqlLanguage], { name: 'languages' })
  languages(): Promise<GqlLanguage[]> {
    return this.queries.execute(new ListLanguagesQuery());
  }

  @Query(() => [GqlDialect], { name: 'dialects' })
  dialects(
    @Args('language', { type: () => String, nullable: true }) language?: string,
  ): Promise<GqlDialect[]> {
    return this.queries.execute(new ListDialectsQuery(language));
  }

  @Query(() => [GqlAccent], { name: 'accents' })
  accents(
    @Args('language', { type: () => String, nullable: true }) language?: string,
  ): Promise<GqlAccent[]> {
    return this.queries.execute(new ListAccentsQuery(language));
  }

  @Query(() => [GqlLocalePack], { name: 'localePacks' })
  localePacks(): Promise<GqlLocalePack[]> {
    return this.queries.execute(new ListLocalePacksQuery());
  }

  @Query(() => [GqlCountryPack], { name: 'countryPacks' })
  countryPacks(
    @Args('region', { type: () => String, nullable: true }) region?: string,
  ): Promise<GqlCountryPack[]> {
    return this.queries.execute(new ListCountryPacksQuery(region));
  }

  @Query(() => [GqlStyleProfile], { name: 'styleProfiles' })
  styleProfiles(): Promise<GqlStyleProfile[]> {
    return this.queries.execute(new ListStyleProfilesQuery());
  }

  @Query(() => [GqlLanguageProduct], { name: 'languageProducts' })
  languageProducts(): Promise<GqlLanguageProduct[]> {
    return this.queries.execute(new ListLanguageProductsQuery());
  }

  @Mutation(() => GqlDialectDetectResult, { name: 'detectDialect' })
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  detectDialect(
    @Args('input', { type: () => DetectDialectInput }) input: DetectDialectInput,
    @Context('req') req: GqlReq,
  ): Promise<GqlDialectDetectResult> {
    const auth = req.translateAuth!;
    return this.commands.execute(
      new DetectDialectCommand(input.text, input.language, {
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        apiKeyId: auth.apiKeyId,
        userId: req.sessionAuth?.userId,
        ip: clientIp(req),
      }),
    );
  }

  @Mutation(() => GqlGrammarCheckResult, { name: 'checkGrammar' })
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  checkGrammar(
    @Args('input', { type: () => CheckGrammarInput }) input: CheckGrammarInput,
    @Context('req') req: GqlReq,
  ): Promise<GqlGrammarCheckResult> {
    const auth = req.translateAuth!;
    return this.commands.execute(
      new CheckGrammarCommand(input.text, input.language, {
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        apiKeyId: auth.apiKeyId,
        userId: req.sessionAuth?.userId,
        ip: clientIp(req),
      }),
    );
  }

  @Mutation(() => GqlStyleRewriteResult, { name: 'rewriteStyle' })
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  rewriteStyle(
    @Args('input', { type: () => RewriteStyleInput }) input: RewriteStyleInput,
    @Context('req') req: GqlReq,
  ): Promise<GqlStyleRewriteResult> {
    const auth = req.translateAuth!;
    return this.commands.execute(
      new RewriteStyleCommand(input.text, input.profile, input.language, {
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        apiKeyId: auth.apiKeyId,
        userId: req.sessionAuth?.userId,
        ip: clientIp(req),
      }),
    );
  }
}
