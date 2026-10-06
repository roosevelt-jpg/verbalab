import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { EmbeddingsService } from './embeddings.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { clientIp } from '../common/http/client-ip';
import { SessionContext } from '../common/guards/clerk-auth.guard';

@Controller('v1')
export class EmbeddingsController {
  constructor(private readonly embeddings: EmbeddingsService) {}

  @Post('embeddings')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  create(
    @Req()
    req: Request & {
      translateAuth: TranslateAuthContext;
      sessionAuth?: SessionContext;
    },
    @Body() body: { input?: unknown; model?: string },
  ) {
    return this.embeddings.create({
      input: body.input,
      model: body.model,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
