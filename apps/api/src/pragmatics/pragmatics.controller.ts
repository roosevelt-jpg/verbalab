import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PragmaticsService, type PragmaticsMode } from './pragmatics.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { ApiException } from '../common/errors/api-exception';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/pragmatics')
export class PragmaticsController {
  constructor(private readonly pragmatics: PragmaticsService) {}

  @Get('engine')
  engine() {
    return this.pragmatics.engine();
  }

  @Post('translate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  translate(
    @Req() req: AuthedReq,
    @Body()
    body: {
      text?: string;
      source?: string;
      target?: string;
      locale?: string;
      mode?: PragmaticsMode;
      register?: string;
      context?: string;
    },
  ) {
    if (typeof body.text !== 'string' || !body.text.trim()) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.target !== 'string' || !body.target.trim()) {
      throw new ApiException('validation_error', 'target is required', HttpStatus.BAD_REQUEST);
    }
    return this.pragmatics.translate({
      text: body.text,
      source: body.source,
      target: body.target,
      locale: body.locale,
      mode: body.mode,
      register: body.register,
      context: body.context,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
