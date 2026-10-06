import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AgentFabricService } from './agent-fabric.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/agent-fabric')
export class AgentFabricController {
  constructor(private readonly fabric: AgentFabricService) {}

  @Get('products')
  products {
    return this.fabric.products;
  }

  @Get('engine')
  engine {
    return this.fabric.products;
  }

  @Get('routes')
  routes {
    return this.fabric.routes;
  }

  @Post('route')
  @HttpCode(HttpStatus.OK)
  route(@Body body: { kinds?: string[] }) {
    return this.fabric.route({ kinds: body.kinds });
  }

  @Post('pipeline')
  @HttpCode(HttpStatus.OK)
  pipeline(@Body body: { pipelineId?: string; steps?: string[] }) {
    return this.fabric.pipeline(body);
  }

  @Get('versions')
  versions {
    return this.fabric.versions;
  }

  @Post('federate')
  @HttpCode(HttpStatus.OK)
  federate(@Body body: { kinds?: string[] }) {
    return this.fabric.federate({ kinds: body.kinds });
  }

  @Get('discover')
  @UseGuards(TranslateAuthGuard)
  discover(@Req req: AuthedReq) {
    return this.fabric.discover({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('collaborate')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  collaborate(
    @Req req: AuthedReq,
    @Body body: { agentIds?: string[]; topic?: string; message?: string },
  ) {
    return this.fabric.collaborate({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
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
    return this.fabric.schedule({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Get('marketplace')
  @UseGuards(TranslateAuthGuard)
  marketplace(@Req req: AuthedReq) {
    return this.fabric.marketplace({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('distribute')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  distribute(
    @Req req: AuthedReq,
    @Body
    body: {
      kinds?: string[];
      targetWorkspaceIds?: string[];
      publishEvent?: boolean;
      topic?: string;
    },
  ) {
    return this.fabric.distribute({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      userId: req.sessionAuth?.userId,
      apiKeyId: req.translateAuth.apiKeyId,
      kinds: body.kinds,
      targetWorkspaceIds: body.targetWorkspaceIds,
      publishEvent: body.publishEvent,
      topic: body.topic,
    });
  }

  @Get('stream')
  stream(@Res res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.;

    const write =  => {
      const payload = JSON.stringify(this.fabric.streamSnapshot);
      res.write(`event: agent-fabric\ndata: ${payload}\n\n`);
    };
    write;
    const timer = setInterval(write, 500);
    const done =  => {
      clearInterval(timer);
      res.end;
    };
    res.on('close', done);
    setTimeout(done, 1100);
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession session: SessionContext) {
    return this.fabric.overview(session);
  }

  @Get('monitoring')
  monitoring {
    return this.fabric.monitoring;
  }
}
