import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { WorkflowRuntimeService } from './workflow-runtime.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/workflow-runtime')
export class WorkflowRuntimeController {
  constructor(private readonly runtime: WorkflowRuntimeService) {}

  @Get('engine')
  engine {
    return this.runtime.engine;
  }

  @Get('permissions')
  permissions {
    return this.runtime.permissions;
  }

  @Get('workflows')
  @UseGuards(TranslateAuthGuard)
  list(@Req req: AuthedReq) {
    return this.runtime.listWorkflows({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('workflows/:id')
  @UseGuards(TranslateAuthGuard)
  get(@Req req: AuthedReq, @Param('id') id: string) {
    return this.runtime.getWorkflow({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      id,
    });
  }

  @Post('workflows')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req req: AuthedReq,
    @Body
    body: {
      name?: string;
      permissions?: string[];
      mode?: string;
      steps?: Array<{ action: string; input?: Record<string, unknown> }>;
      requiresApproval?: boolean;
    },
  ) {
    return this.runtime.createWorkflow({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('workflows/:id/lifecycle')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  lifecycle(
    @Req req: AuthedReq,
    @Param('id') id: string,
    @Body body: { status?: string },
  ) {
    return this.runtime.lifecycle({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
      status: body.status,
    });
  }

  @Post('workflows/:id/version')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  version(
    @Req req: AuthedReq,
    @Param('id') id: string,
    @Body body: { steps?: Array<{ action: string; input?: Record<string, unknown> }> },
  ) {
    return this.runtime.version({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      id,
      steps: body.steps,
    });
  }

  @Post('run')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  run(
    @Req req: AuthedReq,
    @Body
    body: { workflowId?: string; forceFailAction?: string; approved?: boolean },
  ) {
    return this.runtime.run({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('approve')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  approve(
    @Req req: AuthedReq,
    @Body body: { workflowId?: string; note?: string },
  ) {
    return this.runtime.approve({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('schedule')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  schedule(
    @Req req: AuthedReq,
    @Body body: { workflowId?: string; runAt?: string },
  ) {
    return this.runtime.schedule({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('rollback')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  rollback(@Req req: AuthedReq, @Body body: { runId?: string }) {
    return this.runtime.rollback({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      runId: body.runId,
    });
  }

  @Post('replay')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  replay(@Req req: AuthedReq, @Body body: { runId?: string }) {
    return this.runtime.replay({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      runId: body.runId,
    });
  }

  @Get('analytics')
  @UseGuards(TranslateAuthGuard)
  analytics(@Req req: AuthedReq) {
    return this.runtime.analytics({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('monitoring')
  @UseGuards(TranslateAuthGuard)
  monitoring(@Req req: AuthedReq) {
    return this.runtime.monitoring({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }
}
