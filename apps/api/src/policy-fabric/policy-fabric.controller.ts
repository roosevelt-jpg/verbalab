import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PolicyFabricService } from './policy-fabric.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/policy-fabric')
export class PolicyFabricController {
  constructor(private readonly fabric: PolicyFabricService) {}

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

  @Post('evaluate')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  evaluate(
    @Req req: AuthedReq,
    @Body
    body: {
      runtime?: string;
      subjectId?: string;
      action?: string;
      permissions?: string[];
      bus?: string;
    },
  ) {
    return this.fabric.evaluate({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Post('assert')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  assert(
    @Req req: AuthedReq,
    @Body
    body: {
      bus?: string;
      action?: string;
      subjectId?: string;
      permissions?: string[];
    },
  ) {
    return this.fabric.assert({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
      ...body,
    });
  }

  @Get('policies')
  @UseGuards(TranslateAuthGuard)
  policies(@Req req: AuthedReq) {
    return this.fabric.listPolicies({
      organizationId: req.translateAuth.organizationId,
      workspaceId: req.translateAuth.workspaceId,
      apiKeyId: req.translateAuth.apiKeyId,
      userId: req.sessionAuth?.userId,
      ip: clientIp(req),
    });
  }

  @Post('sync')
  @UseGuards(TranslateAuthGuard)
  @HttpCode(HttpStatus.OK)
  sync(@Req req: AuthedReq) {
    return this.fabric.sync({
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
