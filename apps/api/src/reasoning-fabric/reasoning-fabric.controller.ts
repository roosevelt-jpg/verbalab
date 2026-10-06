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
import { ReasoningFabricService } from './reasoning-fabric.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { TranslateAuthGuard, TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { clientIp } from '../common/http/client-ip';

type AuthedReq = Request & {
  translateAuth: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/reasoning-fabric')
export class ReasoningFabricController {
  constructor(private readonly fabric: ReasoningFabricService) {}

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

  @Get('cache')
  cache {
    return this.fabric.cacheHandoff;
  }

  @Post('federate')
  @HttpCode(HttpStatus.OK)
  federate(@Body body: { kinds?: string[] }) {
    return this.fabric.federate({ kinds: body.kinds });
  }

  @Get('history')
  @UseGuards(TranslateAuthGuard)
  history(@Req req: AuthedReq, @Query('limit') limit?: string) {
    return this.fabric.history(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        apiKeyId: req.translateAuth.apiKeyId,
        userId: req.sessionAuth?.userId,
        ip: clientIp(req),
      },
      limit ? Number(limit) : undefined,
    );
  }

  @Get('replay/:id')
  @UseGuards(TranslateAuthGuard)
  replay(@Req req: AuthedReq, @Param('id') id: string) {
    return this.fabric.replay(
      {
        organizationId: req.translateAuth.organizationId,
        workspaceId: req.translateAuth.workspaceId,
        apiKeyId: req.translateAuth.apiKeyId,
        userId: req.sessionAuth?.userId,
        ip: clientIp(req),
      },
      id,
    );
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
