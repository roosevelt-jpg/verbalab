import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { DialectsService } from './dialects.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';

@Controller('v1/dialects')
export class DialectsController {
  constructor(private readonly dialects: DialectsService) {}

  @Get
  list(@Query('language') language?: string) {
    return this.dialects.list(language?.trim || undefined);
  }

  @Post('detect')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  detect(
    @Req
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body body: { text?: string; language?: string },
  ) {
    if (typeof body.text !== 'string' || body.text.trim.length === 0) {
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
