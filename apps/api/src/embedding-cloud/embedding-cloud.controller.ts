import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { EmbeddingCloudService } from './embedding-cloud.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/embedding-cloud')
export class EmbeddingCloudController {
  constructor(private readonly embeddingCloud: EmbeddingCloudService) {}

  @Get('engine')
  engine() {
    return this.embeddingCloud.engine();
  }

  @Get('models')
  models() {
    return this.embeddingCloud.models();
  }

  @Get('modalities')
  modalities() {
    return this.embeddingCloud.modalities();
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.embeddingCloud.analytics(req.translateAuth.organizationId);
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req() req: AuthedReq) {
    return this.embeddingCloud.monitoring(req.translateAuth.organizationId);
  }

  @Post('embed')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  embed(
    @Req() req: AuthedReq,
    @Body()
    body: { input?: unknown; model?: string; modality?: string },
  ) {
    return this.embeddingCloud.embed({
      input: body.input,
      model: body.model,
      modality: body.modality,
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }
}
