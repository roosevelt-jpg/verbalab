import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { GroundedService } from './grounded.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { ApiException } from '../common/errors/api-exception';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/grounded')
export class GroundedController {
  constructor(private readonly grounded: GroundedService) {}

  @Get('engine')
  engine() {
    return this.grounded.engine();
  }

  @Post('interpret')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard, RateLimitGuard)
  interpret(
    @Req() req: AuthedReq,
    @Body()
    body: {
      documentRef?: string;
      documentHash?: string;
      documentText?: string;
      region?: { page: number; x: number; y: number; width: number; height: number };
      utterance?: string;
      audioRef?: string;
      sourceLanguage?: string;
      targetLanguage?: string;
      mode?: 'interpret' | 'grounded_answer';
    },
  ) {
    if (!body.documentRef?.trim()) {
      throw new ApiException('validation_error', 'documentRef is required', HttpStatus.BAD_REQUEST);
    }
    if (!body.region) {
      throw new ApiException('validation_error', 'region is required', HttpStatus.BAD_REQUEST);
    }
    if (!body.targetLanguage?.trim()) {
      throw new ApiException('validation_error', 'targetLanguage is required', HttpStatus.BAD_REQUEST);
    }
    return this.grounded.interpret({
      documentRef: body.documentRef,
      documentHash: body.documentHash,
      documentText: body.documentText,
      region: body.region,
      utterance: body.utterance,
      audioRef: body.audioRef,
      sourceLanguage: body.sourceLanguage,
      targetLanguage: body.targetLanguage,
      mode: body.mode,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
