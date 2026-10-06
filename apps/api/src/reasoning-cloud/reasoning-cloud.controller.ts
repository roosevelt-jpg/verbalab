import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ReasoningCloudService } from './reasoning-cloud.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/reasoning-cloud')
export class ReasoningCloudController {
  constructor(private readonly reasoningCloud: ReasoningCloudService) {}

  @Get('engine')
  engine {
    return this.reasoningCloud.engine;
  }

  @Get('strategies')
  strategies {
    return this.reasoningCloud.strategies;
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: AuthedReq) {
    return this.reasoningCloud.analytics(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req req: AuthedReq) {
    return this.reasoningCloud.monitoring(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Post('reason')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  reason(
    @Req req: AuthedReq,
    @Body
    body: {
      problem?: string;
      strategy?: string;
      language?: string;
      model?: string;
      retrieve?: boolean;
      entityId?: string;
      maxChars?: number;
    },
  ) {
    return this.reasoningCloud.reason({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      problem: body.problem ?? '',
      strategy: body.strategy,
      language: body.language,
      model: body.model,
      retrieve: body.retrieve,
      entityId: body.entityId,
      maxChars: body.maxChars,
    });
  }
}
