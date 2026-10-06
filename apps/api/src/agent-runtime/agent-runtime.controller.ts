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
import { AgentRuntimeService } from './agent-runtime.service';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/agent-runtime')
export class AgentRuntimeController {
  constructor(private readonly runtime: AgentRuntimeService) {}

  @Get('engine')
  engine {
    return this.runtime.engine;
  }

  @Get('permissions')
  permissions {
    return this.runtime.permissions;
  }

  @Get('agents')
  @UseGuards(TranslateAuthGuard)
  listAgents(@Req req: AuthedReq) {
    return this.runtime.listAgents({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
    });
  }

  @Get('agents/:id')
  @UseGuards(TranslateAuthGuard)
  getAgent(@Req req: AuthedReq, @Param('id') id: string) {
    return this.runtime.getAgent({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      id,
    });
  }

  @Post('agents')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  createAgent(
    @Req req: AuthedReq,
    @Body body: { name?: string; permissions?: string[]; goal?: string },
  ) {
    return this.runtime.createAgent({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('agents/:id/lifecycle')
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

  @Post('run')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  run(
    @Req req: AuthedReq,
    @Body
    body: {
      agentId?: string;
      goal?: string;
      actions?: Array<{ action: string; input?: Record<string, unknown> }>;
    },
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

  @Post('collaborate')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  collaborate(
    @Req req: AuthedReq,
    @Body body: { agentIds?: string[]; topic?: string; message?: string },
  ) {
    return this.runtime.collaborate({
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
    @Body body: { agentId?: string; goal?: string; runAt?: string },
  ) {
    return this.runtime.schedule({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('memory')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  memory(
    @Req req: AuthedReq,
    @Body body: { agentId?: string; content?: string; kind?: string },
  ) {
    return this.runtime.putMemory({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Get('marketplace')
  @UseGuards(TranslateAuthGuard)
  marketplace(@Req req: AuthedReq) {
    return this.runtime.marketplace({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
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
