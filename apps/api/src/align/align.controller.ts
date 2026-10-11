import { Body, Controller, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AlignService } from './align.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/align')
export class AlignController {
  constructor(private readonly align: AlignService) {}

  @Post()
  @UseGuards(TranslateAuthGuard)
  async run(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body()
    body: {
      text?: string;
      language?: string;
      durationMs?: number;
      wpm?: number;
    },
  ) {
    if (typeof body.text !== 'string') {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    return this.align.align({
      text: body.text,
      language: body.language,
      durationMs: body.durationMs,
      wpm: body.wpm,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
