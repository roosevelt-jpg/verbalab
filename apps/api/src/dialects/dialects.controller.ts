import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { DialectsService } from './dialects.service';
import { AccentIdentityService } from '../accents/accent-identity.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';

@Controller('v1/dialects')
export class DialectsController {
  constructor(
    private readonly dialects: DialectsService,
    private readonly identity: AccentIdentityService,
  ) {}

  @Get('engine')
  engine() {
    return this.dialects.engine();
  }

  @Get()
  async list(
    @Query('language') language?: string,
    @Query('includeIdentity') includeIdentity?: string,
  ) {
    const base = await this.dialects.list(language?.trim() || undefined);
    if (includeIdentity === 'true' || includeIdentity === '1') {
      const identity = this.identity.list({ language: language?.trim() });
      const withDialect = identity.data.filter((p) => p.dialectCode);
      return { ...base, identityPacks: withDialect, identityCount: withDialect.length };
    }
    return base;
  }

  @Get('identity')
  listIdentity(
    @Query('country') country?: string,
    @Query('dialect') dialect?: string,
    @Query('q') q?: string,
  ) {
    const all = this.identity.list({ country: country?.trim(), q: q?.trim() });
    const dialectCode = dialect?.trim();
    const data = dialectCode
      ? all.data.filter((p) => p.dialectCode === dialectCode)
      : all.data.filter((p) => p.dialectCode);
    return { ...all, data, count: data.length };
  }

  @Post('detect')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  detect(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body() body: { text?: string; language?: string },
  ) {
    if (typeof body.text !== 'string' || body.text.trim().length === 0) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    return this.dialects.detect({
      text: body.text,
      language: body.language,
      organizationId: req.translateAuth.organizationId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Get(':code')
  get(@Param('code') code: string) {
    return this.dialects.get(code);
  }
}
