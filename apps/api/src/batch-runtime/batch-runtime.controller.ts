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
import { BatchRuntimeService } from './batch-runtime.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/batch-runtime')
export class BatchRuntimeController {
  constructor(private readonly batch: BatchRuntimeService) {}

  @Get('engine')
  engine() {
    return this.batch.engine();
  }

  @Get('kinds')
  kinds() {
    return this.batch.kinds();
  }

  @Get('runs')
  @UseGuards(TranslateAuthGuard)
  list(
    @Req() req: AuthedReq,
    @Query('status') status?: string,
    @Query('kind') kind?: string,
  ) {
    return this.batch.listRuns({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      status,
      kind,
    });
  }

  @Get('runs/:id')
  @UseGuards(TranslateAuthGuard)
  get(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.batch.getRun({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      id,
    });
  }

  @Post('runs')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: AuthedReq,
    @Body()
    body: {
      kind?: string;
      priority?: string;
      items?: unknown[];
      source?: string;
      target?: string;
      label?: string;
      maxRetries?: number;
      runAt?: string;
      webhookUrl?: string;
    },
  ) {
    return this.batch.createRun({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      apiKeyId: req.translateAuth.apiKeyId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('runs/:id/start')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  start(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.batch.startScheduled({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      apiKeyId: req.translateAuth.apiKeyId,
      ip: clientIp(req),
      id,
    });
  }

  @Post('runs/:id/checkpoint')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  checkpoint(
    @Req() req: AuthedReq,
    @Param('id') id: string,
    @Body() body: { index?: number },
  ) {
    return this.batch.checkpoint({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
      index: body.index,
    });
  }

  @Post('runs/:id/retry')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  retry(@Req() req: AuthedReq, @Param('id') id: string) {
    return this.batch.retry({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
    });
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req() req: AuthedReq) {
    return this.batch.analytics({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req() req: AuthedReq) {
    return this.batch.monitoring({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }
}
