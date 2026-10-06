import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AiOrchestrationService } from './ai-orchestration.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/ai-orchestration')
export class AiOrchestrationController {
  constructor(private readonly orchestration: AiOrchestrationService) {}

  @Get('engine')
  engine() {
    return this.orchestration.engine();
  }

  @Get('pipelines')
  pipelines() {
    return this.orchestration.pipelines();
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.orchestration.analytics(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req() req: AuthedReq) {
    return this.orchestration.monitoring(
      req.translateAuth.organizationId,
      req.translateAuth.workspaceId,
    );
  }

  @Post('run')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  run(
    @Req() req: AuthedReq,
    @Body()
    body: {
      pipeline?: string;
      text?: string;
      source?: string;
      target?: string;
      ops?: unknown;
      model?: string;
    },
  ) {
    return this.orchestration.run({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      pipeline: body.pipeline,
      text: body.text,
      source: body.source,
      target: body.target,
      ops: body.ops,
      model: body.model,
    });
  }
}
