import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReasoningRuntimeService } from './reasoning-runtime.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/reasoning-runtime')
export class ReasoningRuntimeController {
  constructor(private readonly runtime: ReasoningRuntimeService) {}

  @Get('engine')
  engine() {
    return this.runtime.engine();
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.runtime.analytics({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req() req: AuthedReq) {
    return this.runtime.monitoring({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('history')
  @UseGuards(TranslateAuthGuard)
  history(@Req() req: AuthedReq, @Query('limit') limit?: string) {
    return this.runtime.history({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('history/:id')
  @UseGuards(TranslateAuthGuard)
  replay(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.runtime.replay({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      id,
    });
  }

  @Post('reason')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  reason(
    @Req() req: AuthedReq,
    @Body()
    body: {
      problem?: string;
      strategy?: string;
      language?: string;
      model?: string;
      retrieve?: boolean;
      entityId?: string;
      maxChars?: number;
      persist?: boolean;
    },
  ) {
    return this.runtime.reason({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('plan')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  plan(
    @Req() req: AuthedReq,
    @Body()
    body: {
      problem?: string;
      language?: string;
      model?: string;
      retrieve?: boolean;
      sandboxOnly?: boolean;
    },
  ) {
    return this.runtime.plan({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('reflect')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  reflect(
    @Req() req: AuthedReq,
    @Body() body: { problem?: string; answer?: string; historyId?: string },
  ) {
    return this.runtime.reflect({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('select-tools')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  selectTools(
    @Req() req: AuthedReq,
    @Body() body: { problem?: string; model?: string },
  ) {
    return this.runtime.selectTools({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('select-model')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  selectModel(
    @Req() req: AuthedReq,
    @Body() body: { problem?: string; feature?: string; optimize?: string },
  ) {
    return this.runtime.selectModel({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('decision-tree')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  decisionTree(
    @Req() req: AuthedReq,
    @Body() body: { problem?: string; kind?: string },
  ) {
    return this.runtime.decisionTree({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('evaluate')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  evaluate(
    @Req() req: AuthedReq,
    @Body() body: { problem?: string; answer?: string; historyId?: string },
  ) {
    return this.runtime.evaluate({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('confidence')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  confidence(
    @Req() req: AuthedReq,
    @Body() body: { problem?: string; answer?: string; historyId?: string },
  ) {
    return this.runtime.confidence({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }
}
