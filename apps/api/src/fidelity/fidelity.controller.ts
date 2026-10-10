import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { FidelityService } from './fidelity.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { ApiException } from '../common/errors/api-exception';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/fidelity')
export class FidelityController {
  constructor(private readonly fidelity: FidelityService) {}

  @Get('engine')
  engine() {
    return this.fidelity.engine();
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  verify(
    @Req() req: AuthedReq,
    @Body()
    body: {
      source?: string;
      target?: string;
      sourceLanguage?: string;
      targetLanguage?: string;
      audioSpanRef?: string;
      domainPolicy?: string;
      glossaryVersion?: string;
    },
  ) {
    if (typeof body.source !== 'string' || !body.source.trim()) {
      throw new ApiException('validation_error', 'source is required', HttpStatus.BAD_REQUEST);
    }
    if (typeof body.target !== 'string' || !body.target.trim()) {
      throw new ApiException('validation_error', 'target is required', HttpStatus.BAD_REQUEST);
    }
    return this.fidelity.verify({
      source: body.source,
      target: body.target,
      sourceLanguage: body.sourceLanguage,
      targetLanguage: body.targetLanguage,
      audioSpanRef: body.audioSpanRef,
      domainPolicy: body.domainPolicy,
      glossaryVersion: body.glossaryVersion,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('clarify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  clarify(
    @Req() req: AuthedReq,
    @Body()
    body: {
      clarifyId?: string;
      answer?: string | null;
      silence?: boolean;
      refused?: boolean;
    },
  ) {
    if (typeof body.clarifyId !== 'string' || !body.clarifyId.trim()) {
      throw new ApiException('validation_error', 'clarifyId is required', HttpStatus.BAD_REQUEST);
    }
    return this.fidelity.clarify({
      clarifyId: body.clarifyId.trim(),
      answer: body.answer,
      silence: body.silence,
      refused: body.refused,
      organizationId: req.translateAuth.organizationId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
